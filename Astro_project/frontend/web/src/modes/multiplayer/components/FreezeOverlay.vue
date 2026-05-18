<template>
  <transition name="fade">
    <div v-if="isActive" class="freeze-overlay">
      <div class="ice-crystals"></div>
      <div class="freeze-content">
        <v-icon size="100" color="light-blue-accent-1" class="mb-4 ice-icon">mdi-snowflake</v-icon>
        <div class="text-h3 font-weight-black text-white glow-text">¡CONGELADO POR EL JEFE!</div>
        <div class="text-h6 text-light-blue-lighten-4 mt-2">No puedes moverte durante 2 segundos</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'

const multiplayerStore = useMultiplayerStore()
const isActive = ref(false)

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (msg && msg.type === 'APPLY_INTERFERENCE' && msg.actionType === 'FREEZE') {
    isActive.value = true
    setTimeout(() => {
      isActive.value = false
    }, 2000)
  }
})
</script>

<style scoped>
.freeze-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 184, 212, 0.3);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-center: center;
  justify-center: center;
  pointer-events: all;
}

.ice-crystals {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://www.transparenttextures.com/patterns/ice-age.png');
  opacity: 0.5;
}

.freeze-content {
  text-align: center;
  z-index: 10;
}

.ice-icon {
  filter: drop-shadow(0 0 20px #00e5ff);
  animation: rotate-slow 5s infinite linear;
}

.glow-text {
  text-shadow: 0 0 20px #00e5ff, 0 0 40px #00e5ff;
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

