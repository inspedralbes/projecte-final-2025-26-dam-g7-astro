
class SupplyService {
    constructor({ getCollection }) {
        this._getCollection = getCollection;
    }

    get collection() {
        return this._getCollection();
    }

    async createSupplySet(ownerId, data) {
        const supplySet = {
            ownerId,
            name: data.name,
            type: data.type || 'words', // 'words', 'riddles', etc.
            content: data.content, // Array of { word, hint }
            createdAt: new Date(),
            active: true
        };
        const result = await this.collection.insertOne(supplySet);
        return { id: result.insertedId, ...supplySet };
    }

    async getSupplySetsByOwner(ownerId) {
        return await this.collection.find({ ownerId }).toArray();
    }

    async getActiveSupplySet(ownerId) {
        return await this.collection.findOne({ ownerId, active: true });
    }

    async deleteSupplySet(id) {
        const { ObjectId } = require('mongodb');
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async updateSupplySet(id, data) {
        const { ObjectId } = require('mongodb');
        const { _id, ...updateData } = data;
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }
}

module.exports = SupplyService;
