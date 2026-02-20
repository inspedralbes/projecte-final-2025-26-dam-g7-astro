import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AstroState {
    user: string | null;
    plan: string;
    rank: string | null;
    coins: number;
    selectedAchievements: (number | null)[];
    avatar: string;
    mascot: string | null;
    token: string | null;
    isConnected: boolean;
    error: string | null;

    setUser: (user: string | null) => void;
    setPlan: (plan: string) => void;
    setRank: (rank: string | null) => void;
    setCoins: (coins: number) => void;
    setSelectedAchievements: (achievements: (number | null)[]) => void;
    updateAvatar: (avatar: string) => void;
    updateMascot: (mascot: string | null) => void;
    logout: () => void;

    // Actions mirroring the web store
    updateAchievements: (achievements: (number | null)[]) => Promise<{ success: boolean; message?: string }>;
}

export const useAstroStore = create<AstroState>((set, get) => ({
    user: null,
    plan: 'INDIVIDUAL_FREE',
    rank: null,
    coins: 0,
    selectedAchievements: [null, null, null],
    avatar: 'Astronauta_blanc.jpg',
    mascot: null,
    token: null,
    isConnected: false,
    error: null,

    setUser: (user) => set({ user }),
    setPlan: (plan) => set({ plan }),
    setRank: (rank) => set({ rank }),
    setCoins: (coins) => set({ coins }),
    setSelectedAchievements: (selectedAchievements) => set({ selectedAchievements }),

    updateAvatar: (avatar) => {
        set({ avatar });
        AsyncStorage.setItem('astro_avatar', avatar);
    },

    updateMascot: (mascot) => {
        set({ mascot });
        AsyncStorage.setItem('astro_mascot', mascot || '');
    },

    logout: () => {
        set({
            user: null,
            plan: 'INDIVIDUAL_FREE',
            rank: null,
            coins: 0,
            selectedAchievements: [null, null, null],
            avatar: 'Astronauta_blanc.jpg',
            mascot: null,
            token: null,
            isConnected: false,
            error: null
        });
        AsyncStorage.multiRemove([
            'astro_token', 'astro_user', 'astro_rank', 'astro_plan',
            'astro_selected_achievements', 'astro_avatar', 'astro_mascot'
        ]);
    },

    updateAchievements: async (achievements) => {
        const { user } = get();
        set({ selectedAchievements: achievements, error: null });
        await AsyncStorage.setItem('astro_selected_achievements', JSON.stringify(achievements));

        if (!user) {
            set({ error: "Usuario no identificado. Los cambios se guardarán localmente." });
            return { success: false, message: "Usuario no identificado" };
        }

        try {
            const response = await fetch('http://localhost:3000/api/user/achievements', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: user,
                    achievements: achievements
                })
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
    }
}));

// Helper to hydrate store from AsyncStorage
export const hydrateStore = async () => {
    try {
        const [
            [, user],
            [, plan],
            [, rank],
            [, achievements],
            [, avatar],
            [, mascot],
            [, token]
        ] = await AsyncStorage.multiGet([
            'astro_user', 'astro_plan', 'astro_rank',
            'astro_selected_achievements', 'astro_avatar', 'astro_mascot', 'astro_token'
        ]);

        useAstroStore.setState({
            user: user || null,
            plan: plan || 'INDIVIDUAL_FREE',
            rank: rank || null,
            selectedAchievements: achievements ? JSON.parse(achievements) : [null, null, null],
            avatar: avatar || 'Astronauta_blanc.jpg',
            mascot: mascot || null,
            token: token || null
        });
    } catch (e) {
        console.error("Error hydrating store", e);
    }
};
