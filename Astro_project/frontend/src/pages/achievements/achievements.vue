<template>
    <v-container fluid class="pa-8">
        <div class="header mb-16 text-center">
            <h1 class="text-h2 font-weight-bold text-white mb-4 tracking-wide">MEDALLAS DE HONOR</h1>
            <p class="text-h6 text-cyan-accent-1 opacity-75">Tus condecoraciones en la flota estelar</p>
            <div class="d-flex justify-center flex-wrap ga-2 mt-4">
                <v-chip color="cyan-accent-3" variant="outlined">Partidas: {{ stats.gamesPlayed }}</v-chip>
                <v-chip color="amber-accent-3" variant="outlined">Monedas: {{ stats.coins }}</v-chip>
                <v-chip color="green-accent-3" variant="outlined">Inventario: {{ stats.inventoryCount }}</v-chip>
            </div>
        </div>

        <v-alert v-if="loadError" type="warning" variant="tonal" class="mb-8">
            {{ loadError }}
        </v-alert>

        <div v-if="loading" class="d-flex justify-center mb-8">
            <v-progress-circular indeterminate color="cyan-accent-3"></v-progress-circular>
        </div>

        <v-row class="mt-8">
            <v-col v-for="achievement in achievements" :key="achievement.id" cols="12" sm="6" md="4" lg="3"
                class="d-flex justify-center">
                <div :class="['medal-container', { 'locked': !achievement.unlocked }]">
                    <!-- Ribbon -->
                    <div :class="['ribbon', achievement.type]"></div>

                    <!-- Medal Body -->
                    <div :class="['medal-body', achievement.type]">
                        <div class="medal-shine"></div>
                        <div class="medal-content d-flex flex-column align-center justify-center">
                            <v-icon :icon="achievement.unlocked ? achievement.icon : 'mdi-lock'" size="48"
                                :color="achievement.unlocked ? 'white' : 'grey-lighten-2'"></v-icon>
                        </div>
                        <div class="medal-border"></div>
                    </div>

                    <!-- Medal Info -->
                    <div class="medal-info text-center mt-4">
                        <h3 class="text-h6 font-weight-bold text-white mb-1">{{ achievement.title }}</h3>
                        <p class="text-caption text-grey-lighten-1">{{ achievement.description }}</p>
                        <p class="text-caption text-cyan-accent-2 mt-1">{{ achievement.progress }}</p>
                    </div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAstroStore } from '@/stores/astroStore'

const astroStore = useAstroStore();
const loading = ref(false);
const loadError = ref('');
const stats = ref({
    gamesPlayed: astroStore.partides || 0,
    coins: astroStore.coins || 0,
    inventoryCount: 0
});

const achievements = computed(() => ([
    {
        id: 1,
        title: 'Primer Vuelo',
        description: 'Completa tu primera misión.',
        icon: 'mdi-rocket-launch',
        unlocked: stats.value.gamesPlayed >= 1,
        type: 'bronze',
        progress: `${Math.min(stats.value.gamesPlayed, 1)}/1`
    },
    {
        id: 2,
        title: 'As de la Flota',
        description: 'Completa 10 partidas.',
        icon: 'mdi-star-shooting',
        unlocked: stats.value.gamesPlayed >= 10,
        type: 'gold',
        progress: `${Math.min(stats.value.gamesPlayed, 10)}/10`
    },
    {
        id: 3,
        title: 'Comerciante',
        description: 'Consigue tu primer objeto de inventario.',
        icon: 'mdi-cart-heart',
        unlocked: stats.value.inventoryCount >= 1,
        type: 'silver',
        progress: `${Math.min(stats.value.inventoryCount, 1)}/1`
    },
    {
        id: 4,
        title: 'Veterano',
        description: 'Completa 25 partidas.',
        icon: 'mdi-shield-star',
        unlocked: stats.value.gamesPlayed >= 25,
        type: 'gold',
        progress: `${Math.min(stats.value.gamesPlayed, 25)}/25`
    },
    {
        id: 5,
        title: 'Cazador',
        description: 'Acumula 2500 monedas.',
        icon: 'mdi-currency-usd-circle',
        unlocked: stats.value.coins >= 2500,
        type: 'silver',
        progress: `${Math.min(stats.value.coins, 2500)}/2500`
    }
]));

onMounted(async () => {
    if (!astroStore.user) {
        loadError.value = 'Inicia sesión para ver tus logros reales.';
        return;
    }

    loading.value = true;
    const result = await astroStore.fetchUserStats();

    if (result.success) {
        stats.value = {
            gamesPlayed: result.stats.gamesPlayed || 0,
            coins: result.stats.coins || 0,
            inventoryCount: result.stats.inventoryCount || 0
        };
    } else {
        loadError.value = result.message || 'No se pudieron cargar las estadísticas.';
    }

    loading.value = false;
});
</script>

<style scoped>
.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.medal-container {
    width: 200px;
    cursor: default;
    position: relative;
    padding-top: 40px;
}

.medal-container.locked {
    filter: grayscale(1) brightness(0.7);
    opacity: 0.6;
}

/* Medal Body */
.medal-body {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    margin: 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2);
    z-index: 2;
}

.medal-content {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    z-index: 3;
}

.medal-border {
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.2);
    pointer-events: none;
}

/* Metallic Gradients */
.gold {
    background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b 80%);
    border: 1px solid #ffec8b;
}

.silver {
    background: radial-gradient(circle at 30% 30%, #e0e0e0, #757575 80%);
    border: 1px solid #ffffff;
}

.bronze {
    background: radial-gradient(circle at 30% 30%, #cd7f32, #8b4513 80%);
    border: 1px solid #ffa07a;
}

/* Ribbon */
.ribbon {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 80px;
    z-index: 1;
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);
}

.ribbon.gold {
    background: linear-gradient(to bottom, #d32f2f, #b71c1c);
    border-top: 5px solid #ffeb3b;
}

.ribbon.silver {
    background: linear-gradient(to bottom, #1976d2, #0d47a1);
    border-top: 5px solid #90caf9;
}

.ribbon.bronze {
    background: linear-gradient(to bottom, #388e3c, #1b5e20);
    border-top: 5px solid #a5d6a7;
}

/* Shine Effect */
.medal-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    pointer-events: none;
    z-index: 4;
}
</style>
