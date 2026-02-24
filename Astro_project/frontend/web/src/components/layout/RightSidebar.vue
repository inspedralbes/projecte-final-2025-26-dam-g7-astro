<template>
    <v-navigation-drawer permanent location="right" width="240" class="sidebar right-sidebar" elevation="0"
        mobile-breakpoint="lg">
        <div class="d-flex flex-column h-100 pa-3">
            <!-- Stats Card -->
            <v-card class="glass-card mb-3 pa-3" elevation="0">
                <div class="d-flex justify-space-between align-center mb-2">
                    <div class="text-caption text-grey-lighten-1 font-weight-bold">PROGRESO</div>
                    <v-icon icon="mdi-chart-timeline-variant" color="cyan-accent-2" size="small"></v-icon>
                </div>
                <div class="d-flex justify-space-around">
                    <div class="text-center">
                        <v-icon :icon="isStreakActiveToday ? 'mdi-fire' : 'mdi-fire-off'"
                            :color="isStreakActiveToday ? 'orange-accent-3' : 'grey-darken-1'" size="large"
                            class="mb-0 glow-icon" :style="{ opacity: isStreakActiveToday ? 1 : 0.5 }"></v-icon>
                        <div class="text-h6 font-weight-bold text-white">{{ userStreak }}</div>
                        <div class="text-caption text-grey" style="font-size: 0.7rem !important;">Racha</div>
                    </div>
                    <div class="text-center">
                        <v-icon icon="mdi-circle-multiple-outline" color="yellow-accent-3" size="large"
                            class="mb-0 glow-icon"></v-icon>
                        <div class="text-h6 font-weight-bold text-white">{{ userCoins }}</div>
                        <div class="text-caption text-grey" style="font-size: 0.7rem !important;">Monedas</div>
                    </div>
                </div>
            </v-card>
            <v-card class="glass-card mb-3 pa-4" elevation="0">
                <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-subtitle-2 text-white font-weight-black">NIVEL {{ userLevel }}</span>
                    <span class="text-caption text-cyan-accent-3 font-weight-bold">{{ userXp }} / {{ xpRequired }}
                        XP</span>
                </div>
                <v-progress-linear :model-value="(userXp / Math.max(1, xpRequired)) * 100" color="cyan-accent-3"
                    height="10" rounded bg-color="rgba(255,255,255,0.1)" class="my-2 shadow-cyan"></v-progress-linear>
                <div class="text-caption text-grey text-center" style="font-size: 0.7rem !important; line-height: 1;">
                    Falten {{ Math.max(0, xpRequired - userXp) }} XP per al següent nivell
                </div>
            </v-card>

            <!-- Daily Missions -->
            <v-card class="glass-card pa-3 mb-3 flex-grow-1 d-flex flex-column" elevation="0">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-target" color="purple-accent-2" class="mr-2" size="small"></v-icon>
                        <span class="text-subtitle-2 text-white font-weight-bold">Misiones Diarias</span>
                    </div>
                    <div class="d-flex align-center">
                        <v-btn icon="mdi-refresh" variant="text" color="purple-accent-2" density="compact"
                            @click="refreshMissions" :loading="isRefreshing"></v-btn>
                        <v-btn icon="mdi-menu" variant="text" color="purple-accent-2" density="compact"
                            @click="dialogDiarias = true"></v-btn>
                    </div>
                </div>

                <v-list bg-color="transparent" class="pa-0 flex-grow-1 d-flex flex-column justify-center">
                    <div v-if="!dailyMissions || dailyMissions.length === 0"
                        class="text-caption text-grey text-center pa-2">
                        No hay misiones disponibles
                    </div>
                    <v-list-item v-for="mission in (dailyMissions || []).slice(0, 3)" :key="mission.id"
                        class="mission-item mb-2 pa-3 rounded-lg" density="comfortable">
                        <v-list-item-title
                            :class="['text-body-2 font-weight-bold', mission.claimed ? 'text-grey text-decoration-line-through' : 'text-white']">
                            {{ mission.text }}
                        </v-list-item-title>
                        <v-list-item-subtitle
                            :class="['text-caption mt-1', mission.claimed ? 'text-grey' : 'text-cyan-accent-1']"
                            style="font-size: 0.70rem !important;">
                            Progreso: {{ mission.progress }} / {{ mission.goal }}
                            <span class="ml-1 text-yellow-accent-3 font-weight-bold">+{{ mission.reward }}</span>
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn v-if="mission.completed && !mission.claimed" color="cyan-accent-2" variant="elevated"
                                density="compact" size="small" class="text-caption font-weight-bold rounded-pill"
                                @click.stop="claimReward(mission.id, 'daily')">
                                Reclamar
                            </v-btn>
                            <v-icon v-else-if="mission.claimed" icon="mdi-check-circle" color="cyan-accent-2"
                                size="small"></v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>

            <!-- Weekly Missions -->
            <v-card class="glass-card pa-3 flex-grow-1 d-flex flex-column" elevation="0">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-calendar-check" color="blue-accent-2" class="mr-2" size="small"></v-icon>
                        <span class="text-subtitle-2 text-white font-weight-bold">Misiones Semanales</span>
                    </div>
                    <v-btn icon="mdi-menu" variant="text" color="blue-accent-2" density="compact"
                        @click="dialogMisiones = true"></v-btn>
                </div>

                <v-list bg-color="transparent" class="pa-0 flex-grow-1 d-flex flex-column justify-center">
                    <div v-if="!weeklyMissions || weeklyMissions.length === 0"
                        class="text-caption text-grey text-center pa-2">
                        No hay misiones semanales disponibles
                    </div>
                    <v-list-item v-for="mission in (weeklyMissions || []).slice(0, 3)" :key="mission.id"
                        class="mission-item mb-2 pa-3 rounded-lg" density="comfortable">
                        <v-list-item-title
                            :class="['text-body-2 font-weight-bold', mission.claimed ? 'text-grey text-decoration-line-through' : 'text-white']">
                            {{ mission.text }}
                        </v-list-item-title>
                        <v-list-item-subtitle
                            :class="['text-caption mt-1', mission.claimed ? 'text-grey' : 'text-blue-accent-1']"
                            style="font-size: 0.70rem !important;">
                            Progreso: {{ mission.progress }} / {{ mission.goal }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn v-if="mission.completed && !mission.claimed" color="blue-accent-2" variant="elevated"
                                density="compact" size="small" class="text-caption font-weight-bold rounded-pill"
                                @click.stop="claimReward(mission.id, 'weekly')">
                                Claim
                            </v-btn>
                            <v-icon v-else-if="mission.claimed" icon="mdi-check-circle" color="blue-accent-2"
                                size="small"></v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>

        <!-- Daily Missions Dialog -->
        <v-dialog v-model="dialogDiarias" max-width="450" scrim="rgba(0,0,0,0.5)">
            <v-card class="glass-popup pa-5 shadow-xl">
                <div class="d-flex align-center justify-space-between mb-5">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-target" color="purple-accent-2" class="mr-2"></v-icon>
                        <span class="text-h5 text-white font-weight-bold">Misiones Diarias</span>
                    </div>
                    <v-btn icon="mdi-close" variant="text" color="white" @click="dialogDiarias = false"></v-btn>
                </div>
                <v-list bg-color="transparent" class="pa-0">
                    <v-list-item v-for="mission in dailyMissions" :key="mission.id"
                        class="mission-item mb-3 pa-4 rounded-xl">
                        <v-list-item-title
                            :class="['text-h6 font-weight-bold', mission.claimed ? 'text-grey text-decoration-line-through' : 'text-white']">
                            {{ mission.text }}
                        </v-list-item-title>
                        <v-list-item-subtitle
                            :class="['text-body-2 mt-1', mission.claimed ? 'text-grey' : 'text-cyan-accent-1']">
                            Progreso Actual: {{ mission.progress }} / {{ mission.goal }}
                            <span class="ml-2 text-yellow-accent-3 font-weight-bold">+{{ mission.reward }}
                                monedas</span>
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn v-if="mission.completed && !mission.claimed" color="purple-accent-2"
                                variant="elevated" class="font-weight-bold rounded-pill px-6"
                                @click="claimReward(mission.id, 'daily')">
                                RECLAMAR
                            </v-btn>
                            <v-icon v-else-if="mission.claimed" icon="mdi-check-circle" color="purple-accent-2"
                                size="large"></v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-dialog>

        <!-- Weekly Missions Dialog -->
        <v-dialog v-model="dialogMisiones" max-width="450" scrim="rgba(0,0,0,0.5)">
            <v-card class="glass-popup pa-5 shadow-xl">
                <div class="d-flex align-center justify-space-between mb-5">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-calendar-check" color="blue-accent-2" class="mr-2"></v-icon>
                        <span class="text-h5 text-white font-weight-bold">Misiones Semanales</span>
                    </div>
                    <v-btn icon="mdi-close" variant="text" color="white" @click="dialogMisiones = false"></v-btn>
                </div>

                <v-list bg-color="transparent" class="pa-0">
                    <v-list-item v-for="mission in weeklyMissions" :key="mission.id"
                        class="mission-item mb-3 pa-4 rounded-xl">
                        <v-list-item-title
                            :class="['text-h6 font-weight-bold', mission.claimed ? 'text-grey text-decoration-line-through' : 'text-white']">
                            {{ mission.text }}
                        </v-list-item-title>
                        <v-list-item-subtitle
                            :class="['text-body-2 mt-1', mission.claimed ? 'text-grey' : 'text-blue-accent-1']">
                            Progreso Actual: {{ mission.progress }} / {{ mission.goal }}
                            <span class="ml-2 text-yellow-accent-3 font-weight-bold">+{{ mission.reward }}
                                monedas</span>
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn v-if="mission.completed && !mission.claimed" color="blue-accent-2" variant="elevated"
                                class="font-weight-bold rounded-pill px-6" @click="claimReward(mission.id, 'weekly')">
                                RECLAMAR
                            </v-btn>
                            <v-icon v-else-if="mission.claimed" icon="mdi-check-circle" color="blue-accent-2"
                                size="large"></v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-dialog>
    </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAstroStore } from '@/stores/astroStore'

const astroStore = useAstroStore()

// CORRECCIÓN: Extraemos correctamente las misiones, stats y el getter de racha
const { 
    dailyMissions, 
    weeklyMissions, 
    coins: userCoins, 
    level: userLevel, 
    xp: userXp,
    streak: userStreak, // Mapeamos 'streak' del store a 'userStreak'
    isStreakActiveToday // El getter reactivo
} = storeToRefs(astroStore)

watch(dailyMissions, (newVal) => {
    console.log("👀 [Sidebar] Cambio en misiones diarias:", newVal?.length);
}, { deep: true })

onMounted(async () => {
    if (astroStore.user) {
        // Al montar, pedimos las stats que ahora incluyen las misiones
        await astroStore.fetchUserStats()
        await astroStore.fetchUserBalance()
        // También pedimos la lista de amigos si la necesitas aquí
        await astroStore.fetchAllUsers()
    }
})

const xpRequired = computed(() => {
    return 100 + (userLevel.value - 1) * 50;
})

const dialogMisiones = ref(false)
const dialogDiarias = ref(false)
const isRefreshing = ref(false)

const refreshMissions = async () => {
    isRefreshing.value = true
    try {
        await astroStore.fetchUserStats()
        console.log("♻️ [Sidebar] Sincronización completada");
    } finally {
        isRefreshing.value = false
    }
}

const claimReward = async (missionId, type = 'daily') => {
    const result = await astroStore.claimMissionReward(missionId, type)
    if (result.success) {
        console.log("Recompensa reclamada:", result.message)
    }
}
</script>

<style scoped>
.shadow-cyan {
    filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.4));
}

.sidebar {
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(10px);
    border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.glass-card {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
}

.glass-popup {
    background: rgba(15, 15, 25, 0.9) !important;
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5) !important;
}

.mission-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.glow-icon {
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
}
</style>
