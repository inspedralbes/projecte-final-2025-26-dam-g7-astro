// Astro_project/backend/src/repositories/MongoRoomRepository.js

const RoomRepository = require('./RoomRepository');

class MongoRoomRepository extends RoomRepository {
    constructor(getCollection) {
        super();
        this._getCollection = getCollection;
    }

    get collection() {
        return this._getCollection();
    }

    async findPublicLobbies() {
        return await this.collection.find({ status: 'LOBBY', isPublic: true }).toArray();
    }

    async save(room) {
        await this.collection.insertOne(room);
        return room;
    }

    async update(room) {
        // Asumimos que el objeto room tiene un campo 'id' (el string autogenerado)
        const { id, ...updateData } = room;
        await this.collection.updateOne({ id: id }, { $set: updateData });
    }

    async deleteById(roomId) {
        await this.collection.deleteOne({ id: roomId });
    }

    async findById(roomId) {
        return await this.collection.findOne({ id: roomId });
    }

    async deleteMany(query) {
        return await this.collection.deleteMany(query);
    }
}

module.exports = MongoRoomRepository;
