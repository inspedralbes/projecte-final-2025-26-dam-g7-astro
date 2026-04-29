import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import {
    STORAGE_KEYS,
    normalizeSelectedAchievements,
    normalizeUnlockedAchievements,
    readStoredArray,
    requestJson,
    storageGetItem,
    storageRemoveItem,
    writeStoredJson
} from './astroShared';

export const useAchievementsStore = defineStore('achievements', {
    state: () => ({
        selectedAchievements: normalizeSelectedAchievements(
            readStoredArray(STORAGE_KEYS.selectedAchievements, [null, null, null])
        ),
        unlockedAchievements: normalizeUnlockedAchievements(
            readStoredArray(STORAGE_KEYS.unlockedAchievements, [])
        ),
        error: null
    }),

    actions: {
        resolveUser() {
            const sessionStore = useSessionStore();
            return sessionStore.user || storageGetItem(STORAGE_KEYS.user) || null;
        },

        setSelectedAchievements(achievements = [null, null, null]) {
            this.selectedAchievements = normalizeSelectedAchievements(achievements);
            writeStoredJson(STORAGE_KEYS.selectedAchievements, this.selectedAchievements);
        },

        setUnlockedAchievements(achievements = []) {
            this.unlockedAchievements = normalizeUnlockedAchievements(achievements);
            writeStoredJson(STORAGE_KEYS.unlockedAchievements, this.unlockedAchievements);
        },

        applyProfile(profile = {}) {
            this.setSelectedAchievements(profile.selectedAchievements || []);
            this.setUnlockedAchievements(profile.unlockedAchievements || []);
        },

        async fetchUserAchievements() {
            this.error = null;
            const user = this.resolveUser();
            if (!user) {
                return { success: false, message: 'No hay una sesión activa.' };
            }

            try {
                const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/achievements`);

                if (!response.ok) {
                    if (response.status === 404 && (data.message === 'Usuario no encontrado.' || data.message === 'Usuario no encontrado')) {
                        const sessionStore = useSessionStore();
                        sessionStore.clearSession();
                    }
                    throw new Error(data.message || 'No se pudieron obtener los logros.');
                }

                this.setSelectedAchievements(data.selectedAchievements || []);
                this.setUnlockedAchievements(data.unlockedAchievements || []);

                return { success: true, achievements: data };
            } catch (error) {
                console.error('❌ Error obteniendo logros:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async syncUnlockedAchievements(unlockedAchievements) {
            this.error = null;
            const normalizedUnlocked = normalizeUnlockedAchievements(unlockedAchievements);
            this.setUnlockedAchievements(normalizedUnlocked);

            const user = this.resolveUser();
            if (!user) {
                this.error = 'Usuario no identificado. Los logros se guardaron solo en local.';
                return { success: false, message: this.error };
            }

            try {
                const { response, data } = await requestJson('/api/user/achievements/unlocked', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user,
                        unlockedAchievements: normalizedUnlocked
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error al guardar logros desbloqueados.');
                }

                this.setUnlockedAchievements(data.unlockedAchievements || normalizedUnlocked);
                return { success: true, unlockedAchievements: this.unlockedAchievements };
            } catch (error) {
                console.error('❌ Error sincronizando logros desbloqueados:', error);
                this.error = 'Error al guardar logros desbloqueados: ' + error.message;
                return { success: false, message: this.error };
            }
        },

        async updateAchievements(achievements) {
            this.error = null;

            const selected = normalizeSelectedAchievements(achievements);
            this.setSelectedAchievements(selected);

            const user = this.resolveUser();
            if (!user) {
                this.error = 'Usuario no identificado. Los cambios se guardarán localmente pero no en el servidor.';
                return { success: false, message: this.error };
            }

            try {
                const { response, data } = await requestJson('/api/user/achievements', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user,
                        achievements: selected
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error al actualizar logros');
                }

                return { success: true };
            } catch (error) {
                console.error('❌ Error sincronizando con servidor:', error);
                this.error = 'Error al guardar en el servidor: ' + error.message;
                return { success: false, message: this.error };
            }
        },

        clearAchievements() {
            this.selectedAchievements = [null, null, null];
            this.unlockedAchievements = [];
            this.error = null;

            storageRemoveItem(STORAGE_KEYS.selectedAchievements);
            storageRemoveItem(STORAGE_KEYS.unlockedAchievements);
        }
    }
});
