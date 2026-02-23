import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://172.20.10.9:3000'; // Updated to machine IP for external/hotspot access

interface AstroState {
    user: string | null;
    plan: string;
    rank: string | null;
    coins: number;
    partides: number;
    selectedAchievements: (number | null)[];
    avatar: string;
    mascot: string | null;
    token: string | null;
    isConnected: boolean;
    error: string | null;
    socket: WebSocket | null;

    setUser: (user: string | null) => void;
    setPlan: (plan: string) => void;
    setRank: (rank: string | null) => void;
    setCoins: (coins: number) => void;
    setSelectedAchievements: (achievements: (number | null)[]) => void;
    updateAvatar: (avatar: string) => void;
    updateMascot: (mascot: string | null) => void;
    logout: () => void;
    connectWebSocket: () => void;

    // Actions mirroring the web store
    registerTripulante: (userData: any) => Promise<{ success: boolean; message?: string }>;
    loginTripulante: (credentials: any) => Promise<{ success: boolean; message?: string }>;
    fetchUserStats: () => Promise<{ success: boolean; message?: string; stats?: any }>;
    fetchUserBalance: () => Promise<{ success: boolean; message?: string; balance?: any }>;
    registerCompletedGame: (game: string, score?: number) => Promise<{ success: boolean; message?: string; data?: any }>;
    updateAchievements: (achievements: (number | null)[]) => Promise<{ success: boolean; message?: string }>;
    updatePlan: (planType: string) => Promise<{ success: boolean; message?: string }>;
    spinWheel: () => Promise<{ success: boolean; message?: string; prize?: any; newBalance?: number }>;
    purchaseItem: (itemId: number, price: number) => Promise<{ success: boolean; message?: string; newBalance?: number }>;
    equipItem: (itemId: number, category: string) => Promise<{ success: boolean; message?: string }>;
}

export const useAstroStore = create<AstroState>((set, get) => ({
    user: null,
    plan: 'INDIVIDUAL_FREE',
    rank: null,
    coins: 0,
    partides: 0,
    selectedAchievements: [null, null, null],
    avatar: 'Astronauta_blanc.jpg',
    mascot: null,
    token: null,
    isConnected: false,
    error: null,
    socket: null,

    setUser: (user) => set({ user }),
    setPlan: (plan) => set({ plan }),
    setRank: (rank) => set({ rank }),
    setCoins: (coins) => set({ coins }),
    setSelectedAchievements: (selectedAchievements) => set({ selectedAchievements }),

    updateAvatar: async (avatar) => {
        const { user } = get();
        set({ avatar });
        AsyncStorage.setItem('astro_avatar', avatar);
        if (user) {
            try {
                await fetch(`${API_BASE_URL}/api/user/avatar`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, avatar })
                });
            } catch (e) {
                console.error("Error persisting avatar", e);
            }
        }
    },

    updateMascot: async (mascot) => {
        const { user } = get();
        set({ mascot });
        AsyncStorage.setItem('astro_mascot', mascot || '');
        if (user) {
            try {
                await fetch(`${API_BASE_URL}/api/user/mascot`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, mascot })
                });
            } catch (e) {
                console.error("Error persisting mascot", e);
            }
        }
    },

    logout: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
        }
        set({
            user: null,
            plan: 'INDIVIDUAL_FREE',
            rank: null,
            coins: 0,
            partides: 0,
            selectedAchievements: [null, null, null],
            avatar: 'Astronauta_blanc.jpg',
            mascot: null,
            token: null,
            isConnected: false,
            error: null,
            socket: null
        });
        AsyncStorage.multiRemove([
            'astro_token', 'astro_user', 'astro_rank', 'astro_plan',
            'astro_selected_achievements', 'astro_avatar', 'astro_mascot'
        ]);
    },

    registerTripulante: async (userData) => {
        set({ error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al registrar");

            return { success: true, message: data.message };
        } catch (error: any) {
            set({ error: error.message });
            return { success: false, message: error.message };
        }
    },

    loginTripulante: async (credentials) => {
        set({ error: null });
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: credentials.username || credentials.user,
                    password: credentials.password || credentials.pass
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error de autenticación");

            const saved = data.profile.selectedAchievements || [];
            const achievements = [
                saved[0] || null,
                saved[1] || null,
                saved[2] || null
            ];

            set({
                user: data.profile.name,
                plan: data.profile.plan,
                rank: data.profile.rank,
                coins: data.profile.coins,
                selectedAchievements: achievements,
                token: data.token
            });

            AsyncStorage.setItem('astro_token', data.token);
            AsyncStorage.setItem('astro_user', data.profile.name);
            AsyncStorage.setItem('astro_rank', data.profile.rank);
            AsyncStorage.setItem('astro_plan', data.profile.plan);
            AsyncStorage.setItem('astro_selected_achievements', JSON.stringify(achievements));

            get().connectWebSocket();
            return { success: true };
        } catch (error: any) {
            set({ error: error.message });
            return { success: false, message: error.message };
        }
    },

    fetchUserStats: async () => {
        const { user } = get();
        if (!user) return { success: false, message: "No session" };
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(user)}/stats`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error stats");

            set({
                coins: data.coins !== undefined ? data.coins : get().coins,
                partides: data.gamesPlayed !== undefined ? data.gamesPlayed : get().partides
            });
            return { success: true, stats: data };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    fetchUserBalance: async () => {
        const { user } = get();
        if (!user) return { success: false, message: "No session" };
        try {
            const response = await fetch(`${API_BASE_URL}/api/shop/balance/${encodeURIComponent(user)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error balance");

            set({
                coins: data.coins !== undefined ? data.coins : get().coins,
                partides: data.gamesPlayed !== undefined ? data.gamesPlayed : get().partides
            });
            return { success: true, balance: data };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    registerCompletedGame: async (game, score = 0) => {
        const { user } = get();
        if (!user) return { success: false, message: "No session" };
        try {
            const response = await fetch(`${API_BASE_URL}/api/games/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, game, score })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error register game");

            set({
                coins: data.newBalance !== undefined ? data.newBalance : get().coins,
                partides: data.gamesPlayed !== undefined ? data.gamesPlayed : (get().partides + 1)
            });
            return { success: true, data };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    updateAchievements: async (achievements) => {
        const { user } = get();
        set({ selectedAchievements: achievements, error: null });
        AsyncStorage.setItem('astro_selected_achievements', JSON.stringify(achievements));

        if (!user) return { success: false, message: "Usuario no identificado" };

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/achievements`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, achievements })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Error al actualizar logros");
            }

            return { success: true };
        } catch (error: any) {
            set({ error: "Error al guardar en el servidor: " + error.message });
            return { success: false, message: error.message };
        }
    },

    updatePlan: async (planType) => {
        const { user } = get();
        set({ plan: planType, error: null });
        AsyncStorage.setItem('astro_plan', planType);

        if (!user) return { success: false, message: "Usuario no identificado" };

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/plan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, plan: planType })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Error al actualizar plan");
            }

            return { success: true };
        } catch (error: any) {
            set({ error: "Error al guardar plan: " + error.message });
            return { success: false, message: error.message };
        }
    },

    spinWheel: async () => {
        const { user } = get();
        if (!user) return { success: false, message: "No session" };
        try {
            const response = await fetch(`${API_BASE_URL}/api/shop/spin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Error al girar");

            set({ coins: data.newBalance !== undefined ? data.newBalance : get().coins });
            return { success: true, prize: data.prize, newBalance: data.newBalance };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    purchaseItem: async (itemId, price) => {
        const { user } = get();
        if (!user) return { success: false, message: "No session" };
        try {
            const response = await fetch(`${API_BASE_URL}/api/shop/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, itemId, price })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Compra fallida");

            set({ coins: data.newBalance !== undefined ? data.newBalance : get().coins });
            return { success: true, newBalance: data.newBalance };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    equipItem: async (itemId, category) => {
        const { user } = get();
        if (!user) return { success: false, message: "No session" };
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/equip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, itemId, category })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Error al equipar");

            // Optionally refetch stats or update local state if we track equipped items specifically
            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    connectWebSocket: () => {
        const { socket, user, plan, token } = get();
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

        const ws = new WebSocket(API_BASE_URL.replace('http', 'ws'));

        ws.onopen = () => {
            set({ isConnected: true, socket: ws });
            ws.send(JSON.stringify({
                type: 'IDENTIFY',
                user,
                plan,
                token
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

        ws.onclose = () => {
            set({ isConnected: false, socket: null });
            if (get().token) {
                setTimeout(() => get().connectWebSocket(), 5000);
            }
        };

        ws.onerror = (err) => {
            console.error("❌ Error WS:", err);
        };
    }
}));

export const hydrateStore = async () => {
    try {
        const keys = [
            'astro_user', 'astro_plan', 'astro_rank',
            'astro_selected_achievements', 'astro_avatar', 'astro_mascot', 'astro_token'
        ];
        const stores = await AsyncStorage.multiGet(keys);
        const data: any = {};
        stores.forEach(([key, value]) => {
            data[key] = value;
        });

        useAstroStore.setState({
            user: data.astro_user || null,
            plan: data.astro_plan || 'INDIVIDUAL_FREE',
            rank: data.astro_rank || null,
            selectedAchievements: data.astro_selected_achievements ? JSON.parse(data.astro_selected_achievements) : [null, null, null],
            avatar: data.astro_avatar || 'Astronauta_blanc.jpg',
            mascot: data.astro_mascot || null,
            token: data.astro_token || null
        });

        if (data.astro_token) {
            useAstroStore.getState().connectWebSocket();
        }
    } catch (e) {
        console.error("Error hydrating store", e);
    }
};
