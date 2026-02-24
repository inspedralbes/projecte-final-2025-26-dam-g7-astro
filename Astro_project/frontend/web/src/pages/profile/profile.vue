<template>
    <v-container class="profile-container d-flex justify-center">
        <v-card width="620" class="profile-card" elevation="24">

            <!-- BANNER SUPERIOR (LinkedIn Style) -->
            <div class="banner-section">
                <v-img src="/fondo3.jpg" cover height="180" class="banner-image">
                    <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular indeterminate color="cyan"></v-progress-circular>
                        </div>
                    </template>
                </v-img>
            </div>

            <!-- CONTENIDO DE CABECERA (Overlap) -->
            <div class="profile-header-wrap px-8">
                <div class="avatar-overlap-container">
                    <!-- Avatar Principal -->
                    <div class="main-avatar-box">
                        <v-avatar size="180" class="avatar-circle">
                            <v-img :src="`/${avatar}`" alt="Avatar" cover></v-img>
                        </v-avatar>
                        <v-btn icon="mdi-camera" size="small" color="cyan-accent-3" class="btn-edit-avatar"
                            elevation="4" @click="avatarDialog = true"></v-btn>
                    </div>
                    <!-- Mascota Integrada -->
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
                                {{ user || 'Explorador' }}
                            </h1>
                            <div class="d-flex align-center ga-2 mt-1">
                                <v-chip color="cyan-accent-3" size="small" variant="flat"
                                    class="text-black font-weight-bold">
                                    {{ rank || 'Cadete Estelar' }}
                                </v-chip>
                                <span class="text-grey-lighten-1 text-body-2">• Nivel {{ level || 1 }}</span>
                                <div class="d-flex align-center ga-1 ml-3">
                                    <div class="status-dot-large" :class="user ? 'online' : 'offline'"></div>
                                    <span class="text-caption text-grey">{{ user ? 'En órbita' : 'En base' }}</span>
                                </div>
                            </div>
                            
                            <div class="d-flex align-center w-100 mt-2">
                                <v-progress-linear
                                    :model-value="(xp / xpRequired) * 100"
                                    color="cyan-accent-3"
                                    height="8"
                                    rounded
                                    bg-color="rgba(255,255,255,0.1)"
                                    class="mr-3 shadow-cyan"
                                ></v-progress-linear>
                                <span class="text-caption text-cyan-accent-3 font-weight-bold" style="white-space: nowrap;">
                                    {{ xp }} / {{ xpRequired }} XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <v-divider class="my-6 border-opacity-10"></v-divider>

                <!-- Plan y Estadísticas Rápidas -->
                <div class="quick-stats d-flex justify-space-between mb-8">
                    <div class="stat-card">
                        <span class="label">PLAN ACTUAL</span>
                        <span class="value text-cyan-accent-3">{{ plan || 'INDIVIDUAL_FREE' }}</span>
                    </div>
                    <div class="stat-card text-center">
                        <span class="label">MISIÓN</span>
                        <span class="value">EXPLORACIÓN</span>
                    </div>
                    <div class="stat-card text-right">
                        <span class="label">SISTEMA</span>
                        <span class="value">ASTRO-V1</span>
                    </div>
                </div>

                <!-- Logros Seleccionados -->
                <div class="achievements-section mb-8">
                    <div class="d-flex align-center justify-space-between mb-4">
                        <h3 class="text-overline font-weight-black text-grey-lighten-1">LOGROS ACTIVOS</h3>
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
                                INVENTARIO
                            </v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block color="grey-darken-4" height="48" rounded="lg" @click="changePlan"
                                class="font-weight-bold">
                                CAMBIAR PLAN
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-btn block color="#c62828" height="48" rounded="lg" @click="handleLogout"
                        class="font-weight-bold mt-2">
                        CERRAR SESSIÓN Y SALIR
                    </v-btn>
                </div>
            </div>
        </v-card>
        <!-- Diálogo de Selección de Logros -->
        <v-dialog v-model="selectionDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    Seleccionar Logro
                    <v-btn icon="mdi-close" variant="text" color="white" @click="selectionDialog = false"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-list bg-color="transparent" class="text-white">
                        <v-list-item v-for="achievement in allAchievements" :key="achievement.id"
                            :title="achievement.title" :subtitle="achievement.description"
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
                        <v-list-item prepend-icon="mdi-delete-outline" title="Quitar Logro"
                            @click="selectAchievement(null)" class="text-error"></v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Diálogo de Selección de Avatar -->
        <v-dialog v-model="avatarDialog" max-width="500">
            <v-card class="glass-popup pa-4">
                <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
                    Traje de Astronauta
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
                    Compañero de Misión
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
                            <div class="text-caption text-grey-lighten-1 mt-1">Ninguno</div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAstroStore } from '@/stores/astroStore' // Importamos el store
import { storeToRefs } from 'pinia' // Para mantener la reactividad
import { ACHIEVEMENTS } from '@/constants/achievements'
import Medal from '@/components/achievements/Medal.vue'

const router = useRouter()
const astroStore = useAstroStore()

const selectionDialog = ref(false)
const avatarDialog = ref(false)
const mascotDialog = ref(false)
const currentSlotIndex = ref(null)
const { user, rank, plan, selectedAchievements, unlockedAchievements, avatar, mascot, level, coins, xp } = storeToRefs(astroStore)

 const xpRequired = computed(() => {
    return 100 + ((level.value || 1) - 1) * 50;
})

const avatarOptions = [
    { label: 'Blanc', file: 'Astronauta_blanc.jpg' },
    { label: 'Groc', file: 'Astronauta_groc.jpg' },
    { label: 'Lila', file: 'Astronauta_lila.jpg' },
    { label: 'Negre', file: 'Astronauta_negre.jpg' },
    { label: 'Taronja', file: 'Astronauta_taronja.jpg' },
    { label: 'Verd', file: 'Astronauta_verd.jpg' },
    { label: 'Vermell', file: 'Astronauta_vermell.jpg' }
]

const mascotOptions = [
    { label: 'Balena', file: 'Balena_alien.jpg' },
    { label: 'Alien', file: 'Mascota_alien2.jpg' },
    { label: 'Dron', file: 'Mascota_dron.jpg' },
    { label: 'Pop', file: 'Pop_alien.jpg' }
]

// Extraemos los datos del usuario de forma reactiva

const allAchievements = computed(() => {
    const unlockedSet = new Set((unlockedAchievements.value || []).map((id) => Number(id)))

    return ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: unlockedSet.has(Number(a.id))
    }))
})

onMounted(async () => {
    if (!user.value) return
    await astroStore.fetchUserAchievements()
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
        alert("Debes iniciar sesión para guardar tus logros.");
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
    /* Aumentado para mejor scroll */
}

/* Tarjeta Principal (Sólida, no Glassmorphism) */
.profile-card {
    background: #0d0f14 !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    overflow: hidden;
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
</style>
