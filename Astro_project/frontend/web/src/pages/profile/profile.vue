<template>
    <v-container fluid class="profile-container pa-0">
        <div class="profile-layout-wrapper py-8 px-4 px-md-8">
            <div class="profile-main-content" :class="{ 'history-open': historyDialog }">
                <!-- TARJETA DE PERFIL -->
                <v-card class="profile-card" :class="{ 'card-narrow': historyDialog }" elevation="24">
                    <!-- BANNER SUPERIOR -->
                    <div class="banner-section">
                        <v-img src="/fondo3.jpg" cover height="200" class="banner-image">
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular indeterminate color="cyan-accent-3"></v-progress-circular>
                                </div>
                            </template>
                            <div class="banner-overlay"></div>
                        </v-img>
                    </div>

                    <!-- CABECERA: AVATAR Y DATOS BÁSICOS -->
                    <div class="profile-header px-6 px-md-10">
                        <div class="avatar-container">
                            <div class="main-avatar-wrapper">
                                <v-avatar size="160" class="avatar-circle">
                                    <v-img :src="`/${avatar}`" alt="Avatar" cover></v-img>
                                </v-avatar>
                                <v-btn icon="mdi-camera-outline" size="small" color="cyan-accent-3" class="edit-avatar-btn"
                                    elevation="8" @click="avatarDialog = true"></v-btn>
                            </div>
                            <div class="mascot-wrapper">
                                <v-avatar v-if="mascot" size="80" class="mascot-badge" @click="mascotDialog = true">
                                    <v-img :src="`/${mascot}`" cover></v-img>
                                </v-avatar>
                                <v-btn v-else icon="mdi-paw" size="large" color="purple-accent-2" class="add-mascot-btn"
                                    @click="mascotDialog = true"></v-btn>
                            </div>
                        </div>

                        <div class="user-meta mt-4">
                            <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
                                <div class="flex-grow-1">
                                    <h1 class="user-name text-h3 font-weight-black text-white capitalize mb-2">
                                        {{ user || 'Explorador' }}
                                    </h1>
                                    <div class="d-flex flex-wrap align-center ga-3">
                                        <v-chip :class="['rank-chip font-weight-black', getRankClass(level)]" size="small" variant="flat">
                                            {{ rank || 'Cadete de Vuelo' }}
                                        </v-chip>
                                        <div class="d-flex align-center ga-3 text-grey-lighten-1">
                                            <span class="text-overline">NIVEL {{ level || 1 }}</span>
                                            <v-divider vertical class="mx-1 my-1 border-opacity-25" color="white"></v-divider>
                                            <div class="status-indicator d-flex align-center ga-2">
                                                <div class="status-dot online"></div>
                                                <span class="text-caption font-weight-bold">EN ÓRBITA</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <v-btn
                                    color="cyan-accent-4"
                                    variant="tonal"
                                    class="history-toggle-btn px-6"
                                    rounded="lg"
                                    prepend-icon="mdi-history"
                                    @click="historyDialog = !historyDialog"
                                >
                                    {{ historyDialog ? 'CERRAR PANEL' : 'HISTORIAL' }}
                                </v-btn>
                            </div>

                            <!-- Barra de Progreso XP -->
                            <div class="xp-progress-wrapper mt-6">
                                <div class="d-flex justify-space-between align-center mb-1 px-1">
                                    <span class="text-caption font-weight-bold text-cyan-accent-3">PROGRESO DE MISIÓN</span>
                                    <span class="text-caption font-weight-black text-white">{{ xp }} / {{ xpRequired }} XP</span>
                                </div>
                                <v-progress-linear
                                    :model-value="(xp / xpRequired) * 100"
                                    color="cyan-accent-3"
                                    height="10"
                                    rounded
                                    bg-color="rgba(255,255,255,0.05)"
                                    bg-opacity="1"
                                    class="xp-bar shadow-cyan"
                                ></v-progress-linear>
                            </div>
                        </div>

                        <v-divider class="my-8 border-opacity-10"></v-divider>

                        <!-- ESTADÍSTICAS RÁPIDAS -->
                        <div class="stats-grid mb-10">
                            <div class="stat-item">
                                <span class="stat-label">PLAN ACTUAL</span>
                                <span class="stat-value text-cyan-accent-2">{{ plan || 'INDIVIDUAL' }}</span>
                            </div>
                            <div class="stat-item text-center">
                                <span class="stat-label">MISIÓN ACTUAL</span>
                                <span class="stat-value text-amber-accent-2">{{ currentMissionName }}</span>
                            </div>
                            <div class="stat-item text-right">
                                <span class="stat-label">SISTEMA</span>
                                <span class="stat-value">ASTRO-V2.0</span>
                            </div>
                        </div>

                        <!-- SECCIÓN DE LOGROS -->
                        <div class="achievements-section mb-10">
                            <div class="section-header d-flex align-center justify-space-between mb-4">
                                <h3 class="text-overline font-weight-black text-grey-lighten-2">LOGROS DESTACADOS</h3>
                            </div>
                            <v-row dense>
                                <v-col v-for="i in 3" :key="i" cols="4">
                                    <div class="achievement-slot" @click="openSelection(i - 1)">
                                        <div class="slot-glow" v-if="getAchievement(selectedAchievements[i - 1])"></div>
                                        <Medal v-if="getAchievement(selectedAchievements[i - 1])"
                                            :type="getAchievement(selectedAchievements[i - 1]).type"
                                            :icon="getAchievement(selectedAchievements[i - 1]).icon" 
                                            :scale="0.7"
                                            :icon-size="52" />
                                        <div v-else class="empty-slot">
                                            <v-icon icon="mdi-plus" color="rgba(255,255,255,0.1)" size="32"></v-icon>
                                        </div>
                                    </div>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- ACCIONES -->
                        <div class="actions-container ga-3 mb-10">
                            <v-row dense>
                                <v-col cols="12" sm="6">
                                    <v-btn block color="grey-darken-4" height="56" rounded="lg" variant="flat" @click="goToInventory"
                                        class="action-btn font-weight-black">
                                        <v-icon start icon="mdi-cube-outline" class="mr-2"></v-icon>
                                        INVENTARIO
                                    </v-btn>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-btn block color="grey-darken-4" height="56" rounded="lg" variant="flat" @click="changePlan"
                                        class="action-btn font-weight-black">
                                        <v-icon start icon="mdi-rocket-launch-outline" class="mr-2"></v-icon>
                                        CAMBIAR PLAN
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <v-btn block color="red-darken-4" height="56" rounded="lg" variant="tonal" @click="handleLogout"
                                class="logout-btn font-weight-black mt-4">
                                FINALIZAR CONEXIÓN Y SALIR
                            </v-btn>
                        </div>
                    </div>
                </v-card>

                <!-- PANEL DE HISTORIAL (DERECHA/INFERIOR) -->
                <div v-if="historyDialog" class="history-panel">
                    <div class="history-header pa-6">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <h3 class="text-h6 font-weight-black text-white">HISTORIAL DE VUELO</h3>
                            <v-icon icon="mdi-chart-line" color="cyan-accent-3"></v-icon>
                        </div>
                        <p class="text-caption text-grey">Tus últimos registros de misión en el espacio profundo.</p>
                    </div>

                    <div class="history-scroll-area pa-6 pt-0">
                        <!-- TOP MISIONES -->
                        <div class="mb-8">
                            <h4 class="text-overline text-amber-accent-3 font-weight-black mb-4 d-flex align-center">
                                <v-icon size="16" class="mr-2">mdi-star</v-icon> RECORDS PERSONALES
                            </h4>
                            <div v-if="topGames.length > 0" class="top-games-list ga-3 d-flex flex-column">
                                <div v-for="(match, idx) in topGames" :key="`top-${idx}`" class="top-game-card">
                                    <div class="rank-num">{{ idx + 1 }}</div>
                                    <div class="game-info">
                                        <span class="game-name text-capitalize">{{ match.game }}</span>
                                        <span class="game-date">{{ new Date(match.createdAt).toLocaleDateString() }}</span>
                                    </div>
                                    <div class="game-stats">
                                        <span class="game-score">{{ match.score }}</span>
                                        <span class="game-xp">+{{ match.xpEarned }} XP</span>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-state">
                                <span class="text-caption">Sin registros de élite</span>
                            </div>
                        </div>

                        <!-- RECIENTES -->
                        <div>
                            <h4 class="text-overline text-grey font-weight-black mb-4">INCURSIONES RECIENTES</h4>
                            <div v-if="gameHistory.length > 0" class="recent-list ga-2 d-flex flex-column">
                                <div v-for="(match, idx) in paginatedHistory" :key="`hist-${idx}`" class="recent-item">
                                    <div class="recent-icon">
                                        <v-icon size="16" color="cyan-accent-2">mdi-sword-cross</v-icon>
                                    </div>
                                    <div class="game-info">
                                        <span class="game-name text-capitalize">{{ match.game }}</span>
                                        <span class="game-date">{{ new Date(match.createdAt).toLocaleDateString() }}</span>
                                    </div>
                                    <div class="game-score-small">{{ match.score }}</div>
                                </div>
                            </div>
                            
                            <!-- Paginación -->
                            <div v-if="gameHistory.length > pageSize" class="d-flex align-center justify-center ga-4 mt-6">
                                <v-btn density="comfortable" variant="text" color="cyan-accent-3" icon="mdi-chevron-left"
                                    :disabled="currentPage === 1" @click="currentPage--"></v-btn>
                                <span class="text-caption font-weight-black text-grey">{{ currentPage }} / {{ totalPages }}</span>
                                <v-btn density="comfortable" variant="text" color="cyan-accent-3" icon="mdi-chevron-right"
                                    :disabled="currentPage >= totalPages" @click="currentPage++"></v-btn>
                            </div>

                            <div v-if="gameHistory.length === 0" class="empty-state">
                                <span class="text-caption">No hay misiones recientes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </v-card>
        </div>

        <!-- DIÁLOGOS (Sin cambios significativos en lógica, solo diseño glass) -->
        <v-dialog v-model="selectionDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    SELECCIONAR LOGRO
                    <v-btn icon="mdi-close" variant="text" color="white" @click="selectionDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-list bg-color="transparent" class="text-white">
                        <v-list-item v-for="achievement in allAchievements" :key="achievement.id"
                            :title="$te('achievementsList.' + achievement.id + '.title') ? $t('achievementsList.' + achievement.id + '.title') : achievement.title" 
                            :subtitle="$te('achievementsList.' + achievement.id + '.desc') ? $t('achievementsList.' + achievement.id + '.desc') : achievement.description"
                            @click="achievement.unlocked ? selectAchievement(achievement.id) : null"
                            :disabled="!achievement.unlocked" class="mb-2 achievement-list-item" :class="{
                                'selected': isSelected(achievement.id),
                                'locked-item': !achievement.unlocked
                            }">
                            <template v-slot:prepend>
                                <div class="mr-4 d-flex align-center justify-center"
                                    style="width: 60px; height: 60px; overflow: hidden;">
                                    <Medal :type="achievement.type" :icon="achievement.icon" :scale="0.3"
                                        :icon-size="48" :locked="!achievement.unlocked" />
                                </div>
                            </template>
                        </v-list-item>
                        <v-divider class="my-2 border-opacity-20"></v-divider>
                        <v-list-item prepend-icon="mdi-delete-outline" :title="$t('profile.removeAchievement')"
                            @click="selectAchievement(null)" class="text-error"></v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo Avatar -->
        <v-dialog v-model="avatarDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    TRAJE DE ASTRONAUTA
                    <v-btn icon="mdi-close" variant="text" color="white" @click="avatarDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-row class="mt-2 text-center">
                        <v-col v-for="opt in avatarOptions" :key="opt.file" cols="4" sm="3" class="pa-2">
                            <v-avatar size="70" class="avatar-option" :class="{ 'active-avatar': avatar === opt.file }"
                                @click="selectAvatar(opt.file)">
                                <v-img :src="`/${opt.file}`"></v-img>
                            </v-avatar>
                            <div class="text-caption text-grey-lighten-1 mt-2 font-weight-bold">{{ opt.label }}</div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo Mascota -->
        <v-dialog v-model="mascotDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    COMPAÑERO DE MISIÓN
                    <v-btn icon="mdi-close" variant="text" color="white" @click="mascotDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-row class="mt-2 text-center">
                        <v-col v-for="m in mascotOptions" :key="m.file" cols="4" sm="3" class="pa-2">
                            <v-avatar size="70" class="avatar-option" :class="{ 'active-avatar': mascot === m.file }"
                                @click="selectMascot(m.file)">
                                <v-img :src="`/${m.file}`"></v-img>
                            </v-avatar>
                            <div class="text-caption text-grey-lighten-1 mt-2 font-weight-bold">{{ m.label }}</div>
                        </v-col>
                        <v-col cols="4" sm="3" class="pa-2">
                            <v-avatar size="70" class="avatar-option d-flex align-center justify-center no-mascot"
                                @click="selectMascot(null)">
                                <v-icon color="grey">mdi-close</v-icon>
                            </v-avatar>
                            <div class="text-caption text-grey-lighten-1 mt-2 font-weight-bold">NINGUNO</div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAstroStore } from '@/stores/astroStore' 
import { storeToRefs } from 'pinia' 
import { ACHIEVEMENTS } from '@/constants/achievements'
import Medal from '@/components/achievements/Medal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const astroStore = useAstroStore()

const selectionDialog = ref(false)
const avatarDialog = ref(false)
const mascotDialog = ref(false)
const historyDialog = ref(false)
const currentPage = ref(1)
const pageSize = 4
const currentSlotIndex = ref(null)
const { 
    user, rank, plan, selectedAchievements, unlockedAchievements, 
    avatar, mascot, level, coins, xp, partides,
    gameHistory, topGames, maxScores, totalGamesPlayed, totalPoints
} = storeToRefs(astroStore)

const getRankClass = (lvl = 1) => {
    if (lvl <= 10) return 'rank-tier-1';
    if (lvl <= 30) return 'rank-tier-2';
    if (lvl <= 60) return 'rank-tier-3';
    if (lvl <= 100) return 'rank-tier-4';
    if (lvl <= 130) return 'rank-tier-5';
    return 'rank-tier-6';
};

const paginatedHistory = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return (gameHistory.value || []).slice(start, end)
})

const totalPages = computed(() => {
    return Math.ceil((gameHistory.value || []).length / pageSize) || 1
})

const xpRequired = computed(() => {
    return 100 + ((level.value || 1) - 1) * 50;
})

const missionKeyPrefixes = [
    'mission_1',
    'mission_2',
    'mission_3',
    'mission_4',
    'mission_5',
    'mission_6'
];

const currentMissionName = computed(() => {
    const currentLvl = level.value || 1;
    if (currentLvl <= missionKeyPrefixes.length) {
        return t(`profile.${missionKeyPrefixes[currentLvl - 1]}`).toUpperCase();
    }
    return t('profile.deepSpace', { level: currentLvl });
});

const avatarOptions = computed(() => [
    { label: t('profile.avatar_white'), file: 'Astronauta_blanc.jpg' },
    { label: t('profile.avatar_yellow'), file: 'Astronauta_groc.jpg' },
    { label: t('profile.avatar_purple'), file: 'Astronauta_lila.jpg' },
    { label: t('profile.avatar_black'), file: 'Astronauta_negre.jpg' },
    { label: t('profile.avatar_orange'), file: 'Astronauta_taronja.jpg' },
    { label: t('profile.avatar_green'), file: 'Astronauta_verd.jpg' },
    { label: t('profile.avatar_red'), file: 'Astronauta_vermell.jpg' }
])

const mascotOptions = computed(() => [
    { label: t('profile.mascot_whale'), file: 'Balena_alien.jpg' },
    { label: t('profile.mascot_alien'), file: 'Mascota_alien2.jpg' },
    { label: t('profile.mascot_drone'), file: 'Mascota_dron.jpg' },
    { label: t('profile.mascot_octopus'), file: 'Pop_alien.jpg' }
])

const playerMetrics = computed(() => ({
    coins: Number(coins.value) || 0,
    games: Number(partides.value) || 0,
    missions: Number(astroStore.missionsCompleted) || 0,
    inventory: Number(astroStore.inventoryUnits) || 0,
    level: Number(level.value) || 1,
    xp: Number(xp.value) || 0
}))

const allAchievements = computed(() => {
    const unlockedFromDb = new Set(unlockedAchievements.value || [])

    return ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: (playerMetrics.value[a.metric] || 0) >= (a.goal || 0) || unlockedFromDb.has(a.id)
    }))
})

onMounted(async () => {
    if (!astroStore.user) return

    await Promise.all([
        astroStore.fetchUserStats(),
        astroStore.fetchUserInventory(),
        astroStore.fetchUserAchievements()
    ])
})

function isSelected(id) {
    return selectedAchievements.value.some(sid => sid !== null && Number(sid) === Number(id))
}

function getAchievement(id) {
    if (id === null || id === undefined) return null
    return ACHIEVEMENTS.find(a => a.id === Number(id))
}

function openSelection(index) {
    currentSlotIndex.value = index
    selectionDialog.value = true
}

async function selectAchievement(achievementId) {
    if (!user.value) {
        return;
    }
    selectionDialog.value = false;
    const targetId = achievementId !== null ? Number(achievementId) : null;
    let newSelection = [...selectedAchievements.value];
    if (targetId !== null) {
        const existingIndex = newSelection.findIndex(id => id !== null && Number(id) === targetId);
        if (existingIndex !== -1) {
            newSelection[existingIndex] = null;
        }
    }
    newSelection[currentSlotIndex.value] = targetId;
    await astroStore.updateAchievements(newSelection);
}

function handleLogout() {
    astroStore.logout()
    router.push('/login')
}

function changePlan() {
    router.push('/plans')
}

function goToInventory() {
    router.push('/inventory')
}

function selectAvatar(file) {
    astroStore.updateAvatar(file)
    avatarDialog.value = false
}

function selectMascot(file) {
    astroStore.updateMascot(file)
    mascotDialog.value = false
}

watch(historyDialog, async (isOpen) => {
    if (isOpen && user.value) {
        await astroStore.fetchUserStats();
    }
});
</script>

<style scoped>
.profile-container {
    background: transparent !important;
    min-height: 100vh;
}

.profile-layout-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
}

.profile-main-content {
    display: flex;
    flex-direction: row;
    width: 100%;
    max-width: 700px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    gap: 0;
}

.profile-main-content.history-open {
    max-width: 1100px; /* Ajustado para caber entre sidebars */
}

/* TARJETA DE PERFIL */
.profile-card {
    flex: 1 1 600px;
    background: #0a0c10 !important;
    border: 1px solid rgba(0, 242, 255, 0.1);
    border-radius: 20px !important;
    overflow: hidden;
    position: relative;
    z-index: 2;
}

.history-open .profile-card {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.banner-section {
    position: relative;
}

.banner-image {
    filter: brightness(0.8);
}

.banner-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to top, #0a0c10, transparent);
}

.profile-header {
    margin-top: -80px;
    position: relative;
    z-index: 3;
}

.avatar-container {
    display: flex;
    align-items: flex-end;
    gap: 16px;
}

.main-avatar-wrapper {
    position: relative;
}

.avatar-circle {
    border: 5px solid #0a0c10;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}

.avatar-circle :deep(.v-img__img) {
    transform: scale(1.1);
}

.edit-avatar-btn {
    position: absolute;
    bottom: 5px;
    right: 5px;
    border: 3px solid #0a0c10 !important;
}

.mascot-badge {
    border: 4px solid #0a0c10;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: transform 0.3s;
}

.mascot-badge:hover {
    transform: scale(1.1) rotate(5deg);
}

.add-mascot-btn {
    border: 3px solid #0a0c10 !important;
    margin-bottom: 5px;
}

.user-name {
    letter-spacing: -1px !important;
    text-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.card-narrow .user-meta > .d-flex {
    flex-direction: column !important;
    align-items: flex-start !important;
}

.card-narrow .history-toggle-btn {
    width: 100%;
    margin-top: 8px;
}

.rank-chip {
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Tier 1: Básico */
.rank-tier-1 { background: linear-gradient(135deg, #78909c, #455a64) !important; color: white !important; }

/* Tier 2: Avanzado (Cyan) */
.rank-tier-2 { 
  background: linear-gradient(135deg, #00acc1, #006064) !important; 
  color: white !important;
  border: 1px solid rgba(0, 255, 255, 0.3) !important;
}

/* Tier 3: Superior (Púrpura) */
.rank-tier-3 { 
  background: linear-gradient(135deg, #8e24aa, #4a148c) !important; 
  color: white !important;
  border: 1px solid rgba(255, 0, 255, 0.4) !important;
  box-shadow: 0 0 10px rgba(142, 36, 170, 0.3);
}

/* Tier 4: Élite (Dorado/Naranja) */
.rank-tier-4 { 
  background: linear-gradient(135deg, #ff9800, #e65100) !important; 
  color: white !important;
  border: 2px solid rgba(255, 255, 0, 0.5) !important;
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.4);
  font-weight: 900 !important;
}

/* Tier 5: Maestro (Carmesí/Oscuro) */
.rank-tier-5 { 
  background: linear-gradient(135deg, #c62828, #1a237e) !important; 
  color: white !important;
  border: 2px solid #ff1744 !important;
  box-shadow: 0 0 20px rgba(255, 23, 68, 0.5);
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

/* Tier 6: Legendario (Cósmico animado) */
.rank-tier-6 { 
  background: linear-gradient(270deg, #6200ea, #00b0ff, #d500f9) !important;
  background-size: 400% 400% !important;
  animation: cosmic-bg 10s ease infinite !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 0 25px rgba(213, 0, 249, 0.6), inset 0 0 10px rgba(255,255,255,0.3);
  font-weight: 900 !important;
}

@keyframes cosmic-bg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-dot.online {
    background: #00e676;
    box-shadow: 0 0 10px #00e676;
}

.xp-bar {
    filter: drop-shadow(0 0 4px rgba(0, 242, 255, 0.3));
}

/* ESTADÍSTICAS */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px;
}

.card-narrow .stats-grid {
    grid-template-columns: repeat(2, 1fr);
}

.card-narrow .stat-item:nth-child(3) {
    grid-column: span 2;
    text-align: center;
}

.card-narrow .user-name {
    font-size: 2.25rem !important;
}

.stat-item {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-family: \'Rajdhani\', sans-serif;
    font-size: 0.65rem;
    font-weight: 800;
    color: rgba(255,255,255,0.4);
    letter-spacing: 2px;
}

.stat-value {
    font-family: \'Orbitron\', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
}

/* LOGROS */
.achievement-slot {
    aspect-ratio: 1;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    transition: all 0.3s;
}

.achievement-slot:hover {
    background: rgba(0, 242, 255, 0.05);
    border-color: rgba(0, 242, 255, 0.2);
    transform: translateY(-5px);
}

.slot-glow {
    position: absolute;
    width: 80%;
    height: 80%;
    background: radial-gradient(circle, rgba(0, 242, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
}

/* PANEL HISTORIAL */
.history-panel {
    flex: 1 1 400px;
    max-width: 450px;
    background: rgba(13, 15, 20, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 242, 255, 0.1);
    border-left: none;
    border-radius: 0 20px 20px 0;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.4s ease-out;
    z-index: 1;
}

@keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.history-scroll-area {
    overflow-y: auto;
    max-height: 700px;
}

.top-game-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 193, 7, 0.05);
    border: 1px solid rgba(255, 193, 7, 0.1);
    padding: 12px;
    border-radius: 12px;
    transition: all 0.2s;
}

.top-game-card:hover {
    background: rgba(255, 193, 7, 0.1);
    border-color: rgba(255, 193, 7, 0.3);
}

.rank-num {
    width: 24px;
    height: 24px;
    background: #ffc107;
    color: #000;
    font-size: 0.75rem;
    font-weight: 900;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.game-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.game-name {
    font-weight: 700;
    font-size: 0.9rem;
    color: white;
}

.game-date {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
}

.game-stats {
    text-align: right;
    display: flex;
    flex-direction: column;
}

.game-score {
    color: #ffc107;
    font-weight: 800;
    font-size: 1.1rem;
}

.game-xp {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
}

.recent-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
}

.recent-icon {
    width: 32px;
    height: 32px;
    background: rgba(0, 242, 255, 0.05);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.game-score-small {
    font-family: \'Orbitron\', sans-serif;
    color: #00e5ff;
    font-weight: 700;
}

.empty-state {
    padding: 20px;
    text-align: center;
    background: rgba(255,255,255,0.01);
    border: 1px dashed rgba(255,255,255,0.1);
    border-radius: 12px;
    color: rgba(255,255,255,0.3);
}

/* DIÁLOGOS */
.glass-popup {
    background: rgba(10, 12, 16, 0.95) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: 20px !important;
}

.achievement-list-item {
    border-radius: 12px;
    background: rgba(255,255,255,0.02) !important;
}

.achievement-list-item.selected {
    border: 1px solid #00e5ff;
    background: rgba(0, 229, 255, 0.1) !important;
}

.avatar-option {
    cursor: pointer;
    transition: transform 0.2s;
    border: 2px solid transparent;
}

.avatar-option:hover {
    transform: scale(1.1);
}

.active-avatar {
    border-color: #00e5ff !important;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
}

.no-mascot {
    border: 2px dashed rgba(255,255,255,0.2) !important;
}

/* RESPONSIVIDAD */
@media (max-width: 1200px) {
    .profile-main-content.history-open {
        flex-direction: column;
        max-width: 600px;
    }
    
    .history-panel {
        border-radius: 0 0 20px 20px;
        border-left: 1px solid rgba(0, 242, 255, 0.1);
        border-top: none;
    }
    
    .history-open .profile-card {
        border-radius: 20px 20px 0 0 !important;
        border-bottom: none;
    }
}

@media (max-width: 600px) {
    .stats-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    
    .stat-item {
        text-align: left !important;
    }
    
    .user-name {
        font-size: 2rem !important;
    }
    
    .avatar-circle {
        size: 120px !important;
    }
}
</style>