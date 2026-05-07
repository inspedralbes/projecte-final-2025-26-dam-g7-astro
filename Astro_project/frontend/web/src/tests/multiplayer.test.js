import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useMultiplayerStore } from '../stores/multiplayerStore';

vi.mock('../stores/astroShared', () => ({
    API_BASE_URL: 'http://localhost',
    requestJson: vi.fn(),
    STORAGE_KEYS: {
        user: 'astro_user',
        plan: 'astro_plan',
        rank: 'astro_rank',
        role: 'astro_role',
        parentId: 'astro_parent_id',
        avatar: 'astro_avatar',
        token: 'astro_token',
        lastActivity: 'astro_last_activity'
    },
    storageGetItem: vi.fn(),
    storageSetItem: vi.fn(),
    storageRemoveItem: vi.fn()
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

    it('debe limpiar el estado de la sala al desconectar', () => {
        const store = useMultiplayerStore();
        store.room = { id: 'ABCDE' };
        store.disconnect();
        expect(store.room).toBeNull();
        expect(store.isConnected).toBe(false);
    });

    it('debe procesar ROOM_UPDATE con datos detallados de jugadores', () => {
        const store = useMultiplayerStore();
        const mockUpdate = {
            type: 'ROOM_UPDATE',
            room: {
                id: 'XYZ',
                players: [
                    { username: 'User1', level: 10, avatar: 'star' },
                    { username: 'User2', level: 5, avatar: 'rocket' }
                ]
            }
        };

        store.handleMessage(mockUpdate);

        expect(store.room.id).toBe('XYZ');
        expect(store.room.players).toHaveLength(2);
        expect(store.room.players[0].level).toBe(10);
        expect(store.room.players[1].avatar).toBe('rocket');
    });
});
