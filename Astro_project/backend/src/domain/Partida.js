// Astro_project/backend/src/domain/Partida.js

class Partida {
    constructor({
        _id,
        user,
        game,
        score = 0,
        timeSeconds = 0,
        createdAt = new Date(),
        xpEarned = 0,
        coinsEarned = 0
    } = {}) {
        this.id = _id;
        this.user = user;
        this.game = game;
        this.score = score;
        this.timeSeconds = timeSeconds;
        this.createdAt = createdAt;
        this.xpEarned = xpEarned;
        this.coinsEarned = coinsEarned;
    }
}

module.exports = Partida;
