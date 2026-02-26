// backend/src/routes/gameRoutes.js

// Función auxiliar para actualizar el progreso (se define fuera del endpoint para limpieza)
const updateMissionProgress = (missions, type, amount) => {
    if (!missions || !Array.isArray(missions)) return [];

    return missions.map(mission => {
        // Si la misión ya está completa o reclamada, no la tocamos
        if (mission.completed || mission.claimed) return mission;

        // Si el tipo de misión coincide (ej: 'games', 'coins', 'xp')
        if (mission.type === type) {
            let newProgress = (mission.progress || 0) + amount;

            // Aseguramos no pasarnos del objetivo
            if (newProgress >= mission.goal) {
                newProgress = mission.goal;
                mission.completed = true; // ¡Misión cumplida!
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
        const { user, game, score = 0 } = req.body;

        if (!user || !game) {
            return res.status(400).json({ message: 'Usuario y juego requeridos.' });
        }

        try {
            const { users, partides } = getCollections();
            const currentUser = await users.findOne({ user });
            if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

            // 1. CÁLCULOS DE PUNTUACIÓN Y RECOMPENSAS
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

            // 2. CÁLCULO DE NIVEL Y XP
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

            // 3. CÁLCULO DE RANGO (JERARQUÍA)
            const rankIndex = Math.min(Math.floor((currentLevel - 1) / 2), JERARQUIA.length - 1);
            const currentRank = JERARQUIA[rankIndex];

            // 4. ACTUALIZACIÓN DE MISIONES (¡NUEVO!)
            // Recuperamos las misiones actuales o arrays vacíos
            let dailyMissions = currentUser.dailyMissions || [];
            let weeklyMissions = currentUser.weeklyMissions || [];

            // A) Actualizar por Jugar una partida (+1 en tipo 'games')
            dailyMissions = updateMissionProgress(dailyMissions, 'games', 1);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'games', 1);

            // B) Actualizar por Monedas ganadas
            dailyMissions = updateMissionProgress(dailyMissions, 'coins', coinsEarned);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'coins', coinsEarned);

            // C) Actualizar por XP ganada
            dailyMissions = updateMissionProgress(dailyMissions, 'xp', xpEarned);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'xp', xpEarned);

            // D) Actualizar por Racha (¡NUEVO!)
            const streakResult = await updateStreak(user, true);
            if (streakResult.streak > 0) {
                // Diaria: simplemente por tener racha hoy se marca el objetivo de 1
                dailyMissions = updateMissionProgress(dailyMissions, 'streak', 1);
                // Semanal: el progreso es el valor actual de la racha (ej: racha de 5 días)
                weeklyMissions = weeklyMissions.map(m => {
                    if (m.type === 'streak' && !m.completed && !m.claimed) {
                        m.progress = Math.min(m.goal, streakResult.streak);
                        if (m.progress >= m.goal) m.completed = true;
                    }
                    return m;
                });
            }
            // 5. HISTORIAL Y ESTADÍSTICAS (¡NUEVO!)
            const gameEntry = {
                game,
                score: boostedScore,
                xpEarned,
                coinsEarned,
                createdAt: new Date()
            };

            // Máxima puntuación por juego
            const maxScores = currentUser.maxScores || {};
            if (!maxScores[game] || boostedScore > maxScores[game]) {
                maxScores[game] = boostedScore;
            }

            const totalGamesPlayed = (currentUser.totalGamesPlayed || 0) + 1;
            const totalPoints = (currentUser.totalPoints || 0) + boostedScore;

            // Historial limitado a las últimas 20 partidas
            const gameHistory = [gameEntry, ...(currentUser.gameHistory || [])].slice(0, 20);

            // 5 MEJORES PARTIDAS (Top 5)
            let topGames = [...(currentUser.topGames || [])];
            topGames.push({
                ...gameEntry,
                timeSeconds: Number(req.body.timeSeconds) || 0 // Incluir tiempo si viene en el body
            });
            // Ordenar por puntuación (descendente) y luego por tiempo (ascendente si puntuación igual)
            topGames.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeSeconds || Infinity) - (b.timeSeconds || Infinity);
            });
            // Mantener solo las 5 mejores
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
                            // NUEVOS CAMPOS
                            gameHistory,
                            topGames, // Añadido el topGames
                            maxScores,
                            totalGamesPlayed,
                            totalPoints
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
                rawScore: normalizedScore,
                boostedScore,
                coinsEarned,
                xpEarned,
                activeBoosters: nextBoosters,
                newBalance,
                newLevel: currentLevel,
                newXp: currentXp,
                newRank: currentRank,
                leveledUp,
                gamesPlayed,
                streak: streakResult.streak,
                needsFreeze: streakResult.needsFreeze,
                lastGame: streakResult.lastGame,
                // DEVOLVEMOS LAS MISIONES PARA QUE EL FRONTEND SE ACTUALICE
                dailyMissions,
                weeklyMissions
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
