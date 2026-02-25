const express = require('express');

function registerMultiplayerRoutes(app, { getCollections }) {
    const router = express.Router();

    // Obtener todas las salas disponibles (estado LOBBY)
    router.get('/rooms', async (req, res) => {
        try {
            const { rooms } = getCollections();
            const availableRooms = await rooms.find({ status: 'LOBBY', isPublic: true }).toArray();
            res.json(availableRooms);
        } catch (error) {
            console.error("❌ Error obteniendo salas:", error);
            res.status(500).json({ message: "Error al obtener salas" });
        }
    });

    app.use('/api/multiplayer', router);
}

module.exports = { registerMultiplayerRoutes };
