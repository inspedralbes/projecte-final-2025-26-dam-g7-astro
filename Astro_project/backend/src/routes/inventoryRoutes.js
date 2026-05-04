// Astro_project/backend/src/routes/inventoryRoutes.js

function registerInventoryRoutes(app, { inventoryService }) {
    app.post('/api/user/use-freeze', async (req, res) => {
        const { user } = req.body;
        if (!user) return res.status(400).json({ success: false, message: 'Usuario requerido' });

        try {
            const result = await inventoryService.useFreeze(user);
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error al usar congelador:', error);
            res.status(error.message === 'Usuario no encontrado' ? 404 : 500).json({ 
                message: error.message || 'Error al usar el congelador.' 
            });
        }
    });

    app.get('/api/users/:username/inventory', async (req, res) => {
        const username = req.params.username;
        try {
            const user = await inventoryService.userRepo.findByUsername(username);
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

            const normalizedInventory = await inventoryService.normalizeAndPersistInventory(user);

            res.json({
                inventory: inventoryService.enrichInventory(normalizedInventory),
                activeBoosters: inventoryService.normalizeActiveBoosters(user.activeBoosters)
            });
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            res.status(500).json({ message: 'Error al obtener el inventario.' });
        }
    });

    app.post('/api/inventory/use-item', async (req, res) => {
        const { user, itemId } = req.body;
        if (!user) return res.status(400).json({ success: false, message: 'Usuario requerido.' });

        try {
            const result = await inventoryService.useItem(user, itemId);
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error usando item del inventario:', error);
            res.status(error.message === 'Usuario no encontrado' ? 404 : 500).json({ 
                success: false, 
                message: error.message || 'Error al usar el objeto.' 
            });
        }
    });

    app.post('/api/inventory/toggle-equip', async (req, res) => {
        const { user, itemId } = req.body;
        try {
            const result = await inventoryService.toggleEquip(user, itemId);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error toggle-equip:', error);
            res.status(error.message === 'Usuario no encontrado' ? 404 : 500).json({ 
                message: error.message || 'Error al cambiar equipamiento.' 
            });
        }
    });
}

module.exports = {
    registerInventoryRoutes
};
