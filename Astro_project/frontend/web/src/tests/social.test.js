import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSocialStore } from '../stores/socialStore';

vi.mock('../stores/astroShared', () => ({
    requestJson: vi.fn()
}));

describe('Social Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('debe iniciar con listas de amigos vacías', () => {
        const store = useSocialStore();
        expect(store.friends).toEqual([]);
        expect(store.friendRequests).toEqual([]);
    });

    it('debe permitir setear exploradores', () => {
        const store = useSocialStore();
        const mockExplorers = [
            { user: 'Marcos', level: 10 },
            { user: 'Julia', level: 5 }
        ];
        store.setExplorers(mockExplorers);
        expect(store.explorers).toHaveLength(2);
        expect(store.explorers[0].user).toBe('Marcos');
    });
});
