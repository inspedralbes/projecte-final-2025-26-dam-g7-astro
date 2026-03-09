<template>
  <div class="match-result-screen d-flex flex-column align-center justify-center">
    <!-- Partículas decorativas -->
    <div class="stars-bg"></div>

    <!-- Icono principal -->
    <div class="result-icon-wrapper mb-6">
      <v-icon
        :icon="isWin ? 'mdi-trophy' : (isTie ? 'mdi-handshake' : 'mdi-skull-outline')"
        :size="160"
        :color="isWin ? 'amber' : (isTie ? 'cyan-accent-2' : 'red-lighten-1')"
        class="result-icon"
      />
    </div>

    <!-- Título -->
    <h1 class="result-title mb-2" :class="isWin ? 'text-amber' : (isTie ? 'text-cyan-accent-2' : 'text-red-lighten-2')">
      {{ isWin ? '¡VICTORIA!' : (isTie ? '¡EMPATE!' : '¡DERROTA!') }}
    </h1>
    <p class="text-h5 text-grey-lighten-2 mb-10">
      {{ isWin ? 'Has conquistado la galaxia' : (isTie ? 'Nadie domina el cosmos hoy' : 'El cosmos te ha vencido esta vez') }}
    </p>

    <!-- Marcador final -->
    <div class="score-board d-flex align-center mb-12">
      <!-- TÚ -->
      <div class="player-result text-center" :class="{ 'winner-glow': isWin }">
        <v-avatar size="80" class="mb-3 player-avatar" :class="isWin ? 'border-gold' : 'border-cyan'">
          <v-img :src="getPlayerAvatar(myName)" />
        </v-avatar>
        <div class="text-overline text-cyan-accent-2 mb-1">TÚ</div>
        <div class="text-h2 font-weight-black" :class="isWin ? 'text-amber' : 'text-white'">
          {{ scores[myName] || 0 }}
        </div>
        <div class="text-caption text-grey-lighten-1">rondas ganadas</div>
        <div class="mt-4">
          <v-chip v-if="isWin" color="amber" size="small" class="font-weight-black text-black">GANADOR</v-chip>
          <v-chip v-else-if="!isTie" color="red-lighten-1" size="small" variant="tonal" class="font-weight-bold">PERDEDOR</v-chip>
          
          <!-- Estado de retorno -->
          <div class="mt-2 status-container">
            <v-chip
              v-if="multiplayerStore.returnedPlayers.includes(myName)"
              color="success"
              size="x-small"
              variant="flat"
              prepend-icon="mdi-check-circle"
            >
              PREPARADO
            </v-chip>
            <v-chip
              v-else
              color="grey"
              size="x-small"
              variant="outlined"
            >
              ESPERANDO...
            </v-chip>
          </div>
        </div>
      </div>

      <!-- VS separador -->
      <div class="vs-separator mx-8 text-center">
        <div class="text-h3 font-weight-black text-grey-darken-1">VS</div>
        <div class="text-caption text-grey mt-1">{{ totalRounds }} rondas jugadas</div>
      </div>

      <!-- OPONENTE -->
      <div class="player-result text-center" :class="{ 'winner-glow': !isWin && !isTie }">
        <v-avatar size="80" class="mb-3 player-avatar" :class="!isWin && !isTie ? 'border-gold' : 'border-cyan'">
          <v-img :src="getPlayerAvatar(opponentName)" />
        </v-avatar>
        <div class="text-overline text-cyan-accent-2 mb-1">{{ opponentName }}</div>
        <div class="text-h2 font-weight-black" :class="!isWin && !isTie ? 'text-amber' : 'text-white'">
          {{ scores[opponentName] || 0 }}
        </div>
        <div class="text-caption text-grey-lighten-1">rondas ganadas</div>
        <div class="mt-4">
          <v-chip v-if="!isWin && !isTie" color="amber" size="small" class="font-weight-black text-black">GANADOR</v-chip>
          <v-chip v-else-if="!isTie" color="red-lighten-1" size="small" variant="tonal" class="font-weight-bold">PERDEDOR</v-chip>
          
          <!-- Estado de retorno oponente -->
          <div class="mt-2 status-container">
            <v-chip
              v-if="multiplayerStore.returnedPlayers.includes(opponentName)"
              color="success"
              size="x-small"
              variant="flat"
              prepend-icon="mdi-check-circle"
            >
              PREPARADO
            </v-chip>
            <v-chip
              v-else
              color="grey"
              size="x-small"
              variant="outlined"
            >
              PENDIENTE
            </v-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de rondas (NUEVO) -->
    <div v-if="multiplayerStore.room?.gameConfig?.roundHistory?.length" class="round-history-section w-100 max-width-600 mb-8">
      <div class="text-overline text-grey-darken-1 mb-4 text-center">HISTORIAL DE LA MISIÓN</div>
      <v-row dense justify="center">
        <v-col v-for="h in multiplayerStore.room.gameConfig.roundHistory" :key="h.round" cols="12">
          <v-card class="round-history-card pa-3 mb-2 rounded-lg" variant="flat" color="rgba(255,255,255,0.03)">
            <div class="d-flex align-center justify-space-between">
              <div class="round-num text-caption font-weight-black text-cyan-accent-2 mr-4">RD {{ h.round }}</div>
              <div class="game-info d-flex align-center flex-grow-1">
                <v-icon icon="mdi-controller" size="18" class="mr-2 text-grey-darken-1"></v-icon>
                <div class="text-body-2 font-weight-bold text-white">{{ h.game }}</div>
              </div>
              <div class="round-winner-indicator mx-4">
                <v-chip v-if="h.winner === myName" color="success" size="x-small" density="compact" variant="flat" class="font-weight-black">VICTORIA</v-chip>
                <v-chip v-else-if="h.winner === opponentName" color="error" size="x-small" density="compact" variant="flat" class="font-weight-black">DERROTA</v-chip>
                <v-chip v-else color="grey-darken-1" size="x-small" density="compact" variant="tonal" class="font-weight-black">EMPATE</v-chip>
              </div>
              <div class="round-scores text-caption text-grey-lighten-1 font-weight-bold">
                {{ h.scores[myName] || 0 }} - {{ h.scores[opponentName] || 0 }}
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Botones -->
    <div class="d-flex flex-column align-center gap-4">
      <v-btn
        v-if="!hasMeReturned"
        color="success"
        size="x-large"
        rounded="xl"
        class="font-weight-black px-12 pulse-button"
        @click="handleReturn"
      >
        <v-icon start>mdi-reply</v-icon> VOLVER A LA SALA
      </v-btn>
      <div v-else class="text-center">
        <v-progress-circular indeterminate color="cyan-accent-2" size="40" class="mb-2" />
        <p class="text-cyan-accent-2 font-weight-bold italic">Esperando que el equipo regrese...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';

const props = defineProps({
  scores: { type: Object, default: () => ({}) },
  winner: { type: String, default: null },      // null = empate
  isTie: { type: Boolean, default: false },
  totalRounds: { type: Number, default: 0 },
  opponentName: { type: String, default: 'Oponente' },
  isHost: { type: Boolean, default: false }
});

const emit = defineEmits(['return-to-lobby']);

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();

const myName = computed(() => astroStore.user);
const isWin = computed(() => !props.isTie && props.winner === myName.value);
const hasMeReturned = computed(() => multiplayerStore.returnedPlayers.includes(myName.value));

const handleReturn = () => {
  multiplayerStore.returnToLobby();
  emit('return-to-lobby');
};

const getAvatarUrl = (avatarName, username) => {
  if (avatarName && (avatarName.includes('.jpg') || avatarName.includes('.png'))) {
    return `/${avatarName.trim()}`;
  }
  if (avatarName && avatarName.toLowerCase().startsWith('astronauta')) {
    return `/${avatarName.trim()}`;
  }
  if (username) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  }
  return '/Astronauta_blanc.jpg';
};

const getPlayerAvatar = (username) => {
  if (!username) return '/Astronauta_blanc.jpg';
  if (username === astroStore.user) {
    return getAvatarUrl(astroStore.avatar, username);
  }
  const explorer = astroStore.explorers?.find(e => e.user === username);
  if (explorer) {
    return getAvatarUrl(explorer.avatar, username);
  }
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
};
</script>

<style scoped>
.match-result-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(8, 15, 27, 0.98);
  z-index: 2000;
  backdrop-filter: blur(20px);
  overflow-y: auto;
  padding: 40px 20px;
}

.result-icon {
  filter: drop-shadow(0 0 30px currentColor);
}

.result-title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-shadow: 0 0 40px currentColor;
}

.score-board {
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 28px;
  padding: 40px 60px;
}

.player-result {
  min-width: 160px;
}

.winner-glow .player-avatar {
  box-shadow: 0 0 30px rgba(255, 193, 7, 0.6);
}

.max-width-600 {
  max-width: 600px;
}

.round-history-card {
  border: 1px solid rgba(0, 229, 255, 0.1) !important;
  transition: all 0.2s;
}

.round-history-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(0, 229, 255, 0.3) !important;
}

.round-num {
  font-family: 'Roboto Mono', monospace;
  background: rgba(0, 229, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.pulse-button {
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

.player-avatar {
  background: #0a1929; /* Deep Space BG */
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.border-cyan {
  border: 3px solid #00e5ff;
}

.border-gold {
  border: 3px solid #ffc107;
}

.vs-separator {
  opacity: 0.5;
}

.stars-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: -1;
}

/* Avatar Global Styling (Matching profile.vue and Lobby zoom) */
:deep(.v-avatar .v-img__img),
:deep(.v-avatar img) {
  border-radius: 50%;
  transform: scale(1.4);
  transform-origin: center center;
  object-position: center center;
}
</style>
