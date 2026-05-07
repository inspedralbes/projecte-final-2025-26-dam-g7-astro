import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAstroStore } from '../stores/astroStore';
import { useSessionStore } from '../stores/sessionStore';
import { useProgressStore } from '../stores/progressStore';

// Mock de astroShared
vi.mock('../stores/astroShared', () => ({
    API_BASE_URL: 'http://localhost',
    STORAGE_KEYS: {
        level: 'astro_level',
        xp: 'astro_xp',
        streak: 'astro_streak',
        streakFreezes: 'astro_streak_freezes',
        activeBoosters: 'astro_active_boosters',
        lastActivity: 'astro_last_activity',
        lastGame: 'astro_last_game',
        user: 'astro_user',
        plan: 'astro_plan',
        rank: 'astro_rank',
        token: 'astro_token',
        role: 'astro_role',
        parentId: 'astro_parent_id'
    },
    storageGetItem: vi.fn(),
    storageSetItem: vi.fn(),
    storageRemoveItem: vi.fn(),
    requestJson: vi.fn(),
    normalizeActiveBoosters: vi.fn(v => v || {
        doubleCoinsGamesLeft: 0,
        doubleScoreGamesLeft: 0,
        sabotageGamesLeft: 0
    }),
    readStoredObject: vi.fn(() => ({})),
    readStoredArray: vi.fn(() => []),
    normalizeSelectedAchievements: vi.fn(v => v || [null, null, null]),
    normalizeUnlockedAchievements: vi.fn(v => v || [])
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
