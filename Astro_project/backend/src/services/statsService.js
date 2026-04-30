
const {
    normalizeAndPersistInventory,
    enrichInventory,
    normalizeInventoryEntries
} = require('./inventoryService');

const {
    normalizeActiveBoosters
} = require('../utils/boosters');

function createGetUserStats({
    getCollections,
    normalizeInventoryEntries,
    getInventoryQuantity,
    normalizeActiveBoosters
}) {
    /**
     * Recupera todas las estadísticas de un usuario, procesa misiones diarias/semanales
     * y normaliza el inventario.
     */
    return async function getUserStats(username) {
        const { users, partides } = getCollections();

        // Búsqueda EXACTA (Case Sensitive) a petición del usuario
        let userDoc = await users.findOne({ 
            $or: [
                { user: username },
                { user: isNaN(Number(username)) ? null : Number(username) }
            ]
        });

        if (userDoc) {
            console.log(`🔍 [DEBUG] Usuario encontrado: ${username} | _id: ${userDoc._id} | Nivel: ${userDoc.level}`);
        } else {
            console.warn(`⚠️ [DEBUG] Usuario NO encontrado: ${username}`);
        }

        if (!userDoc) return null;

        // --- LÓGICA DE MISIONES ---
        const today = new Date().toDateString();
        const currentDate = new Date();
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil(days / 7);
        const currentWeekKey = `${currentDate.getFullYear()}-W${weekNumber}`;

        let updates = {};
        let needsUpdate = false;

        const generateMissions = (templates, count) => {
            const shuffled = [...templates].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count).map(t => ({
                ...t,
                progress: 0,
                completed: false,
                claimed: false
            }));
        };

        // Diarias
        if (userDoc.lastDailyMissionDate !== today) {
            const DAILY_TEMPLATES = [
                { type: 'games', goal: 3, label: 'Juega 3 partidas' },
                { type: 'coins', goal: 500, label: 'Gana 500 créditos' },
                { type: 'xp', goal: 200, label: 'Consigue 200 XP' },
                { type: 'streak', goal: 1, label: 'Mantén tu racha' },
                { type: 'item', goal: 1, label: 'Usa un objeto' }
            ];
            updates.dailyMissions = generateMissions(DAILY_TEMPLATES, 3);
            updates.lastDailyMissionDate = today;
            needsUpdate = true;
        }

        // Semanales
        if (userDoc.lastWeeklyMissionKey !== currentWeekKey) {
            const WEEKLY_TEMPLATES = [
                { type: 'games', goal: 20, label: 'Juega 20 partidas' },
                { type: 'coins', goal: 3000, label: 'Gana 3000 créditos' },
                { type: 'xp', goal: 1500, label: 'Consigue 1500 XP' },
                { type: 'streak', goal: 5, label: 'Llega a racha de 5 días' },
                { type: 'item', goal: 10, label: 'Usa 10 objetos' }
            ];
            updates.weeklyMissions = generateMissions(WEEKLY_TEMPLATES, 2);
            updates.lastWeeklyMissionKey = currentWeekKey;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await users.updateOne({ user: username }, { $set: updates });
            Object.assign(userDoc, updates);
        }

        // --- PROCESAMIENTO DE INVENTARIO Y PUNTOS ---
        const normalizedInventory = await normalizeAndPersistInventory(userDoc, users);
        const inventoryUnits = normalizedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

        const totalPointsResult = await partides.aggregate([
            { $match: { user: username } },
            { $group: { _id: null, total: { $sum: '$score' } } }
        ]).toArray();
        const totalPoints = totalPointsResult[0]?.total || 0;

        // --- RETORNO DE DATOS COMPLETOS ---
        return {
            _id: userDoc._id,
            user: userDoc.user,
            plan: userDoc.plan || 'INDIVIDUAL_FREE',
            rank: userDoc.rank || 'Cadete de Vuelo',
            avatar: userDoc.avatar || null,
            mascot: userDoc.mascot || null,
            level: (userDoc.level !== undefined && userDoc.level !== null) ? userDoc.level : 1,
            xp: (userDoc.xp !== undefined && userDoc.xp !== null) ? userDoc.xp : 0,
            coins: (userDoc.coins !== undefined && userDoc.coins !== null) ? userDoc.coins : 1000,
            mapLevel: (userDoc.mapLevel !== undefined && userDoc.mapLevel !== null) ? userDoc.mapLevel : 1,
            activeBoosters: normalizeActiveBoosters(userDoc.activeBoosters),
            inventoryCount: normalizedInventory.length,
            inventoryUnits,
            inventory: enrichInventory(normalizedInventory),
            streak: userDoc.streak || 0,
            streakFreezes: userDoc.streakFreezes || 0,
            lastActivity: userDoc.lastActivity,
            lastGame: userDoc.lastGame,
            dailyMissions: userDoc.dailyMissions || [],
            weeklyMissions: userDoc.weeklyMissions || [],
            gameHistory: userDoc.gameHistory || [],
            topGames: userDoc.topGames || [],
            maxScores: userDoc.maxScores || {},
            selectedAchievements: userDoc.selectedAchievements || [],
            totalGamesPlayed: userDoc.totalGamesPlayed || 0,
            totalPoints: totalPoints,
            friends: userDoc.friends || [],
            friendRequests: userDoc.friendRequests || []
        };
    };
}

module.exports = {
    createGetUserStats
};

