<template>
  <div class="match-result-screen d-flex flex-column align-center justify-center">
    <!-- Partículas decorativas -->
    <div class="stars-bg"></div>

    <!-- Icono principal -->
    <div class="result-icon-wrapper mb-6">
      <v-icon
        :icon="isCooperative ? 'mdi-rocket-launch' : (isWin ? 'mdi-trophy' : (isTie ? 'mdi-handshake' : 'mdi-skull-outline'))"
        :size="160"
        :color="isWin ? 'amber' : (isTie ? 'cyan-accent-2' : (isCooperative ? 'cyan-accent-2' : 'red-lighten-1'))"
        class="result-icon"
      />
    </div>

    <!-- Título -->
    <h1 class="result-title mb-2" :class="isWin ? 'text-amber' : (isTie ? 'text-cyan-accent-2' : 'text-blue-lighten-2')">
      {{ isCooperative ? 'INFORME DE MISIÓN' : (isWin ? '¡VICTORIA!' : (isTie ? '¡EMPATE!' : '¡DERROTA!')) }}
    </h1>
    <p class="text-h5 text-grey-lighten-2 mb-10">
      {{ gameResultSubtext }}
    </p>

    <!-- 1vs1 Marcador final (Solo si NO es cooperativo) -->
    <div v-if="!isCooperative" class="score-board d-flex align-center mb-12">
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
      </div>
    </div>

    <!-- MODO COOPERATIVO: Ranking de Equipos -->
    <div v-else class="ranking-board w-100 max-width-600 mb-12">
        <div class="text-overline text-grey-darken-1 mb-4 text-center">POSICIONES FINALES</div>
        <div v-for="(team, idx) in sortedTeams" :key="'rank-'+team.id" 
             class="ranking-item d-flex align-center pa-4 mb-2 rounded-xl"
             :class="{ 'my-team-rank': isPlayerInTeam(team), 'gold-rank': idx === 0 }">
            <div class="rank-pos font-weight-black mr-4 text-h4">{{ idx + 1 }}</div>
            <div class="rank-info flex-grow-1">
                <div class="text-h6 font-weight-black">EQUIPO {{ team.id }}</div>
                <div class="text-caption text-grey-lighten-1">
                  {{ team.members.join(' & ') }}
                  <v-chip v-if="team.isBot" size="x-small" density="compact" class="ml-2">BOT AI</v-chip>
                </div>
            </div>
            <div class="rank-progress text-right">
                <div class="text-h4 font-weight-black" :style="{ color: teamColors[team.id-1] }">{{ Math.round(team.progress) }}%</div>
                <div class="text-caption text-grey">recorrido</div>
            </div>
        </div>
    </div>

    <!-- Gráfico de Rendimiento (ESTILO WII SPORTS) -->
    <div v-if="multiplayerStore.room?.gameConfig?.roundHistory?.length" class="performance-chart-section w-100 max-width-600 mb-10">
      <div class="text-overline text-grey-darken-1 mb-4 text-center">ANÁLISIS DE PROGRESO</div>
      
      <div class="chart-container pa-4 rounded-xl">
        <svg viewBox="0 0 500 200" class="performance-svg" preserveAspectRatio="none">
          <!-- Grillas de fondo -->
          <line v-for="i in 5" :key="'grid-'+i" x1="0" :y1="i * 40" x2="500" :y2="i * 40" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
          
          <!-- Líneas para cada participante (Evolución por rondas) -->
          <template v-if="isCooperative">
            <g v-for="team in multiplayerStore.room?.gameConfig?.teams" :key="'line-t-'+team.id">
              <path
                :d="getTeamChartPath(team.id)"
                fill="none"
                :stroke="teamColors[team.id-1]"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="line-path"
                :class="{ 'line-me': isPlayerInTeam(team) }"
              />
              <g v-for="(point, idx) in getTeamChartPoints(team.id)" :key="'p-t-'+team.id+'-'+idx">
                <circle :cx="point.x" :cy="point.y" r="4" :fill="teamColors[team.id-1]" />
              </g>
            </g>
          </template>
          
          <template v-else>
            <!-- Línea Oponente -->
            <path :d="getChartPath(opponentName)" fill="none" stroke="#FF4081" stroke-width="3" class="line-path" />
            <!-- Línea Jugador -->
            <path :d="getChartPath(myName)" fill="none" stroke="#00E5FF" stroke-width="4" class="line-path line-me" />
            
            <g v-for="(point, idx) in getChartPoints(myName)" :key="'p-me-'+idx"><circle :cx="point.x" :cy="point.y" r="5" fill="#00E5FF" /></g>
            <g v-for="(point, idx) in getChartPoints(opponentName)" :key="'p-opp-'+idx"><circle :cx="point.x" :cy="point.y" r="4" fill="#FF4081" /></g>
          </template>
        </svg>
        
        <!-- Eje X -->
        <div class="chart-labels d-flex justify-space-between mt-2 px-2">
          <span v-for="i in multiplayerStore.room.gameConfig.roundHistory.length + 1" :key="'lbl-'+i" class="text-caption text-grey-darken-1">
            R{{ i-1 }}
          </span>
        </div>
      </div>
      
      <div class="legend d-flex flex-wrap justify-center gap-4 mt-4">
        <template v-if="isCooperative">
           <div v-for="team in multiplayerStore.room?.gameConfig?.teams" :key="'leg-'+team.id" class="legend-item d-flex align-center">
            <div class="legend-color mr-2" :style="{ background: teamColors[team.id-1] }"></div>
            <span class="text-caption text-white font-weight-bold">EQ {{ team.id }} {{ isPlayerInTeam(team) ? '(TÚ)' : '' }}</span>
          </div>
        </template>
        <template v-else>
          <div class="legend-item d-flex align-center"><div class="legend-color me-bg mr-2"></div><span class="text-caption text-white font-weight-bold">TÚ</span></div>
          <div class="legend-item d-flex align-center"><div class="legend-color opp-bg mr-2"></div><span class="text-caption text-white font-weight-bold">{{ opponentName.toUpperCase() }}</span></div>
        </template>
      </div>
    </div>

    <!-- Botonera -->
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
  winner: { type: String, default: null },
  isTie: { type: Boolean, default: false },
  totalRounds: { type: Number, default: 0 },
  opponentName: { type: String, default: 'Oponente' },
  isHost: { type: Boolean, default: false }
});

const emit = defineEmits(['return-to-lobby']);

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();

const myName = computed(() => astroStore.user);
const isCooperative = computed(() => multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE');
const isWin = computed(() => {
    if (isCooperative.value) {
        const myTeam = multiplayerStore.room?.gameConfig?.teams?.find(t => isPlayerInTeam(t));
        return myTeam && myTeam.progress >= 100;
    }
    return !props.isTie && props.winner === myName.value;
});

const gameResultSubtext = computed(() => {
    if (isCooperative.value) {
        return isWin.value ? '¡Misión cumplida! Habéis escapado.' : 'El tiempo se agotó o la amenaza os alcanzó...';
    }
    return isWin.value ? 'Has conquistado la galaxia' : (props.isTie ? 'Nadie domina el cosmos hoy' : 'El cosmos te ha vencido esta vez');
});

const sortedTeams = computed(() => {
    if (!isCooperative.value) return [];
    return [...(multiplayerStore.room?.gameConfig?.teams || [])].sort((a, b) => b.progress - a.progress);
});

const teamColors = ['#00E5FF', '#FF4081', '#FFC107', '#7C4DFF'];

const hasMeReturned = computed(() => multiplayerStore.returnedPlayers.includes(myName.value));

const isPlayerInTeam = (team) => team.members.includes(myName.value);

const handleReturn = () => {
  multiplayerStore.returnToLobby();
  emit('return-to-lobby');
};

const getAvatarUrl = (avatarName, username) => {
  if (avatarName && (avatarName.includes('.jpg') || avatarName.includes('.png'))) return `/${avatarName.trim()}`;
  if (avatarName && avatarName.toLowerCase().startsWith('astronauta')) return `/${avatarName.trim()}`;
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'bot'}`;
};

const getPlayerAvatar = (username) => {
  if (!username) return '/Astronauta_blanc.jpg';
  if (username === astroStore.user) return getAvatarUrl(astroStore.avatar, username);
  const explorer = astroStore.explorers?.find(e => e.user === username);
  return getAvatarUrl(explorer?.avatar, username);
};

// --- LÓGICA DEL GRÁFICO ---
const getChartPoints = (player) => {
  const history = multiplayerStore.room?.gameConfig?.roundHistory || [];
  if (!history.length) return [];
  const points = [{ x: 0, y: 180 }];
  let accumulated = 0;
  const widthStep = 500 / history.length;
  history.forEach((h, idx) => {
    accumulated += h.scores[player] || 0;
    const y = 180 - (Math.min(accumulated, history.length) / history.length) * 160;
    points.push({ x: (idx + 1) * widthStep, y });
  });
  return points;
};

const getTeamChartPoints = (teamId) => {
  const history = multiplayerStore.room?.gameConfig?.roundHistory || [];
  if (!history.length) return [];
  const points = [{ x: 0, y: 180 }];
  const widthStep = 500 / history.length;
  
  history.forEach((h, idx) => {
    const teamProgress = h.teamsProgress?.find(tp => tp.id === teamId)?.progress || 0;
    // Y normalizada de 0-100% a 180-20px
    const y = 180 - (teamProgress / 100) * 160;
    points.push({ x: (idx + 1) * widthStep, y });
  });
  return points;
};

const getChartPath = (player) => {
  const points = getChartPoints(player);
  return points.reduce((path, p, i) => path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
};

const getTeamChartPath = (teamId) => {
  const points = getTeamChartPoints(teamId);
  return points.reduce((path, p, i) => path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
};
</script>

<style scoped>
.match-result-screen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(8, 15, 27, 0.98);
  z-index: 2000;
  backdrop-filter: blur(20px);
  overflow-y: auto;
  padding: 40px 20px;
}

.result-icon { filter: drop-shadow(0 0 30px currentColor); }
.result-title {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-shadow: 0 0 40px currentColor;
}

.score-board, .ranking-board {
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 28px;
  padding: 20px;
}

.score-board { padding: 40px 60px; }

.player-result { min-width: 160px; }
.winner-glow .player-avatar { box-shadow: 0 0 30px rgba(255, 193, 7, 0.6); }

.ranking-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    transition: transform 0.3s;
}

.my-team-rank {
    background: rgba(0, 229, 255, 0.1);
    border-color: rgba(0, 229, 255, 0.4);
    transform: scale(1.05);
}

.gold-rank {
    border-color: rgba(255, 193, 7, 0.5);
    box-shadow: 0 0 20px rgba(255, 193, 7, 0.1);
}

.rank-pos { color: rgba(255,255,255,0.2); }
.gold-rank .rank-pos { color: #ffc107; text-shadow: 0 0 10px #ffc107; }

.max-width-600 { max-width: 600px; }

.pulse-button { animation: pulse-glow 2s infinite; }
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

.player-avatar { background: #0a1929; border: 3px solid #00e5ff; }
.border-gold { border-color: #ffc107; }

.stars-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: -1;
}

/* Gráfico */
.chart-container { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 229, 255, 0.1); }
.performance-svg { width: 100%; height: 200px; overflow: visible; }
.line-path { transition: stroke-dashoffset 2s; }
.line-me { filter: drop-shadow(0 0 8px currentColor); stroke-width: 5; }

.legend-color { width: 12px; height: 12px; border-radius: 3px; }
.me-bg { background: #00E5FF; box-shadow: 0 0 10px #00E5FF; }
.opp-bg { background: #FF4081; box-shadow: 0 0 10px #FF4081; }
</style>
