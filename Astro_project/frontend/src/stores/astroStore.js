import { defineStore } from 'pinia';
import { markRaw } from 'vue';

export const useAstroStore = defineStore('astro', {
    state: () => ({
        user: null,
        plan: null,
        rank: null,
        coins: 0,
        partides: 0,
        token: localStorage.getItem('astro_token') || null,
        socket: null,
        isConnected: false,
        error: null
    }),

    actions: {
        async registerTripulante(userData) {
            this.error = null;
            try {
                // CORRECCIÓN: Puerto 3000 según tu server.js
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // IMPORTANTE: Asegúrate que userData envíe { username, password, rank }
                    body: JSON.stringify(userData)
                });

                const text = await response.text();
                const data = text ? JSON.parse(text) : {};

                if (!response.ok) throw new Error(data.message || "Error al registrar");

                return { success: true, message: data.message };

            } catch (error) {
                console.error("❌ Error en registro:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async loginTripulante(credentials) {
            this.error = null;
            try {
                // CORRECCIÓN: Puerto 3000
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // El servidor espera { user, password }
                    body: JSON.stringify({
                        user: credentials.username || credentials.user,
                        password: credentials.password || credentials.pass
                    })
                });

                const text = await response.text();
                if (!text) throw new Error("El servidor no envió datos de respuesta.");

                const data = JSON.parse(text);

                if (!response.ok) throw new Error(data.message || "Error de autenticación");

                // Asignación de datos basada en tu server.js
                this.user = data.profile.name;
                this.plan = data.profile.plan;
                this.rank = data.profile.rank;
                this.coins = data.profile.coins;
                this.partides = data.profile.gamesPlayed || 0;
                this.token = data.token;

                localStorage.setItem('astro_token', data.token);

                this.connectWebSocket();
                return { success: true };

            } catch (error) {
                console.error("❌ Error en login:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async fetchUserStats() {
            this.error = null;
            if (!this.user) {
                return { success: false, message: "No hay una sesión activa." };
            }

            try {
                const response = await fetch(`http://localhost:3000/api/users/${encodeURIComponent(this.user)}/stats`);
                const text = await response.text();
                const data = text ? JSON.parse(text) : {};

                if (!response.ok) throw new Error(data.message || "No se pudieron obtener las estadísticas.");

                this.coins = data.coins !== undefined ? data.coins : this.coins;
                this.partides = data.gamesPlayed !== undefined ? data.gamesPlayed : this.partides;

                return { success: true, stats: data };
            } catch (error) {
                console.error("❌ Error obteniendo estadísticas:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async fetchUserBalance() {
            this.error = null;
            if (!this.user) {
                return { success: false, message: "No hay una sesión activa." };
            }

            try {
                const response = await fetch(`http://localhost:3000/api/shop/balance/${encodeURIComponent(this.user)}`);
                const text = await response.text();
                const data = text ? JSON.parse(text) : {};

                if (!response.ok) throw new Error(data.message || "No se pudo obtener el saldo.");

                this.coins = data.coins !== undefined ? data.coins : this.coins;
                this.partides = data.gamesPlayed !== undefined ? data.gamesPlayed : this.partides;

                return { success: true, balance: data };
            } catch (error) {
                console.error("❌ Error obteniendo saldo:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async registerCompletedGame(game, score = 0) {
            this.error = null;
            if (!this.user) {
                return { success: false, message: "No hay una sesión activa." };
            }

            if (!game) {
                return { success: false, message: "Nombre de juego inválido." };
            }

            try {
                const response = await fetch('http://localhost:3000/api/games/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        game,
                        score
                    })
                });

                const text = await response.text();
                const data = text ? JSON.parse(text) : {};

                if (!response.ok) throw new Error(data.message || "No se pudo registrar la partida.");

                this.coins = data.newBalance !== undefined ? data.newBalance : this.coins;
                this.partides = data.gamesPlayed !== undefined ? data.gamesPlayed : (this.partides + 1);

                return { success: true, data };
            } catch (error) {
                console.error("❌ Error registrando partida:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        connectWebSocket() {
            // CORRECCIÓN: Puerto 3000 y evitar duplicados
            if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;

            const ws = new WebSocket('ws://localhost:3000');

            ws.onopen = () => {
                this.isConnected = true;
                console.log("🚀 Sincronización completada: WebSocket activo en puerto 3000");

                ws.send(JSON.stringify({
                    type: 'IDENTIFY',
                    user: this.user,
                    plan: this.plan,
                    token: this.token
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("📡 Mensaje de la flota:", data);
                } catch (e) {
                    console.error("Error procesando mensaje:", e);
                }
            };

            ws.onclose = (event) => {
                this.isConnected = false;
                this.socket = null;
                console.warn("⚠️ Trayectoria perdida: Conexión cerrada");

                // Reconexión automática si hay sesión activa
                if (this.token) {
                    setTimeout(() => this.connectWebSocket(), 5000);
                }
            };

            ws.onerror = (err) => {
                console.error("❌ Error en el motor de comunicación (WS)");
            };

            this.socket = markRaw(ws);
        },

        logout() {
            if (this.socket) {
                this.socket.close();
            }
            this.$reset();
            localStorage.removeItem('astro_token');
            console.log("🛰️ Sesión cerrada. Regresando a la base.");
        }
    }
});
