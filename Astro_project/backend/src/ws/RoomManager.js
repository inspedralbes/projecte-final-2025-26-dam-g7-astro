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
        this.hazards = ['BLACK_HOLE', 'KRAKEN_SPACE', 'SUPERNOVA'];
        this.hazardInterval = null;
    }

    init(getCollections, wss) {
        this.getCollections = getCollections;
        this.wss = wss;
        this.startHazardTicker();
        console.log("🛠️ RoomManager inicializado con acceso a DB y WSS");
    }

    startHazardTicker() {
        if (this.hazardInterval) return;
        this.hazardInterval = setInterval(() => {
            this.rooms.forEach((room, roomId) => {
                if (room.status === 'PLAYING' && room.gameConfig.mode === 'COOPERATIVE') {
                    // 1. El peligro avanza con Rubber-banding
                    // Si los jugadores van muy adelantados, el peligro acelera un poco para mantener presión
                    const maxPlayerProgress = Math.max(...room.gameConfig.teams.filter(t => !t.isBot).map(t => t.progress || 0), 0);
                    let baseSpeed = room.gameConfig.hazardSpeed || 0.4;

                    if (maxPlayerProgress > 70) baseSpeed *= 1.2; // Acelera al final
                    if (maxPlayerProgress < 20) baseSpeed *= 0.8; // Da un respiro al principio

                    // Mecánica especial: Supernova acelera con el tiempo
                    if (room.gameConfig.hazard === 'SUPERNOVA') {
                        const elapsed = (Date.now() - room.gameConfig.startTime) / 1000;
                        if (elapsed > 60) baseSpeed *= 1.5;
                        if (elapsed > 120) baseSpeed *= 2;
                    }

                    room.gameConfig.hazardProgress = Math.min((room.gameConfig.hazardProgress || 0) + baseSpeed, 100);

                    // Si el peligro alcanza el 100% (o a algún equipo rezagado), FIN DE JUEGO (Perdida)
                    if (room.gameConfig.hazardProgress >= 95) { // Un poco antes del final por si acaso
                        this.broadcastToRoom(roomId, {
                            type: 'SPACE_RACE_LOSE',
                            reason: 'HAZARD_CAUGHT'
                        });
                        setTimeout(() => this.finishMatch(roomId, 'Nadie (Escapada Fallida)'), 3000);
                    }

                    // 2. Los equipos BOT avanzan con IA Dinámica (Arrebatos y frenazos)
                    room.gameConfig.teams.forEach(t => {
                        if (t.isBot) {
                            // Cambio de velocidad cada tick (pequeñas variaciones)
                            const variation = (Math.random() - 0.5) * 0.1;
                            t.speed = Math.max(0.1, Math.min(0.6, (t.speed || 0.3) + variation));

                            // Probabilidad de "Arrebato de velocidad"
                            if (Math.random() > 0.98) t.speed += 0.5;

                            t.progress = Math.min((t.progress || 0) + t.speed, 100);
                        }
                    });

                    // Sincronizar con todos los jugadores
                    this.broadcastToRoom(roomId, {
                        type: 'HAZARD_UPDATE',
                        hazardProgress: room.gameConfig.hazardProgress,
                        teams: room.gameConfig.teams
                    });
                }
            });
        }, 1000);
    }

    addSession(user, ws) {
        this.sessions.set(user, ws);
        console.log(`📡 Sesión registrada para: ${user}`);
    }

    removeSession(user) {
        this.sessions.delete(user);
        // Limpiar al jugador de cualquier sala en la que esté
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.players.has(user)) {
                this.leaveRoom(roomId, user);
            }
        }
        console.log(`📡 Sesión eliminada para: ${user}`);
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

    // Enviar a absolutamente todos los conectados al servidor
    broadcastGlobal(message) {
        if (!this.wss) {
            console.warn("⚠️ No hay servidor WSS para broadcast global. Usando sesiones locales.");
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
        console.log(`📢 Difusión global completa: ${message.type} enviada a ${sentCount} clientes`);
    }

    async syncGlobalRooms() {
        if (!this.getCollections) return;
        try {
            const { rooms } = this.getCollections();
            const availableRooms = await rooms.find({
                status: 'LOBBY',
                isPublic: true,
                $expr: { $lt: [{ $size: "$players" }, "$maxPlayers"] }
            }).toArray();
            this.broadcastGlobal({
                type: 'GLOBAL_ROOMS_UPDATE',
                rooms: availableRooms
            });
        } catch (error) {
            console.error("❌ Error sincronizando salas globales:", error);
        }
    }

    async createRoom(host, isPublic = true, maxPlayers = 4, initialConfig = {}) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const finalMaxPlayers = parseInt(maxPlayers) || 4;

        const roomData = {
            id: roomId,
            host,
            players: [host],
            maxPlayers: finalMaxPlayers,
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
            maxPlayers: finalMaxPlayers,
            status: 'LOBBY',
            isPublic,
            gameConfig: roomData.gameConfig
        });

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                await rooms.insertOne(roomData);
                console.log(`💾 Sala ${roomId} persistida en DB (Public: ${isPublic})`);
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("❌ Error persistiendo sala:", error);
            }
        }

        return roomId;
    }

    async joinRoom(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Sala no encontrada' };

        // Comprobar si la sala está llena o si el usuario ya está
        if (room.players.size >= room.maxPlayers && !room.players.has(user)) {
            return { error: 'La nave ya ha alcanzado su capacidad máxima' };
        }

        room.players.add(user);
        if (room.gameConfig && room.gameConfig.scores) {
            room.gameConfig.scores[user] = 0;
        }

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                await rooms.updateOne({ id: roomId }, { $addToSet: { players: user } });
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("❌ Error actualizando sala en DB:", error);
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
        if (!room) return;

        room.players.delete(user);

        if (room.players.size === 0) {
            console.log(`🧹 Sala ${roomId} vacía. Eliminando...`);
            this.rooms.delete(roomId);
            if (this.getCollections) {
                try {
                    const { rooms } = this.getCollections();
                    await rooms.deleteOne({ id: roomId });
                    console.log(`✅ Sala ${roomId} eliminada de DB`);
                    await this.syncGlobalRooms();
                } catch (error) {
                    console.error("❌ Error eliminando sala de DB:", error);
                }
            }
        } else {
            // Si el host se va, el siguiente jugador es el nuevo host
            if (room.host === user) {
                const newHost = Array.from(room.players)[0];
                room.host = newHost;
                console.log(`👑 Host migrado en sala ${roomId}: ${user} -> ${newHost}`);
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
                    console.error("❌ Error actualizando sala en DB al salir:", error);
                }
            }

            // Notificar a los que quedan en la sala del cambio
            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: this.getRoom(roomId)
            });
        }
    }

    async deleteRoom(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Sala no encontrada' };
        if (room.host !== user) return { error: 'Solo el comandante puede cerrar la misión' };

        console.log(`🧨 Host ${user} cerrando sala ${roomId}.`);

        this.broadcastToRoom(roomId, {
            type: 'ROOM_CLOSED',
            reason: 'host_closed'
        });

        this.rooms.delete(roomId);
        this.roundGameScores.delete(roomId);
        this.roundFinishedPlayers.delete(roomId);
        this.roundTimers.delete(roomId);

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                await rooms.deleteOne({ id: roomId });
                console.log(`✅ Sala ${roomId} eliminada de DB por el host`);
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("❌ Error eliminando sala de DB por el host:", error);
            }
        }
        return { success: true };
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

        // Manejar propiedades de primer nivel
        if (config.maxPlayers) {
            room.maxPlayers = config.maxPlayers;
            delete config.maxPlayers;
        }

        room.gameConfig = { ...room.gameConfig, ...config };

        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: this.getRoom(roomId)
        });

        // Sincronizar con el lobby si es pública
        await this.syncGlobalRooms();
    }

    async startMatch(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.players.size < 2) return { error: 'Se necesitan al menos 2 jugadores' };

        room.status = 'ROULETTE';
        // Reset scores i estat
        room.gameConfig.scores = {};
        room.gameConfig.currentRound = 0;
        room.gameConfig.totalRounds = room.gameConfig.pointsToWin || 3;
        room.gameConfig.roundHistory = []; // AÑADIDO: Historial de rondas
        room.players.forEach(p => room.gameConfig.scores[p] = 0);

        // Reset jocs jugats
        this.playedGames.set(roomId, new Set());

        // Seleccionar primer joc (senze repeticions)
        const firstGame = this.pickNextGame(roomId);
        room.gameConfig.currentGame = firstGame;
        room.gameConfig.seed = Math.random();
        room.gameConfig.startTime = Date.now();

        this.broadcastToRoom(roomId, {
            type: 'MATCH_STARTING',
            seed: room.gameConfig.seed,
            startTime: room.gameConfig.startTime,
            room: this.getRoom(roomId)
        });

        // Si es modo COOPERATIVO, inicializar equipos y amenaza
        if (room.gameConfig.mode === 'COOPERATIVE') {
            this.initSpaceRace(roomId);
        }

        return { success: true };
    }

    initSpaceRace(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // 1. Asignar equipos (Parejas de jugadores)
        const players = Array.from(room.players);
        const teams = [];
        for (let i = 0; i < players.length; i += 2) {
            const p1 = players[i];
            const p2 = players[i + 1] || 'BOT_ASTRONAUT';
            teams.push({ id: teams.length + 1, members: [p1, p2], progress: 0, isBot: false });
        }

        // 2. Añadir equipos competidores totalmente BOTS (para que sea una carrera)
        const totalTeams = 4;
        while (teams.length < totalTeams) {
            teams.push({
                id: teams.length + 1,
                members: ['BOT_ALPHA', 'BOT_BETA'],
                progress: 0,
                isBot: true,
                speed: 0.2 + Math.random() * 0.3 // Progreso por segundo
            });
        }
        room.gameConfig.teams = teams;

        // 3. Seleccionar amenaza aleatoria y su velocidad
        room.gameConfig.hazard = this.hazards[Math.floor(Math.random() * this.hazards.length)];
        room.gameConfig.hazardProgress = 0;

        // Velocidad base del peligro (progreso por segundo)
        room.gameConfig.hazardSpeed = 0.4;
        if (room.gameConfig.hazard === 'SUPERNOVA') room.gameConfig.hazardSpeed = 0.3; // Empieza lento
        if (room.gameConfig.hazard === 'KRAKEN_SPACE') room.gameConfig.hazardSpeed = 0.5;

        // 3. Calcular tiempo límite (85% de la suma de duraciones)
        let totalRawTime = 0;
        // Asumiendo 3 rondas por defecto para el cálculo si no se especifica
        const rounds = room.gameConfig.totalRounds || 3;
        for (let i = 0; i < rounds; i++) {
            totalRawTime += 60; // Base 60s por juego
        }
        room.gameConfig.timeLimit = Math.floor(totalRawTime * 0.85);
        room.gameConfig.startTime = Date.now();

        console.log(`🚀 [Room ${roomId}] Carrera Espacial iniciada. Amenaza: ${room.gameConfig.hazard}, Tiempo: ${room.gameConfig.timeLimit}s`);
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

        room.status = status;

        if (status === 'PLAYING') {
            this.roundGameScores.set(roomId, {}); // Resetear puntos de la ronda
            this.roundFinishedPlayers.set(roomId, new Set()); // Resetear finalizados
            this.startRoundTimer(roomId);
        }

        this.broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room: this.getRoom(roomId)
        });
    }

    // Duraciones de cada juego (ms) + 5s de margen para que el cliente cierre antes
    getGameDuration(gameName) {
        const durations = {
            'RadarScan': 60 + 5,
            'RadioSignal': 60 + 5,
            'RhymeSquad': 60 + 5,
            'SpelledRosco': 90 + 5,
            'SymmetryBreaker': 80 + 5,
            'WordConstruction': 90 + 5,
        };
        return (durations[gameName] || 70) * 1000;
    }

    startRoundTimer(roomId) {
        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
        }

        const room = this.rooms.get(roomId);
        const currentGame = room?.gameConfig?.currentGame;
        const duration = this.getGameDuration(currentGame);

        console.log(`⏱️ [Room ${roomId}] Timer de ronda: ${duration / 1000}s (juego: ${currentGame})`);

        const timerId = setTimeout(() => {
            console.log(`⏰ [Room ${roomId}] Tiempo agotado por servidor. Forzando fin de ronda.`);
            this.finalizeRound(roomId);
        }, duration);

        this.roundTimers.set(roomId, timerId);
    }

    async handlePlayerFinished(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;

        // Afegir el jugador al set de jugadors que han acabat
        let finished = this.roundFinishedPlayers.get(roomId);
        if (!finished) {
            finished = new Set();
            this.roundFinishedPlayers.set(roomId, finished);
        }
        finished.add(user);
        console.log(`👤 [Room ${roomId}] Jugador ${user} ha acabat. (${finished.size}/${room.players.size})`);

        // Avisar a tots que algú ha acabat (per si el rival vol saber)
        this.broadcastToRoom(roomId, {
            type: 'PLAYER_FINISHED',
            user,
            remaining: room.players.size - finished.size
        });

        // Si es carrera espacial, avanzar equipo
        if (room.gameConfig.mode === 'COOPERATIVE') {
            const team = room.gameConfig.teams.find(t => t.members.includes(user));
            if (team) {
                // Cada juego completado avanza un 20% (asumiendo 5 planetas/checkpoints)
                team.progress = Math.min((team.progress || 0) + 20, 100);
                console.log(`🚀 [Room ${roomId}] Equipo ${team.id} avanza a ${team.progress}%`);

                // Notificar avance del equipo
                this.broadcastToRoom(roomId, {
                    type: 'TEAM_PROGRESS_UPDATE',
                    teams: room.gameConfig.teams
                });

                // Si este equipo llega al final, ¡GANAN LA CARRERA!
                if (team.progress >= 100) {
                    this.broadcastToRoom(roomId, {
                        type: 'SPACE_RACE_WIN',
                        winnerTeam: team.id,
                        isDraw: false
                    });
                    // Terminar partida después de animaciones
                    setTimeout(() => this.finishMatch(roomId, `Equipo ${team.id}`), 5000);
                    return; // Ya hemos gestionat el final
                }
            }
        }

        // Finalitzar quan tots els jugadors hagin acabat
        if (finished.size >= room.players.size) {
            console.log(`✅ [Room ${roomId}] Tots els jugadors han acabat. Finalitzando ronda.`);
            this.finalizeRound(roomId);
        }
    }

    async finalizeRound(roomId, finisherUser = null) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;

        // Limpiar temporizador
        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
            this.roundTimers.delete(roomId);
        }

        // Decidir ganador por puntos acumulados en la ronda
        const roundScores = this.roundGameScores.get(roomId) || {};
        let winner = null;
        let maxScore = -1;
        let tie = false;

        for (const [player, score] of Object.entries(roundScores)) {
            if (score > maxScore) {
                maxScore = score;
                winner = player;
                tie = false;
            } else if (score === maxScore && maxScore > 0) {
                // Empate real solo si ambos tienen > 0 puntos iguales
                tie = true;
                winner = null;
            }
        }

        // Si nadie puntuó (maxScore sigue en -1 o 0), el que acabó primero se lleva el punto
        if (maxScore <= 0 && !tie) {
            winner = finisherUser || null;
        }

        if (winner) {
            room.gameConfig.scores[winner] = (room.gameConfig.scores[winner] || 0) + 1;
        }

        // AÑADIDO: Guardar en el historial
        if (!room.gameConfig.roundHistory) room.gameConfig.roundHistory = [];

        const historyItem = {
            round: room.gameConfig.currentRound + 1,
            game: room.gameConfig.currentGame,
            winner: winner,
            scores: { ...roundScores }
        };

        // Si es cooperativo, guardamos también el progreso de los equipos
        if (room.gameConfig.mode === 'COOPERATIVE') {
            historyItem.teamsProgress = room.gameConfig.teams.map(t => ({
                id: t.id,
                progress: t.progress,
                isBot: t.isBot
            }));
        }

        room.gameConfig.roundHistory.push(historyItem);

        console.log(`🏆 [Room ${roomId}] Fin de ronda. Ganador por puntos: ${winner || 'EMPATE'}`);

        // Notificar a todos los resultados finales
        this.broadcastToRoom(roomId, {
            type: 'ROUND_ENDED_BY_WINNER',
            winner,
            tie,
            scores: room.gameConfig.scores
        });

        // Limpiar para la siguiente ronda
        this.roundFinishedPlayers.delete(roomId);

        // Incrementar el contador de rondas
        room.gameConfig.currentRound = (room.gameConfig.currentRound || 0) + 1;
        const totalRounds = room.gameConfig.totalRounds || room.gameConfig.pointsToWin || 3;

        console.log(`📊 [Room ${roomId}] Ronda ${room.gameConfig.currentRound}/${totalRounds}`);

        // Comprobar si hemos jugado todas las rondas
        if (room.gameConfig.currentRound >= totalRounds) {
            // Determinar ganador final por mayor puntuación global
            let matchWinner = null;
            let maxMatchScore = -1;
            for (const [player, playerScore] of Object.entries(room.gameConfig.scores)) {
                if (playerScore > maxMatchScore) {
                    maxMatchScore = playerScore;
                    matchWinner = player;
                } else if (playerScore === maxMatchScore) {
                    matchWinner = null; // Empate total
                }
            }

            this.finishMatch(roomId, matchWinner);

            // Auto-cleanup: si en 10 minuts ningú ha sortit, esborrem la sala
            setTimeout(async () => {
                if (this.rooms.has(roomId) && this.rooms.get(roomId).status === 'GAME_OVER') {
                    console.log(`🧹 [Room ${roomId}] Auto-cleanup: sala abandonada en GAME_OVER.`);
                    this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'abandoned' });
                    this.rooms.delete(roomId);
                    this.roundGameScores.delete(roomId);
                    this.roundFinishedPlayers.delete(roomId);
                    if (this.getCollections) {
                        try {
                            const { rooms } = this.getCollections();
                            await rooms.deleteOne({ id: roomId });
                            await this.syncGlobalRooms();
                        } catch (e) {
                            console.error('❌ Error auto-cleanup sala:', e);
                        }
                    }
                }
            }, 10 * 60 * 1000); // 10 minuts
        } else {
            // Todavía quedan rondas, pasar a la siguiente (sense repetir joc)
            room.status = 'ROUND_RESULTS';
            const nextGame = this.pickNextGame(roomId);
            room.gameConfig.currentGame = nextGame; // Use the result of pickNextGame
            room.gameConfig.startTime = Date.now();
            room.gameConfig.seed = Math.random(); // Añadimos semilla para sincronización

            setTimeout(() => {
                room.status = 'ROULETTE'; // Set status to ROULETTE before broadcasting MATCH_STARTING
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_STARTING', // Changed from ROUND_FINISHED
                    game: room.gameConfig.currentGame,
                    seed: room.gameConfig.seed,
                    startTime: room.gameConfig.startTime,
                    room: this.getRoom(roomId)
                });
            }, 3000);
        }
    }

    handleGameAction(roomId, user, action) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Si es una actualización de puntuación, guardarla localmente
        if (action.type === 'SCORE_UPDATE') {
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

        this.broadcastToRoom(roomId, {
            type: 'GAME_ACTION',
            from: user,
            action
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
        console.log(`🏠 [Room ${roomId}] Jugador ${user} vol tornar al lobby. (${returned.size}/${room.players.size})`);

        // Notificar a tots qui ha tornat
        this.broadcastToRoom(roomId, {
            type: 'PLAYER_RETURNED',
            user,
            returnedCount: returned.size,
            totalPlayers: room.players.size
        });

        // Si tots han decidit tornar al lobby
        if (returned.size >= room.players.size) {
            console.log(`✅ [Room ${roomId}] Tots els jugadors han tornat. Reset room to LOBBY.`);
            room.status = 'LOBBY';
            this.returnedToLobbyPlayers.delete(roomId);
            this.roundFinishedPlayers.delete(roomId);
            this.roundGameScores.delete(roomId);

            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: this.getRoom(roomId)
            });
        }
    }

    finishMatch(roomId, winner) {
        const room = this.rooms.get(roomId);
        if (!room || room.status === 'GAME_OVER') return;

        room.status = 'GAME_OVER';
        this.broadcastToRoom(roomId, {
            type: 'MATCH_FINISHED',
            winner: winner,
            room: this.getRoom(roomId)
        });

        // Auto-cleanup: si en 10 minuts ningú ha sortit, esborrem la sala
        setTimeout(async () => {
            if (this.rooms.has(roomId) && this.rooms.get(roomId).status === 'GAME_OVER') {
                console.log(`🧹 [Room ${roomId}] Auto-cleanup: sala abandonada en GAME_OVER.`);
                this.broadcastToRoom(roomId, { type: 'ROOM_CLOSED', reason: 'abandoned' });
                this.rooms.delete(roomId);
                this.roundGameScores.delete(roomId);
                this.roundFinishedPlayers.delete(roomId);
                if (this.getCollections) {
                    try {
                        const { rooms } = this.getCollections();
                        await rooms.deleteOne({ id: roomId });
                        await this.syncGlobalRooms();
                    } catch (e) {
                        console.error('❌ Error auto-cleanup sala:', e);
                    }
                }
            }
        }, 10 * 60 * 1000); // 10 minuts
    }
}

module.exports = new RoomManager();
