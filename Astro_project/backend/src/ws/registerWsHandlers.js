const roomManager = require('./RoomManager');

function registerWsHandlers(wss) {
    wss.on('connection', (ws) => {
        let currentUser = null;
        console.log('📡 Nueva conexión WS establecida');

        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());

                switch (msg.type) {
                    case 'IDENTIFY':
                        currentUser = msg.user;
                        roomManager.addSession(currentUser, ws);
                        console.log(`👤 Usuario identificado en WS: ${currentUser}`);
                        // Enviar lista de salas disponibles de inmediato
                        await roomManager.syncGlobalRooms();
                        break;

                    case 'INVITE':
                        // { type: 'INVITE', from: 'UserA', to: 'UserB', roomId: 'XYZ' }
                        console.log(`✉️ Invitación de ${msg.from} para ${msg.to}`);
                        roomManager.sendToUser(msg.to, {
                            type: 'INVITATION_RECEIVED',
                            from: msg.from,
                            roomId: msg.roomId
                        });
                        break;

                    case 'CREATE_ROOM':
                        // { type: 'CREATE_ROOM', user: 'UserA', isPublic: true/false, maxPlayers: 8 }
                        const roomId = await roomManager.createRoom(msg.user, msg.isPublic, msg.maxPlayers);
                        ws.send(JSON.stringify({
                            type: 'ROOM_CREATED',
                            roomId
                        }));
                        break;

                    case 'JOIN_ROOM':
                        // { type: 'JOIN_ROOM', roomId: 'XYZ', user: 'UserB' }
                        const result = await roomManager.joinRoom(msg.roomId, msg.user);
                        if (result.error) {
                            ws.send(JSON.stringify({ type: 'ERROR', message: result.error }));
                        } else {
                            ws.send(JSON.stringify({
                                type: 'JOIN_SUCCESS',
                                room: roomManager.getRoom(msg.roomId)
                            }));
                        }
                        break;

                    case 'LEAVE_ROOM':
                        await roomManager.leaveRoom(msg.roomId, msg.user);
                        break;

                    case 'UPDATE_GAME_CONFIG':
                        // { type: 'UPDATE_GAME_CONFIG', roomId, config: { pointsToWin: 3 } }
                        await roomManager.updateGameConfig(msg.roomId, msg.config);
                        break;

                    case 'START_MATCH':
                        // { type: 'START_MATCH', roomId }
                        const startResult = await roomManager.startMatch(msg.roomId);
                        if (startResult.error) {
                            ws.send(JSON.stringify({ type: 'ERROR', message: startResult.error }));
                        }
                        break;

                    case 'SET_ROOM_STATUS':
                        // Cambio manual de estado (ej: de ROULETTE a PLAYING)
                        await roomManager.setRoomStatus(msg.roomId, msg.status);
                        break;

                    case 'SUBMIT_ROUND_RESULT':
                        // { type: 'SUBMIT_ROUND_RESULT', roomId, user }
                        await roomManager.handlePlayerFinished(msg.roomId, msg.user);
                        break;

                    case 'GAME_ACTION':
                        // { type: 'GAME_ACTION', roomId, user, action }
                        roomManager.handleGameAction(msg.roomId, msg.user, msg.action);
                        break;
                }
            } catch (e) {
                console.error('❌ Error procesando mensaje WS:', e);
            }
        });

        ws.on('close', () => {
            if (currentUser) {
                roomManager.removeSession(currentUser);
            }
            console.log('📡 Conexión WS cerrada');
        });
    });
}

module.exports = {
    registerWsHandlers
};
