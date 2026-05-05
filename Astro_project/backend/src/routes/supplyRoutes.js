
function registerSupplyRoutes(app, { supplyService, userRepository }) {
    
    // Crear o actualizar un set de suministros
    app.post('/api/supplies', async (req, res) => {
        const { ownerId, name, type, content } = req.body;
        try {
            const result = await supplyService.createSupplySet(ownerId, { name, type, content });
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Obtener todos los sets de un propietario (profe/centro)
    app.get('/api/supplies/:ownerId', async (req, res) => {
        try {
            const sets = await supplyService.getSupplySetsByOwner(req.params.ownerId);
            res.json(sets);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Obtener el set activo para un estudiante (via su profe)
    app.get('/api/supplies/active/:username', async (req, res) => {
        try {
            const user = await userRepository.findByUsername(req.params.username);
            if (!user || !user.parentId) {
                return res.json(null);
            }
            const activeSet = await supplyService.getActiveSupplySet(user.parentId);
            res.json(activeSet);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Activar un set específico
    app.put('/api/supplies/activate/:id', async (req, res) => {
        const { ownerId } = req.body;
        try {
            // Primero desactivamos todos los del dueño
            const sets = await supplyService.getSupplySetsByOwner(ownerId);
            for (const set of sets) {
                await supplyService.updateSupplySet(set._id, { active: false });
            }
            // Activamos el elegido
            await supplyService.updateSupplySet(req.params.id, { active: true });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Eliminar un set
    app.delete('/api/supplies/:id', async (req, res) => {
        try {
            await supplyService.deleteSupplySet(req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
}

module.exports = { registerSupplyRoutes };
