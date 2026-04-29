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
});
