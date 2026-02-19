<template>
    <v-navigation-drawer permanent location="right" width="280" class="sidebar right-sidebar" elevation="0">
        <div class="d-flex flex-column h-100 pa-3">
            <!-- Stats Card -->
            <v-card class="glass-card mb-3 pa-3" elevation="0">
                <div class="d-flex justify-space-between align-center mb-2">
                    <div class="text-caption text-grey-lighten-1 font-weight-bold">PROGRESO</div>
                    <v-icon icon="mdi-chart-timeline-variant" color="cyan-accent-2" size="small"></v-icon>
                </div>
                <div class="d-flex justify-space-around">
                    <div class="text-center">
                        <v-icon icon="mdi-fire" color="orange-accent-3" size="large" class="mb-0 glow-icon"></v-icon>
                        <div class="text-h6 font-weight-bold text-white">12</div>
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

            <!-- Daily Missions -->
            <v-card class="glass-card pa-3 mb-3 flex-grow-1 d-flex flex-column" elevation="0">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-target" color="purple-accent-2" class="mr-2" size="small"></v-icon>
                        <span class="text-subtitle-2 text-white font-weight-bold">Misiones Diarias</span>
                    </div>
                    <v-btn icon="mdi-menu" variant="text" color="purple-accent-2" density="compact"
                        @click="dialogDiarias = true"></v-btn>
                </div>

                <v-list bg-color="transparent" class="pa-0 flex-grow-1 d-flex flex-column justify-center">
                    <v-list-item v-for="mission in dailyMissions.slice(0, 3)" :key="mission.id"
                        class="mission-item mb-2 pa-3 rounded-lg" density="comfortable">
                        <v-list-item-title
                            :class="['text-body-2 font-weight-bold', mission.completed ? 'text-grey text-decoration-line-through' : 'text-white']">
                            {{ mission.text }}
                        </v-list-item-title>
                        <v-list-item-subtitle
                            :class="['text-caption mt-1', mission.completed ? 'text-grey' : 'text-cyan-accent-1']"
                            style="font-size: 0.7rem !important;">
                            Progreso: {{ mission.progress }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-icon v-if="mission.completed" icon="mdi-check-circle" color="cyan-accent-2"
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
                    <v-list-item v-for="mission in weeklyMissions.slice(0, 3)" :key="mission.id"
                        class="mission-item mb-2 pa-3 rounded-lg" density="comfortable">
                        <v-list-item-title
                            :class="['text-body-2 font-weight-bold', mission.completed ? 'text-grey text-decoration-line-through' : 'text-white']">
                            {{ mission.text }}
                        </v-list-item-title>
                        <v-list-item-subtitle
                            :class="['text-caption mt-1', mission.completed ? 'text-grey' : 'text-blue-accent-1']"
                            style="font-size: 0.7rem !important;">
                            Progreso: {{ mission.progress }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-icon v-if="mission.completed" icon="mdi-check-circle" color="blue-accent-2"
                                size="small"></v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>

    </v-navigation-drawer>

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
                        :class="['text-h6 font-weight-bold', mission.completed ? 'text-grey text-decoration-line-through' : 'text-white']">
                        {{ mission.text }}
                    </v-list-item-title>
                    <v-list-item-subtitle
                        :class="['text-body-2 mt-1', mission.completed ? 'text-grey' : 'text-cyan-accent-1']">
                        Progreso Actual: {{ mission.progress }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                        <v-icon v-if="mission.completed" icon="mdi-check-circle" color="purple-accent-2"></v-icon>
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
                        :class="['text-h6 font-weight-bold', mission.completed ? 'text-grey text-decoration-line-through' : 'text-white']">
                        {{ mission.text }}
                    </v-list-item-title>
                    <v-list-item-subtitle
                        :class="['text-body-2 mt-1', mission.completed ? 'text-grey' : 'text-blue-accent-1']">
                        Progreso Actual: {{ mission.progress }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                        <v-icon v-if="mission.completed" icon="mdi-check-circle" color="blue-accent-2"></v-icon>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAstroStore } from '@/stores/astroStore'

const astroStore = useAstroStore()

const userCoins = computed(() => astroStore.coins)

const dialogMisiones = ref(false)
const dialogDiarias = ref(false)

const dailyMissions = ref([
    { id: 1, text: 'Tocar césped', completed: true, progress: '1/1' },
    { id: 2, text: 'Ganar 1 partida', completed: false, progress: '0/1' },
    { id: 3, text: 'Completar nivel 5', completed: false, progress: '0/1' },
    { id: 4, text: 'Jugar con un amigo', completed: false, progress: '0/1' },
    { id: 5, text: 'Recoger recompensa', completed: true, progress: '1/1' },
    { id: 6, text: 'Personalizar avatar', completed: false, progress: '0/1' }
])

const weeklyMissions = ref([
    { id: 1, text: 'Ganar 10 partidas', completed: false, progress: '3/10' },
    { id: 2, text: 'Completar retos diarios', completed: false, progress: '2/7' },
    { id: 3, text: 'Gastar 500 monedas', completed: false, progress: '150/500' },
    { id: 4, text: 'Jugar 5 partidas multi', completed: false, progress: '1/5' },
    { id: 5, text: 'Desbloquear un logro', completed: true, progress: '1/1' },
    { id: 6, text: 'Invitar a un amigo', completed: false, progress: '0/1' }
])
</script>

<style scoped>
.sidebar {
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(20px);
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
