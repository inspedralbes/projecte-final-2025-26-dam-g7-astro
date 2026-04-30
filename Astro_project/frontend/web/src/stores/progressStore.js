import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import { useSocialStore } from './socialStore';
import { useAchievementsStore } from './achievementsStore';
import {
    STORAGE_KEYS,
    normalizeActiveBoosters,
    readStoredObject,
    requestJson,
    storageGetItem,
    storageRemoveItem,
    storageSetItem,
    writeStoredJson
} from './astroShared';

function persistNullable(key, value) {
    if (value === null || value === undefined || value === '') {
        storageRemoveItem(key);
        return;
    }
    storageSetItem(key, value);
}

export const useProgressStore = defineStore('progress', {
    state: () => ({
        coins: 0,
        partides: 0,
        level: Number(storageGetItem(STORAGE_KEYS.level)) || 1,
        xp: Number(storageGetItem(STORAGE_KEYS.xp)) || 0,
        streak: Number(storageGetItem(STORAGE_KEYS.streak)) || 0,
        streakFreezes: Number(storageGetItem(STORAGE_KEYS.streakFreezes)) || 0,
        activeBoosters: normalizeActiveBoosters(readStoredObject(STORAGE_KEYS.activeBoosters, {})),
        needsFreeze: false,
        lastActivity: storageGetItem(STORAGE_KEYS.lastActivity) || null,
        lastGame: storageGetItem(STORAGE_KEYS.lastGame) || null,
        dailyMissions: [],
        weeklyMissions: [],
        gameHistory: [],
        topGames: [],
        maxScores: {},
        totalGamesPlayed: 0,
        totalPoints: 0,
        missionsCompleted: 0,
        mapLevel: Number(storageGetItem('astro_mapLevel')) || 1,
        selectedAchievements: [],
        error: null
    }),

    getters: {
        isStreakActiveToday: (state) => {
            if (!state.lastGame) return false;
            const last = new Date(state.lastGame);
            const now = new Date();
            return last.getFullYear() === now.getFullYear() &&
                last.getMonth() === now.getMonth() &&
                last.getDate() === now.getDate();
        }
    },

    actions: {
        resolveUser() {
            const sessionStore = useSessionStore();
            return sessionStore.user || null;
        },

        setCoins(coins) {
            this.coins = Number(coins) || 0;
        },

        setPartides(partides) {
            this.partides = Number(partides) || 0;
        },

        setLevel(level) {
            this.level = Number(level) || 1;
            storageSetItem(STORAGE_KEYS.level, this.level);
        },

        // NUEVO: Setter para el mapa
        setMapLevel(level) {
            this.mapLevel = Number(level) || 1;
            storageSetItem('astro_mapLevel', this.mapLevel);
        },

        setXp(xp) {
            this.xp = Number(xp) || 0;
            storageSetItem(STORAGE_KEYS.xp, this.xp);
        },

        setStreak(streak) {
            this.streak = Number(streak) || 0;
            storageSetItem(STORAGE_KEYS.streak, this.streak);
        },

        setStreakFreezes(streakFreezes) {
            this.streakFreezes = Number(streakFreezes) || 0;
            storageSetItem(STORAGE_KEYS.streakFreezes, this.streakFreezes);
        },

        setNeedsFreeze(needsFreeze) {
            this.needsFreeze = !!needsFreeze;
        },

        setActiveBoosters(activeBoosters) {
            this.activeBoosters = normalizeActiveBoosters(activeBoosters || {});
            writeStoredJson(STORAGE_KEYS.activeBoosters, this.activeBoosters);
        },

        setLastActivity(lastActivity) {
            this.lastActivity = lastActivity || null;
            persistNullable(STORAGE_KEYS.lastActivity, this.lastActivity);
        },

        setLastGame(lastGame) {
            this.lastGame = lastGame || null;
            persistNullable(STORAGE_KEYS.lastGame, this.lastGame);
        },

        setDailyMissions(missions = []) {
            this.dailyMissions = Array.isArray(missions) ? missions : [];
        },

        setWeeklyMissions(missions = []) {
            this.weeklyMissions = Array.isArray(missions) ? missions : [];
        },

        setMissionsCompleted(count) {
            this.missionsCompleted = Number(count) || 0;
        },

        applyProfile(profile = {}) {
            this.setCoins(profile.coins ?? this.coins);
            this.setPartides(profile.gamesPlayed ?? this.partides);
            this.setLevel(profile.level ?? this.level);
            this.setXp(profile.xp ?? this.xp);
            this.setStreak(profile.streak ?? this.streak);
            this.setStreakFreezes(profile.streakFreezes ?? this.streakFreezes);
            this.setActiveBoosters(profile.activeBoosters ?? this.activeBoosters);
            this.setNeedsFreeze(profile.needsFreeze);
            this.setLastActivity(profile.lastActivity ?? this.lastActivity);
            this.setLastGame(profile.lastGame ?? this.lastGame);

            // NUEVO: Sincronizar el mapa al hacer login
            if (profile.mapLevel !== undefined) {
                this.setMapLevel(profile.mapLevel);
            }

            if (Array.isArray(profile.dailyMissions)) {
                this.setDailyMissions(profile.dailyMissions);
            }

            if (Array.isArray(profile.weeklyMissions)) {
                this.setWeeklyMissions(profile.weeklyMissions);
            }

            this.gameHistory = profile.gameHistory || [];
            this.topGames = profile.topGames || [];
            this.maxScores = profile.maxScores || {};
            this.totalGamesPlayed = profile.totalGamesPlayed || 0;
            this.totalPoints = profile.totalPoints || 0;
            this.setMissionsCompleted(profile.missionsCompleted ?? this.missionsCompleted);
        },

        async fetchUserStats() {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay una sesión activa.' };

            try {
                const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/stats`);
                if (!response.ok) {
                    if (response.status === 404 && (data.message === 'Usuario no encontrado.' || data.message === 'Usuario no encontrado')) {
                        console.warn('⚠️ Usuario no encontrado en el servidor. Limpiando sesión local...');
                        const sessionStore = useSessionStore();
                        sessionStore.clearSession();
                        this.clearProgress();
                    }
                    throw new Error(data.message || 'No se pudieron obtener las estadísticas.');
                }

                const userData = data.stats || {};
                this.setCoins(userData.coins ?? this.coins);
                this.setLevel(userData.level ?? this.level);
                this.setXp(userData.xp ?? this.xp);
                this.setPartides(userData.gamesPlayed ?? userData.partides ?? this.partides);
                this.setStreak(userData.streak ?? this.streak);
                this.setStreakFreezes(userData.streakFreezes ?? this.streakFreezes);
                this.setActiveBoosters(userData.activeBoosters ?? this.activeBoosters);
                this.setLastActivity(userData.lastActivity ?? this.lastActivity);
                this.setLastGame(userData.lastGame ?? this.lastGame);
                this.setDailyMissions(userData.dailyMissions || []);
                this.setWeeklyMissions(userData.weeklyMissions || []);

                if (userData.mapLevel !== undefined) {
                    this.setMapLevel(userData.mapLevel);
                }

                this.gameHistory = userData.gameHistory || [];
                this.topGames = userData.topGames || [];
                this.maxScores = userData.maxScores || {};
                this.totalGamesPlayed = userData.totalGamesPlayed || 0;
                this.totalPoints = userData.totalPoints || 0;
                this.missionsCompleted = userData.missionsCompleted || 0;

                // Sincronización crucial para logros
                this.partides = this.totalGamesPlayed;

                this.selectedAchievements = userData.selectedAchievements || [];

                // Sincronizar con otros stores
                const socialStore = useSocialStore();
                socialStore.setFriends(userData.friends || []);
                socialStore.setFriendRequests(userData.friendRequests || []);

                const achievementsStore = useAchievementsStore();
                achievementsStore.setSelectedAchievements(userData.selectedAchievements || []);
                achievementsStore.setUnlockedAchievements(userData.unlockedAchievements || []);

                return { success: true, stats: userData, data };


            } catch (error) {
                console.error('❌ Error obteniendo estadísticas:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async fetchUserBalance() {
            this.error = null;
            const user = this.resolveUser();
            if (!user) {
                return { success: false, message: 'No hay una sesión activa.' };
            }

            try {
                const { response, data } = await requestJson(`/api/shop/balance/${encodeURIComponent(user)}`);
                if (!response.ok) {
                    if (response.status === 404 && (data.message === 'Usuario no encontrado.' || data.message === 'Usuario no encontrado')) {
                        const sessionStore = useSessionStore();
                        sessionStore.clearSession();
                        this.clearProgress();
                    }
                    throw new Error(data.message || 'No se pudo obtener el saldo.');
                }

                if (data.coins !== undefined) {
                    this.setCoins(data.coins);
                }

                if (data.gamesPlayed !== undefined) {
                    this.setPartides(data.gamesPlayed);
                }

                return { success: true, balance: data };
            } catch (error) {
                console.error('❌ Error obteniendo saldo:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        // MODIFICADO: Aceptar completedMapNode y enviarlo al servidor
        async registerCompletedGame(game, score = 0, completedMapNode = null) {
            this.error = null;
            const user = this.resolveUser();

            if (!user) {
                return { success: false, message: 'No hay una sesión activa.' };
            }

            if (!game) {
                return { success: false, message: 'Nombre de juego inválido.' };
            }

            try {
                const { response, data } = await requestJson('/api/games/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user,
                        game,
                        score,
                        completedMapNode // ENVIANDO AL SERVIDOR
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'No se pudo registrar la partida.');
                }

                this.setCoins(data.newBalance !== undefined ? data.newBalance : this.coins);
                this.setLevel(data.newLevel !== undefined ? data.newLevel : this.level);
                this.setXp(data.newXp !== undefined ? data.newXp : this.xp);
                this.setPartides(data.gamesPlayed !== undefined ? data.gamesPlayed : (this.partides + 1));
                this.setStreak(data.streak !== undefined ? data.streak : this.streak);
                this.setActiveBoosters(data.activeBoosters ?? this.activeBoosters);
                this.setDailyMissions(data.dailyMissions || this.dailyMissions);
                this.setWeeklyMissions(data.weeklyMissions || this.weeklyMissions);
                this.setNeedsFreeze(data.needsFreeze);

                // NUEVO: Recibir si hemos avanzado en el mapa
                if (data.newMapLevel !== undefined) {
                    this.setMapLevel(data.newMapLevel);
                }

                if (data.gameHistory) this.gameHistory = data.gameHistory;
                if (data.maxScores) this.maxScores = data.maxScores;
                if (data.totalGamesPlayed !== undefined) this.totalGamesPlayed = data.totalGamesPlayed;
                if (data.totalPoints !== undefined) this.totalPoints = data.totalPoints;

                const now = new Date().toISOString();
                this.setLastActivity(now);
                this.setLastGame(now);

                return { success: true, data };
            } catch (error) {
                console.error('❌ Error registrando partida:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async claimMissionReward(missionId, type = 'daily') {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/missions/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user,
                        missionId,
                        type
                    })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Error al reclamar recompensa.');
                }

                // Refrescamos todo el estado (incluyendo el "healing" de misiones y el nuevo balance)
                await this.fetchUserStats();

                return { success: true, message: data.message };
            } catch (error) {
                console.error('❌ Error reclamando misión:', error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async useStreakFreeze() {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay sesión activa.' };

            try {
                const { response, data } = await requestJson('/api/user/use-freeze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user })
                });

                if (!response.ok) {
                    throw new Error(data.message || 'No se pudo usar congelar racha.');
                }

                this.setStreakFreezes(data.streakFreezes);
                this.setNeedsFreeze(false);

                if (data.activeBoosters !== undefined) {
                    this.setActiveBoosters(data.activeBoosters);
                }

                return { success: true, data };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        clearProgress() {
            this.coins = 0;
            this.partides = 0;
            this.level = 1;
            this.xp = 0;
            this.streak = 0;
            this.streakFreezes = 0;
            this.activeBoosters = normalizeActiveBoosters({});
            this.needsFreeze = false;
            this.lastActivity = null;
            this.lastGame = null;
            this.dailyMissions = [];
            this.weeklyMissions = [];
            
            // NUEVO: Limpiar mapa
            this.mapLevel = 1;

            this.error = null;

            storageRemoveItem(STORAGE_KEYS.level);
            storageRemoveItem(STORAGE_KEYS.xp);
            storageRemoveItem(STORAGE_KEYS.streak);
            storageRemoveItem(STORAGE_KEYS.streakFreezes);
            storageRemoveItem(STORAGE_KEYS.activeBoosters);
            storageRemoveItem(STORAGE_KEYS.lastActivity);
            storageRemoveItem(STORAGE_KEYS.lastGame);
            storageRemoveItem('astro_mapLevel'); // Limpieza local
        }
    }
});