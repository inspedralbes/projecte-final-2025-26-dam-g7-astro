function registerPlanRoutes(app, { getDB }) {
    app.put('/api/user/plan', async (req, res) => {
        const { user, plan } = req.body;
        console.log(`🌌 Actualizando plan para: ${user} -> ${plan}`);

        if (!user || !plan) {
            return res.status(400).json({ success: false, message: 'Usuario y plan requeridos' });
        }

        try {
            const db = getDB();
            const usersCol = db.collection('users');

            await usersCol.updateOne(
                { user },
                { $set: { plan } }
            );

            res.json({ success: true, message: 'Plan actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar plan:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    });
}

module.exports = {
    registerPlanRoutes
};
