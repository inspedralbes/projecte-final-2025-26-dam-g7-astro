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
    }

    init(getCollections, wss) {
        this.getCollections = getCollections;
        this.wss = wss;
        console.log("RoomManager inicializado con acceso a DB y WSS");
    }

    addSession(user, ws) {
        this.sessions.set(user, ws);
        console.log(`Sesión registrada para: ${user}`);
    }

    removeSession(user) {
        this.sessions.delete(user);
        // Limpiar al jugador de cualquier sala en la que esté
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.players.has(user)) {
                this.leaveRoom(roomId, user);
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
            idleTimer: this.createLobbyTimeout(roomId)
        });

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                await rooms.insertOne(roomData);
                console.log(`Sala ${roomId} persistida en DB (Public: ${isPublic})`);
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("Error persistiendo sala:", error);
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

        // Resetear el timer de inactividad si alguien nuevo entra al lobby
        if (room.status === 'LOBBY') {
            if (room.idleTimer) clearTimeout(room.idleTimer);
            room.idleTimer = this.createLobbyTimeout(roomId);
        }

        if (this.getCollections) {
            try {
                const { rooms } = this.getCollections();
                await rooms.updateOne({ id: roomId }, { $addToSet: { players: user } });
                await this.syncGlobalRooms();
            } catch (error) {
                console.error("Error actualizando sala en DB:", error);
            }
        }

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
        return { success: true, room };
    }

    async leaveRoom(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.players.delete(user);

        if (room.players.size === 0) {
            console.log(`Sala ${roomId} vacía. Eliminando...`);
            if (room.idleTimer) clearTimeout(room.idleTimer);
            this.rooms.delete(roomId);
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

        room.status = 'ROULETTE';

        // Detener el timer de inactividad al empezar a jugar
        if (room.idleTimer) {
            clearTimeout(room.idleTimer);
            room.idleTimer = null;
        }

        // Reset scores i estat
        room.gameConfig.scores = {};
        room.gameConfig.currentRound = 0;
        room.gameConfig.totalRounds = room.gameConfig.pointsToWin || 3;
        room.gameConfig.roundHistory = []; // AÑADIDO: Historial de rondas
        room.players.forEach(p => room.gameConfig.scores[p] = 0);

        // Reset jocs jugats
        this.playedGames.set(roomId, new Set());

        // Seleccionar primer joc (sense repeticions)
        const firstGame = this.pickNextGame(roomId);
        room.gameConfig.currentGame = firstGame;

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

        console.log(`[Room ${roomId}] Timer de ronda: ${duration / 1000}s (juego: ${currentGame})`);

        const timerId = setTimeout(() => {
            console.log(`[Room ${roomId}] Tiempo agotado por servidor. Forzando fin de ronda.`);
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
        console.log(`[Room ${roomId}] Jugador ${user} ha acabat. (${finished.size}/${room.players.size})`);

        // Avisar a tots que algú ha acabat (per si el rival vol saber)
        this.broadcastToRoom(roomId, {
            type: 'PLAYER_FINISHED',
            user,
            remaining: room.players.size - finished.size
        });

        // Finalitzar quan tots els jugadors hagin acabat
        if (finished.size >= room.players.size) {
            console.log(`[Room ${roomId}] Tots els jugadors han acabat. Finalitzant ronda.`);
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
        room.gameConfig.roundHistory.push({
            round: room.gameConfig.currentRound + 1,
            game: room.gameConfig.currentGame,
            winner: winner,
            scores: { ...roundScores }
        });

        console.log(`[Room ${roomId}] Fin de ronda. Ganador por puntos: ${winner || 'EMPATE'}`);

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

        console.log(`[Room ${roomId}] Ronda ${room.gameConfig.currentRound}/${totalRounds}`);

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

            room.status = 'GAME_OVER';
            setTimeout(() => {
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_FINISHED',
                    winner: matchWinner,
                    room: this.getRoom(roomId)
                });
            }, 3000);

            // Auto-cleanup: si en 10 minuts ningú ha sortit, esborrem la sala
            setTimeout(async () => {
                if (this.rooms.has(roomId) && this.rooms.get(roomId).status === 'GAME_OVER') {
                    console.log(`[Room ${roomId}] Auto-cleanup: sala abandonada en GAME_OVER.`);
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
                            console.error('Error auto-cleanup sala:', e);
                        }
                    }
                }
            }, 10 * 60 * 1000); // 10 minuts
        } else {
            // Todavía quedan rondas, pasar a la siguiente (sense repetir joc)
            room.status = 'ROUND_RESULTS';
            const nextGame = this.pickNextGame(roomId);
            room.gameConfig.currentGame = nextGame;

            setTimeout(() => {
                room.status = 'ROULETTE';
                this.broadcastToRoom(roomId, {
                    type: 'ROUND_FINISHED',
                    winner,
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
