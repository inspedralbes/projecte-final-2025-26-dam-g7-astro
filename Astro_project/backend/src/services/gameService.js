// Astro_project/backend/src/services/gameService.js

const Partida = require('../domain/Partida');

class GameService {
    constructor({
        userRepository,
        partidaRepository,
        updateStreak, // Mantinguem la funció per ara o passem el nou servei
        JERARQUIA,
        normalizeActiveBoosters,
        consumeBoostersForCompletedGame,
        getScoreMultiplier,
        getCoinsMultiplier,
        statsService
    }) {
        this.userRepo = userRepository;
        this.partidaRepo = partidaRepository;
        this.updateStreak = updateStreak;
        this.JERARQUIA = JERARQUIA;
        this.normalizeActiveBoosters = normalizeActiveBoosters;
        this.consumeBoostersForCompletedGame = consumeBoostersForCompletedGame;
        this.getScoreMultiplier = getScoreMultiplier;
        this.getCoinsMultiplier = getCoinsMultiplier;
        this.statsService = statsService;
    }

    async completeGame(username, { game, score = 0, completedMapNode, timeSeconds = 0 }) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuari no trobat');

        const previousLevel = user.level;

        const parsedScore = Number.parseInt(score, 10);
        const normalizedScore = Number.isNaN(parsedScore) ? 0 : Math.max(0, parsedScore);

        const currentBoosters = this.normalizeActiveBoosters(user.activeBoosters);
        const scoreMultiplier = this.getScoreMultiplier(currentBoosters);
        const coinsMultiplier = this.getCoinsMultiplier(currentBoosters);
        const boostedScore = normalizedScore * scoreMultiplier;

        const xpEarned = Math.floor(boostedScore / 10);
        const coinsEarned = xpEarned * coinsMultiplier;

        // Utilitzar els mètodes de l'entitat de domini User
        user.addXP(xpEarned);
        user.addCoins(coinsEarned);

        // Actualitzar rang segons el nou nivell
        const rankIndex = Math.min(Math.floor((user.level - 1) / 2), this.JERARQUIA.length - 1);
        user.rank = this.JERARQUIA[rankIndex];

        // Actualitzar missions
        user.updateMissionProgress('games', 1);
        user.updateMissionProgress('coins', coinsEarned);
        user.updateMissionProgress('xp', xpEarned);

        // Actualitzar racha (streak)
        const streakResult = await this.updateStreak(username, true);
        if (streakResult && streakResult.streak > 0) {
            user.syncStreakMissions(streakResult.streak);
        }

        // Lògica de mapa
        user.advanceMap(completedMapNode);

        // Màximes puntuacions
        user.updateMaxScore(game, boostedScore);

        // Actualitzar activitat
        user.lastActivity = new Date();
        user.lastGame = new Date();

        // Booster consumption
        user.activeBoosters = this.consumeBoostersForCompletedGame(currentBoosters);

        // Guardar la partida
        const partida = new Partida({
            user: username,
            game,
            score: boostedScore,
            xpEarned,
            coinsEarned,
            timeSeconds: Number(timeSeconds) || 0
        });

        await Promise.all([
            this.partidaRepo.save(partida),
            this.userRepo.update(user)
        ]);

        // Obtenir estadístiques completes actualitzades per a la resposta
        const fullStats = await this.statsService.getUserStats(username);

        return {
            ...fullStats,
            xpEarned,
            coinsEarned,
            boostedScore,
            leveledUp: user.level > previousLevel,
            newLevel: user.level,
            newBalance: user.coins,
            newXp: user.xp,
            newRank: user.rank
        };
    }
}

module.exports = GameService;
