function registerWsHandlers(wss) {
    wss.on('connection', (ws) => {
        console.log('📡 Nueva conexión WS establecida');
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'IDENTIFY') {
                    console.log(`👤 Usuario identificado en WS: ${msg.user}`);
                }
            } catch (e) {
                // Ignoramos mensajes mal formados para no cerrar la conexión.
            }
        });
    });
}

module.exports = {
    registerWsHandlers
};
