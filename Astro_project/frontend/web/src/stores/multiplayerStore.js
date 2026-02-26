import { defineStore } from 'pinia';
import { useSessionStore } from './sessionStore';
import { API_BASE_URL, requestJson } from './astroShared';

function buildWsUrl() {
    return API_BASE_URL.replace(/^http/i, 'ws');
}

export const useMultiplayerStore = defineStore('multiplayer', {
    state: () => ({
        socket: null,
        isConnected: false,
        room: null,
        availableRooms: [],
        invitations: [],
        error: null
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

            const ws = new WebSocket(buildWsUrl());

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
                case 'ERROR':
                    this.error = data.message;
                    break;
                default:
                    break;
            }
        },

        createRoom(userAccount, isPublic = true, maxPlayers = 4) {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'CREATE_ROOM',
                    user: userAccount,
                    isPublic,
                    maxPlayers
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
        }
    }
});
