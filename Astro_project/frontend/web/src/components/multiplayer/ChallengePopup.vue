<template>
  <div class="challenge-notification" v-if="currentChallenge">
    <div class="rl-card">
      <div class="rl-content">
        <div class="rl-icon">
          <v-icon icon="mdi-sword-cross" color="cyan-accent-2" size="24"></v-icon>
        </div>
        <div class="rl-text">
          <div class="rl-title">DESAFÍO RECIBIDO</div>
          <div class="rl-name">{{ currentChallenge.from }}</div>
        </div>
        <div class="rl-actions">
          <button class="rl-btn rl-accept" @click="respond(true)">
            <v-icon icon="mdi-check" size="20"></v-icon>
          </button>
          <button class="rl-btn rl-decline" @click="respond(false)">
            <v-icon icon="mdi-close" size="20"></v-icon>
          </button>
        </div>
      </div>
      <div class="rl-progress-bar"></div>
    </div>
  </div>

  <!-- Notificación de rechazo -->
  <v-snackbar v-model="rejectSnackbar.show" color="error" timeout="4000" location="top right" class="custom-snackbar">
    <div class="d-flex align-center">
      <v-icon icon="mdi-sword-cross" class="mr-3"></v-icon>
      <span class="font-weight-bold">{{ rejectSnackbar.text }}</span>
    </div>
  </v-snackbar>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();
const router = useRouter();

const currentChallenge = computed(() => multiplayerStore.challengeRequests[0] || null);

const rejectSnackbar = ref({
  show: false,
  text: ''
});

const respond = (accepted) => {
  if (currentChallenge.value) {
    multiplayerStore.respondToChallenge(currentChallenge.value.from, accepted);
  }
};

watch(() => multiplayerStore.lastMessage, (newMsg) => {
  if (!newMsg) return;

  if (newMsg.type === 'CHALLENGE_ACCEPTED') {
    router.push('/multiplayer');
  } else if (newMsg.type === 'CHALLENGE_REJECTED') {
    rejectSnackbar.value = {
      show: true,
      text: `${newMsg.from} ha rechazado tu desafío.`
    };
    multiplayerStore.lastMessage = null;
  }
});
</script>

<style scoped>
.challenge-notification {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  animation: rl-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.rl-card {
  background: linear-gradient(135deg, rgba(10, 25, 48, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%);
  border-left: 4px solid #00f2ff;
  width: 320px;
  position: relative;
  overflow: hidden;
  box-shadow: -10px 10px 20px rgba(0, 0, 0, 0.5);
  transform: skewX(-5deg); /* Slanted look like RL */
  border-radius: 4px;
}

.rl-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  transform: skewX(5deg); /* Un-skew content */
}

.rl-icon {
  background: rgba(0, 242, 255, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-right: 12px;
}

.rl-text {
  flex-grow: 1;
}

.rl-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  color: #00f2ff;
  letter-spacing: 1px;
  line-height: 1;
  margin-bottom: 2px;
}

.rl-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
}

.rl-actions {
  display: flex;
  gap: 8px;
}

.rl-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.rl-accept {
  background: #4caf50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
}

.rl-accept:hover {
  background: #66bb6a;
  transform: scale(1.1);
}

.rl-decline {
  background: #f44336;
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.4);
}

.rl-decline:hover {
  background: #ef5350;
  transform: scale(1.1);
}

.rl-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #00f2ff;
  width: 100%;
  animation: rl-progress 5s linear forwards;
}

@keyframes rl-slide-in {
  from { transform: translateX(100%) skewX(-5deg); opacity: 0; }
  to { transform: translateX(0) skewX(-5deg); opacity: 1; }
}

@keyframes rl-progress {
  from { width: 100%; }
  to { width: 0%; }
}
</style>

