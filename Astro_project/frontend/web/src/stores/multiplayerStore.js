import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import { buildWebSocketBaseUrl, requestJson } from './astroShared';

export const useMultiplayerStore = defineStore('multiplayer', {
    state: () => ({
        socket: null,
        isConnected: false,
        room: null,
        availableRooms: [],
        invitations: [],
        error: null,
        lastMessage: null,
        roundScores: {}, // Puntuaciones de la ronda actual en vivo
        returnedPlayers: [], // Jugadores que han pulsado "Volver al lobby"
        remoteCursors: {}, // Coordenadas de ratón de otros jugadores: { username: { x, y } }
        activeEffects: {} // Efectos activos para el jugador local: { effectId: { type, duration, startTime } }
    }),

    actions: {
        getSession() {
            return useSessionStore();
        },

        async fetchAvailableRooms() {
            try {
                const { response, data } = await requestJson('/api/multiplayer/rooms');
                if (response.ok) {
                    this.availableRooms = data;
                }
            } catch (error) {
                console.error('❌ Error cargando salas:', error);
            }
        },

        connect() {
            const sessionStore = this.getSession();
            if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
            this.error = null;

            const wsUrl = buildWebSocketBaseUrl();
            const ws = new WebSocket(wsUrl);
            console.log(`🔌 Intentando conexión WS: ${wsUrl}`);

            ws.onopen = () => {
                this.isConnected = true;
                this.socket = ws;
                console.log('🚀 Conexión Multijugador establecida');

                ws.send(JSON.stringify({
                    type: 'IDENTIFY',
                    user: sessionStore.user,
                    token: sessionStore.token
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`📩 Mensaje WS recibido: ${data.type}`, data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Error procesando mensaje:', e);
                }
            };

            ws.onclose = () => {
                this.isConnected = false;
                this.socket = null;
                this.room = null;
                console.warn('⚠️ Conexión Multijugador cerrada');
            };

            ws.onerror = () => {
                this.error = 'No se pudo establecer conexión multijugador.';
            };
        },

        disconnect() {
            if (this.socket) {
                this.socket.close();
            }
            this.socket = null;
            this.isConnected = false;
            this.room = null;
            this.invitations = [];
        },

        sendMouseUpdate(x, y) {
            this.sendGameAction({ type: 'MOUSE_UPDATE', x, y });
        },

        handleMessage(data) {
            switch (data.type) {
                case 'INVITATION_RECEIVED':
                    this.invitations.push({ from: data.from, roomId: data.roomId });
                    break;
                case 'GLOBAL_ROOMS_UPDATE':
                    console.log('🛰️ [WS] Salas públicas actualizadas:', data.rooms);
                    this.availableRooms = data.rooms;
                    break;
                case 'ROOM_CREATED':
                    this.joinRoom(data.roomId);
                    break;
                case 'JOIN_SUCCESS':
                    this.room = data.room;
                    break;
                case 'ROOM_UPDATE':
                    this.room = data.room;
                    break;
                case 'MATCH_STARTING':
                    this.roundScores = {}; // Reset puntuacions en viu al començar nova partida
                    this.room = data.room;
                    console.log('🏁 ¡LA PARTIDA COMIENZA!', data.room.gameConfig.currentGame);
                    break;
                case 'ROUND_ENDED_BY_WINNER':
                    console.log('🏁 Ronda terminada instantáneamente por:', data.winner);
                    if (this.room) {
                        this.room.gameConfig.scores = data.scores;
                    }
                    this.lastMessage = data; // Para que los componentes reaccionen
                    break;
                case 'SCORE_UPDATE_LIVE':
                    this.roundScores[data.user] = data.score;
                    break;
                case 'GAME_ACTION':
                    if (data.action?.type === 'MOUSE_UPDATE') {
                        if (data.from !== this.getSession().user) {
                            this.remoteCursors[data.from] = { x: data.action.x, y: data.action.y };
                        }
                    } else {
                        this.lastMessage = data; // Para que los componentes reaccionen (sabotaje)
                    }
                    break;
                case 'ROUND_FINISHED':
                    this.roundScores = {}; // Limpiar para la siguiente
                    this.room = data.room;
                    console.log('🏆 Ronda terminada. Ganador:', data.winner);
                    break;
                case 'MATCH_FINISHED':
                    this.returnedPlayers = []; // Reset al acabar partida
                    this.room = data.room;
                    this.lastMessage = data; // Para que el lobby muestre el overlay de resultados
                    console.log('👑 ¡PARTIDA TERMINADA! Ganador absoluto:', data.winner);
                    break;
                case 'PLAYER_RETURNED':
                    this.lastMessage = data;
                    if (data.user && !this.returnedPlayers.includes(data.user)) {
                        this.returnedPlayers.push(data.user);
                    }
                    break;
                case 'MOUSE_UPDATE':
                    if (data.user !== this.getSession().user) {
                        this.remoteCursors[data.user] = { x: data.x, y: data.y };
                    }
                    break;
                case 'HAZARD_UPDATE':
                    if (this.room) {
                        this.room.gameConfig.hazardProgress = data.hazardProgress;
                        if (data.teams) this.room.gameConfig.teams = data.teams;
                    }
                    break;
                case 'TEAM_PROGRESS_UPDATE':
                    if (this.room) {
                        this.room.gameConfig.teams = data.teams;
                    }
                    break;
                case 'SPACE_RACE_WIN':
                    this.lastMessage = data;
                    console.log('🏆 ¡CARRERA GANADA!', data.winnerTeam);
                    break;
                case 'SPACE_RACE_LOSE':
                    this.lastMessage = data;
                    console.log('💀 ¡CARRERA PERDIDA!', data.reason);
                    break;
                case 'ROOM_CLOSED':
                    this.room = null;
                    this.lastMessage = data;
                    console.log('🚪 Sala tancada pel servidor:', data.reason);
                    break;
                case 'PLAYER_EFFECT_ACTIVATED':
                    console.log('✨ Efecto activado:', data.effect);
                    this.activeEffects[data.effect.id] = {
                        type: data.effect.type,
                        duration: data.effect.duration || 3000,
                        startTime: Date.now()
                    };
                    // Auto-limpieza después de la duración si el servidor no envía desactivación
                    setTimeout(() => {
                        if (this.activeEffects[data.effect.id]) {
                            delete this.activeEffects[data.effect.id];
                        }
                    }, (data.effect.duration || 3000) + 500);
                    break;
                case 'PLAYER_EFFECT_DEACTIVATED':
                    console.log('🚫 Efecto desactivado:', data.effectId);
                    delete this.activeEffects[data.effectId];
                    break;
                case 'ERROR':
                    this.error = data.message;
                    break;
                default:
                    break;
            }
        },

        updateGameConfig(config) {
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'UPDATE_GAME_CONFIG',
                roomId: this.room.id,
                config
            }));
        },

        startMatch() {
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'START_MATCH',
                roomId: this.room.id
            }));
        },

        setRoomStatus(status) {
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'SET_ROOM_STATUS',
                roomId: this.room.id,
                status
            }));
        },

        submitRoundResult() {
            const sessionStore = useSessionStore();
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'SUBMIT_ROUND_RESULT',
                roomId: this.room.id,
                user: sessionStore.user
            }));
        },

        returnToLobby() {
            const sessionStore = useSessionStore();
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'PLAYER_RETURN_TO_LOBBY',
                roomId: this.room.id,
                user: sessionStore.user
            }));
        },

        sendGameAction(action) {
            const sessionStore = useSessionStore();
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'GAME_ACTION',
                roomId: this.room.id,
                user: sessionStore.user,
                action
            }));
        },

        createRoom(userAccount, isPublic = true, maxPlayers = 4, gameConfig = {}) {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'CREATE_ROOM',
                    user: userAccount,
                    isPublic,
                    maxPlayers,
                    gameConfig
                }));
            }
        },

        joinRoom(roomId) {
            const sessionStore = this.getSession();
            if (!this.isConnected || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'JOIN_ROOM',
                roomId,
                user: sessionStore.user
            }));
        },

        inviteFriend(friendName) {
            const sessionStore = this.getSession();
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'INVITE',
                from: sessionStore.user,
                to: friendName,
                roomId: this.room.id
            }));
        },

        leaveRoom() {
            const sessionStore = this.getSession();
            if (!this.isConnected || !this.room || !this.socket) return;
            this.socket.send(JSON.stringify({
                type: 'LEAVE_ROOM',
                roomId: this.room.id,
                user: sessionStore.user
            }));
            this.room = null;
        },

        deleteRoom(targetRoomId = null) {
            const sessionStore = this.getSession();
            const roomId = targetRoomId || (this.room ? this.room.id : null);
            if (!this.isConnected || !roomId || !this.socket) return;

            this.socket.send(JSON.stringify({
                type: 'DELETE_ROOM',
                roomId: roomId,
                user: sessionStore.user
            }));

            // Si estem esborrant la sala on estem, la posem a null
            if (this.room && this.room.id === roomId) {
                this.room = null;
            }
        }
    }
});
