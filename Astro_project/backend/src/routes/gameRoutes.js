function registerGameRoutes(app, {
    getCollections,
    updateStreak,
    JERARQUIA,
    normalizeActiveBoosters
}) {
    app.post('/api/games/complete', async (req, res) => {
        const { user, game, score = 0 } = req.body;

        if (!user || !game) {
            return res.status(400).json({ message: 'Usuario y juego requeridos.' });
        }

        try {
            const { users, partides } = getCollections();
            const currentUser = await users.findOne({ user });
            if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

            const parsedScore = Number.parseInt(score, 10);
            const normalizedScore = Number.isNaN(parsedScore) ? 0 : Math.max(0, parsedScore);
            const currentBoosters = normalizeActiveBoosters(currentUser.activeBoosters);

            const scoreMultiplier = currentBoosters.doubleScoreGames > 0 ? 2 : 1;
            const coinsMultiplier = currentBoosters.doubleCoinsGames > 0 ? 2 : 1;
            const effectiveScore = normalizedScore * scoreMultiplier;
            const baseRewards = Math.floor(effectiveScore / 10);
            const xpEarned = baseRewards;
            const coinsEarned = baseRewards * coinsMultiplier;

            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            const newBalance = currentCoins + coinsEarned;

            let currentLevel = currentUser.level || 1;
            let currentXp = currentUser.xp || 0;
            currentXp += xpEarned;

            let xpNeeded = 100 + (currentLevel - 1) * 50;
            let leveledUp = false;

            while (currentXp >= xpNeeded) {
                currentXp -= xpNeeded;
                currentLevel++;
                xpNeeded = 100 + (currentLevel - 1) * 50;
                leveledUp = true;
            }

            const rankIndex = Math.min(Math.floor((currentLevel - 1) / 2), JERARQUIA.length - 1);
            const currentRank = JERARQUIA[rankIndex];

            const streakResult = await updateStreak(user, true);
            const updatedActiveBoosters = {
                doubleCoinsGames: Math.max(0, currentBoosters.doubleCoinsGames - (currentBoosters.doubleCoinsGames > 0 ? 1 : 0)),
                doubleScoreGames: Math.max(0, currentBoosters.doubleScoreGames - (currentBoosters.doubleScoreGames > 0 ? 1 : 0))
            };

            await Promise.all([
                partides.insertOne({
                    user,
                    game,
                    score: normalizedScore,
                    effectiveScore,
                    scoreMultiplier,
                    coinsMultiplier,
                    coinsEarned,
                    xpEarned,
                    createdAt: new Date()
                }),
                users.updateOne(
                    { user },
                    {
                        $set: {
                            coins: newBalance,
                            level: currentLevel,
                            xp: currentXp,
                            rank: currentRank,
                            streak: streakResult.streak,
                            activeBoosters: updatedActiveBoosters,
                            lastActivity: new Date()
                        }
                    }
                )
            ]);

            const gamesPlayed = await partides.countDocuments({ user });

            res.json({
                success: true,
                message: 'Partida registrada correctamente.',
                scoreMultiplier,
                coinsMultiplier,
                effectiveScore,
                coinsEarned,
                xpEarned,
                newBalance,
                newLevel: currentLevel,
                newXp: currentXp,
                newRank: currentRank,
                leveledUp,
                gamesPlayed,
                streak: streakResult.streak,
                activeBoosters: updatedActiveBoosters,
                needsFreeze: streakResult.needsFreeze,
                lastGame: streakResult.lastGame
            });
        } catch (error) {
            console.error('Error registrando partida:', error);
            res.status(500).json({ message: 'Error al registrar la partida.' });
        }
    });
}

module.exports = {
    registerGameRoutes
};
