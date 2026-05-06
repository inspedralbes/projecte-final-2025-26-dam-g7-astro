
function registerSupplyRoutes(app, { supplyService, userRepository }) {
    
    // Crear o actualizar un set de suministros
    app.post('/api/supplies', async (req, res) => {
        const { ownerId, name, type, content, gameId } = req.body;
        try {
            console.log('--- POST /api/supplies ---');
            console.log('Data received:', { ownerId, name, type, gameId });
            
            // Busquem qui és el centre (parentId) si el creador és un profe
            const owner = await userRepository.findByUsername(ownerId);
            if (!owner) {
                console.error(`User not found: ${ownerId}`);
                return res.status(404).json({ success: false, message: 'Owner not found' });
            }

            let centerId = ownerId; // Per defecte ell mateix (si és centre)
            if (owner.role === 'TEACHER') {
                centerId = owner.parentId;
            }
            console.log(`Determined centerId: ${centerId}`);

            const result = await supplyService.createSupplySet(ownerId, { 
                name, type, content, gameId, centerId 
            });
            res.json(result);
        } catch (error) {
            console.error('Error in POST /api/supplies:', error);
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

    // Obtener todos los sets de un centro (incluyendo los de sus profes)
    app.get('/api/supplies/center/:centerId', async (req, res) => {
        try {
            const sets = await supplyService.getSupplySetsByCenter(req.params.centerId);
            res.json(sets);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Obtener el set activo para un estudiante (via su profe)
    // Definimos dos rutas separadas para evitar problemas con parámetros opcionales en ciertas versiones de express
    app.get('/api/supplies/active/:username', async (req, res) => {
        try {
            const user = await userRepository.findByUsername(req.params.username);
            if (!user || !user.parentId) {
                return res.json(null);
            }
            const activeSet = await supplyService.getActiveSupplySet(user.parentId, null);
            res.json(activeSet);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.get('/api/supplies/active/:username/:gameId', async (req, res) => {
        try {
            const user = await userRepository.findByUsername(req.params.username);
            if (!user || !user.parentId) {
                return res.json(null);
            }
            const activeSet = await supplyService.getActiveSupplySet(user.parentId, req.params.gameId);
            res.json(activeSet);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Activar un set específico
    app.put('/api/supplies/activate/:id', async (req, res) => {
        const { ownerId, gameId } = req.body;
        const setId = req.params.id;
        
        try {
            // Desactivamos los del mismo juego del dueño
            const sets = await supplyService.getSupplySetsByOwner(ownerId);
            for (const set of sets) {
                if (set.gameId === gameId) {
                    await supplyService.updateSupplySet(set._id, { active: false });
                }
            }

            // Si el ID es 'none', simplemente hemos limpiado los activos (volvemos a default)
            if (setId === 'none') {
                return res.json({ success: true, message: 'Reverted to default' });
            }

            // Si no, activamos el elegido (validando que sea un ObjectId válido antes)
            const { ObjectId } = require('mongodb');
            if (!ObjectId.isValid(setId)) {
                return res.status(400).json({ success: false, message: 'Invalid ID format' });
            }

            await supplyService.updateSupplySet(setId, { active: true });
            res.json({ success: true });
        } catch (error) {
            console.error('Error in PUT /api/supplies/activate:', error);
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
