const { ROSCO_ROLES } = require('../constants/rosco');

class RoomManager {
    constructor() {
        // user -> ws
        this.sessions = new Map();
        // roomId -> { host, players: Set<username>, maxPlayers, status, gameConfig: { pointsToWin, currentGame, scores: {} } }
        this.rooms = new Map();
        this.roomRepo = null;
        this.userRepo = null;
        this.gameService = null;
        this.wss = null;
        this.availableGames = [
            'RadarScan',
            'RadioSignal',
            'RhymeSquad',
            'SpelledRosco',
            'SyllableQuest',
            'SymmetryBreaker',
            'WordConstruction'
        ];
        this.roundTimers = new Map();
        this.roundGameScores = new Map();
        this.roundFinishedPlayers = new Map(); // roomId -> Set de jugadors que han acabat
        this.playedGames = new Map();          // roomId -> Set de jocs ja jugats (general)
        this.playerPlayedGames = new Map();    // username -> Set de jocs ja jugats en el torneig actual
        this.returnedToLobbyPlayers = new Map(); // roomId -> Set de jugadors que han tornat al lobby
        this.userToRoom = new Map();           // user -> roomId

        // Duracions per defecte de cada minijoc
        this.gameDurations = {
            'RadarScan': 600000,
            'RadioSignal': 600000,
            'RhymeSquad': 600000,
            'SpelledRosco': 600000,
            'SymmetryBreaker': 600000,
            'WordConstruction': 600000,
            'SyllableQuest': 600000
        };
        this.gcInterval = null;
    }

    stop() {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
    }

    init(roomRepository, userRepository, wss, gameService, inventoryService) {
        this.roomRepo = roomRepository;
        this.userRepo = userRepository;
        this.wss = wss;
        this.gameService = gameService;
        this.inventoryService = inventoryService;
        console.log("🛠️ RoomManager inicializado con Repositorios, WSS, GameService e InventoryService");

        // Garbage Collector: Limpieza de salas inactivas cada 5 minutos
        if (this.gcInterval) clearInterval(this.gcInterval);
        this.gcInterval = setInterval(async () => {
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

        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Sala no encontrada' };

        if (room.players.size >= room.maxPlayers && !room.players.has(user)) {
            return { error: 'La nave ya ha alcanzado su capacidad máxima' };
        }

        if (this.userToRoom.has(user) && this.userToRoom.get(user) !== roomId) {
            const oldRoomId = this.userToRoom.get(user);
            console.log(`[RoomManager] Usuario ${user} ya está en la sala ${oldRoomId}. Forzando salida para unirse a ${roomId}.`);
            await this.leaveRoom(oldRoomId, user);
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
                            avatar: user.avatar || 'Astronauta_blanc.jpg',
                            lives: this.inventoryService ? this.inventoryService.getInventoryQuantity(user.inventory, 1) : 0
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

    async updateBossStakes(roomId, user, lives) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        this.updateRoomActivity(roomId);

        if (!room.gameConfig.bossStakes) room.gameConfig.bossStakes = {};
        room.gameConfig.bossStakes[user] = lives;

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
        const isTournament = room.gameConfig.mode === 'TOURNAMENT';
        const isBossMode = room.gameConfig.mode === "BOSS" || room.gameConfig.modality === "boss";

        // RESTRICCIÓN 2vs2: Equipos pares de 2 obligatorios
        if (room.gameConfig.modality === "2vs2") {
            const teams = {};
            Object.values(room.gameConfig.teams || {}).forEach(t => teams[t] = (teams[t] || 0) + 1);
            const invalidTeams = Object.keys(teams).filter(t => teams[t] !== 2);
            if (invalidTeams.length > 0 || Object.keys(teams).length < 1) {
                return { error: "Misió avortada: El mode 2vs2 requereix equips de exactament 2 exploradors." };
            }
        }

        if (isTournament) {
            const buyIn = room.gameConfig.buyIn || 0;
            
            // 1. Validar que TODOS tengan saldo suficiente
            if (buyIn > 0 && this.userRepo) {
                const poorPlayers = [];
                for (const username of room.players) {
                    try {
                        const user = await this.userRepo.findByUsername(username);
                        if (!user || (user.coins || 0) < buyIn) {
                            poorPlayers.push(username);
                        }
                    } catch (e) {
                        poorPlayers.push(username);
                    }
                }

                if (poorPlayers.length > 0) {
                    const names = poorPlayers.join(', ');
                    return { error: `Missió avortada: ${names} no tenen prous Astrocions per la quota de ${buyIn}. Reduïu el cost d'entrada!` };
                }

                // 2. Si todos tienen saldo, procedemos a cobrar
                for (const username of room.players) {
                    try {
                        const user = await this.userRepo.findByUsername(username);
                        if (user) {
                            user.coins -= buyIn;
                            await this.userRepo.save(user);
                            this.sendToUser(username, {
                                type: 'PROFILE_UPDATE',
                                coins: user.coins
                            });
                        }
                    } catch (e) {
                        console.error(`Error cobrando a ${username}:`, e);
                    }
                }
            }

            room.status = 'TOURNAMENT_BRACKETS';
            room.gameConfig.tournament = {
                round: 1,
                brackets: this.generateBrackets(Array.from(room.players))
            };

            // Inicio automático tras 15 segundos
            setTimeout(() => {
                this.launchTournamentRound(roomId);
            }, 15000);
        } else {
            room.status = isRace ? 'PLAYING' : 'ROULETTE';
        }

        if (room.idleTimer) {
            clearTimeout(room.idleTimer);
            room.idleTimer = null;
        }

        if (!room.gameConfig.scores) room.gameConfig.scores = {};
        if (!room.gameConfig.teams) room.gameConfig.teams = {};
        if (!room.gameConfig.subRoles) room.gameConfig.subRoles = {};
 
        // Inicialización Modo Jefe con validación de Inventario (Vidas)
        if (isBossMode) {
            const players = Array.from(room.players);
            
            // EL JEFE SE ELIGE PRIMERO PARA EXIMIRLO DEL PAGO/VIDAS
            const boss = players[Math.floor(Math.random() * players.length)];
            room.gameConfig.boss = boss;
            room.gameConfig.bossHP = 100;
            room.gameConfig.mode = 'BOSS';
            room.gameConfig.heroHealth = {};
            room.gameConfig.lastBossAttack = 0;
            
            const stakes = room.gameConfig.bossStakes || {};
            
            // Validar que los HÉROES tengan suficientes vidas para su apuesta
            for (const p of players) {
                if (p === boss) continue; // El jefe no necesita vidas

                const userObj = await this.userRepo.findByUsername(p);
                const numPacks = Math.max(1, stakes[p] || 1);
                const available = this.inventoryService ? this.inventoryService.getInventoryQuantity(userObj.inventory, 1) : 0;
                
                if (available < numPacks) {
                    console.error(`❌ [RoomManager] El jugador ${p} no tiene suficientes Packs de Vidas (${available}/${numPacks}).`);
                    this.broadcastToRoom(roomId, {
                        type: 'ERROR',
                        message: `La partida no pot començar. L'explorador ${p} no té prous Packs de Vidas per la seva aposta (${numPacks}).`
                    });
                    return { error: 'Vidas insuficientes' };
                }
            }

            // Consumir Packs de Vidas solo de los HÉROES
            for (const p of players) {
                room.gameConfig.scores[p] = 0;
                
                if (p === boss) {
                    room.gameConfig.teams[p] = 'BOSS';
                    continue;
                }

                room.gameConfig.teams[p] = 'HEROES';
                const numPacks = Math.max(1, stakes[p] || 1);
                room.gameConfig.heroHealth[p] = 12 * numPacks;

                try {
                    const userObj = await this.userRepo.findByUsername(p);
                    let normalized = this.inventoryService.normalizeInventoryEntries(userObj.inventory);
                    const idx = normalized.findIndex(item => item.id === 1);
                    if (idx !== -1) {
                        normalized[idx].quantity -= numPacks;
                        if (normalized[idx].quantity <= 0) normalized.splice(idx, 1);
                        
                        userObj.inventory = this.inventoryService.serializeInventory(normalized);
                        await this.userRepo.update(userObj);
                        console.log(`📉 [RoomManager] Consumidos ${numPacks} Packs de Vidas de ${p} (HÉROE)`);
                        
                        this.sendToUser(p, {
                            type: 'PROFILE_UPDATE',
                            inventory: this.inventoryService.enrichInventory(userObj.inventory)
                        });
                    }
                } catch (err) {
                    console.error(`❌ Error consumiendo vidas de hero ${p}:`, err);
                }
            }
        } else {
            // Reset scores for a new match but keep teams if they exist
            room.players.forEach(p => {
                room.gameConfig.scores[p] = 0;
            });
        }

        if (!isTournament) {
            room.gameConfig.currentRound = 0;
            room.gameConfig.totalRounds = room.gameConfig.pointsToWin || 3;
            room.gameConfig.roundHistory = [];
            this.playedGames.set(roomId, new Set());

            const firstGame = this.pickNextGame(roomId);
            room.gameConfig.currentGame = firstGame;

            await this.assignRoles(roomId, firstGame, false);
        }

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, {
            type: 'MATCH_STARTING',
            room: roomUpdate,
            currentGame: room.gameConfig.currentGame
        });

        return { success: true };
    }

    async launchTournamentRound(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || !room.gameConfig.tournament) return;

        console.log(`[TOURNAMENT] Intentando lanzar ronda para sala ${roomId}`);

        const tournament = room.gameConfig.tournament;
        // Buscamos la primera partida que esté WAITING en la ronda actual
        const nextMatch = tournament.brackets.find(m => m.status === 'WAITING' && m.round === tournament.round);

        if (nextMatch) {
            console.log(`[TOURNAMENT] Lanzando duelo: ${nextMatch.p1} vs ${nextMatch.p2}`);
            nextMatch.status = 'PLAYING';
            
            // Pasamos los participantes para elegir un juego que no hayan jugado
            const game = this.pickNextGame(roomId, [nextMatch.p1, nextMatch.p2]);
            room.gameConfig.currentGame = game;
            room.lastPlayedGame = game;
            room.gameConfig.seed = Math.floor(Math.random() * 1000000);
            room.gameConfig.sharedChallenge = true;

            // Marcar el juego como jugado para cada uno de los participantes
            [nextMatch.p1, nextMatch.p2].forEach(p => {
                if (!p) return;
                let userGames = this.playerPlayedGames.get(p);
                if (!userGames) {
                    userGames = new Set();
                    this.playerPlayedGames.set(p, userGames);
                }
                userGames.add(game);
            });

            // Forzamos roles de 1v1 para el torneo
            room.gameConfig.teams = { [nextMatch.p1]: 'team-1', [nextMatch.p2]: 'team-2' };
            room.gameConfig.subRoles = { [nextMatch.p1]: null, [nextMatch.p2]: null };

            // Usamos setRoomStatus para inicializar el juego (scores, timers, datos específicos)
            // Esto también enviará un ROOM_UPDATE
            await this.setRoomStatus(roomId, 'PLAYING');
            
            // Enviamos MATCH_STARTING para que el frontend inicie el componente de juego o espectador
            const roomUpdate = await this.getRoom(roomId);
            this.broadcastToRoom(roomId, {
                type: 'MATCH_STARTING',
                room: roomUpdate,
                currentGame: game
            });
            
            console.log(`[TOURNAMENT] Combate lanzado: ${game} (Seed: ${room.gameConfig.seed})`);
        } else {
            console.log(`[TOURNAMENT] No hay partidas WAITING en ronda ${tournament.round}. Avanzando ronda.`);
            this.handleTournamentRoundEnd(roomId);
        }
    }

    generateBrackets(players, round = 1) {
        const shuffled = [...players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const brackets = [];
        // Generamos la ronda especificada
        for (let i = 0; i < shuffled.length; i += 2) {
            const matchId = `round${round}-m${i / 2}`;
            if (i + 1 < shuffled.length) {
                brackets.push({
                    id: matchId,
                    round: round,
                    p1: shuffled[i],
                    p2: shuffled[i + 1],
                    winner: null,
                    status: 'WAITING'
                });
            } else {
                // Bye (pasa directo si es impar)
                brackets.push({
                    id: matchId,
                    round: round,
                    p1: shuffled[i],
                    p2: null,
                    winner: shuffled[i],
                    status: 'FINISHED'
                });
            }
        }
        return brackets;
    }

    pickNextGame(roomId, players = []) {
        const room = this.rooms.get(roomId);
        const playedInRoom = this.playedGames.get(roomId) || new Set();

        let pool = this.availableGames;
        if (room.lastPlayedGame) {
            pool = pool.filter(g => g !== room.lastPlayedGame);
        }

        // Si pasamos jugadores (Torneo), buscamos un juego que NINGUNO de ellos haya jugado
        if (players.length > 0) {
            const forbiddenGames = new Set();
            players.forEach(p => {
                const pGames = this.playerPlayedGames.get(p) || new Set();
                pGames.forEach(g => forbiddenGames.add(g));
            });

            let filteredPool = pool.filter(g => !forbiddenGames.has(g));

            // Si todos los juegos han sido jugados por alguno, usamos la lista de la sala
            if (filteredPool.length === 0) {
                filteredPool = this.availableGames.filter(g => !playedInRoom.has(g));
            }
            if (filteredPool.length > 0) pool = filteredPool;
        } else {
            let filteredPool = this.availableGames.filter(g => !playedInRoom.has(g));
            if (filteredPool.length > 0) pool = filteredPool;
        }

        // Filtro adicional para Torneo (todos los juegos competitivos)
        if (room && room.gameConfig.mode === 'TOURNAMENT') {
            const competitiveGames = [
                'WordConstruction',
                'SymmetryBreaker',
                'SyllableQuest',
                'RadarScan',
                'RadioSignal',
                'RhymeSquad',
                'SpelledRosco'
            ];
            pool = pool.filter(g => competitiveGames.includes(g));
            if (pool.length === 0) pool = competitiveGames;
        }

        const game = pool[Math.floor(Math.random() * pool.length)];
        playedInRoom.add(game);
        this.playedGames.set(roomId, playedInRoom);
        return game;
    }

    async assignRoles(roomId, gameName, rotate = false) {
        const room = this.rooms.get(roomId);
        if (!room || !room.gameConfig) return;

        if (!room.gameConfig.teams) room.gameConfig.teams = {};
        if (!room.gameConfig.subRoles) room.gameConfig.subRoles = {};

        const playerArray = Array.from(room.players);

        if (room.gameConfig.mode === 'RACE') {
            playerArray.forEach(p => {
                room.gameConfig.teams[p] = p; // Cada uno en su equipo (su propio nombre)
                room.gameConfig.subRoles[p] = null;
            });
            return;
        }

        const isPairGame = ['RadioSignal', 'SpelledRosco', 'RhymeSquad', 'RadarScan', 'SyllableQuest'].includes(gameName);

        // Si ya hay equipos asignados en el lobby para todos los jugadores de la sala, los preservamos.
        // Si no hay equipos asignados o faltan jugadores, los asignamos por defecto.
        const hasPredefinedTeams = playerArray.every(p => room.gameConfig.teams[p] !== undefined && room.gameConfig.teams[p] !== null);

        if (!hasPredefinedTeams) {
            const half = Math.ceil(playerArray.length / 2);
            playerArray.forEach((p, index) => {
                if (isPairGame) {
                    const pairIndex = Math.floor(index / 2);
                    room.gameConfig.teams[p] = `team-${pairIndex + 1}`;
                } else {
                    room.gameConfig.teams[p] = (index < half) ? 'red' : 'blue';
                }
            });
        }

        playerArray.forEach((p, index) => {
            if (!room.gameConfig.scores[p]) room.gameConfig.scores[p] = 0;
            room.gameConfig.subRoles[p] = null; // Inicializar sub-rol a nulo por defecto
        });

        if (isPairGame) {
            // Agrupar jugadores por su identificador de equipo
            const teamsMap = {};
            playerArray.forEach(p => {
                const tId = room.gameConfig.teams[p] || 'team-default';
                if (!teamsMap[tId]) teamsMap[tId] = [];
                teamsMap[tId].push(p);
            });

            // Asignar sub-roles alternados de manera consistente para los miembros de cada equipo
            Object.entries(teamsMap).forEach(([tId, teamPlayers]) => {
                teamPlayers.forEach((p, index) => {
                    const roleIndex = rotate ? (index + 1) : index;

                    if (gameName === 'SpelledRosco') {
                        room.gameConfig.subRoles[p] = (roleIndex % 2 === 0) ? ROSCO_ROLES.SENDER : ROSCO_ROLES.GUESSER;
                    } else if (gameName === 'RhymeSquad') {
                        room.gameConfig.subRoles[p] = (roleIndex % 2 === 0) ? 'catcher' : 'sniper';
                    } else {
                        room.gameConfig.subRoles[p] = (roleIndex % 2 === 0) ? 'listener' : 'writer';
                    }
                });
            });
        }
    }

    async setRoomStatus(roomId, status) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        this.updateRoomActivity(roomId);
        room.status = status;
        room.isFinishingRound = false; // Reset transitioning flag on state change

        // Si cambiamos a cualquier estado que no sea PLAYING, asegurar de limpiar el timer
        if (status !== 'PLAYING') {
            if (this.roundTimers.has(roomId)) {
                clearInterval(this.roundTimers.get(roomId));
                this.roundTimers.delete(roomId);
            }
        }

        if (status === 'PLAYING') {
            try {
                const currentGame = room.gameConfig.currentGame;
                const playerArray = Array.from(room.players);
                const isPairGame = ['RadioSignal', 'SpelledRosco', 'RhymeSquad', 'RadarScan', 'SyllableQuest'].includes(currentGame);
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

                this.roundGameScores.set(roomId, new Map());
                this.roundFinishedPlayers.set(roomId, new Set());
                this.startRoundTimer(roomId);

                const roomUpdate = await this.getRoom(roomId);
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_STARTING',
                    room: roomUpdate,
                    currentGame: currentGame
                });
                return;
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
            clearInterval(this.roundTimers.get(roomId));
            this.roundTimers.delete(roomId);
        }

        const currentGame = room.gameConfig.currentGame || 'default';
        let durationSeconds = (this.gameDurations[currentGame] || 60000) / 1000;

        // DUELO 1vs1 / 2vs2 / TORNEO: Tiempo individual base 60s, tiempo global de seguridad 180s
        if (room.gameConfig.modality === "1vs1" || room.gameConfig.modality === "2vs2" || room.gameConfig.mode === "TOURNAMENT") {
            durationSeconds = 180;
            // RESETEAR tiempos individuales para cada ronda
            room.gameConfig.playerTimes = {};
            
            let activeParticipants = [];
            if (room.gameConfig.mode === "TOURNAMENT") {
                const currentMatch = room.gameConfig.tournament?.brackets?.find(m => m.status === 'PLAYING');
                if (currentMatch) {
                    activeParticipants = [currentMatch.p1, currentMatch.p2].filter(p => p !== null);
                }
            } else if (room.gameConfig.modality === "1vs1") {
                // En 1vs1, solo juegan los primeros 2 participantes (el host y el rival)
                activeParticipants = Array.from(room.players).slice(0, 2);
            } else if (room.gameConfig.modality === "2vs2") {
                activeParticipants = Array.from(room.players);
            }
            
            if (activeParticipants.length === 0) {
                activeParticipants = Array.from(room.players);
            }
            
            activeParticipants.forEach(p => room.gameConfig.playerTimes[p] = 60);
        }
        
        // En Modo Boss el tiempo es virtualmente infinito (se decide por salud)
        if (room.gameConfig.mode === 'BOSS') {
            durationSeconds = 3600; 
        }

        room.gameConfig.timeLeft = durationSeconds;
        room.roundEndTime = Date.now() + (durationSeconds * 1000);

        const timer = setInterval(() => {
            const r = this.rooms.get(roomId);
            if (!r || r.status !== 'PLAYING') {
                clearInterval(timer);
                this.roundTimers.delete(roomId);
                return;
            }

            const now = Date.now();
            const remaining = Math.ceil((r.roundEndTime - now) / 1000);
            // Decrementar tiempos individuales si existen
            if (r.gameConfig.playerTimes) {
                const finished = this.roundFinishedPlayers.get(roomId) || new Set();
                Object.keys(r.gameConfig.playerTimes).forEach(p => {
                    if (!finished.has(p) && r.gameConfig.playerTimes[p] > 0) {
                        r.gameConfig.playerTimes[p]--;
                        if (r.gameConfig.playerTimes[p] <= 0) {
                            console.log(`[Room ${roomId}] Jugador ${p} se ha quedado sin tiempo individual.`);
                            this.handlePlayerFinished(roomId, p);
                        }
                    }
                });
            }
            r.gameConfig.timeLeft = Math.max(0, remaining);

            // Sync cada segundo para evitar lagazos de red y mantener el HUD perfectamente sincronizado en tiempo real
            this.broadcastToRoom(roomId, {
                type: 'TIME_UPDATE',
                timeLeft: r.gameConfig.timeLeft,
                playerTimes: r.gameConfig.playerTimes
            });

            if (remaining <= 0) {
                clearInterval(timer);
                this.roundTimers.delete(roomId);
                console.log(`[Room ${roomId}] Tiempo agotado para la ronda.`);
                this.finishRound(roomId);
            }
        }, 1000);

        this.roundTimers.set(roomId, timer);
    }

    async handlePlayerFinished(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;
        this.updateRoomActivity(roomId);

        let finished = this.roundFinishedPlayers.get(roomId);
        if (!finished) {
            finished = new Set();
            this.roundFinishedPlayers.set(roomId, finished);
        }

        if (finished.has(user)) return; // Evitar procesar dos veces al mismo jugador
        finished.add(user);

        // En modo TORNEO, solo esperamos a los 2 participantes del duelo actual
        if (room.gameConfig.mode === 'TOURNAMENT') {
            const currentMatch = room.gameConfig.tournament.brackets.find(m => m.status === 'PLAYING');
            if (currentMatch) {
                const participants = [currentMatch.p1, currentMatch.p2].filter(p => p !== null);
                const participantsFinished = participants.filter(p => finished.has(p));
                console.log(`[TOURNAMENT] Esperando participantes: ${participantsFinished.length}/${participants.length}`);
                if (participantsFinished.length >= participants.length) {
                    this.finishRound(roomId);
                }
                return;
            }
        }

        console.log(`[Room ${roomId}] Jugador ${user} ha terminado la ronda. (${finished.size} terminados)`);

        // Si todos los jugadores activos que tienen asignados tiempos individuales en la ronda han terminado, avanzamos
        if (room.gameConfig.playerTimes) {
            const activePlayers = Object.keys(room.gameConfig.playerTimes);
            const activeFinished = activePlayers.filter(p => finished.has(p) || room.gameConfig.playerTimes[p] <= 0);
            
            console.log(`[Room ${roomId}] Progreso de finalización de ronda: ${activeFinished.length}/${activePlayers.length} jugadores listos.`);
            if (activeFinished.length >= activePlayers.length) {
                this.finishRound(roomId);
            }
        } else {
            // Fallback clásico
            if (finished.size >= room.players.size) {
                this.finishRound(roomId);
            }
        }
    }

    async finishRound(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'PLAYING' || room.isFinishingRound) return;
        room.isFinishingRound = true;

        // LÓGICA MODO JEFE: Devolver vida a los supervivientes
        if (room.gameConfig.mode === 'BOSS') {
            const heroesWon = room.gameConfig.bossHP <= 0;
            if (heroesWon) {
                console.log(`[Room ${roomId}] ¡HÉROES HAN GANADO! Devolviendo tickets a supervivientes...`);
                for (const p of room.players) {
                    if (room.gameConfig.boss !== p && (room.gameConfig.heroHealth[p] || 0) > 0) {
                        const stake = room.gameConfig.bossStakes?.[p] || 1;
                        await this.refundLifePack(p, stake);
                    }
                }
            }
        }

        this.updateRoomActivity(roomId);

        if (this.roundTimers.has(roomId)) {
            clearInterval(this.roundTimers.get(roomId));
            this.roundTimers.delete(roomId);
        }

        console.log(`[Room ${roomId}] Finalizando ronda ${room.gameConfig.currentRound + 1}`);

        const roundScores = this.roundGameScores.get(roomId) || new Map();
        const hasTeams = room.gameConfig.teams && Object.keys(room.gameConfig.teams).length > 0;
        let winner = null;
        let maxScore = -1;
        let tie = false;

        // Si es modo 2vs2 con tiempos individuales, el ganador de la ronda se decide por tiempo grupal restante
        if (room.gameConfig.playerTimes && room.gameConfig.modality === '2vs2') {
            const teamTimes = {};
            const teamScores = {};

            Object.entries(room.gameConfig.playerTimes).forEach(([u, t]) => {
                const teamId = room.gameConfig.teams[u];
                if (teamId) {
                    teamTimes[teamId] = (teamTimes[teamId] || 0) + t;
                    const s = roundScores.get(u) || 0;
                    teamScores[teamId] = (teamScores[teamId] || 0) + s;
                }
            });

            console.log(`[Room ${roomId}] Determinando ganador 2vs2 por tiempos grupales:`, teamTimes);

            let winningTeam = null;
            let maxTime = -1;
            let timeTie = false;

            Object.entries(teamTimes).forEach(([tId, t]) => {
                if (t > maxTime) {
                    maxTime = t;
                    winningTeam = tId;
                    timeTie = false;
                } else if (t === maxTime && maxTime > 0) {
                    timeTie = true;
                }
            });

            if (maxTime <= 0) {
                // Si nadie tiene tiempo, desempatar por la puntuación total del equipo en la ronda
                let maxScore = -1;
                Object.entries(teamScores).forEach(([tId, s]) => {
                    if (s > maxScore) {
                        maxScore = s;
                        winningTeam = tId;
                        tie = false;
                    } else if (s === maxScore && maxScore > 0) {
                        tie = true;
                    }
                });
                if (maxScore <= 0) {
                    winningTeam = null;
                    tie = true;
                }
            } else if (timeTie) {
                // Desempate por puntuación si hay empate en tiempos
                let maxScore = -1;
                Object.entries(teamScores).forEach(([tId, s]) => {
                    if (s > maxScore) {
                        maxScore = s;
                        winningTeam = tId;
                        tie = false;
                    } else if (s === maxScore && maxScore > 0) {
                        tie = true;
                    }
                });
                if (maxScore <= 0 || tie) {
                    winningTeam = null;
                    tie = true;
                }
            } else {
                tie = false;
            }

            if (winningTeam && !tie) {
                winner = winningTeam;
                room.players.forEach(p => {
                    if (room.gameConfig.teams[p] === winningTeam) {
                        room.gameConfig.scores[p] = (room.gameConfig.scores[p] || 0) + 1;
                    }
                });
            }
        } else if (room.gameConfig.playerTimes && (room.gameConfig.modality === '1vs1' || room.gameConfig.mode === 'TOURNAMENT')) {
            let activeParticipants = [];
            if (room.gameConfig.mode === "TOURNAMENT") {
                const currentMatch = room.gameConfig.tournament?.brackets?.find(m => m.status === 'PLAYING' || m.status === 'FINISHED');
                if (currentMatch) {
                    activeParticipants = [currentMatch.p1, currentMatch.p2].filter(p => p !== null);
                }
            } else if (room.gameConfig.modality === "1vs1") {
                activeParticipants = Array.from(room.players).slice(0, 2);
            }
            
            if (activeParticipants.length === 0) {
                activeParticipants = Object.keys(room.gameConfig.playerTimes);
            }

            if (activeParticipants.length === 2) {
                const [p1, p2] = activeParticipants;
                const t1 = room.gameConfig.playerTimes[p1] || 0;
                const t2 = room.gameConfig.playerTimes[p2] || 0;
                
                const s1 = roundScores.get(p1) || 0;
                const s2 = roundScores.get(p2) || 0;

                console.log(`[Room ${roomId}] Determinando ganador 1vs1 por tiempo y puntuación: ${p1}=${t1}s (${s1}pts), ${p2}=${t2}s (${s2}pts)`);
                
                if (s1 === 0 && s2 === 0) {
                    // Si ambos obtuvieron 0 puntos, es un empate absoluto
                    winner = null;
                    tie = true;
                } else if (t1 > t2) {
                    winner = p1;
                    tie = false;
                } else if (t2 > t1) {
                    winner = p2;
                    tie = false;
                } else {
                    // Si empatan en tiempo (por ejemplo, ambos llegan a 0s), gana el de mayor puntuación en esta ronda
                    if (s1 > s2) {
                        winner = p1;
                        tie = false;
                    } else if (s2 > s1) {
                        winner = p2;
                        tie = false;
                    } else {
                        tie = true;
                    }
                }
            } else {
                // Fallback a puntuación si no hay exactamente 2 jugadores
                Array.from(roundScores.entries()).forEach(([u, s]) => {
                    if (s > maxScore) {
                        maxScore = s;
                        winner = u;
                        tie = false;
                    } else if (s === maxScore && maxScore > 0) {
                        tie = true;
                    }
                });

                if (maxScore <= 0) {
                    winner = null;
                    tie = true;
                }
            }

            if (winner && !tie) {
                if (!room.gameConfig.scores) room.gameConfig.scores = {};
                room.gameConfig.scores[winner] = (room.gameConfig.scores[winner] || 0) + 1;
            }
        } else if (hasTeams) {
            const teamScores = {};
            Array.from(roundScores.entries()).forEach(([u, s]) => {
                const teamId = room.gameConfig.teams[u];
                if (teamId) {
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

            if (maxScore <= 0) {
                winningTeam = null;
                tie = true;
            }

            if (winningTeam && !tie) {
                winner = winningTeam;
                room.players.forEach(p => {
                    if (room.gameConfig.teams[p] === winningTeam) {
                        room.gameConfig.scores[p] = (room.gameConfig.scores[p] || 0) + 1;
                    }
                });
            }
        } else {
            // Lógica individual clásica
            Array.from(roundScores.entries()).forEach(([u, s]) => {
                if (s > maxScore) {
                    maxScore = s;
                    winner = u;
                    tie = false;
                } else if (s === maxScore && maxScore > 0) {
                    tie = true;
                }
            });

            if (maxScore <= 0) {
                winner = null;
                tie = true;
            }

            if (winner && !tie) {
                room.gameConfig.scores[winner] = (room.gameConfig.scores[winner] || 0) + 1;
            }
        }

        // Si es modo TORNEO y hay empate, entramos en SUDDEN_DEATH
        if (tie && room.gameConfig.mode === 'TOURNAMENT') {
            console.log(`[Room ${roomId}] ¡EMPATE DETECTADO! Iniciando MUERTE SÚBITA.`);
            room.status = 'SUDDEN_DEATH';
            const roomUpdate = await this.getRoom(roomId);
            this.broadcastToRoom(roomId, {
                type: 'SUDDEN_DEATH_START',
                room: roomUpdate
            });
            return; // Detener el flujo normal de fin de ronda
        }

        if (winner && !tie) {
            console.log(`[Room ${roomId}] Ganador de ronda: ${winner}`);
        }

        // Guardar en el historial de la partida para la gráfica final
        if (!room.gameConfig.roundHistory) room.gameConfig.roundHistory = [];
        room.gameConfig.roundHistory.push({
            round: room.gameConfig.currentRound + 1,
            game: room.gameConfig.currentGame,
            winner: winner,
            tie: tie,
            currentScores: Object.fromEntries(roundScores)
        });

            // Si es modo TORNEO, actualizamos el bracket
        if (room.gameConfig.mode === 'TOURNAMENT') {
            const tournament = room.gameConfig.tournament;
            const currentMatch = tournament.brackets.find(m => m.status === 'PLAYING');
            if (currentMatch) {
                currentMatch.winner = winner; 
                currentMatch.status = 'FINISHED';
            }
            
            // 3.1 Transición automática a resultados y luego al árbol
            room.status = 'MATCH_RESULTS'; 
            room.gameConfig.currentGame = null; // LIMPIAR JUEGO PARA VOLVER AL ARBOL
            console.log(`[TOURNAMENT] Combate finalizado. Mostrando resultados por 3s.`);
            
            const resultsUpdate = await this.getRoom(roomId);
            const tournamentWinner = currentMatch ? currentMatch.winner : null;

            this.broadcastToRoom(roomId, {
                type: 'MATCH_FINISHED',
                winner: tournamentWinner,
                room: resultsUpdate
            });

            setTimeout(async () => {
                const r = this.rooms.get(roomId);
                if (!r) return;

                // 2. Mostrar el árbol del torneo por 7 segundos
                r.status = 'TOURNAMENT_BRACKETS';
                r.gameConfig.tournament.nextMatchStartTime = Date.now() + 7000;
                const treeUpdate = await this.getRoom(roomId);
                this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', room: treeUpdate });

                setTimeout(() => {
                    const roomStillExists = this.rooms.get(roomId);
                    if (!roomStillExists || roomStillExists.status !== 'TOURNAMENT_BRACKETS') return;

                    const tournament = roomStillExists.gameConfig.tournament;
                    const nextMatch = tournament.brackets.find(m => m.status === 'WAITING' && m.round === tournament.round);

                    if (nextMatch) {
                        console.log(`[TOURNAMENT] Lanzando automáticamente el siguiente duelo.`);
                        this.launchTournamentRound(roomId);
                    } else {
                        console.log(`[TOURNAMENT] No hay más duelos en esta ronda. Avanzando ronda.`);
                        this.handleTournamentRoundEnd(roomId);
                    }
                }, 7000);
            }, 3000);

            return; // Importante para no ejecutar la lógica de modo normal
        }

        // Lógica para modos normales (No Torneo)
        winner = null;
        if (room.gameConfig.scores) {
            if (room.gameConfig.modality === '2vs2') {
                const teamTotalScores = {};
                Object.entries(room.gameConfig.scores).forEach(([p, s]) => {
                    const teamId = room.gameConfig.teams[p];
                    if (teamId) {
                        teamTotalScores[teamId] = Math.max(teamTotalScores[teamId] || 0, s);
                    }
                });
                const sortedTeams = Object.entries(teamTotalScores).sort((a, b) => b[1] - a[1]);
                if (sortedTeams.length > 0) {
                    if (sortedTeams.length === 1 || sortedTeams[0][1] > sortedTeams[1][1]) {
                        winner = sortedTeams[0][0];
                    }
                }
            } else {
                const sorted = Object.entries(room.gameConfig.scores).sort((a,b) => b[1] - a[1]);
                if (sorted.length > 0) {
                    if (sorted.length === 1 || sorted[0][1] > sorted[1][1]) {
                        winner = sorted[0][0];
                    }
                }
            }
        }
        room.gameConfig.winner = winner;

        if (room.gameConfig.currentRound >= (room.gameConfig.totalRounds || 3) - 1) {
            room.status = 'MATCH_RESULTS';
            const roomUpdate = await this.getRoom(roomId);
            this.broadcastToRoom(roomId, {
                type: 'MATCH_FINISHED',
                winner: winner,
                room: roomUpdate
            });
            this.registerMultiplayerResults(room);
        } else {
            room.gameConfig.currentRound++;
            // Si es modo 1vs1 o cualquier modo normal, elegir el siguiente minijuego diferente
            const nextGame = this.pickNextGame(roomId);
            room.gameConfig.currentGame = nextGame;
            room.lastPlayedGame = nextGame;
            
            // Reasignar roles para el nuevo minijuego
            await this.assignRoles(roomId, nextGame, true);

            await this.setRoomStatus(roomId, 'ROULETTE');
        }
    }

    async finishRoundWithWinner(roomId, winner) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        console.log(`[SUDDEN DEATH] Winner forced: ${winner}`);
        
        // Detener cualquier timer de Sudden Death si existiera
        if (this.roundTimers.has(roomId)) {
            clearInterval(this.roundTimers.get(roomId));
            this.roundTimers.delete(roomId);
        }

        // Asignar punto de victoria
        if (!room.gameConfig.scores) room.gameConfig.scores = {};
        room.gameConfig.scores[winner] = (room.gameConfig.scores[winner] || 0) + 1;

        if (room.gameConfig.mode === 'TOURNAMENT') {
            const tournament = room.gameConfig.tournament;
            const match = tournament.brackets.find(m => m.status === 'PLAYING' || m.status === 'SUDDEN_DEATH');
            if (match) {
                match.status = 'FINISHED';
                match.winner = winner;
                match.endTime = Date.now();

                // 1. Mostrar resultados del duelo por 3 segundos
                room.status = 'MATCH_RESULTS';
                const roomUpdate = await this.getRoom(roomId);
                this.broadcastToRoom(roomId, {
                    type: 'MATCH_FINISHED',
                    winner: winner,
                    room: roomUpdate
                });

                setTimeout(async () => {
                    const r = this.rooms.get(roomId);
                    if (!r) return;

                    const tournament = r.gameConfig.tournament;
                    const playersCount = r.players.size;
                    const totalRounds = Math.ceil(Math.log2(playersCount));
                    
                    // ¿Es este el último match de la última ronda (La Final)?
                    const currentMatch = tournament.brackets.find(m => m.winner === winner && m.status === 'FINISHED' && m.round === totalRounds);
                    const isGrandFinal = !!currentMatch;

                    if (isGrandFinal) {
                        console.log(`[TOURNAMENT] ¡GRAN FINAL TERMINADA! Pasando a GAME_OVER.`);
                        this.handleTournamentRoundEnd(roomId); // Esto pondrá status = GAME_OVER y dará los premios
                        return;
                    }

                    // 2. Si NO es la final, mostrar el árbol del torneo por 7 segundos
                    r.status = 'TOURNAMENT_BRACKETS';
                    r.gameConfig.tournament.nextMatchStartTime = Date.now() + 7000;
                    const treeUpdate = await this.getRoom(roomId);
                    this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', room: treeUpdate });

                    setTimeout(() => {
                        const roomStillExists = this.rooms.get(roomId);
                        if (!roomStillExists || roomStillExists.status !== 'TOURNAMENT_BRACKETS') return;

                        const nextMatch = tournament.brackets.find(m => m.status === 'WAITING' && m.round === tournament.round);
                        if (nextMatch) {
                            console.log(`[TOURNAMENT] Lanzando automáticamente el siguiente duelo.`);
                            this.launchTournamentRound(roomId);
                        } else {
                            console.log(`[TOURNAMENT] No hay más duelos en esta ronda. Avanzando ronda.`);
                            this.handleTournamentRoundEnd(roomId);
                        }
                    }, 7000);
                }, 3000);
            }
        } else {
            this.finishRound(roomId);
        }
    }

    async handleGameAction(roomId, user, action) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        this.updateRoomActivity(roomId);

        // MUERTE SÚBITA: El primero que consiga un incremento de puntuación gana inmediatamente
        if (room.status === 'SUDDEN_DEATH' && action.type === 'SCORE_UPDATE') {
            const currentScores = this.roundGameScores.get(roomId);
            const oldScore = currentScores ? (currentScores.get(user) || 0) : 0;
            
            if (action.score > oldScore) {
                console.log(`[SUDDEN DEATH] ${user} ha anotado el punto decisivo (${oldScore} -> ${action.score}).`);
                this.finishRoundWithWinner(roomId, user);
                return;
            }
        }

        if (action.type === 'SABOTAGE' && room.gameConfig.mode === 'TOURNAMENT') {
            return; // No permitimos sabotaje de tiempo en torneos para no liar
        }

        if (action.type === 'SCORE_UPDATE') {
            if (!this.roundGameScores.has(roomId)) this.roundGameScores.set(roomId, new Map());
            const scores = this.roundGameScores.get(roomId);
            
            // Si es torneo o duelo o 2vs2, extendemos el tiempo del servidor si el cliente nos lo pide (o por defecto 2s)
            if (room.gameConfig.mode === "TOURNAMENT" || room.gameConfig.modality === "1vs1" || room.gameConfig.modality === "2vs2") {
                const finished = this.roundFinishedPlayers.get(roomId) || new Set();

                // Transferencia de tiempo: +3s al que acierta (capado a 60s), -3s al rival (si no ha terminado)
                if (room.gameConfig.playerTimes) {
                    if (room.gameConfig.modality === "2vs2") {
                        const myTeam = room.gameConfig.teams[user];
                        const teammates = Object.keys(room.gameConfig.teams).filter(p => room.gameConfig.teams[p] === myTeam);
                        const opponents = Object.keys(room.gameConfig.teams).filter(p => room.gameConfig.teams[p] !== myTeam);

                        const allOpponentsFinished = opponents.every(opp => 
                            finished.has(opp) || 
                            (room.gameConfig.playerTimes[opp] !== undefined && room.gameConfig.playerTimes[opp] <= 0)
                        );

                        if (!allOpponentsFinished) {
                            teammates.forEach(tm => {
                                if (!finished.has(tm) && room.gameConfig.playerTimes[tm] > 0) {
                                    room.gameConfig.playerTimes[tm] = Math.min(60, room.gameConfig.playerTimes[tm] + 3);
                                }
                            });
                        }

                        opponents.forEach(opp => {
                            if (!finished.has(opp) && room.gameConfig.playerTimes[opp] > 0) {
                                room.gameConfig.playerTimes[opp] = Math.max(0, room.gameConfig.playerTimes[opp] - 3);
                            }
                        });
                    } else {
                        let opponent = null;
                        if (room.gameConfig.mode === "TOURNAMENT") {
                            const brackets = room.gameConfig.tournament?.brackets || [];
                            const activeMatch = brackets.find(m => m.status === 'PLAYING' || m.status === 'SUDDEN_DEATH');
                            if (activeMatch) {
                                opponent = activeMatch.p1 === user ? activeMatch.p2 : (activeMatch.p2 === user ? activeMatch.p1 : null);
                            }
                        } else {
                            opponent = Array.from(room.players).find(p => p !== user);
                        }
                        
                        const opponentFinished = opponent ? (finished.has(opponent) || (room.gameConfig.playerTimes[opponent] !== undefined && room.gameConfig.playerTimes[opponent] <= 0)) : false;

                        if (!finished.has(user) && !opponentFinished) {
                            room.gameConfig.playerTimes[user] = Math.min(60, room.gameConfig.playerTimes[user] + 3);
                        }
                        
                        if (opponent && !finished.has(opponent) && !opponentFinished) {
                            room.gameConfig.playerTimes[opponent] = Math.max(0, room.gameConfig.playerTimes[opponent] - 3);
                        }
                    }
                }

                const extension = (action.timeLeftExtension || 2) * 1000;
                if (room.roundEndTime) {
                    room.roundEndTime += extension;
                    // Capamos a un máximo de 99 segundos para que no sea infinito
                    const maxEndTime = Date.now() + 99000;
                    if (room.roundEndTime > maxEndTime) room.roundEndTime = maxEndTime;
                }
            }

            scores.set(user, action.score);
            
            // Notificar a todos de la extensión de tiempo
            this.broadcastToRoom(roomId, {
                type: 'TIME_UPDATE',
                timeLeft: Math.ceil((room.roundEndTime - Date.now()) / 1000), playerTimes: room.gameConfig.playerTimes
            });
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

        if (action.type === 'START_TOURNAMENT_MATCH') {
            if (!room.gameConfig.tournament) return;
            const match = room.gameConfig.tournament.brackets.find(m => m.id === action.matchId);
            if (match && match.status === 'WAITING') {
                match.status = 'PLAYING';
                const game = this.pickNextGame(roomId);
                room.gameConfig.currentGame = game;
                room.gameConfig.teams = { [match.p1]: 'team-1', [match.p2]: 'team-2' };
                room.gameConfig.subRoles = { [match.p1]: null, [match.p2]: null };
                this.setRoomStatus(roomId, 'PLAYING');
            }
        }

        if (action.type === 'START_TOURNAMENT_MATCH_MANUAL') {
            this.launchTournamentRound(roomId);
        }

        if (action.type === 'NEXT_TOURNAMENT_ROUND') {
            this.handleTournamentRoundEnd(roomId);
        }

        // LÓGICA MODO JEFE
        if (room.gameConfig.mode === 'BOSS') {
            if (action.type === 'HERO_ATTACK') {
                if ((room.gameConfig.heroHealth[user] || 0) <= 0) return;
                
                const numHeroes = Object.keys(room.gameConfig.heroHealth).length || 1;
                const damage = 0.5 / numHeroes;
                
                room.gameConfig.bossHP = Math.max(0, room.gameConfig.bossHP - damage);
                this.broadcastToRoom(roomId, { type: 'BOSS_HP_UPDATE', hp: room.gameConfig.bossHP, attacker: user });
                this.broadcastToRoom(roomId, { type: 'ACTION_FEED_UPDATE', message: `¡${user} ha atacado al Jefe! (-${damage.toFixed(3)}% HP)` });
                if (room.gameConfig.bossHP <= 0) this.finishRound(roomId);
            }

            if (action.type === 'BOSS_ATTACK' && user === room.gameConfig.boss) {
                const now = Date.now();
                const COOLDOWN = 30000;
                if (now - (room.gameConfig.lastBossAttack || 0) < COOLDOWN) return;
                room.gameConfig.lastBossAttack = now;
                const attackType = action.attackType;
                let feedMsg = "";
                if (attackType === 'BLACK_HOLE') {
                    // Restar una vida a ALGUIEN aleatorio (o a todos si se prefiere, pero el usuario dijo "a algu")
                    const heroes = Object.keys(room.gameConfig.heroHealth).filter(h => room.gameConfig.heroHealth[h] > 0);
                    if (heroes.length > 0) {
                        const target = heroes[Math.floor(Math.random() * heroes.length)];
                        room.gameConfig.heroHealth[target] -= 1;
                        if (room.gameConfig.heroHealth[target] <= 0) this.broadcastToRoom(roomId, { type: 'HERO_ELIMINATED', user: target });
                        feedMsg = `¡EL JEFE HA LANZADO UN AGUJERO NEGRO A ${target}! (-1 ❤️)`;
                    } else {
                        feedMsg = "¡EL JEFE HA LANZADO UN AGUJERO NEGRO!";
                    }
                    this.broadcastToRoom(roomId, { type: 'BOSS_ACTION_RESULT', attackType, heroHealth: room.gameConfig.heroHealth });
                } else if (attackType === 'LIGHTNING_STORM') {
                    const heroes = Object.keys(room.gameConfig.heroHealth).filter(h => room.gameConfig.heroHealth[h] > 0);
                    if (heroes.length > 0) {
                        const target = heroes[Math.floor(Math.random() * heroes.length)];
                        room.gameConfig.heroHealth[target] -= 1;
                        this.broadcastToRoom(roomId, { type: 'TRIGGER_ANOMALY', anomalyType: 'raig-tempesta' });
                        feedMsg = `¡EL JEFE HA INVOCADO UNA LLUVIA DE RELÁMPAGOS SOBRE ${target}! (-1 ❤️)`;
                    } else {
                        feedMsg = "¡EL JEFE HA INVOCADO UNA LLUVIA DE RELÁMPAGOS!";
                    }
                } else if (attackType === 'FREEZE') {
                    const heroes = Object.keys(room.gameConfig.heroHealth).filter(h => room.gameConfig.heroHealth[h] > 0);
                    if (heroes.length > 0) {
                        const target = heroes[Math.floor(Math.random() * heroes.length)];
                        room.gameConfig.heroHealth[target] -= 1;
                        this.broadcastToRoom(roomId, { type: 'APPLY_INTERFERENCE', actionType: 'FREEZE' });
                        feedMsg = `¡EL JEFE HA CONGELADO A ${target}! (-1 ❤️)`;
                    } else {
                        feedMsg = "¡EL JEFE HA CONGELADO A LOS HÉROES!";
                    }
                } else if (attackType === 'ZERO_GRAVITY') {
                    const heroes = Object.keys(room.gameConfig.heroHealth).filter(h => room.gameConfig.heroHealth[h] > 0);
                    if (heroes.length > 0) {
                        const target = heroes[Math.floor(Math.random() * heroes.length)];
                        room.gameConfig.heroHealth[target] -= 1;
                        this.broadcastToRoom(roomId, { type: 'APPLY_INTERFERENCE', actionType: 'SCRAMBLE' });
                        feedMsg = `¡EL JEFE HA ALTERADO LA GRAVEDAD DE ${target}! (-1 ❤️)`;
                    } else {
                        feedMsg = "¡EL JEFE HA ALTERADO LA GRAVEDAD!";
                    }
                } else if (attackType === 'CHANGE_GAME') {
                    const nextGame = this.pickNextGame(roomId);
                    room.gameConfig.currentGame = nextGame;
                    feedMsg = `¡EL JEFE HA CAMBIADO EL MINIJUEGO A ${nextGame}!`;
                    this.broadcastToRoom(roomId, { type: 'MATCH_STARTING', currentGame: nextGame });
                }
                this.broadcastToRoom(roomId, { type: 'BOSS_ACTION_RESULT', attackType, heroHealth: room.gameConfig.heroHealth });
                this.broadcastToRoom(roomId, { type: 'ACTION_FEED_UPDATE', message: feedMsg });
                this.sendToUser(user, { type: 'BOSS_COOLDOWN_SYNC', lastAttack: now, cooldown: COOLDOWN });
            }
        }

        this.broadcastToRoom(roomId, {
            type: 'GAME_ACTION',
            from: user,
            action
        });
    }

    async handleTournamentRoundEnd(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || !room.gameConfig.tournament) return;

        const tournament = room.gameConfig.tournament;
        const currentRound = tournament.round;
        const winners = tournament.brackets
            .filter(m => m.round === currentRound)
            .map(m => m.winner)
            .filter(w => w !== null);

        if (winners.length > 1) {
            console.log(`[TOURNAMENT] Generando nueva ronda con ${winners.length} ganadores.`);
            tournament.round++;
            const nextBrackets = this.generateBrackets(winners, tournament.round);
            // Reemplazamos los brackets para que solo queden los nuevos y el historial de terminados sea limpio
            tournament.brackets = [...tournament.brackets, ...nextBrackets];

            // Inicio automático del primer combate de la nueva ronda tras 10s (3s resultados + 7s árbol)
            setTimeout(() => {
                this.launchTournamentRound(roomId);
            }, 10000);
        } else if (winners.length === 1) {
            console.log(`[TOURNAMENT] Torneo finalizado. Ganador: ${winners[0]}`);
            room.status = 'GAME_OVER'; // Cambiamos a GAME_OVER para que salte el Kahoot
            const roomUpdate = await this.getRoom(roomId);
            this.broadcastToRoom(roomId, {
                type: 'MATCH_FINISHED',
                winner: winners[0],
                room: roomUpdate
            });
            room.gameConfig.scores[winners[0]] = (room.gameConfig.scores[winners[0]] || 0) + 1000; // Bonus por ganar el torneo

            // --- ENTREGA DE PREMIO (BOTE) ---
            const buyIn = room.gameConfig.buyIn || 0;
            if (buyIn > 0 && this.userRepo) {
                const totalPrize = buyIn * room.players.size;
                const winnerName = winners[0];
                try {
                    const winnerUser = await this.userRepo.findByUsername(winnerName);
                    if (winnerUser) {
                        const oldCoins = winnerUser.coins || 0;
                        winnerUser.coins = oldCoins + totalPrize;
                        await this.userRepo.save(winnerUser);
                        console.log(`[TOURNAMENT] ¡PREMIO ENTREGADO! ${winnerName} recibe ${totalPrize} Astrocions. (${oldCoins} -> ${winnerUser.coins})`);
                        
                        // Notificar al ganador de su premio
                        this.sendToUser(winnerName, {
                            type: 'PROFILE_UPDATE',
                            coins: winnerUser.coins
                        });
                    }
                } catch (e) {
                    console.error(`❌ Error entregando premio a ${winnerName}:`, e);
                }
            }

            // Limpiar el historial de juegos de jugadores al acabar el torneo
            room.players.forEach(p => this.playerPlayedGames.delete(p));
        }

        const roomUpdate = await this.getRoom(roomId);
        this.broadcastToRoom(roomId, { type: 'ROOM_UPDATE', room: roomUpdate });
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
            this.returnedToLobbyPlayers.delete(roomId);
            this.roundFinishedPlayers.delete(roomId);
            this.roundGameScores.delete(roomId);
            
            await this.setRoomStatus(roomId, 'LOBBY');
        } else {
            this.broadcastToRoom(roomId, {
                type: 'PLAYER_RETURNED',
                user
            });
        }
    }

    async registerMultiplayerResults(room) {
        if (!this.gameService) return;
        const players = Array.from(room.players);
        const scores = room.gameConfig.scores || {};
        const game = "Multijugador";

        for (const username of players) {
            try {
                const score = scores[username] || 0;
                await this.gameService.completeGame(username, {
                    game,
                    score,
                    completedMapNode: null,
                    timeSeconds: 0
                });
                console.log(`📝 [RoomManager] Partida multijugador registrada para ${username} (${score} pts)`);
            } catch (err) {
                console.error(`❌ [RoomManager] Error registrando partida multijugador para ${username}:`, err);
            }
        }
    }

    async refundLifePack(username, amount = 1) {
        try {
            const userObj = await this.userRepo.findByUsername(username);
            if (!userObj) return;

            let normalized = this.inventoryService.normalizeInventoryEntries(userObj.inventory);
            const idx = normalized.findIndex(item => item.id === 1);
            
            if (idx !== -1) {
                normalized[idx].quantity = Math.min(10, normalized[idx].quantity + amount);
            } else {
                normalized.push({ id: 1, quantity: Math.min(10, amount), equipped: false });
            }

            userObj.inventory = this.inventoryService.serializeInventory(normalized);
            await this.userRepo.update(userObj);
            
            this.sendToUser(username, {
                type: 'PROFILE_UPDATE',
                inventory: this.inventoryService.enrichInventory(userObj.inventory)
            });
            console.log(`🚀 [RoomManager] Reembolsadas ${amount} vidas a ${username} por sobrevivir.`);
        } catch (err) {
            console.error(`❌ Error reembolsando vida a ${username}:`, err);
        }
    }
}

const instance = new RoomManager();
instance.RoomManager = RoomManager;
module.exports = instance;



