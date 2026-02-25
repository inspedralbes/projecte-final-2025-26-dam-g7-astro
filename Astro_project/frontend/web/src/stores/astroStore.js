import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useMultiplayerStore } from './multiplayerStore';
import { useSessionStore } from './sessionStore';
import { useProgressStore } from './progressStore';
import { useInventoryStore } from './inventoryStore';
import { useAchievementsStore } from './achievementsStore';
import { useSocialStore } from './socialStore';

export const useAstroStore = defineStore('astro', () => {
    const sessionStore = useSessionStore();
    const progressStore = useProgressStore();
    const inventoryStore = useInventoryStore();
    const achievementsStore = useAchievementsStore();
    const socialStore = useSocialStore();
    const multiplayerStore = useMultiplayerStore();

    const user = computed({
        get: () => sessionStore.user,
        set: (value) => sessionStore.setUser(value)
    });

    const plan = computed({
        get: () => sessionStore.plan,
        set: (value) => sessionStore.setPlan(value)
    });

    const rank = computed({
        get: () => sessionStore.rank,
        set: (value) => sessionStore.setRank(value)
    });

    const avatar = computed({
        get: () => sessionStore.avatar,
        set: (value) => sessionStore.setAvatar(value)
    });

    const mascot = computed({
        get: () => sessionStore.mascot,
        set: (value) => sessionStore.setMascot(value)
    });

    const token = computed({
        get: () => sessionStore.token,
        set: (value) => sessionStore.setToken(value)
    });

    const coins = computed({
        get: () => progressStore.coins,
        set: (value) => progressStore.setCoins(value)
    });

    const partides = computed({
        get: () => progressStore.partides,
        set: (value) => progressStore.setPartides(value)
    });

    const level = computed({
        get: () => progressStore.level,
        set: (value) => progressStore.setLevel(value)
    });

    const xp = computed({
        get: () => progressStore.xp,
        set: (value) => progressStore.setXp(value)
    });

    const streak = computed({
        get: () => progressStore.streak,
        set: (value) => progressStore.setStreak(value)
    });

    const streakFreezes = computed({
        get: () => progressStore.streakFreezes,
        set: (value) => progressStore.setStreakFreezes(value)
    });

    const activeBoosters = computed({
        get: () => progressStore.activeBoosters,
        set: (value) => progressStore.setActiveBoosters(value)
    });

    const needsFreeze = computed({
        get: () => progressStore.needsFreeze,
        set: (value) => progressStore.setNeedsFreeze(value)
    });

    const lastActivity = computed({
        get: () => progressStore.lastActivity,
        set: (value) => progressStore.setLastActivity(value)
    });

    const lastGame = computed({
        get: () => progressStore.lastGame,
        set: (value) => progressStore.setLastGame(value)
    });

    const dailyMissions = computed({
        get: () => progressStore.dailyMissions,
        set: (value) => progressStore.setDailyMissions(value)
    });

    const weeklyMissions = computed({
        get: () => progressStore.weeklyMissions,
        set: (value) => progressStore.setWeeklyMissions(value)
    });

    const inventory = computed({
        get: () => inventoryStore.inventory,
        set: (value) => inventoryStore.setInventory(value)
    });

    const selectedAchievements = computed({
        get: () => achievementsStore.selectedAchievements,
        set: (value) => achievementsStore.setSelectedAchievements(value)
    });

    const unlockedAchievements = computed({
        get: () => achievementsStore.unlockedAchievements,
        set: (value) => achievementsStore.setUnlockedAchievements(value)
    });

    const friends = computed({
        get: () => socialStore.friends,
        set: (value) => socialStore.setFriends(value)
    });

    const explorers = computed({
        get: () => socialStore.explorers,
        set: (value) => socialStore.setExplorers(value)
    });

    const socket = computed(() => multiplayerStore.socket);
    const isConnected = computed(() => multiplayerStore.isConnected);

    const error = computed({
        get: () => (
            sessionStore.error ||
            progressStore.error ||
            inventoryStore.error ||
            achievementsStore.error ||
            socialStore.error ||
            multiplayerStore.error ||
            null
        ),
        set: (value) => {
            sessionStore.error = value;
        }
    });

    const isStreakActiveToday = computed(() => progressStore.isStreakActiveToday);
    const inventoryUnits = computed(() => inventoryStore.inventoryUnits);

    async function registerTripulante(userData) {
        return sessionStore.registerTripulante(userData);
    }

    async function loginTripulante(credentials) {
        const result = await sessionStore.loginTripulante(credentials);
        if (!result.success) {
            return result;
        }

        const profile = result.data?.profile || {};
        progressStore.applyProfile(profile);
        achievementsStore.applyProfile(profile);

        if (Array.isArray(profile.friends)) {
            socialStore.setFriends(profile.friends);
        }

        const inventoryResult = await inventoryStore.fetchUserInventory();
        if (inventoryResult.success && inventoryResult.data?.activeBoosters !== undefined) {
            progressStore.setActiveBoosters(inventoryResult.data.activeBoosters);
        }

        multiplayerStore.connect();
        return { success: true };
    }

    async function fetchUserStats() {
        const result = await progressStore.fetchUserStats();
        if (result.success && result.stats) {
            socialStore.setFriends(result.stats.friends || []);
        }
        return result;
    }

    async function fetchAllUsers() {
        return socialStore.fetchAllUsers();
    }

    async function fetchUserBalance() {
        return progressStore.fetchUserBalance();
    }

    async function registerCompletedGame(game, score = 0) {
        const result = await progressStore.registerCompletedGame(game, score);

        if (result.success && result.data?.newRank) {
            sessionStore.setRank(result.data.newRank);
        }

        return result;
    }

    async function buyItem(item) {
        const result = await inventoryStore.buyItem(item);
        if (!result.success) {
            return result;
        }

        const data = result.data || {};
        if (data.newBalance !== undefined) {
            progressStore.setCoins(data.newBalance);
        }

        if (data.streakFreezes !== undefined) {
            progressStore.setStreakFreezes(data.streakFreezes);
        } else if (Number(item?.id) === 2) {
            progressStore.setStreakFreezes(progressStore.streakFreezes + 1);
        }

        return { success: true, data };
    }

    async function useInventoryItem(itemId) {
        const result = await inventoryStore.useInventoryItem(itemId);
        if (!result.success) {
            return result;
        }

        const data = result.data || {};

        if (data.activeBoosters !== undefined) {
            progressStore.setActiveBoosters(data.activeBoosters);
        }

        if (Array.isArray(data.dailyMissions)) {
            progressStore.setDailyMissions(data.dailyMissions);
        }

        if (Array.isArray(data.weeklyMissions)) {
            progressStore.setWeeklyMissions(data.weeklyMissions);
        }

        return { success: true, data };
    }

    async function claimMissionReward(missionId, type = 'daily') {
        return progressStore.claimMissionReward(missionId, type);
    }

    async function fetchUserInventory() {
        const result = await inventoryStore.fetchUserInventory();
        if (result.success && result.data?.activeBoosters !== undefined) {
            progressStore.setActiveBoosters(result.data.activeBoosters);
        }

        return result.success ? result.inventory : [];
    }

    async function fetchUserAchievements() {
        return achievementsStore.fetchUserAchievements();
    }

    async function syncUnlockedAchievements(nextIds) {
        return achievementsStore.syncUnlockedAchievements(nextIds);
    }

    async function addFriendAction(friendName) {
        return socialStore.addFriendAction(friendName);
    }

    async function removeFriendAction(friendName) {
        return socialStore.removeFriendAction(friendName);
    }

    function connectWebSocket() {
        multiplayerStore.connect();
    }

    function logout() {
        multiplayerStore.disconnect();
        sessionStore.clearSession();
        progressStore.clearProgress();
        inventoryStore.clearInventory();
        achievementsStore.clearAchievements();
        socialStore.clearSocial();
        console.log('🛰️ Sesión cerrada. Regresando a la base.');
    }

    function updateAvatar(seed) {
        sessionStore.updateAvatar(seed);
    }

    function updateMascot(mascotFile) {
        sessionStore.updateMascot(mascotFile);
    }

    async function updateAchievements(achievements) {
        return achievementsStore.updateAchievements(achievements);
    }

    async function updatePlan(planType) {
        return sessionStore.updatePlan(planType);
    }

    async function useStreakFreeze() {
        const result = await progressStore.useStreakFreeze();
        if (!result.success) {
            return result;
        }

        if (Array.isArray(result.data?.inventory)) {
            inventoryStore.setInventory(result.data.inventory);
        }

        return { success: true };
    }

    function setCoins(newCoins) {
        progressStore.setCoins(newCoins);
    }

    function setInventory(items) {
        inventoryStore.setInventory(items);
    }

    return {
        user,
        plan,
        rank,
        coins,
        partides,
        level,
        xp,
        streak,
        streakFreezes,
        activeBoosters,
        needsFreeze,
        inventory,
        selectedAchievements,
        unlockedAchievements,
        avatar,
        mascot,
        token,
        lastActivity,
        lastGame,
        dailyMissions,
        weeklyMissions,
        friends,
        explorers,
        socket,
        isConnected,
        error,

        isStreakActiveToday,
        inventoryUnits,

        registerTripulante,
        loginTripulante,
        fetchUserStats,
        fetchAllUsers,
        fetchUserBalance,
        registerCompletedGame,
        buyItem,
        useInventoryItem,
        claimMissionReward,
        fetchUserInventory,
        fetchUserAchievements,
        syncUnlockedAchievements,
        addFriendAction,
        removeFriendAction,
        connectWebSocket,
        logout,
        updateAvatar,
        updateMascot,
        updateAchievements,
        updatePlan,
        useStreakFreeze,
        setCoins,
        setInventory
    };
});
