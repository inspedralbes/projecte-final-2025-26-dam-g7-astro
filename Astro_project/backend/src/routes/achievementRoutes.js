function registerAchievementRoutes(app, { getCollections, getDB, normalizeAchievementIds }) {
    app.get('/api/users/:username/achievements', async (req, res) => {
        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ success: false, message: 'Usuario requerido.' });
        }

        try {
            const { users } = getCollections();
            const userDoc = await users.findOne(
                { 
                    $or: [
                        { user: username },
                        { user: isNaN(Number(username)) ? null : Number(username) }
                    ]
                },
                { projection: { selectedAchievements: 1, unlockedAchievements: 1 } }
            );

            if (!userDoc) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            res.json({
                success: true,
                selectedAchievements: Array.isArray(userDoc.selectedAchievements)
                    ? userDoc.selectedAchievements
                    : [null, null, null],
                unlockedAchievements: normalizeAchievementIds(userDoc.unlockedAchievements || [])
            });
        } catch (error) {
            console.error('Error obteniendo logros del usuario:', error);
            res.status(500).json({ success: false, message: 'No se pudieron obtener los logros.' });
        }
    });

    app.put('/api/user/achievements/unlocked', async (req, res) => {
        const { user, unlockedAchievements } = req.body;

        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario no identificado.' });
        }
        if (!Array.isArray(unlockedAchievements)) {
            return res.status(400).json({ success: false, message: 'Formato de logros desbloqueados no válido.' });
        }

        const normalizedUnlocked = normalizeAchievementIds(unlockedAchievements);
        if (normalizedUnlocked.length > 200) {
            return res.status(400).json({ success: false, message: 'Demasiados logros desbloqueados.' });
        }

        try {
            const { users } = getCollections();
            const result = await users.updateOne(
                { user },
                { $set: { unlockedAchievements: normalizedUnlocked } }
            );

            if (!result.matchedCount) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            res.json({
                success: true,
                message: 'Logros desbloqueados actualizados correctamente.',
                unlockedAchievements: normalizedUnlocked
            });
        } catch (error) {
            console.error('Error actualizando logros desbloqueados:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    });

    app.put('/api/user/achievements', async (req, res) => {
        const { user, achievements } = req.body;
        console.log(`🏅 Actualizando logros para: ${user}`, achievements);

        if (!user) return res.status(400).json({ success: false, message: 'Usuario no identificado' });
        if (!Array.isArray(achievements) || achievements.length > 3) {
            return res.status(400).json({ success: false, message: 'Lista de logros no válida (máximo 3)' });
        }

        try {
            const db = getDB();
            const usersCol = db.collection('users');

            await usersCol.updateOne(
                { user },
                { $set: { selectedAchievements: achievements } }
            );

            res.json({ success: true, message: 'Logros actualizados correctamente' });
        } catch (error) {
            console.error('Error al actualizar logros:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    });
}

module.exports = {
    registerAchievementRoutes
};
