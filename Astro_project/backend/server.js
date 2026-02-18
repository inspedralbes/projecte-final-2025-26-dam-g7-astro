require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- CONFIGURACIÓN DE PREMIOS ---
const WHEEL_ITEMS = [
    { id: 0, label: 'Vida Extra', icon: 'mdi-heart', color: '#FF5252', weight: 20 },
    { id: 1, label: 'Pin Raro', icon: 'mdi-decagram', color: '#9C27B0', weight: 5 },
    { id: 2, label: 'Avatar Ninja', icon: 'mdi-ninja', color: '#2196F3', weight: 5 },
    { id: 3, label: 'Monedas', icon: 'mdi-currency-usd', color: '#FFC107', weight: 30 },
    { id: 4, label: 'Nada', icon: 'mdi-emoticon-sad', color: '#795548', weight: 40 },
    { id: 5, label: 'Escudo', icon: 'mdi-shield', color: '#607D8B', weight: 0 } 
];

// --- DATOS INICIALES ---
const initialUsers = [
    { id: 1, user: "JOEL", pass: "123", plan: "INDIVIDUAL", rank: "Cadete de Vuelo", coins: 1000 },
    { id: 2, user: "Escuela_Astro", pass: "admin", plan: "GRUPAL", rank: "Comandante", students: ["BIEL", "ANTONIO"], coins: 1000 }
];

async function initializeUsers() {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const count = await collection.countDocuments();
        if (count === 0) {
            console.log('⚠️ Base de dades buida. Generant tripulació inicial...');
            await collection.insertMany(initialUsers);
            console.log('✅ Usuaris inicials listos.');
        }
    } catch (error) {
        console.error('❌ Error inicializando:', error);
    }
}

// --- ENDPOINT DE LOGIN (MODIFICADO PARA NAME) ---
app.post('/api/auth/login', async (req, res) => {
    const { user, password } = req.body;
    try {
        const db = getDB();
        const foundUser = await db.collection('users').findOne({ user: user, pass: password });
        
        if (foundUser) {
            console.log(`🚀 Sesión iniciada: ${foundUser.user}`);
            res.json({
                status: "Sincronización completada",
                token: "session_token_xyz",
                profile: {
                    name: foundUser.user, // <--- ESTO es lo que lee tu Store (data.profile.name)
                    plan: foundUser.plan || "INDIVIDUAL",
                    rank: foundUser.rank || "Cadete de Vuelo",
                    coins: foundUser.coins !== undefined ? foundUser.coins : 1000
                }
            });
        } else {
            res.status(401).json({ status: "Trayectoria fallida", message: "Credenciales no reconocidas" });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error interno" });
    }
});

// --- ENDPOINT DE REGISTRO ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password, rank } = req.body;
    try {
        const db = getDB();
        const collection = db.collection('users');
        const existingUser = await collection.findOne({ user: username });
        
        if (existingUser) return res.status(409).json({ message: "ID de tripulante ya en uso." });

        const newUser = {
            user: username,
            pass: password,
            rank: rank || "Cadete de Vuelo",
            plan: "INDIVIDUAL",
            createdAt: new Date(),
            coins: 1000,
            inventory: []
        };
        
        await collection.insertOne(newUser);
        res.status(201).json({ message: "Reclutamiento completado exitosamente." });
    } catch (error) {
        res.status(500).json({ message: "Error en el sistema de registro." });
    }
});

// --- ENDPOINT DE LA RULETA ---
app.post('/api/shop/spin', async (req, res) => {
    const { user } = req.body; 
    if (!user) return res.status(400).json({ success: false, message: "Usuario no identificado" });

    try {
        const db = getDB();
        const usersCol = db.collection('users');
        const currentUser = await usersCol.findOne({ user: user });

        if (!currentUser) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        const SPIN_COST = 50;

        if (currentCoins < SPIN_COST) {
            return res.status(402).json({ success: false, message: "Saldo insuficiente" });
        }

        const itemsDisponibles = WHEEL_ITEMS.filter(i => i.weight > 0);
        const totalWeight = itemsDisponibles.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedItem = itemsDisponibles[0]; 

        for (const item of itemsDisponibles) {
            if (random < item.weight) {
                selectedItem = item;
                break;
            }
            random -= item.weight;
        }

        let updateQuery = { $inc: { coins: -SPIN_COST } };
        if (selectedItem.label === 'Monedas') {
            updateQuery.$inc.coins += 100; 
        } else if (selectedItem.label !== 'Nada') {
            updateQuery.$push = { inventory: selectedItem.label };
        }

        await usersCol.updateOne({ user: user }, updateQuery);
        const newBalance = currentCoins - SPIN_COST + (selectedItem.label === 'Monedas' ? 100 : 0);

        res.json({
            success: true,
            prize: { id: selectedItem.id, label: selectedItem.label, icon: selectedItem.icon },
            newBalance: newBalance
        });

    } catch (error) {
        res.status(500).json({ message: "Error en la ruleta" });
    }
});

// --- WEBSOCKETS ---
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.type === 'UPDATE_SCORE') console.log(`Puntos: ${message.pts}`);
        } catch (e) {}
    });
    ws.send(JSON.stringify({ msg: "Sincronización de red activa" }));
});

// --- ARRANQUE ---
connectDB().then(async () => {
    await initializeUsers();
    const PORT = 3000; 
    server.listen(PORT, () => {
        console.log(`🚀 SERVIDOR ASTRO EN PUERTO ${PORT}`);
    });
}).catch(err => {
    console.error('Error crítico:', err);
});