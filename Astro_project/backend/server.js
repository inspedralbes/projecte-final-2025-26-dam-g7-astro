require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db');

const { JERARQUIA } = require('./src/constants/progression');
const { createGetCollections } = require('./src/services/collections');
const { createEnsureIndexes } = require('./src/services/indexes');
const inventoryService = require('./src/services/inventoryService');
const { createGetUserStats } = require('./src/services/statsService');
const { createUpdateStreak } = require('./src/services/streakService');
const { normalizeAchievementIds } = require('./src/utils/achievements');
const boosterUtils = require('./src/utils/boosters');

const { registerStatsRoutes } = require('./src/routes/statsRoutes');
const { registerGameRoutes } = require('./src/routes/gameRoutes');
const { registerAuthRoutes } = require('./src/routes/authRoutes');
const { registerShopRoutes } = require('./src/routes/shopRoutes');
const { registerAchievementRoutes } = require('./src/routes/achievementRoutes');
const { registerPlanRoutes } = require('./src/routes/planRoutes');
const { registerInventoryRoutes } = require('./src/routes/inventoryRoutes');
const { registerMissionRoutes } = require('./src/routes/missionRoutes');
const { registerFriendRoutes } = require('./src/routes/friendRoutes');
const { registerMultiplayerRoutes } = require('./src/routes/multiplayerRoutes');
const { registerWsHandlers } = require('./src/ws/registerWsHandlers');
const roomManager = require('./src/ws/RoomManager');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const getCollections = createGetCollections(getDB);
roomManager.init(getCollections, wss);
const ensureIndexes = createEnsureIndexes(getDB);

const getUserStats = createGetUserStats({
    getCollections,
    normalizeInventoryEntries: inventoryService.normalizeInventoryEntries,
    getInventoryQuantity: inventoryService.getInventoryQuantity,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters
});

const updateStreak = createUpdateStreak({
    getCollections,
    normalizeInventoryEntries: inventoryService.normalizeInventoryEntries,
    getInventoryQuantity: inventoryService.getInventoryQuantity
});

registerStatsRoutes(app, { getUserStats });
registerGameRoutes(app, {
    getCollections,
    updateStreak,
    JERARQUIA,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters,
    consumeBoostersForCompletedGame: boosterUtils.consumeBoostersForCompletedGame,
    getScoreMultiplier: boosterUtils.getScoreMultiplier,
    getCoinsMultiplier: boosterUtils.getCoinsMultiplier
});
registerAuthRoutes(app, {
    getDB,
    updateStreak,
    normalizeAchievementIds,
    normalizeAndPersistInventory: inventoryService.normalizeAndPersistInventory,
    getInventoryQuantity: inventoryService.getInventoryQuantity,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters
});
registerShopRoutes(app, {
    getCollections,
    normalizeAndPersistInventory: inventoryService.normalizeAndPersistInventory,
    toPositiveInteger: inventoryService.toPositiveInteger,
    getItemMaxQuantity: inventoryService.getItemMaxQuantity,
    getInventoryCatalogItem: inventoryService.getInventoryCatalogItem,
    serializeInventory: inventoryService.serializeInventory,
    getInventoryQuantity: inventoryService.getInventoryQuantity,
    enrichInventory: inventoryService.enrichInventory
});
registerAchievementRoutes(app, { getCollections, getDB, normalizeAchievementIds });
registerPlanRoutes(app, { getDB });
registerInventoryRoutes(app, {
    getCollections,
    normalizeAndPersistInventory: inventoryService.normalizeAndPersistInventory,
    getInventoryQuantity: inventoryService.getInventoryQuantity,
    serializeInventory: inventoryService.serializeInventory,
    enrichInventory: inventoryService.enrichInventory,
    toPositiveInteger: inventoryService.toPositiveInteger,
    getInventoryCatalogItem: inventoryService.getInventoryCatalogItem,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters,
    getBoosterFieldByItemId: boosterUtils.getBoosterFieldByItemId,
    addBoosterDuration: boosterUtils.addBoosterDuration
});

registerMissionRoutes(app, { getCollections });
registerFriendRoutes(app, { getCollections });
registerMultiplayerRoutes(app, { getCollections });

// Pasar getDB como getter lazy (mismo patrón que otros servicios)
registerWsHandlers(wss, getDB);

connectDB()
    .then(async () => {
        await ensureIndexes();
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVIDOR ASTRO EN PUERTO ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error arrancando servidor:', error);
        process.exit(1);
    });
// --- NUEVA RUTA PARA AMIGOS (EXPLORADORES) ---
app.get('/api/users', async (req, res) => {
    try {
        const { users } = getCollections();
        // Traemos a todos los usuarios pero solo los campos necesarios para la lista
        const allUsers = await users.find({}, {
            projection: {
                user: 1,
                level: 1,
                rank: 1,
                mascot: 1,
                avatar: 1,
                streak: 1,
                selectedAchievements: 1,
                friendRequests: 1
            }
        }).toArray();

        // Asegurar que todos tienen un avatar por defecto si falta en la DB
        const processedUsers = allUsers.map(u => ({
            ...u,
            avatar: u.avatar || 'Astronauta_blanc.jpg'
        }));

        res.json(processedUsers);
    } catch (error) {
        console.error("❌ Error al obtener exploradores:", error);
        res.status(500).json({ message: "Error al obtener la lista de usuarios" });
    }
});

app.put('/api/user/avatar', async (req, res) => {
    const { user, avatar } = req.body;
    if (!user || !avatar) {
        return res.status(400).json({ message: 'Usuario y avatar requeridos.' });
    }

    try {
        const { users } = getCollections();
        await users.updateOne({ user }, { $set: { avatar } });
        console.log(`👤 Avatar actualizado en DB para ${user}: ${avatar}`);
        res.json({ success: true, avatar });
    } catch (error) {
        console.error("❌ Error al actualizar avatar en DB:", error);
        res.status(500).json({ message: "Error interno al actualizar avatar" });
    }
});
