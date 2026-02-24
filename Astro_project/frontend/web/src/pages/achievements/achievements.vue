<template>
    <div class="scroll-container">
        <v-container fluid class="pa-8">
            <div class="header mb-16 text-center">
                <h1 class="text-h2 font-weight-bold text-white mb-4 tracking-wide">LOGROS</h1>
                <p class="text-h6 text-cyan-accent-1 opacity-75">Tus condecoraciones en la flota estelar</p>
            </div>

            <v-alert
                v-if="loadError"
                type="warning"
                variant="tonal"
                color="orange-lighten-1"
                class="mb-8"
            >
                {{ loadError }}
            </v-alert>

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

                        <div class="mt-2 d-flex flex-column align-center">
                            <v-progress-linear
                                :model-value="achievement.progressPct"
                                color="cyan-accent-2"
                                bg-color="blue-grey-darken-4"
                                height="6"
                                rounded
                                style="width: 150px;"
                            />
                            <v-chip v-if="!achievement.unlocked" size="x-small" color="cyan-accent-1" variant="tonal" class="mt-2">
                                {{ achievement.progress }} / {{ achievement.goal }} {{ achievement.metricLabel }}
                            </v-chip>
                            <v-chip v-else size="x-small" color="green-accent-3" variant="tonal" class="mt-2">
                                Desbloqueado
                            </v-chip>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Medal from '@/components/achievements/Medal.vue'
import { useAstroStore } from '@/stores/astroStore'
import { ACHIEVEMENTS } from '@/constants/achievements'

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
    xp: Number(astroStore.xp) || 0
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

    return ACHIEVEMENTS.map(achievement => {
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
}

.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
