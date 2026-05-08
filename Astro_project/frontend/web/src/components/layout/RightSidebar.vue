<template>
    <v-navigation-drawer app permanent location="right" width="280" class="sidebar right-sidebar" elevation="0"
        mobile-breakpoint="lg">
        <div class="d-flex flex-column h-100 pa-4">
            <!-- Stats Section -->
            <div class="section-label mb-4">{{ $t('rightSidebar.pilotState') }}</div>
            
            <v-card class="glass-card mb-4 pt-5 px-4 pb-6" elevation="0" style="overflow: visible !important;">
                <div class="d-flex justify-space-around align-center">
                    <div class="text-center streak-container d-flex flex-column align-center">
                        <div class="streak-icon-wrapper">
                            <v-icon 
                                :icon="isStreakActiveToday ? 'mdi-fire' : 'mdi-fire-off'" 
                                :class="['streak-fire-icon', { 'active-fire': isStreakActiveToday }]"
                                :color="isStreakActiveToday ? 'orange-accent-3' : 'grey-darken-1'"
                                size="28"
                            ></v-icon>
                            <div v-if="isStreakActiveToday" class="fire-glow"></div>
                        </div>
                        <div class="stat-value text-h5 font-weight-bold" :class="isStreakActiveToday ? 'text-orange-accent-3' : 'text-grey'">
                            {{ userStreak }}
                        </div>
                        <div class="stat-label" :class="{ 'active-label': isStreakActiveToday }">{{ $t('rightSidebar.streakCaps') }}</div>
                    </div>
                    <v-divider vertical class="mx-2 border-opacity-25" color="white"></v-divider>
                    <div class="text-center d-flex flex-column align-center">
                        <div class="streak-icon-wrapper">
                            <v-icon 
                                icon="mdi-database" 
                                color="yellow-accent-3"
                                size="28"
                            ></v-icon>
                        </div>
                        <div class="stat-value text-h5 font-weight-bold text-yellow-accent-3">
                            {{ userCoins }}
                        </div>
                        <div class="stat-label">{{ $t('rightSidebar.credits') }}</div>
                    </div>
                </div>
            </v-card>

            <v-card class="glass-card mb-6 pa-4" elevation="0">
                <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption font-weight-black text-primary">{{ $t('rightSidebar.level', { level: userLevel }) }}</span>
                    <span class="text-caption text-grey-lighten-1">{{ userXp }} / {{ xpRequired }} XP</span>
                </div>
                <v-progress-linear :model-value="(userXp / Math.max(1, xpRequired)) * 100" color="primary"
                    height="8" rounded bg-color="rgba(0, 242, 255, 0.15)" bg-opacity="1" class="mb-2 glow-bar"></v-progress-linear>
            </v-card>

            <!-- Daily Missions Section -->
            <div class="d-flex align-center justify-space-between mb-4">
                <div class="section-label">{{ $t('rightSidebar.dailyMissions') }}</div>
                <v-btn icon="mdi-refresh" variant="text" color="primary" density="compact" @click="refreshMissions" :loading="isRefreshing"></v-btn>
            </div>

            <div class="missions-container flex-grow-1 overflow-y-auto pr-2" style="max-height: 220px;">
                <div v-if="!dailyMissions || dailyMissions.length === 0" class="text-caption text-grey text-center py-4">
                    {{ $t('rightSidebar.syncing') }}
                </div>
                
                <v-card v-for="mission in (dailyMissions || []).slice(0, 3)" :key="mission.id"
                    class="mission-card mb-3 pa-3" :class="{ 'mission-claimed': mission.claimed }">
                    <div class="d-flex justify-space-between align-start mb-1">
                        <div class="mission-text text-body-2 font-weight-bold" :class="{ 'text-grey': mission.claimed }">
                            {{ getMissionTranslation(mission, 'daily') }}
                        </div>
                        <v-icon v-if="mission.claimed" icon="mdi-check-circle" color="success" size="small"></v-icon>
                    </div>
                    
                    <div class="d-flex justify-space-between align-center mt-2">
                        <div class="text-caption text-primary">
                            {{ mission.progress }} / {{ mission.goal }}
                        </div>
                        <v-btn v-if="mission.completed && !mission.claimed" color="primary" variant="flat"
                            density="compact" size="small" class="px-3" @click.stop="claimReward(mission.id, 'daily')">
                            {{ $t('rightSidebar.claimCaps') }}
                        </v-btn>
                    </div>
                </v-card>
            </div>

            <v-btn block variant="text" color="primary" class="mt-1 mb-2 text-caption font-weight-bold" @click="dialogDiarias = true">
                {{ $t('rightSidebar.viewAllDaily') }}
            </v-btn>

            <!-- Weekly Missions Section -->
            <div class="d-flex align-center justify-space-between mb-4 mt-2">
                <div class="section-label">{{ $t('rightSidebar.weeklyMissions') }}</div>
                <v-icon icon="mdi-calendar-clock" color="secondary" size="small"></v-icon>
            </div>

            <div class="missions-container flex-grow-1 overflow-y-auto pr-2" style="max-height: 220px;">
                <div v-if="!weeklyMissions || weeklyMissions.length === 0" class="text-caption text-grey text-center py-4">
                    {{ $t('rightSidebar.noWeeklyMissions') }}
                </div>
                
                <v-card v-for="mission in (weeklyMissions || []).slice(0, 2)" :key="mission.id"
                    class="mission-card mb-3 pa-3 border-secondary" :class="{ 'mission-claimed': mission.claimed }">
                    <div class="d-flex justify-space-between align-start mb-1">
                        <div class="mission-text text-body-2 font-weight-bold" :class="{ 'text-grey': mission.claimed }">
                            {{ getMissionTranslation(mission, 'weekly') }}
                        </div>
                        <v-icon v-if="mission.claimed" icon="mdi-check-circle" color="secondary" size="small"></v-icon>
                    </div>
                    
                    <div class="d-flex justify-space-between align-center mt-2">
                        <div class="text-caption text-secondary">
                            {{ mission.progress }} / {{ mission.goal }}
                        </div>
                        <v-btn v-if="mission.completed && !mission.claimed" color="secondary" variant="flat"
                            density="compact" size="small" class="px-3" @click.stop="claimReward(mission.id, 'weekly')">
                            {{ $t('rightSidebar.claimCaps') }}
                        </v-btn>
                    </div>
                </v-card>
            </div>

            <v-btn block variant="text" color="secondary" class="mt-2 text-caption font-weight-bold" @click="dialogMisiones = true">
                {{ $t('rightSidebar.viewAllWeekly') }}
            </v-btn>
        </div>

        <!-- Daily Missions Popup -->
        <v-dialog v-model="dialogDiarias" max-width="500" transition="dialog-bottom-transition">
            <v-card class="mission-popup-card">
                <div class="popup-header pa-6 pb-2">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <div class="d-flex align-center">
                            <v-icon icon="mdi-calendar-check" color="primary" class="mr-3" size="large"></v-icon>
                            <h2 class="text-h5 font-weight-black text-white">{{ $t('rightSidebar.dailyMissions') }}</h2>
                        </div>
                        <v-btn icon="mdi-close" variant="text" density="compact" @click="dialogDiarias = false" color="grey-lighten-1"></v-btn>
                    </div>
                    <p class="text-caption text-grey-lighten-1 mb-4">Completa estas tareas antes del próximo ciclo para obtener recompensas.</p>
                </div>

                <v-divider class="border-opacity-25" color="primary"></v-divider>

                <div class="pa-6 pt-4">
                    <div v-for="mission in dailyMissions" :key="mission.id" 
                        class="mission-detail-item mb-4"
                        :class="{ 'mission-item-completed': mission.completed, 'mission-item-claimed': mission.claimed }">
                        
                        <v-card class="glass-mission-card pa-4" elevation="0">
                            <div class="d-flex align-start mb-3">
                                <div class="mission-icon-container mr-4" :class="mission.type">
                                    <v-icon :icon="getMissionIcon(mission.type)" :color="getMissionColor(mission.type)" size="24"></v-icon>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-space-between align-center mb-1">
                                        <div class="text-subtitle-1 font-weight-bold text-white mission-title" 
                                            :class="{ 'text-grey text-decoration-line-through': mission.claimed }">
                                            {{ getMissionTranslation(mission, 'daily') }}
                                        </div>
                                        <div v-if="mission.reward" class="reward-tag d-flex align-center">
                                            <v-icon icon="mdi-database" size="14" color="yellow-accent-3" class="mr-1"></v-icon>
                                            <span class="text-caption font-weight-black text-yellow-accent-3">+{{ mission.reward }}</span>
                                        </div>
                                    </div>
                                    <div class="d-flex align-center justify-space-between mt-1">
                                        <div class="text-caption" :class="mission.completed ? 'text-success font-weight-black' : 'text-primary'">
                                            {{ mission.completed ? 'COMPLETADA' : `${mission.progress} / ${mission.goal}` }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <v-progress-linear
                                :model-value="(mission.progress / mission.goal) * 100"
                                :color="mission.completed ? 'success' : 'primary'"
                                height="6"
                                rounded
                                bg-color="rgba(255,255,255,0.05)"
                                bg-opacity="1"
                                class="mb-2"
                                :class="{ 'glow-success': mission.completed, 'glow-primary': !mission.completed && mission.progress > 0 }"
                            ></v-progress-linear>

                            <div v-if="mission.completed && !mission.claimed" class="d-flex justify-end mt-3">
                                <v-btn 
                                    color="primary" 
                                    size="small" 
                                    variant="elevated" 
                                    class="claim-btn font-weight-black"
                                    @click="claimReward(mission.id, 'daily')"
                                    prepend-icon="mdi-gift"
                                >
                                    {{ $t('rightSidebar.claimReward') }}
                                </v-btn>
                            </div>
                            <div v-else-if="mission.claimed" class="d-flex justify-end mt-3">
                                <div class="text-caption text-success d-flex align-center font-weight-bold">
                                    <v-icon icon="mdi-check-decagram" size="small" class="mr-1"></v-icon>
                                    RECOMPENSA COBRADA
                                </div>
                            </div>
                        </v-card>
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Weekly Missions Popup -->
        <v-dialog v-model="dialogMisiones" max-width="500" transition="dialog-bottom-transition">
            <v-card class="mission-popup-card weekly">
                <div class="popup-header pa-6 pb-2">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <div class="d-flex align-center">
                            <v-icon icon="mdi-calendar-clock" color="secondary" class="mr-3" size="large"></v-icon>
                            <h2 class="text-h5 font-weight-black text-white">{{ $t('rightSidebar.weeklyMissions') }}</h2>
                        </div>
                        <v-btn icon="mdi-close" variant="text" density="compact" @click="dialogMisiones = false" color="grey-lighten-1"></v-btn>
                    </div>
                    <p class="text-caption text-grey-lighten-1 mb-4">Tareas de largo alcance. Tienes toda la semana para completar estas operaciones.</p>
                </div>

                <v-divider class="border-opacity-25" color="secondary"></v-divider>

                <div class="pa-6 pt-4">
                    <div v-for="mission in weeklyMissions" :key="mission.id" 
                        class="mission-detail-item mb-4"
                        :class="{ 'mission-item-completed': mission.completed, 'mission-item-claimed': mission.claimed }">
                        
                        <v-card class="glass-mission-card pa-4" elevation="0">
                            <div class="d-flex align-start mb-3">
                                <div class="mission-icon-container mr-4" :class="mission.type">
                                    <v-icon :icon="getMissionIcon(mission.type)" :color="getMissionColor(mission.type)" size="24"></v-icon>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-space-between align-center mb-1">
                                        <div class="text-subtitle-1 font-weight-bold text-white mission-title" 
                                            :class="{ 'text-grey text-decoration-line-through': mission.claimed }">
                                            {{ getMissionTranslation(mission, 'weekly') }}
                                        </div>
                                        <div v-if="mission.reward" class="reward-tag d-flex align-center">
                                            <v-icon icon="mdi-database" size="14" color="yellow-accent-3" class="mr-1"></v-icon>
                                            <span class="text-caption font-weight-black text-yellow-accent-3">+{{ mission.reward }}</span>
                                        </div>
                                    </div>
                                    <div class="d-flex align-center justify-space-between mt-1">
                                        <div class="text-caption" :class="mission.completed ? 'text-success font-weight-black' : 'text-secondary'">
                                            {{ mission.completed ? 'COMPLETADA' : `${mission.progress} / ${mission.goal}` }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <v-progress-linear
                                :model-value="(mission.progress / mission.goal) * 100"
                                :color="mission.completed ? 'success' : 'secondary'"
                                height="6"
                                rounded
                                bg-color="rgba(255,255,255,0.05)"
                                bg-opacity="1"
                                class="mb-2"
                                :class="{ 'glow-success': mission.completed, 'glow-secondary': !mission.completed && mission.progress > 0 }"
                            ></v-progress-linear>

                            <div v-if="mission.completed && !mission.claimed" class="d-flex justify-end mt-3">
                                <v-btn 
                                    color="secondary" 
                                    size="small" 
                                    variant="elevated" 
                                    class="claim-btn font-weight-black"
                                    @click="claimReward(mission.id, 'weekly')"
                                    prepend-icon="mdi-gift"
                                >
                                    {{ $t('rightSidebar.claimReward') }}
                                </v-btn>
                            </div>
                            <div v-else-if="mission.claimed" class="d-flex justify-end mt-3">
                                <div class="text-caption text-success d-flex align-center font-weight-bold">
                                    <v-icon icon="mdi-check-decagram" size="small" class="mr-1"></v-icon>
                                    RECOMPENSA COBRADA
                                </div>
                            </div>
                        </v-card>
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Feedback de reclamación -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" elevation="24">
            <div class="d-flex align-center">
                <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-3"></v-icon>
                <span class="font-weight-bold">{{ snackbar.text }}</span>
            </div>
        </v-snackbar>
    </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAstroStore } from '@/stores/astroStore'
import { useProgressStore } from '@/stores/progressStore'

const { t } = useI18n()
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
const snackbar = ref({
    show: false,
    text: '',
    color: 'success'
})

const refreshMissions = async () => {
    isRefreshing.value = true
    try { await astroStore.fetchUserStats() } finally { isRefreshing.value = false }
}

const claimReward = async (missionId, type = 'daily') => {
    const result = await astroStore.claimMissionReward(missionId, type)
    if (result.success) {
        snackbar.value = {
            show: true,
            text: result.message || t('rightSidebar.rewardClaimed'),
            color: 'success'
        }
    } else {
        snackbar.value = {
            show: true,
            text: result.message || t('rightSidebar.rewardError'),
            color: 'error'
        }
    }
}

const getMissionTranslation = (mission, period) => {
    if (!mission) return '';
    const type = mission.type || mission.id;
    const key = `missionsList.${period}.${type}`;
    const translated = t(key, { goal: mission.goal });
    if (translated !== key) {
        return translated;
    }
    return mission.label || mission.text || (period === 'daily' ? t('rightSidebar.specialMission') : t('rightSidebar.weeklyMission'));
}

const getMissionIcon = (type) => {
    const icons = {
        'games': 'mdi-rocket-launch',
        'coins': 'mdi-database',
        'xp': 'mdi-star-circle',
        'item': 'mdi-briefcase-variant',
        'streak': 'mdi-fire',
        'social': 'mdi-account-group'
    }
    return icons[type] || 'mdi-target'
}

const getMissionColor = (type) => {
    const colors = {
        'games': 'cyan-accent-2',
        'coins': 'yellow-accent-3',
        'xp': 'light-blue-accent-2',
        'item': 'deep-purple-accent-2',
        'streak': 'orange-accent-3',
        'social': 'pink-accent-2'
    }
    return colors[type] || 'primary'
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
    font-size: 0.6rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    transition: all 0.3s ease;
    line-height: 1;
    margin-top: -2px;
}

.active-label {
    color: rgba(255, 160, 0, 0.8);
    text-shadow: 0 0 8px rgba(255, 87, 34, 0.3);
}

.glow-bar {
    filter: drop-shadow(0 0 4px rgba(0, 242, 255, 0.4));
}

/* Streak Flame Styles */
.streak-container {
    position: relative;
    z-index: 1;
}

.streak-icon-wrapper {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
}

.streak-fire-icon {
    transition: all 0.3s ease;
    z-index: 2;
}

.active-fire {
    filter: drop-shadow(0 0 5px rgba(255, 111, 0, 0.8));
    animation: flicker 1.5s infinite ease-in-out;
}

.fire-glow {
    position: absolute;
    width: 25px;
    height: 25px;
    background: radial-gradient(circle, rgba(255, 87, 34, 0.6) 0%, transparent 70%);
    border-radius: 50%;
    z-index: 1;
    animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes flicker {
    0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
    25% { transform: scale(1.1) rotate(-2deg); opacity: 0.9; }
    50% { transform: scale(1.05) rotate(3deg); opacity: 1; }
    75% { transform: scale(1.15) rotate(-1deg); opacity: 0.8; }
}

@keyframes pulse-glow {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.8); opacity: 0.8; }
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

/* New Popup Styles */
.mission-popup-card {
    background: linear-gradient(135deg, #0d1930 0%, #050a14 100%) !important;
    border: 1px solid rgba(0, 242, 255, 0.2) !important;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.8) !important;
    border-radius: 16px !important;
    overflow: hidden;
}

.mission-popup-card.weekly {
    border-color: rgba(112, 0, 255, 0.3) !important;
}

.glass-mission-card {
    background: rgba(255, 255, 255, 0.02) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 12px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-mission-card:hover {
    background: rgba(255, 255, 255, 0.04) !important;
    transform: translateY(-2px);
    border-color: rgba(0, 242, 255, 0.1) !important;
}

.weekly .glass-mission-card:hover {
    border-color: rgba(112, 0, 255, 0.2) !important;
}

.mission-icon-container {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.mission-icon-container.games { border-color: rgba(0, 242, 255, 0.2); background: rgba(0, 242, 255, 0.05); }
.mission-icon-container.coins { border-color: rgba(255, 215, 0, 0.2); background: rgba(255, 215, 0, 0.05); }
.mission-icon-container.xp { border-color: rgba(3, 169, 244, 0.2); background: rgba(3, 169, 244, 0.05); }
.mission-icon-container.item { border-color: rgba(103, 58, 183, 0.2); background: rgba(103, 58, 183, 0.05); }
.mission-icon-container.streak { border-color: rgba(255, 87, 34, 0.2); background: rgba(255, 87, 34, 0.05); }

.mission-title {
    font-family: 'Rajdhani', sans-serif;
    letter-spacing: 0.5px;
}

.reward-tag {
    background: rgba(255, 215, 0, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 215, 0, 0.1);
}

.glow-primary {
    filter: drop-shadow(0 0 3px rgba(0, 242, 255, 0.5));
}

.glow-secondary {
    filter: drop-shadow(0 0 3px rgba(112, 0, 255, 0.5));
}

.glow-success {
    filter: drop-shadow(0 0 3px rgba(76, 175, 80, 0.5));
}

.claim-btn {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.75rem !important;
    animation: pulse-button 2s infinite;
}

@keyframes pulse-button {
    0% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(0, 242, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0); }
}

.weekly .claim-btn {
    animation: pulse-button-secondary 2s infinite;
}

@keyframes pulse-button-secondary {
    0% { box-shadow: 0 0 0 0 rgba(112, 0, 255, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(112, 0, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(112, 0, 255, 0); }
}

.mission-item-claimed {
    filter: grayscale(0.8);
    opacity: 0.6;
}
</style>