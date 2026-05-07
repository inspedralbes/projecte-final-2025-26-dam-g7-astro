import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAstroStore } from '../stores/astroStore';
import { useSessionStore } from '../stores/sessionStore';
import { useProgressStore } from '../stores/progressStore';

// Mock de astroShared
vi.mock('../stores/astroShared', () => ({
    API_BASE_URL: 'http://localhost',
    STORAGE_KEYS: {},
    storageGetItem: vi.fn(),
    storageSetItem: vi.fn(),
    storageRemoveItem: vi.fn(),
    requestJson: vi.fn()
}));

describe('Astro Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('debe sincronizar correctamente las propiedades entre tiendas', () => {
        const astroStore = useAstroStore();
        const sessionStore = useSessionStore();
        const progressStore = useProgressStore();

        sessionStore.setUser('Comandante');
        expect(astroStore.user).toBe('Comandante');

        progressStore.setCoins(1000);
        expect(astroStore.coins).toBe(1000);
    });

    it('debe delegar el registro de partidas al progressStore', async () => {
        const astroStore = useAstroStore();
        const progressStore = useProgressStore();
        
        // Espiamos el método del progressStore
        const spy = vi.spyOn(progressStore, 'registerCompletedGame');
        spy.mockResolvedValue({ success: true, data: {} });

        await astroStore.registerCompletedGame('RadarScan', 100);
        
        expect(spy).toHaveBeenCalledWith('RadarScan', 100, null);
    });

    it('debe limpiar todas las tiendas al hacer logout', () => {
        const astroStore = useAstroStore();
        const sessionStore = useSessionStore();
        const progressStore = useProgressStore();

        sessionStore.setUser('Test');
        progressStore.setCoins(500);

        astroStore.logout();

        expect(sessionStore.user).toBeNull();
        expect(progressStore.coins).toBe(0);
    });
});
