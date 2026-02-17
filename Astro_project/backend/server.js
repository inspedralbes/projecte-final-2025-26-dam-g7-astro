const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Necesario para leer JSON en el cuerpo de las peticiones

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- BASE DE DATOS SIMULADA ---
// Aquí es donde diferenciarás los roles y planes definidos en tu esquema [cite: 54, 56]
const users = [
    { id: 1, user: "JOEL", pass: "123", plan: "INDIVIDUAL", rank: "Cadete de Vuelo" }, // [cite: 20, 60]
    { id: 2, user: "Escuela_Astro", pass: "admin", plan: "GRUPAL", students: ["BIEL", "ANTONIO"] } // [cite: 28, 62]
];

// --- ENDPOINT DE LOGIN (HTTP) ---
app.post('/api/auth/login', (req, res) => {
    const { user, password } = req.body; // Captura de datos del esquema de pantalla [cite: 58, 59]
    
    const foundUser = users.find(u => u.user === user && u.pass === password);

    if (foundUser) {
        // Respuesta con la estética Neo-Espacial de ASTRO [cite: 13, 15]
        res.json({
            status: "Sincronización completada",
            token: "session_token_xyz",
            profile: {
                name: foundUser.user,
                plan: foundUser.plan,
                rank: foundUser.rank || "Administrador",
                // Si es grupal, enviamos acceso a telemetría avanzada 
                canAccessTelemetry: foundUser.plan === "GRUPAL"
            }
        });
    } else {
        res.status(401).json({ status: "Trayectoria fallida", message: "Credenciales no reconocidas" });
    }
});

// --- LÓGICA DE WEBSOCKET ---
wss.on('connection', (ws) => {
    console.log('Nuevo tripulante conectado vía WebSocket puro.');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            // Lógica para el Modo Multijugador (Ranking en tiempo real) [cite: 43, 86]
            if (message.type === 'UPDATE_SCORE') {
                console.log(`Puntuación de ${message.user}: ${message.pts} pts`);
                // Aquí retransmitirías a los demás tripulantes de la sala
            }

            // Datos de precisión del minijuego para telemetría [cite: 32, 29]
            if (message.type === 'TRACKING_DATA') {
                console.log('Sincronización de movimiento ocular recibida');
            }
        } catch (e) {
            console.error("Error en la transmisión de datos");
        }
    });

    ws.send(JSON.stringify({ msg: "Trayectoria corregida: Conexión establecida" }));
});

server.listen(3000, () => {
    console.log('Servidor de Misión ASTRO operando en puerto 3000');
});