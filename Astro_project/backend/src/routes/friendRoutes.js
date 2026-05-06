// Astro_project/backend/src/routes/friendRoutes.js

const express = require('express');
const roomManager = require('../ws/RoomManager');

function registerFriendRoutes(app, { socialService }) {
    const router = express.Router();

    router.post('/add', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const friends = await socialService.addFriend(user, friendName);
            
            // Notificar al que añadió (User A)
            roomManager.sendToUser(user, { type: 'FRIEND_UPDATE', friends });
            
            // Notificar al que fue añadido (User B)
            const friendProfile = await socialService.userRepo.findByUsername(friendName);
            if (friendProfile) {
                roomManager.sendToUser(friendName, { 
                    type: 'FRIEND_UPDATE', 
                    friends: friendProfile.friends 
                });
            }

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
            
            // Notificar al que eliminó (User A)
            roomManager.sendToUser(user, { type: 'FRIEND_UPDATE', friends });
            
            // Notificar al que fue eliminado (User B)
            const friendProfile = await socialService.userRepo.findByUsername(friendName);
            if (friendProfile) {
                roomManager.sendToUser(friendName, { 
                    type: 'FRIEND_UPDATE', 
                    friends: friendProfile.friends 
                });
            }

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
            
            // Notificar al receptor que tiene una nueva solicitud
            const recipientProfile = await socialService.userRepo.findByUsername(friendName);
            roomManager.sendToUser(friendName, { 
                type: 'FRIEND_REQUEST_UPDATE', 
                friendRequests: recipientProfile.friendRequests 
            });

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
            
            // 1. Notificar al que aceptó (User A)
            roomManager.sendToUser(user, { 
                type: 'FRIEND_ACCEPT_NOTIF', 
                friends: result.friends,
                friendRequests: result.friendRequests
            });

            // 2. Notificar al que envió la solicitud (User B)
            const friendProfile = await socialService.userRepo.findByUsername(friendName);
            if (friendProfile) {
                roomManager.sendToUser(friendName, { 
                    type: 'FRIEND_UPDATE', 
                    friends: friendProfile.friends 
                });
            }

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
            
            // Notificar al usuario que rechazó para actualizar su lista de pendientes
            roomManager.sendToUser(user, { type: 'FRIEND_REQUEST_UPDATE', friendRequests });

            res.json({ success: true, friendRequests });
        } catch (error) {
            console.error("Error rechazando solicitud:", error);
            res.status(500).json({ message: error.message });
        }
    });

    app.use('/api/friends', router);
}

module.exports = { registerFriendRoutes };
