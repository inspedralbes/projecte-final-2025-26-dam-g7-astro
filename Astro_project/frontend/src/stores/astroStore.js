import { defineStore } from 'pinia';
import { markRaw } from 'vue'; // Importante para objetos no reactivos

export const useAstroStore = defineStore('astro', {
    state: () => ({
        user: null,
        plan: null,
        rank: null,
        token: localStorage.getItem('astro_token') || null, // Persistencia básica
        socket: null,
        isConnected: false,
        error: null
    }),

    actions: {
        async loginTripulante(credentials) {
            this.error = null;
            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Error de autenticación");

                // Asignación de datos
                this.user = data.profile.name;
                this.plan = data.profile.plan;
                this.rank = data.profile.rank;
                this.token = data.token;

                // Guardar token para recargas de página
                localStorage.setItem('astro_token', data.token);

                this.connectWebSocket();
                return { success: true };

            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        connectWebSocket() {
            // Evitar duplicar conexiones si ya existe una activa
            if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

            const ws = new WebSocket('ws://localhost:3000');

            ws.onopen = () => {
                this.isConnected = true;
                console.log("🚀 Sincronización completada: WebSocket activo");

                ws.send(JSON.stringify({
                    type: 'IDENTIFY',
                    user: this.user,
                    plan: this.plan,
                    token: this.token // Enviamos token para validar en el server
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("📡 Mensaje de la flota:", data);
                    // Aquí podrías disparar otras acciones según el tipo de mensaje
                } catch (e) {
                    console.error("Error procesando mensaje:", e);
                }
            };

            ws.onclose = (event) => {
                this.isConnected = false;
                this.socket = null;
                console.warn("⚠️ Trayectoria perdida: Conexión cerrada", event.reason);
                
                // Intento de reconexión automática tras 5 segundos si el usuario sigue logueado
                if (this.token) {
                    setTimeout(() => this.connectWebSocket(), 5000);
                }
            };

            ws.onerror = (err) => {
                console.error("❌ Error en el motor de comunicación:", err);
            };

            // Usamos markRaw para que Vue no intente "observar" el objeto WebSocket
            this.socket = markRaw(ws);
        },

        logout() {
            if (this.socket) {
                this.socket.close();
            }
            this.$reset(); // Limpia todo el estado de golpe
            localStorage.removeItem('astro_token');
            console.log("🛰️ Sesión cerrada. Regresando a la base.");
        }
    }
});