import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSessionStore } from '../stores/sessionStore';

// Mock de astroShared para evitar errores de localStorage
vi.mock('../stores/astroShared', () => ({
    STORAGE_KEYS: {
        user: 'astro_user',
        plan: 'astro_plan',
        rank: 'astro_rank',
        avatar: 'astro_avatar',
        mascot: 'astro_mascot',
        token: 'astro_token'
    },
    storageGetItem: vi.fn(),
    storageSetItem: vi.fn(),
    storageRemoveItem: vi.fn(),
    requestJson: vi.fn()
}));

describe('Session Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('debe inicializarse con valores por defecto', () => {
        const store = useSessionStore();
        expect(store.user).toBeNull();
        expect(store.plan).toBe('INDIVIDUAL_FREE');
        expect(store.avatar).toBe('Astronauta_blanc.jpg');
    });

    it('debe actualizar el usuario correctamente', () => {
        const store = useSessionStore();
        store.setUser('Astronauta7');
        expect(store.user).toBe('Astronauta7');
    });

    it('debe limpiar la sesión al hacer logout', () => {
        const store = useSessionStore();
        store.setUser('TestUser');
        store.clearSession();
        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
    });
});
