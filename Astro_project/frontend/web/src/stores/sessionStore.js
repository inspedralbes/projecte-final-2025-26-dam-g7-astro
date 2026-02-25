import { defineStore } from 'pinia';
import {
    STORAGE_KEYS,
    requestJson,
    storageGetItem,
    storageRemoveItem,
    storageSetItem
} from './astroShared';

function persistNullable(key, value) {
    if (value === null || value === undefined || value === '') {
        storageRemoveItem(key);
        return;
    }
    storageSetItem(key, value);
}

export const useSessionStore = defineStore('session', {
    state: () => ({
        user: storageGetItem(STORAGE_KEYS.user) || null,
        plan: storageGetItem(STORAGE_KEYS.plan) || 'INDIVIDUAL_FREE',
        rank: storageGetItem(STORAGE_KEYS.rank) || null,
        avatar: storageGetItem(STORAGE_KEYS.avatar) || 'Astronauta_blanc.jpg',
        mascot: storageGetItem(STORAGE_KEYS.mascot) || null,
        token: storageGetItem(STORAGE_KEYS.token) || null,
        error: null
    }),

    actions: {
        setUser(user) {
            this.user = user || null;
            persistNullable(STORAGE_KEYS.user, this.user);
        },

        setPlan(plan) {
            this.plan = plan || 'INDIVIDUAL_FREE';
            persistNullable(STORAGE_KEYS.plan, this.plan);
        },

        setRank(rank) {
            this.rank = rank || null;
            persistNullable(STORAGE_KEYS.rank, this.rank);
        },

        setToken(token) {
            this.token = token || null;
            persistNullable(STORAGE_KEYS.token, this.token);
        },

        setAvatar(avatar) {
            this.avatar = avatar || 'Astronauta_blanc.jpg';
            persistNullable(STORAGE_KEYS.avatar, this.avatar);
        },

        setMascot(mascot) {
            this.mascot = mascot || null;
            persistNullable(STORAGE_KEYS.mascot, this.mascot);
        },

        applyLoginPayload(data = {}) {
            const profile = data.profile || {};
            this.setUser(profile.name ?? this.user);
            this.setPlan(profile.plan ?? this.plan);
            this.setRank(profile.rank ?? this.rank);
            this.setToken(data.token ?? this.token);

            if (profile.avatar) {
                this.setAvatar(profile.avatar);
            }

            if (profile.mascot) {
                this.setMascot(profile.mascot);
            }
        },

        async registerTripulante(userData) {
            this.error = null;
            try {
                const { response, data } = await requestJson('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error al registrar');
                }

                return { success: true, message: data.message };
            } catch (error) {
                console.error('❌ Error en registro:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async loginTripulante(credentials) {
            this.error = null;
            try {
                const { response, data } = await requestJson('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: credentials.username || credentials.user,
                        password: credentials.password || credentials.pass
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error de autenticación');
                }

                this.applyLoginPayload(data);
                return { success: true, data };
            } catch (error) {
                console.error('❌ Error en login:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async updatePlan(planType) {
            this.error = null;

            if (!this.user) {
                this.user = storageGetItem(STORAGE_KEYS.user);
            }

            this.setPlan(planType);

            if (!this.user) {
                this.error = 'Usuario no identificado para actualizar el plan.';
                return { success: false, message: this.error };
            }

            try {
                const { response, data } = await requestJson('/api/user/plan', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        plan: planType
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error al actualizar el plan en el servidor');
                }

                return { success: true };
            } catch (error) {
                console.error('❌ Error sincronizando plan:', error);
                this.error = 'Error al conectar con el servidor: ' + error.message;
                return { success: false, message: this.error };
            }
        },

        async updateAvatar(seed) {
            this.setAvatar(seed);
            console.log('👤 Avatar actualizado localmente:', seed);

            if (!this.user) return;

            try {
                const { response, data } = await requestJson('/api/user/avatar', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        avatar: seed
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error al guardar avatar en servidor');
                }
                console.log('✅ Avatar sincronizado en servidor');
            } catch (error) {
                console.error('❌ Error sincronizando avatar:', error);
            }
        },

        updateMascot(mascotFile) {
            this.setMascot(mascotFile);
            console.log('🐾 Mascota actualizada localmente:', mascotFile);
        },

        clearSession() {
            this.user = null;
            this.plan = 'INDIVIDUAL_FREE';
            this.rank = null;
            this.avatar = 'Astronauta_blanc.jpg';
            this.mascot = null;
            this.token = null;
            this.error = null;

            storageRemoveItem(STORAGE_KEYS.token);
            storageRemoveItem(STORAGE_KEYS.user);
            storageRemoveItem(STORAGE_KEYS.rank);
            storageRemoveItem(STORAGE_KEYS.plan);
            storageRemoveItem(STORAGE_KEYS.avatar);
            storageRemoveItem(STORAGE_KEYS.mascot);
        }
    }
});
