<template>
  <div class="match-result-screen d-flex flex-column align-center">
    <!-- Partículas decorativas -->
    <div class="stars-bg" />

    <!-- Espaciador de seguridad superior -->
    <div class="safe-top-spacer" />

    <!-- SECCIÓN DE RESULTADO ESTÁNDAR / INDIVIDUAL O DUELO -->
    <template v-if="!isTeammate">
      <!-- Icono principal -->
      <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'" class="result-icon-wrapper mb-6">
        <v-icon
          class="result-icon"
          :color="isWin ? 'amber' : (isTie ? 'cyan-accent-2' : 'red-lighten-1')"
          :icon="isWin ? 'mdi-trophy' : (isTie ? 'mdi-handshake' : 'mdi-skull-outline')"
          :size="160"
        />
      </div>

      <!-- Título -->
      <h1 v-if="multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT'" class="result-title mb-8 italic glow-text text-amber">
        CLASSIFICACIÓ FINAL DEL TORNEIG
      </h1>
      <template v-else>
        <h1 class="result-title mb-2 italic glow-text" :class="isWin ? 'text-amber' : (isTie ? 'text-cyan-accent-2' : 'text-red-lighten-2')">
          {{ resultMainTitle }}
        </h1>

        <div v-if="winner && winner.startsWith('team-')" class="team-winner-banner mb-8 pa-4 rounded-pill">
          <v-icon icon="mdi-account-group" class="mr-2" />
          <span class="text-h4 font-weight-black text-uppercase">{{ $t('multiplayerResult.team') }} {{ winner.split('-')[1] }} {{ $t('multiplayerResult.winsTheMatch') || 'GUANYA LA PARTIDA' }}</span>
        </div>
      </template>

      <p v-if="multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'" class="text-h5 text-grey-lighten-2 mb-10 text-center px-4 max-width-800">
        <span v-if="isWin" class="text-amber-accent-2 font-weight-bold d-block mb-2">{{ $t('multiplayerResult.winQuote') || '¡Has dominat la galàxia amb honor!' }}</span>
        <span v-else-if="isTie" class="text-cyan-accent-2 font-weight-bold d-block mb-2">{{ $t('multiplayerResult.tieQuote') || 'Un equilibri perfecte de forces.' }}</span>
        <span v-else class="text-red-lighten-3 font-weight-bold d-block mb-2">{{ $t('multiplayerResult.defeatQuote') || 'La derrota és només un pas més cap al coneixement.' }}</span>
        {{ isWin ? $t('multiplayerResult.winDesc') : (isTie ? $t('multiplayerResult.tieDesc') : $t('multiplayerResult.defeatDesc')) }}
      </p>
    </template>

    <!-- SECCIÓN COOPERATIVA DE PAREJAS / EQUIPO -->
    <template v-else>
      <div class="coop-victory-banner w-100 max-width-800 pa-8 rounded-xl text-center mb-8">
        <div class="result-icon-wrapper mb-6">
          <v-icon
            class="result-icon"
            color="amber"
            icon="mdi-account-multiple-check"
            :size="160"
          />
        </div>
        <h1 class="result-title mb-2 italic glow-text text-amber">
          ¡MISIÓN COMPLETADA EN EQUIPO!
        </h1>
        <p class="text-h4 font-weight-black text-white mt-4">
          ¡Enhorabuena! Como pareja habéis conseguido <span class="text-cyan-accent-2 font-weight-black text-h3 glow-text-cyan">{{ totalCoopScore }}</span> puntos.
        </p>
        <p class="text-subtitle-1 text-grey-lighten-2 mt-2">
          Vuestra sinergia espacial ha asegurado la victoria de la tripulación.
        </p>
      </div>

      <!-- ANÁLISIS DETALLADO COOPERATIVO -->
      <div class="coop-analysis-card w-100 max-width-800 pa-6 rounded-xl border-cyan mb-10 bg-black-opacity-40">
        <div class="text-overline text-cyan-accent-2 mb-4 text-center tracking-widest">📋 ANÁLISIS DE RENDIMIENTO DE TRIPULACIÓN</div>
        
        <v-row>
          <v-col cols="12" md="4">
            <div class="analysis-stat-box text-center pa-4 rounded-lg bg-slate-900-opacity">
              <div class="text-caption text-grey">Puntos Compartidos</div>
              <div class="text-h3 font-weight-black text-amber">{{ totalCoopScore }}</div>
              <div class="text-caption text-grey-lighten-1">Puntos Totales</div>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="analysis-stat-box text-center pa-4 rounded-lg bg-slate-900-opacity">
              <div class="text-caption text-grey">Eficiencia de Rondas</div>
              <div class="text-h3 font-weight-black text-cyan-accent-3">100%</div>
              <div class="text-caption text-grey-lighten-1">Misiones Completadas</div>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="analysis-stat-box text-center pa-4 rounded-lg bg-slate-900-opacity">
              <div class="text-caption text-grey">Sintonización Mental</div>
              <div class="text-h3 font-weight-black text-green-accent-3">{{ sintonizacionPct }}%</div>
              <div class="text-caption text-grey-lighten-1">Nivel de Sinergia</div>
            </div>
          </v-col>
        </v-row>

        <div class="coop-feedback-box mt-6 pa-4 rounded-lg bg-cyan-opacity-10 border-cyan-light text-center">
          <v-icon icon="mdi-orbit" color="cyan-accent-3" class="mb-2" size="32" />
          <h4 class="text-subtitle-1 font-weight-black text-cyan-accent-2 mb-1">Informe del Comandante de Misión</h4>
          <p class="text-body-2 text-grey-lighten-2 italic mx-auto" style="max-width: 600px;">
            "{{ coopFeedbackMessage }}"
          </p>
        </div>
      </div>
    </template>

    <!-- GRÀFICA DE PUNTUACIÓ (Line Chart) -->
    <div v-if="chartData.length > 0 && multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'" class="score-chart-container mb-12 w-100 max-width-800">
      <div class="text-overline text-cyan-accent-2 mb-4 text-center tracking-widest">TELEMETRIA DE RENDIMENT HISTÒRIC</div>
      <div class="chart-wrapper pa-6 rounded-xl border-cyan bg-black-opacity-40">
        <svg :viewBox="`0 0 ${chartWidth || 800} ${chartHeight || 300}`" class="score-svg" preserveAspectRatio="none">
          <!-- Cuadrícula -->
          <line v-for="i in 4" :key="'grid-h-'+i" x1="0" :y1="(chartHeight/4)*i" :x2="chartWidth" :y2="(chartHeight/4)*i" stroke="rgba(0,229,255,0.05)" stroke-width="1" />
          <line v-for="i in chartData.length" :key="'grid-v-'+i" :x1="chartData.length ? (chartWidth/chartData.length)*i : 0" y1="0" :x2="chartData.length ? (chartWidth/chartData.length)*i : 0" :y2="chartHeight" stroke="rgba(0,229,255,0.05)" stroke-width="1" />
          
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

    <!-- PODIO ESTILO KAHOOT (Solo en modo Torneo) -->
    <div v-if="multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT'" class="tournament-podium-container w-100 mb-12">
      <div class="podium-wrapper">
        
        <!-- 2º PUESTO (Plata) -->
        <div class="podium-step-wrapper rank-2">
          <div class="podium-player">
            <v-avatar size="80" class="podium-avatar border-silver">
              <v-img v-if="tournamentRankings[1]" :src="getPlayerAvatar(tournamentRankings[1].name)" />
              <v-icon v-else icon="mdi-account-question" color="grey" />
            </v-avatar>
            <div class="podium-name silver-text">{{ tournamentRankings[1]?.name || '---' }}</div>
          </div>
          <div class="podium-block step-silver">
            <div class="rank-number">2</div>
            <div class="podium-score">{{ tournamentRankings[1]?.score || 0 }} pts</div>
            <div v-if="tournamentRankings[1]?.prize" class="podium-prize text-cyan-accent-2 font-weight-black mt-1">
               +{{ tournamentRankings[1].prize }} <v-icon icon="mdi-star" size="14" />
            </div>
          </div>
        </div>

        <!-- 1er PUESTO (Oro) -->
        <div class="podium-step-wrapper rank-1">
          <div class="podium-player">
            <div class="crown-wrapper"><v-icon icon="mdi-crown" color="amber" size="40" class="crown-icon" /></div>
            <v-avatar size="110" class="podium-avatar border-gold winner-glow">
              <v-img v-if="tournamentRankings[0]" :src="getPlayerAvatar(tournamentRankings[0].name)" />
              <v-icon v-else icon="mdi-account-question" color="grey" />
            </v-avatar>
            <div class="podium-name gold-text">{{ tournamentRankings[0]?.name || '---' }}</div>
          </div>
          <div class="podium-block step-gold">
            <div class="rank-number">1</div>
            <div class="podium-score">{{ tournamentRankings[0]?.score || 0 }} pts</div>
            <div v-if="tournamentRankings[0]?.prize" class="podium-prize text-amber-accent-2 font-weight-black mt-1">
               +{{ tournamentRankings[0].prize }} <v-icon icon="mdi-database-outline" size="14" /> <span class="text-caption">Astrocions</span>
            </div>
          </div>
        </div>

        <!-- 3er PUESTO (Bronce) -->
        <div class="podium-step-wrapper rank-3">
          <div class="podium-player">
            <v-avatar size="70" class="podium-avatar border-bronze">
              <v-img v-if="tournamentRankings[2]" :src="getPlayerAvatar(tournamentRankings[2].name)" />
              <v-icon v-else icon="mdi-account-question" color="grey" />
            </v-avatar>
            <div class="podium-name bronze-text">{{ tournamentRankings[2]?.name || '---' }}</div>
          </div>
          <div class="podium-block step-bronze">
            <div class="rank-number">3</div>
            <div class="podium-score">{{ tournamentRankings[2]?.score || 0 }} pts</div>
            <div v-if="tournamentRankings[2]?.prize" class="podium-prize text-orange-accent-2 font-weight-black mt-1">
               +{{ tournamentRankings[2].prize }} <v-icon icon="mdi-star" size="14" />
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- CLASIFICACIÓN COMPLETA (Para más de 3 jugadores) -->
    <div v-if="multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT' && tournamentStandings.length > 3" class="full-classification-section w-100 max-width-600 mb-12">
      <div class="text-overline text-grey-darken-1 mb-4 text-center">Clasificació Completa</div>
      <v-list class="bg-transparent" theme="dark">
        <v-list-item v-for="p in tournamentStandings.slice(3)" :key="p.name" class="classification-item px-4 py-2 mb-2 rounded-lg">
          <template v-slot:prepend>
            <div class="rank-badge mr-4">{{ p.rank }}</div>
            <v-avatar size="40" class="mr-3 border-cyan-light"><v-img :src="getPlayerAvatar(p.name)" /></v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold text-white">{{ p.name }}</v-list-item-title>
          <template v-slot:append>
            <div class="text-h6 font-weight-black text-cyan-accent-2">{{ p.score }} pts</div>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- Marcador final (Solo modo normal/duelo no cooperativo) -->
    <div v-if="!isTeammate" class="score-board d-flex align-center mb-12">
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

    <!-- Estado de Preparación de la Tripulación (Solo en modo Cooperativo / Parejas) -->
    <div v-else class="crew-status-container w-100 max-width-600 mb-8 pa-5 rounded-xl bg-black-opacity-40 text-center border-cyan-light">
      <div class="text-overline text-cyan-accent-2 mb-3 tracking-widest">SINCRO DE RETORNO A BASE</div>
      <div class="d-flex justify-center align-center gap-6">
        <!-- Yo -->
        <div class="d-flex align-center gap-3">
          <v-avatar size="40" class="border-cyan"><v-img :src="getPlayerAvatar(myName)" /></v-avatar>
          <div class="text-left">
            <div class="text-body-2 font-weight-bold text-white">{{ $t('multiplayerResult.you') }}</div>
            <v-chip
              v-if="multiplayerStore.returnedPlayers.includes(myName)"
              color="success"
              prepend-icon="mdi-check-circle"
              size="x-small"
              variant="flat"
              class="mt-1"
            > Listo </v-chip>
            <v-chip v-else color="grey" size="x-small" variant="outlined" class="mt-1"> Esperando </v-chip>
          </div>
        </div>

        <div class="vertical-divider-custom mx-6" />

        <!-- Compañero -->
        <div class="d-flex align-center gap-3">
          <v-avatar size="40" class="border-cyan"><v-img :src="getPlayerAvatar(opponentName)" /></v-avatar>
          <div class="text-left">
            <div class="text-body-2 font-weight-bold text-white">{{ opponentName }}</div>
            <v-chip
              v-if="multiplayerStore.returnedPlayers.includes(opponentName)"
              color="success"
              prepend-icon="mdi-check-circle"
              size="x-small"
              variant="flat"
              class="mt-1"
            > Listo </v-chip>
            <v-chip v-else color="grey" size="x-small" variant="outlined" class="mt-1"> Esperando </v-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de rondas -->
    <div v-if="multiplayerStore.room?.gameConfig?.roundHistory?.length && multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'" class="round-history-section w-100 max-width-600 mb-8">
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
                  v-else-if="h.winner === (tournamentRankings[0] ? tournamentRankings[0].name : opponentName)"
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
              <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'">
                {{ (h.currentScores && h.currentScores[myName]) || 0 }} - {{ (h.currentScores && h.currentScores[opponentName]) || 0 }}
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
  import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'

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
    
    const isIndividual = ['individual', 'tournament', 'race', '1vs1', 'carrera', 'torneig', 'duel'].includes(multiplayerStore.room?.gameConfig?.modality)
    
    // Si hay equipos Y no es modo individual, mostramos por equipo
    if (Object.keys(teams).length > 0 && !isIndividual) {
      const uniqueTeams = [...new Set(Object.values(teams))].sort()
      return uniqueTeams.map(tId => ({
        id: tId,
        name: t('multiplayerLobby.team') + ' ' + tId.split('-')[1],
        color: getTeamHexColor(tId),
        isMe: myTeam.value === tId
      }))
    }
    
    // Si no hay equipos o es modo individual, mostramos por jugador
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
    const maxVal = Math.max(
      ...chartData.value.map(h => {
        const vals = Object.values(h.currentScores || {}).map(Number).filter(v => !isNaN(v))
        return vals.length ? Math.max(...vals) : 0
      }),
      5
    )
    
    const paths = {}
    legends.forEach(legend => {
      const points = [{ x: 0, y: chartHeight }]
      
      chartData.value.forEach((h, i) => {
        let score = 0
        if (legend.id.startsWith('team-')) {
          // Score de equipo (máximo de sus miembros)
          const teamPlayers = Object.entries(multiplayerStore.room.gameConfig.teams || {})
            .filter(([_, tId]) => tId === legend.id)
            .map(([u, _]) => u)
          score = teamPlayers.length ? Math.max(...teamPlayers.map(u => (h.currentScores && h.currentScores[u]) || 0)) : 0
        } else {
          score = (h.currentScores && h.currentScores[legend.id]) || 0
        }
        
        const calculatedX = chartData.value.length ? (chartWidth / chartData.value.length) * (i + 1) : 0
        const ratio = maxVal > 0 ? (score / maxVal) : 0
        const calculatedY = chartHeight - ratio * chartHeight * 0.8 - 20
        points.push({
          x: isNaN(calculatedX) || !isFinite(calculatedX) ? 0 : calculatedX,
          y: isNaN(calculatedY) || !isFinite(calculatedY) ? chartHeight : calculatedY
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

  const totalCoopScore = computed(() => {
    const s = props.scores || {}
    const p1Score = Number(s[myName.value] || 0)
    const p2Score = Number(s[props.opponentName] || 0)
    return p1Score + p2Score
  })

  const sintonizacionPct = computed(() => {
    const s = props.scores || {}
    const p1 = Number(s[myName.value] || 0)
    const p2 = Number(s[props.opponentName] || 0)
    const total = p1 + p2
    if (total === 0) return 50
    const diff = Math.abs(p1 - p2)
    const ratio = diff / total
    return Math.round(98 - (ratio * 38))
  })

  const coopFeedbackMessage = computed(() => {
    const score = totalCoopScore.value
    if (score >= 500) {
      return "¡Excelente sincronización intergaláctica! Vuestra coordinación táctica es de nivel élite. Habéis sintonizado vuestros intelectos a la perfección para salvar la nave espacial."
    } else if (score >= 250) {
      return "Sinergia operacional óptima. Habéis demostrado un excelente flujo de comunicación y capacidad de resolución conjunta. ¡Un gran tándem espacial!"
    } else {
      return "Misión completada con éxito, pero la telemetría muestra algunas turbulencias en la sincronización. Seguid entrenando vuestra sintonía para futuros viajes espaciales."
    }
  })

  // Lógica de Ranking para el Podio
  const tournamentRankings = computed(() => {
    if (multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT') return []
    
    const tournament = multiplayerStore.room.gameConfig.tournament
    const allMatches = tournament.brackets || []
    
    // Identificar la gran final (el último match del torneo)
    const finalMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null
    let first = null, second = null
    
    if (finalMatch && (finalMatch.status === 'FINISHED' || multiplayerStore.room.status === 'MATCH_FINISHED' || multiplayerStore.room.status === 'GAME_OVER')) {
      first = finalMatch.winner
      if (first) {
        second = (finalMatch.winner === finalMatch.p1) ? finalMatch.p2 : finalMatch.p1
      }
    }

    // 3er puesto: Los perdedores de la ronda anterior (semifinales)
    // O simplemente los que tengan más puntuación y no sean 1º ni 2º
    const scores = multiplayerStore.room.gameConfig.scores || {}
    const players = (multiplayerStore.room.players || []).map(p => typeof p === 'string' ? p : p.username)
    
    const sortedPlayers = [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
    
    // Si no tenemos clara la final, usamos el top de scores
    if (!first && sortedPlayers.length > 0) first = sortedPlayers[0]
    if (!second && sortedPlayers.length > 1) second = sortedPlayers[1]
    
    const third = sortedPlayers.find(p => p !== first && p !== second)

    const buyIn = multiplayerStore.room?.gameConfig?.buyIn || 0
    const totalPool = buyIn * (multiplayerStore.room?.players?.length || 0)

    const ranks = []
    if (first) ranks.push({ name: first, score: scores[first] || 0, prize: totalPool })
    if (second) ranks.push({ name: second, score: scores[second] || 0, prize: 0 })
    if (third) ranks.push({ name: third, score: scores[third] || 0, prize: 0 })
    
    return ranks
  })

  const tournamentStandings = computed(() => {
    if (multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT') return []
    const scores = multiplayerStore.room.gameConfig.scores || {}
    const players = (multiplayerStore.room.players || []).map(p => typeof p === 'string' ? p : p.username)
    
    return [...players]
      .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
      .map((name, index) => ({
        rank: index + 1,
        name,
        score: scores[name] || 0
      }))
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(8, 15, 27, 0.98);
  z-index: 999999;
  backdrop-filter: blur(20px);
  overflow-y: auto;
  padding: 80px 20px 40px 20px;
}

.safe-top-spacer {
  height: 40px;
  width: 100%;
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
  /* --- PODIUM STYLES --- */
  .tournament-podium-container {
    perspective: 1000px;
    margin-top: 40px;
  }
  .podium-wrapper {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 20px;
    height: 450px;
  }
  .podium-step-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 180px;
    animation: slide-up-podium 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }
  .rank-1 { animation-delay: 0.6s; z-index: 3; }
  .rank-2 { animation-delay: 0.3s; z-index: 2; }
  .rank-3 { animation-delay: 0s; z-index: 1; }

  @keyframes slide-up-podium {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .podium-player {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
    text-align: center;
  }
  .podium-avatar {
    background: #0f172a;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .podium-name {
    margin-top: 10px;
    font-weight: 900;
    font-size: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .podium-block {
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 12px 12px 0 0;
    box-shadow: inset 0 2px 10px rgba(255,255,255,0.1);
  }
  .rank-number {
    font-size: 4rem;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 5px;
    opacity: 0.8;
    font-style: italic;
  }
  .podium-score {
    font-size: 0.9rem;
    font-weight: 700;
    opacity: 0.9;
    background: rgba(0,0,0,0.2);
    padding: 2px 10px;
    border-radius: 20px;
  }

  /* Materiales metálicos */
  .step-gold { 
    height: 240px; 
    background: linear-gradient(135deg, #f59e0b 0%, #78350f 100%);
    border: 2px solid #fbbf24;
  }
  .step-silver { 
    height: 180px; 
    background: linear-gradient(135deg, #94a3b8 0%, #334155 100%);
    border: 2px solid #cbd5e1;
  }
  .step-bronze { 
    height: 130px; 
    background: linear-gradient(135deg, #b45309 0%, #451a03 100%);
    border: 2px solid #d97706;
  }

  .gold-text { color: #fbbf24; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
  .silver-text { color: #cbd5e1; text-shadow: 0 0 10px rgba(203, 213, 225, 0.5); }
  .bronze-text { color: #d97706; text-shadow: 0 0 10px rgba(217, 119, 6, 0.5); }

  .border-gold { border: 4px solid #fbbf24 !important; }
  .border-silver { border: 4px solid #cbd5e1 !important; }
  .border-bronze { border: 4px solid #d97706 !important; }

  .crown-wrapper {
    height: 40px;
    margin-bottom: -5px;
    animation: float 3s infinite ease-in-out;
  }
  .crown-icon { filter: drop-shadow(0 0 10px #fbbf24); }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .classification-item {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(0, 229, 255, 0.1);
    transition: all 0.3s ease;
  }
  .classification-item:hover {
    background: rgba(0, 229, 255, 0.05) !important;
    border-color: rgba(0, 229, 255, 0.3);
    transform: translateX(5px);
  }
  .rank-badge {
    width: 32px;
    height: 32px;
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 900;
    color: #00e5ff;
  }
  .border-cyan-light {
    border: 1px solid rgba(0, 229, 255, 0.3);
  }
  .max-width-600 {
    max-width: 600px;
  }

  /* --- COOPERATIVE MATCH RESULTS STYLES --- */
  .coop-victory-banner {
    background: radial-gradient(circle at center, rgba(255, 193, 7, 0.12) 0%, rgba(8, 15, 27, 0) 75%);
    border: 1px dashed rgba(255, 193, 7, 0.25);
    box-shadow: 0 0 40px rgba(255, 193, 7, 0.05);
    animation: zoom-in-coop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes zoom-in-coop {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .coop-analysis-card {
    border: 1px solid rgba(0, 229, 255, 0.2) !important;
    background: rgba(10, 25, 47, 0.45) !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
    animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .analysis-stat-box {
    background: rgba(15, 23, 42, 0.65) !important;
    border: 1px solid rgba(0, 229, 255, 0.1) !important;
    transition: all 0.3s ease;
  }

  .analysis-stat-box:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 229, 255, 0.35) !important;
    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.15);
  }

  .coop-feedback-box {
    background: rgba(0, 229, 255, 0.04) !important;
    border: 1px dashed rgba(0, 229, 255, 0.25) !important;
  }

  .glow-text-cyan {
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
  }

  .vertical-divider-custom {
    width: 1px;
    height: 50px;
    background: rgba(0, 229, 255, 0.15);
  }

  .crew-status-container {
    border: 1px solid rgba(0, 229, 255, 0.15) !important;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    animation: slide-up 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>

