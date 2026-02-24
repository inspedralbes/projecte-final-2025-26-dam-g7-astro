function registerGameRoutes(app, { getCollections, updateStreak, JERARQUIA }) {
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
            const rewards = Math.floor(normalizedScore / 10);

            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            const newBalance = currentCoins + rewards;

            let currentLevel = currentUser.level || 1;
            let currentXp = currentUser.xp || 0;
            currentXp += rewards;

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

            await Promise.all([
                partides.insertOne({
                    user,
                    game,
                    score: normalizedScore,
                    coinsEarned: rewards,
                    xpEarned: rewards,
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
                            lastActivity: new Date()
                        }
                    }
                )
            ]);

            const gamesPlayed = await partides.countDocuments({ user });

            res.json({
                success: true,
                message: 'Partida registrada correctamente.',
                coinsEarned: rewards,
                xpEarned: rewards,
                newBalance,
                newLevel: currentLevel,
                newXp: currentXp,
                newRank: currentRank,
                leveledUp,
                gamesPlayed,
                streak: streakResult.streak,
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
