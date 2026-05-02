// Astro_project/backend/src/services/shopService.js

const { WHEEL_ITEMS } = require('../constants/inventory');

class ShopService {
    constructor({
        userRepository,
        inventoryService
    }) {
        this.userRepo = userRepository;
        this.inventoryService = inventoryService;
    }

    async spinWheel(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        const SPIN_COST = 100;
        let finalCoins = user.coins;
        let finalTickets = user.tickets || 0;

        if (finalTickets > 0) {
            finalTickets -= 1;
        } else if (finalCoins >= SPIN_COST) {
            finalCoins -= SPIN_COST;
        } else {
            throw new Error('Saldo insuficiente');
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

        if (prize.id === 3 || prize.label === 'Monedas') {
            finalCoins += 200;
            prizeApplied = true;
            rewardMessage = "¡Has ganado 200 monedas!";
        } else if (Number.isInteger(prize.coinsReward) && prize.coinsReward > 0) {
            finalCoins += prize.coinsReward;
            prizeApplied = true;
        }

        let normalizedInventory = await this.inventoryService.normalizeAndPersistInventory(user);

        if (this.inventoryService.toPositiveInteger(prize.inventoryItemId)) {
            const itemId = this.inventoryService.toPositiveInteger(prize.inventoryItemId);
            const itemMax = this.inventoryService.getItemMaxQuantity(itemId);
            const itemMeta = this.inventoryService.getInventoryCatalogItem(itemId);
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

        normalizedInventory = this.inventoryService.serializeInventory(normalizedInventory);
        
        user.coins = finalCoins;
        user.tickets = finalTickets;
        user.inventory = normalizedInventory;
        user.streakFreezes = this.inventoryService.getInventoryQuantity(normalizedInventory, 2);

        await this.userRepo.update(user);

        return {
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
            inventory: this.inventoryService.enrichInventory(normalizedInventory)
        };
    }

    async buyTickets(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        const BUNDLE_COST = 900;
        if (user.coins < BUNDLE_COST) {
            throw new Error('Créditos insuficientes para 10 extracciones.');
        }

        user.coins -= BUNDLE_COST;
        user.tickets = (user.tickets || 0) + 10;

        await this.userRepo.update(user);

        return {
            success: true,
            newBalance: user.coins,
            newTickets: user.tickets
        };
    }

    async buyItem(username, itemId) {
        const catalogItem = this.inventoryService.getInventoryCatalogItem(itemId);
        if (!catalogItem || !Number.isFinite(catalogItem.price)) {
            throw new Error('Artículo no válido.');
        }

        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        if (user.coins < catalogItem.price) {
            throw new Error('Créditos insuficientes.');
        }

        let normalizedInventory = await this.inventoryService.normalizeAndPersistInventory(user);
        const itemMax = this.inventoryService.getItemMaxQuantity(itemId);
        const currentEntryIndex = normalizedInventory.findIndex((inventoryItem) => inventoryItem.id === itemId);
        const currentQuantity = currentEntryIndex === -1 ? 0 : normalizedInventory[currentEntryIndex].quantity;

        if (currentQuantity >= itemMax) {
            throw new Error(`Has alcanzado el máximo (${itemMax}) para este objeto.`);
        }

        if (currentEntryIndex === -1) {
            normalizedInventory.push({ id: itemId, quantity: 1, equipped: false });
        } else {
            normalizedInventory[currentEntryIndex].quantity += 1;
        }

        normalizedInventory = this.inventoryService.serializeInventory(normalizedInventory);
        user.coins -= catalogItem.price;
        user.inventory = normalizedInventory;
        user.streakFreezes = this.inventoryService.getInventoryQuantity(normalizedInventory, 2);

        await this.userRepo.update(user);

        const boughtItem = normalizedInventory.find((inventoryItem) => inventoryItem.id === itemId);

        return {
            success: true,
            newBalance: user.coins,
            streakFreezes: user.streakFreezes,
            item: this.inventoryService.enrichInventory([boughtItem])[0],
            inventory: this.inventoryService.enrichInventory(normalizedInventory)
        };
    }
}

module.exports = ShopService;
