import { defineStore } from 'pinia';
import { markRaw } from 'vue';

export const useAstroStore = defineStore('astro', {
    state: () => ({
        user: null,
        plan: null,
        rank: null,
        coins: 0, // <--- AÑADE ESTO
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
                this.token = data.token;

                localStorage.setItem('astro_token', data.token);
                localStorage.setItem('astro_user', this.user);
                localStorage.setItem('astro_rank', this.rank);
                localStorage.setItem('astro_plan', this.plan);
                localStorage.setItem('astro_selected_achievements', JSON.stringify(this.selectedAchievements));

                this.connectWebSocket();
                return { success: true };

            } catch (error) {
                console.error("❌ Error en login:", error);
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
            localStorage.removeItem('astro_user');
            localStorage.removeItem('astro_rank');
            localStorage.removeItem('astro_plan');
            localStorage.removeItem('astro_selected_achievements');
            console.log("🛰️ Sesión cerrada. Regresando a la base.");
        },

        async updateAchievements(achievements) {
            this.error = null;

            // Si por alguna razón el usuario es null pero tenemos token, intentamos recuperar (o simplemente logueamos el error)
            if (!this.user) {
                console.warn("⚠️ Intento de actualizar logros sin usuario identificado. Intentando recuperar de localStorage...");
                this.user = localStorage.getItem('astro_user');
            }

            // Actualizamos localmente y en storage de inmediato (Optimistic)
            this.selectedAchievements = achievements;
            localStorage.setItem('astro_selected_achievements', JSON.stringify(achievements));
            localStorage.setItem('astro_user', this.user); // Aseguramos persistencia

            if (!this.user) {
                this.error = "Usuario no identificado. Los cambios se guardarán localmente pero no en el servidor.";
                console.error("❌ " + this.error);
                return { success: false, message: this.error };
            }

            try {
                const response = await fetch('http://localhost:3000/api/user/achievements', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        achievements: achievements
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Error al actualizar logros");

                console.log(`✅ Logros actualizados en servidor para ${this.user}:`, achievements);
                return { success: true };

            } catch (error) {
                console.error("❌ Error sincronizando con servidor:", error);
                this.error = "Error al guardar en el servidor: " + error.message;
                // NO hacemos rollback para que el usuario no vea que sus logros desaparecen.
                // Se quedan guardados localmente en el localStorage.
                return { success: false, message: this.error };
            }
        }
    }
});