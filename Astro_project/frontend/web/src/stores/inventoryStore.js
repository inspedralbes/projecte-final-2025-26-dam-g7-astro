import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import i18n from '@/i18n';
import {
    normalizeInventoryItems,
    requestJson,
    toPositiveInteger
} from './astroShared';

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        inventory: [],
        error: null
    }),

    getters: {
        inventoryUnits: (state) => {
            return (state.inventory || []).reduce((sum, item) => {
                const quantity = Number(item?.quantity);
                return sum + (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
            }, 0);
        }
    },

    actions: {
        resolveUser() {
            const sessionStore = useSessionStore();
            return sessionStore.user || null;
        },

        setInventory(items = []) {
            this.inventory = normalizeInventoryItems(items || []);
        },

        async fetchUserInventory() {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: i18n.global.t('errors.noSession'), inventory: [] };

            try {
                const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/inventory`);

                if (!response.ok) {
                    if (response.status === 404 && (data.message === 'Usuario no encontrado' || data.message === 'Usuario no encontrado.')) {
                        const sessionStore = useSessionStore();
                        sessionStore.clearSession();
                    }
                    throw new Error(data.message || 'No se pudo obtener el inventario.');
                }

                this.setInventory(data.inventory || []);
                return { success: true, inventory: this.inventory, data };
            } catch (error) {
                console.error('Error al traer inventario:', error);
                this.error = error.message;
                return { success: false, message: this.error, inventory: [] };
            }
        },

        async buyItem(item) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: i18n.global.t('errors.noSession') };

            try {
                const { response, data } = await requestJson('/api/shop/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, item })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'No se pudo comprar el objeto.');
                }

                this.setInventory(data.inventory || []);
                return { success: true, data };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async useInventoryItem(itemId) {
            this.error = null;
            const user = this.resolveUser();
            if (!user) {
                return { success: false, message: i18n.global.t('errors.noSession') };
            }

            const parsedItemId = toPositiveInteger(itemId);
            if (!parsedItemId) {
                return { success: false, message: i18n.global.t('errors.invalidItem') };
            }

            try {
                const { response, data } = await requestJson('/api/inventory/use-item', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, itemId: parsedItemId })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'No se pudo usar el objeto.');
                }

                this.setInventory(data.inventory || []);
                return { success: true, data };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        clearInventory() {
            this.inventory = [];
            this.error = null;
        }
    }
});
