require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator'); // Para validar emails

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

// --- LÓGICA DE USUARIOS ---

// --- REGISTRO MEJORADO ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Validaciones básicas
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Formato de correo inválido." });
    }

    try {
        const db = getDB();
        // 2. Verificar si el usuario O el correo ya existen
        const existingUser = await db.collection('users').findOne({ 
            $or: [{ user: username }, { email: email }] 
        });

        if (existingUser) {
            return res.status(409).json({ message: "El ID o el Correo ya están en uso." });
        }

        // 3. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            user: username,
            email: email.toLowerCase(),
            pass: hashedPassword,
            rank: "Cadete de Vuelo",
            plan: "INDIVIDUAL_FREE",
            coins: 1000,
            inventory: [],
            createdAt: new Date()
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: "Tripulante registrado en la base de datos." });
    } catch (error) {
        res.status(500).json({ message: "Error crítico en motores de registro." });
    }
});

// --- LOGIN MEJORADO (Email o Username) ---
app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body; // 'identifier' puede ser email o user

    try {
        const db = getDB();
        // Buscar por nombre de usuario O por correo
        const user = await db.collection('users').findOne({
            $or: [{ user: identifier }, { email: identifier }]
        });

        if (!user) {
            return res.status(401).json({ message: "Credenciales no reconocidas por el radar." });
        }

        // Comparar contraseñas encriptadas
        const match = await bcrypt.compare(password, user.pass);
        if (!match) {
            return res.status(401).json({ message: "Código de acceso incorrecto." });
        }

        // Generar JWT Real
        const token = jwt.sign(
            { userId: user._id, username: user.user }, 
            process.env.JWT_SECRET || 'SUPER_SECRET_ASTRO_KEY', 
            { expiresIn: '24h' }
        );

        res.json({
            status: "Sincronización completada",
            token,
            profile: {
                name: user.user,
                email: user.email,
                plan: user.plan,
                rank: user.rank,
                coins: user.coins || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Fallo de conexión con el núcleo." });
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