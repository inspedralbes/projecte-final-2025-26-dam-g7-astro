const { WHEEL_ITEMS } = require('../constants/inventory');

function registerShopRoutes(app, {
    getCollections,
    normalizeAndPersistInventory,
    toPositiveInteger,
    getItemMaxQuantity,
    getInventoryCatalogItem,
    serializeInventory,
    getInventoryQuantity,
    enrichInventory
}) {
    // 1. ENDPOINT: GIRAR LA RULETA
    app.post('/api/shop/spin', async (req, res) => {
        const { user } = req.body;
        try {
            const { users: usersCol } = getCollections();
            const currentUser = await usersCol.findOne({ user });

            if (!currentUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            const currentTickets = currentUser.tickets || 0; 
            const SPIN_COST = 100; // COSTE FORZADO A 100

            let finalCoins = currentCoins;
            let finalTickets = currentTickets;

            if (currentTickets > 0) {
                finalTickets -= 1;
            } else if (currentCoins >= SPIN_COST) {
                finalCoins -= SPIN_COST;
            } else {
                return res.status(402).json({ success: false, message: 'Saldo insuficiente' });
            }

            const items = WHEEL_ITEMS.filter((i) => i.weight > 0);
            const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
            let random = Math.random() * totalWeight;
            let prize = items[0];

            for (const item of items) {
                if (random < item.weight) {
                    prize = item;
                    break;
                }
                random -= item.weight;
            }

            let prizeApplied = false;
            let rewardMessage = null;

            // LÓGICA EXIGIDA: Si toca la casilla de monedas, sumar 200
            if (prize.id === 3 || prize.label === 'Monedas') {
                finalCoins += 200;
                prizeApplied = true;
                rewardMessage = "¡Has ganado 200 monedas!";
            } else if (Number.isInteger(prize.coinsReward) && prize.coinsReward > 0) {
                finalCoins += prize.coinsReward;
                prizeApplied = true;
            }

            let normalizedInventory = await normalizeAndPersistInventory(currentUser, usersCol);

            if (toPositiveInteger(prize.inventoryItemId)) {
                const itemId = toPositiveInteger(prize.inventoryItemId);
                const itemMax = getItemMaxQuantity(itemId);
                const itemMeta = getInventoryCatalogItem(itemId);
                const existingIndex = normalizedInventory.findIndex((entry) => entry.id === itemId);

                if (existingIndex === -1) {
                    normalizedInventory.push({ id: itemId, quantity: 1, equipped: false });
                    prizeApplied = true;
                } else if (normalizedInventory[existingIndex].quantity < itemMax) {
                    normalizedInventory[existingIndex].quantity += 1;
                    prizeApplied = true;
                } else {
                    rewardMessage = `Has alcanzado el máximo de ${itemMax} unidades para ${itemMeta?.name || 'este objeto'}.`;
                }
            }

            normalizedInventory = serializeInventory(normalizedInventory);

            await usersCol.updateOne(
                { user },
                {
                    $set: {
                        coins: finalCoins,
                        tickets: finalTickets,
                        inventory: normalizedInventory,
                        streakFreezes: getInventoryQuantity(normalizedInventory, 2)
                    }
                }
            );

            res.json({
                success: true,
                prize: {
                    id: prize.id,
                    label: prize.label,
                    icon: prize.icon,
                    itemId: prize.inventoryItemId || null
                },
                prizeApplied,
                rewardMessage,
                newBalance: finalCoins,
                newTickets: finalTickets,
                inventory: enrichInventory(normalizedInventory)
            });
        } catch (error) {
            console.error('Error en ruleta:', error);
            res.status(500).json({ message: 'Error en la ruleta' });
        }
    });

    // 2. ENDPOINT: COMPRAR 10 TIQUETS
    app.post('/api/shop/buy-tickets', async (req, res) => {
        const { user } = req.body;
        try {
            const { users: usersCol } = getCollections();
            const currentUser = await usersCol.findOne({ user });

            if (!currentUser) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            const currentTickets = currentUser.tickets || 0;
            const BUNDLE_COST = 900;

            if (currentCoins < BUNDLE_COST) {
                return res.status(402).json({ success: false, message: 'Créditos insuficientes para 10 extracciones.' });
            }

            const finalCoins = currentCoins - BUNDLE_COST;
            const finalTickets = currentTickets + 10;

            await usersCol.updateOne(
                { user }, 
                { $set: { coins: finalCoins, tickets: finalTickets } }
            );

            res.json({
                success: true,
                newBalance: finalCoins,
                newTickets: finalTickets
            });
        } catch (error) {
            console.error('Error comprando tickets:', error);
            res.status(500).json({ message: 'Error procesando la compra de tickets.' });
        }
    });

    // 3. ENDPOINT: COMPRAR A LA BOTIGA GENERAL
    app.post('/api/shop/buy', async (req, res) => {
        const { user, item } = req.body;

        try {
            const { users } = getCollections();
            if (!user) return res.status(400).json({ message: 'Usuario no identificado.' });

            const itemId = toPositiveInteger(item?.id);
            const catalogItem = getInventoryCatalogItem(itemId);

            if (!catalogItem || !Number.isFinite(catalogItem.price)) {
                return res.status(400).json({ message: 'Artículo no válido.' });
            }

            const currentUser = await users.findOne({ user });
            if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado' });

            const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
            if (currentCoins < catalogItem.price) {
                return res.status(400).json({ message: 'Créditos insuficientes.' });
            }

            let normalizedInventory = await normalizeAndPersistInventory(currentUser, users);

            const itemMax = getItemMaxQuantity(itemId);
            const currentEntryIndex = normalizedInventory.findIndex((inventoryItem) => inventoryItem.id === itemId);
            const currentQuantity = currentEntryIndex === -1 ? 0 : normalizedInventory[currentEntryIndex].quantity;

            if (currentQuantity >= itemMax) {
                return res.status(400).json({
                    message: `Has alcanzado el máximo (${itemMax}) para este objeto.`
                });
            }

            if (currentEntryIndex === -1) {
                normalizedInventory.push({ id: itemId, quantity: 1, equipped: false });
            } else {
                normalizedInventory[currentEntryIndex].quantity += 1;
            }

            normalizedInventory = serializeInventory(normalizedInventory);
            const newBalance = currentCoins - catalogItem.price;
            const updatedFreezeUnits = getInventoryQuantity(normalizedInventory, 2);

            await users.updateOne(
                { user },
                {
                    $set: {
                        coins: newBalance,
                        inventory: normalizedInventory,
                        streakFreezes: updatedFreezeUnits
                    }
                }
            );

            const boughtItem = normalizedInventory.find((inventoryItem) => inventoryItem.id === itemId);

            res.json({
                success: true,
                newBalance,
                streakFreezes: updatedFreezeUnits,
                item: enrichInventory([boughtItem])[0],
                inventory: enrichInventory(normalizedInventory)
            });
        } catch (error) {
            console.error('Error en compra:', error);
            res.status(500).json({ message: 'Error en la transacción estelar.' });
        }
    });
}

module.exports = {
    registerShopRoutes
};