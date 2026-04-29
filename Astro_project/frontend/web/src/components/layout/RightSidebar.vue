<template>
    <v-navigation-drawer app permanent location="right" width="280" class="sidebar right-sidebar" elevation="0"
        mobile-breakpoint="lg">
        <div class="d-flex flex-column h-100 pa-4">
            <!-- Stats Section -->
            <div class="section-label mb-4">ESTADO DEL PILOTO</div>
            
            <v-card class="glass-card mb-4 pa-4" elevation="0">
                <div class="d-flex justify-space-around align-center">
                    <div class="text-center">
                        <div class="stat-value text-h5 font-weight-bold" :class="isStreakActiveToday ? 'text-orange-accent-3' : 'text-grey'">
                            {{ userStreak }}
                        </div>
                        <div class="stat-label">RACHA</div>
                    </div>
                    <v-divider vertical class="mx-2 border-opacity-25" color="white"></v-divider>
                    <div class="text-center">
                        <div class="stat-value text-h5 font-weight-bold text-yellow-accent-3">
                            {{ userCoins }}
                        </div>
                        <div class="stat-label">CRÉDITOS</div>
                    </div>
                </div>
            </v-card>

            <v-card class="glass-card mb-6 pa-4" elevation="0">
                <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption font-weight-black text-primary">NIVEL {{ userLevel }}</span>
                    <span class="text-caption text-grey-lighten-1">{{ userXp }} / {{ xpRequired }} XP</span>
                </div>
                <v-progress-linear :model-value="(userXp / Math.max(1, xpRequired)) * 100" color="primary"
                    height="8" rounded bg-color="rgba(0, 242, 255, 0.15)" bg-opacity="1" class="mb-2 glow-bar"></v-progress-linear>
            </v-card>

            <!-- Daily Missions Section -->
            <div class="d-flex align-center justify-space-between mb-4">
                <div class="section-label">MISIONES DIARIAS</div>
                <v-btn icon="mdi-refresh" variant="text" color="primary" density="compact" @click="refreshMissions" :loading="isRefreshing"></v-btn>
            </div>

            <div class="missions-container flex-grow-1 overflow-y-auto pr-2">
                <div v-if="!dailyMissions || dailyMissions.length === 0" class="text-caption text-grey text-center py-4">
                    Sincronizando con la base...
                </div>
                
                <v-card v-for="mission in (dailyMissions || []).slice(0, 3)" :key="mission.id"
                    class="mission-card mb-3 pa-3" :class="{ 'mission-claimed': mission.claimed }">
                    <div class="d-flex justify-space-between align-start mb-1">
                        <div class="mission-text text-body-2 font-weight-bold" :class="{ 'text-grey': mission.claimed }">
                            {{ mission.text }}
                        </div>
                        <v-icon v-if="mission.claimed" icon="mdi-check-circle" color="success" size="small"></v-icon>
                    </div>
                    
                    <div class="d-flex justify-space-between align-center mt-2">
                        <div class="text-caption text-primary">
                            {{ mission.progress }} / {{ mission.goal }}
                        </div>
                        <v-btn v-if="mission.completed && !mission.claimed" color="primary" variant="flat"
                            density="compact" size="small" class="px-3" @click.stop="claimReward(mission.id, 'daily')">
                            RECLAMAR
                        </v-btn>
                    </div>
                </v-card>
            </div>

            <v-btn block variant="text" color="primary" class="mt-2 mb-4 text-caption font-weight-bold" @click="dialogDiarias = true">
                VER TODAS LAS DIARIAS
            </v-btn>

            <!-- Weekly Missions Section -->
            <div class="d-flex align-center justify-space-between mb-4 mt-2">
                <div class="section-label">MISIONES SEMANALES</div>
                <v-icon icon="mdi-calendar-clock" color="secondary" size="small"></v-icon>
            </div>

            <div class="missions-container overflow-y-auto pr-2" style="max-height: 200px;">
                <div v-if="!weeklyMissions || weeklyMissions.length === 0" class="text-caption text-grey text-center py-4">
                    No hay misiones semanales...
                </div>
                
                <v-card v-for="mission in (weeklyMissions || []).slice(0, 2)" :key="mission.id"
                    class="mission-card mb-3 pa-3 border-secondary" :class="{ 'mission-claimed': mission.claimed }">
                    <div class="d-flex justify-space-between align-start mb-1">
                        <div class="mission-text text-body-2 font-weight-bold" :class="{ 'text-grey': mission.claimed }">
                            {{ mission.text }}
                        </div>
                        <v-icon v-if="mission.claimed" icon="mdi-check-circle" color="secondary" size="small"></v-icon>
                    </div>
                    
                    <div class="d-flex justify-space-between align-center mt-2">
                        <div class="text-caption text-secondary">
                            {{ mission.progress }} / {{ mission.goal }}
                        </div>
                        <v-btn v-if="mission.completed && !mission.claimed" color="secondary" variant="flat"
                            density="compact" size="small" class="px-3" @click.stop="claimReward(mission.id, 'weekly')">
                            RECLAMAR
                        </v-btn>
                    </div>
                </v-card>
            </div>

            <v-btn block variant="text" color="secondary" class="mt-2 text-caption font-weight-bold" @click="dialogMisiones = true">
                VER TODAS LAS SEMANALES
            </v-btn>
        </div>

        <!-- Popups -->
        <v-dialog v-model="dialogDiarias" max-width="450">
            <v-card class="glass-panel pa-6">
                <div class="d-flex align-center justify-space-between mb-6">
                    <h2 class="text-h5 text-white">MISIONES DIARIAS</h2>
                    <v-btn icon="mdi-close" variant="text" @click="dialogDiarias = false"></v-btn>
                </div>
                <v-list bg-color="transparent" class="pa-0">
                    <v-card v-for="mission in dailyMissions" :key="mission.id" class="glass-card mb-3 pa-4">
                        <div class="text-h6 mb-1" :class="{ 'text-grey text-decoration-line-through': mission.claimed }">{{ mission.text }}</div>
                        <div class="d-flex justify-space-between align-center">
                            <span class="text-primary">{{ mission.progress }} / {{ mission.goal }}</span>
                            <v-btn v-if="mission.completed && !mission.claimed" color="primary" @click="claimReward(mission.id, 'daily')">COBRAR</v-btn>
                        </div>
                    </v-card>
                </v-list>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogMisiones" max-width="450">
            <v-card class="glass-panel pa-6">
                <div class="d-flex align-center justify-space-between mb-6">
                    <h2 class="text-h5 text-white">MISIONES SEMANALES</h2>
                    <v-btn icon="mdi-close" variant="text" @click="dialogMisiones = false"></v-btn>
                </div>
                <v-list bg-color="transparent" class="pa-0">
                    <v-card v-for="mission in weeklyMissions" :key="mission.id" class="glass-card mb-3 pa-4">
                        <div class="text-h6 mb-1" :class="{ 'text-grey text-decoration-line-through': mission.claimed }">{{ mission.text }}</div>
                        <div class="d-flex justify-space-between align-center">
                            <span class="text-secondary">{{ mission.progress }} / {{ mission.goal }}</span>
                            <v-btn v-if="mission.completed && !mission.claimed" color="secondary" @click="claimReward(mission.id, 'weekly')">COBRAR</v-btn>
                        </div>
                    </v-card>
                </v-list>
            </v-card>
        </v-dialog>
    </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAstroStore } from '@/stores/astroStore'
import { useProgressStore } from '@/stores/progressStore'

const astroStore = useAstroStore()
const progressStore = useProgressStore()

const { 
    dailyMissions, 
    weeklyMissions, 
    coins: userCoins, 
    level: userLevel, 
    xp: userXp,
    streak: userStreak,
    isStreakActiveToday
} = storeToRefs(progressStore)

onMounted(async () => {
    if (astroStore.user) {
        await astroStore.fetchUserStats()
        await astroStore.fetchUserBalance()
        await astroStore.fetchAllUsers()
    }
})

const xpRequired = computed(() => 100 + (userLevel.value - 1) * 50)
const dialogDiarias = ref(false)
const dialogMisiones = ref(false)
const isRefreshing = ref(false)

const refreshMissions = async () => {
    isRefreshing.value = true
    try { await astroStore.fetchUserStats() } finally { isRefreshing.value = false }
}

const claimReward = async (missionId, type = 'daily') => {
    await astroStore.claimMissionReward(missionId, type)
}
</script>

<style scoped>
.sidebar {
    background: linear-gradient(180deg, rgba(13, 25, 48, 0.7) 0%, rgba(5, 10, 20, 0.8) 100%) !important;
    backdrop-filter: blur(25px);
    border-left: 1px solid rgba(0, 242, 255, 0.1) !important;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
}

.section-label {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.4);
}

.stat-value {
    font-family: 'Orbitron', sans-serif;
    letter-spacing: 1px;
}

.stat-label {
    font-size: 0.65rem;
    font-weight: 800;
    opacity: 0.5;
    letter-spacing: 1px;
}

.glow-bar {
    filter: drop-shadow(0 0 4px rgba(0, 242, 255, 0.4));
}

.mission-card {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 8px;
}

.border-secondary {
    border-color: rgba(112, 0, 255, 0.2) !important;
}

.mission-claimed {
    opacity: 0.5;
    background: transparent !important;
}

.missions-container::-webkit-scrollbar {
    width: 3px;
}

.missions-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
}
</style>