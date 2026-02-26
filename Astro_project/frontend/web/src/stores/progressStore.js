import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
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
        // NUEVOS CAMPOS DE HISTORIAL Y ESTADÍSTICAS
        gameHistory: [],
        topGames: [],
        maxScores: {},
        totalGamesPlayed: 0,
        totalPoints: 0,
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

            if (Array.isArray(profile.dailyMissions)) {
                this.setDailyMissions(profile.dailyMissions);
            }

            if (Array.isArray(profile.weeklyMissions)) {
                this.setWeeklyMissions(profile.weeklyMissions);
            }

            // Aplicar historial y récords
            this.gameHistory = profile.gameHistory || [];
            this.topGames = profile.topGames || [];
            this.maxScores = profile.maxScores || {};
            this.totalGamesPlayed = profile.totalGamesPlayed || 0;
            this.totalPoints = profile.totalPoints || 0;
        },

        async fetchUserStats() {
            this.error = null;
            const user = this.resolveUser();
            if (!user) return { success: false, message: 'No hay una sesión activa.' };

            try {
                const { response, data } = await requestJson(`/api/users/${encodeURIComponent(user)}/stats`);
                if (!response.ok) {
                    throw new Error(data.message || 'No se pudieron obtener las estadísticas.');
                }

                this.setCoins(data.coins ?? this.coins);
                this.setLevel(data.level ?? this.level);
                this.setXp(data.xp ?? this.xp);
                this.setPartides(data.gamesPlayed ?? this.partides);
                this.setStreak(data.streak ?? this.streak);
                this.setStreakFreezes(data.streakFreezes ?? this.streakFreezes);
                this.setActiveBoosters(data.activeBoosters ?? this.activeBoosters);
                this.setLastActivity(data.lastActivity ?? this.lastActivity);
                this.setLastGame(data.lastGame ?? this.lastGame);
                this.setDailyMissions(data.dailyMissions || []);
                this.setWeeklyMissions(data.weeklyMissions || []);

                // Actualizar historial y récords desde stats
                this.gameHistory = data.gameHistory || [];
                this.topGames = data.topGames || [];
                this.maxScores = data.maxScores || {};
                this.totalGamesPlayed = data.totalGamesPlayed || 0;
                this.totalPoints = data.totalPoints || 0;

                return { success: true, stats: data };
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

        async registerCompletedGame(game, score = 0) {
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
                        score
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

                // Actualizar desde respuesta de completar partida
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

                this.setCoins(data.newBalance);
                this.setDailyMissions(data.dailyMissions || this.dailyMissions);
                this.setWeeklyMissions(data.weeklyMissions || this.weeklyMissions);

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
            this.error = null;

            storageRemoveItem(STORAGE_KEYS.level);
            storageRemoveItem(STORAGE_KEYS.xp);
            storageRemoveItem(STORAGE_KEYS.streak);
            storageRemoveItem(STORAGE_KEYS.streakFreezes);
            storageRemoveItem(STORAGE_KEYS.activeBoosters);
            storageRemoveItem(STORAGE_KEYS.lastActivity);
            storageRemoveItem(STORAGE_KEYS.lastGame);
        }
    }
});
