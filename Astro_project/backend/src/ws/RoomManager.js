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

    async createRoom(host, isPublic = true) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const roomData = {
            id: roomId,
            host,
            players: [host],
            status: 'LOBBY',
            isPublic,
            createdAt: new Date()
        };

        this.rooms.set(roomId, {
            host,
            players: new Set([host]),
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
            this.rooms.delete(roomId);
            if (this.getCollections) {
                try {
                    const { rooms } = this.getCollections();
                    await rooms.deleteOne({ id: roomId });
                    console.log(`🗑️ Sala ${roomId} eliminada de DB (vacía)`);
                    await this.syncGlobalRooms();
                } catch (error) {
                    console.error("❌ Error eliminando sala en DB:", error);
                }
            }
        } else {
            // Si el host se va, el siguiente jugador es el nuevo host
            if (room.host === user) {
                room.host = Array.from(room.players)[0];
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
                    console.error("❌ Error actualizando salida en DB:", error);
                }
            }

            this.broadcastToRoom(roomId, {
                type: 'ROOM_UPDATE',
                room: {
                    id: roomId,
                    host: room.host,
                    players: Array.from(room.players),
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
            status: room.status
        };
    }
}

module.exports = new RoomManager();
