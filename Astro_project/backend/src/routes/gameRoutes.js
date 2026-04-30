// backend/src/routes/gameRoutes.js

function registerGameRoutes(app, { gameService }) {
    app.post('/api/games/complete', async (req, res) => {
        const { user, game, score, completedMapNode, timeSeconds } = req.body;

        if (!user || !game) {
            return res.status(400).json({ message: 'Usuario y juego requeridos.' });
        }

        try {
            const result = await gameService.completeGame(user, {
                game,
                score,
                completedMapNode,
                timeSeconds
            });
            res.json(result);
        } catch (error) {
            console.error('❌ Error en completar juego:', error);
            res.status(error.message === 'Usuari no trobat' ? 404 : 500).json({ 
                message: error.message || 'Error interno al procesar el fin de partida.' 
            });
        }
    });
}

module.exports = {
    registerGameRoutes
};
