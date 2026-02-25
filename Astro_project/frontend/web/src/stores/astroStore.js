import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { useMultiplayerStore } from './multiplayerStore';

function readStoredArray(key, fallback = []) {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;

    try {
        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? parsedValue : fallback;
    } catch (error) {
        console.warn(`⚠️ Valor inválido en localStorage para ${key}. Se usa valor por defecto.`);
        return fallback;
    }
}

function readStoredObject(key, fallback = {}) {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;

    try {
        const parsedValue = JSON.parse(rawValue);
        return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
            ? parsedValue
            : fallback;
    } catch (error) {
        console.warn(`⚠️ Valor inválido en localStorage para ${key}. Se usa valor por defecto.`);
        return fallback;
    }
}

function normalizeSelectedAchievements(values = []) {
    return [
        values[0] ?? null,
        values[1] ?? null,
        values[2] ?? null
    ];
}

function normalizeUnlockedAchievements(values = []) {
    return [...new Set(
        values
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
    )].sort((a, b) => a - b);
}

function toNonNegativeInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeActiveBoosters(values = {}) {
    const source =
        values && typeof values === 'object' && !Array.isArray(values)
            ? values
            : {};

    return {
        doubleCoinsGamesLeft: toNonNegativeInteger(source.doubleCoinsGamesLeft),
        doubleScoreGamesLeft: toNonNegativeInteger(source.doubleScoreGamesLeft)
    };
}

const DEFAULT_INVENTORY_MAX = 99;

const INVENTORY_CATALOG = Object.freeze({
    1: {
        id: 1,
        name: 'Pack de Vidas',
        desc: 'Recupera 5 vidas inmediatamente.',
        icon: 'mdi-heart-multiple',
        color: 'red-accent-2',
        cat: 'items',
        maxQuantity: 99
    },
    2: {
        id: 2,
        name: 'Congelar Racha',
        desc: 'Protege tu racha un día.',
        icon: 'mdi-snowflake',
        color: 'cyan-accent-2',
        cat: 'items',
        maxQuantity: 99
    },
    3: {
        id: 3,
        name: 'Doble de Monedas',
        desc: 'Multiplica x2 las monedas ganadas.',
        icon: 'mdi-piggy-bank',
        color: 'yellow-accent-3',
        cat: 'items',
        maxQuantity: 99
    },
    4: {
        id: 4,
        name: 'Doble Puntuación',
        desc: 'Multiplica x2 los puntos obtenidos.',
        icon: 'mdi-star-shooting',
        color: 'orange-accent-3',
        cat: 'items',
        maxQuantity: 99
    },
    101: {
        id: 101,
        name: 'Pin Comandante',
        desc: 'Insignia dorada.',
        icon: 'mdi-medal',
        color: 'amber-accent-3',
        cat: 'skin',
        maxQuantity: 1
    },
    102: {
        id: 102,
        name: 'Skin Cyberpunk',
        desc: 'Aspecto robótico.',
        icon: 'mdi-robot',
        color: 'purple-accent-3',
        cat: 'skin',
        maxQuantity: 1
    },
    103: {
        id: 103,
        name: 'Mascota Dron',
        desc: 'Un compañero fiel.',
        icon: 'mdi-quadcopter',
        color: 'green-accent-3',
        cat: 'pets',
        maxQuantity: 1
    },
    104: {
        id: 104,
        name: 'Rastro de Neón',
        desc: 'Efectos visuales.',
        icon: 'mdi-creation',
        color: 'pink-accent-3',
        cat: 'trails',
        maxQuantity: 1
    },
    201: {
        id: 201,
        name: 'Pin Raro',
        desc: 'Insignia rara obtenida en la ruleta.',
        icon: 'mdi-decagram',
        color: 'purple-accent-2',
        cat: 'collectible',
        maxQuantity: 99
    },
    202: {
        id: 202,
        name: 'Avatar Ninja',
        desc: 'Aspecto ninja obtenido en la ruleta.',
        icon: 'mdi-ninja',
        color: 'blue-accent-2',
        cat: 'skin',
        maxQuantity: 1
    }
});

const LEGACY_ITEM_NAME_TO_ID = Object.freeze({
    'Vida Extra': 1,
    'Pack de Vidas': 1,
    'Congelar Racha': 2,
    'Doble de Monedas': 3,
    'Doble Puntuación': 4,
    'Pin Comandante': 101,
    'Skin Cyberpunk': 102,
    'Mascota Dron': 103,
    'Rastro de Neón': 104,
    'Pin Raro': 201,
    'Avatar Ninja': 202
});

const LEGACY_WHEEL_REWARD_TO_ITEM = Object.freeze({
    0: 1,
    1: 201,
    2: 202
});

function toInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function toPositiveInteger(value) {
    const parsed = toInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
}

function resolveInventoryItemId(rawItem) {
    const candidate =
        rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
            ? rawItem.itemId ?? rawItem.id ?? rawItem.name ?? rawItem.label
            : rawItem;

    if (typeof candidate === 'number' && Number.isInteger(candidate)) {
        return candidate;
    }

    if (typeof candidate !== 'string') return null;

    const trimmed = candidate.trim();
    if (!trimmed) return null;

    if (Object.prototype.hasOwnProperty.call(LEGACY_ITEM_NAME_TO_ID, trimmed)) {
        return LEGACY_ITEM_NAME_TO_ID[trimmed];
    }

    const legacyPrizeMatch = trimmed.match(/^prize_\d+_(\d+)$/);
    if (legacyPrizeMatch) {
        const legacyWheelId = toInteger(legacyPrizeMatch[1]);
        if (
            legacyWheelId !== null &&
            Object.prototype.hasOwnProperty.call(LEGACY_WHEEL_REWARD_TO_ITEM, legacyWheelId)
        ) {
            return LEGACY_WHEEL_REWARD_TO_ITEM[legacyWheelId];
        }
    }

    return toInteger(trimmed);
}

function normalizeInventoryItems(values = []) {
    const source = Array.isArray(values) ? values : [];
    const mergedById = new Map();

    for (const rawItem of source) {
        const itemId = resolveInventoryItemId(rawItem);
        const catalogItem = INVENTORY_CATALOG[itemId];
        if (!catalogItem) continue;

        const rawMax =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? toPositiveInteger(rawItem.maxQuantity)
                : null;
        const maxQuantity = rawMax || catalogItem.maxQuantity || DEFAULT_INVENTORY_MAX;

        const rawQuantity =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? rawItem.quantity ?? rawItem.qty ?? rawItem.units
                : 1;
        const parsedQuantity = toPositiveInteger(rawQuantity) || 1;
        const safeQuantity = Math.min(maxQuantity, parsedQuantity);

        const previous = mergedById.get(itemId);
        const nextQuantity = Math.min(maxQuantity, (previous?.quantity || 0) + safeQuantity);
        const itemCat =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? rawItem.cat || catalogItem.cat
                : catalogItem.cat;
        const isEquipable = itemCat !== 'items';
        const equippedCandidate =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? !!rawItem.equipped
                : false;

        mergedById.set(itemId, {
            id: itemId,
            quantity: nextQuantity,
            maxQuantity,
            equipped: isEquipable ? !!(previous?.equipped || equippedCandidate) : false,
            name:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                    ? rawItem.name || catalogItem.name
                    : catalogItem.name,
            desc:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                    ? rawItem.desc || catalogItem.desc
                    : catalogItem.desc,
            icon:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                    ? rawItem.icon || catalogItem.icon
                    : catalogItem.icon,
            color:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                    ? rawItem.color || catalogItem.color
                    : catalogItem.color,
            cat: itemCat
        });
    }

    return [...mergedById.values()].sort((a, b) => a.id - b.id);
}

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
        activeBoosters: normalizeActiveBoosters(readStoredObject('astro_active_boosters', {})),
        needsFreeze: false,
        inventory: [],
        selectedAchievements: normalizeSelectedAchievements(readStoredArray('astro_selected_achievements', [null, null, null])),
        unlockedAchievements: normalizeUnlockedAchievements(readStoredArray('astro_unlocked_achievements', [])),
        avatar: localStorage.getItem('astro_avatar') || 'Astronauta_blanc.jpg',
        mascot: localStorage.getItem('astro_mascot') || null,
        token: localStorage.getItem('astro_token') || null,
        lastActivity: localStorage.getItem('astro_last_activity') || null,
        lastGame: localStorage.getItem('astro_last_game') || null,
        dailyMissions: [],
        weeklyMissions: [],
        friends: [],
        explorers: [], // <--- AÑADIDO: Para la lista de amigos/usuarios
        socket: null,
        isConnected: false,
        error: null
    }),

    getters: {
        isStreakActiveToday: (state) => {
            if (!state.lastGame) return false;
            const last = new Date(state.lastGame);
            const now = new Date();
            return last.getFullYear() === now.getFullYear() &&
                last.getMonth() === now.getMonth() &&
                last.getDate() === now.getDate();
        },
        inventoryUnits: (state) => {
            return (state.inventory || []).reduce((sum, item) => {
                const quantity = Number(item?.quantity);
                return sum + (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
            }, 0);
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
                this.activeBoosters = normalizeActiveBoosters(data.profile.activeBoosters || {});
                this.needsFreeze = !!data.profile.needsFreeze;
                this.lastActivity = data.profile.lastActivity || null;
                this.lastGame = data.profile.lastGame || null;
                this.token = data.token;

                // 2. Formatear logros (siempre 3 slots)
                const saved = data.profile.selectedAchievements || [];
                this.selectedAchievements = normalizeSelectedAchievements(saved);
                this.unlockedAchievements = normalizeUnlockedAchievements(data.profile.unlockedAchievements || []);

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
                localStorage.setItem('astro_active_boosters', JSON.stringify(this.activeBoosters));
                localStorage.setItem('astro_last_activity', this.lastActivity);
                localStorage.setItem('astro_last_game', this.lastGame);
                localStorage.setItem('astro_selected_achievements', JSON.stringify(this.selectedAchievements));
                localStorage.setItem('astro_unlocked_achievements', JSON.stringify(this.unlockedAchievements));

                // 5. Iniciar comunicaciones en tiempo real
                const multiplayerStore = useMultiplayerStore();
                multiplayerStore.connect();

                return { success: true };

            } catch (error) {
                console.error("❌ Error en login:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async fetchUserStats() {
            this.error = null;
            if (!this.user) return { success: false, message: "No hay una sesión activa." };

            try {
                const response = await fetch(`http://localhost:3000/api/users/${encodeURIComponent(this.user)}/stats`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "No se pudieron obtener las estadísticas.");

                // Actualizamos el estado con los datos recibidos
                this.coins = data.coins ?? this.coins;
                this.level = data.level ?? this.level;
                this.xp = data.xp ?? this.xp;
                this.partides = data.gamesPlayed ?? this.partides;
                this.streak = data.streak ?? this.streak;
                this.streakFreezes = data.streakFreezes ?? this.streakFreezes;
                this.activeBoosters = normalizeActiveBoosters(data.activeBoosters ?? this.activeBoosters);
                this.lastActivity = data.lastActivity ?? this.lastActivity;
                this.lastGame = data.lastGame ?? this.lastGame;

                // AÑADIDO: Carga de misiones para el Sidebar
                this.dailyMissions = data.dailyMissions || [];
                this.weeklyMissions = data.weeklyMissions || [];
                this.friends = data.friends || [];
                localStorage.setItem('astro_active_boosters', JSON.stringify(this.activeBoosters));

                return { success: true, stats: data };
            } catch (error) {
                console.error("❌ Error obteniendo estadísticas:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        // AÑADIDO: Acción para obtener todos los exploradores (Amigos)
        async fetchAllUsers() {
            try {
                const response = await fetch('http://localhost:3000/api/users');
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                this.explorers = data; // Guardamos la lista en el estado
                return { success: true, data };
            } catch (error) {
                console.error("❌ Error obteniendo lista de exploradores:", error);
                return { success: false, message: error.message };
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
                this.activeBoosters = normalizeActiveBoosters(data.activeBoosters ?? this.activeBoosters);
                this.dailyMissions = data.dailyMissions || this.dailyMissions;
                this.weeklyMissions = data.weeklyMissions || this.weeklyMissions;
                this.needsFreeze = !!data.needsFreeze;
                this.lastActivity = new Date().toISOString();
                this.lastGame = new Date().toISOString();
                localStorage.setItem('astro_last_activity', this.lastActivity);
                localStorage.setItem('astro_last_game', this.lastGame);
                localStorage.setItem('astro_active_boosters', JSON.stringify(this.activeBoosters));

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
                this.inventory = normalizeInventoryItems(data.inventory || []);

                if (data.streakFreezes !== undefined) {
                    this.streakFreezes = data.streakFreezes;
                    localStorage.setItem('astro_streak_freezes', this.streakFreezes);
                }

                if (Number(item?.id) === 2 && data.streakFreezes === undefined) {
                    this.streakFreezes++;
                    localStorage.setItem('astro_streak_freezes', this.streakFreezes);
                }

                return { success: true, data };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },

        async useInventoryItem(itemId) {
            this.error = null;
            if (!this.user) {
                return { success: false, message: "No hay sesión activa." };
            }

            const parsedItemId = toPositiveInteger(itemId);
            if (!parsedItemId) {
                return { success: false, message: "Objeto inválido." };
            }

            try {
                const response = await fetch('http://localhost:3000/api/inventory/use-item', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: this.user, itemId: parsedItemId })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "No se pudo usar el objeto.");

                this.inventory = normalizeInventoryItems(data.inventory || []);
                this.activeBoosters = normalizeActiveBoosters(data.activeBoosters ?? this.activeBoosters);
                this.dailyMissions = data.dailyMissions || this.dailyMissions;
                this.weeklyMissions = data.weeklyMissions || this.weeklyMissions;
                localStorage.setItem('astro_active_boosters', JSON.stringify(this.activeBoosters));

                return { success: true, data };
            } catch (error) {
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async claimMissionReward(missionId, type = 'daily') {
            this.error = null;
            if (!this.user) return { success: false, message: "No hay sesión activa." };

            try {
                const response = await fetch('http://localhost:3000/api/missions/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        missionId,
                        type
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Error al reclamar recompensa.");

                this.coins = data.newBalance;
                this.dailyMissions = data.dailyMissions || this.dailyMissions;
                this.weeklyMissions = data.weeklyMissions || this.weeklyMissions;

                return { success: true, message: data.message };
            } catch (error) {
                console.error("❌ Error reclamando misión:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async fetchUserInventory() {
            if (!this.user) return [];
            try {
                const response = await fetch(`http://localhost:3000/api/users/${encodeURIComponent(this.user)}/inventory`);
                const data = await response.json();

                this.inventory = normalizeInventoryItems(data.inventory || []);
                if (data.activeBoosters !== undefined) {
                    this.activeBoosters = normalizeActiveBoosters(data.activeBoosters);
                    localStorage.setItem('astro_active_boosters', JSON.stringify(this.activeBoosters));
                }
                return this.inventory;
            } catch (error) {
                console.error("Error al traer inventario:", error);
                return [];
            }
        },

        async fetchUserAchievements() {
            this.error = null;
            if (!this.user) {
                return { success: false, message: "No hay una sesión activa." };
            }

            try {
                const response = await fetch(`http://localhost:3000/api/users/${encodeURIComponent(this.user)}/achievements`);
                const text = await response.text();
                const data = text ? JSON.parse(text) : {};

                if (!response.ok) throw new Error(data.message || "No se pudieron obtener los logros.");

                this.selectedAchievements = normalizeSelectedAchievements(data.selectedAchievements || []);
                this.unlockedAchievements = normalizeUnlockedAchievements(data.unlockedAchievements || []);

                localStorage.setItem('astro_selected_achievements', JSON.stringify(this.selectedAchievements));
                localStorage.setItem('astro_unlocked_achievements', JSON.stringify(this.unlockedAchievements));

                return { success: true, achievements: data };
            } catch (error) {
                console.error("❌ Error obteniendo logros:", error);
                this.error = error.message;
                return { success: false, message: this.error };
            }
        },

        async syncUnlockedAchievements(unlockedAchievements) {
            this.error = null;
            const normalizedUnlocked = normalizeUnlockedAchievements(unlockedAchievements);

            this.unlockedAchievements = normalizedUnlocked;
            localStorage.setItem('astro_unlocked_achievements', JSON.stringify(normalizedUnlocked));

            if (!this.user) {
                this.user = localStorage.getItem('astro_user');
            }

            if (!this.user) {
                this.error = "Usuario no identificado. Los logros se guardaron solo en local.";
                return { success: false, message: this.error };
            }

            try {
                const response = await fetch('http://localhost:3000/api/user/achievements/unlocked', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: this.user,
                        unlockedAchievements: normalizedUnlocked
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Error al guardar logros desbloqueados.");

                this.unlockedAchievements = normalizeUnlockedAchievements(data.unlockedAchievements || normalizedUnlocked);
                localStorage.setItem('astro_unlocked_achievements', JSON.stringify(this.unlockedAchievements));

                return { success: true, unlockedAchievements: this.unlockedAchievements };
            } catch (error) {
                console.error("❌ Error sincronizando logros desbloqueados:", error);
                this.error = "Error al guardar logros desbloqueados: " + error.message;
                return { success: false, message: this.error };
            }
        },

        async addFriendAction(friendName) {
            if (!this.user) return;
            try {
                const response = await fetch('http://localhost:3000/api/friends/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: this.user, friendName })
                });
                const data = await response.json();
                if (data.success) {
                    this.friends = data.friends; // Actualizamos la lista local
                    return { success: true };
                }
                return { success: false, message: data.message };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },

        async removeFriendAction(friendName) {
            if (!this.user) return;
            try {
                const response = await fetch('http://localhost:3000/api/friends/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: this.user, friendName })
                });
                const data = await response.json();
                if (data.success) {
                    this.friends = data.friends; // Actualizamos la lista local
                    return { success: true };
                }
            } catch (error) {
                console.error(error);
            }
        },

        connectWebSocket() {
            const multiplayerStore = useMultiplayerStore();
            multiplayerStore.connect();
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
            localStorage.removeItem('astro_active_boosters');
            localStorage.removeItem('astro_selected_achievements');
            localStorage.removeItem('astro_unlocked_achievements');
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
                if (Array.isArray(data.inventory)) {
                    this.inventory = normalizeInventoryItems(data.inventory);
                }
                if (data.activeBoosters !== undefined) {
                    this.activeBoosters = normalizeActiveBoosters(data.activeBoosters);
                    localStorage.setItem('astro_active_boosters', JSON.stringify(this.activeBoosters));
                }
                localStorage.setItem('astro_streak_freezes', this.streakFreezes);

                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }
    }
});
