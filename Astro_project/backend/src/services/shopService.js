// Astro_project/backend/src/services/shopService.js

class ShopService {
    constructor({
        userRepository,
        inventoryService
    }) {
        this.userRepo = userRepository;
        this.inventoryService = inventoryService;
    }

    async buyItem(username, itemId, quantity = 1) {
        const catalogItem = this.inventoryService.getInventoryCatalogItem(itemId);
        if (!catalogItem || !Number.isFinite(catalogItem.price)) {
            throw new Error('Artículo no válido.');
        }

        const safeQuantity = Math.max(1, parseInt(quantity) || 1);
        const totalPrice = catalogItem.price * safeQuantity;

        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        if (user.coins < totalPrice) {
            throw new Error('Créditos insuficientes.');
        }

        let normalizedInventory = await this.inventoryService.normalizeAndPersistInventory(user);
        const itemMax = this.inventoryService.getItemMaxQuantity(itemId);
        const currentEntryIndex = normalizedInventory.findIndex((inventoryItem) => inventoryItem.id === itemId);
        const currentQuantity = currentEntryIndex === -1 ? 0 : normalizedInventory[currentEntryIndex].quantity;

        if (currentQuantity + safeQuantity > itemMax) {
            throw new Error(`Has alcanzado el máximo en inventario (${itemMax}) para este objeto.`);
        }

        // Nuevo: Límite de compra diaria
        if (catalogItem.dailyPurchaseLimit) {
            const dailyBought = user.getDailyPurchaseCount(itemId);
            if (dailyBought + safeQuantity > catalogItem.dailyPurchaseLimit) {
                throw new Error(`Límite diario alcanzado. Ya has comprado ${dailyBought} hoy. Solo puedes comprar ${catalogItem.dailyPurchaseLimit} al día.`);
            }
        }

        if (currentEntryIndex === -1) {
            normalizedInventory.push({ id: itemId, quantity: safeQuantity, equipped: false });
        } else {
            normalizedInventory[currentEntryIndex].quantity += safeQuantity;
        }

        normalizedInventory = this.inventoryService.serializeInventory(normalizedInventory);
        user.coins -= totalPrice;
        user.inventory = normalizedInventory;
        user.streakFreezes = this.inventoryService.getInventoryQuantity(normalizedInventory, 2);
        
        // Registrar compra diaria
        user.recordPurchase(itemId, safeQuantity);

        await this.userRepo.update(user);

        const boughtItem = normalizedInventory.find((inventoryItem) => inventoryItem.id === itemId);

        return {
            success: true,
            newBalance: user.coins,
            streakFreezes: user.streakFreezes,
            item: this.inventoryService.enrichInventory([boughtItem])[0],
            inventory: this.inventoryService.enrichInventory(normalizedInventory),
            dailyPurchaseHistory: user.dailyPurchaseHistory
        };
    }
}

module.exports = ShopService;
