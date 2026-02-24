// backend/src/services/statsService.js

// --- 1. CONFIGURACIÓN DE LAS MISIONES ---
const DAILY_TEMPLATES = [
    { text: "Juega 3 partidas", goal: 3, reward: 50, type: "games" },
    { text: "Gana 100 monedas", goal: 100, reward: 30, type: "coins" },
    { text: "Consigue 500 XP", goal: 500, reward: 40, type: "xp" },
    { text: "Usa 1 Power-Up", goal: 1, reward: 20, type: "item" },
    { text: "Mantén la racha", goal: 1, reward: 25, type: "streak" }
];

const WEEKLY_TEMPLATES = [
    { text: "Juega 20 partidas", goal: 20, reward: 200, type: "games" },
    { text: "Gana 1000 monedas", goal: 1000, reward: 150, type: "coins" },
    { text: "Sube 2 niveles", goal: 2, reward: 300, type: "level" },
    { text: "Consigue una racha de 5 días", goal: 5, reward: 250, type: "streak" }
];

// Función auxiliar para generar IDs únicos simples
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Función para elegir N misiones aleatorias
function generateMissions(templates, count) {
    const shuffled = [...templates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(t => ({
        id: generateId(),
        text: t.text,
        goal: t.goal,
        progress: 0,
        reward: t.reward,
        completed: false,
        claimed: false,
        type: t.type
    }));
}

// --- 2. EL SERVICIO PRINCIPAL ---

function createGetUserStats({
    getCollections,
    normalizeInventoryEntries,
    getInventoryQuantity
}) {
    return async function getUserStats(username) {
        const { users, partides } = getCollections();
        let userDoc = await users.findOne({ user: username });

        if (!userDoc) return null;

        // --- LÓGICA DE GENERACIÓN DE MISIONES ---
        const today = new Date().toDateString(); // Ej: "Tue Feb 24 2026"
        
        // Calculamos el número de semana actual para las semanales
        const currentDate = new Date();
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil(days / 7);
        const currentWeekKey = `${currentDate.getFullYear()}-W${weekNumber}`;

        let updates = {};
        let needsUpdate = false;

        // A) Comprobar Misiones Diarias
        if (userDoc.lastDailyMissionDate !== today) {
            console.log(`🔄 Generando nuevas misiones diarias para ${username}...`);
            const newDailies = generateMissions(DAILY_TEMPLATES, 3);
            updates.dailyMissions = newDailies;
            updates.lastDailyMissionDate = today;
            userDoc.dailyMissions = newDailies; // Actualizamos memoria local
            needsUpdate = true;
        }

        // B) Comprobar Misiones Semanales
        if (userDoc.lastWeeklyMissionKey !== currentWeekKey) {
            console.log(`📅 Generando nuevas misiones semanales para ${username}...`);
            const newWeeklies = generateMissions(WEEKLY_TEMPLATES, 2);
            updates.weeklyMissions = newWeeklies;
            updates.lastWeeklyMissionKey = currentWeekKey;
            userDoc.weeklyMissions = newWeeklies; // Actualizamos memoria local
            needsUpdate = true;
        }

        // C) Guardar cambios en DB si es necesario
        if (needsUpdate) {
            await users.updateOne({ user: username }, { $set: updates });
        }

        // --- FIN LÓGICA MISIONES ---

        const normalizedInventory = normalizeInventoryEntries(userDoc.inventory || []);
        const inventoryUnits = normalizedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const freezeUnits = getInventoryQuantity(normalizedInventory, 2);

        const [gamesPlayed, gamesByTypeRaw] = await Promise.all([
            partides.countDocuments({ user: username }),
            partides
                .aggregate([
                    { $match: { user: username } },
                    { $group: { _id: '$game', total: { $sum: 1 } } }
                ])
                .toArray()
        ]);

        const gamesByType = {};
        for (const item of gamesByTypeRaw) {
            gamesByType[item._id || 'UNKNOWN'] = item.total;
        }

        return {
            user: userDoc.user,
            plan: userDoc.plan || 'INDIVIDUAL_FREE',
            rank: userDoc.rank || 'Cadete de Vuelo',
            level: userDoc.level || 1,
            xp: userDoc.xp || 0,
            coins: userDoc.coins !== undefined ? userDoc.coins : 1000,
            inventoryCount: normalizedInventory.length,
            inventoryUnits,
            gamesPlayed,
            gamesByType,
            streak: userDoc.streak || 0,
            streakFreezes: Math.max(userDoc.streakFreezes || 0, freezeUnits),
            lastActivity: userDoc.lastActivity,
            lastGame: userDoc.lastGame,
            
            // Aquí devolvemos las misiones (recién generadas o existentes)
            dailyMissions: userDoc.dailyMissions || [],
            weeklyMissions: userDoc.weeklyMissions || [],
            friends: userDoc.friends || [] // Y tus amigos, que arreglamos antes
        };
    };
}

module.exports = {
    createGetUserStats
};