
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
        const query = { $or: [{ user: username }] };
        if (!isNaN(Number(username))) {
            query.$or.push({ user: Number(username) });
        }

        let userDoc = await users.findOne(query);

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
            return shuffled.slice(0, count).map((t, index) => ({
                ...t,
                id: t.id || `${t.type}_${Date.now()}_${index}`,
                text: t.label, // Compatibilidad con versiones antiguas
                progress: 0,
                completed: false,
                claimed: false
            }));
        };

        // --- SANEAR MISIONES EXISTENTES (MIGRACIÓN EN CALIENTE) ---
        // Si el usuario ya tiene misiones hoy pero sin el campo 'label' o 'id', lo arreglamos
        const healMissions = (missions) => {
            if (!Array.isArray(missions)) return { missions: [], changed: false };
            let changed = false;
            const healed = missions.map((m, index) => {
                const newM = { ...m };
                if (!newM.label && newM.text) { newM.label = newM.text; changed = true; }
                if (!newM.text && newM.label) { newM.text = newM.label; changed = true; }
                if (!newM.id) { 
                    newM.id = `${newM.type}_${index}_fixed`; 
                    changed = true; 
                }
                // Asegurar que tengan recompensa si les falta
                if (newM.reward === undefined) {
                    newM.reward = newM.type === 'streak' ? 200 : 100;
                    changed = true;
                }
                return newM;
            });
            return { missions: healed, changed };
        };

        // Diarias
        if (userDoc.lastDailyMissionDate !== today) {
            const DAILY_TEMPLATES = [
                { type: 'games', goal: 3, label: 'Juega 3 partidas', reward: 150 },
                { type: 'coins', goal: 500, label: 'Gana 500 créditos', reward: 100 },
                { type: 'xp', goal: 200, label: 'Consigue 200 XP', reward: 120 },
                { type: 'streak', goal: 1, label: 'Mantén tu racha', reward: 200 },
                { type: 'item', goal: 1, label: 'Usa un objeto', reward: 80 }
            ];
            updates.dailyMissions = generateMissions(DAILY_TEMPLATES, 3);
            updates.lastDailyMissionDate = today;
            needsUpdate = true;
        } else {
            const healed = healMissions(userDoc.dailyMissions);
            if (healed.changed) {
                updates.dailyMissions = healed.missions;
                userDoc.dailyMissions = healed.missions;
                needsUpdate = true;
            }
        }

        // Semanales
        if (userDoc.lastWeeklyMissionKey !== currentWeekKey) {
            const WEEKLY_TEMPLATES = [
                { type: 'games', goal: 20, label: 'Juega 20 partidas', reward: 1000 },
                { type: 'coins', goal: 3000, label: 'Gana 3000 créditos', reward: 800 },
                { type: 'xp', goal: 1500, label: 'Consigue 1500 XP', reward: 1200 },
                { type: 'streak', goal: 5, label: 'Llega a racha de 5 días', reward: 2000 },
                { type: 'item', goal: 10, label: 'Usa 10 objetos', reward: 500 }
            ];
            updates.weeklyMissions = generateMissions(WEEKLY_TEMPLATES, 2);
            updates.lastWeeklyMissionKey = currentWeekKey;
            needsUpdate = true;
        } else {
            const healed = healMissions(userDoc.weeklyMissions);
            if (healed.changed) {
                updates.weeklyMissions = healed.missions;
                userDoc.weeklyMissions = healed.missions;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await users.updateOne({ user: username }, { $set: updates });
            Object.assign(userDoc, updates);
        }

        // --- PROCESAMIENTO DE INVENTARIO Y PUNTOS ---
        const normalizedInventory = await normalizeAndPersistInventory(userDoc, users);
        const inventoryUnits = normalizedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

        // Agregamos estadísticas desde la colección de partidas para asegurar integridad
        const statsAggregation = await partides.aggregate([
            { $match: { user: username } },
            { 
                $group: { 
                    _id: null, 
                    totalPoints: { $sum: '$score' },
                    totalGames: { $sum: 1 }
                } 
            }
        ]).toArray();

        const totalPoints = statsAggregation[0]?.totalPoints || 0;
        const totalGamesPlayed = statsAggregation[0]?.totalGames || 0;

        // Recuperamos el historial real de las últimas 50 partidas
        const realGameHistory = await partides.find({ user: username })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        // Top 3 partidas por puntuación
        const topGames = await partides.find({ user: username })
            .sort({ score: -1 })
            .limit(3)
            .toArray();

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
            gameHistory: realGameHistory,
            topGames: topGames,
            maxScores: userDoc.maxScores || {},
            selectedAchievements: userDoc.selectedAchievements || [],
            totalGamesPlayed: totalGamesPlayed,
            totalPoints: totalPoints,
            missionsCompleted: userDoc.missionsCompleted || 0,
            friends: userDoc.friends || [],
            friendRequests: userDoc.friendRequests || []
        };
    };
}

module.exports = {
    createGetUserStats
};

