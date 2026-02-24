require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db');

const app = express();

// --- CONFIGURACIÓN ---
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const MAX_INVENTORY_UNITS = 99;

const INVENTORY_ITEMS = Object.freeze([
    {
        id: 1,
        name: 'Pack de Vidas',
        desc: 'Recupera 5 vidas inmediatamente.',
        icon: 'mdi-heart-multiple',
        color: 'red-accent-2',
        cat: 'items',
        price: 200,
        stackable: true
    },
    {
        id: 2,
        name: 'Congelar Racha',
        desc: 'Protege tu racha un día.',
        icon: 'mdi-snowflake',
        color: 'cyan-accent-2',
        cat: 'items',
        price: 500,
        stackable: true
    },
    {
        id: 3,
        name: 'Doble de Monedas',
        desc: 'Multiplica x2 las monedas ganadas.',
        icon: 'mdi-piggy-bank',
        color: 'yellow-accent-3',
        cat: 'items',
        price: 300,
        stackable: true
    },
    {
        id: 4,
        name: 'Doble Puntuación',
        desc: 'Multiplica x2 los puntos obtenidos.',
        icon: 'mdi-star-shooting',
        color: 'orange-accent-3',
        cat: 'items',
        price: 300,
        stackable: true
    },
    {
        id: 101,
        name: 'Pin Comandante',
        desc: 'Insignia dorada.',
        icon: 'mdi-medal',
        color: 'amber-accent-3',
        cat: 'skin',
        price: 2500,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 102,
        name: 'Skin Cyberpunk',
        desc: 'Aspecto robótico.',
        icon: 'mdi-robot',
        color: 'purple-accent-3',
        cat: 'skin',
        price: 5000,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 103,
        name: 'Mascota Dron',
        desc: 'Un compañero fiel.',
        icon: 'mdi-quadcopter',
        color: 'green-accent-3',
        cat: 'pets',
        price: 3500,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 104,
        name: 'Rastro de Neón',
        desc: 'Efectos visuales.',
        icon: 'mdi-creation',
        color: 'pink-accent-3',
        cat: 'trails',
        price: 1500,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 201,
        name: 'Pin Raro',
        desc: 'Insignia rara obtenida en la ruleta.',
        icon: 'mdi-decagram',
        color: 'purple-accent-2',
        cat: 'collectible',
        price: null,
        stackable: true
    },
    {
        id: 202,
        name: 'Avatar Ninja',
        desc: 'Aspecto ninja obtenido en la ruleta.',
        icon: 'mdi-ninja',
        color: 'blue-accent-2',
        cat: 'skin',
        price: null,
        stackable: false,
        maxQuantity: 1
    }
]);

const INVENTORY_ITEM_BY_ID = new Map(INVENTORY_ITEMS.map((item) => [item.id, item]));

const LEGACY_ITEM_NAME_TO_ID = Object.freeze({
    'Vida Extra': 1,
    'Pack de Vidas': 1,
    'Congelar Racha': 2,
    'Doble de Monedas': 3,
    'Doble Puntuación': 4,
    'Pin Comandante': 101,
    'Skin Cyberpunk': 102,
    'Mascota Dron': 103,
    'Rastro de Neón': 104,
    'Pin Raro': 201,
    'Avatar Ninja': 202
});

const LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID = Object.freeze({
    0: 1,
    1: 201,
    2: 202
});

const WHEEL_ITEMS = [
    { id: 0, label: 'Vida Extra', icon: 'mdi-heart', color: '#FF5252', weight: 20, inventoryItemId: 1 },
    { id: 1, label: 'Pin Raro', icon: 'mdi-decagram', color: '#9C27B0', weight: 5, inventoryItemId: 201 },
    { id: 2, label: 'Avatar Ninja', icon: 'mdi-ninja', color: '#2196F3', weight: 5, inventoryItemId: 202 },
    { id: 3, label: 'Monedas', icon: 'mdi-currency-usd', color: '#FFC107', weight: 30, coinsReward: 100 },
    { id: 4, label: 'Nada', icon: 'mdi-emoticon-sad', color: '#795548', weight: 40 }
];

function toInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function toPositiveInteger(value) {
    const parsed = toInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
}

function getInventoryCatalogItem(itemId) {
    return INVENTORY_ITEM_BY_ID.get(itemId) || null;
}

function getItemMaxQuantity(itemId) {
    const item = getInventoryCatalogItem(itemId);
    if (!item) return 1;
    if (Number.isInteger(item.maxQuantity) && item.maxQuantity > 0) return item.maxQuantity;
    if (item.stackable === false) return 1;
    return MAX_INVENTORY_UNITS;
}

function resolveInventoryItemId(rawItem) {
    const candidate =
        rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
            ? rawItem.itemId ?? rawItem.id ?? rawItem.name ?? rawItem.label
            : rawItem;

    if (typeof candidate === 'number' && Number.isInteger(candidate)) {
        return candidate;
    }

    if (typeof candidate !== 'string') return null;

    const trimmed = candidate.trim();
    if (!trimmed) return null;

    if (Object.prototype.hasOwnProperty.call(LEGACY_ITEM_NAME_TO_ID, trimmed)) {
        return LEGACY_ITEM_NAME_TO_ID[trimmed];
    }

    const legacyPrizeMatch = trimmed.match(/^prize_\d+_(\d+)$/);
    if (legacyPrizeMatch) {
        const legacyWheelId = toInteger(legacyPrizeMatch[1]);
        if (
            legacyWheelId !== null &&
            Object.prototype.hasOwnProperty.call(LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID, legacyWheelId)
        ) {
            return LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID[legacyWheelId];
        }
    }

    return toInteger(trimmed);
}

function normalizeInventoryEntries(rawInventory = []) {
    const mergedById = new Map();
    const source = Array.isArray(rawInventory) ? rawInventory : [];

    for (const rawItem of source) {
        const itemId = resolveInventoryItemId(rawItem);
        const catalogItem = getInventoryCatalogItem(itemId);
        if (!catalogItem) continue;

        const maxQuantity = getItemMaxQuantity(itemId);
        const rawQuantity =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? rawItem.quantity ?? rawItem.qty ?? rawItem.units ?? rawItem.count
                : 1;
        const parsedQuantity = toPositiveInteger(rawQuantity) ?? 1;
        const safeQuantity = Math.min(maxQuantity, parsedQuantity);

        const previous = mergedById.get(itemId);
        const nextQuantity = Math.min(maxQuantity, (previous?.quantity || 0) + safeQuantity);
        const isEquipable = catalogItem.cat !== 'items';
        const equippedCandidate =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? !!rawItem.equipped
                : false;

        mergedById.set(itemId, {
            id: itemId,
            quantity: nextQuantity,
            equipped: isEquipable ? Boolean(previous?.equipped || equippedCandidate) : false
        });
    }

    return [...mergedById.values()].sort((a, b) => a.id - b.id);
}

function serializeInventory(inventory = []) {
    return [...(Array.isArray(inventory) ? inventory : [])]
        .map((item) => {
            const itemId = toPositiveInteger(item?.id);
            const catalogItem = getInventoryCatalogItem(itemId);
            if (!catalogItem) return null;

            const maxQuantity = getItemMaxQuantity(itemId);
            const quantity = Math.min(maxQuantity, toPositiveInteger(item?.quantity) || 1);

            return {
                id: itemId,
                quantity,
                equipped: catalogItem.cat !== 'items' ? !!item?.equipped : false
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.id - b.id);
}

function enrichInventory(inventory = []) {
    return serializeInventory(inventory)
        .map((entry) => {
            const catalogItem = getInventoryCatalogItem(entry.id);
            if (!catalogItem) return null;

            return {
                id: entry.id,
                quantity: entry.quantity,
                equipped: catalogItem.cat !== 'items' ? !!entry.equipped : false,
                maxQuantity: getItemMaxQuantity(entry.id),
                name: catalogItem.name,
                desc: catalogItem.desc,
                icon: catalogItem.icon,
                color: catalogItem.color,
                cat: catalogItem.cat,
                price: Number.isFinite(catalogItem.price) ? catalogItem.price : null
            };
        })
        .filter(Boolean);
}

function inventorySignature(inventory = []) {
    return JSON.stringify(serializeInventory(normalizeInventoryEntries(inventory)));
}

async function normalizeAndPersistInventory(userDoc, usersCollection) {
    const normalized = normalizeInventoryEntries(userDoc?.inventory || []);
    const serialized = serializeInventory(normalized);
    const hasStreakFreezesField = Number.isInteger(userDoc?.streakFreezes);
    const storedFreezes = hasStreakFreezesField ? Math.max(0, userDoc.streakFreezes) : 0;

    // Migración de legado: si había congeladores en campo separado, los convertimos a unidades del item 2.
    if (storedFreezes > getInventoryQuantity(serialized, 2)) {
        const freezeMax = getItemMaxQuantity(2);
        const targetFreezeUnits = Math.min(freezeMax, storedFreezes);
        const freezeIndex = serialized.findIndex((entry) => entry.id === 2);

        if (freezeIndex === -1) {
            serialized.push({ id: 2, quantity: targetFreezeUnits, equipped: false });
        } else {
            serialized[freezeIndex].quantity = Math.max(serialized[freezeIndex].quantity, targetFreezeUnits);
        }
    }

    const canonicalInventory = serializeInventory(serialized);
    const freezeUnits = getInventoryQuantity(canonicalInventory, 2);
    const streakNeedsSync = hasStreakFreezesField && userDoc.streakFreezes !== freezeUnits;
    const inventoryNeedsSync = inventorySignature(userDoc?.inventory || []) !== inventorySignature(canonicalInventory);

    if (inventoryNeedsSync || streakNeedsSync) {
        const updatePayload = { inventory: canonicalInventory };
        if (hasStreakFreezesField) {
            updatePayload.streakFreezes = freezeUnits;
        }

        await usersCollection.updateOne({ _id: userDoc._id }, { $set: updatePayload });
    }

    return canonicalInventory;
}

function getInventoryQuantity(inventory = [], itemId) {
    const targetId = toPositiveInteger(itemId);
    if (!targetId) return 0;

    const found = serializeInventory(inventory).find((entry) => entry.id === targetId);
    return found ? found.quantity : 0;
}

// --- CONSTANTES DE PROGRESIÓN ---
const JERARQUIA = [
    "Cadete de Vuelo",      // Niveles 1-2
    "Explorador Estelar",   // Niveles 3-4
    "Navegante Galáctico",  // Niveles 5-6
    "Capitán de Flota",     // Niveles 7-8
    "Comandante Cósmico",   // Niveles 9-10
    "Almirante del Universo" // Niveles 11+
];

let indexesReady = false;

function getCollections() {
    const db = getDB();
    return {
        users: db.collection('users'),
        partides: db.collection('partides')
    };
}

function normalizeAchievementIds(ids = []) {
    if (!Array.isArray(ids)) return [];

    return [...new Set(
        ids
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
    )].sort((a, b) => a - b);
}

async function ensureIndexes() {
    if (indexesReady) return;

    const db = getDB();
    await Promise.all([
        db.collection('users').createIndex({ user: 1 }),
        db.collection('partides').createIndex({ user: 1, createdAt: -1 }),
        db.collection('partides').createIndex({ user: 1, game: 1, createdAt: -1 })
    ]);

    indexesReady = true;
}

async function getUserStats(username) {
    const { users, partides } = getCollections();

    const userDoc = await users.findOne(
        { user: username },
        { projection: { user: 1, coins: 1, inventory: 1, rank: 1, plan: 1, level: 1, xp: 1, streak: 1, lastActivity: 1, streakFreezes: 1 } }
    );

    if (!userDoc) return null;

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
        lastGame: userDoc.lastGame
    };
}

// --- ESTADÍSTICAS Y PARTIDAS ---

app.get('/api/users/:username/stats', async (req, res) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ message: "Usuario requerido." });
    }

    try {
        const stats = await getUserStats(username);
        if (!stats) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.json(stats);
    } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        res.status(500).json({ message: "No se pudieron obtener las estadísticas." });
    }
});

app.get('/api/shop/balance/:username', async (req, res) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ message: "Usuario requerido." });
    }

    try {
        const stats = await getUserStats(username);
        if (!stats) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.json({
            user: stats.user,
            coins: stats.coins,
            gamesPlayed: stats.gamesPlayed
        });
    } catch (error) {
        console.error("Error obteniendo saldo:", error);
        res.status(500).json({ message: "No se pudo obtener el saldo." });
    }
});

async function updateStreak(username, isGame = false) {
    const { users } = getCollections();
    const userDoc = await users.findOne({ user: username });
    if (!userDoc) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const lastActivity = userDoc.lastActivity ? new Date(userDoc.lastActivity) : null;
    const lastGame = userDoc.lastGame ? new Date(userDoc.lastGame) : null;
    const normalizedInventory = normalizeInventoryEntries(userDoc.inventory || []);
    const availableFreezes = Math.max(userDoc.streakFreezes || 0, getInventoryQuantity(normalizedInventory, 2));

    let newStreak = userDoc.streak || 0;
    let needsFreeze = false;

    // 1. Comprobar si la racha ha expirado (más de 1 día sin conexión)
    if (lastActivity) {
        const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
        const diffDays = Math.floor((today - lastActivityDay) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            if (availableFreezes > 0) {
                needsFreeze = true; // Se mantiene el número temporalmente para que el popup lo muestre
            } else {
                newStreak = 0; // Se pierde la racha por inactividad total
            }
        }
    }

    // 2. Lógica al Jugar (Solo aquí sube el número y se enciende el fuego)
    if (isGame) {
        // Si la racha estaba "en peligro" y no usó congelador antes de jugar, se reinicia a 1
        if (needsFreeze) {
            newStreak = 1;
            needsFreeze = false;
        } else if (newStreak === 0) {
            newStreak = 1;
        } else if (lastGame) {
            const lastGameDay = new Date(lastGame.getFullYear(), lastGame.getMonth(), lastGame.getDate());
            const diffGameDays = Math.floor((today - lastGameDay) / (1000 * 60 * 60 * 24));

            if (diffGameDays >= 1) {
                // Si juega en un día nuevo (sea el siguiente o tras varios días de solo login)
                newStreak++;
            }
            // Si diffGameDays === 0, ya jugó hoy, no incrementamos
        } else {
            newStreak = 1;
        }
    }

    const updateData = { $set: { streak: newStreak } };
    if ((userDoc.streakFreezes || 0) !== availableFreezes) {
        updateData.$set.streakFreezes = availableFreezes;
    }

    // El login actualiza lastActivity para indicar que el usuario estuvo hoy (mantiene racha viva)
    if (!isGame) {
        updateData.$set.lastActivity = now;
    } else {
        // Al jugar, se actualiza tanto la actividad como el último juego
        updateData.$set.lastActivity = now;
        updateData.$set.lastGame = now;
    }

    await users.updateOne({ user: username }, updateData);
    return { streak: newStreak, needsFreeze, lastGame: isGame ? now : userDoc.lastGame };
}

app.post('/api/games/complete', async (req, res) => {
    const { user, game, score = 0 } = req.body;

    if (!user || !game) return res.status(400).json({ message: "Usuario y juego requeridos." });

    try {
        const { users, partides } = getCollections();
        const currentUser = await users.findOne({ user });
        if (!currentUser) return res.status(404).json({ message: "Usuario no encontrado." });

        const parsedScore = Number.parseInt(score, 10);
        const normalizedScore = Number.isNaN(parsedScore) ? 0 : Math.max(0, parsedScore);

        // Recompensas: 1 moneda y 1 XP por cada 10 puntos
        const rewards = Math.floor(normalizedScore / 10);

        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        const newBalance = currentCoins + rewards;

        // --- LÓGICA DE NIVEL Y XP ---
        let currentLevel = currentUser.level || 1;
        let currentXp = currentUser.xp || 0;
        currentXp += rewards;

        // Fórmula: XP necesaria = 100 + (nivel - 1) * 50
        let xpNeeded = 100 + (currentLevel - 1) * 50;
        let leveledUp = false;

        while (currentXp >= xpNeeded) {
            currentXp -= xpNeeded;
            currentLevel++;
            xpNeeded = 100 + (currentLevel - 1) * 50;
            leveledUp = true;
        }

        // --- LÓGICA DE RANGO ---
        const rankIndex = Math.min(Math.floor((currentLevel - 1) / 2), JERARQUIA.length - 1);
        const currentRank = JERARQUIA[rankIndex];

        // --- LÓGICA DE RACHA ---
        const streakResult = await updateStreak(user, true);

        await Promise.all([
            partides.insertOne({
                user,
                game,
                score: normalizedScore,
                coinsEarned: rewards,
                xpEarned: rewards,
                createdAt: new Date()
            }),
            users.updateOne(
                { user },
                {
                    $set: {
                        coins: newBalance,
                        level: currentLevel,
                        xp: currentXp,
                        rank: currentRank,
                        streak: streakResult.streak,
                        lastActivity: new Date()
                    }
                }
            )
        ]);

        const gamesPlayed = await partides.countDocuments({ user });

        res.json({
            success: true,
            message: "Partida registrada correctamente.",
            coinsEarned: rewards,
            xpEarned: rewards,
            newBalance,
            newLevel: currentLevel,
            newXp: currentXp,
            newRank: currentRank,
            leveledUp,
            gamesPlayed,
            streak: streakResult.streak,
            needsFreeze: streakResult.needsFreeze,
            lastGame: streakResult.lastGame
        });
    } catch (error) {
        console.error("Error registrando partida:", error);
        res.status(500).json({ message: "Error al registrar la partida." });
    }
});

// --- LÓGICA DE USUARIOS ---

app.post('/api/auth/register', async (req, res) => {
    const { username, password, rank } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Nombre y contraseña requeridos." });
    }

    try {
        const db = getDB();
        const existingUser = await db.collection('users').findOne({ user: username });

        if (existingUser) return res.status(409).json({ message: "El ID de tripulante ya existe." });

        const newUser = {
            user: username,
            pass: password,
            rank: rank || "Cadete de Vuelo",
            plan: "INDIVIDUAL_FREE",
            coins: 1000,
            level: 1,
            xp: 0,
            inventory: [],
            selectedAchievements: [null, null, null],
            unlockedAchievements: [],
            streak: 0,
            streakFreezes: 0,
            lastActivity: new Date(),
            createdAt: new Date()
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: "Reclutamiento completado exitosamente." });
    } catch (error) {
        res.status(500).json({ message: "Error en el sistema de registro." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const username = req.body.username || req.body.user;
    const password = req.body.password || req.body.pass;

    try {
        const db = getDB();
        const foundUser = await db.collection('users').findOne({ user: username, pass: password });

        if (foundUser) {
            console.log(`🚀 Sesión iniciada: ${foundUser.user}`);
            const usersCollection = db.collection('users');
            const normalizedInventory = await normalizeAndPersistInventory(foundUser, usersCollection);
            const freezeUnits = getInventoryQuantity(normalizedInventory, 2);

            const streakResult = await updateStreak(foundUser.user, false);

            res.json({
                status: "Sincronización completada",
                token: "session_token_" + Math.random().toString(36).substr(2),
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan || "INDIVIDUAL_FREE",
                    rank: foundUser.rank || "Cadete de Vuelo",
                    coins: foundUser.coins !== undefined ? foundUser.coins : 1000,
                    level: foundUser.level || 1,
                    xp: foundUser.xp || 0,
                    selectedAchievements: foundUser.selectedAchievements || [null, null, null],
                    unlockedAchievements: normalizeAchievementIds(foundUser.unlockedAchievements || []),
                    streak: streakResult.streak,
                    streakFreezes: Math.max(foundUser.streakFreezes || 0, freezeUnits),
                    needsFreeze: streakResult.needsFreeze,
                    lastActivity: foundUser.lastActivity,
                    lastGame: streakResult.lastGame
                }
            });
        } else {
            res.status(401).json({ status: "Error", message: "Credenciales no reconocidas" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// --- RULETA Y SALDO ---

app.post('/api/shop/spin', async (req, res) => {
    const { user } = req.body;
    try {
        const { users: usersCol } = getCollections();
        const currentUser = await usersCol.findOne({ user: user });

        if (!currentUser) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        const SPIN_COST = 50;

        if (currentCoins < SPIN_COST) return res.status(402).json({ success: false, message: "Saldo insuficiente" });

        const items = WHEEL_ITEMS.filter(i => i.weight > 0);
        const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
        let random = Math.random() * totalWeight;
        let prize = items[0];

        for (const item of items) {
            if (random < item.weight) { prize = item; break; }
            random -= item.weight;
        }

        let finalCoins = currentCoins - SPIN_COST;
        let prizeApplied = false;
        let rewardMessage = null;

        if (Number.isInteger(prize.coinsReward) && prize.coinsReward > 0) {
            finalCoins += prize.coinsReward;
            prizeApplied = true;
        }

        let normalizedInventory = await normalizeAndPersistInventory(currentUser, usersCol);

        if (toPositiveInteger(prize.inventoryItemId)) {
            const itemId = toPositiveInteger(prize.inventoryItemId);
            const itemMax = getItemMaxQuantity(itemId);
            const itemMeta = getInventoryCatalogItem(itemId);
            const existingIndex = normalizedInventory.findIndex((entry) => entry.id === itemId);

            if (existingIndex === -1) {
                normalizedInventory.push({ id: itemId, quantity: 1, equipped: false });
                prizeApplied = true;
            } else if (normalizedInventory[existingIndex].quantity < itemMax) {
                normalizedInventory[existingIndex].quantity += 1;
                prizeApplied = true;
            } else {
                rewardMessage = `Has alcanzado el máximo de ${itemMax} unidades para ${itemMeta?.name || 'este objeto'}.`;
            }
        }

        normalizedInventory = serializeInventory(normalizedInventory);

        await usersCol.updateOne(
            { user: user },
            {
                $set: {
                    coins: finalCoins,
                    inventory: normalizedInventory,
                    streakFreezes: getInventoryQuantity(normalizedInventory, 2)
                }
            }
        );

        res.json({
            success: true,
            prize: {
                id: prize.id,
                label: prize.label,
                icon: prize.icon,
                itemId: prize.inventoryItemId || null
            },
            prizeApplied,
            rewardMessage,
            newBalance: finalCoins,
            inventory: enrichInventory(normalizedInventory)
        });
    } catch (error) {
        console.error("Error en ruleta:", error);
        res.status(500).json({ message: "Error en la ruleta" });
    }
});

// --- ENDPOINT DE LOGROS ---
app.get('/api/users/:username/achievements', async (req, res) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ success: false, message: "Usuario requerido." });
    }

    try {
        const { users } = getCollections();
        const userDoc = await users.findOne(
            { user: username },
            { projection: { selectedAchievements: 1, unlockedAchievements: 1 } }
        );

        if (!userDoc) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado." });
        }

        res.json({
            success: true,
            selectedAchievements: Array.isArray(userDoc.selectedAchievements)
                ? userDoc.selectedAchievements
                : [null, null, null],
            unlockedAchievements: normalizeAchievementIds(userDoc.unlockedAchievements || [])
        });
    } catch (error) {
        console.error("Error obteniendo logros del usuario:", error);
        res.status(500).json({ success: false, message: "No se pudieron obtener los logros." });
    }
});

app.put('/api/user/achievements/unlocked', async (req, res) => {
    const { user, unlockedAchievements } = req.body;

    if (!user) {
        return res.status(400).json({ success: false, message: "Usuario no identificado." });
    }
    if (!Array.isArray(unlockedAchievements)) {
        return res.status(400).json({ success: false, message: "Formato de logros desbloqueados no válido." });
    }

    const normalizedUnlocked = normalizeAchievementIds(unlockedAchievements);
    if (normalizedUnlocked.length > 200) {
        return res.status(400).json({ success: false, message: "Demasiados logros desbloqueados." });
    }

    try {
        const { users } = getCollections();
        const result = await users.updateOne(
            { user: user },
            { $set: { unlockedAchievements: normalizedUnlocked } }
        );

        if (!result.matchedCount) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado." });
        }

        res.json({
            success: true,
            message: "Logros desbloqueados actualizados correctamente.",
            unlockedAchievements: normalizedUnlocked
        });
    } catch (error) {
        console.error("Error actualizando logros desbloqueados:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});

app.put('/api/user/achievements', async (req, res) => {
    const { user, achievements } = req.body;
    console.log(`🏅 Actualizando logros para: ${user}`, achievements);

    if (!user) return res.status(400).json({ success: false, message: "Usuario no identificado" });
    if (!Array.isArray(achievements) || achievements.length > 3) {
        return res.status(400).json({ success: false, message: "Lista de logros no válida (máximo 3)" });
    }

    try {
        const db = getDB();
        const usersCol = db.collection('users');

        await usersCol.updateOne(
            { user: user },
            { $set: { selectedAchievements: achievements } }
        );

        res.json({ success: true, message: "Logros actualizados correctamente" });

    } catch (error) {
        console.error("Error al actualizar logros:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// --- ENDPOINT DE PLAN ---
app.put('/api/user/plan', async (req, res) => {
    const { user, plan } = req.body;
    console.log(`🌌 Actualizando plan para: ${user} -> ${plan}`);

    if (!user || !plan) return res.status(400).json({ success: false, message: "Usuario y plan requeridos" });

    try {
        const db = getDB();
        const usersCol = db.collection('users');

        await usersCol.updateOne(
            { user: user },
            { $set: { plan: plan } }
        );

        res.json({ success: true, message: "Plan actualizado correctamente" });

    } catch (error) {
        console.error("Error al actualizar plan:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// --- ENDPOINT PARA USAR CONGELADOR ---
app.post('/api/user/use-freeze', async (req, res) => {
    const { user } = req.body;
    if (!user) return res.status(400).json({ success: false, message: "Usuario requerido" });

    try {
        const { users } = getCollections();
        const currentUser = await users.findOne({ user });
        if (!currentUser) return res.status(404).json({ message: "Usuario no encontrado" });

        let normalizedInventory = await normalizeAndPersistInventory(currentUser, users);
        const currentFreezeUnits = getInventoryQuantity(normalizedInventory, 2);
        const availableFreezes = Math.max(currentUser.streakFreezes || 0, currentFreezeUnits);

        if (availableFreezes <= 0) {
            return res.status(400).json({ message: "No tienes congeladores disponibles." });
        }

        const freezeIndex = normalizedInventory.findIndex((entry) => entry.id === 2);
        if (freezeIndex !== -1) {
            if (normalizedInventory[freezeIndex].quantity > 1) {
                normalizedInventory[freezeIndex].quantity -= 1;
            } else {
                normalizedInventory.splice(freezeIndex, 1);
            }
        }

        normalizedInventory = serializeInventory(normalizedInventory);
        const updatedFreezeUnits = getInventoryQuantity(normalizedInventory, 2);

        await users.updateOne(
            { user },
            {
                $set: {
                    streakFreezes: updatedFreezeUnits,
                    inventory: normalizedInventory,
                    lastActivity: new Date()
                } // IMPORTANTE: Solo salvamos el día conectándolo, pero el fuego NO se enciende hasta que juegue
            }
        );

        res.json({
            success: true,
            streak: currentUser.streak,
            streakFreezes: updatedFreezeUnits,
            inventory: enrichInventory(normalizedInventory)
        });
    } catch (error) {
        console.error("Error al usar congelador:", error);
        res.status(500).json({ message: "Error al usar el congelador." });
    }
});

// --- SISTEMA DE TIENDA E INVENTARIO ---

app.post('/api/shop/buy', async (req, res) => {
    const { user, item } = req.body;

    try {
        const { users } = getCollections();
        if (!user) return res.status(400).json({ message: "Usuario no identificado." });

        const itemId = toPositiveInteger(item?.id);
        const catalogItem = getInventoryCatalogItem(itemId);

        if (!catalogItem || !Number.isFinite(catalogItem.price)) {
            return res.status(400).json({ message: "Artículo no válido." });
        }

        const currentUser = await users.findOne({ user: user });

        if (!currentUser) return res.status(404).json({ message: "Usuario no encontrado" });

        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        if (currentCoins < catalogItem.price) {
            return res.status(400).json({ message: "Créditos insuficientes." });
        }

        let normalizedInventory = await normalizeAndPersistInventory(currentUser, users);

        const itemMax = getItemMaxQuantity(itemId);
        const currentEntryIndex = normalizedInventory.findIndex((inventoryItem) => inventoryItem.id === itemId);
        const currentQuantity = currentEntryIndex === -1 ? 0 : normalizedInventory[currentEntryIndex].quantity;

        if (currentQuantity >= itemMax) {
            return res.status(400).json({
                message: `Has alcanzado el máximo (${itemMax}) para este objeto.`
            });
        }

        if (currentEntryIndex === -1) {
            normalizedInventory.push({
                id: itemId,
                quantity: 1,
                equipped: false
            });
        } else {
            normalizedInventory[currentEntryIndex].quantity += 1;
        }

        normalizedInventory = serializeInventory(normalizedInventory);
        const newBalance = currentCoins - catalogItem.price;
        const updatedFreezeUnits = getInventoryQuantity(normalizedInventory, 2);

        const updateData = {
            $set: {
                coins: newBalance,
                inventory: normalizedInventory,
                streakFreezes: updatedFreezeUnits
            }
        };

        await users.updateOne({ user: user }, updateData);

        const boughtItem = normalizedInventory.find((inventoryItem) => inventoryItem.id === itemId);

        res.json({
            success: true,
            newBalance,
            streakFreezes: updatedFreezeUnits,
            item: enrichInventory([boughtItem])[0],
            inventory: enrichInventory(normalizedInventory)
        });
    } catch (error) {
        console.error("Error en compra:", error);
        res.status(500).json({ message: "Error en la transacción estelar." });
    }
});

app.get('/api/users/:username/inventory', async (req, res) => {
    const username = req.params.username;
    try {
        const { users } = getCollections();
        const userDoc = await users.findOne({ user: username }, { projection: { inventory: 1 } });

        if (!userDoc) return res.status(404).json({ message: "Usuario no encontrado" });

        const normalizedInventory = await normalizeAndPersistInventory(userDoc, users);

        res.json({ inventory: enrichInventory(normalizedInventory) });
    } catch (error) {
        console.error("Error al obtener inventario:", error);
        res.status(500).json({ message: "Error al obtener el inventario." });
    }
});

app.post('/api/inventory/toggle-equip', async (req, res) => {
    const { user, itemId } = req.body;
    try {
        const parsedItemId = toPositiveInteger(itemId);
        if (!parsedItemId) {
            return res.status(400).json({ message: "Item inválido." });
        }

        const { users } = getCollections();
        const userDoc = await users.findOne({ user: user });

        if (!userDoc) return res.status(404).json({ message: "Usuario no encontrado" });

        let normalizedInventory = await normalizeAndPersistInventory(userDoc, users);
        const itemTarget = normalizedInventory.find((item) => item.id === parsedItemId);
        if (!itemTarget) return res.status(404).json({ message: "Item no encontrado en inventario" });

        const itemMeta = getInventoryCatalogItem(parsedItemId);
        if (!itemMeta || itemMeta.cat === 'items') {
            return res.status(400).json({ message: "Este objeto no se puede equipar." });
        }

        const isEquipping = !itemTarget.equipped;

        const updatedInventory = normalizedInventory.map((item) => {
            if (item.id === parsedItemId) {
                return { ...item, equipped: isEquipping };
            }

            const currentMeta = getInventoryCatalogItem(item.id);
            if (isEquipping && currentMeta?.cat === itemMeta.cat && item.equipped) {
                return { ...item, equipped: false };
            }

            return item;
        });

        const serializedInventory = serializeInventory(updatedInventory);
        await users.updateOne({
            user: user
        }, {
            $set: {
                inventory: serializedInventory
            }
        });

        res.json({ success: true, inventory: enrichInventory(serializedInventory) });
    } catch (error) {
        console.error("Error toggle-equip:", error);
        res.status(500).json({ message: "Error al cambiar equipamiento." });
    }
});

// --- WEBSOCKETS ---
wss.on('connection', (ws) => {
    console.log("📡 Nueva conexión WS establecida");
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'IDENTIFY') console.log(`👤 Usuario identificado en WS: ${msg.user}`);
        } catch (e) { }
    });
});

// --- ARRANQUE ---
connectDB().then(async () => {
    await ensureIndexes();
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`🚀 SERVIDOR ASTRO EN PUERTO ${PORT}`);
    });
});
