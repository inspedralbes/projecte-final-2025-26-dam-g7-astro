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

    app.post('/api/tournament/join', async (req, res) => {
        const { user, tournamentId, cost } = req.body;

        if (!user || !tournamentId || cost === undefined) {
            return res.status(400).json({ message: 'Usuario, ID de torneo y coste requeridos.' });
        }

        try {
            const result = await gameService.joinTournament(user, tournamentId, cost);
            res.json(result);
        } catch (error) {
            console.error('❌ Error al inscribirse al torneo:', error);
            res.status(error.message === 'Saldo insuficiente' ? 400 : 500).json({ 
                message: error.message || 'Error interno al procesar la inscripción.' 
            });
        }
    });
}

module.exports = {
    registerGameRoutes
};
