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

const { registerStatsRoutes } = require('./src/routes/statsRoutes');
const { registerGameRoutes } = require('./src/routes/gameRoutes');
const { registerAuthRoutes } = require('./src/routes/authRoutes');
const { registerShopRoutes } = require('./src/routes/shopRoutes');
const { registerAchievementRoutes } = require('./src/routes/achievementRoutes');
const { registerPlanRoutes } = require('./src/routes/planRoutes');
const { registerInventoryRoutes } = require('./src/routes/inventoryRoutes');
const { registerWsHandlers } = require('./src/ws/registerWsHandlers');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const getCollections = createGetCollections(getDB);
const ensureIndexes = createEnsureIndexes(getDB);

const getUserStats = createGetUserStats({
    getCollections,
    normalizeInventoryEntries: inventoryService.normalizeInventoryEntries,
    getInventoryQuantity: inventoryService.getInventoryQuantity
});

const updateStreak = createUpdateStreak({
    getCollections,
    normalizeInventoryEntries: inventoryService.normalizeInventoryEntries,
    getInventoryQuantity: inventoryService.getInventoryQuantity
});

registerStatsRoutes(app, { getUserStats });
registerGameRoutes(app, { getCollections, updateStreak, JERARQUIA });
registerAuthRoutes(app, {
    getDB,
    updateStreak,
    normalizeAchievementIds,
    normalizeAndPersistInventory: inventoryService.normalizeAndPersistInventory,
    getInventoryQuantity: inventoryService.getInventoryQuantity
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
    getInventoryCatalogItem: inventoryService.getInventoryCatalogItem
});

registerWsHandlers(wss);

connectDB()
    .then(async () => {
        await ensureIndexes();
        const PORT = 3000;
        server.listen(PORT, () => {
            console.log(`🚀 SERVIDOR ASTRO EN PUERTO ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error arrancando servidor:', error);
        process.exit(1);
    });
