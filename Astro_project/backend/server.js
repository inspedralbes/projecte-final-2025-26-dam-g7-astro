const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Lógica de conexión para ASTRO
wss.on('connection', (ws) => {
    console.log('Nuevo tripulante conectado vía WebSocket puro.');

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        // Ejemplo: Recibir datos de precisión del minijuego 
        if (message.type === 'TRACKING_DATA') {
            console.log('Sincronización de movimiento ocular recibida');
        }
    });

    ws.send(JSON.stringify({ msg: "Trayectoria corregida: Conexión establecida" })); // Feedback estilo ASTRO [cite: 15]
});

server.listen(3000, () => {
    console.log('Servidor de Misión ASTRO en puerto 3000');
});