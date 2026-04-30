// Astro_project/backend/src/routes/missionRoutes.js

const express = require('express');

function registerMissionRoutes(app, { missionService }) {
    const router = express.Router();

    router.post('/claim', async (req, res) => {
        try {
            const { user, missionId, type } = req.body;
            const result = await missionService.claimMission(user, missionId, type);
            
            res.json({
                success: true,
                message: "¡Recompensa reclamada con éxito!",
                ...result
            });

        } catch (error) {
            console.error("❌ Error al reclamar misión:", error);
            res.status(error.message.includes('encontrado') ? 404 : 400).json({ message: error.message });
        }
    });

    app.use('/api/missions', router);
}

module.exports = { registerMissionRoutes };
