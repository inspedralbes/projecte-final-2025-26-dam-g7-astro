function registerInventoryRoutes(app, {
    getCollections,
    normalizeAndPersistInventory,
    getInventoryQuantity,
    serializeInventory,
    enrichInventory,
    toPositiveInteger,
    getInventoryCatalogItem,
    BOOSTER_ITEMS,
    normalizeActiveBoosters
}) {
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
                inventory: enrichInventory(normalizedInventory)
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
            const activeBoosters = normalizeActiveBoosters(userDoc.activeBoosters);

            res.json({
                inventory: enrichInventory(normalizedInventory),
                activeBoosters
            });
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            res.status(500).json({ message: 'Error al obtener el inventario.' });
        }
    });

    app.post('/api/inventory/use-item', async (req, res) => {
        const { user, itemId } = req.body;

        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario requerido.' });
        }

        const parsedItemId = toPositiveInteger(itemId);
        if (!parsedItemId) {
            return res.status(400).json({ success: false, message: 'Item inválido.' });
        }

        const boosterConfig = BOOSTER_ITEMS[parsedItemId];
        if (!boosterConfig) {
            return res.status(400).json({ success: false, message: 'Este objeto no se puede utilizar.' });
        }

        try {
            const { users } = getCollections();
            const userDoc = await users.findOne({ user });

            if (!userDoc) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            const normalizedInventory = await normalizeAndPersistInventory(userDoc, users);
            const itemIndex = normalizedInventory.findIndex((entry) => entry.id === parsedItemId);

            if (itemIndex === -1 || normalizedInventory[itemIndex].quantity <= 0) {
                return res.status(400).json({ success: false, message: 'No tienes unidades disponibles de este objeto.' });
            }

            const updatedInventory = [...normalizedInventory];
            if (updatedInventory[itemIndex].quantity > 1) {
                updatedInventory[itemIndex] = {
                    ...updatedInventory[itemIndex],
                    quantity: updatedInventory[itemIndex].quantity - 1
                };
            } else {
                updatedInventory.splice(itemIndex, 1);
            }

            const activeBoosters = normalizeActiveBoosters(userDoc.activeBoosters);
            const currentValue = activeBoosters[boosterConfig.key] || 0;
            const nextValue = Math.min(99, currentValue + boosterConfig.durationGames);
            const updatedBoosters = {
                ...activeBoosters,
                [boosterConfig.key]: nextValue
            };

            const serializedInventory = serializeInventory(updatedInventory);

            await users.updateOne(
                { _id: userDoc._id },
                {
                    $set: {
                        inventory: serializedInventory,
                        activeBoosters: updatedBoosters,
                        lastActivity: new Date()
                    }
                }
            );

            return res.json({
                success: true,
                inventory: enrichInventory(serializedInventory),
                activeBoosters: updatedBoosters
            });
        } catch (error) {
            console.error('Error al usar objeto de inventario:', error);
            return res.status(500).json({ success: false, message: 'Error al utilizar el objeto.' });
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
