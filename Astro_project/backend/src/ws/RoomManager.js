const { ROSCO_ROLES } = require('../constants/rosco');

class RoomManager {
    constructor() {
        // user -> ws
        this.sessions = new Map();
        // roomId -> { host, players: Set<username>, maxPlayers, status, gameConfig: { pointsToWin, currentGame, scores: {} } }
        this.rooms = new Map();
        this.roomRepo = null;
        this.userRepo = null;
        this.wss = null;
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
        this.userToRoom = new Map();           // user -> roomId

        // Duracions per defecte de cada minijoc
        this.gameDurations = {
            'RadarScan': 600000,
            'RadioSignal': 600000,
            'RhymeSquad': 600000,
            'SpelledRosco': 600000,
            'SymmetryBreaker': 600000,
            'WordConstruction': 600000
        };
    }

    init(roomRepository, userRepository, wss) {
        this.roomRepo = roomRepository;
        this.userRepo = userRepository;
        this.wss = wss;
        console.log("🛠️ RoomManager inicializado con Repositorios y WSS");

        // Garbage Collector: Limpieza de salas inactivas cada 5 minutos
        setInterval(async () => {
            console.log("[RoomManager] Ejecutando Garbage Collector de salas...");
            const now = Date.now();
            const LOBBY_TIMEOUT = 10 * 60 * 1000; // 10 minutos desde creación
            const INACTIVE_TIMEOUT = 10 * 60 * 1000; // 10 minutos sin actividad total

            for (const [roomId, room] of this.rooms.entries()) {
                const createdAt = room.createdAt ? (typeof room.createdAt.getTime === 'function' ? room.createdAt.getTime() : new Date(room.createdAt).getTime()) : null;
                const age = createdAt ? (now - createdAt) : (now - room.lastActivity);
                const idleTime = now - room.lastActivity;

                let shouldDelete = false;
                let reason = '';

                // Si no tiene createdAt, es una sala vieja que debemos limpiar
                if (room.status === 'LOBBY' && (!createdAt || age > LOBBY_TIMEOUT)) {
                    shouldDelete = true;
                    reason = !createdAt ? 'sala sin fecha de creación (antigua)' : 'tiempo de espera en lobby agotado (15 min)';
                } else if (idleTime > INACTIVE_TIMEOUT) {
                    shouldDelete = true;
                    reason = 'inactividad prolongada (30 min)';
                }

                if (shouldDelete) {
                    console.log(`[RoomManager] GC: Eliminando sala ${roomId}. Motivo: ${reason}`);

                    this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'timeout' });

                    room.players.forEach(user => {
                        if (this.userToRoom.get(user) === roomId) {
                            this.userToRoom.delete(user);
                        }
                    });

                    if (this.roundTimers.has(roomId)) {
                        clearTimeout(this.roundTimers.get(roomId));
                        this.roundTimers.delete(roomId);
                    }
                    this.rooms.delete(roomId);
                    this.roundGameScores.delete(roomId);
                    this.roundFinishedPlayers.delete(roomId);
                    this.playedGames.delete(roomId);
                    this.returnedToLobbyPlayers.delete(roomId);

                    if (this.roomRepo) {
                        try {
                            await this.roomRepo.deleteById(roomId);
                        } catch (e) {
                            console.error(`[RoomManager] GC: Error eliminando sala ${roomId} de DB:`, e);
                        }
                    }
                }
            }

            // Limpieza profunda en DB: Cualquier sala LOBBY sin createdAt o muy vieja
            if (this.roomRepo) {
                try {
                    const threshold = new Date(Date.now() - LOBBY_TIMEOUT);
                    // Borramos salas viejas O salas que ni siquiera tengan el campo createdAt
                    const deleted = await this.roomRepo.deleteMany({
                        status: 'LOBBY',
                        $or: [
                            { createdAt: { $lt: threshold } },
                            { createdAt: { $exists: false } },
                            { lastActivity: { $lt: Date.now() - INACTIVE_TIMEOUT } }
                        ]
                    });
                    if (deleted && deleted.deletedCount > 0) {
                        console.log(`[RoomManager] DB Cleanup: ¡Éxito! Borradas ${deleted.deletedCount} salas antiguas de la base de datos.`);
                    }
                } catch (e) {
                    console.error("[RoomManager] Error en DB Cleanup:", e);
                }
            }

            await this.syncGlobalRooms();
        }, 5 * 60 * 1000);
    }

    addSession(user, ws) {
        this.sessions.set(user, ws);
        console.log(`Sesión registrada para: ${user}`);
    }

    removeSession(user) {
        this.sessions.delete(user);
        if (this.userToRoom.has(user)) {
            const roomId = this.userToRoom.get(user);
            console.log(`[RoomManager] Desconexión detectada. Expulsando a ${user} de la sala ${roomId}.`);
            this.leaveRoom(roomId, user);
        } else {
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
        if (!this.roomRepo) return;
        try {
            const availableRooms = await this.roomRepo.findPublicLobbies();
            this.broadcastGlobal({
                type: 'GLOBAL_ROOMS_UPDATE',
                rooms: availableRooms
            });
        } catch (error) {
            console.error("Error sincronizando salas globales:", error);
        }
    }

    createLobbyTimeout(roomId) {
        // No es necesario recrear el timeout cada vez si el GC ya lo controla, 
        // pero lo dejamos como seguro adicional de 15 minutos exactos.
        return setTimeout(async () => {
            const room = this.rooms.get(roomId);
            if (room && room.status === 'LOBBY') {
                console.log(`[Room ${roomId}] Auto-cleanup: sala eliminada por tiempo límite (15 min).`);
                this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'inactive' });

                this.rooms.delete(roomId);
                // ... limpieza de mapas internos ...
                this.roundGameScores.delete(roomId);
                this.roundFinishedPlayers.delete(roomId);
                this.playedGames.delete(roomId);
                this.returnedToLobbyPlayers.delete(roomId);

                if (this.roomRepo) {
                    try {
                        await this.roomRepo.deleteById(roomId);
                        await this.syncGlobalRooms();
                    } catch (e) {
                        console.error("Error auto-cleanup inactividad sala a DB:", e);
                    }
                }
            }
        }, 10 * 60 * 1000);
    }

    async createRoom(hostInput, isPublic = true, maxPlayers = 4, initialConfig = {}) {
        const host = (typeof hostInput === 'object' && hostInput !== null) ? (hostInput.username || hostInput.user) : hostInput;
        if (!host) {
            console.error('[RoomManager] Intento de crear sala con host nulo.');
            return null;
        }

        if (this.userToRoom.has(host)) {
            const oldRoomId = this.userToRoom.get(host);
            console.log(`[RoomManager] Usuario ${host} ya está en la sala ${oldRoomId} (memoria). Forzando salida.`);
            await this.leaveRoom(oldRoomId, host);
        }

        if (this.roomRepo) {
            try {
                const result = await this.roomRepo.deleteMany({ host: host, status: 'LOBBY' });
                if (result && result.deletedCount > 0) {
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
                currentGame: null,
                mode: initialConfig.mode || 'NORMAL',
                modality: initialConfig.modality || '1vs1',
                routeId: initialConfig.routeId || null
            }
        };

        this.rooms.set(roomId, {
            host,
            players: new Set([host]),
            maxPlayers,
            status: 'LOBBY',
            isPublic,
            gameConfig: roomData.gameConfig,
            createdAt: roomData.createdAt,
            idleTimer: this.createLobbyTimeout(roomId),
            lastActivity: Date.now()
        });

        this.userToRoom.set(host, roomId);

        if (this.roomRepo) {
            try {
                roomData.lastActivity = Date.now();
                await this.roomRepo.save(roomData);
                console.log(`💾 Sala ${roomId} persistida en DB (Public: ${isPublic})`);
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("Error persistiendo sala:", error);
            }
        }

        return roomId;
    }

    updateRoomActivity(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            const now = Date.now();
            room.lastActivity = now;

            if (!room.lastDbActivityUpdate || (now - room.lastDbActivityUpdate > 30000)) {
                room.lastDbActivityUpdate = now;
                if (this.roomRepo) {
                    this.roomRepo.update({ id: roomId, lastActivity: now }).catch(() => { });
                }
            }
        }
    }

    async joinRoom(roomId, userInput) {
        const user = (typeof userInput === 'object' && userInput !== null) ? (userInput.username || userInput.user) : userInput;
        if (this.userToRoom.has(user) && this.userToRoom.get(user) !== roomId) {
            const oldRoomId = this.userToRoom.get(user);
            console.log(`[RoomManager] Usuario ${user} ya está en la sala ${oldRoomId}. Forzando salida para unirse a ${roomId}.`);
            await this.leaveRoom(oldRoomId, user);
        }

        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Sala no encontrada' };

        if (room.players.size >= room.maxPlayers && !room.players.has(user)) {
            return { error: 'La nave ya ha alcanzado su capacidad máxima' };
        }

        if (!user) {
            return { error: 'Identificación de usuario inválida.' };
        }
        room.players.add(user);
        this.userToRoom.set(user, roomId);
        this.updateRoomActivity(roomId);

        if (room.gameConfig && room.gameConfig.scores) {
            room.gameConfig.scores[user] = 0;
        }

        if (room.status === 'LOBBY') {
            if (room.idleTimer) clearTimeout(room.idleTimer);
            room.idleTimer = this.createLobbyTimeout(roomId);
        }

        if (this.roomRepo) {
            try {
                await this.roomRepo.update({ id: roomId, players: Array.from(room.players) });
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("Error actualizando sala en DB:", error);
            }
        }

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: roomUpdate
        });
        return { success: true, room };
    }

    async leaveRoom(roomId, user) {
        const room = this.rooms.get(roomId);

        if (this.userToRoom.get(user) === roomId) {
            this.userToRoom.delete(user);
        }

        if (!room) return;

        room.players.delete(user);
        this.updateRoomActivity(roomId);

        if (room.players.size === 0) {
            console.log(`Sala ${roomId} vacía. Eliminando de memoria y DB...`);
            if (room.idleTimer) clearTimeout(room.idleTimer);

            this.rooms.delete(roomId);
            this.roundGameScores.delete(roomId);
            this.roundFinishedPlayers.delete(roomId);
            this.playedGames.delete(roomId);
            this.returnedToLobbyPlayers.delete(roomId);

            if (this.roomRepo) {
                try {
                    await this.roomRepo.deleteById(roomId);
                    console.log(`✅ Sala ${roomId} eliminada de DB`);
                    await this.syncGlobalRooms();
                } catch (error) {
                    console.error("Error eliminando sala de DB:", error);
                }
            }
        } else {
            if (room.host === user) {
                const newHost = Array.from(room.players)[0];
                room.host = newHost;
                console.log(`Host migrado en sala ${roomId}: ${user} -> ${newHost}`);
            }

            if (room.status === 'LOBBY') {
                if (room.idleTimer) clearTimeout(room.idleTimer);
                room.idleTimer = this.createLobbyTimeout(roomId);
            }

            if (this.roomRepo) {
                try {
                    await this.roomRepo.update({
                        id: roomId,
                        players: Array.from(room.players),
                        host: room.host
                    });
                    await this.syncGlobalRooms();
                } catch (error) {
                    console.error("Error actualizando sala en DB al salir:", error);
                }
            }

            const roomUpdate = await this.getRoom(roomId);
            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: roomUpdate
            });
        }
    }

    async getRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const playerDetails = [];
        for (const username of room.players) {
            let details = { username };
            if (this.userRepo) {
                try {
                    const user = await this.userRepo.findByUsername(username);
                    if (user) {
                        details = {
                            username: user.username || username || 'Jugador',
                            level: user.level || 1,
                            rank: user.rank || 'Cadete',
                            avatar: user.avatar || 'Astronauta_blanc.jpg'
                        };
                    }
                } catch (e) {
                    console.error(`❌ Error enriqueciendo datos para ${username}:`, e);
                }
            }
            playerDetails.push(details);
        }

        return {
            id: roomId,
            host: room.host,
            players: playerDetails,
            maxPlayers: room.maxPlayers,
            status: room.status,
            gameConfig: room.gameConfig
        };
    }

    async updateGameConfig(roomId, config) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        this.updateRoomActivity(roomId);

        // Si viene maxPlayers en el config, lo actualizamos en la sala
        if (config.maxPlayers !== undefined) {
            room.maxPlayers = config.maxPlayers;
            delete config.maxPlayers; // Lo quitamos del config interno para no duplicar
        }

        room.gameConfig = { ...room.gameConfig, ...config };

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: roomUpdate
        });
    }

    async startMatch(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.players.size < 2) return { error: 'Se necesitan al menos 2 jugadores' };

        this.updateRoomActivity(roomId);
        
        const isRace = room.gameConfig.mode === 'RACE';
        room.status = isRace ? 'PLAYING' : 'ROULETTE';

        if (room.idleTimer) {
            clearTimeout(room.idleTimer);
            room.idleTimer = null;
        }

        if (!room.gameConfig.scores) room.gameConfig.scores = {};
        if (!room.gameConfig.teams) room.gameConfig.teams = {};
        if (!room.gameConfig.subRoles) room.gameConfig.subRoles = {};
        
        // Reset scores for a new match but keep teams if they exist
        room.players.forEach(p => {
            room.gameConfig.scores[p] = 0;
        });

        room.gameConfig.currentRound = 0;
        room.gameConfig.totalRounds = room.gameConfig.pointsToWin || 3;
        room.gameConfig.roundHistory = [];
        this.playedGames.set(roomId, new Set());

        const firstGame = this.pickNextGame(roomId);
        room.gameConfig.currentGame = firstGame;

        this.assignRoles(roomId, firstGame, false);

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, {
            type: 'MATCH_STARTING',
            room: roomUpdate
        });

        return { success: true };
    }

    pickNextGame(roomId) {
        const played = this.playedGames.get(roomId) || new Set();
        const remaining = this.availableGames.filter(g => !played.has(g));
        const pool = remaining.length > 0 ? remaining : this.availableGames;
        const game = pool[Math.floor(Math.random() * pool.length)];
        played.add(game);
        this.playedGames.set(roomId, played);
        return game;
    }

    assignRoles(roomId, gameName, rotate = false) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const playerArray = Array.from(room.players);
        
        if (room.gameConfig.mode === 'RACE') {
            playerArray.forEach(p => {
                room.gameConfig.teams[p] = p; // Cada uno en su equipo (su propio nombre)
                room.gameConfig.subRoles[p] = null;
            });
            return;
        }

        const isPairGame = ['RadioSignal', 'SpelledRosco', 'RhymeSquad', 'RadarScan', 'SyllableQuest'].includes(gameName);
        const half = Math.ceil(playerArray.length / 2);

        playerArray.forEach((p, index) => {
            if (!room.gameConfig.scores[p]) room.gameConfig.scores[p] = 0;

            if (isPairGame) {
                const pairIndex = Math.floor(index / 2);
                room.gameConfig.teams[p] = `team-${pairIndex + 1}`;

                const roleIndex = rotate ? (index + 1) : index;

                if (gameName === 'SpelledRosco') {
                    room.gameConfig.subRoles[p] = (roleIndex % 2 === 0) ? ROSCO_ROLES.SENDER : ROSCO_ROLES.GUESSER;
                } else if (gameName === 'RhymeSquad') {
                    room.gameConfig.subRoles[p] = (roleIndex % 2 === 0) ? 'catcher' : 'sniper';
                } else {
                    room.gameConfig.subRoles[p] = (roleIndex % 2 === 0) ? 'listener' : 'writer';
                }
            } else {
                room.gameConfig.teams[p] = (index < half) ? 'red' : 'blue';
                room.gameConfig.subRoles[p] = null;
            }
        });
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
                        'ELS DRACS BOTEN SOBRE LES PEDRES', 'TRES TRISTOS TIGRES MENGEN BLAT',
                        'LA LLUNA PLENA IL·LUMINA EL CAMÍ', 'EL VENT BUFA FORT A LA MUNTANYA'
                    ];
                    const generateRadio = () => {
                        const p1Idx = Math.floor(Math.random() * phrases.length);
                        let p2Idx = Math.floor(Math.random() * phrases.length);
                        while (p2Idx === p1Idx) p2Idx = Math.floor(Math.random() * phrases.length);

                        return {
                            frequency: Math.random() * 90 + 5,
                            phrase: phrases[p1Idx],
                            partnerPhrase: phrases[p2Idx]
                        };
                    };

                    if (teams.length > 0) teams.forEach(tId => { room.gameConfig.radioData[tId] = generateRadio(); });
                    else room.gameConfig.radioData['default'] = generateRadio();
                }

                this.roundGameScores.set(roomId, {});
                this.roundFinishedPlayers.set(roomId, new Set());
                this.startRoundTimer(roomId);
            } catch (error) {
                console.error(`[Room ${roomId}] ERROR CRÍTICO AL INICIAR PARTIDA:`, error);
                this.broadcastToRoom(roomId, {
                    type: 'ERROR',
                    message: 'Hubo un problema al iniciar el minijuego. Volviendo al centro de mando.'
                });
                room.status = 'LOBBY';
            }
        }

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: roomUpdate
        });
    }

    startRoundTimer(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
        }

        const currentGame = room.gameConfig.currentGame || 'default';
        const duration = this.gameDurations[currentGame] || 60000;
        const timer = setTimeout(() => {
            console.log(`[Room ${roomId}] Tiempo agotado para la ronda.`);
            this.finishRound(roomId);
        }, duration);

        this.roundTimers.set(roomId, timer);
    }

    async handlePlayerFinished(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        this.updateRoomActivity(roomId);

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
        this.updateRoomActivity(roomId);

        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
            this.roundTimers.delete(roomId);
        }

        console.log(`[Room ${roomId}] Finalizando ronda ${room.gameConfig.currentRound + 1}`);

        const roundScores = this.roundGameScores.get(roomId) || {};
        let winner = null;
        let maxScore = -1;
        let tie = false;

        // Si hay equipos, calculamos el ganador por equipo
        const hasTeams = room.gameConfig.teams && Object.keys(room.gameConfig.teams).length > 0;
        
        if (hasTeams) {
            const teamScores = {};
            Object.entries(roundScores).forEach(([u, s]) => {
                const teamId = room.gameConfig.teams[u];
                if (teamId) {
                    // En cooperativo/equipos el score suele estar sincronizado, 
                    // así que tomamos el máximo reportado por cualquier miembro del equipo
                    teamScores[teamId] = Math.max(teamScores[teamId] || 0, s);
                }
            });

            let winningTeam = null;
            Object.entries(teamScores).forEach(([tId, s]) => {
                if (s > maxScore) {
                    maxScore = s;
                    winningTeam = tId;
                    tie = false;
                } else if (s === maxScore && maxScore > 0) {
                    tie = true;
                }
            });

            if (winningTeam && !tie) {
                // El ganador es el equipo (lo guardamos como string identificador)
                winner = winningTeam;
                // Incrementamos score para todos los miembros del equipo
                room.players.forEach(p => {
                    if (room.gameConfig.teams[p] === winningTeam) {
                        room.gameConfig.scores[p] = (room.gameConfig.scores[p] || 0) + 1;
                    }
                });
            }
        } else {
            // Lógica individual clásica
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
            }
        }

        if (winner && !tie) {
            console.log(`[Room ${roomId}] Ganador de ronda: ${winner}`);
        }

        // Guardar en el historial de la partida para la gráfica final
        if (!room.gameConfig.roundHistory) room.gameConfig.roundHistory = [];
        room.gameConfig.roundHistory.push({
            round: room.gameConfig.currentRound + 1,
            winner: winner,
            tie: tie,
            currentScores: { ...room.gameConfig.scores }
        });

        // Si es la última ronda, saltamos directamente a MATCH_RESULTS
        if (room.gameConfig.currentRound >= room.gameConfig.maxRounds - 1) {
            room.status = 'MATCH_RESULTS';
        } else {
            room.status = 'ROUND_RESULTS';
        }

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, {
            type: 'ROUND_ENDED_BY_WINNER',
            winner: tie ? null : winner,
            tie,
            room: roomUpdate
        });

        setTimeout(async () => {
            const currentRoom = this.rooms.get(roomId);
            if (!currentRoom) return;

            currentRoom.gameConfig.currentRound++;

            const winnerOfMatch = Object.entries(currentRoom.gameConfig.scores).find(([u, s]) => s >= currentRoom.gameConfig.pointsToWin);

            if (winnerOfMatch || currentRoom.gameConfig.currentRound >= currentRoom.gameConfig.totalRounds) {
                currentRoom.status = 'GAME_OVER';
                const finalRoomUpdate = await this.getRoom(roomId);
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_FINISHED',
                    winner: winnerOfMatch ? winnerOfMatch[0] : null,
                    room: finalRoomUpdate
                });

                // Auto-cleanup GAME_OVER rooms after 10 mins
                setTimeout(async () => {
                    if (this.rooms.has(roomId) && this.rooms.get(roomId).status === 'GAME_OVER') {
                        console.log(`🧹 [Room ${roomId}] Auto-cleanup: sala abandonada en GAME_OVER.`);
                        this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'abandoned' });
                        this.rooms.delete(roomId);
                        if (this.roomRepo) {
                            await this.roomRepo.deleteById(roomId);
                            await this.syncGlobalRooms();
                        }
                    }
                }, 10 * 60 * 1000);

            } else {
                const isRace = currentRoom.gameConfig.mode === 'RACE';
                currentRoom.status = isRace ? 'PLAYING' : 'ROULETTE';
                const nextGame = this.pickNextGame(roomId);
                currentRoom.gameConfig.currentGame = nextGame;
                this.assignRoles(roomId, nextGame, true);

                const nextRoomUpdate = await this.getRoom(roomId);
                this.broadcastToRoom(roomId, {
                    type: 'ROUND_FINISHED',
                    winner,
                    room: nextRoomUpdate
                });
            }
        }, 2000);
    }

    handleGameAction(roomId, user, action) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        if (action.type !== 'MOUSE_MOVE') {
            this.updateRoomActivity(roomId);
        }

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

        if (action.type === 'SCORE_UPDATE') {
            const currentGame = room.gameConfig.currentGame;
            if (currentGame === 'SpelledRosco') {
                const role = room.gameConfig.subRoles[user];
                if (role !== ROSCO_ROLES.GUESSER) return;
            }

            const scores = this.roundGameScores.get(roomId) || {};
            const teamId = room.gameConfig.teams ? room.gameConfig.teams[user] : null;

            if (teamId) {
                room.players.forEach(p => {
                    if (room.gameConfig.teams[p] === teamId) {
                        scores[p] = action.score;
                        this.broadcastToRoom(roomId, {
                            type: 'SCORE_UPDATE_LIVE',
                            user: p,
                            score: action.score
                        });
                    }
                });
            } else {
                scores[user] = action.score;
                this.broadcastToRoom(roomId, {
                    type: 'SCORE_UPDATE_LIVE',
                    user,
                    score: action.score
                });
            }
            this.roundGameScores.set(roomId, scores);
        }

        if (action.type === 'ROSCO_PROGRESS_UPDATE') {
            const teamId = room.gameConfig.teams ? room.gameConfig.teams[user] : null;
            if (teamId) {
                if (!room.gameConfig.roscoProgress) room.gameConfig.roscoProgress = {};
                if (!room.gameConfig.roscoProgress[teamId]) {
                    room.gameConfig.roscoProgress[teamId] = { letterIndex: 0, errors: 0, swapped: false };
                }
                const progress = room.gameConfig.roscoProgress[teamId];
                progress.letterIndex = action.letterIndex;
                progress.errors = action.errors;
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
                if (oldRole === ROSCO_ROLES.TRANSLATOR) room.gameConfig.subRoles[p] = ROSCO_ROLES.GUESSER;
                else if (oldRole === ROSCO_ROLES.GUESSER) {
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

        let returned = this.returnedToLobbyPlayers.get(roomId);
        if (!returned) {
            returned = new Set();
            this.returnedToLobbyPlayers.set(roomId, returned);
        }
        returned.add(user);

        if (returned.size >= room.players.size) {
            console.log(`✅ [Room ${roomId}] Tots els jugadors han tornat. Reset room to LOBBY.`);
            room.status = 'LOBBY';
            this.returnedToLobbyPlayers.delete(roomId);
            this.roundFinishedPlayers.delete(roomId);
            this.roundGameScores.delete(roomId);

            const roomUpdate = await this.getRoom(roomId);
            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: roomUpdate
            });
        } else {
            this.broadcastToRoom(roomId, {
                type: 'PLAYER_RETURNED',
                user
            });
        }
    }
}

module.exports = new RoomManager();
