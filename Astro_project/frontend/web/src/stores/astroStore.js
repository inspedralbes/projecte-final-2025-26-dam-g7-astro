import { defineStore } from 'pinia';
import { markRaw } from 'vue';

export const useAstroStore = defineStore('astro', {
    state: () => ({
        user: localStorage.getItem('astro_user') || null,
        plan: localStorage.getItem('astro_plan') || 'INDIVIDUAL_FREE',
        rank: localStorage.getItem('astro_rank') || null,
        coins: 0,
        partides: 0,
        level: Number(localStorage.getItem('astro_level')) || 1,
        xp: Number(localStorage.getItem('astro_xp')) || 0,
        streak: Number(localStorage.getItem('astro_streak')) || 0,
        streakFreezes: Number(localStorage.getItem('astro_streak_freezes')) || 0,
        needsFreeze: false,
        inventory: [],
        selectedAchievements: JSON.parse(localStorage.getItem('astro_selected_achievements')) || [null, null, null],
        avatar: localStorage.getItem('astro_avatar') || 'Astronauta_blanc.jpg', // Avatar por defecto
        mascot: localStorage.getItem('astro_mascot') || null, // Mascota por defecto
        token: localStorage.getItem('astro_token') || null,
        lastActivity: localStorage.getItem('astro_last_activity') || null,
        socket: null,
        isConnected: false,
        error: null
    }),

    getters: {
        isStreakActiveToday: (state) => {
            if (!state.lastActivity) return false;
            const last = new Date(state.lastActivity);
            const now = new Date();
            return last.getFullYear() === now.getFullYear() &&
                last.getMonth() === now.getMonth() &&
                last.getDate() === now.getDate();
        }
    },

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
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: credentials.username || credentials.user,
                        password: credentials.password || credentials.pass
                    })
                });

                const text = await response.text();
                if (!text) throw new Error("El servidor no envió datos de respuesta.");
                const data = JSON.parse(text);

                if (!response.ok) throw new Error(data.message || "Error de autenticación");

                // 1. Sincronizar datos básicos del perfil
                this.user = data.profile.name;
                this.plan = data.profile.plan;
                this.rank = data.profile.rank;
                this.coins = data.profile.coins;
                this.level = data.profile.level;
                this.xp = data.profile.xp;
                this.streak = data.profile.streak || 0;
                this.streakFreezes = data.profile.streakFreezes || 0;
                this.needsFreeze = !!data.profile.needsFreeze;
                this.lastActivity = data.profile.lastActivity || null;
                this.token = data.token;

                // 2. Formatear logros (siempre 3 slots)
                const saved = data.profile.selectedAchievements || [];
                this.selectedAchievements = [
                    saved[0] || null,
                    saved[1] || null,
                    saved[2] || null
                ];

                // 3. CARGA CRÍTICA: Traer el inventario de MongoDB antes de finalizar
                await this.fetchUserInventory();

                // 4. Persistencia en LocalStorage
                localStorage.setItem('astro_token', data.token);
                localStorage.setItem('astro_user', this.user);
                localStorage.setItem('astro_rank', this.rank);
                localStorage.setItem('astro_plan', this.plan);
                localStorage.setItem('astro_level', this.level);
                localStorage.setItem('astro_xp', this.xp);
                localStorage.setItem('astro_streak', this.streak);
                localStorage.setItem('astro_streak_freezes', this.streakFreezes);
                localStorage.setItem('astro_last_activity', this.lastActivity);
                localStorage.setItem('astro_selected_achievements', JSON.stringify(this.selectedAchievements));

                // 5. Iniciar comunicaciones en tiempo real
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
                this.level = data.stats?.level !== undefined ? data.stats.level : this.level;
                this.xp = data.stats?.xp !== undefined ? data.stats.xp : this.xp;
                this.partides = data.gamesPlayed !== undefined ? data.gamesPlayed : this.partides;
                this.streak = data.stats?.streak !== undefined ? data.stats.streak : this.streak;
                this.streakFreezes = data.stats?.streakFreezes !== undefined ? data.stats.streakFreezes : this.streakFreezes;
                this.lastActivity = data.stats?.lastActivity !== undefined ? data.stats.lastActivity : this.lastActivity;

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
                this.level = data.newLevel !== undefined ? data.newLevel : this.level;
                this.xp = data.newXp !== undefined ? data.newXp : this.xp;
                this.partides = data.gamesPlayed !== undefined ? data.gamesPlayed : (this.partides + 1);
                this.streak = data.streak !== undefined ? data.streak : this.streak;
                this.needsFreeze = !!data.needsFreeze;
                this.lastActivity = new Date().toISOString(); // Acabamos de completar una partida

                if (data.newRank) {
                    this.rank = data.newRank;
                    localStorage.setItem('astro_rank', this.rank);
                }

                return { success: true, data };
            } catch (error) {
                console.error("❌ Error registrando partida:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async buyItem(item) {
            try {
                const response = await fetch('http://localhost:3000/api/shop/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: this.user, item: item })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                // ACTUALIZACIÓN DEL ESTADO GLOBAL
                this.coins = data.newBalance;
                this.inventory.push(data.item); // <--- Guardamos el inventario actualizado

                if (item.id === 2) {
                    this.streakFreezes++;
                    localStorage.setItem('astro_streak_freezes', this.streakFreezes);
                }

                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },

        async fetchUserInventory() {
            if (!this.user) return [];
            try {
                const response = await fetch(`http://localhost:3000/api/users/${encodeURIComponent(this.user)}/inventory`);
                const data = await response.json();

                this.inventory = data.inventory || []; // <--- Actualizamos el state
                return this.inventory;
            } catch (error) {
                console.error("Error al traer inventario:", error);
                return [];
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
            localStorage.removeItem('astro_level'); // Opcional, pero buena práctica
            localStorage.removeItem('astro_xp');    // Opcional, pero buena práctica
            localStorage.removeItem('astro_selected_achievements');
            localStorage.removeItem('astro_avatar');
            localStorage.removeItem('astro_mascot');
            console.log("🛰️ Sesión cerrada. Regresando a la base.");
        },

        updateAvatar(seed) {
            this.avatar = seed;
            localStorage.setItem('astro_avatar', seed);
            console.log("👤 Avatar actualizado localmente:", seed);
        },

        updateMascot(mascotFile) {
            this.mascot = mascotFile;
            localStorage.setItem('astro_mascot', mascotFile);
            console.log("🐾 Mascota actualizada localmente:", mascotFile);
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
        },

        async updatePlan(planType) {
            this.error = null;

            if (!this.user) {
                this.user = localStorage.getItem('astro_user');
            }

            // Actualización local inmediata (Optimistic)
            this.plan = planType;
            localStorage.setItem('astro_plan', planType);

            if (!this.user) {
                this.error = "Usuario no identificado para actualizar el plan.";
                return { success: false, message: this.error };
            }

            try {
                const response = await fetch('http://localhost:3000/api/user/plan', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        plan: planType
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Error al actualizar el plan en el servidor");

                console.log(`✅ Plan sincronizado en servidor: ${planType}`);
                return { success: true };

            } catch (error) {
                console.error("❌ Error sincronizando plan:", error);
                this.error = "Error al conectar con el servidor: " + error.message;
                return { success: false, message: this.error };
            }
        },

        async useStreakFreeze() {
            if (!this.user) return { success: false, message: "No hay sesión activa." };
            try {
                const response = await fetch('http://localhost:3000/api/user/use-freeze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: this.user })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                this.streakFreezes = data.streakFreezes;
                this.needsFreeze = false;
                localStorage.setItem('astro_streak_freezes', this.streakFreezes);

                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }
    }
});