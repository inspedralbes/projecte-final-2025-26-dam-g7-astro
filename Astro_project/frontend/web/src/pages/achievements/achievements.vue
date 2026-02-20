<template>
    <div class="scroll-container">
        <v-container fluid class="pa-8">
            <div class="header mb-16 text-center">
                <h1 class="text-h2 font-weight-bold text-white mb-4 tracking-wide">LOGROS</h1>
                <p class="text-h6 text-cyan-accent-1 opacity-75">Tus condecoraciones en la flota estelar</p>
            </div>

            <v-alert v-if="loadError" type="warning" variant="tonal" class="mb-8">
                {{ loadError }}
            </v-alert>

            <div v-if="loading" class="d-flex justify-center mb-8">
                <v-progress-circular indeterminate color="cyan-accent-3"></v-progress-circular>
            </div>

            <v-row class="mt-8 pb-16">
                <v-col v-for="achievement in achievements" :key="achievement.id" cols="12" sm="6" md="4" lg="3"
                    class="d-flex justify-center flex-column align-center mb-10">
                    <Medal :type="achievement.type" :icon="achievement.icon" :locked="!achievement.unlocked" />

                    <!-- Medal Info -->
                    <div class="medal-info text-center mt-2">
                        <h3 class="text-h6 font-weight-bold text-white mb-1">{{ achievement.title }}</h3>
                        <p class="text-caption text-grey-lighten-1">{{ achievement.description }}</p>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
// EASTER EGG: NIL TONTO TONTO NIGGA
import { ref, onMounted } from 'vue'
import { ACHIEVEMENTS } from '@/constants/achievements'
import Medal from '@/components/achievements/Medal.vue'
import { useAstroStore } from '@/stores/astroStore'

const astroStore = useAstroStore()
const loading = ref(false)
const loadError = ref(null)

const stats = ref({
    gamesPlayed: 12,
    coins: astroStore.coins || 1000,
    inventoryCount: 3
})

const achievements = ref(ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: [1, 3].includes(a.id)
})))
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
}

.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
