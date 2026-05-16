<template>
  <div class="boss-health-container pa-4 rounded-xl border-light elevation-10 mb-6">
    <div class="d-flex justify-space-between align-center mb-2">
      <div class="d-flex align-center">
        <v-icon color="red-accent-4" size="32" class="mr-2 animate-pulse">mdi-skull-scan</v-icon>
        <span class="text-h5 font-weight-black text-white">EL JEFE SUPREMO</span>
      </div>
      <div class="text-h5 font-weight-black text-red-accent-2">{{ Math.round(hp) }}%</div>
    </div>
    
    <v-progress-linear
      :model-value="hp"
      height="25"
      rounded="pill"
      color="red-accent-4"
      background-color="grey-darken-4"
      striped
      indeterminate-on-error
    >
      <template v-slot:default="{ value }">
        <div class="hp-glow" :style="{ width: value + '%' }"></div>
      </template>
    </v-progress-linear>
    
    <div class="d-flex justify-center mt-2">
      <v-chip size="small" color="red-darken-4" class="font-weight-bold">OBJETIVO: DERROTAR AL JEFE</v-chip>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useMultiplayerStore } from '@/stores/multiplayerStore'

const multiplayerStore = useMultiplayerStore()
const hp = ref(100)

onMounted(() => {
  if (multiplayerStore.room?.gameConfig?.bossHP !== undefined) {
    hp.value = multiplayerStore.room.gameConfig.bossHP
  }
})

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (msg && msg.type === 'BOSS_HP_UPDATE') {
    hp.value = msg.hp
  }
})
</script>

<style scoped>
.boss-health-container {
  background: rgba(183, 28, 28, 0.1);
  border: 2px solid #ff1744;
  width: 100%;
  max-width: 600px;
  position: relative;
  overflow: hidden;
}

.hp-glow {
  height: 100%;
  background: linear-gradient(90deg, #ff1744 0%, #d50000 100%);
  box-shadow: 0 0 20px #ff1744;
  transition: width 0.5s ease-out;
}

.animate-pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
