const { ROSCO_ROLES } = require('../constants/rosco');

class RoomManager {
    constructor() {
        // user -> ws
        this.sessions = new Map();
        // roomId -> { host, players: Set<username>, maxPlayers, status, gameConfig: { pointsToWin, currentGame, scores: {} } }
        this.rooms = new Map();
        this.getCollections = null;
        this.availableGames = [
            'RadarScan',
            'RadioSignal',
            'RhymeSquad',
            'SpelledRosco',
            'SymmetryBreaker',
            'WordConstruction'
        ];
        this.roundTimers = new Map();
        this.roundGameScores = new Map();
        this.roundFinishedPlayers = new Map(); // roomId -> Set de jugadors que han acabat
        this.playedGames = new Map();          // roomId -> Set de jocs ja jugats
        this.returnedToLobbyPlayers = new Map(); // roomId -> Set de jugadors que han tornat al lobby
        this.userToRoom = new Map();           // user -> roomId (AÑADIDO)
    }

    init(getCollections, wss) {
        this.getCollections = getCollections;
        this.wss = wss;
        console.log("RoomManager inicializado con acceso a DB y WSS");

        // (AÑADIDO) Garbage Collector: Limpieza de salas inactivas cada 30 minutos
        setInterval(async () => {
            console.log("[RoomManager] Ejecutando Garbage Collector de salas...");
            const now = Date.now();
            const inactivityLimit = 2 * 60 * 60 * 1000; // 2 horas

            for (const [roomId, room] of this.rooms.entries()) {
                if (now - room.lastActivity > inactivityLimit) {
                    console.log(`[RoomManager] GC: Eliminando sala ${roomId} por inactividad prolongada.`);
                    
                    // Notificar a los jugadores si quedan algunos
                    this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'timeout' });
                    
                    // Forzar salida de todos los jugadores registrados en esta sala
                    room.players.forEach(user => {
                        if (this.userToRoom.get(user) === roomId) {
                            this.userToRoom.delete(user);
                        }
                    });

                    // Limpieza completa
                    this.rooms.delete(roomId);
                    this.roundGameScores.delete(roomId);
                    this.roundFinishedPlayers.delete(roomId);
                    this.playedGames.delete(roomId);
                    this.returnedToLobbyPlayers.delete(roomId);

                    if (this.getCollections) {
                        try {
                            const { rooms } = this.getCollections();
                            await rooms.deleteOne({ id: roomId });
                        } catch (e) {
                            console.error(`[RoomManager] GC: Error eliminando sala ${roomId} de DB:`, e);
                        }
                    }
                }
            }
            await this.syncGlobalRooms();
        }, 30 * 60 * 1000); // 30 minutos
    }

    addSession(user, ws) {
        this.sessions.set(user, ws);
        console.log(`Sesión registrada para: ${user}`);
    }

    removeSession(user) {
        this.sessions.delete(user);
        // (MEJORADO) Limpieza agresiva: si sabemos en qué sala está, forzar salida inmediata
        if (this.userToRoom.has(user)) {
            const roomId = this.userToRoom.get(user);
            console.log(`[RoomManager] Desconexión detectada. Expulsando a ${user} de la sala ${roomId}.`);
            this.leaveRoom(roomId, user);
        } else {
            // Fallback por si acaso: buscar en todas las salas (menos eficiente)
            for (const [roomId, room] of this.rooms.entries()) {
                if (room.players.has(user)) {
                    this.leaveRoom(roomId, user);
                }
            }
        }
        console.log(`Sesión eliminada para: ${user}`);
    }

    sendToUser(user, message) {
        const ws = this.sessions.get(user);
        if (ws && ws.readyState === 1) { // 1 = OPEN
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    broadcastToRoom(roomId, message) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.players.forEach(player => {
            this.sendToUser(player, message);
        });
    }

    broadcastToTeam(roomId, teamId, message) {
        const room = this.rooms.get(roomId);
        if (!room || !teamId) return;

        room.players.forEach(player => {
            if (room.gameConfig.teams && room.gameConfig.teams[player] === teamId) {
                this.sendToUser(player, message);
            }
        });
    }

    // Enviar a absolutamente todos los conectados al servidor
    broadcastGlobal(message) {
        if (!this.wss) {
            console.warn("No hay servidor WSS para broadcast global. Usando sesiones locales.");
            this.sessions.forEach((ws) => {
                if (ws.readyState === 1) ws.send(JSON.stringify(message));
            });
            return;
        }

        let sentCount = 0;
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 = OPEN
                client.send(JSON.stringify(message));
                sentCount++;
            }
        });
        console.log(`Difusión global completa: ${message.type} enviada a ${sentCount} clientes`);
    }

    async syncGlobalRooms() {
        if (!this.getCollections) return;
        try {
            const { rooms } = this.getCollections();
            const availableRooms = await rooms.find({ status: 'LOBBY', isPublic: true }).toArray();
            this.broadcastGlobal({
                type: 'GLOBAL_ROOMS_UPDATE',
                rooms: availableRooms
            });
        } catch (error) {
            console.error("Error sincronizando salas globales:", error);
        }
    }

    createLobbyTimeout(roomId) {
        return setTimeout(async () => {
            const room = this.rooms.get(roomId);
            if (room && room.status === 'LOBBY') {
                console.log(`[Room ${roomId}] Auto-cleanup: sala eliminada per inactividad (>15 min al lobby).`);
                this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'inactive' });

                this.rooms.delete(roomId);
                this.roundGameScores.delete(roomId);
                this.roundFinishedPlayers.delete(roomId);
                this.playedGames.delete(roomId);
                this.returnedToLobbyPlayers.delete(roomId);

                if (this.getCollections) {
                    try {
                        const { rooms } = this.getCollections();
                        await rooms.deleteOne({ id: roomId });
                        await this.syncGlobalRooms();
                    } catch (e) {
                        console.error("Error auto-cleanup inactividad sala a DB:", e);
                    }
                }
            }
        }, 15 * 60 * 1000); // 15 minutos en milisegundos
    }

    async createRoom(host, isPublic = true, maxPlayers = 4, initialConfig = {}) {
        // (MEJORADO) Política de "Un usuario, una sala": limpiar memoria y DB preventivamente
        if (this.userToRoom.has(host)) {
            const oldRoomId = this.userToRoom.get(host);
            console.log(`[RoomManager] Usuario ${host} ya está en la sala ${oldRoomId} (memoria). Forzando salida.`);
            await this.leaveRoom(oldRoomId, host);
        }

        // Limpieza extra en DB por si acaso (salas huérfanas de reinicios previos)
        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                // Eliminar cualquier sala donde este usuario sea el host y esté en LOBBY
                const result = await rooms.deleteMany({ host: host, status: 'LOBBY' });
                if (result.deletedCount > 0) {
                    console.log(`[RoomManager] Limpieza DB: eliminadas ${result.deletedCount} salas zombie del host ${host}.`);
                }
            } catch (e) {
                console.error("[RoomManager] Error en limpieza preventiva de DB:", e);
            }
        }

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const roomData = {
            id: roomId,
            host,
            players: [host],
            maxPlayers,
            status: 'LOBBY',
            isPublic,
            createdAt: new Date(),
            gameConfig: {
                pointsToWin: initialConfig.pointsToWin || 3,
                totalRounds: initialConfig.pointsToWin || 3,
                currentRound: 0,
                scores: { [host]: 0 },
                currentGame: null
            }
        };

        this.rooms.set(roomId, {
            host,
            players: new Set([host]),
            maxPlayers,
            status: 'LOBBY',
            isPublic,
            gameConfig: roomData.gameConfig,
            idleTimer: this.createLobbyTimeout(roomId),
            lastActivity: Date.now() // (AÑADIDO)
        });

        this.userToRoom.set(host, roomId); // (AÑADIDO) Seguimiento del usuario

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                roomData.lastActivity = Date.now(); // (AÑADIDO)
                await rooms.insertOne(roomData);
                console.log(`Sala ${roomId} persistida en DB (Public: ${isPublic})`);
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("Error persistiendo sala:", error);
            }
        }

        return roomId;
    }

    // Actualiza el timestamp de actividad de la sala (AÑADIDO)
    updateRoomActivity(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.lastActivity = Date.now();
        }
    }

    async joinRoom(roomId, user) {
        // (AÑADIDO) Política de "Un usuario, una sala": si ya está en otra sala, forzar salida
        if (this.userToRoom.has(user) && this.userToRoom.get(user) !== roomId) {
            const oldRoomId = this.userToRoom.get(user);
            console.log(`[RoomManager] Usuario ${user} ya está en la sala ${oldRoomId}. Forzando salida para unirse a ${roomId}.`);
            await this.leaveRoom(oldRoomId, user);
        }

        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Sala no encontrada' };

        // Comprobar si la sala está llena o si el usuario ya está
        if (room.players.size >= room.maxPlayers && !room.players.has(user)) {
            return { error: 'La nave ya ha alcanzado su capacidad máxima' };
        }

        room.players.add(user);
        this.userToRoom.set(user, roomId);
        this.updateRoomActivity(roomId);

        if (room.gameConfig && room.gameConfig.scores) {
            room.gameConfig.scores[user] = 0;
        }

        // Resetear el timer de inactividad si alguien nuevo entra al lobby
        if (room.status === 'LOBBY') {
            if (room.idleTimer) clearTimeout(room.idleTimer);
            room.idleTimer = this.createLobbyTimeout(roomId);
        }

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                await rooms.updateOne({ id: roomId }, { $addToSet: { players: user } });
                await this.syncGlobalRooms(); // (ASEGURAR) Broadcast para actualizar slots
            } catch (error) {
                console.error("Error actualizando sala en DB:", error);
            }
        }

        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: this.getRoom(roomId)
        });
        return { success: true, room };
    }

    async leaveRoom(roomId, user) {
        const room = this.rooms.get(roomId);
        
        // (AÑADIDO) Limpiar el seguimiento del usuario
        if (this.userToRoom.get(user) === roomId) {
            this.userToRoom.delete(user);
        }

        if (!room) return;

        room.players.delete(user);
        this.updateRoomActivity(roomId); // (AÑADIDO)

        if (room.players.size === 0) {
            console.log(`Sala ${roomId} vacía. Eliminando de memoria y DB...`);
            if (room.idleTimer) clearTimeout(room.idleTimer);
            
            // Limpieza completa de referencias
            this.rooms.delete(roomId);
            this.roundGameScores.delete(roomId);
            this.roundFinishedPlayers.delete(roomId);
            this.playedGames.delete(roomId);
            this.returnedToLobbyPlayers.delete(roomId);

            if (this.getCollections) {
                try {
                    const { rooms } = this.getCollections();
                    await rooms.deleteOne({ id: roomId });
                    console.log(`Sala ${roomId} eliminada de DB`);
                    await this.syncGlobalRooms();
                } catch (error) {
                    console.error("Error eliminando sala de DB:", error);
                }
            }
        } else {
            // Si el host se va, el siguiente jugador es el nuevo host
            if (room.host === user) {
                const newHost = Array.from(room.players)[0];
                room.host = newHost;
                console.log(`Host migrado en sala ${roomId}: ${user} -> ${newHost}`);
            }

            // Resetear el timer de inactividad al haber movimiento de jugadores
            if (room.status === 'LOBBY') {
                if (room.idleTimer) clearTimeout(room.idleTimer);
                room.idleTimer = this.createLobbyTimeout(roomId);
            }

            if (this.getCollections) {
                try {
                    const { rooms } = this.getCollections();
                    await rooms.updateOne(
                        { id: roomId },
                        {
                            $pull: { players: user },
                            $set: { host: room.host }
                        }
                    );
                    await this.syncGlobalRooms();
                } catch (error) {
                    console.error("Error actualizando sala en DB al salir:", error);
                }
            }

            // Notificar a los que quedan en la sala del cambio
            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: {
                    id: roomId,
                    host: room.host,
                    players: Array.from(room.players),
                    maxPlayers: room.maxPlayers,
                    status: room.status
                }
            });
        }
    }

    getRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        return {
            id: roomId,
            host: room.host,
            players: Array.from(room.players),
            maxPlayers: room.maxPlayers,
            status: room.status,
            gameConfig: room.gameConfig
        };
    }

    async updateGameConfig(roomId, config) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.gameConfig = { ...room.gameConfig, ...config };

        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: this.getRoom(roomId)
        });
    }

    async startMatch(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.players.size < 2) return { error: 'Se necesitan al menos 2 jugadores' };

        this.updateRoomActivity(roomId); // (AÑADIDO)
        room.status = 'ROULETTE';

        // Detener el timer de inactividad al empezar a jugar
        if (room.idleTimer) {
            clearTimeout(room.idleTimer);
            room.idleTimer = null;
        }

        // Reset scores i estat
        room.gameConfig.scores = {};
        room.gameConfig.teams = {}; // Equipos (red/blue)
        room.gameConfig.subRoles = {}; // AÑADIDO: Roles específicos (listener/writer)
        room.gameConfig.currentRound = 0;
        room.gameConfig.totalRounds = room.gameConfig.pointsToWin || 3;
        room.gameConfig.roundHistory = []; // Historial de rondas
        
        // Reset jocs jugats
        this.playedGames.set(roomId, new Set());

        // Seleccionar primer joc (sense repeticions)
        const firstGame = this.pickNextGame(roomId);
        room.gameConfig.currentGame = firstGame;

        const playerArray = Array.from(room.players);
        const isPairGame = ['RadioSignal', 'SpelledRosco', 'RhymeSquad', 'RadarScan'].includes(firstGame);
        const half = Math.ceil(playerArray.length / 2);

        playerArray.forEach((p, index) => {
            room.gameConfig.scores[p] = 0;
            
            if (isPairGame) {
                // Dividir estrictamente en parejas de 2 (ej: team-1, team-2, team-3...)
                const pairIndex = Math.floor(index / 2);
                room.gameConfig.teams[p] = `team-${pairIndex + 1}`;

                if (firstGame === 'SpelledRosco') {
                    room.gameConfig.subRoles[p] = (index % 2 === 0) ? ROSCO_ROLES.SENDER : ROSCO_ROLES.GUESSER;
                } else {
                    // Para RadioSignal, RhymeSquad, RadarScan, usamos los roles tradicionales
                    room.gameConfig.subRoles[p] = (index % 2 === 0) ? 'listener' : 'writer';
                }
            } else {
                // Lógica original: dividir toda la sala en dos grandes equipos mitad y mitad
                room.gameConfig.teams[p] = (index < half) ? 'red' : 'blue';
                room.gameConfig.subRoles[p] = null;
            }
        });

        this.broadcastToRoom(roomId, {
            type: 'MATCH_STARTING',
            room: this.getRoom(roomId)
        });

        return { success: true };
    }

    // Escull el proper joc sense repeticions
    pickNextGame(roomId) {
        const played = this.playedGames.get(roomId) || new Set();
        const remaining = this.availableGames.filter(g => !played.has(g));
        // Si ja hem jugat tots, reset i tornem a escollir (per si hi ha més rondes que jocs)
        const pool = remaining.length > 0 ? remaining : this.availableGames;
        const game = pool[Math.floor(Math.random() * pool.length)];
        played.add(game);
        this.playedGames.set(roomId, played);
        return game;
    }

    async setRoomStatus(roomId, status) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        this.updateRoomActivity(roomId);
        room.status = status;

        if (status === 'PLAYING') {
            try {
                const currentGame = room.gameConfig.currentGame;
                const playerArray = Array.from(room.players);
                const isPairGame = ['RadioSignal', 'SpelledRosco', 'RhymeSquad', 'RadarScan'].includes(currentGame);
                const half = Math.ceil(playerArray.length / 2);

                // Generar datos iniciales sincronizados para el juego
                if (currentGame === 'SpelledRosco') {
                    const { ROSCO_WORDS } = require('../constants/rosco');
                    room.gameConfig.roscoData = {};
                    const teams = Array.from(new Set(Object.values(room.gameConfig.teams || {})));
                    const generateRosco = () => [...ROSCO_WORDS].sort(() => Math.random() - 0.5).slice(0, 5);

                    if (teams.length > 0) teams.forEach(tId => { room.gameConfig.roscoData[tId] = generateRosco(); });
                    else room.gameConfig.roscoData['default'] = generateRosco();
                }

                if (currentGame === 'RadioSignal') {
                    room.gameConfig.radioData = {};
                    const teams = Array.from(new Set(Object.values(room.gameConfig.teams || {})));
                    const phrases = [
                        'EL VAIXELL DAURAT BRILLA DE DIA', 'EL PETIT PAQUET VA QUEDAR AL PARC',
                        'ELS DRACS BOTEN SOBRE LES PEDRES', 'TRES TRISTOS TIGRES MENGEN BLAT'
                    ];
                    const generateRadio = () => ({
                        frequency: Math.random() * 90 + 5,
                        phrase: phrases[Math.floor(Math.random() * phrases.length)]
                    });

                    if (teams.length > 0) teams.forEach(tId => { room.gameConfig.radioData[tId] = generateRadio(); });
                    else room.gameConfig.radioData['default'] = generateRadio();
                }

                playerArray.forEach((p, index) => {
                    if (isPairGame) {
                        const pairIndex = Math.floor(index / 2);
                        room.gameConfig.teams[p] = `team-${pairIndex + 1}`;
                        if (currentGame === 'SpelledRosco') {
                            room.gameConfig.subRoles[p] = (index % 2 === 0) ? ROSCO_ROLES.SENDER : ROSCO_ROLES.GUESSER;
                        } else {
                            room.gameConfig.subRoles[p] = (index % 2 === 0) ? 'listener' : 'writer';
                        }
                    } else {
                        room.gameConfig.teams[p] = (index < half) ? 'red' : 'blue';
                        room.gameConfig.subRoles[p] = null;
                    }
                });

                this.roundGameScores.set(roomId, {});
                this.roundFinishedPlayers.set(roomId, new Set());
                this.startRoundTimer(roomId);
            } catch (error) {
                console.error(`[Room ${roomId}] ERROR CRÍTICO AL INICIAR PARTIDA:`, error);
                console.error("Stack trace:", error.stack);
                
                // Intentar notificar a los usuarios del error antes de volver al lobby
                this.broadcastToRoom(roomId, { 
                    type: 'ERROR', 
                    message: 'Hubo un problema al iniciar el minijuego. Volviendo al centro de mando.' 
                });
                
                room.status = 'LOBBY'; 
            }
        }

        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: this.getRoom(roomId)
        });
    }

    startRoundTimer(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Cancelar timer previo si existe
        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
        }

        const duration = 60 * 1000; // 60 segundos por defecto
        const timer = setTimeout(() => {
            console.log(`[Room ${roomId}] Tiempo agotado para la ronda.`);
            this.finishRound(roomId);
        }, duration);

        this.roundTimers.set(roomId, timer);
    }

    async handlePlayerFinished(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        let finished = this.roundFinishedPlayers.get(roomId);
        if (!finished) {
            finished = new Set();
            this.roundFinishedPlayers.set(roomId, finished);
        }

        finished.add(user);
        console.log(`[Room ${roomId}] Jugador ${user} ha terminado la ronda. (${finished.size}/${room.players.size})`);

        if (finished.size >= room.players.size) {
            this.finishRound(roomId);
        }
    }

    async finishRound(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;

        // Cancelar timer si todavía está activo
        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
            this.roundTimers.delete(roomId);
        }

        console.log(`[Room ${roomId}] Finalizando ronda ${room.gameConfig.currentRound + 1}`);

        // Determinar ganador de la ronda basado en scores acumulados en this.roundGameScores
        const roundScores = this.roundGameScores.get(roomId) || {};
        let winner = null;
        let maxScore = -1;
        let tie = false;

        Object.entries(roundScores).forEach(([u, s]) => {
            if (s > maxScore) {
                maxScore = s;
                winner = u;
                tie = false;
            } else if (s === maxScore && maxScore > 0) {
                tie = true;
            }
        });

        if (winner && !tie) {
            room.gameConfig.scores[winner] = (room.gameConfig.scores[winner] || 0) + 1;
            console.log(`[Room ${roomId}] Ganador de ronda: ${winner}`);
        } else {
            console.log(`[Room ${roomId}] Ronda terminada en empate o sin puntos.`);
        }

        room.status = 'ROUND_RESULTS';
        
        this.broadcastToRoom(roomId, {
            type: 'ROUND_ENDED_BY_WINNER',
            winner: tie ? null : winner,
            tie,
            room: this.getRoom(roomId)
        });

        // Esperar unos segundos en la pantalla de resultados antes de pasar a la siguiente ronda o finalizar
        setTimeout(async () => {
            const currentRoom = this.rooms.get(roomId);
            if (!currentRoom) return;

            currentRoom.gameConfig.currentRound++;

            // Comprobar si alguien ha llegado a la puntuación necesaria
            const winnerOfMatch = Object.entries(currentRoom.gameConfig.scores).find(([u, s]) => s >= currentRoom.gameConfig.pointsToWin);

            if (winnerOfMatch || currentRoom.gameConfig.currentRound >= currentRoom.gameConfig.totalRounds) {
                currentRoom.status = 'GAME_OVER';
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_FINISHED',
                    winner: winnerOfMatch ? winnerOfMatch[0] : null,
                    room: this.getRoom(roomId)
                });
            } else {
                // Siguiente ronda: Volver a la ruleta
                currentRoom.status = 'ROULETTE';
                const nextGame = this.pickNextGame(roomId);
                currentRoom.gameConfig.currentGame = nextGame;
                
                this.broadcastToRoom(roomId, {
                    type: 'ROOM_UPDATE',
                    room: this.getRoom(roomId)
                });
            }
        }, 5000);
    }

    handleGameAction(roomId, user, action) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        this.updateRoomActivity(roomId);

        // Retransmitir acciones de equipo (MOVIMIENTO, ONDA, ESCRITURA, EMOJIS, AVANCE)
        const teamSpecificActions = [
            'MOUSE_MOVE', 
            'FREQ_SYNC', 
            'TYPING_SYNC', 
            'PARTNER_TYPING', 
            'EMOJI_CHAT', 
            'PARTNER_EMOJI',
            'ADVANCE_LETTER'
        ];

        if (teamSpecificActions.includes(action.type)) {
            const teamId = room.gameConfig.teams ? room.gameConfig.teams[user] : null;
            if (teamId) {
                let outgoingAction = { ...action };
                if (action.type === 'TYPING_SYNC') outgoingAction.type = 'PARTNER_TYPING';
                if (action.type === 'EMOJI_CHAT') outgoingAction.type = 'PARTNER_EMOJI';

                this.broadcastToTeam(roomId, teamId, {
                    type: 'GAME_ACTION',
                    from: user,
                    action: outgoingAction
                });
                return;
            }
        }

        // Si es una actualización de puntuación, guardarla localmente
        if (action.type === 'SCORE_UPDATE') {
            const currentGame = room.gameConfig.currentGame;
            if (currentGame === 'SpelledRosco') {
                const role = room.gameConfig.subRoles[user];
                if (role !== ROSCO_ROLES.GUESSER) {
                    console.warn(`[Room ${roomId}] Jugador ${user} intentó puntuar sin ser GUESSER.`);
                    return; // Ignorar si no es el adivinador
                }
            }

            const scores = this.roundGameScores.get(roomId) || {};
            scores[user] = action.score;
            this.roundGameScores.set(roomId, scores);

            // Broadcast inmediato para que el HUD vea los puntos en vivo
            this.broadcastToRoom(roomId, {
                type: 'SCORE_UPDATE_LIVE',
                user,
                score: action.score
            });
        }

        // AÑADIDO: Progreso cooperativo de SpelledRosco
        if (action.type === 'ROSCO_PROGRESS_UPDATE') {
            const teamId = room.gameConfig.teams ? room.gameConfig.teams[user] : null;
            if (teamId) {
                if (!room.gameConfig.roscoProgress) room.gameConfig.roscoProgress = {};
                if (!room.gameConfig.roscoProgress[teamId]) {
                    room.gameConfig.roscoProgress[teamId] = { letterIndex: 0, errors: 0, swapped: false };
                }

                const progress = room.gameConfig.roscoProgress[teamId];
                
                // Solo disparamos el swap si avanzamos de la mitad o hay muchos errores
                // (Para el test/demo usaremos 3 letras como mitad de 5)
                const shouldSwap = (action.letterIndex >= 3 || action.errors >= 3) && !progress.swapped;
                
                progress.letterIndex = action.letterIndex;
                progress.errors = action.errors;

                if (shouldSwap) {
                    progress.swapped = true;
                    this.swapTeamRoles(roomId, teamId);
                }
            }
        }

        this.broadcastToRoom(roomId, {
            type: 'GAME_ACTION',
            from: user,
            action
        });
    }

    swapTeamRoles(roomId, teamId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        console.log(`[Room ${roomId}] Intercambiando roles para el equipo ${teamId}`);

        room.players.forEach(p => {
            if (room.gameConfig.teams[p] === teamId) {
                const oldRole = room.gameConfig.subRoles[p];
                // Compatibilidad con múltiples modos cooperativos
                if (oldRole === ROSCO_ROLES.TRANSLATOR) room.gameConfig.subRoles[p] = ROSCO_ROLES.GUESSER;
                else if (oldRole === ROSCO_ROLES.GUESSER) {
                   // Si estamos en modo emoji chat, el guesser pasa a sender (o translator)
                   const currentGame = room.gameConfig.currentGame;
                   if (currentGame === 'SpelledRosco') room.gameConfig.subRoles[p] = ROSCO_ROLES.SENDER;
                   else room.gameConfig.subRoles[p] = ROSCO_ROLES.TRANSLATOR;
                }
                else if (oldRole === ROSCO_ROLES.SENDER) room.gameConfig.subRoles[p] = ROSCO_ROLES.GUESSER;
                else if (oldRole === 'listener') room.gameConfig.subRoles[p] = 'writer';
                else if (oldRole === 'writer') room.gameConfig.subRoles[p] = 'listener';
            }
        });

        this.broadcastToTeam(roomId, teamId, {
            type: 'GAME_ROLES_SWAPPED',
            subRoles: room.gameConfig.subRoles
        });
    }

    async handlePlayerReturnToLobby(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        this.updateRoomActivity(roomId); // (AÑADIDO)
        let returned = this.returnedToLobbyPlayers.get(roomId);
        if (!returned) {
            returned = new Set();
            this.returnedToLobbyPlayers.set(roomId, returned);
        }

        returned.add(user);
        console.log(`[Room ${roomId}] Jugador ${user} vol tornar al lobby. (${returned.size}/${room.players.size})`);

        // Notificar a tots qui ha tornat
        this.broadcastToRoom(roomId, {
            type: 'PLAYER_RETURNED',
            user,
            returnedCount: returned.size,
            totalPlayers: room.players.size
        });

        // Si tots han decidit tornar al lobby
        if (returned.size >= room.players.size) {
            console.log(`[Room ${roomId}] Tots els jugadors han tornat. Reset room to LOBBY.`);
            room.status = 'LOBBY';
            this.returnedToLobbyPlayers.delete(roomId);
            this.roundFinishedPlayers.delete(roomId);
            this.roundGameScores.delete(roomId);

            // Volver a iniciar el timer de inactividad
            if (room.idleTimer) clearTimeout(room.idleTimer);
            room.idleTimer = this.createLobbyTimeout(roomId);

            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: this.getRoom(roomId)
            });
        }
    }
}

module.exports = new RoomManager();
