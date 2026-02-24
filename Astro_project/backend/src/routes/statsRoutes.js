function registerStatsRoutes(app, { getUserStats }) {
    app.get('/api/users/:username/stats', async (req, res) => {
        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ message: 'Usuario requerido.' });
        }

        try {
            const stats = await getUserStats(username);
            if (!stats) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            res.json(stats);
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ message: 'No se pudieron obtener las estadísticas.' });
        }
    });

    app.get('/api/shop/balance/:username', async (req, res) => {
        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ message: 'Usuario requerido.' });
        }

        try {
            const stats = await getUserStats(username);
            if (!stats) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            res.json({
                user: stats.user,
                coins: stats.coins,
                gamesPlayed: stats.gamesPlayed
            });
        } catch (error) {
            console.error('Error obteniendo saldo:', error);
            res.status(500).json({ message: 'No se pudo obtener el saldo.' });
        }
    });
}

module.exports = {
    registerStatsRoutes
};
