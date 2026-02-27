import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import { requestJson } from './astroShared';

export const useSocialStore = defineStore('social', {
    state: () => ({
        friends: [],
        friendRequests: [], // Añadido: Estado para las solicitudes pendientes
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

        setFriendRequests(requests = []) {
            this.friendRequests = Array.isArray(requests) ? requests : [];
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

        // --- NUEVOS MÉTODOS PARA SOLICITUDES DE AMISTAD ---

        async sendFriendRequest(friendName) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/friends/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, friendName })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'No se pudo enviar la solicitud.');
                }

                return { success: true, message: data.message };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async acceptFriendRequest(friendName) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/friends/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, friendName })
                });

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo aceptar la solicitud.');
                }

                // Actualizamos ambas listas al aceptar
                this.setFriends(data.friends || []);
                this.setFriendRequests(data.friendRequests || []);
                return { success: true };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async rejectFriendRequest(friendName) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/friends/reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, friendName })
                });

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo rechazar la solicitud.');
                }

                // Actualizamos la lista de peticiones pendientes
                this.setFriendRequests(data.friendRequests || []);
                return { success: true };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        clearSocial() {
            this.friends = [];
            this.friendRequests = []; // Asegurarnos de limpiar esto también
            this.explorers = [];
            this.error = null;
        }
    }
});