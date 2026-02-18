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
            plan: "INDIVIDUAL",
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
            console.log(`🚀 Sesión iniciada: ${foundUser.user}`);
            res.json({
                status: "Sincronización completada",
                token: "session_token_" + Math.random().toString(36).substr(2),
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan || "INDIVIDUAL",
                    rank: foundUser.rank || "Cadete de Vuelo",
                    coins: foundUser.coins !== undefined ? foundUser.coins : 1000
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
        const db = getDB();
        const usersCol = db.collection('users');
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

// --- WEBSOCKETS ---
wss.on('connection', (ws) => {
    console.log("📡 Nueva conexión WS establecida");
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'IDENTIFY') console.log(`👤 Usuario identificado en WS: ${msg.user}`);
        } catch (e) {}
    });
});

// --- ARRANQUE ---
connectDB().then(() => {
    const PORT = 3000; 
    server.listen(PORT, () => {
        console.log(`🚀 SERVIDOR ASTRO EN PUERTO ${PORT}`);
    });
});