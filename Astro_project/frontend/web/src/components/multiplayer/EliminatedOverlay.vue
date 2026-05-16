<template>
  <transition name="fade">
    <div v-if="isActive" class="eliminated-overlay d-flex flex-column align-center justify-center">
      <v-icon size="120" color="red-accent-4" class="mb-4 heart-broken">mdi-heart-broken</v-icon>
      <h1 class="text-h2 font-weight-black text-white glow-text-red">MISSIÓ FALLIDA</h1>
      <p class="text-h5 text-red-lighten-2 mt-4 tracking-widest font-weight-bold">T'HAS QUEDAT SENSE VIDES</p>
      <div class="mt-8 text-body-1 text-grey-lighten-1">Ara ets un espectador. El Jefe t'ha derrotat!</div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMultiplayerStore } from '@/stores/multiplayerStore'
import { useAstroStore } from '@/stores/astroStore'

const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()
const isActive = ref(false)

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (msg && msg.type === 'HERO_ELIMINATED' && msg.user === astroStore.user) {
    isActive.value = true
  }
})

// También vigilar el estado de la sala al entrar por si ya estábamos eliminados
watch(() => multiplayerStore.room?.gameConfig?.heroHealth, (health) => {
  if (health && health[astroStore.user] <= 0) {
    isActive.value = true
  }
}, { immediate: true })
</script>

<style scoped>
.eliminated-overlay {
  position: absolute;
  inset: 0;
  background: rgba(18, 0, 0, 0.9);
  backdrop-filter: blur(15px);
  z-index: 10000;
  text-align: center;
}

.heart-broken {
  filter: drop-shadow(0 0 20px #ff1744);
  animation: break-heart 0.5s ease-out;
}

.glow-text-red {
  text-shadow: 0 0 20px #ff1744, 0 0 40px #b71c1c;
}

@keyframes break-heart {
  0% { transform: scale(1.5); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
