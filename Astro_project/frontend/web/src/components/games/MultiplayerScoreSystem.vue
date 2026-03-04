<template>
  <div v-if="visible" class="score-system-layer">
    <div class="game-hud-container d-flex justify-center align-center">
      <div class="hud-main-bar d-flex align-center px-6">
        <div class="hud-item d-flex align-center gap-3">
          <v-avatar size="36" class="border-cyan">
            <v-img :src="resolveAvatar(localPlayer)"></v-img>
          </v-avatar>
          <div class="hud-text">
            <div class="hud-name">{{ localPlayer }}</div>
            <div class="hud-puntos">
              {{ getRoundScore(localPlayer) }}
              <span class="hud-total">({{ getTotalScore(localPlayer) }})</span>
            </div>
          </div>
        </div>

        <div class="hud-center-unit mx-8 text-center position-relative">
          <div class="vs-text">VS</div>
          <div class="round-text">RONDA {{ currentRound }} / {{ totalRounds }}</div>

          <transition-group name="floating-score">
            <div
              v-for="notif in activeNotifications"
              :key="notif.id"
              class="sabotage-notif"
              :class="notif.amount > 0 ? 'text-success' : 'text-error'"
            >
              {{ notif.amount > 0 ? '+' : '' }}{{ notif.amount }}s
            </div>
          </transition-group>
        </div>

        <div class="hud-item d-flex align-center flex-row-reverse gap-3 text-right">
          <v-avatar size="36" class="border-cyan">
            <v-img :src="resolveAvatar(opponentName)"></v-img>
          </v-avatar>
          <div class="hud-text">
            <div class="hud-name">{{ opponentName }}</div>
            <div class="hud-puntos">
              {{ getRoundScore(opponentName) }}
              <span class="hud-total">({{ getTotalScore(opponentName) }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="scale">
      <div v-if="showRoundResults" class="round-result-overlay d-flex flex-column align-center justify-center">
        <v-avatar size="120" class="mb-4 border-cyan glow-cyan">
          <v-img v-if="roundWinner" :src="resolveAvatar(roundWinner)"></v-img>
          <v-icon v-else-if="isRoundTie" icon="mdi-handshake" size="80" color="amber-accent-2"></v-icon>
          <v-icon v-else icon="mdi-timer-off" size="80" color="grey-lighten-1"></v-icon>
        </v-avatar>
        <h2 class="text-h2 font-weight-black text-cyan-accent-2 mb-2 italic">
          {{ roundWinner ? '¡RONDA PARA!' : (isRoundTie ? '¡EMPATE!' : '¡TIEMPO AGOTADO!') }}
        </h2>
        <h1 class="text-h1 font-weight-black text-white glow-text">
          {{ roundWinner ? (roundWinner === localPlayer ? 'TU' : roundWinner) : (isRoundTie ? 'EMPATE' : '-') }}
        </h1>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  opponentName: {
    type: String,
    default: 'Oponente'
  },
  getPlayerAvatar: {
    type: Function,
    default: () => '/Astronauta_blanc.jpg'
  }
});

const emit = defineEmits(['match-finished']);

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();

const roundWinner = ref(null);
const isRoundTie = ref(false);
const showRoundResults = ref(false);
const activeNotifications = ref([]);

let notifCounter = 0;

const localPlayer = computed(() => astroStore.user || 'Tu');
const currentRound = computed(() => (multiplayerStore.room?.gameConfig?.currentRound ?? 0) + 1);
const totalRounds = computed(() => multiplayerStore.room?.gameConfig?.totalRounds ?? '?');

const resolveAvatar = (username) => {
  return props.getPlayerAvatar?.(username) || '/Astronauta_blanc.jpg';
};

const getRoundScore = (username) => {
  if (!username) return 0;
  return multiplayerStore.roundScores[username] || 0;
};

const getTotalScore = (username) => {
  if (!username) return 0;
  return multiplayerStore.room?.gameConfig?.scores?.[username] || 0;
};

const resetLocalState = () => {
  roundWinner.value = null;
  isRoundTie.value = false;
  showRoundResults.value = false;
  activeNotifications.value = [];
};

const handleSabotageNotification = (data) => {
  const isMe = data.from === astroStore.user;
  const amount = data.action.amount || 0;

  if (data.action.subtype !== 'REDUCE_TIME') {
    return;
  }

  const id = notifCounter++;
  activeNotifications.value.push({
    id,
    amount: isMe ? 10 : -amount
  });

  setTimeout(() => {
    activeNotifications.value = activeNotifications.value.filter((entry) => entry.id !== id);
  }, 2500);
};

watch(() => multiplayerStore.room?.status, (newStatus) => {
  if (newStatus === 'ROULETTE' || newStatus === 'PLAYING') {
    roundWinner.value = null;
    isRoundTie.value = false;
    showRoundResults.value = false;
  } else if (newStatus === 'ROUND_RESULTS') {
    showRoundResults.value = true;
  } else if (newStatus === 'GAME_OVER') {
    showRoundResults.value = false;
  } else if (newStatus === 'LOBBY') {
    resetLocalState();
  }
}, { immediate: true });

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) {
    return;
  }

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    roundWinner.value = msg.winner || null;
    isRoundTie.value = Boolean(msg.tie);
  }

  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE') {
    handleSabotageNotification(msg);
  }

  if (msg.type === 'MATCH_FINISHED') {
    emit('match-finished', {
      winner: msg.winner ?? null,
      scores: msg.room?.gameConfig?.scores || {}
    });
  }
});

defineExpose({
  resetLocalState
});
</script>

<style scoped>
.score-system-layer {
  pointer-events: none;
}

.game-hud-container {
  position: fixed;
  top: 10px;
  left: 0;
  width: 100%;
  z-index: 2500;
}

.hud-main-bar {
  background: rgba(10, 25, 41, 0.95);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 50px;
  height: 64px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 229, 255, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
}

.hud-item {
  min-width: 150px;
}

.hud-text {
  line-height: 1.1;
}

.hud-name {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #00e5ff;
  letter-spacing: 0.05em;
}

.hud-puntos {
  font-size: 1.4rem;
  font-weight: 900;
  color: white;
}

.hud-total {
  font-size: 0.8rem;
  color: #9e9e9e;
  font-weight: 500;
}

.hud-center-unit {
  min-width: 120px;
}

.vs-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: #00e5ff;
  line-height: 1;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.round-text {
  font-size: 0.65rem;
  font-weight: 800;
  color: #ffca28;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.sabotage-notif {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 0 0 15px currentColor;
  z-index: 10;
}

.floating-score-enter-active {
  animation: float-up 2s ease-out forwards;
}

@keyframes float-up {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
  20% { opacity: 1; transform: translate(-50%, -20px) scale(1.2); }
  80% { opacity: 1; transform: translate(-50%, -60px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -80px) scale(0.8); }
}

.round-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(11, 20, 33, 0.97);
  z-index: 3000;
  pointer-events: auto;
  backdrop-filter: blur(16px);
}

.glow-cyan {
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.5);
}

.glow-text {
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.5);
}
</style>
