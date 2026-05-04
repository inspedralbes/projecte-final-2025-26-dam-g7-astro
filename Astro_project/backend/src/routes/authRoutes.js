// Astro_project/backend/src/routes/authRoutes.js

function registerAuthRoutes(app, {
    authService,
    normalizeAchievementIds,
    getInventoryQuantity,
    normalizeActiveBoosters
}) {
    app.post('/api/auth/register', async (req, res) => {
        const { username, password, rank } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Nombre y contraseña requeridos.' });
        }

        try {
            await authService.register(username, password, rank);
            res.status(201).json({ message: 'Reclutamiento completado exitosamente.' });
        } catch (error) {
            console.error('❌ Error en registro:', error);
            res.status(error.message === 'El ID de tripulante ya existe.' ? 409 : 500)
               .json({ message: error.message || 'Error en el sistema de registro.' });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        const username = req.body.username || req.body.user;
        const password = req.body.password || req.body.pass;

        try {
            const { user, streakResult, freezeUnits, normalizedInventory } = await authService.login(username, password);

            console.log(`🚀 Sesión iniciada: ${user.username}`);
            
            res.json({
                status: 'Sincronización completada',
                token: 'session_token_' + Math.random().toString(36).substr(2),
                profile: {
                    name: user.username,
                    plan: user.plan,
                    rank: user.rank,
                    coins: user.coins,
                    level: user.level,
                    xp: user.xp,
                    mapLevel: user.mapLevel,
                    selectedAchievements: user.selectedAchievements || [null, null, null],
                    unlockedAchievements: normalizeAchievementIds(user.unlockedAchievements || []),
                    streak: streakResult.streak,
                    streakFreezes: Math.max(user.streakFreezes || 0, freezeUnits),
                    activeBoosters: normalizeActiveBoosters(user.activeBoosters),
                    avatar: user.avatar || 'Astronauta_blanc.jpg',
                    needsFreeze: streakResult.needsFreeze,
                    lastActivity: user.lastActivity,
                    lastGame: streakResult.lastGame,
                    gameHistory: user.gameHistory || [],
                    maxScores: user.maxScores || {},
                    totalGamesPlayed: user.totalGamesPlayed || 0,
                    totalPoints: user.totalPoints || 0,
                    missionsCompleted: user.missionsCompleted || 0,
                    dailyMissions: user.dailyMissions || [],
                    weeklyMissions: user.weeklyMissions || []
                }
            });
        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(error.message === 'Credenciales no reconocidas' ? 401 : 500)
               .json({ status: 'Error', message: error.message || 'Error interno en el login' });
        }
    });
}

module.exports = {
    registerAuthRoutes
};
