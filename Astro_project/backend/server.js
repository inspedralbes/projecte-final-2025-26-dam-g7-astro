require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db');

const app = express();

// IMPORTANTE: Permitimos peticiones desde cualquier origen (incluido tu front en 3001)
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- CONFIGURACIÓN DE PREMIOS (Debe coincidir con Frontend) ---
const WHEEL_ITEMS = [
    { id: 0, label: 'Vida Extra', icon: 'mdi-heart', color: '#FF5252', weight: 20 },
    { id: 1, label: 'Pin Raro', icon: 'mdi-decagram', color: '#9C27B0', weight: 5 },
    { id: 2, label: 'Avatar Ninja', icon: 'mdi-ninja', color: '#2196F3', weight: 5 },
    { id: 3, label: 'Monedas', icon: 'mdi-currency-usd', color: '#FFC107', weight: 30 },
    { id: 4, label: 'Nada', icon: 'mdi-emoticon-sad', color: '#795548', weight: 40 },
    { id: 5, label: 'Escudo', icon: 'mdi-shield', color: '#607D8B', weight: 0 }
];

// --- DATOS INICIALES (Tu lógica original) ---
const initialUsers = [
    { id: 1, user: "JOEL", pass: "123", plan: "INDIVIDUAL", rank: "Cadete de Vuelo" },
    { id: 2, user: "Escuela_Astro", pass: "admin", plan: "GRUPAL", students: ["BIEL", "ANTONIO"] }
];

async function initializeUsers() {
    try {
        const db = getDB();
        const collection = db.collection('users');
        const count = await collection.countDocuments();
        if (count === 0) {
            console.log('⚠️ Base de dades buida. Generant tripulació inicial...');
            await collection.insertMany(initialUsers);
            console.log('✅ Usuaris inserits correctament.');
        }
    } catch (error) {
        console.error('❌ Error generant usuaris inicials:', error);
    }
}

// --- ENDPOINT DE LA RULETA (NUEVO) ---
app.post('/api/shop/spin', async (req, res) => {
    const { user } = req.body;
    console.log(`🎰 Intento de giro recibido para: ${user}`);

    if (!user) return res.status(400).json({ success: false, message: "Usuario no identificado" });

    try {
        const db = getDB();
        const usersCol = db.collection('users');

        // 1. Verificar usuario y saldo
        const currentUser = await usersCol.findOne({ user: user });
        if (!currentUser) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const currentCoins = currentUser.coins !== undefined ? currentUser.coins : 1000;
        const SPIN_COST = 50;

        if (currentCoins < SPIN_COST) {
            return res.status(402).json({ success: false, message: "Saldo insuficiente" });
        }

        // 2. Sorteo Ponderado
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

        // 3. Transacción en BD
        let updateQuery = { $inc: { coins: -SPIN_COST } };

        if (selectedItem.label === 'Monedas') {
            updateQuery.$inc.coins += 100; // Recupera los 50 y gana 50 más
        } else if (selectedItem.label !== 'Nada') {
            updateQuery.$push = { inventory: selectedItem.label };
        }

        await usersCol.updateOne({ user: user }, updateQuery);

        // 4. Calcular nuevo saldo para actualizar frontend al instante
        const newBalance = currentCoins - SPIN_COST + (selectedItem.label === 'Monedas' ? 100 : 0);
        console.log(`✅ ${user} ganó: ${selectedItem.label}. Nuevo saldo: ${newBalance}`);

        res.json({
            success: true,
            prize: { id: selectedItem.id, label: selectedItem.label, icon: selectedItem.icon },
            newBalance: newBalance
        });

    } catch (error) {
        console.error("Error crítico en la ruleta:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// --- ENDPOINT DE LOGROS (NUEVO) ---
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

// --- RUTAS DE AUTH (Tus originales) ---
app.post('/api/auth/login', async (req, res) => {
    const { user, password } = req.body;
    try {
        const db = getDB();
        const foundUser = await db.collection('users').findOne({ user: user, pass: password });
        if (foundUser) {
            res.json({
                status: "Sincronización completada",
                token: "session_token_xyz",
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan,
                    rank: foundUser.rank || "Administrador",
                    coins: foundUser.coins !== undefined ? foundUser.coins : 1000,
                    selectedAchievements: foundUser.selectedAchievements || []
                }
            });
        } else {
            res.status(401).json({ status: "Trayectoria fallida", message: "Credenciales no reconocidas" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error interno" });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, rank } = req.body;
    try {
        const db = getDB();
        const collection = db.collection('users');
        const existingUser = await collection.findOne({ user: username });
        if (existingUser) return res.status(409).json({ message: "Usuario existente." });

        const newUser = {
            user: username,
            pass: password,
            rank: rank || "Cadete de Vuelo",
            plan: "INDIVIDUAL",
            createdAt: new Date(),
            coins: 1000, // Bonus de bienvenida
            inventory: []
        };
        await collection.insertOne(newUser);
        res.status(201).json({ message: "Registro completado." });
    } catch (error) {
        res.status(500).json({ message: "Error de registro." });
    }
});

// --- WEBSOCKETS ---
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.type === 'UPDATE_SCORE') console.log(`Score: ${message.pts}`);
        } catch (e) { }
    });
    ws.send(JSON.stringify({ msg: "Conectado" }));
});

// --- ARRANQUE ---
connectDB().then(async () => {
    await initializeUsers();

    // AQUÍ ESTÁ LA CLAVE: EL PUERTO 3000 ES TUYO
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`------------------------------------------------`);
        console.log(`🚀 SERVIDOR OPERATIVO EN EL PUERTO ${PORT}`);
        console.log(`📡 Endpoint de tienda: http://localhost:${PORT}/api/shop/spin`);
        console.log(`------------------------------------------------`);
    });
}).catch(err => {
    console.error('Error crítico:', err);
});