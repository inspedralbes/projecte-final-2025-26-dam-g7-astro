function registerAuthRoutes(app, {
    getDB,
    updateStreak,
    normalizeAchievementIds,
    normalizeAndPersistInventory,
    getInventoryQuantity,
    normalizeActiveBoosters
}) {
    app.post('/api/auth/register', async (req, res) => {
        const { username, password, rank } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Nombre y contraseña requeridos.' });
        }

        try {
            const db = getDB();
            const existingUser = await db.collection('users').findOne({ user: username });

            if (existingUser) return res.status(409).json({ message: 'El ID de tripulante ya existe.' });

            const newUser = {
                user: username,
                pass: password,
                rank: rank || 'Cadete de Vuelo',
                plan: 'INDIVIDUAL_FREE',
                coins: 1000,
                level: 1,
                xp: 0,
                // --- AÑADIDO: Inicialización del mapa ---
                mapLevel: 1, 
                // ----------------------------------------
                inventory: [],
                selectedAchievements: [null, null, null],
                unlockedAchievements: [],
                streak: 0,
                streakFreezes: 0,
                activeBoosters: normalizeActiveBoosters(),
                avatar: 'Astronauta_blanc.jpg',
                lastActivity: new Date(),
                createdAt: new Date()
            };

            await db.collection('users').insertOne(newUser);
            res.status(201).json({ message: 'Reclutamiento completado exitosamente.' });
        } catch (error) {
            res.status(500).json({ message: 'Error en el sistema de registro.' });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        const username = req.body.username || req.body.user;
        const password = req.body.password || req.body.pass;

        try {
            const db = getDB();
            const usersCollection = db.collection('users');
            const query = { 
                $or: [
                    { user: username, pass: password }
                ]
            };
            if (!isNaN(Number(username))) {
                query.$or.push({ user: Number(username), pass: password });
            }

            const foundUser = await usersCollection.findOne(query);

            if (!foundUser) {
                return res.status(401).json({ status: 'Error', message: 'Credenciales no reconocidas' });
            }

            console.log(`🚀 Sesión iniciada: ${foundUser.user}`);
            const normalizedInventory = await normalizeAndPersistInventory(foundUser, usersCollection);
            const freezeUnits = getInventoryQuantity(normalizedInventory, 2);
            const streakResult = await updateStreak(foundUser.user, false);
            const activeBoosters = normalizeActiveBoosters(foundUser.activeBoosters);

            res.json({
                status: 'Sincronización completada',
                token: 'session_token_' + Math.random().toString(36).substr(2),
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan || 'INDIVIDUAL_FREE',
                    rank: foundUser.rank || 'Cadete de Vuelo',
                    coins: foundUser.coins !== undefined ? foundUser.coins : 1000,
                    level: foundUser.level || 1,
                    xp: foundUser.xp || 0,
                    // --- CORRECCIÓN: Sincronización del nivel del mapa ---
                    mapLevel: foundUser.mapLevel || 1, 
                    // ----------------------------------------------------
                    selectedAchievements: foundUser.selectedAchievements || [null, null, null],
                    unlockedAchievements: normalizeAchievementIds(foundUser.unlockedAchievements || []),
                    streak: streakResult.streak,
                    streakFreezes: Math.max(foundUser.streakFreezes || 0, freezeUnits),
                    activeBoosters,
                    avatar: foundUser.avatar || 'Astronauta_blanc.jpg',
                    needsFreeze: streakResult.needsFreeze,
                    lastActivity: foundUser.lastActivity,
                    lastGame: streakResult.lastGame,
                    // Opcional: Añade estos para que las estadísticas no aparezcan vacías al loguear
                    gameHistory: foundUser.gameHistory || [],
                    maxScores: foundUser.maxScores || {},
                    totalGamesPlayed: foundUser.totalGamesPlayed || 0,
                    totalPoints: foundUser.totalPoints || 0
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    });
}

module.exports = {
    registerAuthRoutes
};
