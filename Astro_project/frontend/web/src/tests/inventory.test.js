import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryStore } from '../stores/inventoryStore';

vi.mock('../stores/astroShared', () => ({
    requestJson: vi.fn(),
    normalizeInventoryItems: (i) => i
}));

describe('Inventory Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('debe tener el inventario vacío al inicio', () => {
        const store = useInventoryStore();
        expect(store.inventory).toEqual([]);
    });

    it('debe calcular correctamente las unidades totales', () => {
        const store = useInventoryStore();
        store.inventory = [{ id: 1, quantity: 5 }, { id: 2, quantity: 3 }];
        expect(store.inventoryUnits).toBe(8);
    });

    it('debe limpiar el inventario correctamente', () => {
        const store = useInventoryStore();
        store.inventory = [{ id: 1, quantity: 10 }];
        store.clearInventory();
        expect(store.inventory).toEqual([]);
    });
});
