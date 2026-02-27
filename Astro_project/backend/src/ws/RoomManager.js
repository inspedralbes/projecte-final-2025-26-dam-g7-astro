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
        this.roundFinishedPlayers = new Map(); // roomId -> Set de jugadores que han terminado
    }

    init(getCollections, wss) {
        this.getCollections = getCollections;
        this.wss = wss;
        console.log("🛠️ RoomManager inicializado con acceso a DB y WSS");
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
            const availableRooms = await rooms.find({ status: 'LOBBY', isPublic: true }).toArray();
            this.broadcastGlobal({
                type: 'GLOBAL_ROOMS_UPDATE',
                rooms: availableRooms
            });
        } catch (error) {
            console.error("❌ Error sincronizando salas globales:", error);
        }
    }

    async createRoom(host, isPublic = true, maxPlayers = 4) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const roomData = {
            id: roomId,
            host,
            players: [host],
            maxPlayers,
            status: 'LOBBY',
            isPublic,
            createdAt: new Date()
        };

        this.rooms.set(roomId, {
            host,
            players: new Set([host]),
            maxPlayers,
            status: 'LOBBY',
            isPublic,
            gameConfig: {
                pointsToWin: 3, // Por defecto (ahora = totalRounds)
                totalRounds: 3,
                currentRound: 0,
                scores: { [host]: 0 },
                currentGame: null
            }
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
        // Reset scores
        room.gameConfig.scores = {};
        room.gameConfig.currentRound = 0;
        room.gameConfig.totalRounds = room.gameConfig.pointsToWin || 3;
        room.players.forEach(p => room.gameConfig.scores[p] = 0);

        // Seleccionar primer juego
        const randomGame = this.availableGames[Math.floor(Math.random() * this.availableGames.length)];
        room.gameConfig.currentGame = randomGame;

        this.broadcastToRoom(roomId, {
            type: 'MATCH_STARTING',
            room: this.getRoom(roomId)
        });

        return { success: true };
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

    startRoundTimer(roomId) {
        if (this.roundTimers.has(roomId)) {
            clearTimeout(this.roundTimers.get(roomId));
        }

        const timerId = setTimeout(() => {
            console.log(`⏰ [Room ${roomId}] Tiempo agotado por servidor. Forzando fin de ronda.`);
            this.finalizeRound(roomId);
        }, 65000);

        this.roundTimers.set(roomId, timerId);
    }

    async handlePlayerFinished(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;

        // En el nuevo modo "primero que acaba", finalizamos al recibir el primer aviso
        console.log(`👤 [Room ${roomId}] Jugador ${user} ha terminado el juego primero. Finalizando ronda.`);

        this.finalizeRound(roomId, user);
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

            room.status = 'GAME_OVER';
            setTimeout(() => {
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_FINISHED',
                    winner: matchWinner,
                    room: this.getRoom(roomId)
                });
            }, 3000);
        } else {
            // Todavía quedan rondas, pasar a la siguiente
            room.status = 'ROUND_RESULTS';
            const nextGame = this.availableGames[Math.floor(Math.random() * this.availableGames.length)];
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
}

module.exports = new RoomManager();
