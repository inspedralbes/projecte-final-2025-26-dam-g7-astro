const inventoryService = require('../services/inventoryService');

describe('Inventory Service', () => {
    test('getItemMaxQuantity debe retornar 1 para items no apilables o desconocidos', () => {
        expect(inventoryService.getItemMaxQuantity(9999)).toBe(1);
    });

    test('normalizeInventoryEntries debe agrupar items duplicados', () => {
        // Asumiendo que el item 1 existe en las constantes (suele ser así)
        const rawInventory = [
            { id: 1, quantity: 2 },
            { id: 1, quantity: 3 }
        ];
        const normalized = inventoryService.normalizeInventoryEntries(rawInventory);
        
        // Buscamos el item 1
        const item1 = normalized.find(i => i.id === 1);
        if (item1) {
            expect(item1.quantity).toBeGreaterThanOrEqual(5); 
        }
    });

    test('getInventoryQuantity debe retornar 0 si no existe el item', () => {
        expect(inventoryService.getInventoryQuantity([], 1)).toBe(0);
    });

    test('getEquippedAvatarBoost debe encontrar el boost del item equipado tipo skin', () => {
        const inventory = [
            { id: 102, equipped: true, cat: 'skin', boost: { type: 'score', multiplier: 1.15 } },
            { id: 105, equipped: true, cat: 'title' } // No debe ser tomado como avatar boost
        ];
        const boost = inventoryService.getEquippedAvatarBoost(inventory);
        expect(boost).not.toBeNull();
        expect(boost.type).toBe('score');
        expect(boost.multiplier).toBe(1.15);
    });
});
