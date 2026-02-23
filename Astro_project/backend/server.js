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

const WHEEL_ITEMS = [
    { id: 0, label: 'Vida Extra', icon: 'mdi-heart', color: '#FF5252', weight: 20 },
    { id: 1, label: 'Pin Raro', icon: 'mdi-decagram', color: '#9C27B0', weight: 5 },
    { id: 2, label: 'Avatar Ninja', icon: 'mdi-ninja', color: '#2196F3', weight: 5 },
    { id: 3, label: 'Monedas', icon: 'mdi-currency-usd', color: '#FFC107', weight: 30 },
    { id: 4, label: 'Nada', icon: 'mdi-emoticon-sad', color: '#795548', weight: 40 }
];

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
        { projection: { user: 1, coins: 1, inventory: 1, rank: 1, plan: 1, level: 1, xp: 1 } }
    );

    if (!userDoc) return null;

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
        inventoryCount: Array.isArray(userDoc.inventory) ? userDoc.inventory.length : 0,
        gamesPlayed,
        gamesByType
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
                        rank: currentRank
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
            gamesPlayed
        });
    } catch (error) {
        console.error("Error registrando partida:", error);
        res.status(500).json({ message: "Error al registrar la partida." });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const { users } = getCollections();
        const allUsers = await users.find({}, {
            projection: { user: 1, level: 1, inventory: 1 }
        }).toArray();

        const formattedUsers = allUsers.map(u => {
            const equippedPet = u.inventory?.find(item => item.cat === 'pets' && item.equipped);
            return {
                name: u.user,
                level: u.level || 1,
                pet: equippedPet ? { name: equippedPet.name, icon: equippedPet.icon } : null
            };
        });

        res.json(formattedUsers);
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ message: "Error al obtener la lista de usuarios." });
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
                    selectedAchievements: foundUser.selectedAchievements || [null, null, null]
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
        if (prize.label === 'Monedas') finalCoins += 100;

        const updateData = { $set: { coins: finalCoins } };

        if (prize.label !== 'Nada' && prize.label !== 'Monedas') {
            const itemToSave = {
                id: `prize_${Date.now()}_${prize.id}`,
                name: prize.label,
                icon: prize.icon,
                color: prize.color,
                cat: prize.id === 2 ? 'skin' : 'collectible',
                equipped: false,
                purchasedAt: new Date()
            };
            updateData.$push = { inventory: itemToSave };
        }

        await usersCol.updateOne({ user: user }, updateData);

        res.json({
            success: true,
            prize: { id: prize.id, label: prize.label, icon: prize.icon },
            newBalance: finalCoins
        });
    } catch (error) {
        res.status(500).json({ message: "Error en la ruleta" });
    }
});

// --- ENDPOINT DE LOGROS ---
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

// --- SISTEMA DE TIENDA E INVENTARIO ---

app.post('/api/shop/buy', async (req, res) => {
    const { user, item } = req.body;

    try {
        const { users } = getCollections();
        const currentUser = await users.findOne({ user: user });

        if (!currentUser) return res.status(404).json({ message: "Usuario no encontrado" });

        const currentCoins = currentUser.coins || 0;
        if (currentCoins < item.price) {
            return res.status(400).json({ message: "Créditos insuficientes." });
        }

        const alreadyOwned = currentUser.inventory?.some(i => i.id === item.id);
        if (alreadyOwned) {
            return res.status(400).json({ message: "Ya tienes este artículo." });
        }

        const newBalance = currentCoins - item.price;

        const itemToSave = {
            id: item.id,
            name: item.name,
            desc: item.desc,
            icon: item.icon,
            color: item.color,
            cat: item.cat || 'general',
            price: item.price,
            equipped: false,
            purchasedAt: new Date()
        };

        await users.updateOne(
            { user: user },
            {
                $set: { coins: newBalance },
                $push: { inventory: itemToSave }
            }
        );

        res.json({ success: true, newBalance, item: itemToSave });
    } catch (error) {
        res.status(500).json({ message: "Error en la transacción estelar." });
    }
});

app.get('/api/users/:username/inventory', async (req, res) => {
    const username = req.params.username;
    try {
        const { users } = getCollections();
        const userDoc = await users.findOne({ user: username }, { projection: { inventory: 1 } });

        if (!userDoc) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json({ inventory: userDoc.inventory || [] });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el inventario." });
    }
});

app.post('/api/inventory/toggle-equip', async (req, res) => {
    const { user, itemId } = req.body;
    try {
        const { users } = getCollections();
        const userDoc = await users.findOne({ user: user });

        if (!userDoc) return res.status(404).json({ message: "Usuario no encontrado" });

        const itemTarget = userDoc.inventory.find(i => i.id === itemId);
        if (!itemTarget) return res.status(404).json({ message: "Item no encontrado en inventario" });

        const isEquipping = !itemTarget.equipped;

        const updatedInventory = userDoc.inventory.map(item => {
            if (item.id === itemId) {
                return { ...item, equipped: isEquipping };
            }
            if (isEquipping && item.cat === itemTarget.cat && item.equipped) {
                return { ...item, equipped: false };
            }
            return item;
        });

        await users.updateOne({ user: user }, { $set: { inventory: updatedInventory } });

        res.json({ success: true, inventory: updatedInventory });
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