const express = require('express');

function registerMissionRoutes(app, { getCollections }) {
    const router = express.Router();

    // Ruta para reclamar recompensas de misiones (diarias o semanales)
    router.post('/claim', async (req, res) => {
        try {
            const { user, missionId, type } = req.body;
            const { users } = getCollections();

            // 1. Buscamos al usuario por nombre
            const userDoc = await users.findOne({ user });
            if (!userDoc) return res.status(404).json({ message: "Usuario no encontrado" });

            // 2. Identificamos si es diaria o semanal
            const missionKey = type === 'daily' ? 'dailyMissions' : 'weeklyMissions';
            const missions = userDoc[missionKey] || [];
            
            // Buscamos la misión específica dentro del array del usuario
            const mission = missions.find(m => m.id === missionId);

            if (!mission) return res.status(404).json({ message: "Misión no encontrada" });
            if (!mission.completed) return res.status(400).json({ message: "La misión aún no está completada" });
            if (mission.claimed) return res.status(400).json({ message: "Esta recompensa ya ha sido reclamada" });

            // 3. Aplicamos los cambios en MongoDB
            // Marcamos como reclamada, sumamos las monedas y aumentamos el contador de misiones completadas
            await users.updateOne(
                { user, [`${missionKey}.id`]: missionId }, 
                { 
                    $set: { [`${missionKey}.$.claimed`]: true },
                    $inc: { 
                        coins: mission.reward || 0,
                        missionsCompleted: 1
                    }
                }
            );

            // 4. Obtenemos los datos actualizados para responder al frontend
            const updatedUser = await users.findOne({ user });
            
            res.json({
                success: true,
                message: "¡Recompensa reclamada con éxito!",
                newBalance: updatedUser.coins,
                dailyMissions: updatedUser.dailyMissions,
                weeklyMissions: updatedUser.weeklyMissions
            });

        } catch (error) {
            console.error("❌ Error al reclamar misión:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    });

    app.use('/api/missions', router);
}

module.exports = { registerMissionRoutes };