import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestJson, STORAGE_KEYS, SESSION_TIMEOUT_MS } from '../utils/astroShared';

interface SessionState {
  user: string | null;
  plan: string;
  rank: string | null;
  role: string | null;
  token: string | null;
  avatar: string;
  lastActivity: number;
  error: string | null;
  
  // Actions
  setUser: (user: string | null) => void;
  setToken: (token: string | null) => void;
  applyLoginPayload: (data: any) => void;
  updateLastActivity: () => void;
  checkSessionExpiration: () => boolean;
  loginTripulante: (credentials: any) => Promise<{ success: boolean; message?: string }>;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      plan: 'INDIVIDUAL_FREE',
      rank: null,
      role: null,
      token: null,
      avatar: 'Astronauta_blanc.jpg',
      lastActivity: Date.now(),
      error: null,

      setUser: (user) => set({ user }),
      
      setToken: (token) => {
        set({ token, lastActivity: Date.now() });
      },

      updateLastActivity: () => set({ lastActivity: Date.now() }),

      applyLoginPayload: (data) => {
        const profile = data.profile || {};
        set({
          user: profile.name || get().user,
          plan: profile.plan || get().plan,
          rank: profile.rank || get().rank,
          role: profile.role || get().role,
          token: data.token || get().token,
          avatar: profile.avatar || get().avatar,
          lastActivity: Date.now(),
        });
      },

      checkSessionExpiration: () => {
        const { token, lastActivity } = get();
        if (!token) return false;
        
        const now = Date.now();
        if (now - lastActivity > SESSION_TIMEOUT_MS) {
          get().clearSession();
          return true;
        }
        return false;
      },

      loginTripulante: async (credentials) => {
        set({ error: null });
        try {
          const { response, data } = await requestJson('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: credentials.username || credentials.user,
              password: credentials.password || credentials.pass,
            }),
          });

          if (!response.ok) {
            const msg = data.message || 'Error de autenticación';
            set({ error: msg });
            return { success: false, message: msg };
          }

          get().applyLoginPayload(data);
          return { success: true };
        } catch (error: any) {
          const msg = error.message || 'Error al conectar con el servidor';
          set({ error: msg });
          return { success: false, message: msg };
        }
      },

      clearSession: () => set({
        user: null,
        plan: 'INDIVIDUAL_FREE',
        rank: null,
        role: null,
        token: null,
        avatar: 'Astronauta_blanc.jpg',
        lastActivity: Date.now(),
        error: null,
      }),
    }),
    {
      name: 'astro-session-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? window.localStorage : AsyncStorage
      ),
    }
  )
);
