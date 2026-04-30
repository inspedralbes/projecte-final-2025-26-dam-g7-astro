// backend/src/routes/gameRoutes.js

const updateMissionProgress = (missions, type, amount) => {
    if (!missions || !Array.isArray(missions)) return [];
    return missions.map(mission => {
        if (mission.completed || mission.claimed) return mission;
        if (mission.type === type) {
            let newProgress = (mission.progress || 0) + amount;
            if (newProgress >= mission.goal) {
                newProgress = mission.goal;
                mission.completed = true;
            }
            mission.progress = newProgress;
        }
        return mission;
    });
};

function registerGameRoutes(app, {
    getCollections,
    updateStreak,
    JERARQUIA,
    normalizeActiveBoosters,
    consumeBoostersForCompletedGame,
    getScoreMultiplier,
    getCoinsMultiplier
}) {
    app.post('/api/games/complete', async (req, res) => {
        // AÑADIDO: Recibir el nodo completado del mapa
        const { user, game, score = 0, completedMapNode } = req.body;

        if (!user || !game) return res.status(400).json({ message: 'Usuario y juego requeridos.' });

        try {
            const { users, partides } = getCollections();
            const currentUser = await users.findOne({ user });
            if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

            const parsedScore = Number.parseInt(score, 10);
            const normalizedScore = Number.isNaN(parsedScore) ? 0 : Math.max(0, parsedScore);

            const currentBoosters = normalizeActiveBoosters(currentUser.activeBoosters);
            const scoreMultiplier = getScoreMultiplier(currentBoosters);
            const coinsMultiplier = getCoinsMultiplier(currentBoosters);
            const boostedScore = normalizedScore * scoreMultiplier;

            const xpEarned = Math.floor(boostedScore / 10);
            const coinsEarned = xpEarned * coinsMultiplier;
            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            const newBalance = currentCoins + coinsEarned;
            const previousLevel = currentUser.level || 1;
            const previousXp = currentUser.xp || 0;

            let currentLevel = previousLevel;
            let currentXp = previousXp;
            currentXp += xpEarned;

            let xpNeeded = 100 + (currentLevel - 1) * 50;
            let leveledUp = false;

            while (currentXp >= xpNeeded) {
                currentXp -= xpNeeded;
                currentLevel++;
                xpNeeded = 100 + (currentLevel - 1) * 50;
                leveledUp = true;
            }

            const rankIndex = Math.min(Math.floor((currentLevel - 1) / 10), JERARQUIA.length - 1);
            const currentRank = JERARQUIA[rankIndex];

            let dailyMissions = currentUser.dailyMissions || [];
            let weeklyMissions = currentUser.weeklyMissions || [];

            dailyMissions = updateMissionProgress(dailyMissions, 'games', 1);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'games', 1);
            dailyMissions = updateMissionProgress(dailyMissions, 'coins', coinsEarned);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'coins', coinsEarned);
            dailyMissions = updateMissionProgress(dailyMissions, 'xp', xpEarned);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'xp', xpEarned);

            const streakResult = await updateStreak(user, true);
            if (streakResult.streak > 0) {
                dailyMissions = updateMissionProgress(dailyMissions, 'streak', 1);
                weeklyMissions = weeklyMissions.map(m => {
                    if (m.type === 'streak' && !m.completed && !m.claimed) {
                        m.progress = Math.min(m.goal, streakResult.streak);
                        if (m.progress >= m.goal) m.completed = true;
                    }
                    return m;
                });
            }

            // NUEVO LÓGICA DE MAPA: Si supera un récord del mapa, lo avanza
            let currentMapLevel = currentUser.mapLevel || 1;
            let advancedMap = false;
            if (completedMapNode && completedMapNode >= currentMapLevel) {
                currentMapLevel = completedMapNode + 1;
                advancedMap = true;
            }

            const gameEntry = { game, score: boostedScore, xpEarned, coinsEarned, createdAt: new Date() };
            const maxScores = currentUser.maxScores || {};
            if (!maxScores[game] || boostedScore > maxScores[game]) maxScores[game] = boostedScore;

            const totalGamesPlayed = (currentUser.totalGamesPlayed || 0) + 1;
            const totalPoints = (currentUser.totalPoints || 0) + boostedScore;
            const gameHistory = [gameEntry, ...(currentUser.gameHistory || [])].slice(0, 20);

            let topGames = [...(currentUser.topGames || [])];
            topGames.push({ ...gameEntry, timeSeconds: Number(req.body.timeSeconds) || 0 });
            topGames.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeSeconds || Infinity) - (b.timeSeconds || Infinity);
            });
            topGames = topGames.slice(0, 5);

            const nextBoosters = consumeBoostersForCompletedGame(currentBoosters);

            await Promise.all([
                partides.insertOne({
                    ...gameEntry,
                    user,
                    rawScore: normalizedScore,
                    scoreMultiplier,
                    coinsMultiplier,
                    timeSeconds: Number(req.body.timeSeconds) || 0,
                    coinsEarned,
                    xpEarned,
                    coinsBefore: currentCoins,
                    coinsAfter: newBalance,
                    xpBefore: previousXp,
                    xpAfter: currentXp,
                    levelBefore: previousLevel,
                    levelAfter: currentLevel,
                    rankAfter: currentRank,
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
                            activeBoosters: nextBoosters,
                            lastActivity: new Date(),
                            dailyMissions,
                            weeklyMissions,
                            gameHistory,
                            topGames, 
                            maxScores,
                            totalGamesPlayed,
                            totalPoints,
                            mapLevel: currentMapLevel // GUARDADO EN MONGODB
                        }
                    }
                )
            ]);

            const gamesPlayed = await partides.countDocuments({ user });

            res.json({
                success: true,
                message: 'Partida registrada correctamente.',
                scoreMultiplier, coinsMultiplier, rawScore: normalizedScore, boostedScore,
                coinsEarned, xpEarned, activeBoosters: nextBoosters, newBalance,
                newLevel: currentLevel, newXp: currentXp, newRank: currentRank, leveledUp,
                newMapLevel: currentMapLevel, advancedMap, // ENVIADO AL FRONTEND
                gamesPlayed, streak: streakResult.streak, needsFreeze: streakResult.needsFreeze,
                lastGame: streakResult.lastGame, dailyMissions, weeklyMissions
            });
        } catch (error) {
            console.error('Error registrando partida:', error);
            res.status(500).json({ message: 'Error al registrar la partida.' });
        }
    });
}

module.exports = { registerGameRoutes };