class RoomManager {
    constructor() {
        // user -> ws
        this.sessions = new Map();
        // roomId -> { host, players: Set<username>, gameType, status }
        this.rooms = new Map();
        this.getCollections = null;
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
            isPublic
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
            status: room.status
        };
    }
}

module.exports = new RoomManager();
