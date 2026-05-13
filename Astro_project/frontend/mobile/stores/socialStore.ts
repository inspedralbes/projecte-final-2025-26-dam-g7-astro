import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestJson } from '../utils/astroShared';
import { useSessionStore } from './sessionStore';

interface SocialState {
  friends: any[];
  friendRequests: any[];
  explorers: any[];
  error: string | null;

  // Actions
  setFriends: (friends: any[]) => void;
  setFriendRequests: (requests: any[]) => void;
  setExplorers: (explorers: any[]) => void;
  fetchAllUsers: () => Promise<{ success: boolean; data?: any; message?: string }>;
  addFriendAction: (friendName: string) => Promise<{ success: boolean; message?: string }>;
  removeFriendAction: (friendName: string) => Promise<{ success: boolean; message?: string }>;
  sendFriendRequest: (friendName: string) => Promise<{ success: boolean; message?: string }>;
  acceptFriendRequest: (friendName: string) => Promise<{ success: boolean; message?: string }>;
  rejectFriendRequest: (friendName: string) => Promise<{ success: boolean; message?: string }>;
  clearSocial: () => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      friends: [],
      friendRequests: [],
      explorers: [],
      error: null,

      setFriends: (friends) => set({ friends: Array.isArray(friends) ? friends : [] }),
      setFriendRequests: (friendRequests) => set({ friendRequests: Array.isArray(friendRequests) ? friendRequests : [] }),
      setExplorers: (explorers) => set({ explorers: Array.isArray(explorers) ? explorers : [] }),

      fetchAllUsers: async () => {
        try {
          const { response, data } = await requestJson('/api/users');
          if (!response.ok) throw new Error(data.message || 'Error fetching users');

          set({ explorers: data || [] });
          return { success: true, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      addFriendAction: async (friendName) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/friends/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, friendName }),
          });

          if (!response.ok || !data.success) throw new Error(data.message || 'Error adding friend');

          set({ friends: data.friends || [] });
          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      removeFriendAction: async (friendName) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/friends/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, friendName }),
          });

          if (!response.ok || !data.success) throw new Error(data.message || 'Error removing friend');

          set({ friends: data.friends || [] });
          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      sendFriendRequest: async (friendName) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, friendName }),
          });

          if (!response.ok) throw new Error(data.message || 'Error sending request');

          return { success: true, message: data.message };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      acceptFriendRequest: async (friendName) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/friends/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, friendName }),
          });

          if (!response.ok || !data.success) throw new Error(data.message || 'Error accepting request');

          set({
            friends: data.friends || [],
            friendRequests: data.friendRequests || [],
          });
          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      rejectFriendRequest: async (friendName) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/friends/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, friendName }),
          });

          if (!response.ok || !data.success) throw new Error(data.message || 'Error rejecting request');

          set({ friendRequests: data.friendRequests || [] });
          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      clearSocial: () => set({
        friends: [],
        friendRequests: [],
        explorers: [],
        error: null,
      }),
    }),
    {
      name: 'astro-social-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? window.localStorage : AsyncStorage
      ),
    }
  )
);
