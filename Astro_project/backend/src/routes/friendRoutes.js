const express = require('express');

function registerFriendRoutes(app, { getCollections }) {
    const router = express.Router();

    // AÑADIR AMIGO (Bidireccional por seguridad, aunque habitualmente usarás /accept)
    router.post('/add', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            if (user === friendName) {
                return res.status(400).json({ message: "No puedes ser amigo de ti mismo" });
            }

            // Verificar que el amigo existe
            const friendQuery = { $or: [{ user: friendName }] };
            if (!isNaN(Number(friendName))) {
                friendQuery.$or.push({ user: Number(friendName) });
            }

            const friendExists = await users.findOne(friendQuery);
            if (!friendExists) {
                return res.status(404).json({ message: "Ese explorador no existe" });
            }

            // Usamos $addToSet para no duplicar si ya son amigos (Añadir a tu lista)
            const userQuery = { $or: [{ user: user }] };
            if (!isNaN(Number(user))) {
                userQuery.$or.push({ user: Number(user) });
            }

            await users.updateOne(userQuery, { $addToSet: { friends: friendName } });

            // Añadirte a ti a la lista del amigo (Reciprocidad)
            await users.updateOne(
                { user: friendName },
                { $addToSet: { friends: user } }
            );

            // Devolver tu lista actualizada
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

    // ELIMINAR AMIGO (Bidireccional)
    router.post('/remove', async (req, res) => {
        try {
            const { user, friendName } = req.body;
            const { users } = getCollections();

            // 1. Sacar al amigo de tu array
            await users.updateOne(
                { user: user },
                { $pull: { friends: friendName } }
            );

            // 2. Sacarte a ti del array de tu amigo (Reciprocidad)
            await users.updateOne(
                { user: friendName },
                { $pull: { friends: user } }
            );

            // Devolver tu lista actualizada
            const updatedUser = await users.findOne({ user }, { projection: { friends: 1 } });

            res.json({
                success: true,
                friends: updatedUser.friends || []
            });

        } catch (error) {
            console.error("Error eliminando amigo:", error);
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

            // ¿Ya sois amigos?
            if (friendExists.friends && friendExists.friends.includes(user)) {
                return res.status(400).json({ message: "Ya sois amigos" });
            }

            // Añadir al receptor la petición (tú solicitas amistad a friendName)
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

            // 1. Añadir a "user" el amigo "friendName", y quitar de friendRequests
            await users.updateOne(
                { user: user },
                {
                    $addToSet: { friends: friendName },
                    $pull: { friendRequests: friendName }
                }
            );

            // 2. Añadir a "friendName" el amigo "user"
            await users.updateOne(
                { user: friendName },
                { $addToSet: { friends: user } }
            );

            // Devolver las nuevas listas de "user"
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

            // Simplemente quitar de friendRequests de tu usuario
            await users.updateOne(
                { user: user },
                { $pull: { friendRequests: friendName } }
            );

            // Devolver la lista de solicitudes actualizada
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