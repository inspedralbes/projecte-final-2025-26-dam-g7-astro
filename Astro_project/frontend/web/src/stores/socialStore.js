import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import { requestJson } from './astroShared';

export const useSocialStore = defineStore('social', {
    state: () => ({
        friends: [],
        explorers: [],
        error: null
    }),

    actions: {
        resolveUser() {
            const sessionStore = useSessionStore();
            return sessionStore.user || null;
        },

        setFriends(friends = []) {
            this.friends = Array.isArray(friends) ? friends : [];
        },

        setExplorers(explorers = []) {
            this.explorers = Array.isArray(explorers) ? explorers : [];
        },

        async fetchAllUsers() {
            this.error = null;
            try {
                const { response, data } = await requestJson('/api/users');
                if (!response.ok) {
                    throw new Error(data.message || 'No se pudo obtener la lista de exploradores.');
                }

                this.setExplorers(data || []);
                return { success: true, data };
            } catch (error) {
                console.error('❌ Error obteniendo lista de exploradores:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async addFriendAction(friendName) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/friends/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, friendName })
                });

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo añadir amigo.');
                }

                this.setFriends(data.friends || []);
                return { success: true };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async removeFriendAction(friendName) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/friends/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, friendName })
                });

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo eliminar amigo.');
                }

                this.setFriends(data.friends || []);
                return { success: true };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        clearSocial() {
            this.friends = [];
            this.explorers = [];
            this.error = null;
        }
    }
});
