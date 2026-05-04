// Astro_project/backend/src/repositories/InMemoryPartidaRepository.js

const PartidaRepository = require('./PartidaRepository');

class InMemoryPartidaRepository extends PartidaRepository {
    constructor() {
        super();
        this.partides = [];
    }

    async countByUser(username) {
        return this.partides.filter(p => p.user === username).length;
    }

    async getGamesByType(username) {
        const userGames = this.partides.filter(p => p.user === username);
        const stats = {};
        userGames.forEach(p => {
            stats[p.game] = (stats[p.game] || 0) + 1;
        });
        return stats;
    }

    async findRecentByUser(username, limit = 20) {
        return this.partides
            .filter(p => p.user === username)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    async findTopByUser(username, limit = 5) {
        return this.partides
            .filter(p => p.user === username)
            .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
            .slice(0, limit);
    }

    async getTotalPointsByUser(username) {
        return this.partides
            .filter(p => p.user === username)
            .reduce((sum, p) => sum + p.score, 0);
    }

    async save(partida) {
        if (!partida.id) partida.id = Math.random().toString(36).substr(2, 9);
        this.partides.push(partida);
        return partida;
    }
}

module.exports = InMemoryPartidaRepository;
