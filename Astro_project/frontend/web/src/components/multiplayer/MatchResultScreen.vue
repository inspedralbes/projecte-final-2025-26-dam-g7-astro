<template>
  <div class="match-result-screen d-flex flex-column align-center justify-center">
    <!-- Partículas decorativas -->
    <div class="stars-bg" />

    <!-- Icono principal -->
    <div class="result-icon-wrapper mb-6">
      <v-icon
        class="result-icon"
        :color="isWin ? 'amber' : (isTie ? 'cyan-accent-2' : 'red-lighten-1')"
        :icon="isWin ? 'mdi-trophy' : (isTie ? 'mdi-handshake' : 'mdi-skull-outline')"
        :size="160"
      />
    </div>

    <!-- Título -->
    <h1 class="result-title mb-2 italic glow-text" :class="isWin ? 'text-amber' : (isTie ? 'text-cyan-accent-2' : 'text-red-lighten-2')">
      {{ resultMainTitle }}
    </h1>

    <div v-if="winner && winner.startsWith('team-')" class="team-winner-banner mb-8 pa-4 rounded-pill">
      <v-icon icon="mdi-account-group" class="mr-2" />
      <span class="text-h4 font-weight-black text-uppercase">{{ $t('multiplayerResult.team') }} {{ winner.split('-')[1] }} {{ $t('multiplayerResult.winsTheMatch') || 'GUANYA LA PARTIDA' }}</span>
    </div>

    <p class="text-h5 text-grey-lighten-2 mb-10 text-center px-4 max-width-800">
      <span v-if="isWin" class="text-amber-accent-2 font-weight-bold d-block mb-2">{{ $t('multiplayerResult.winQuote') || '¡Has dominat la galàxia amb honor!' }}</span>
      <span v-else-if="isTie" class="text-cyan-accent-2 font-weight-bold d-block mb-2">{{ $t('multiplayerResult.tieQuote') || 'Un equilibri perfecte de forces.' }}</span>
      <span v-else class="text-red-lighten-3 font-weight-bold d-block mb-2">{{ $t('multiplayerResult.defeatQuote') || 'La derrota és només un pas més cap al coneixement.' }}</span>
      {{ isWin ? $t('multiplayerResult.winDesc') : (isTie ? $t('multiplayerResult.tieDesc') : $t('multiplayerResult.defeatDesc')) }}
    </p>

    <!-- GRÀFICA DE PUNTUACIÓ (Line Chart) -->
    <div v-if="chartData.length > 0" class="score-chart-container mb-12 w-100 max-width-800">
      <div class="text-overline text-cyan-accent-2 mb-4 text-center tracking-widest">TELEMETRIA DE RENDIMENT HISTÒRIC</div>
      <div class="chart-wrapper pa-6 rounded-xl border-cyan bg-black-opacity-40">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="score-svg" preserveAspectRatio="none">
          <!-- Cuadrícula -->
          <line v-for="i in 4" :key="'grid-h-'+i" x1="0" :y1="(chartHeight/4)*i" :x2="chartWidth" :y2="(chartHeight/4)*i" stroke="rgba(0,229,255,0.05)" stroke-width="1" />
          <line v-for="i in chartData.length" :key="'grid-v-'+i" :x1="(chartWidth/chartData.length)*i" y1="0" :x2="(chartWidth/chartData.length)*i" y2="chartHeight" stroke="rgba(0,229,255,0.05)" stroke-width="1" />
          
          <!-- Líneas de todos los equipos/jugadores -->
          <template v-for="(path, id) in allPaths" :key="'path-'+id">
            <path 
              :d="path.d" 
              fill="none" 
              :stroke="path.color" 
              :stroke-width="path.isMe ? 6 : 3" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              class="line-path"
              :class="{ 'me-path': path.isMe, 'opponent-path': !path.isMe }"
            />
            <circle v-for="(p, idx) in path.points" :key="'point-'+id+'-'+idx" :cx="p.x" :cy="p.y" :r="path.isMe ? 6 : 4" :fill="path.color" />
          </template>
        </svg>
        <div class="d-flex justify-space-between mt-4 px-2">
          <div v-for="(legend, id) in chartLegends" :key="'legend-'+id" class="d-flex align-center mr-4">
            <div class="legend-color mr-2" :style="{ backgroundColor: legend.color }" />
            <span class="text-caption font-weight-bold" :class="legend.isMe ? 'text-white' : 'text-grey'">{{ legend.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Marcador final -->
    <div class="score-board d-flex align-center mb-12">
      <!-- TÚ -->
      <div class="player-result text-center" :class="{ 'winner-glow': isWin }">
        <v-avatar class="mb-3 player-avatar" :class="isWin ? 'border-gold' : 'border-cyan'" size="80">
          <v-img :src="getPlayerAvatar(myName)" />
        </v-avatar>
        <div class="text-overline text-cyan-accent-2 mb-1">{{ $t('multiplayerResult.you') }}</div>
        <div class="text-h2 font-weight-black" :class="isWin ? 'text-amber' : 'text-white'">
          {{ scores[myName] || 0 }}
        </div>
        <div class="text-caption text-grey-lighten-1">{{ $t('multiplayerResult.roundsWon') }}</div>
        <div class="mt-4">
          <v-chip v-if="isWin" class="font-weight-black text-black" color="amber" size="small">{{ $t('multiplayerResult.winner') }}</v-chip>
          <v-chip
            v-else-if="!isTie"
            class="font-weight-bold"
            color="red-lighten-1"
            size="small"
            variant="tonal"
          >{{ $t('multiplayerResult.loser') }}</v-chip>

          <!-- Estado de retorno -->
          <div class="mt-2 status-container">
            <v-chip
              v-if="multiplayerStore.returnedPlayers.includes(myName)"
              color="success"
              prepend-icon="mdi-check-circle"
              size="x-small"
              variant="flat"
            >
              {{ $t('multiplayerResult.ready') }}
            </v-chip>
            <v-chip
              v-else
              color="grey"
              size="x-small"
              variant="outlined"
            >
              {{ $t('multiplayerResult.waiting') }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- VS separador -->
      <div class="vs-separator mx-8 text-center">
        <div class="text-h3 font-weight-black text-grey-darken-1">{{ isTeammate ? $t('multiplayerResult.team') : $t('multiplayerResult.vs') }}</div>
        <div class="text-caption text-grey mt-1">{{ $t('multiplayerResult.roundsPlayed', { total: totalRounds }) }}</div>
      </div>

      <!-- OPONENTE -->
      <div class="player-result text-center" :class="{ 'winner-glow': !isWin && !isTie }">
        <v-avatar class="mb-3 player-avatar" :class="!isWin && !isTie ? 'border-gold' : 'border-cyan'" size="80">
          <v-img :src="getPlayerAvatar(opponentName)" />
        </v-avatar>
        <div class="text-overline text-cyan-accent-2 mb-1">{{ opponentName }}</div>
        <div class="text-h2 font-weight-black" :class="!isWin && !isTie ? 'text-amber' : 'text-white'">
          {{ scores[opponentName] || 0 }}
        </div>
        <div class="text-caption text-grey-lighten-1">{{ $t('multiplayerResult.roundsWon') }}</div>
        <div class="mt-4">
          <v-chip v-if="!isWin && !isTie" class="font-weight-black text-black" color="amber" size="small">{{ $t('multiplayerResult.winner') }}</v-chip>
          <v-chip
            v-else-if="!isTie"
            class="font-weight-bold"
            color="red-lighten-1"
            size="small"
            variant="tonal"
          >{{ $t('multiplayerResult.loser') }}</v-chip>

          <!-- Estado de retorno oponente -->
          <div class="mt-2 status-container">
            <v-chip
              v-if="multiplayerStore.returnedPlayers.includes(opponentName)"
              color="success"
              prepend-icon="mdi-check-circle"
              size="x-small"
              variant="flat"
            >
              {{ $t('multiplayerResult.ready') }}
            </v-chip>
            <v-chip
              v-else
              color="grey"
              size="x-small"
              variant="outlined"
            >
              {{ $t('multiplayerResult.waiting') }}
            </v-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de rondas -->
    <div v-if="multiplayerStore.room?.gameConfig?.roundHistory?.length" class="round-history-section w-100 max-width-600 mb-8">
      <div class="text-overline text-grey-darken-1 mb-4 text-center">{{ $t('multiplayerResult.missionHistory') }}</div>
      <v-row dense justify="center">
        <v-col v-for="h in multiplayerStore.room?.gameConfig?.roundHistory" :key="h.round" cols="12">
          <v-card class="round-history-card pa-3 mb-2 rounded-lg" color="rgba(255,255,255,0.03)" variant="flat">
            <div class="d-flex align-center justify-space-between">
              <div class="round-num text-caption font-weight-black text-cyan-accent-2 mr-4">RD {{ h.round }}</div>
              <div class="game-info d-flex align-center flex-grow-1">
                <v-icon class="mr-2 text-grey-darken-1" icon="mdi-controller" size="18" />
                <div class="text-body-2 font-weight-bold text-white">{{ $te('games.' + h.game) ? $t('games.' + h.game) : h.game }}</div>
              </div>
              <div class="round-winner-indicator mx-4">
                <v-chip
                  v-if="h.winner === myName"
                  class="font-weight-black"
                  color="success"
                  density="compact"
                  size="x-small"
                  variant="flat"
                >{{ $t('multiplayerResult.victory') }}</v-chip>
                <v-chip
                  v-else-if="h.winner === opponentName"
                  class="font-weight-black"
                  color="error"
                  density="compact"
                  size="x-small"
                  variant="flat"
                >{{ $t('multiplayerResult.defeat') }}</v-chip>
                <v-chip
                  v-else
                  class="font-weight-black"
                  color="grey-darken-1"
                  density="compact"
                  size="x-small"
                  variant="tonal"
                >{{ $t('multiplayerResult.tie') }}</v-chip>
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
        class="font-weight-black px-12 pulse-button"
        color="success"
        rounded="xl"
        size="x-large"
        @click="handleReturn"
      >
        <v-icon start>mdi-reply</v-icon> {{ $t('multiplayerResult.backToLobby') }}
      </v-btn>
      <div v-else class="text-center">
        <v-progress-circular class="mb-2" color="cyan-accent-2" indeterminate size="40" />
        <p class="text-cyan-accent-2 font-weight-bold italic">{{ $t('multiplayerResult.waitingTeam') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t } = useI18n()
  const props = defineProps({
    scores: { type: Object, default: () => ({}) },
    winner: { type: String, default: null }, // null = empate
    isTie: { type: Boolean, default: false },
    totalRounds: { type: Number, default: 0 },
    opponentName: { type: String, default: 'Oponente' },
    isHost: { type: Boolean, default: false },
    isTeammate: { type: Boolean, default: false },
  })

  const emit = defineEmits(['return-to-lobby'])

  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()

  const myName = computed(() => astroStore.user)
  const myTeam = computed(() => multiplayerStore.room?.gameConfig?.teams?.[myName.value])

  const resultMainTitle = computed(() => {
    if (props.isTie) return t('multiplayerResult.tie')
    if (isWin.value) return t('multiplayerResult.victory')
    return t('multiplayerResult.defeat')
  })

  // Lógica de Gráfica Mejorada
  const chartWidth = 800
  const chartHeight = 300
  const chartData = computed(() => multiplayerStore.room?.gameConfig?.roundHistory || [])
  
  const chartLegends = computed(() => {
    const teams = multiplayerStore.room?.gameConfig?.teams || {}
    const players = multiplayerStore.room?.players || []
    
    // Si hay equipos, mostramos por equipo
    if (Object.keys(teams).length > 0) {
      const uniqueTeams = [...new Set(Object.values(teams))].sort()
      return uniqueTeams.map(tId => ({
        id: tId,
        name: t('multiplayerLobby.team') + ' ' + tId.split('-')[1],
        color: getTeamHexColor(tId),
        isMe: myTeam.value === tId
      }))
    }
    
    // Si no hay equipos, mostramos por jugador
    return players.map(p => {
      const pName = typeof p === 'string' ? p : (p.username || p.user)
      return {
        id: pName,
        name: pName === myName.value ? t('multiplayerResult.you') : pName,
        color: pName === myName.value ? '#00e5ff' : '#ff5252',
        isMe: pName === myName.value
      }
    })
  })

  const allPaths = computed(() => {
    if (!chartData.value.length) return {}
    
    const legends = chartLegends.value
    const maxVal = Math.max(...chartData.value.map(h => Math.max(...Object.values(h.currentScores))), 5)
    
    const paths = {}
    legends.forEach(legend => {
      const points = [{ x: 0, y: chartHeight }]
      
      chartData.value.forEach((h, i) => {
        let score = 0
        if (legend.id.startsWith('team-')) {
          // Score de equipo (máximo de sus miembros)
          const teamPlayers = Object.entries(multiplayerStore.room.gameConfig.teams)
            .filter(([_, tId]) => tId === legend.id)
            .map(([u, _]) => u)
          score = Math.max(...teamPlayers.map(u => h.currentScores[u] || 0))
        } else {
          score = h.currentScores[legend.id] || 0
        }
        
        points.push({
          x: (chartWidth / chartData.value.length) * (i + 1),
          y: chartHeight - (score / maxVal) * chartHeight * 0.8 - 20 // Offset para que no toque arriba
        })
      })
      
      paths[legend.id] = {
        d: `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`,
        points,
        color: legend.color,
        isMe: legend.isMe
      }
    })
    
    return paths
  })

  function getTeamHexColor(tId) {
    const colors = {
      'team-1': '#ff5252',
      'team-2': '#00e676',
      'team-3': '#ffab40',
      'team-4': '#e040fb'
    }
    return colors[tId] || '#ffffff'
  }

  const isWin = computed(() => {
    if (props.isTie || !props.winner) return false
    // Si el ganador es mi nombre o mi equipo
    return props.winner === myName.value || props.winner === myTeam.value
  })

  const hasMeReturned = computed(() => multiplayerStore.returnedPlayers.includes(myName.value))

  function handleReturn () {
    multiplayerStore.returnToLobby()
    emit('return-to-lobby')
  }

  function getAvatarUrl (avatarName, username) {
    const safeUsername = (username && typeof username === 'object') ? (username.name || username.user || 'Astronauta') : username
    if (avatarName && typeof avatarName === 'string' && (avatarName.includes('.jpg') || avatarName.includes('.png'))) {
      return `/${avatarName.trim()}`
    }
    if (avatarName && typeof avatarName === 'string' && avatarName.toLowerCase().startsWith('astronauta')) {
      return `/${avatarName.trim()}`
    }
    if (safeUsername && safeUsername !== '[object Object]') {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(safeUsername)}`
    }
    return '/Astronauta_blanc.jpg'
  }

  function getPlayerAvatar (username) {
    if (!username) return '/Astronauta_blanc.jpg'
    if (username === astroStore.user) {
      return getAvatarUrl(astroStore.avatar, username)
    }
    const explorer = astroStore.explorers?.find(e => e.user === username)
    if (explorer) {
      return getAvatarUrl(explorer.avatar, username)
    }
    return getAvatarUrl(null, username)
  }
</script>

<style scoped>
.match-result-screen {
  position: absolute;
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

.team-winner-banner {
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid #ffc107;
  color: #ffc107;
  text-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
  box-shadow: 0 0 30px rgba(255, 193, 7, 0.2);
  animation: slide-in-top 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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

.max-width-800 {
  max-width: 800px;
}

.bg-black-opacity-40 {
  background: rgba(0, 0, 0, 0.4);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.me-path {
  filter: drop-shadow(0 0 8px currentColor);
}

.opponent-path {
  stroke-dasharray: 8, 4;
  opacity: 0.8;
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
  background: #0a1929;
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

:deep(.v-avatar .v-img__img),
:deep(.v-avatar img) {
  border-radius: 50%;
  transform: scale(1.4);
  transform-origin: center center;
  object-position: center center;
}

.score-chart-container {
  animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.chart-wrapper {
  position: relative;
  overflow: hidden;
}

.score-svg {
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.2));
}

.line-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-line 2s forwards ease-in-out;
}

@keyframes slide-in-top {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
