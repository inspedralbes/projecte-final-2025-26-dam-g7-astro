import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestJson } from '../utils/astroShared';
import { useSessionStore } from './sessionStore';
import { useProgressStore } from './progressStore';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  [key: string]: any;
}

interface InventoryState {
  inventory: InventoryItem[];
  error: string | null;

  // Actions
  setInventory: (items: InventoryItem[]) => void;
  fetchUserInventory: () => Promise<{ success: boolean; inventory: InventoryItem[]; data?: any; message?: string }>;
  buyItem: (item: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  useInventoryItem: (itemId: number) => Promise<{ success: boolean; data?: any; message?: string }>;
  sellItem: (itemId: number) => Promise<{ success: boolean; data?: any; message?: string }>;
  clearInventory: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      inventory: [],
      error: null,

      setInventory: (inventory) => set({ inventory }),

      fetchUserInventory: async () => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session', inventory: [] };

        try {
          const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/inventory`);
          if (!response.ok) throw new Error(data.message || 'Error fetching inventory');

          const items = data.inventory || [];
          set({ inventory: items });
          return { success: true, inventory: items, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message, inventory: [] };
        }
      },

      buyItem: async (item) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/shop/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, item }),
          });

          if (!response.ok) throw new Error(data.message || 'Error buying item');

          set({ inventory: data.inventory || [] });
          
          // Sync coins with progressStore if balance is returned
          if (data.newBalance !== undefined) {
            useProgressStore.getState().setCoins(data.newBalance);
          }
          
          return { success: true, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      useInventoryItem: async (itemId) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/inventory/use-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, itemId }),
          });

          if (!response.ok) throw new Error(data.message || 'Error using item');

          set({ inventory: data.inventory || [] });
          
          // Sync boosters/missions if returned
          if (data.stats) {
            useProgressStore.getState().applyProfile(data.stats);
          }
          
          return { success: true, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      sellItem: async (itemId) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/inventory/sell-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, itemId }),
          });

          if (!response.ok) throw new Error(data.message || 'Error selling item');

          set({ inventory: data.inventory || [] });
          
          // Sync coins with progressStore if balance is returned
          if (data.newBalance !== undefined) {
            useProgressStore.getState().setCoins(data.newBalance);
          }
          
          return { success: true, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      clearInventory: () => set({ inventory: [], error: null }),
    }),
    {
      name: 'astro-inventory-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? window.localStorage : AsyncStorage
      ),
    }
  )
);
