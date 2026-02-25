import { defineStore } from 'pinia';
import { useAstroStore } from './astroStore';

export const useMultiplayerStore = defineStore('multiplayer', {
    state: () => ({
        socket: null,
        isConnected: false,
        room: null, // { id, host, players, status }
        availableRooms: [],
        invitations: [], // { from, roomId }
        error: null
    }),

    actions: {
        async fetchAvailableRooms() {
            try {
                const response = await fetch('http://localhost:3000/api/multiplayer/rooms');
                const data = await response.json();
                if (response.ok) {
                    this.availableRooms = data;
                }
            } catch (error) {
                console.error("❌ Error cargando salas:", error);
            }
        },
        connect() {
            const astroStore = useAstroStore();
            if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

            const ws = new WebSocket('ws://localhost:3000');

            ws.onopen = () => {
                this.isConnected = true;
                this.socket = ws;
                console.log("🚀 Conexión Multijugador establecida");

                ws.send(JSON.stringify({
                    type: 'IDENTIFY',
                    user: astroStore.user,
                    token: astroStore.token
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`📩 Mensaje WS recibido: ${data.type}`, data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error("Error procesando mensaje:", e);
                }
            };

            ws.onclose = () => {
                this.isConnected = false;
                this.socket = null;
                console.warn("⚠️ Conexión Multijugador cerrada");
                // Intento de reconexión opcional aquí
            };
        },

        handleMessage(data) {
            switch (data.type) {
                case 'INVITATION_RECEIVED':
                    this.invitations.push({ from: data.from, roomId: data.roomId });
                    break;
                case 'GLOBAL_ROOMS_UPDATE':
                    console.log("🛰️ [WS] Salas públicas actualizadas:", data.rooms);
                    this.availableRooms = data.rooms;
                    break;

                case 'ROOM_CREATED':
                    // Al crear sala, nos unimos automáticamente (el backend ya nos puso como host)
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
            }
        },

        createRoom(userAccount, isPublic = true) {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'CREATE_ROOM',
                    user: userAccount,
                    isPublic
                }));
            }
        },

        joinRoom(roomId) {
            const astroStore = useAstroStore();
            if (!this.isConnected) return;
            this.socket.send(JSON.stringify({
                type: 'JOIN_ROOM',
                roomId,
                user: astroStore.user
            }));
        },

        inviteFriend(friendName) {
            const astroStore = useAstroStore();
            if (!this.isConnected || !this.room) return;
            this.socket.send(JSON.stringify({
                type: 'INVITE',
                from: astroStore.user,
                to: friendName,
                roomId: this.room.id
            }));
        },

        leaveRoom() {
            const astroStore = useAstroStore();
            if (!this.isConnected || !this.room) return;
            this.socket.send(JSON.stringify({
                type: 'LEAVE_ROOM',
                roomId: this.room.id,
                user: astroStore.user
            }));
            this.room = null;
        }
    }
});
