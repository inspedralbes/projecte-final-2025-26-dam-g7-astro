<template>
    <v-container fluid class="pa-8">
        <div class="header mb-16 text-center">
            <h1 class="text-h2 font-weight-bold text-white mb-4 tracking-wide">MEDALLAS DE HONOR</h1>
            <p class="text-h6 text-cyan-accent-1 opacity-75">Tus condecoraciones en la flota estelar</p>
            <div class="d-flex justify-center flex-wrap ga-2 mt-4">
                <v-chip color="cyan-accent-3" variant="outlined">Partidas: {{ stats.gamesPlayed }}</v-chip>
                <v-chip color="amber-accent-3" variant="outlined">Monedas: {{ stats.coins }}</v-chip>
                <v-chip color="green-accent-3" variant="outlined">Inventario: {{ stats.inventoryCount }}</v-chip>
            </div>
        </div>

        <v-alert v-if="loadError" type="warning" variant="tonal" class="mb-8">
            {{ loadError }}
        </v-alert>

        <div v-if="loading" class="d-flex justify-center mb-8">
            <v-progress-circular indeterminate color="cyan-accent-3"></v-progress-circular>
        </div>

        <v-row class="mt-8">
            <v-col v-for="achievement in achievements" :key="achievement.id" cols="12" sm="6" md="4" lg="3"
                class="d-flex justify-center flex-column align-center">
                <Medal :type="achievement.type" :icon="achievement.icon" :locked="!achievement.unlocked" />

                <!-- Medal Info -->
                <div class="medal-info text-center mt-4">
                    <h3 class="text-h6 font-weight-bold text-white mb-1">{{ achievement.title }}</h3>
                    <p class="text-caption text-grey-lighten-1">{{ achievement.description }}</p>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { ACHIEVEMENTS } from '@/constants/achievements'
import Medal from '@/components/achievements/Medal.vue'

const achievements = ref(ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: [1, 3].includes(a.id) // Mantener lógica de desbloqueo original para demo
})))
</script>

<style scoped>
.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
