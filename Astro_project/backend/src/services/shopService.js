// Astro_project/backend/src/services/shopService.js

class ShopService {
    constructor({
        userRepository,
        inventoryService
    }) {
        this.userRepo = userRepository;
        this.inventoryService = inventoryService;
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
