import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProgressStore } from '../stores/progressStore';

vi.mock('../stores/astroShared', () => ({
    requestJson: vi.fn(),
    storageGetItem: vi.fn(),
    readStoredObject: vi.fn().mockReturnValue({}),
    normalizeActiveBoosters: vi.fn().mockReturnValue([]),
    STORAGE_KEYS: { xp: 'astro_xp', streak: 'astro_streak' }
}));

describe('Progress Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('debe iniciar con XP en 0 si no hay storage', () => {
        const store = useProgressStore();
        expect(store.xp).toBe(0);
    });

    it('debe inicializar la racha en 0', () => {
        const store = useProgressStore();
        expect(store.streak).toBe(0);
    });
});
