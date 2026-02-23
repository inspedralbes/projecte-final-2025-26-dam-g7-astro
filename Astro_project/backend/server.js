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
        { projection: { user: 1, coins: 1, inventory: 1, rank: 1, plan: 1 } }
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

    if (!user || !game) {
        return res.status(400).json({ message: "Usuario y juego son requeridos." });
    }

    try {
        const { users, partides } = getCollections();
        const currentUser = await users.findOne({ user });
        if (!currentUser) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const parsedScore = Number.parseInt(score, 10);
        const normalizedScore = Number.isNaN(parsedScore) ? 0 : Math.max(0, parsedScore);
        const coinsEarned = Math.floor(normalizedScore / 10);
        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        const newBalance = currentCoins + coinsEarned;

        await Promise.all([
            partides.insertOne({
                user,
                game,
                score: normalizedScore,
                coinsEarned,
                createdAt: new Date()
            }),
            users.updateOne({ user }, { $set: { coins: newBalance } })
        ]);

        const gamesPlayed = await partides.countDocuments({ user });

        res.json({
            success: true,
            message: "Partida registrada correctamente.",
            coinsEarned,
            newBalance,
            gamesPlayed
        });
    } catch (error) {
        console.error("Error registrando partida:", error);
        res.status(500).json({ message: "No se pudo registrar la partida." });
    }
});

// --- LÓGICA DE USUARIOS ---

// Endpoint de Registro (Ajustado a astroStore)
app.post('/api/auth/register', async (req, res) => {
    const { username, password, rank } = req.body; // Recibe lo que envía el Store

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
            inventory: [],
            createdAt: new Date()
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: "Reclutamiento completado exitosamente." });
    } catch (error) {
        res.status(500).json({ message: "Error en el sistema de registro." });
    }
});

// Endpoint de Login (Sincronizado con astroStore)
app.post('/api/auth/login', async (req, res) => {
    // El store envía credentials.username o credentials.user
    const username = req.body.username || req.body.user;
    const password = req.body.password || req.body.pass;

    try {
        const db = getDB();
        const foundUser = await db.collection('users').findOne({ user: username, pass: password });

        if (foundUser) {
            const userStats = await getUserStats(foundUser.user);

            console.log(`🚀 Sesión iniciada: ${foundUser.user}`);
            res.json({
                status: "Sincronización completada",
                token: "session_token_" + Math.random().toString(36).substr(2),
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan || "INDIVIDUAL_FREE",
                    rank: foundUser.rank || "Cadete de Vuelo",
                    coins: foundUser.coins !== undefined ? foundUser.coins : 1000,
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

        // Lógica de probabilidad
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
            updateData.$push = { inventory: prize.label };
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

// --- ENDPOINT DE COMPRA ---
app.post('/api/shop/purchase', async (req, res) => {
    const { user, itemId, price } = req.body;
    console.log(`💰 Compra intentada por ${user}: Item ${itemId} por ${price} coins`);

    if (!user || !itemId || price === undefined) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    try {
        const { users: usersCol } = getCollections();
        const currentUser = await usersCol.findOne({ user });

        if (!currentUser) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        if (currentCoins < price) {
            return res.status(402).json({ success: false, message: "Saldo insuficiente" });
        }

        const newBalance = currentCoins - price;
        await usersCol.updateOne(
            { user },
            {
                $set: { coins: newBalance },
                $push: { inventory: { id: itemId, purchasedAt: new Date() } }
            }
        );

        res.json({ success: true, newBalance });
    } catch (error) {
        console.error("Error en compra:", error);
        res.status(500).json({ message: "Error procesando la compra" });
    }
});

// --- ENDPOINT DE EQUIPAR ---
app.post('/api/user/equip', async (req, res) => {
    const { user, itemId, category } = req.body;
    console.log(`🛡️ Equipando para ${user}: ${category} -> ${itemId}`);

    if (!user || itemId === undefined || !category) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    try {
        const { users: usersCol } = getCollections();

        // Estructura de equipo en el documento: equipped: { skins: id, pets: id, trails: id }
        const updateKey = `equipped.${category}`;
        await usersCol.updateOne(
            { user },
            { $set: { [updateKey]: itemId } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error al equipar:", error);
        res.status(500).json({ message: "Error al actualizar equipo" });
    }
});

// --- ENDPOINTS DE PERFIL (Avatar y Mascota) ---
app.put('/api/user/avatar', async (req, res) => {
    const { user, avatar } = req.body;
    if (!user || !avatar) return res.status(400).json({ message: "Faltan datos" });

    try {
        const { users: usersCol } = getCollections();
        await usersCol.updateOne({ user }, { $set: { avatar } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar avatar" });
    }
});

app.put('/api/user/mascot', async (req, res) => {
    const { user, mascot } = req.body;
    if (!user) return res.status(400).json({ message: "Usuario requerido" });

    try {
        const { users: usersCol } = getCollections();
        await usersCol.updateOne({ user }, { $set: { mascot } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar mascota" });
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
connectDB().then(() => {
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`🚀 SERVIDOR ASTRO EN PUERTO ${PORT}`);
    });
});
