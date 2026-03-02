<template>
    <v-container fluid class="profile-container d-flex justify-center">
        <div class="profile-wrapper" style="display: flex !important; flex-wrap: nowrap; align-items: stretch; justify-content: center;">
            <v-card width="620" class="profile-card" :class="{ 'history-open': historyDialog }" elevation="24">

                <!-- BANNER SUPERIOR -->
                <div class="banner-section">
                    <v-img src="/fondo3.jpg" cover height="180" class="banner-image">
                        <template v-slot:placeholder>
                            <div class="d-flex align-center justify-center fill-height">
                                <v-progress-circular indeterminate color="cyan"></v-progress-circular>
                            </div>
                        </template>
                    </v-img>
                </div>

                <!-- CONTENIDO DE CABECERA -->
                <div class="profile-header-wrap px-8">
                    <div class="avatar-overlap-container">
                        <div class="main-avatar-box">
                            <v-avatar size="180" class="avatar-circle">
                                <v-img :src="`/${avatar}`" alt="Avatar" cover></v-img>
                            </v-avatar>
                            <v-btn icon="mdi-camera" size="small" color="cyan-accent-3" class="btn-edit-avatar"
                                elevation="4" @click="avatarDialog = true"></v-btn>
                        </div>
                        <div class="mascot-overlap-box">
                            <v-avatar v-if="mascot" size="85" class="mascot-badge-big" @click="mascotDialog = true">
                                <v-img :src="`/${mascot}`" cover></v-img>
                            </v-avatar>
                            <v-btn v-else icon="mdi-paw-plus" size="large" color="purple-accent-1" class="btn-add-mascot"
                                @click="mascotDialog = true"></v-btn>
                        </div>
                    </div>

                    <!-- Datos del Usuario -->
                    <div class="user-info-section text-left mt-4">
                        <div class="d-flex align-center justify-space-between w-100">
                            <div class="flex-grow-1 pr-6">
                                <h1 class="text-h3 font-weight-black text-white mb-0 capitalize">
                                    {{ user || $t('profile.guest') }}
                                </h1>
                                <div class="d-flex align-center ga-2 mt-1">
                                    <v-chip color="cyan-accent-3" size="small" variant="flat"
                                        class="text-black font-weight-bold">
                                        {{ rank || $t('profile.defaultRank') }}
                                    </v-chip>
                                    <span class="text-grey-lighten-1 text-body-2">• {{ $t('profile.level', { level: level || 1 }) }}</span>
                                    <div class="d-flex align-center ga-1 ml-3">
                                        <div class="status-dot-large" :class="user ? 'online' : 'offline'"></div>
                                        <span class="text-caption text-grey">{{ user ? $t('profile.online') : $t('profile.offline') }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- BOTÓN HISTORIAL PEGADO -->
                            <div class="history-action-header">
                                <v-btn
                                    color="cyan-accent-4"
                                    variant="outlined"
                                    class="btn-modern-history px-6"
                                    rounded="pill"
                                    prepend-icon="mdi-history"
                                    @click="historyDialog = !historyDialog"
                                >
                                    {{ historyDialog ? $t('profile.closeHistory') : $t('profile.openHistory') }}
                                </v-btn>
                            </div>
                        </div>

                        <div class="d-flex align-center w-100 mt-4">
                            <v-progress-linear
                                :model-value="(xp / xpRequired) * 100"
                                color="cyan-accent-3"
                                height="8"
                                rounded
                                bg-color="rgba(255,255,255,0.1)"
                                class="mr-3 shadow-cyan"
                            ></v-progress-linear>
                            <span class="text-caption text-cyan-accent-3 font-weight-bold" style="white-space: nowrap;">
                                {{ $t('profile.xpProgress', { xp, req: xpRequired }) }}
                            </span>
                        </div>
                    </div>

                    <v-divider class="my-6 border-opacity-10"></v-divider>

                    <!-- Plan y Estadísticas Rápidas -->
                    <div class="quick-stats d-flex justify-space-between mb-8">
                        <div class="stat-card">
                            <span class="label">{{ $t('profile.planLabel') }}</span>
                            <span class="value text-cyan-accent-3">{{ plan || 'INDIVIDUAL_FREE' }}</span>
                        </div>
                        <div class="stat-card text-center">
                            <span class="label">{{ $t('profile.missionLabel') }}</span>
                            <span class="value text-amber-accent-3">{{ currentMissionName }}</span>
                        </div>
                        <div class="stat-card text-right">
                            <span class="label">{{ $t('profile.systemLabel') }}</span>
                            <span class="value">ASTRO-V1</span>
                        </div>
                    </div>

                    <!-- Logros Seleccionados -->
                    <div class="achievements-section mb-8">
                        <div class="d-flex align-center justify-space-between mb-4">
                            <h3 class="text-overline font-weight-black text-grey-lighten-1">{{ $t('profile.activeAchievements') }}</h3>
                        </div>
                        <v-row dense>
                            <v-col v-for="i in 3" :key="i" cols="4">
                                <v-card variant="flat" color="#1a1d26" class="achievement-display-box"
                                    @click="openSelection(i - 1)">
                                    <Medal v-if="getAchievement(selectedAchievements[i - 1])"
                                        :type="getAchievement(selectedAchievements[i - 1]).type"
                                        :icon="getAchievement(selectedAchievements[i - 1]).icon" :scale="0.65"
                                        :icon-size="48" />
                                    <v-icon v-else icon="mdi-plus" color="grey-darken-3" size="36"></v-icon>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>

                    <!-- Botonera Final -->
                    <div class="actions-grid ga-3 mb-8">
                        <v-row dense>
                            <v-col cols="6">
                                <v-btn block color="grey-darken-4" height="48" rounded="lg" @click="goToInventory"
                                    class="font-weight-bold">
                                    {{ $t('profile.inventoryBtn') }}
                                </v-btn>
                            </v-col>
                            <v-col cols="6">
                                <v-btn block color="grey-darken-4" height="48" rounded="lg" @click="changePlan"
                                    class="font-weight-bold">
                                    {{ $t('profile.changePlanBtn') }}
                                </v-btn>
                            </v-col>
                        </v-row>
                        <v-btn block color="#c62828" height="48" rounded="lg" @click="handleLogout"
                            class="font-weight-bold mt-2">
                            {{ $t('profile.logoutBtn') }}
                        </v-btn>
                    </div>
                </div>

                <!-- PANEL DE HISTORIAL INTEGRADO (OVERLAY A LA DERECHA) -->
            <div v-show="historyDialog" class="history-panel-inline">
                <div class="history-content pa-4">
                    <div class="mb-4 position-relative">
                        <!-- Botón de Cerrar (X) -->
                        <v-btn 
                            icon="mdi-close" 
                            variant="text" 
                            color="cyan-accent-3" 
                            size="small"
                            class="position-absolute"
                            style="top: -10px; right: -10px; z-index: 100;"
                            @click="historyDialog = false"
                        ></v-btn>

                        <h3 class="text-overline cyan--text mb-4 d-flex align-center pr-8">
                            <v-icon size="18" color="amber-accent-2" class="mr-2">mdi-trophy-variant</v-icon>
                            {{ $t('profile.topGames') }}
                        </h3>
                        <v-row v-if="topGames.length > 0" dense>
                            <v-col v-for="(match, idx) in topGames" :key="'top-'+idx" cols="12">
                                <v-card class="top-match-card pa-2" variant="flat">
                                    <div class="d-flex align-center justify-space-between w-100">
                                        <div class="d-flex align-center">
                                            <div class="top-rank mr-3" style="width: 24px; height: 24px; font-size: 14px;">{{ idx + 1 }}</div>
                                            <div>
                                                <div class="text-body-1 font-weight-bold text-white text-capitalize">{{ $te('games.' + match.game) ? $t('games.' + match.game) : match.game }}</div>
                                                <div class="text-caption text-grey">
                                                    {{ new Date(match.createdAt).toLocaleDateString() }}
                                                    <v-chip size="x-small" color="grey-darken-3" class="ml-1" v-if="match.timeSeconds">
                                                        {{ (match.timeSeconds / 60).toFixed(1) }} {{ $t('profile.min') }}
                                                    </v-chip>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-h6 font-weight-black text-amber-accent-2">{{ match.score }} {{ $t('profile.pts') }}</div>
                                            <div class="text-tiny grey--text">{{ $t('profile.xpEarned', { xp: match.xpEarned }) }}</div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>
                        <div v-else class="text-center py-6 glass-box rounded-lg">
                            <v-icon icon="mdi-star-outline" color="grey" class="mb-2"></v-icon>
                            <p class="text-body-2 text-grey">{{ $t('profile.noRecords') }}</p>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-overline grey--text mb-4">{{ $t('profile.recentIncursions') }}</h3>
                        <v-list bg-color="transparent" class="pa-0">
                            <v-list-item
                                v-for="(match, idx) in paginatedHistory"
                                :key="'hist-'+idx"
                                class="recent-match-item mb-1"
                                rounded="lg"
                                density="compact"
                            >
                                <template v-slot:prepend>
                                    <v-avatar color="cyan-darken-4" size="32" class="mr-3">
                                        <v-icon color="cyan-accent-2" size="16">mdi-sword-cross</v-icon>
                                    </v-avatar>
                                </template>
                                <v-list-item-title class="text-capitalize text-white font-weight-medium text-body-2">
                                    {{ $te('games.' + match.game) ? $t('games.' + match.game) : match.game }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption grey--text" style="font-size: 10px !important;">
                                    {{ new Date(match.createdAt).toLocaleDateString() }}
                                </v-list-item-subtitle>
                                <template v-slot:append>
                                    <div class="text-right">
                                        <div class="text-body-2 font-weight-bold text-cyan-accent-3">{{ match.score }} pts</div>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>

                        <!-- Botones de Paginación -->
                        <div v-if="gameHistory.length > pageSize" class="d-flex align-center justify-center ga-4 mt-6">
                            <v-btn
                                density="comfortable"
                                variant="text"
                                color="cyan-accent-3"
                                icon="mdi-chevron-double-left"
                                :disabled="currentPage === 1"
                                @click="currentPage--"
                            ></v-btn>
                            <span class="text-caption font-weight-bold text-grey">{{ $t('profile.page', { current: currentPage, total: totalPages }) }}</span>
                            <v-btn
                                density="comfortable"
                                variant="text"
                                color="cyan-accent-3"
                                icon="mdi-chevron-double-right"
                                :disabled="currentPage >= totalPages"
                                @click="currentPage++"
                            ></v-btn>
                        </div>

                        <div v-if="gameHistory.length === 0" class="text-center py-6 glass-box rounded-lg mt-2">
                            <v-icon icon="mdi-history" color="grey" class="mb-2"></v-icon>
                            <p class="text-body-2 text-grey">{{ $t('profile.noRecent') }}</p>
                        </div>
                    </div>
                </div>
            </div>
            </v-card>
        </div>

        <!-- Diálogo de Selección de Logros -->
        <v-dialog v-model="selectionDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    {{ $t('profile.selectAchievement') }}
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

        <!-- Diálogo de Selección de Avatar -->
        <v-dialog v-model="avatarDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    {{ $t('profile.astronautSuit') }}
                    <v-btn icon="mdi-close" variant="text" color="white" @click="avatarDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-row class="mt-2 text-center">
                        <v-col v-for="opt in avatarOptions" :key="opt.file" cols="4" sm="3" class="pa-2">
                            <v-avatar size="70" class="avatar-option" :class="{ 'active-avatar': avatar === opt.file }"
                                @click="selectAvatar(opt.file)">
                                <v-img :src="`/${opt.file}`"></v-img>
                            </v-avatar>
                            <div class="text-caption text-grey-lighten-1 mt-1">{{ opt.label }}</div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo de Selección de Mascota -->
        <v-dialog v-model="mascotDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    {{ $t('profile.missionCompanion') }}
                    <v-btn icon="mdi-close" variant="text" color="white" @click="mascotDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-row class="mt-2 text-center">
                        <v-col v-for="m in mascotOptions" :key="m.file" cols="4" sm="3" class="pa-2">
                            <v-avatar size="70" class="avatar-option" :class="{ 'active-avatar': mascot === m.file }"
                                @click="selectMascot(m.file)">
                                <v-img :src="`/${m.file}`"></v-img>
                            </v-avatar>
                            <div class="text-caption text-grey-lighten-1 mt-1">{{ m.label }}</div>
                        </v-col>
                        <v-col cols="4" sm="3" class="pa-2">
                            <v-avatar size="70" class="avatar-option d-flex align-center justify-center"
                                @click="selectMascot(null)" style="border: 1px dashed rgba(255,255,255,0.3)">
                                <v-icon color="grey">mdi-close</v-icon>
                            </v-avatar>
                            <div class="text-caption text-grey-lighten-1 mt-1">{{ $t('profile.none') }}</div>
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
import { useAstroStore } from '@/stores/astroStore' // Importamos el store
import { storeToRefs } from 'pinia' // Para mantener la reactividad
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
        console.error("❌ No se puede guardar: Usuario no identificado");
        alert(t('profile.loginRequired'));
        return;
    }

    // Cerramos el diálogo inmediatamente para mejor UX
    selectionDialog.value = false;

    // Convertimos a número si no es null
    const targetId = achievementId !== null ? Number(achievementId) : null;

    // Clonamos la selección actual
    let newSelection = [...selectedAchievements.value];

    // Si el logro ya estaba en otro slot, lo quitamos de ahí para evitar duplicados
    if (targetId !== null) {
        const existingIndex = newSelection.findIndex(id => id !== null && Number(id) === targetId);
        if (existingIndex !== -1) {
            newSelection[existingIndex] = null;
        }
    }

    // Ponemos el nuevo logro en el slot actual
    newSelection[currentSlotIndex.value] = targetId;

    // Guardamos la selección completa (la store se encarga de la actualización optimista)
    console.log(`🎯 Seleccionando logro ${targetId} para slot ${currentSlotIndex.value}`);
    const result = await astroStore.updateAchievements(newSelection);

    if (!result.success) {
        console.error("❌ Error al sincronizar con el servidor:", result.message);
    }
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
// Observar apertura de historial para refrescar datos
watch(historyDialog, async (isOpen) => {
    if (isOpen && user.value) {
        console.log("🔄 Refrescando estadísticas para el historial...");
        await astroStore.fetchUserStats();
    }
});
</script>


<style scoped>

.shadow-cyan { filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.4)); }
.tracking-wider { letter-spacing: 1px; }

/* Estilo Base */
.profile-container {
    background: #000000 !important;
    min-height: 100vh;
    padding-top: 40px;
    padding-bottom: 120px;
    overflow-x: auto;
}

/* Tarjeta Principal (Sólida, no Glassmorphism) */
.profile-card {
    background: #0d0f14 !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    transition: all 0.3s;
    position: relative; /* Ajuste para overlay */
}

.profile-card.history-open {
    /* Mantenemos el border radius original porque el historial ahora flota, no se fusiona. */
    border-radius: 16px !important;
}

/* Banner superior */
.banner-section {
    position: relative;
    background: #1a1d26;
}

.banner-image {
    filter: brightness(0.7);
}

/* Contenedor de Avatar con Overlap */
.profile-header-wrap {
    position: relative;
    z-index: 1;
}

.avatar-overlap-container {
    position: relative;
    margin-top: -70px;
    /* LinkedIn Style Overlap */
    margin-bottom: 20px;
    display: flex;
    align-items: flex-end;
    gap: 15px;
}

.main-avatar-box {
    position: relative;
}

.avatar-circle {
    border: 6px solid #0d0f14;
    background: white;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-circle :deep(.v-img__img) {
    border-radius: 50%;
    transform: scale(1.4);
    transform-origin: center center;
    object-position: center center;
}

.btn-edit-avatar {
    position: absolute;
    bottom: 5px;
    right: 5px;
    border: 4px solid #0d0f14 !important;
    z-index: 2;
}

/* Mascota Integrada en la Cabecera */
.mascot-overlap-box {
    margin-bottom: 5px;
}

.mascot-badge-big {
    border: 5px solid #0d0f14;
    background: white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.mascot-badge-big :deep(.v-img__img) {
    border-radius: 50%;
    transform: scale(1.4);
    transform-origin: center center;
    object-position: center center;
}

.mascot-badge-big:hover {
    transform: scale(1.1) rotate(5deg);
}

.btn-add-mascot {
    border: 3px solid #0d0f14 !important;
}

/* Datos de Usuario */
.capitalize {
    text-transform: capitalize;
}

.status-dot-large {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.status-dot-large.online {
    background: #4caf50;
    box-shadow: 0 0 10px #4caf50;
}

.status-dot-large.offline {
    background: #f44336;
}

/* Tarjetas de Estadísticas */
.quick-stats {
    gap: 10px;
}

.stat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.stat-card .label {
    font-size: 10px;
    font-weight: 900;
    color: #616161;
    letter-spacing: 1px;
}

.stat-card .value {
    font-size: 14px;
    font-weight: 700;
    color: #e0e0e0;
}

/* Logros */
.achievement-display-box {
    height: 150px;
    /* Tamaño fijo para todos los huecos */
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.achievement-display-box:hover {
    background: #242835 !important;
    border-color: rgba(0, 229, 255, 0.3);
    transform: translateY(-4px);
}

/* Diálogos (Sí mantenemos un poco de glass para los popups) */
.glass-popup {
    background: rgba(15, 17, 23, 0.95) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
}

.achievement-list-item {
    border-radius: 12px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.02);
}

.achievement-list-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.achievement-list-item.selected {
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.3);
}

.avatar-option {
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
}

.avatar-option:hover {
    transform: scale(1.1);
    border-color: #00e5ff;
}

.active-avatar {
    border-color: #00e5ff !important;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
}

.locked-item {
    opacity: 0.4;
    filter: grayscale(1);
}

/* HISTORIAL V2 STYLES */
.profile-wrapper {
    transition: all 0.4s ease;
    width: auto;
    min-width: fit-content;
}

.history-panel-inline {
    width: 100% !important;
    background: rgba(13, 15, 20, 0.95) !important;
    backdrop-filter: blur(15px);
    border-radius: 16px !important;
    min-height: 100%;
    z-index: 50 !important;
    animation: slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: absolute;
    top: 0;
    right: 0;
}

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
}

.top-match-card {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 215, 0, 0.02) 100%);
    border: 1px solid rgba(255, 215, 0, 0.15);
    border-radius: 16px;
    transition: all 0.3s;
}

.top-match-card:hover {
    border-color: rgba(255, 215, 0, 0.4);
    background: rgba(255, 215, 0, 0.08);
}

.top-rank {
    width: 32px;
    height: 32px;
    background: #ffc107;
    color: #000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 18px;
    box-shadow: 0 0 10px rgba(255, 193, 7, 0.4);
}

.recent-match-item {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
}

.recent-match-item:hover {
    background: rgba(0, 229, 255, 0.05) !important;
    border-color: rgba(0, 229, 255, 0.15);
}

.glass-box {
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.1);
}

.text-tiny {
    font-size: 10px;
}
</style>