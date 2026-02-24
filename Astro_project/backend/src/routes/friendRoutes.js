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

    app.use('/api/friends', router);
}

module.exports = { registerFriendRoutes };