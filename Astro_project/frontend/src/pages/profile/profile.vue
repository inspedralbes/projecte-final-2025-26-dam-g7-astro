<template>
    <v-container class="fill-height d-flex justify-center align-center">
        <!-- Usamos un estilo 'glass' (vidrio) para que se vea moderno pero el código es simple -->
        <v-card width="500" class="glass-card text-center pa-4" elevation="0">

            <!-- Avatar brillante -->
            <div class="d-flex justify-center mb-4">
                <div class="position-relative">
                    <v-avatar size="110" class="avatar-border">
                        <v-img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar"></v-img>
                    </v-avatar>
                    <v-btn icon="mdi-plus" size="x-small" color="cyan-accent-3" class="edit-avatar-btn" elevation="4"
                        @click="goToInventory"></v-btn>
                </div>
            </div>

            <!-- Nombre y Rango -->
            <h1 class="text-h4 font-weight-bold text-white mb-2">
                {{ user || 'Tripulante Desconocido' }}
            </h1>

            <v-chip color="cyan-accent-3" variant="outlined" class="mb-4">
                {{ rank || 'Cadete de Vuelo' }}
            </v-chip>

            <v-row class="mb-2">
                <v-col cols="3">
                    <div class="text-h5 font-weight-bold text-cyan-accent-3">1</div>
                    <div class="text-caption text-grey">Nivel</div>
                </v-col>
                <v-col cols="6">
                    <div class="text-h5 font-weight-bold text-white">
                        {{ plan || 'S/N' }}
                    </div>
                    <div class="text-caption text-grey">Plan de Vuelo</div>
                </v-col>
                <v-col cols="3">
                    <v-icon :color="user ? 'green' : 'red'" icon="mdi-circle-small"></v-icon>
                    <div class="text-caption text-grey">{{ user ? 'Online' : 'Offline' }}</div>
                </v-col>
            </v-row>

            <v-divider class="my-2 border-opacity-25"></v-divider>

            <h3 class="text-subtitle-1 font-weight-bold text-cyan-accent-1 mb-2">LOGROS SELECCIONADOS</h3>

            <v-row class="mb-6 justify-center">
                <v-col v-for="i in 3" :key="i" cols="4" class="pa-1">
                    <div class="d-flex flex-column align-center">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ props }">
                                <v-card v-bind="props" variant="outlined" color="cyan-accent-3"
                                    class="achievement-slot d-flex align-center justify-center overflow-hidden"
                                    @click="openSelection(i - 1)" height="80" width="100%">
                                    <Medal v-if="getAchievement(selectedAchievements[i - 1])"
                                        :type="getAchievement(selectedAchievements[i - 1]).type"
                                        :icon="getAchievement(selectedAchievements[i - 1]).icon" :scale="0.45"
                                        :icon-size="48" />
                                    <v-icon v-else icon="mdi-plus" size="24" class="opacity-30"></v-icon>
                                </v-card>
                            </template>
                            <span>{{ getAchievement(selectedAchievements[i - 1])?.title || 'Elegir Logro' }}</span>
                        </v-tooltip>
                        <div class="text-caption text-white text-truncate w-100 px-1 mt-2"
                            style="max-width: 100px; line-height: 1.2;">
                            {{ getAchievement(selectedAchievements[i - 1])?.title || 'Vacío' }}
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-divider class="my-3 border-opacity-25"></v-divider>

            <!-- Botones de Acción -->
            <div class="d-flex flex-column gap-2">
                <v-btn block color="cyan-accent-3" size="default" rounded="xl" variant="flat" @click="goHome"
                    class="font-weight-bold mb-1">
                    VOLVER AL MENÚ
                </v-btn>

                <v-btn block color="white" variant="outlined" size="default" rounded="xl" @click="changePlan"
                    class="font-weight-bold">
                    ACTUALIZAR PLAN
                </v-btn>
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

// Extraemos los datos del usuario de forma reactiva
const { user, rank, plan, selectedAchievements } = storeToRefs(astroStore)

const selectionDialog = ref(false)
const currentSlotIndex = ref(null)

// Mostramos todos los logros pero marcamos los bloqueados (Demo: 1 y 3 desbloqueados)
const allAchievements = computed(() => {
    return ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: [1, 3].includes(a.id)
    }))
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

function goHome() {
    router.push('/')
}

function changePlan() {
    router.push('/plans')
}

function goToInventory() {
    router.push('/inventory')
}
</script>

<style scoped>
/* Estilo efecto vidrio (Glassmorphism) */
.glass-card {
    background: rgba(255, 255, 255, 0.05) !important;
    /* Fondo semi-transparente */
    backdrop-filter: blur(10px);
    /* Desenfoque del fondo */
    border: 1px solid rgba(255, 255, 255, 0.1);
    /* Borde sutil */
    border-radius: 24px;
    /* Bordes redondeados */
}

/* Glass Popup sync with missions */
.glass-popup {
    background: rgba(15, 15, 25, 0.9) !important;
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5) !important;
}

/* Borde brillante para el avatar */
.avatar-border {
    border: 3px solid #00e5ff;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
    /* Resplandor */
}

.achievement-slot {
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.achievement-slot:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 229, 255, 0.2);
}

.achievement-list-item {
    border-radius: 8px;
    transition: background 0.2s;
}

.achievement-list-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.achievement-list-item.selected {
    background: rgba(0, 229, 255, 0.2);
    border: 1px solid rgba(0, 229, 255, 0.5);
}

.locked-item {
    opacity: 0.5;
    cursor: not-allowed;
}

.position-relative {
    position: relative;
}

.edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: 5px;
    border: 3px solid #0f0f19 !important;
    color: #0f0f19 !important;
    width: 32px !important;
    height: 32px !important;
}

.opacity-30 {
    opacity: 0.3;
}
</style>
