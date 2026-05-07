// Astro_project/backend/src/routes/planRoutes.js

function registerPlanRoutes(app, { userService }) {
    app.put('/api/user/plan', async (req, res) => {
        const { user, plan } = req.body;
        
        if (!user || !plan) {
            return res.status(400).json({ success: false, message: 'Usuario y plan requeridos' });
        }

        try {
            await userService.updatePlan(user, plan);
            res.json({ success: true, message: 'Plan actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar plan:', error);
            res.status(error.message.includes('encontrado') ? 404 : 500).json({ message: error.message });
        }
    });

    app.put('/api/user/password', async (req, res) => {
        const { user, oldPassword, newPassword } = req.body;

        if (!user || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Usuario, contraseña actual y nueva contraseña requeridos'
            });
        }

        try {
            await userService.changePassword(user, oldPassword, newPassword);
            res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            const status = error.message.includes('no encontrado')
                ? 404
                : error.message.includes('incorrecta')
                    ? 401
                    : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    });
}

module.exports = {
    registerPlanRoutes
};
