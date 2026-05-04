// Astro_project/backend/src/routes/friendRoutes.js

const express = require('express');

function registerFriendRoutes(app, { socialService }) {
    const router = express.Router();

    router.post('/add', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const friends = await socialService.addFriend(user, friendName);
            res.json({ success: true, friends });
        } catch (error) {
            console.error("Error añadiendo amigo:", error);
            res.status(error.message.includes('existe') ? 404 : 400).json({ message: error.message });
        }
    });

    router.post('/remove', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const friends = await socialService.removeFriend(user, friendName);
            res.json({ success: true, friends });
        } catch (error) {
            console.error("Error eliminando amigo:", error);
            res.status(500).json({ message: error.message });
        }
    });

    router.post('/request', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            await socialService.sendFriendRequest(user, friendName);
            res.json({ success: true, message: "Solicitud enviada" });
        } catch (error) {
            console.error("Error enviando solicitud:", error);
            res.status(error.message.includes('existe') ? 404 : 400).json({ message: error.message });
        }
    });

    router.post('/accept', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const result = await socialService.acceptFriendRequest(user, friendName);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error("Error aceptando solicitud:", error);
            res.status(500).json({ message: error.message });
        }
    });

    router.post('/reject', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const friendRequests = await socialService.rejectFriendRequest(user, friendName);
            res.json({ success: true, friendRequests });
        } catch (error) {
            console.error("Error rechazando solicitud:", error);
            res.status(500).json({ message: error.message });
        }
    });

    app.use('/api/friends', router);
}

module.exports = { registerFriendRoutes };
