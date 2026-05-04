const roomManager = require('./RoomManager');
const chatService = require('../services/chatService');

/**
 * Registra todos los handlers del WebSocket.
 * @param {import('ws').WebSocketServer} wss
 * @param {() => import('mongodb').Db} getDB  Getter lazy de la base de datos
 */
function registerWsHandlers(wss, getDB) {
    wss.on('connection', (ws) => {
        let currentUser = null;
        console.log('Nueva conexión WS establecida');

        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());

                switch (msg.type) {
                    case 'IDENTIFY':
                        currentUser = msg.user;
                        roomManager.addSession(currentUser, ws);
                        console.log(`Usuario identificado en WS: ${currentUser}`);
                        // Enviar lista de salas disponibles de inmediato
                        await roomManager.syncGlobalRooms();

                        // Enviar conteo de mensajes no leídos al conectar
                        try {
                            const db = getDB();
                            const unread = await chatService.getUnreadByConversation(db, currentUser);
                            ws.send(JSON.stringify({ type: 'CHAT_UNREAD_COUNTS', counts: unread }));
                        } catch (_) { /* DB puede no estar lista en tests */ }
                        break;

                    case 'INVITE':
                        // { type: 'INVITE', from: 'UserA', to: 'UserB', roomId: 'XYZ' }
                        console.log(`Invitación de ${msg.from} para ${msg.to}`);
                        roomManager.sendToUser(msg.to, {
                            type: 'INVITATION_RECEIVED',
                            from: msg.from,
                            roomId: msg.roomId
                        });
                        break;

                    case 'CREATE_ROOM':
                        // { type: 'CREATE_ROOM', user: 'UserA', isPublic: true/false, maxPlayers: 8, gameConfig: {...} }
                        const roomId = await roomManager.createRoom(msg.user, msg.isPublic, msg.maxPlayers, msg.gameConfig);
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

                    case 'PLAYER_RETURN_TO_LOBBY':
                        // { type: 'PLAYER_RETURN_TO_LOBBY', roomId, user }
                        await roomManager.handlePlayerReturnToLobby(msg.roomId, msg.user);
                        break;

                    // ──────────────────────────────────────────────────────────
                    // CHAT EN TIEMPO REAL
                    // ──────────────────────────────────────────────────────────

                    case 'CHAT_SEND': {
                        // { type: 'CHAT_SEND', from: 'UserA', to: 'UserB', content: 'Hola!' }
                        if (!msg.from || !msg.to || !msg.content?.trim()) break;

                        // Seguridad: el emisor debe ser el usuario identificado
                        if (msg.from !== currentUser) {
                            ws.send(JSON.stringify({ type: 'ERROR', message: 'Sender mismatch' }));
                            break;
                        }

                        const db = getDB();
                        const saved = await chatService.saveMessage(db, {
                            from: msg.from,
                            to: msg.to,
                            content: msg.content.trim()
                        });

                        const chatMsg = {
                            type: 'CHAT_MESSAGE',
                            from: msg.from,
                            to: msg.to,
                            content: saved.content,
                            at: saved.at.toISOString()
                        };

                        // Entregar al destinatario si está conectado
                        roomManager.sendToUser(msg.to, chatMsg);

                        // Confirmar al emisor (para actualizar su UI)
                        ws.send(JSON.stringify(chatMsg));

                        console.log(`Mensaje de ${msg.from} → ${msg.to}`);
                        break;
                    }

                    case 'CHAT_FETCH_HISTORY': {
                        // { type: 'CHAT_FETCH_HISTORY', userA: 'yo', userB: 'amigo' }
                        if (!msg.userA || !msg.userB) break;

                        const dbH = getDB();
                        const history = await chatService.getHistory(dbH, msg.userA, msg.userB);

                        // Marcar como leídos los mensajes que el amigo envió a este usuario
                        await chatService.markAsRead(dbH, msg.userB, msg.userA);

                        ws.send(JSON.stringify({
                            type: 'CHAT_HISTORY',
                            with: msg.userB,
                            messages: history.map(m => ({
                                from: m.from,
                                to: m.to,
                                content: m.content,
                                at: m.at.toISOString(),
                                read: m.read
                            }))
                        }));
                        break;
                    }
                }
            } catch (e) {
                console.error('Error procesando mensaje WS:', e);
            }
        });

        ws.on('close', () => {
            if (currentUser) {
                roomManager.removeSession(currentUser);
            }
            console.log('Conexión WS cerrada');
        });
    });
}

module.exports = {
    registerWsHandlers
};
