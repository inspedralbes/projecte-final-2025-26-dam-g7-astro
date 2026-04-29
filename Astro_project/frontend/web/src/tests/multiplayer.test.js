import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useMultiplayerStore } from '../stores/multiplayerStore';

vi.mock('../stores/astroShared', () => ({
    API_BASE_URL: 'http://localhost',
    requestJson: vi.fn()
}));

describe('Multiplayer Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('debe estar desconectado al inicio', () => {
        const store = useMultiplayerStore();
        expect(store.isConnected).toBe(false);
        expect(store.room).toBeNull();
    });
    //Modificar mas adelante
    it('debe limpiar el estado de la sala al desconectar', () => {
        const store = useMultiplayerStore();
        store.room = { id: 'ABCDE' };
        store.disconnect();
        expect(store.room).toBeNull();
        expect(store.isConnected).toBe(false);
    });
});
