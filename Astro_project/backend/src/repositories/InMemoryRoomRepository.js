// Astro_project/backend/src/repositories/InMemoryRoomRepository.js

const RoomRepository = require('./RoomRepository');

class InMemoryRoomRepository extends RoomRepository {
    constructor() {
        super();
        this.rooms = new Map();
    }

    async findPublicLobbies() {
        return Array.from(this.rooms.values()).filter(r => r.status === 'LOBBY' && r.isPublic);
    }

    async save(room) {
        this.rooms.set(room.id, { ...room });
        return room;
    }

    async update(room) {
        if (!this.rooms.has(room.id)) return null;
        this.rooms.set(room.id, { ...this.rooms.get(room.id), ...room });
        return this.rooms.get(room.id);
    }

    async deleteById(roomId) {
        const exists = this.rooms.has(roomId);
        this.rooms.delete(roomId);
        return exists;
    }

    async findById(roomId) {
        return this.rooms.get(roomId) || null;
    }
}

module.exports = InMemoryRoomRepository;
