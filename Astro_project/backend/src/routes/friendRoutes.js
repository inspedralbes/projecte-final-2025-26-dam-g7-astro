const express = require('express');

function registerFriendRoutes(app, { getCollections }) {
    const router = express.Router();

    // AÑADIR AMIGO
    router.post('/add', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            if (user === friendName) {
                return res.status(400).json({ message: "No puedes ser amigo de ti mismo" });
            }

            // Verificar que el amigo existe
            const friendExists = await users.findOne({ user: friendName });
            if (!friendExists) {
                return res.status(404).json({ message: "Ese explorador no existe" });
            }

            // Usamos $addToSet para no duplicar si ya son amigos
            await users.updateOne(
                { user: user },
                { $addToSet: { friends: friendName } }
            );

            // Devolver la lista actualizada
            const updatedUser = await users.findOne({ user }, { projection: { friends: 1 } });

            res.json({
                success: true,
                friends: updatedUser.friends || []
            });

        } catch (error) {
            console.error("Error añadiendo amigo:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    });

    // ELIMINAR AMIGO
    router.post('/remove', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            // Usamos $pull para sacar al amigo del array
            await users.updateOne(
                { user: user },
                { $pull: { friends: friendName } }
            );

            const updatedUser = await users.findOne({ user }, { projection: { friends: 1 } });

            res.json({
                success: true,
                friends: updatedUser.friends || []
            });

        } catch (error) {
            res.status(500).json({ message: "Error eliminando amigo" });
        }
    });

    // ENVIAR SOLICITUD
    router.post('/request', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            if (user === friendName) {
                return res.status(400).json({ message: "No te puedes enviar solicitud a ti mismo" });
            }

            const friendExists = await users.findOne({ user: friendName });
            if (!friendExists) {
                return res.status(404).json({ message: "Ese explorador no existe" });
            }

            // Ya son amigos?
            if (friendExists.friends && friendExists.friends.includes(user)) {
                return res.status(400).json({ message: "Ya sois amigos" });
            }

            // Añadir al receptor la petición
            await users.updateOne(
                { user: friendName },
                { $addToSet: { friendRequests: user } }
            );

            res.json({ success: true, message: "Solicitud enviada" });
        } catch (error) {
            console.error("Error enviando solicitud:", error);
            res.status(500).json({ message: "Error enviando solicitud" });
        }
    });

    // ACEPTAR SOLICITUD
    router.post('/accept', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            // Añadir a "user" el amigo "friendName", y quitar de friendRequests
            await users.updateOne(
                { user: user },
                {
                    $addToSet: { friends: friendName },
                    $pull: { friendRequests: friendName }
                }
            );

            // Añadir a "friendName" el amigo "user"
            await users.updateOne(
                { user: friendName },
                { $addToSet: { friends: user } }
            );

            // Devolver las nuevas listas
            const updatedUser = await users.findOne({ user }, { projection: { friends: 1, friendRequests: 1 } });

            res.json({
                success: true,
                friends: updatedUser.friends || [],
                friendRequests: updatedUser.friendRequests || []
            });
        } catch (error) {
            console.error("Error aceptando solicitud:", error);
            res.status(500).json({ message: "Error aceptando solicitud" });
        }
    });

    // RECHAZAR SOLICITUD
    router.post('/reject', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            // Simplemente quitar de friendRequests
            await users.updateOne(
                { user: user },
                { $pull: { friendRequests: friendName } }
            );

            const updatedUser = await users.findOne({ user }, { projection: { friends: 1, friendRequests: 1 } });

            res.json({
                success: true,
                friendRequests: updatedUser.friendRequests || []
            });
        } catch (error) {
            console.error("Error rechazando solicitud:", error);
            res.status(500).json({ message: "Error rechazando solicitud" });
        }
    });

    app.use('/api/friends', router);
}

module.exports = { registerFriendRoutes };