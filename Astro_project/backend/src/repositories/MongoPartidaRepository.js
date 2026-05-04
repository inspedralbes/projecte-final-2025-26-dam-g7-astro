// Astro_project/backend/src/repositories/MongoPartidaRepository.js

const PartidaRepository = require('./PartidaRepository');
const Partida = require('../domain/Partida');

class MongoPartidaRepository extends PartidaRepository {
    constructor(getCollection) {
        super();
        this._getCollection = getCollection;
    }

    get collection() {
        return this._getCollection();
    }

    async countByUser(username) {
        return await this.collection.countDocuments({ user: username });
    }

    async getGamesByType(username) {
        const results = await this.collection
            .aggregate([
                { $match: { user: username } },
                { $group: { _id: '$game', total: { $sum: 1 } } }
            ])
            .toArray();

        const gamesByType = {};
        for (const item of results) {
            gamesByType[item._id || 'UNKNOWN'] = item.total;
        }
        return gamesByType;
    }

    async findRecentByUser(username, limit = 20) {
        const docs = await this.collection
            .find({ user: username })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
        return docs.map(doc => new Partida(doc));
    }

    async findTopByUser(username, limit = 5) {
        const docs = await this.collection
            .find({ user: username })
            .sort({ score: -1, timeSeconds: 1 })
            .limit(limit)
            .toArray();
        return docs.map(doc => new Partida(doc));
    }

    async getTotalPointsByUser(username) {
        const result = await this.collection.aggregate([
            { $match: { user: username } },
            { $group: { _id: null, total: { $sum: "$score" } } }
        ]).toArray();
        return result[0]?.total || 0;
    }

    async save(partida) {
        const result = await this.collection.insertOne({
            user: partida.user,
            game: partida.game,
            score: partida.score,
            timeSeconds: partida.timeSeconds,
            createdAt: partida.createdAt,
            xpEarned: partida.xpEarned,
            coinsEarned: partida.coinsEarned
        });
        partida.id = result.insertedId;
        return partida;
    }
}

module.exports = MongoPartidaRepository;
