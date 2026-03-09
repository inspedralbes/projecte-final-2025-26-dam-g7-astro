function registerInventoryRoutes(app, {
    getCollections,
    normalizeAndPersistInventory,
    getInventoryQuantity,
    serializeInventory,
    enrichInventory,
    toPositiveInteger,
    getInventoryCatalogItem,
    normalizeActiveBoosters,
    getBoosterFieldByItemId,
    addBoosterDuration
}) {
    const updateMissionProgress = (missions, type, amount) => {
        if (!Array.isArray(missions)) return [];

        return missions.map((mission) => {
            if (mission.completed || mission.claimed) return mission;

            if (mission.type === type) {
                const nextProgress = Math.min(mission.goal || 0, (mission.progress || 0) + amount);
                mission.progress = nextProgress;
                if (nextProgress >= (mission.goal || 0)) {
                    mission.completed = true;
                }
            }

            return mission;
        });
    };

    app.post('/api/user/use-freeze', async (req, res) => {
        const { user } = req.body;
        if (!user) return res.status(400).json({ success: false, message: 'Usuario requerido' });

        try {
            const { users } = getCollections();
            const currentUser = await users.findOne({ user });
            if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado' });

            let normalizedInventory = await normalizeAndPersistInventory(currentUser, users);
            const currentFreezeUnits = getInventoryQuantity(normalizedInventory, 2);
            const availableFreezes = Math.max(currentUser.streakFreezes || 0, currentFreezeUnits);

            if (availableFreezes <= 0) {
                return res.status(400).json({ message: 'No tienes congeladores disponibles.' });
            }

            const freezeIndex = normalizedInventory.findIndex((entry) => entry.id === 2);
            if (freezeIndex !== -1) {
                if (normalizedInventory[freezeIndex].quantity > 1) {
                    normalizedInventory[freezeIndex].quantity -= 1;
                } else {
                    normalizedInventory.splice(freezeIndex, 1);
                }
            }

            normalizedInventory = serializeInventory(normalizedInventory);
            const updatedFreezeUnits = getInventoryQuantity(normalizedInventory, 2);

            await users.updateOne(
                { user },
                {
                    $set: {
                        streakFreezes: updatedFreezeUnits,
                        inventory: normalizedInventory,
                        lastActivity: new Date()
                    }
                }
            );

            res.json({
                success: true,
                streak: currentUser.streak,
                streakFreezes: updatedFreezeUnits,
                inventory: enrichInventory(normalizedInventory),
                activeBoosters: normalizeActiveBoosters(currentUser.activeBoosters)
            });
        } catch (error) {
            console.error('Error al usar congelador:', error);
            res.status(500).json({ message: 'Error al usar el congelador.' });
        }
    });

    app.get('/api/users/:username/inventory', async (req, res) => {
        const username = req.params.username;
        try {
            const { users } = getCollections();
            const userDoc = await users.findOne(
                { user: username },
                { projection: { inventory: 1, streakFreezes: 1, activeBoosters: 1 } }
            );

            if (!userDoc) return res.status(404).json({ message: 'Usuario no encontrado' });

            const normalizedInventory = await normalizeAndPersistInventory(userDoc, users);

            res.json({
                inventory: enrichInventory(normalizedInventory),
                activeBoosters: normalizeActiveBoosters(userDoc.activeBoosters)
            });
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            res.status(500).json({ message: 'Error al obtener el inventario.' });
        }
    });

    app.post('/api/inventory/use-item', async (req, res) => {
        const { user, itemId } = req.body;
        const parsedItemId = toPositiveInteger(itemId);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario requerido.' });
        }
        if (!parsedItemId) {
            return res.status(400).json({ success: false, message: 'Item inválido.' });
        }

        const boosterField = getBoosterFieldByItemId(parsedItemId);
        if (!boosterField) {
            return res.status(400).json({ success: false, message: 'Este objeto no se puede usar desde inventario.' });
        }

        try {
            const { users } = getCollections();
            const currentUser = await users.findOne({ user });
            if (!currentUser) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            let normalizedInventory = await normalizeAndPersistInventory(currentUser, users);
            const itemIndex = normalizedInventory.findIndex((entry) => entry.id === parsedItemId);

            if (itemIndex === -1 || normalizedInventory[itemIndex].quantity <= 0) {
                return res.status(400).json({ success: false, message: 'No tienes unidades disponibles.' });
            }

            if (normalizedInventory[itemIndex].quantity > 1) {
                normalizedInventory[itemIndex].quantity -= 1;
            } else {
                normalizedInventory.splice(itemIndex, 1);
            }

            normalizedInventory = serializeInventory(normalizedInventory);
            const nextActiveBoosters = addBoosterDuration(
                normalizeActiveBoosters(currentUser.activeBoosters),
                boosterField,
                3
            );

            const dailyMissions = updateMissionProgress(currentUser.dailyMissions || [], 'item', 1);
            const weeklyMissions = updateMissionProgress(currentUser.weeklyMissions || [], 'item', 1);

            await users.updateOne(
                { user },
                {
                    $set: {
                        inventory: normalizedInventory,
                        activeBoosters: nextActiveBoosters,
                        streakFreezes: getInventoryQuantity(normalizedInventory, 2),
                        dailyMissions,
                        weeklyMissions,
                        lastActivity: new Date()
                    }
                }
            );

            res.json({
                success: true,
                inventory: enrichInventory(normalizedInventory),
                activeBoosters: nextActiveBoosters,
                dailyMissions,
                weeklyMissions
            });
        } catch (error) {
            console.error('Error usando item del inventario:', error);
            res.status(500).json({ success: false, message: 'Error al usar el objeto.' });
        }
    });

    app.post('/api/inventory/toggle-equip', async (req, res) => {
        const { user, itemId } = req.body;
        try {
            const parsedItemId = toPositiveInteger(itemId);
            if (!parsedItemId) {
                return res.status(400).json({ message: 'Item inválido.' });
            }

            const { users } = getCollections();
            const userDoc = await users.findOne({ user });

            if (!userDoc) return res.status(404).json({ message: 'Usuario no encontrado' });

            let normalizedInventory = await normalizeAndPersistInventory(userDoc, users);
            const itemTarget = normalizedInventory.find((item) => item.id === parsedItemId);
            if (!itemTarget) return res.status(404).json({ message: 'Item no encontrado en inventario' });

            const itemMeta = getInventoryCatalogItem(parsedItemId);
            if (!itemMeta || itemMeta.cat === 'items') {
                return res.status(400).json({ message: 'Este objeto no se puede equipar.' });
            }

            const isEquipping = !itemTarget.equipped;

            const updatedInventory = normalizedInventory.map((item) => {
                if (item.id === parsedItemId) {
                    return { ...item, equipped: isEquipping };
                }

                const currentMeta = getInventoryCatalogItem(item.id);
                if (isEquipping && currentMeta?.cat === itemMeta.cat && item.equipped) {
                    return { ...item, equipped: false };
                }

                return item;
            });

            const serializedInventory = serializeInventory(updatedInventory);
            await users.updateOne(
                { user },
                { $set: { inventory: serializedInventory } }
            );

            res.json({ success: true, inventory: enrichInventory(serializedInventory) });
        } catch (error) {
            console.error('Error toggle-equip:', error);
            res.status(500).json({ message: 'Error al cambiar equipamiento.' });
        }
    });
}

module.exports = {
    registerInventoryRoutes
};
