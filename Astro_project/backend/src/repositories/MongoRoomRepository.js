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
}

module.exports = MongoRoomRepository;
