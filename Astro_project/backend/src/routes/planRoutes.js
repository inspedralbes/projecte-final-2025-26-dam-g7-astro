// Astro_project/backend/src/routes/planRoutes.js

function registerPlanRoutes(app, { userService }) {
    app.put('/api/user/plan', async (req, res) => {
        const { user, plan, groupType, role } = req.body;
        
        if (!user || !plan) {
            return res.status(400).json({ success: false, message: 'Usuario y plan requeridos' });
        }

        try {
            const state = await userService.updatePlan(user, plan, { groupType, role });
            res.json({ success: true, message: 'Plan actualizado correctamente', profile: state });
        } catch (error) {
            console.error('Error al actualizar plan:', error);
            const status = error.message.includes('encontrado')
                ? 404
                : error.message.includes('aprobación') || error.message.includes('groupType') || error.message.includes('responsable')
                    ? 400
                    : 500;
            res.status(status).json({ success: false, message: error.message });
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

    app.post('/api/user/plan/group-owner/downgrade-request', async (req, res) => {
        const { user, password, targetPlan } = req.body;

        if (!user || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña actual requeridos'
            });
        }

        try {
            const scheduledPlanDowngrade = await userService.requestGroupOwnerPlanDowngrade(user, password, targetPlan);
            res.json({ success: true, scheduledPlanDowngrade });
        } catch (error) {
            console.error('Error al programar baja grupal:', error);
            const status = error.message.includes('no encontrado')
                ? 404
                : error.message.includes('incorrecta')
                    ? 401
                    : error.message.includes('responsable') || error.message.includes('existe')
                        ? 400
                        : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    });

    app.post('/api/user/plan/group-owner/downgrade-cancel', async (req, res) => {
        const { user } = req.body;
        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario requerido' });
        }

        try {
            await userService.cancelGroupOwnerPlanDowngrade(user);
            res.json({ success: true });
        } catch (error) {
            console.error('Error cancelando baja grupal:', error);
            const status = error.message.includes('no encontrado') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    });

    app.post('/api/user/plan/process-scheduled', async (req, res) => {
        const { user } = req.body;
        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario requerido' });
        }

        try {
            const result = await userService.processScheduledPlanDowngrade(user);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error procesando bajas programadas:', error);
            const status = error.message.includes('no encontrado') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    });
}

module.exports = {
    registerPlanRoutes
};
