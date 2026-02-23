<template>
    <div class="scroll-container">
        <v-container fluid class="pa-8">
            <div class="header mb-16 text-center">
                <h1 class="text-h2 font-weight-bold text-white mb-4 tracking-wide">LOGROS</h1>
                <p class="text-h6 text-cyan-accent-1 opacity-75">Tus condecoraciones en la flota estelar</p>
            </div>

            <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
                <v-progress-circular indeterminate color="cyan-accent-3" size="64"></v-progress-circular>
            </div>

            <v-row v-else class="mt-8 pb-16">
                <v-col v-for="achievement in processedAchievements" :key="achievement.id" cols="12" sm="6" md="4" lg="3"
                    class="d-flex justify-center flex-column align-center mb-10">

                    <Medal :type="achievement.type" :icon="achievement.icon" :locked="!achievement.unlocked" />

                    <div class="medal-info text-center mt-4">
                        <h3
                            :class="['text-h6 font-weight-bold mb-1', achievement.unlocked ? 'text-white' : 'text-grey-darken-1']">
                            {{ achievement.title }}
                        </h3>
                        <p class="text-caption text-grey-lighten-1"
                            :style="{ opacity: achievement.unlocked ? 1 : 0.5 }">
                            {{ achievement.description }}
                        </p>

                        <div class="mt-2">
                            <v-chip v-if="achievement.id === 1 && !achievement.unlocked" size="x-small" color="orange"
                                variant="tonal">
                                {{ astroStore.coins }} / 1000 Monedas
                            </v-chip>
                            <v-chip v-if="achievement.id === 2 && !achievement.unlocked" size="x-small" color="blue"
                                variant="tonal">
                                {{ astroStore.partides }} / 5 Partidas
                            </v-chip>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ACHIEVEMENTS } from '@/constants/achievements'
import Medal from '@/components/achievements/Medal.vue'
import { useAstroStore } from '@/stores/astroStore'

const astroStore = useAstroStore()
const loading = ref(false)
const loadError = ref(null)

onMounted(async () => {
    loading.value = true
    try {
        // Traemos datos frescos del servidor
        await Promise.all([
            astroStore.fetchUserStats(),
            astroStore.fetchUserInventory()
        ])
    } catch (err) {
        console.error("Error de sincronización:", err)
        loadError.value = "No se pudo sincronizar con la base de mando."
    } finally {
        loading.value = false
    }
})

const processedAchievements = computed(() => {
    // Definimos los umbrales de victoria para facilitar el mantenimiento
    const THRESHOLDS = {
        COINS: 1000,
        GAMES: 5,
        INVENTORY: 3
    }

    return ACHIEVEMENTS.map(achievement => {
        let isUnlocked = false;

        // Usamos >= para asegurar que si tienen 1000 o 1,000,000 se desbloquee igual
        switch (achievement.id) {
            case 1: // Cazador de Monedas
                isUnlocked = (astroStore.coins || 0) >= THRESHOLDS.COINS;
                break;
            case 2: // Piloto Novato
                isUnlocked = (astroStore.partides || 0) >= THRESHOLDS.GAMES;
                break;
            case 3: // Coleccionista
                // Verificamos que inventory exista antes de leer su longitud
                isUnlocked = (astroStore.inventory?.length || 0) >= THRESHOLDS.INVENTORY;
                break;
            default:
                isUnlocked = false;
        }

        return {
            ...achievement,
            unlocked: isUnlocked,
            // Añadimos el progreso actual para mostrarlo en la UI si fuera necesario
            progress: achievement.id === 1 ? astroStore.coins :
                achievement.id === 2 ? astroStore.partides :
                    astroStore.inventory?.length || 0
        }
    })
})
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
}

.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
