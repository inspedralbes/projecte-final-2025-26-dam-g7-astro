require('dotenv').config(); // Assegura't de carregar les variables d'entorn al principi
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { connectDB, getDB } = require('./db'); // <--- IMPORTACIÓ DEL TEU MÒDUL DB

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- ENDPOINT DE LOGIN (HTTP) ---
app.post('/api/auth/login', async (req, res) => { // <--- Ara la funció és ASYNC
    const { user, password } = req.body;

    try {
        // Obtenim la instància de la BD
        const db = getDB();
        const collection = db.collection('users'); // Suposant que la col·lecció es diu 'users'

        // Busquem l'usuari a MongoDB Atlas
        // Nota: En producció, mai guardis contrasenyes en text pla (usa bcrypt)
        const foundUser = await collection.findOne({ user: user, pass: password });

        if (foundUser) {
            // Resposta amb la estética Neo-Espacial de ASTRO
            res.json({
                status: "Sincronización completada",
                token: "session_token_xyz", // Aquí podries generar un JWT real
                profile: {
                    name: foundUser.user,
                    plan: foundUser.plan,
                    rank: foundUser.rank || "Administrador",
                    // Si és grupal, enviem accés a telemetria avançada
                    canAccessTelemetry: foundUser.plan === "GRUPAL"
                }
            });
        } else {
            res.status(401).json({ status: "Trayectoria fallida", message: "Credenciales no reconocidas" });
        }
    } catch (error) {
        console.error("Error en la base de dades:", error);
        res.status(500).json({ status: "Error del sistema", message: "Error intern del servidor" });
    }
});

// --- LÓGICA DE WEBSOCKET ---
wss.on('connection', (ws) => {
    console.log('Nuevo tripulante conectado vía WebSocket puro.');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            // Lógica para el Modo Multijugador
            if (message.type === 'UPDATE_SCORE') {
                console.log(`Puntuación de ${message.user}: ${message.pts} pts`);
                // Aquí podries guardar la puntuació a la BD també si volguessis:
                // const db = getDB();
                // db.collection('scores').insertOne({ user: message.user, score: message.pts, date: new Date() });
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

// --- ARRENCAR SERVIDOR ---
connectDB().then(() => {
    server.listen(3000, () => {
        console.log('🚀 Servidor de Misión ASTRO operando en puerto 3000 i connectat a Atlas');
    });
}).catch(err => {
    console.error('❌ Error crític: No s\'ha pogut connectar a Atlas. Tancant missió.', err);
});