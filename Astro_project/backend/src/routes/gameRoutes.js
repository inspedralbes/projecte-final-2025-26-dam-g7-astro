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

            // 1. CÁLCULOS DE PUNTUACIÓN Y RECOMPENSAS
            const parsedScore = Number.parseInt(score, 10);
            const normalizedScore = Number.isNaN(parsedScore) ? 0 : Math.max(0, parsedScore);
            
            // Tus recompensas actuales (Score / 10)
            const rewards = Math.floor(normalizedScore / 10); 

            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            const newBalance = currentCoins + rewards;

            // 2. CÁLCULO DE NIVEL Y XP
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

            // B) Actualizar por Monedas ganadas (+rewards en tipo 'coins')
            dailyMissions = updateMissionProgress(dailyMissions, 'coins', rewards);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'coins', rewards);

            // C) Actualizar por XP ganada (+rewards en tipo 'xp')
            dailyMissions = updateMissionProgress(dailyMissions, 'xp', rewards);
            weeklyMissions = updateMissionProgress(weeklyMissions, 'xp', rewards);


            // 5. GESTIÓN DE RACHA Y GUARDADO
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
                            lastActivity: new Date(),
                            // GUARDAMOS LAS MISIONES ACTUALIZADAS
                            dailyMissions: dailyMissions,
                            weeklyMissions: weeklyMissions
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