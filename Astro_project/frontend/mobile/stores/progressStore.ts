import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestJson } from '../utils/astroShared';
import { useSessionStore } from './sessionStore';

interface ProgressState {
  coins: number;
  partides: number;
  level: number;
  xp: number;
  streak: number;
  streakFreezes: number;
  activeBoosters: Record<string, any>;
  needsFreeze: boolean;
  lastActivity: string | null;
  lastGame: string | null;
  dailyMissions: any[];
  weeklyMissions: any[];
  gameHistory: any[];
  topGames: any[];
  maxScores: Record<string, number>;
  totalGamesPlayed: number;
  totalPoints: number;
  missionsCompleted: number;
  mapLevel: number;
  error: string | null;

  // Actions
  setCoins: (coins: number) => void;
  setLevel: (level: number) => void;
  setMapLevel: (level: number) => void;
  setXp: (xp: number) => void;
  setStreak: (streak: number) => void;
  setStreakFreezes: (count: number) => void;
  setActiveBoosters: (boosters: Record<string, any>) => void;
  setDailyMissions: (missions: any[]) => void;
  setWeeklyMissions: (missions: any[]) => void;
  applyProfile: (profile: any) => void;
  fetchUserStats: () => Promise<{ success: boolean; message?: string }>;
  registerCompletedGame: (game: string, score: number, completedMapNode?: number | null) => Promise<{ success: boolean; data?: any; message?: string }>;
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      coins: 0,
      partides: 0,
      level: 1,
      xp: 0,
      streak: 0,
      streakFreezes: 0,
      activeBoosters: {},
      needsFreeze: false,
      lastActivity: null,
      lastGame: null,
      dailyMissions: [],
      weeklyMissions: [],
      gameHistory: [],
      topGames: [],
      maxScores: {},
      totalGamesPlayed: 0,
      totalPoints: 0,
      missionsCompleted: 0,
      mapLevel: 1,
      error: null,

      setCoins: (coins) => set({ coins }),
      setLevel: (level) => set({ level }),
      setMapLevel: (mapLevel) => set({ mapLevel }),
      setXp: (xp) => set({ xp }),
      setStreak: (streak) => set({ streak }),
      setStreakFreezes: (streakFreezes) => set({ streakFreezes }),
      setActiveBoosters: (activeBoosters) => set({ activeBoosters }),
      setDailyMissions: (dailyMissions) => set({ dailyMissions }),
      setWeeklyMissions: (weeklyMissions) => set({ weeklyMissions }),

      applyProfile: (profile) => {
        set({
          coins: profile.coins ?? get().coins,
          level: profile.level ?? get().level,
          xp: profile.xp ?? get().xp,
          streak: profile.streak ?? get().streak,
          streakFreezes: profile.streakFreezes ?? get().streakFreezes,
          activeBoosters: profile.activeBoosters ?? get().activeBoosters,
          needsFreeze: profile.needsFreeze ?? get().needsFreeze,
          lastActivity: profile.lastActivity ?? get().lastActivity,
          lastGame: profile.lastGame ?? get().lastGame,
          mapLevel: profile.mapLevel ?? get().mapLevel,
          dailyMissions: profile.dailyMissions ?? get().dailyMissions,
          weeklyMissions: profile.weeklyMissions ?? get().weeklyMissions,
          gameHistory: profile.gameHistory ?? get().gameHistory,
          topGames: profile.topGames ?? get().topGames,
          maxScores: profile.maxScores ?? get().maxScores,
          totalGamesPlayed: profile.totalGamesPlayed ?? get().totalGamesPlayed,
          totalPoints: profile.totalPoints ?? get().totalPoints,
          missionsCompleted: profile.missionsCompleted ?? get().missionsCompleted,
        });
      },

      fetchUserStats: async () => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/stats`);
          if (!response.ok) throw new Error(data.message || 'Error fetching stats');

          get().applyProfile(data.stats || {});
          return { success: true };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      registerCompletedGame: async (game, score, completedMapNode = null) => {
        const user = useSessionStore.getState().user;
        if (!user) return { success: false, message: 'No session' };

        try {
          const { response, data } = await requestJson('/api/games/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, game, score, completedMapNode }),
          });

          if (!response.ok) throw new Error(data.message || 'Error registering game');

          set({
            coins: data.newBalance ?? get().coins,
            level: data.newLevel ?? get().level,
            xp: data.newXp ?? get().xp,
            streak: data.streak ?? get().streak,
            activeBoosters: data.activeBoosters ?? get().activeBoosters,
            dailyMissions: data.dailyMissions ?? get().dailyMissions,
            weeklyMissions: data.weeklyMissions ?? get().weeklyMissions,
            needsFreeze: data.needsFreeze ?? get().needsFreeze,
            mapLevel: data.newMapLevel ?? get().mapLevel,
            gameHistory: data.gameHistory ?? get().gameHistory,
            maxScores: data.maxScores ?? get().maxScores,
            totalGamesPlayed: data.totalGamesPlayed ?? get().totalGamesPlayed,
            totalPoints: data.totalPoints ?? get().totalPoints,
            lastActivity: new Date().toISOString(),
            lastGame: new Date().toISOString(),
          });

          return { success: true, data };
        } catch (error: any) {
          set({ error: error.message });
          return { success: false, message: error.message };
        }
      },

      clearProgress: () => set({
        coins: 0,
        partides: 0,
        level: 1,
        xp: 0,
        streak: 0,
        streakFreezes: 0,
        activeBoosters: {},
        needsFreeze: false,
        lastActivity: null,
        lastGame: null,
        dailyMissions: [],
        weeklyMissions: [],
        gameHistory: [],
        topGames: [],
        maxScores: {},
        totalGamesPlayed: 0,
        totalPoints: 0,
        missionsCompleted: 0,
        mapLevel: 1,
        error: null,
      }),
    }),
    {
      name: 'astro-progress-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? window.localStorage : AsyncStorage
      ),
    }
  )
);
