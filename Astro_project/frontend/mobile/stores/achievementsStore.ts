import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestJson } from '../utils/astroShared';
import { useSessionStore } from './sessionStore';

interface AchievementsState {
  selectedAchievements: (number | null)[];
  unlockedAchievements: number[];
  error: string | null;

  // Actions
  setSelectedAchievements: (achievements: (number | null)[]) => void;
  setUnlockedAchievements: (achievements: number[]) => void;
  applyProfile: (profile: any) => void;
  fetchUserAchievements: () => Promise<{ success: boolean; data?: any; message?: string }>;
  syncUnlockedAchievements: (unlockedAchievements: number[]) => Promise<{ success: boolean; message?: string }>;
  updateAchievements: (achievements: (number | null)[]) => Promise<{ success: boolean; message?: string }>;
  clearAchievements: () => void;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      selectedAchievements: [null, null, null],
      unlockedAchievements: [],
      error: null,

      setSelectedAchievements: (achievements) => {
        const normalized = Array.isArray(achievements) ? achievements.slice(0, 3) : [null, null, null];
        while (normalized.length < 3) normalized.push(null);
        set({ selectedAchievements: normalized });
      },

      setUnlockedAchievements: (unlockedAchievements) => {
        set({ unlockedAchievements: Array.isArray(unlockedAchievements) ? unlockedAchievements : [] });
      },

      applyProfile: (profile) => {
        get().setSelectedAchievements(profile.selectedAchievements || []);
        get().setUnlockedAchievements(profile.unlockedAchievements || []);
      },

      fetchUserAchievements: async () => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/achievements`);
          if (!response.ok) throw new Error(data.message || 'Error fetching achievements');

          get().setSelectedAchievements(data.selectedAchievements || []);
          get().setUnlockedAchievements(data.unlockedAchievements || []);
          return { success: true, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      syncUnlockedAchievements: async (unlockedAchievements) => {
        const user = useSessionStore.getState().user;
        get().setUnlockedAchievements(unlockedAchievements);

        if (!user) return { success: false, message: 'User not identified' };

        try {
          const { response, data } = await requestJson('/api/user/achievements/unlocked', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, unlockedAchievements }),
          });

          if (!response.ok) throw new Error(data.message || 'Error syncing achievements');

          get().setUnlockedAchievements(data.unlockedAchievements || unlockedAchievements);
          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      updateAchievements: async (achievements) => {
        const user = useSessionStore.getState().user;
        get().setSelectedAchievements(achievements);

        if (!user) return { success: false, message: 'User not identified' };

        try {
          const { response, data } = await requestJson('/api/user/achievements', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, achievements: get().selectedAchievements }),
          });

          if (!response.ok) throw new Error(data.message || 'Error updating achievements');

          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      clearAchievements: () => set({
        selectedAchievements: [null, null, null],
        unlockedAchievements: [],
        error: null,
      }),
    }),
    {
      name: 'astro-achievements-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? window.localStorage : AsyncStorage
      ),
    }
  )
);
