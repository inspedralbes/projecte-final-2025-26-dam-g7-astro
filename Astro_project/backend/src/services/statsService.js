// Astro_project/backend/src/services/statsService.js

const DAILY_TEMPLATES = [
    { text: "Juega 3 partidas", goal: 3, reward: 150, type: "games" },
    { text: "Gana 500 créditos", goal: 500, reward: 100, type: "coins" },
    { text: "Consigue 200 XP", goal: 200, reward: 120, type: "xp" },
    { text: "Usa un objeto", goal: 1, reward: 80, type: "item" },
    { text: "Mantén tu racha", goal: 1, reward: 200, type: "streak" }
];

const WEEKLY_TEMPLATES = [
    { text: "Maestro de Juegos (20 partidas)", goal: 20, reward: 1000, type: "games" },
    { text: "Buscador de Oro (3000 créditos)", goal: 3000, reward: 800, type: "coins" },
    { text: "Ascensión Lunar (Consigue 1500 XP)", goal: 1500, reward: 1200, type: "xp" },
    { text: "Superviviente Espacial (Racha 5 días)", goal: 5, reward: 2000, type: "streak" },
    { text: "Interacción de Objetos (10 objetos)", goal: 10, reward: 500, type: "item" }
];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

function generateMissions(templates, count) {
    const shuffled = [...templates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(t => ({
        id: generateId(),
        text: t.text,
        label: t.text, // Compatibilidad
        goal: t.goal,
        progress: 0,
        reward: t.reward,
        completed: false,
        claimed: false,
        type: t.type
    }));
}

class StatsService {
    constructor({
        userRepository,
        partidaRepository,
        normalizeInventoryEntries,
        getInventoryQuantity,
        normalizeActiveBoosters
    }) {
        this.userRepo = userRepository;
        this.partidaRepo = partidaRepository;
        this.normalizeInventoryEntries = normalizeInventoryEntries;
        this.getInventoryQuantity = getInventoryQuantity;
        this.normalizeActiveBoosters = normalizeActiveBoosters;
    }

    async getUserStats(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) return null;

        await this._refreshMissionsIfNeeded(user);

        const normalizedInventory = this.normalizeInventoryEntries(user.inventory || []);
        const inventoryUnits = normalizedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const freezeUnits = this.getInventoryQuantity(normalizedInventory, 2);

        const [
            gamesPlayed,
            gamesByType,
            recentGames,
            top5Games,
            totalPoints
        ] = await Promise.all([
            this.partidaRepo.countByUser(user.username),
            this.partidaRepo.getGamesByType(user.username),
            this.partidaRepo.findRecentByUser(user.username, 20),
            this.partidaRepo.findTopByUser(user.username, 5),
            this.partidaRepo.getTotalPointsByUser(user.username)
        ]);

        return {
            user: user.username,
            plan: user.plan,
            rank: user.rank,
            level: user.level,
            xp: user.xp,
            coins: user.coins,
            mapLevel: user.mapLevel || 1,
            activeBoosters: this.normalizeActiveBoosters(user.activeBoosters),
            inventoryCount: normalizedInventory.length,
            inventoryUnits,
            gamesPlayed,
            gamesByType,
            streak: user.streak,
            streakFreezes: Math.max(user.streakFreezes || 0, freezeUnits),
            lastActivity: user.lastActivity,
            lastGame: user.lastGame,
            dailyMissions: user.dailyMissions || [],
            weeklyMissions: user.weeklyMissions || [],
            friends: user.friends || [],
            gameHistory: recentGames,
            topGames: top5Games,
            maxScores: user.maxScores || {},
            totalGamesPlayed: gamesPlayed,
            totalPoints: totalPoints,
            missionsCompleted: user.missionsCompleted || 0,
            selectedAchievements: user.selectedAchievements || [null, null, null],
            unlockedAchievements: user.unlockedAchievements || [],
            friendRequests: user.friendRequests || []
        };
    }

    async _refreshMissionsIfNeeded(user) {
        const today = new Date().toDateString();
        const currentDate = new Date();
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil(days / 7);
        const currentWeekKey = `${currentDate.getFullYear()}-W${weekNumber}`;

        let needsUpdate = false;

        if (user.lastDailyMissionDate !== today) {
            user.dailyMissions = generateMissions(DAILY_TEMPLATES, 3);
            user.lastDailyMissionDate = today;
            needsUpdate = true;
        }

        if (user.lastWeeklyMissionKey !== currentWeekKey) {
            user.weeklyMissions = generateMissions(WEEKLY_TEMPLATES, 2);
            user.lastWeeklyMissionKey = currentWeekKey;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await this.userRepo.update(user);
        }
    }
}

// Per mantenir compatibilitat temporal amb el codi que usa createGetUserStats
function createGetUserStats(dependencies) {
    const service = new StatsService(dependencies);
    return (username) => service.getUserStats(username);
}

module.exports = {
    StatsService,
    createGetUserStats
};
