<template>
    <div class="scroll-container">
        <v-container fluid class="pa-8">
            <!-- Header Section -->
            <div class="header mb-12 text-center">
                <div class="d-flex justify-center align-center mb-4">
                    <v-icon icon="mdi-trophy-outline" color="cyan-accent-2" size="48" class="mr-4"></v-icon>
                    <h1 class="text-h2 font-weight-bold text-white tracking-wide">LOGROS</h1>
                    <v-icon icon="mdi-trophy-outline" color="cyan-accent-2" size="48" class="ml-4"></v-icon>
                </div>
                <p class="text-h6 text-cyan-lighten-4 opacity-75">Tus condecoraciones y méritos en la exploración espacial</p>
            </div>

            <!-- Stats Overview -->
            <v-row v-if="!loading" class="mb-12 justify-center">
                <v-col cols="12" md="10">
                    <v-card variant="tonal" class="stats-card pa-6">
                        <v-row align="center">
                            <v-col cols="12" sm="4" class="text-center">
                                <div class="text-overline text-cyan-accent-1">Completado</div>
                                <div class="text-h3 font-weight-black text-white">
                                    {{ unlockedCount }}<span class="text-h5 text-grey">/{{ totalCount }}</span>
                                </div>
                                <v-progress-linear
                                    :model-value="completionPercentage"
                                    color="cyan-accent-2"
                                    height="8"
                                    rounded
                                    class="mt-4 mx-auto"
                                    style="max-width: 150px;"
                                ></v-progress-linear>
                            </v-col>
                            <v-col cols="12" sm="8">
                                <v-row>
                                    <v-col v-for="type in ['bronze', 'silver', 'gold', 'platinum']" :key="type" cols="6" sm="3" class="text-center">
                                        <div :class="['text-caption text-uppercase font-weight-bold mb-1', type + '-text']">{{ type }}</div>
                                        <div class="text-h5 text-white">{{ countByType(type) }}</div>
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-col>
            </v-row>

            <v-alert
                v-if="loadError"
                type="warning"
                variant="tonal"
                color="orange-lighten-1"
                class="mb-8"
            >
                {{ loadError }}
            </v-alert>

            <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
                <div class="loading-scanner">
                    <v-progress-circular indeterminate color="cyan-accent-3" size="80" width="8"></v-progress-circular>
                    <div class="text-overline mt-4 text-cyan-accent-1">Sincronizando Archivos...</div>
                </div>
            </div>

            <!-- Achievements Grid -->
            <v-row v-else class="mt-8 pb-16">
                <v-col v-for="achievement in processedAchievements" :key="achievement.id" cols="12" sm="6" md="4" lg="3"
                    class="d-flex justify-center">
                    
                    <v-card class="achievement-card" :class="{ 'card-locked': !achievement.unlocked }" variant="flat">
                        <div class="medal-wrapper">
                            <Medal :type="achievement.type" :icon="achievement.icon" :locked="!achievement.unlocked" />
                        </div>

                        <div class="achievement-info pa-4">
                            <h3 :class="['text-h6 font-weight-bold mb-1', achievement.unlocked ? 'text-white' : 'text-grey-darken-1']">
                                {{ achievement.title }}
                            </h3>
                            <p class="achievement-description text-body-2 mb-4">
                                {{ achievement.description }}
                            </p>

                            <div class="progress-section">
                                <div class="d-flex justify-space-between text-caption mb-1">
                                    <span :class="achievement.unlocked ? 'text-cyan-accent-1' : 'text-grey'">{{ achievement.metricLabel }}</span>
                                    <span class="text-white">{{ achievement.progress }} / {{ achievement.goal }}</span>
                                </div>
                                <v-progress-linear
                                    :model-value="achievement.progressPct"
                                    :color="achievement.unlocked ? 'green-accent-3' : 'cyan-accent-2'"
                                    bg-color="rgba(255,255,255,0.05)"
                                    height="6"
                                    rounded
                                />
                                <div class="mt-3 text-center">
                                    <v-chip 
                                        v-if="achievement.unlocked" 
                                        size="x-small" 
                                        color="green-accent-3" 
                                        variant="tonal"
                                        prepend-icon="mdi-check-decagram"
                                        class="text-uppercase font-weight-bold"
                                    >
                                        Conseguido
                                    </v-chip>
                                    <v-chip 
                                        v-else 
                                        size="x-small" 
                                        color="blue-grey-lighten-2" 
                                        variant="outlined"
                                        class="text-uppercase font-weight-bold"
                                    >
                                        Bloqueado
                                    </v-chip>
                                </div>
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Medal from '@/components/achievements/Medal.vue'
import { useAstroStore } from '@/stores/astroStore'
import { ACHIEVEMENTS as ACHIEVEMENT_DEFINITIONS } from '@/constants/achievements'

const astroStore = useAstroStore()
const loading = ref(false)
const loadError = ref(null)
const readyToSync = ref(false)
const syncingUnlocked = ref(false)

const playerMetrics = computed(() => ({
    coins: Number(astroStore.coins) || 0,
    games: Number(astroStore.partides) || 0,
    inventory: Number(astroStore.inventoryUnits) || 0,
    level: Number(astroStore.level) || 1,
    xp: Number(astroStore.xp) || 0,
    missions: Number(astroStore.missionsCompleted) || 0
}))

onMounted(async () => {
    loading.value = true
    try {
        const [statsResult, , achievementsResult] = await Promise.all([
            astroStore.fetchUserStats(),
            astroStore.fetchUserInventory(),
            astroStore.fetchUserAchievements()
        ])

        if (statsResult?.success === false || achievementsResult?.success === false) {
            loadError.value = "No se pudo sincronizar completamente con MongoDB Atlas."
        } else {
            loadError.value = null
        }
    } catch (err) {
        console.error("Error de sincronización:", err)
        loadError.value = "No se pudo sincronizar con la base de mando."
    } finally {
        loading.value = false
        readyToSync.value = true
        void syncUnlockedAchievementsIfNeeded(unlockedAchievementIds.value)
    }
})

const processedAchievements = computed(() => {
    const unlockedFromDb = new Set(astroStore.unlockedAchievements || [])

    return ACHIEVEMENT_DEFINITIONS.map(achievement => {
        const currentValue = playerMetrics.value[achievement.metric] || 0
        const unlockedByProgress = currentValue >= achievement.goal
        const unlocked = unlockedByProgress || unlockedFromDb.has(achievement.id)
        const progress = Math.min(currentValue, achievement.goal)
        const progressPct = Math.round((progress / achievement.goal) * 100)

        return {
            ...achievement,
            unlocked,
            progress,
            progressPct
        }
    })
})

const unlockedCount = computed(() => processedAchievements.value.filter(a => a.unlocked).length)
const totalCount = computed(() => ACHIEVEMENT_DEFINITIONS.length)
const completionPercentage = computed(() => (unlockedCount.value / totalCount.value) * 100)

const countByType = (type) => {
    return processedAchievements.value.filter(a => a.type === type && a.unlocked).length
}

const unlockedAchievementIds = computed(() => {
    return processedAchievements.value
        .filter(achievement => achievement.unlocked)
        .map(achievement => achievement.id)
        .sort((a, b) => a - b)
})

function idsToKey(ids = []) {
    return ids.join(',')
}

async function syncUnlockedAchievementsIfNeeded(nextIds) {
    if (!readyToSync.value || syncingUnlocked.value || !astroStore.user) return

    const storedIds = [...(astroStore.unlockedAchievements || [])].sort((a, b) => a - b)
    if (idsToKey(nextIds) === idsToKey(storedIds)) return

    syncingUnlocked.value = true
    try {
        await astroStore.syncUnlockedAchievements(nextIds)
    } finally {
        syncingUnlocked.value = false
    }
}

watch(unlockedAchievementIds, (nextIds) => {
    void syncUnlockedAchievementsIfNeeded(nextIds)
})
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background: radial-gradient(circle at top center, #0a192f 0%, #020617 100%);
}

.tracking-wide {
    letter-spacing: 0.2em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stats-card {
    background: rgba(10, 25, 47, 0.6) !important;
    border: 1px solid rgba(0, 229, 255, 0.2) !important;
    border-radius: 20px !important;
    backdrop-filter: blur(10px);
}

.bronze-text { color: #cd7f32; }
.silver-text { color: #bdc3c7; }
.gold-text { color: #fbc02d; }
.platinum-text { color: #00acc1; }

.achievement-card {
    width: 280px;
    background: rgba(30, 41, 59, 0.4) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 24px !important;
    overflow: visible !important;
    transition: all 0.3s ease;
    margin-top: 40px;
}

.achievement-card:hover {
    transform: translateY(-10px);
    background: rgba(30, 41, 59, 0.7) !important;
    border-color: rgba(0, 229, 255, 0.3) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-locked {
    filter: saturate(0.5);
}

.medal-wrapper {
    margin-top: -60px;
    display: flex;
    justify-content: center;
}

.achievement-description {
    color: rgba(255, 255, 255, 0.5);
    height: 40px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.loading-scanner {
    text-align: center;
}
</style>
