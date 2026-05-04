import { defineStore } from 'pinia';
import { useMultiplayerStore } from './multiplayerStore';
import { useSessionStore } from './sessionStore';

export const useChatStore = defineStore('chat', {
    state: () => ({
        /** Si el drawer de chat está abierto */
        isOpen: false,
        /** Amigo actualmente en conversación { user, avatar, ... } */
        activeFriend: null,
        /**
         * Historial de mensajes por conversación.
         * { [friendUsername]: Array<{ from, to, content, at, read }> }
         */
        conversations: {},
        /**
         * Conteo de mensajes no leídos por remitente.
         * { [friendUsername]: number }
         */
        unreadCounts: {}
    }),

    getters: {
        /** Mensajes de la conversación activa */
        activeMessages(state) {
            if (!state.activeFriend) return [];
            return state.conversations[state.activeFriend.user] || [];
        },

        /** Total de mensajes no leídos (para badge global) */
        totalUnread(state) {
            return Object.values(state.unreadCounts).reduce((a, b) => a + b, 0);
        },

        /** No leídos del amigo activo */
        activeUnread(state) {
            if (!state.activeFriend) return 0;
            return state.unreadCounts[state.activeFriend.user] || 0;
        }
    },

    actions: {
        /** Acceso al socket del multiplayerStore (conexión WS compartida) */
        _getSocket() {
            return useMultiplayerStore().socket;
        },

        _getMyUser() {
            return useSessionStore().user;
        },

        /**
         * Asegura que el WS esté conectado. Si no, llama a connect() y espera.
         * @returns {Promise<boolean>} true si la conexión está lista
         */
        async _ensureConnected() {
            const multiplayerStore = useMultiplayerStore();

            if (multiplayerStore.socket && multiplayerStore.socket.readyState === WebSocket.OPEN) {
                return true;
            }

            // Conectar si no está conectado
            multiplayerStore.connect();

            // Esperar hasta 5 segundos a que el socket esté listo
            return new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(false), 5000);
                const interval = setInterval(() => {
                    if (multiplayerStore.socket && multiplayerStore.socket.readyState === WebSocket.OPEN) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        resolve(true);
                    }
                }, 100);
            });
        },

        /**
         * Abre el chat con un amigo y solicita el historial al servidor.
         * @param {{ user: string, avatar?: string, level?: number }} friend
         */
        async openChat(friend) {
            this.activeFriend = friend;
            this.isOpen = true;

            // Limpiar contador de no leídos para este amigo
            if (this.unreadCounts[friend.user]) {
                this.unreadCounts[friend.user] = 0;
            }

            // Inicializar la conversación si no existe
            if (!this.conversations[friend.user]) {
                this.conversations[friend.user] = [];
            }

            // Asegurar conexión WS antes de pedir historial
            const connected = await this._ensureConnected();
            if (!connected) {
                console.warn('⚠️ Chat: no se pudo establecer conexión WS');
                return;
            }

            const socket = useMultiplayerStore().socket;
            socket.send(JSON.stringify({
                type: 'CHAT_FETCH_HISTORY',
                userA: this._getMyUser(),
                userB: friend.user
            }));
        },

        /** Cierra el drawer de chat */
        closeChat() {
            this.isOpen = false;
            this.activeFriend = null;
        },

        /**
         * Envía un mensaje al amigo activo.
         * @param {string} content
         */
        async sendMessage(content) {
            if (!content?.trim() || !this.activeFriend) return;

            const myUser = this._getMyUser();

            // Asegurar conexión WS
            const connected = await this._ensureConnected();
            if (!connected) {
                console.warn('⚠️ Chat: no hay conexión WS activa');
                return;
            }

            const socket = useMultiplayerStore().socket;
            socket.send(JSON.stringify({
                type: 'CHAT_SEND',
                from: myUser,
                to: this.activeFriend.user,
                content: content.trim()
            }));
        },

        /**
         * Maneja la llegada de un CHAT_MESSAGE desde el servidor.
         * @param {{ from: string, to: string, content: string, at: string }} data
         */
        handleIncomingMessage(data) {
            const myUser = this._getMyUser();

            // Determinar de qué conversación es este mensaje
            const friendUser = data.from === myUser ? data.to : data.from;

            if (!this.conversations[friendUser]) {
                this.conversations[friendUser] = [];
            }

            // Evitar duplicados (el servidor nos devuelve nuestro propio mensaje de confirmación)
            const isDuplicate = this.conversations[friendUser].some(
                m => m.from === data.from && m.at === data.at && m.content === data.content
            );
            if (isDuplicate) return;

            this.conversations[friendUser].push({
                from: data.from,
                to: data.to,
                content: data.content,
                at: data.at,
                read: data.from === myUser, // nuestros propios mensajes ya los leemos
                msgType: data.msgType || 'text'
            });

            // Si el mensaje es entrante (de otro) y el chat no está abierto con ese amigo → incrementar badge
            if (data.from !== myUser) {
                const isActiveConversation = this.isOpen && this.activeFriend?.user === data.from;
                if (!isActiveConversation) {
                    this.unreadCounts[data.from] = (this.unreadCounts[data.from] || 0) + 1;
                }
            }
        },

        /**
         * Recibe el historial completo de una conversación (CHAT_HISTORY).
         * @param {{ with: string, messages: Array }} data
         */
        handleHistory(data) {
            this.conversations[data.with] = data.messages || [];
        },

        /**
         * Recibe los conteos de no leídos al iniciar sesión (CHAT_UNREAD_COUNTS).
         * @param {{ counts: Record<string, number> }} data
         */
        handleUnreadCounts(data) {
            this.unreadCounts = { ...data.counts };
        },

        setChallengeStatus(friendUser, status) {
            if (!friendUser) return;
            
            // Buscar la conversación (ignorando mayúsculas/minúsculas)
            const conversationKey = Object.keys(this.conversations).find(
                key => key.toLowerCase() === friendUser.toLowerCase()
            ) || friendUser;

            const messages = this.conversations[conversationKey];
            if (!messages) {
                console.log(`⚠️ ChatStore: No se encontró conversación para ${friendUser}`);
                return;
            }

            // Encontrar el último mensaje de tipo challenge
            // Buscamos de atrás hacia adelante
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].msgType === 'challenge') {
                    // Si ya tiene el mismo estado, no hacemos nada
                    if (messages[i].status === status) break;

                    // Actualizar el estado
                    // Usamos una copia del objeto para asegurar que Vue detecte el cambio profundo
                    const updatedMsg = { ...messages[i], status: status };
                    messages[i] = updatedMsg;
                    
                    console.log(`✅ ChatStore: Estado de desafío [${i}] actualizado a ${status} para ${conversationKey}`);
                    break; 
                }
            }
        },

        /** Limpia el estado al cerrar sesión */
        clearChat() {
            this.isOpen = false;
            this.activeFriend = null;
            this.conversations = {};
            this.unreadCounts = {};
        }
    }
});
