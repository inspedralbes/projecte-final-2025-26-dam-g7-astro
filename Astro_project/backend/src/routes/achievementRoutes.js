// Astro_project/backend/src/routes/achievementRoutes.js

function registerAchievementRoutes(app, { achievementService }) {
    app.get('/api/users/:username/achievements', async (req, res) => {
        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ success: false, message: 'Usuario requerido.' });
        }

        try {
            const result = await achievementService.getUserAchievements(username);
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error obteniendo logros del usuario:', error);
            res.status(error.message.includes('encontrado') ? 404 : 500)
               .json({ success: false, message: error.message || 'No se pudieron obtener los logros.' });
        }
    });

    app.put('/api/user/achievements/unlocked', async (req, res) => {
        const { user, unlockedAchievements } = req.body;

        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario no identificado.' });
        }

        try {
            const normalizedUnlocked = await achievementService.updateUnlockedAchievements(user, unlockedAchievements);

            res.json({
                success: true,
                message: 'Logros desbloqueados actualizados correctamente.',
                unlockedAchievements: normalizedUnlocked
            });
        } catch (error) {
            console.error('Error actualizando logros desbloqueados:', error);
            res.status(error.message.includes('encontrado') ? 404 : 400)
               .json({ success: false, message: error.message || 'Error interno del servidor.' });
        }
    });

    app.put('/api/user/achievements', async (req, res) => {
        const { user, achievements } = req.body;

        if (!user) return res.status(400).json({ success: false, message: 'Usuario no identificado' });

        try {
            await achievementService.updateSelectedAchievements(user, achievements);
            res.json({ success: true, message: 'Logros actualizados correctamente' });
        } catch (error) {
            console.error('Error al actualizar logros:', error);
            res.status(error.message.includes('encontrado') ? 404 : 400)
               .json({ success: false, message: error.message || 'Error interno del servidor' });
        }
    });
}

module.exports = {
    registerAchievementRoutes
};
