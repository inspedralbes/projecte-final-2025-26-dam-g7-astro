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
const GameService = require('./src/services/gameService');
const AuthService = require('./src/services/authService');
const ShopService = require('./src/services/shopService');
const AchievementService = require('./src/services/achievementService');
const SocialService = require('./src/services/socialService');
const MissionService = require('./src/services/missionService');
const UserService = require('./src/services/userService');
const MultiplayerService = require('./src/services/multiplayerService');
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

// REPOSITORIS
const MongoUserRepository = require('./src/repositories/MongoUserRepository');
const MongoPartidaRepository = require('./src/repositories/MongoPartidaRepository');
const MongoRoomRepository = require('./src/repositories/MongoRoomRepository');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const getCollections = createGetCollections(getDB);

// Inicialització de repositoris (patró injecció de dependències amb lazy loading)
const userRepository = new MongoUserRepository(() => getCollections().users);
const partidaRepository = new MongoPartidaRepository(() => getCollections().partides);
const roomRepository = new MongoRoomRepository(() => getCollections().rooms);

roomManager.init(getCollections, wss);
const ensureIndexes = createEnsureIndexes(getDB);

const getUserStats = createGetUserStats({
    userRepository,
    partidaRepository,
    normalizeInventoryEntries: inventoryService.normalizeInventoryEntries,
    getInventoryQuantity: inventoryService.getInventoryQuantity,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters
});

const updateStreak = createUpdateStreak({
    userRepository,
    normalizeInventoryEntries: inventoryService.normalizeInventoryEntries,
    getInventoryQuantity: inventoryService.getInventoryQuantity
});

const gameService = new GameService({
    userRepository,
    partidaRepository,
    updateStreak,
    JERARQUIA,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters,
    consumeBoostersForCompletedGame: boosterUtils.consumeBoostersForCompletedGame,
    getScoreMultiplier: boosterUtils.getScoreMultiplier,
    getCoinsMultiplier: boosterUtils.getCoinsMultiplier
});

const inventoryServiceInstance = new inventoryService.InventoryService({
    userRepository,
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters,
    getBoosterFieldByItemId: boosterUtils.getBoosterFieldByItemId,
    addBoosterDuration: boosterUtils.addBoosterDuration
});

const authService = new AuthService({
    userRepository,
    updateStreak,
    normalizeAndPersistInventory: inventoryServiceInstance.normalizeAndPersistInventory.bind(inventoryServiceInstance),
    getInventoryQuantity: inventoryServiceInstance.getInventoryQuantity.bind(inventoryServiceInstance),
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters
});

const shopService = new ShopService({
    userRepository,
    inventoryService: inventoryServiceInstance
});

const achievementService = new AchievementService({
    userRepository,
    normalizeAchievementIds
});

const socialService = new SocialService({
    userRepository
});

const missionService = new MissionService({
    userRepository
});

const userServiceInstance = new UserService({
    userRepository
});

const multiplayerService = new MultiplayerService({
    roomRepository
});

registerStatsRoutes(app, { getUserStats });
registerGameRoutes(app, { gameService });
registerAuthRoutes(app, {
    authService,
    normalizeAchievementIds,
    getInventoryQuantity: inventoryServiceInstance.getInventoryQuantity.bind(inventoryServiceInstance),
    normalizeActiveBoosters: boosterUtils.normalizeActiveBoosters
});
registerShopRoutes(app, { shopService });
registerAchievementRoutes(app, { achievementService });
registerPlanRoutes(app, { userService: userServiceInstance });
registerInventoryRoutes(app, { inventoryService: inventoryServiceInstance });

registerMissionRoutes(app, { missionService });
registerFriendRoutes(app, { socialService });
registerMultiplayerRoutes(app, { multiplayerService });

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

// --- RUTES D'USUARI EXTRES ---
app.get('/api/users', async (req, res) => {
    try {
        const processedUsers = await userServiceInstance.getAllExplorers();
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
        await userServiceInstance.updateAvatar(user, avatar);
        console.log(`👤 Avatar actualizado en DB para ${user}: ${avatar}`);
        res.json({ success: true, avatar });
    } catch (error) {
        console.error("❌ Error al actualizar avatar en DB:", error);
        res.status(error.message.includes('encontrado') ? 404 : 500).json({ message: error.message });
    }
});
