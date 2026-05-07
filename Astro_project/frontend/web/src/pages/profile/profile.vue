<template>
    <v-container fluid class="profile-container pa-0">
        <div class="profile-layout-wrapper py-8 px-4 px-md-8">
            <v-row justify="center">
                <!-- COLUMNA PERFIL -->
                <v-col cols="12" md="10" lg="8">
                    <v-card class="profile-card elevation-24" height="100%">
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
                            </div>

                            <div class="user-meta mt-4">
                                <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
                                    <div class="flex-grow-1">
                                        <h1 class="user-name text-h3 font-weight-black text-white capitalize mb-2">
                                            {{ user || $t('profile.guest') }}
                                        </h1>
                                        <div class="d-flex flex-wrap align-center ga-3">
                                            <v-chip :class="['rank-chip font-weight-black', getRankClass(level)]" size="small" variant="flat" @click="titleDialog = true" style="cursor: pointer;">
                                                {{ formattedTitle }}
                                            </v-chip>
                                            <div class="d-flex align-center ga-3 text-grey-lighten-1">
                                                <span class="text-overline">{{ $t('profile.level', { level: level || 1 }) }}</span>
                                                <v-divider vertical class="mx-1 my-1 border-opacity-25" color="white"></v-divider>
                                                <div class="status-indicator d-flex align-center ga-2">
                                                    <div class="status-dot online"></div>
                                                    <span class="text-caption font-weight-bold">{{ $t('profile.online') }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <v-btn
                                        color="cyan-accent-3"
                                        variant="tonal"
                                        prepend-icon="mdi-history"
                                        class="font-weight-black px-6"
                                        rounded="lg"
                                        height="48"
                                        @click="historyDialog = true"
                                    >
                                        {{ $t('profile.flightHistory') }}
                                    </v-btn>
                                </div>

                                <!-- Barra de Progreso XP -->
                                <div class="xp-progress-wrapper mt-6">
                                    <div class="d-flex justify-space-between align-center mb-1 px-1">
                                        <span class="text-caption font-weight-bold text-cyan-accent-3">{{ $t('profile.missionProgress') }}</span>
                                        <span class="text-caption font-weight-black text-white">{{ $t('profile.xpProgress', { xp, req: xpRequired }) }}</span>
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
                                    <span class="stat-label">{{ $t('profile.planLabel') }}</span>
                                    <span class="stat-value text-cyan-accent-2">{{ translatedPlan }}</span>
                                </div>
                                <div class="stat-item text-center">
                                    <span class="stat-label">{{ $t('profile.missionLabel') }}</span>
                                    <span class="stat-value text-amber-accent-2">{{ currentMissionName }}</span>
                                </div>
                                <div class="stat-item text-right">
                                    <span class="stat-label">{{ $t('profile.systemLabel') }}</span>
                                    <span class="stat-value">{{ $t('profile.systemValue') }}</span>
                                </div>
                            </div>

                            <!-- SECCIÓN DE LOGROS -->
                            <div class="achievements-section mb-10">
                                <div class="section-header d-flex align-center justify-space-between mb-4">
                                    <h3 class="text-overline font-weight-black text-grey-lighten-2">{{ $t('profile.featuredAchievements') }}</h3>
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
                                    <v-col v-if="role === 'CENTER' || role === 'TEACHER'" cols="12">
                                        <v-btn block color="cyan-accent-4" height="56" rounded="lg" variant="flat" to="/educational"
                                            class="action-btn font-weight-black mb-2">
                                            <v-icon start icon="mdi-shield-account" class="mr-2"></v-icon>
                                            {{ $t('profile.eduManagement') }}
                                        </v-btn>
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-btn block color="grey-darken-4" height="56" rounded="lg" variant="flat" @click="goToInventory"
                                            class="action-btn font-weight-black">
                                            <v-icon start icon="mdi-cube-outline" class="mr-2"></v-icon>
                                            {{ $t('profile.inventoryBtn') }}
                                        </v-btn>
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-btn block color="grey-darken-4" height="56" rounded="lg" variant="flat" @click="changePlan"
                                            class="action-btn font-weight-black">
                                            <v-icon start icon="mdi-rocket-launch-outline" class="mr-2"></v-icon>
                                            {{ $t('profile.changePlanBtn') }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                                <v-btn block color="red-darken-4" height="56" rounded="lg" variant="tonal" @click="showLogoutDialog = true"
                                    class="logout-btn font-weight-black mt-4">
                                    {{ $t('profile.logoutBtn') }}
                                </v-btn>
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </div>

        <!-- DIÁLOGO DE HISTORIAL (MÁS COMPACTO) -->
        <v-dialog v-model="historyDialog" max-width="850" transition="fade-transition">
            <v-card class="history-popup-card">
                <div class="history-popup-header pa-4 d-flex align-center justify-space-between">
                    <div>
                        <h2 class="text-h5 font-weight-black text-white mb-0">{{ $t('profile.flightHistory') }}</h2>
                        <p class="text-caption text-cyan-accent-2 mb-0">{{ $t('profile.flightHistorySub') }}</p>
                    </div>
                    <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="historyDialog = false"></v-btn>
                </div>

                <v-divider class="border-opacity-10"></v-divider>

                <div class="history-popup-content pa-5">
                    <v-row>
                        <!-- TOP MISIONES (IZQUIERDA) -->
                        <v-col cols="12" md="6" class="pr-md-6 border-right-sep">
                            <h4 class="text-overline text-amber-accent-3 font-weight-black mb-6 d-flex align-center">
                                <v-icon size="20" class="mr-2">mdi-star</v-icon> {{ $t('profile.personalRecords') }}
                            </h4>
                            <div v-if="topGames.length > 0" class="top-games-list-popup ga-4 d-flex flex-column">
                                <div v-for="(match, idx) in topGames" :key="`top-${idx}`" class="top-game-card-popup">
                                    <div class="rank-num">{{ idx + 1 }}</div>
                                    <div class="game-info flex-grow-1">
                                        <span class="game-name">{{ $te('games.' + match.game) ? $t('games.' + match.game) : match.game }}</span>
                                        <span class="game-date text-caption text-grey ml-3">{{ new Date(match.createdAt).toLocaleDateString() }}</span>
                                    </div>
                                    <div class="game-score-small-popup font-weight-black text-amber-accent-3">{{ match.score }}</div>
                                </div>
                            </div>
                            <div v-else class="empty-state-popup">
                                <v-icon icon="mdi-trophy-outline" size="48" color="grey-darken-3" class="mb-2"></v-icon>
                                <span class="text-caption">{{ $t('profile.noEliteRecords') }}</span>
                            </div>
                        </v-col>

                        <!-- RECIENTES (DERECHA) -->
                        <v-col cols="12" md="6" class="pl-md-6">
                            <h4 class="text-overline text-cyan-accent-3 font-weight-black mb-6 d-flex align-center">
                                <v-icon size="20" class="mr-2">mdi-history</v-icon> {{ $t('profile.recentIncursions') }}
                            </h4>
                            <div v-if="gameHistory.length > 0" class="recent-list-popup ga-3 d-flex flex-column">
                                <div v-for="(match, idx) in paginatedHistory" :key="`hist-${idx}`" class="recent-item-popup">
                                    <div class="recent-icon-popup">
                                        <v-icon size="18" color="cyan-accent-2">mdi-sword-cross</v-icon>
                                    </div>
                                    <div class="game-info flex-grow-1">
                                        <span class="game-name font-weight-bold">{{ $te('games.' + match.game) ? $t('games.' + match.game) : match.game }}</span>
                                        <span class="game-date text-caption text-grey ml-3">{{ new Date(match.createdAt).toLocaleDateString() }}</span>
                                    </div>
                                    <div class="game-score-small-popup font-weight-black text-white">{{ match.score }}</div>
                                </div>
                            </div>

                            <!-- Paginación Mejorada -->
                            <div v-if="gameHistory.length > pageSize" class="d-flex align-center justify-center ga-6 mt-8">
                                <v-btn density="comfortable" variant="tonal" color="cyan-accent-3" icon="mdi-chevron-left"
                                    :disabled="currentPage === 1" @click="currentPage--"></v-btn>
                                <div class="text-center">
                                    <span class="text-h6 font-weight-black text-white">{{ currentPage }}</span>
                                    <span class="text-caption text-grey ml-1">/ {{ totalPages }}</span>
                                </div>
                                <v-btn density="comfortable" variant="tonal" color="cyan-accent-3" icon="mdi-chevron-right"
                                    :disabled="currentPage >= totalPages" @click="currentPage++"></v-btn>
                            </div>

                            <div v-if="gameHistory.length === 0" class="empty-state-popup">
                                <span class="text-caption">{{ $t('profile.noRecent') }}</span>
                            </div>
                        </v-col>
                    </v-row>
                </div>
            </v-card>
        </v-dialog>

        <!-- Diálogo Selección Logros -->
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

        <!-- Diálogo Avatar -->
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
                            <div class="text-caption text-grey-lighten-1 mt-2 font-weight-bold">{{ opt.label }}</div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo Título -->
        <v-dialog v-model="titleDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    {{ $t('profile.selectTitle') }}
                    <v-btn icon="mdi-close" variant="text" color="white" @click="titleDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-list bg-color="transparent" class="text-white">
                        <v-list-item
                            :title="$t('profile.defaultTitle')"
                            :subtitle="$t('profile.rankBasedOnLevel')"
                            @click="selectTitle(null)"
                            class="mb-2 achievement-list-item"
                            :class="{ 'selected': !selectedTitle }"
                        >
                            <template v-slot:prepend>
                                <v-icon color="grey-lighten-1" class="mr-3">mdi-medal-outline</v-icon>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-for="t in ownedTitles"
                            :key="t.id"
                            :title="$t('shopItems.' + getTitleKey(t.name) + '.name')"
                            :subtitle="$t('profile.boughtInShop')"
                            @click="selectTitle(t.name)"
                            class="mb-2 achievement-list-item"
                            :class="{ 'selected': selectedTitle === t.name }"
                        >
                            <template v-slot:prepend>
                                <v-icon :color="t.color" class="mr-3">{{ t.icon }}</v-icon>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo Logout -->
        <v-dialog v-model="showLogoutDialog" max-width="400">
            <v-card class="glass-popup pa-6 text-center shadow-xl">
                <v-icon icon="mdi-alert-circle-outline" color="error" size="64" class="mb-4 pulse-error"></v-icon>
                <h2 class="text-h5 font-weight-bold text-white mb-2 tracking-tighter">{{ $t('profile.logoutBtn').toUpperCase() }}?</h2>
                <p class="text-body-2 text-grey-lighten-1 mb-8">
                    {{ $t('profile.logoutConfirm') }}
                </p>
                <div class="d-flex justify-center mt-4">
                    <v-btn variant="outlined" color="grey-lighten-1" @click="showLogoutDialog = false" class="rounded-lg flex-grow-1 mr-2" height="48">
                        {{ $t('general.cancel').toUpperCase() }}
                    </v-btn>
                    <v-btn variant="flat" color="error" @click="confirmLogout" class="rounded-lg flex-grow-1 ml-2" height="48">
                        {{ $t('profile.logoutBtn').split(' ')[0].toUpperCase() }}
                    </v-btn>
                </div>
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
const titleDialog = ref(false)
const historyDialog = ref(false)
const showLogoutDialog = ref(false)
const currentPage = ref(1)
const pageSize = 6
const currentSlotIndex = ref(null)

const { 
    user, rank, selectedTitle, plan, role, parentId, selectedAchievements, unlockedAchievements, 
    avatar, level, coins, xp, partides, inventory,
    gameHistory, topGames, maxScores, totalGamesPlayed, totalPoints
} = storeToRefs(astroStore)

const getRankName = (lvl = 1) => {
    const index = Math.min(Math.floor((lvl - 1) / 10), 14);
    return t(`ranks.${index}`);
};

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

const missionKeyPrefixes = ['mission_1', 'mission_2', 'mission_3', 'mission_4', 'mission_5', 'mission_6'];

const currentMissionName = computed(() => {
    const currentLvl = level.value || 1;
    if (currentLvl <= missionKeyPrefixes.length) {
        return t(`profile.${missionKeyPrefixes[currentLvl - 1]}`).toUpperCase();
    }
    return t('profile.deepSpace', { level: currentLvl });
});

const translatedPlan = computed(() => {
    const p = plan.value || 'individual_free';
    return t(`plans.${p.toLowerCase()}`).toUpperCase();
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

const ALL_TITLES = [
    { id: 105, name: 'El Imparable', key: 'titleUnstoppable', icon: 'mdi-format-title', color: 'red-accent-3' },
    { id: 106, name: 'Leyenda Galáctica', key: 'titleLegend', icon: 'mdi-format-title', color: 'cyan-accent-3' },
    { id: 107, name: 'Destructor de Asteroides', key: 'titleDestroyer', icon: 'mdi-format-title', color: 'amber-accent-3' }
]

function getTitleKey(titleName) {
    if (!titleName) return '';
    const cleanName = titleName.replace('Título: ', '');
    const title = ALL_TITLES.find(t => t.name === cleanName);
    return title ? title.key : '';
}

const ownedTitles = computed(() => {
    if (!inventory.value) return [];
    return ALL_TITLES.filter(title => {
        const item = inventory.value.find(i => Number(i.id) === title.id);
        return item && Number(item.quantity) > 0;
    });
})

const formattedTitle = computed(() => {
    if (selectedTitle.value) {
        return t('shopItems.' + getTitleKey(selectedTitle.value) + '.name');
    }
    return getRankName(level.value);
})

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
    if (!user.value) return;
    selectionDialog.value = false;
    const targetId = achievementId !== null ? Number(achievementId) : null;
    let newSelection = [...selectedAchievements.value];
    if (targetId !== null) {
        const existingIndex = newSelection.findIndex(id => id !== null && Number(id) === targetId);
        if (existingIndex !== -1) newSelection[existingIndex] = null;
    }
    newSelection[currentSlotIndex.value] = targetId;
    await astroStore.updateAchievements(newSelection);
}

function confirmLogout() {
    showLogoutDialog.value = false
    astroStore.logout()
    router.push('/login')
}

function goToInventory() { router.push('/inventory') }
function changePlan() { router.push('/plans') }

function selectAvatar(file) {
    astroStore.updateAvatar(file)
    avatarDialog.value = false
}

function selectTitle(titleName) {
    astroStore.updateSelectedTitle(titleName)
    titleDialog.value = false
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

.profile-card {
    background: #0a0c10 !important;
    border: 1px solid rgba(0, 242, 255, 0.1);
    border-radius: 20px !important;
    overflow: hidden;
    position: relative;
    z-index: 2;
}

.banner-section { position: relative; }
.banner-image { filter: brightness(0.8); }
.banner-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 60%;
    background: linear-gradient(to top, #0a0c10, transparent);
}

.profile-header {
    margin-top: -80px;
    position: relative;
    z-index: 3;
}

.avatar-container { display: flex; align-items: flex-end; gap: 16px; }
.main-avatar-wrapper { position: relative; }
.avatar-circle {
    border: 5px solid #0a0c10;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}
.avatar-circle :deep(.v-img__img) { transform: scale(1.1); }
.edit-avatar-btn {
    position: absolute; bottom: 5px; right: 5px;
    border: 3px solid #0a0c10 !important;
}

.user-name {
    letter-spacing: -1px !important;
    text-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.rank-chip {
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.3s ease;
}

/* Ranks */
.rank-tier-1 { background: linear-gradient(135deg, #78909c, #455a64) !important; color: white !important; }
.rank-tier-2 { background: linear-gradient(135deg, #00acc1, #006064) !important; color: white !important; border: 1px solid rgba(0, 255, 255, 0.3) !important; }
.rank-tier-3 { background: linear-gradient(135deg, #8e24aa, #4a148c) !important; color: white !important; border: 1px solid rgba(255, 0, 255, 0.4) !important; }
.rank-tier-4 { background: linear-gradient(135deg, #ff9800, #e65100) !important; color: white !important; border: 2px solid rgba(255, 255, 0, 0.5) !important; }
.rank-tier-5 { background: linear-gradient(135deg, #c62828, #1a237e) !important; color: white !important; border: 2px solid #ff1744 !important; }
.rank-tier-6 { background: linear-gradient(270deg, #6200ea, #00b0ff, #d500f9) !important; background-size: 400% 400% !important; animation: cosmic-bg 10s ease infinite !important; }

@keyframes cosmic-bg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online { background: #00e676; box-shadow: 0 0 10px #00e676; }

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px;
}
.stat-item { display: flex; flex-direction: column; }
.stat-label { font-family: 'Rajdhani', sans-serif; font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 2px; }
.stat-value { font-family: 'Orbitron', sans-serif; font-size: 0.9rem; font-weight: 700; }

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
}
.achievement-slot:hover { background: rgba(0, 242, 255, 0.05); border-color: rgba(0, 242, 255, 0.2); transform: translateY(-5px); }

/* HISTORY POPUP */
.history-popup-card {
    background: #0a0c10 !important;
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: 24px !important;
    overflow: hidden;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.8) !important;
}

.history-popup-content {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 229, 255, 0.2) transparent;
}

.history-popup-content::-webkit-scrollbar {
    width: 6px;
}

.history-popup-content::-webkit-scrollbar-thumb {
    background: rgba(0, 229, 255, 0.2);
    border-radius: 10px;
}
.history-popup-header { background: linear-gradient(to right, #0a0c10, #111827); }
.top-game-card-popup {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255, 193, 7, 0.03); border: 1px solid rgba(255, 193, 7, 0.1);
    padding: 10px 16px; border-radius: 10px; transition: all 0.3s;
}
.top-game-card-popup:hover { background: rgba(255, 193, 7, 0.08); border-color: rgba(255, 193, 7, 0.3); transform: scale(1.01); }

.recent-item-popup {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05); border-radius: 10px;
}
.recent-item-popup:hover { background: rgba(255,255,255,0.05); border-color: rgba(0, 242, 255, 0.2); }

.border-right-sep {
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 960px) {
    .border-right-sep {
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 24px;
        margin-bottom: 24px;
    }
}

.game-score-small-popup { font-family: 'Orbitron', sans-serif; color: #00e5ff; font-size: 0.95rem; }
.rank-num {
    width: 28px; height: 28px; background: #ffc107; color: #000;
    font-weight: 900; font-size: 0.8rem; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
}

.empty-state-popup {
    padding: 40px; text-align: center; background: rgba(255,255,255,0.01);
    border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;
    color: rgba(255,255,255,0.2);
}

.glass-popup {
    background: rgba(10, 12, 16, 0.95) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: 20px !important;
}

.achievement-list-item { border-radius: 12px; background: rgba(255,255,255,0.02) !important; margin-bottom: 8px; }
.achievement-list-item.selected { border: 1px solid #00e5ff; background: rgba(0, 229, 255, 0.1) !important; }

.avatar-option { cursor: pointer; transition: transform 0.2s; }
.avatar-option:hover { transform: scale(1.1); }
.active-avatar { border: 2px solid #00e5ff !important; box-shadow: 0 0 15px rgba(0, 229, 255, 0.3); }

@media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
    .user-name { font-size: 2rem !important; }
}

.pulse-error { animation: pulse-red 2s infinite; }
@keyframes pulse-red {
    0% { filter: drop-shadow(0 0 0px rgba(255, 82, 82, 0)); }
    50% { filter: drop-shadow(0 0 10px rgba(255, 82, 82, 0.5)); }
    100% { filter: drop-shadow(0 0 0px rgba(255, 82, 82, 0)); }
}
.tracking-tighter { letter-spacing: -1px; }
</style>