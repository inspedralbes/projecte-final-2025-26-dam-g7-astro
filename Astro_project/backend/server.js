require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db'); // Importem la lògica de la BD

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- DADES INICIALS (LLAVOR) ---
// Aquests usuaris s'inseriran a Atlas si la base de dades està buida
const initialUsers = [
    { id: 1, user: "JOEL", pass: "123", plan: "INDIVIDUAL", rank: "Cadete de Vuelo" },
    { id: 2, user: "Escuela_Astro", pass: "admin", plan: "GRUPAL", students: ["BIEL", "ANTONIO"] }
];

// --- FUNCIÓ PER GENERAR USUARIS ---
async function initializeUsers() {
    try {
        const db = getDB();
        const collection = db.collection('users');

        // Mirem si ja hi ha usuaris
        const count = await collection.countDocuments();

        if (count === 0) {
            console.log('⚠️ Base de dades buida. Generant tripulació inicial...');
            await collection.insertMany(initialUsers);
            console.log('✅ Usuaris (JOEL, Escuela_Astro) inserits a MongoDB Atlas correctament.');
        } else {
            console.log('ℹ️ La base de dades ja conté tripulació. No cal generar dades.');
        }
    } catch (error) {
        console.error('❌ Error generant usuaris inicials:', error);
    }
}

// --- ENDPOINT DE LOGIN (Connectat a Atlas) ---
app.post('/api/auth/login', async (req, res) => {
    const { user, password } = req.body;
    
    try {
        const db = getDB();
        // Busquem a la base de dades real
        const foundUser = await db.collection('users').findOne({ user: user, pass: password });

        if (foundUser) {
            res.json({
                status: "Sincronización completada",
                token: "session_token_xyz",
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan,
                    rank: foundUser.rank || "Administrador",
                    canAccessTelemetry: foundUser.plan === "GRUPAL"
                }
            });
        } else {
            res.status(401).json({ status: "Trayectoria fallida", message: "Credenciales no reconocidas" });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error intern del servidor" });
    }
});

app.post('/api/auth/register', async (req, res) => {
    // Rebem les dades del formulari Vue
    // Nota: mapegem 'username' a 'user' i 'password' a 'pass' per coincidir amb el teu esquema
    const { username, password, rank } = req.body;

    try {
        const db = getDB();
        const collection = db.collection('users');

        // 1. Comprovar si l'usuari ja existeix
        const existingUser = await collection.findOne({ user: username });
        if (existingUser) {
            return res.status(409).json({ message: "Aquest ID de tripulant ja està assignat." });
        }

        // 2. Crear el nou objecte usuari
        const newUser = {
            user: username,
            pass: password, // AVIS: En producció fes servir bcrypt per encriptar!
            rank: rank || "Cadete de Vuelo",
            plan: "INDIVIDUAL", // Per defecte
            createdAt: new Date()
        };

        // 3. Inserir a MongoDB
        await collection.insertOne(newUser);

        console.log(`Nou recluta registrat: ${username}`);
        res.status(201).json({ message: "Reclutament acceptat. Benvingut a bord." });

    } catch (error) {
        console.error("Error en registre:", error);
        res.status(500).json({ message: "Error en el sistema de reclutament." });
    }
});

// --- LÓGICA DE WEBSOCKET ---
wss.on('connection', (ws) => {
    console.log('Nuevo tripulante conectado vía WebSocket puro.');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'UPDATE_SCORE') {
                console.log(`Puntuación de ${message.user}: ${message.pts} pts`);
            }

            if (message.type === 'TRACKING_DATA') {
                console.log('Sincronización de movimiento ocular recibida');
            }
        } catch (e) {
            console.error("Error en la transmisión de datos");
        }
    });

    ws.send(JSON.stringify({ msg: "Trayectoria corregida: Conexión establecida" }));
});

// --- INICI DEL SERVIDOR ---
// 1. Connectar BD -> 2. Generar Usuaris -> 3. Aixecar Port
connectDB().then(async () => {
    
    // Generem els usuaris si no existeixen
    await initializeUsers();

    server.listen(3000, () => {
        console.log('🚀 Servidor de Misión ASTRO operando en puerto 3000');
    });

}).catch(err => {
    console.error('Error crític iniciant la missió:', err);
});