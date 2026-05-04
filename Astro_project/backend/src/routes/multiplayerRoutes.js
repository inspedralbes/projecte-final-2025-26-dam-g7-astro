// Astro_project/backend/src/routes/multiplayerRoutes.js

const express = require('express');

function registerMultiplayerRoutes(app, { multiplayerService }) {
    const router = express.Router();

    router.get('/rooms', async (req, res) => {
        try {
            const availableRooms = await multiplayerService.getPublicLobbies();
            res.json(availableRooms);
        } catch (error) {
            console.error("❌ Error obteniendo salas:", error);
            res.status(500).json({ message: "Error al obtener salas" });
        }
    });

    app.use('/api/multiplayer', router);
}

module.exports = { registerMultiplayerRoutes };
