<template>
    <v-navigation-drawer permanent location="right" width="300" class="sidebar right-sidebar pa-6" elevation="0">
        <!-- Stats Card -->
        <v-card class="glass-card mb-6 pa-4" elevation="0">
            <div class="d-flex justify-space-between align-center mb-4">
                <div class="text-subtitle-2 text-grey-lighten-1">TU PROGRESO</div>
                <v-icon icon="mdi-chart-timeline-variant" color="cyan-accent-2"></v-icon>
            </div>
            <div class="d-flex justify-space-around">
                <div class="text-center">
                    <v-icon icon="mdi-fire" color="orange-accent-3" size="x-large" class="mb-1 glow-icon"></v-icon>
                    <div class="text-h5 font-weight-bold text-white">12</div>
                    <div class="text-caption text-grey">Racha</div>
                </div>
                <div class="text-center">
                    <v-icon icon="mdi-trophy" color="yellow-accent-3" size="x-large" class="mb-1 glow-icon"></v-icon>
                    <div class="text-h5 font-weight-bold text-white">5</div>
                    <div class="text-caption text-grey">Logros</div>
                </div>
            </div>
        </v-card>

        <!-- Daily Missions -->
        <v-card class="glass-card pa-4" elevation="0">
            <div class="d-flex align-center mb-6">
                <v-icon icon="mdi-target" color="purple-accent-2" class="mr-2"></v-icon>
                <span class="text-h6 text-white font-weight-bold">Misiones Diarias</span>
            </div>

            <v-list bg-color="transparent" class="pa-0">
                <v-list-item class="mission-item mb-3 pa-3 rounded-lg">
                    <template v-slot:prepend>
                        <v-checkbox-btn color="cyan-accent-2" model-value="false"></v-checkbox-btn>
                    </template>
                    <v-list-item-title class="text-body-1 text-white">Completar nivel 5</v-list-item-title>
                    <v-list-item-subtitle class="text-caption text-cyan-accent-1">0/1</v-list-item-subtitle>
                </v-list-item>

                <v-list-item class="mission-item mb-3 pa-3 rounded-lg">
                    <template v-slot:prepend>
                        <v-checkbox-btn color="cyan-accent-2" model-value="true"></v-checkbox-btn>
                    </template>
                    <v-list-item-title class="text-body-1 text-grey text-decoration-line-through">Tocar
                        césped</v-list-item-title>
                    <v-list-item-subtitle class="text-caption text-grey">1/1</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card>
        <!-- Weekly Missions -->
        <v-card class="glass-card pa-4 mt-6" elevation="0">
            <div class="d-flex align-center mb-6">
                <v-icon icon="mdi-calendar-check" color="blue-accent-2" class="mr-2"></v-icon>
                <span class="text-h6 text-white font-weight-bold">Misiones Semanales</span>
            </div>

            <v-list bg-color="transparent" class="pa-0">
                <v-list-item v-for="mission in weeklyMissions" :key="mission.id"
                    class="mission-item mb-3 pa-3 rounded-lg">
                    <template v-slot:prepend>
                        <v-checkbox-btn color="blue-accent-2" v-model="mission.completed"></v-checkbox-btn>
                    </template>
                    <v-list-item-title
                        :class="['text-body-1', mission.completed ? 'text-grey text-decoration-line-through' : 'text-white']">
                        {{ mission.text }}
                    </v-list-item-title>
                    <v-list-item-subtitle
                        :class="['text-caption', mission.completed ? 'text-grey' : 'text-blue-accent-1']">
                        {{ mission.progress }}
                    </v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card>
    </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'

const weeklyMissions = ref([
    { id: 1, text: 'Ganar 10 partidas', completed: false, progress: '3/10' },
    { id: 2, text: 'Completar retos diarios', completed: false, progress: '0/7' },
    { id: 3, text: 'Gastar 500 monedas', completed: false, progress: '150/500' }
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

.mission-item {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.glow-icon {
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
}
</style>
