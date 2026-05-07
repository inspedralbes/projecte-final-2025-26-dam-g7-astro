<template>
  <div ref="gameArea" class="game-container" @mousemove="updateFlashlight">
    <div class="hud d-flex justify-center align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
        <div class="text-h5 font-weight-bold text-cyan-accent-3">Temps: <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
      </div>
    </div>

    <div
      class="board d-flex flex-wrap justify-center align-center"
      :class="{ 'board-transitioning': isTransitioning && !correctClicked }"
      :style="{ width: boardSize + 'px' }"
    >
      <div
        v-for="(letter, index) in board"
        :key="index"
        class="letter-cell d-flex justify-center align-center text-h4 font-weight-bold cursor-pointer"
        :class="{ 
          'letter-correct': clickedIndices.get(index) === 'correct',
          'letter-incorrect': clickedIndices.get(index) === 'incorrect'
        }"
        :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
        @click="checkLetter(index)"
      >
        {{ letter }}
      </div>
    </div>

    <!-- ÚNICA CAPA DE ILUMINACIÓN (SOPORTA MULTIPLES FOCOS VIA BLEND-MODE) -->
    <div
      class="flashlight-overlay"
      :class="{ 'flashlight-hidden': isTransitioning }"
      :style="flashlightStyle"
    />

    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">Escàner de Ràdar</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          Troba la lletra diferent abans que s'esgoti el temps. Vigila, el teu camp de visió és limitat i fer clics a l'atzar et restarà temps!
        </p>
        <v-btn
          class="font-weight-black text-black block"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="startGame"
        >
          COMENÇAR (60s)
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay
      v-if="!isMultiplayer"
      v-model="showGameOverOverlay"
      class="align-center justify-center"
      persistent
      z-index="100"
    >
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="450">
        <v-icon class="mb-4" color="amber-accent-3" icon="mdi-trophy" size="80" />
        <h2 class="text-h4 font-weight-bold text-white mb-2">¡Escàner Completat!</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">Punts Totals: {{ score }}</p>
        <v-btn
          class="font-weight-black text-black px-8"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="returnToMenu"
        >
          TORNAR AL MENÚ
        </v-btn>
      </v-card>
    </v-overlay>

  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const emit = defineEmits(['game-over'])
  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
  })

  // --- VARIABLES D'ESTAT ---
  const showStartOverlay = ref(true)
  const showGameOverOverlay = ref(false)
  const isTransitioning = ref(false)
  const correctClicked = ref(false)
  const score = ref(0)
  const timeLeft = ref(60)
  let timerInterval = null

  // --- SISTEMA DE VISIÓ ---
  const mouseX = ref(0)
  const mouseY = ref(0)
  const gameArea = ref(null)

  // Throttle per enviar posició del rató al servidor (cada 50ms)
  function throttle (func, limit) {
    let lastRan
    let lastFunc
    return function (...args) {
      if (!lastRan) {
        func(...args)
        lastRan = Date.now()
      } else {
        clearTimeout(lastFunc)
        lastFunc = setTimeout(function () {
          if ((Date.now() - lastRan) >= limit) {
            func(...args)
            lastRan = Date.now()
          }
        }, limit - (Date.now() - lastRan))
      }
    }
  }

  const sendMouseMove = throttle((x, y) => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'MOUSE_MOVE',
        x: Math.round(x),
        y: Math.round(y),
      })
    }
  }, 50)

  // --- LÒGICA DEL TAULER ---
  const board = ref([])
  const currentLevel = ref(1)
  const targetIndex = ref(-1)
  const allTeamTargets = ref([]) // AÑADIDO: [{index, user}]

  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)

  // --- CONFIGURACIÓ DE NIVELLS ---
  const levels = [
    { distractor: 'p', target: 'q', grid: 5, tunnel: 250 },
    { distractor: 'b', target: 'd', grid: 7, tunnel: 200 },
    { distractor: 'm', target: 'n', grid: 9, tunnel: 150 },
    { distractor: 'O', target: 'Q', grid: 12, tunnel: 120 },
    { distractor: 'E', target: 'F', grid: 15, tunnel: 100 },
  ]

  // --- COMPUTADES ---
  const currentConfig = computed(() => {
    return levels[Math.min(currentLevel.value - 1, levels.length - 1)]
  })
  const currentTunnelSize = computed(() => currentConfig.value.tunnel)
  const cellSize = computed(() => Math.max(30, 600 / currentConfig.value.grid))
  const boardSize = computed(() => currentConfig.value.grid * cellSize.value)

  // Estil dinàmic per a múltiples linternes
  const flashlightStyle = computed(() => {
    const tunnelSize = currentTunnelSize.value
    const cursors = props.isMultiplayer ? Object.values(multiplayerStore.remoteCursors) : []

    // Per restaurar l'efecte del singleplayer i suportar múltiples linternes:
    // Usem mix-blend-mode: multiply. L'overlay serà negre amb spots blancs.
    // El blanc (1) deixa passar el color original, el negre (0) el tapa.
    
    const spots = [
      `radial-gradient(circle ${tunnelSize}px at ${mouseX.value}px ${mouseY.value}px, white 0%, rgba(255, 255, 255, 0) 80%)`
    ]

    for (const c of cursors) {
      spots.push(`radial-gradient(circle ${tunnelSize}px at ${c.x}px ${c.y}px, white 0%, rgba(255, 255, 255, 0) 80%)`)
    }

    return {
      'background': spots.join(', '),
      'background-color': '#0b1120', // Color base fosc
      'mix-blend-mode': 'multiply',
      'z-index': 5
    }
  })

  // --- FUNCIONS CORE ---
  function updateFlashlight (e) {
    if (!gameArea.value) return
    const rect = gameArea.value.getBoundingClientRect()
    mouseX.value = e.clientX - rect.left
    mouseY.value = e.clientY - rect.top

    if (props.isMultiplayer) {
      sendMouseMove(mouseX.value, mouseY.value)
    }
  }

  function generateBoard () {
    const config = currentConfig.value
    const totalCells = config.grid * config.grid
    clickedIndices.value.clear()

    if (props.isMultiplayer) {
      if (isHost.value) {
        // El host genera el tablero y los objetivos para su equipo
        const newBoard = Array.from({ length: totalCells }, () => config.distractor)

        const teamId = multiplayerStore.room.gameConfig.teams[astroStore.user]
        const teamPlayers = Object.keys(multiplayerStore.room.gameConfig.teams).filter(
          p => multiplayerStore.room.gameConfig.teams[p] === teamId,
        )

        const targets = []
        const usedIndices = new Set()

        for (const player of teamPlayers) {
          let idx
          do {
            idx = Math.floor(Math.random() * totalCells)
          } while (usedIndices.has(idx))
          usedIndices.add(idx)
          newBoard[idx] = config.target
          targets.push({ index: idx, user: player })
        }

        // Añadir señuelos (letras que no son distractor ni target) para aumentar dificultad
        const possibleDecoys = ['x', 'z', 'k', 'y', 'w', 'h', 'j'].filter(c => c !== config.distractor && c !== config.target)
        for (let i = 0; i < 2; i++) {
          let idx
          do {
            idx = Math.floor(Math.random() * totalCells)
          } while (usedIndices.has(idx))
          usedIndices.add(idx)
          newBoard[idx] = possibleDecoys[Math.floor(Math.random() * possibleDecoys.length)]
        }

        board.value = newBoard
        allTeamTargets.value = targets

        // Sincronizar con el equipo
        multiplayerStore.sendGameAction({
          type: 'BOARD_SYNC',
          board: newBoard,
          targets: targets,
        })
      }
    } else {
      // Modo individual original
      const newBoard = Array.from({ length: totalCells }, () => config.distractor)
      targetIndex.value = Math.floor(Math.random() * totalCells)
      newBoard[targetIndex.value] = config.target
      board.value = newBoard
    }
  }

  const clickedIndices = ref(new Map())

  function nextRound () {
    score.value += (currentLevel.value * 10)
    timeLeft.value = Math.min(60, timeLeft.value + 1)
    currentLevel.value++
    generateBoard()
  }

  function checkLetter (index) {
    if (showStartOverlay.value || showGameOverOverlay.value || timeLeft.value <= 0 || isTransitioning.value) return

    // En multijugador, validamos si es el objetivo asignado al jugador
    if (props.isMultiplayer) {
      const myTarget = allTeamTargets.value.find(t => t.user === astroStore.user)
      const isCorrect = myTarget && index === myTarget.index

      // Notificamos el click para sincronización visual inmediata
      multiplayerStore.sendGameAction({
        type: 'RADAR_CLICK',
        index,
        status: isCorrect ? 'correct' : 'incorrect'
      })

      if (!isCorrect) {
        timeLeft.value = Math.max(0, timeLeft.value - 2)
        return
      }

      // Si es su objetivo, marcamos como completado para este jugador
      isTransitioning.value = true
      clickedIndices.value.set(index, 'correct')

      setTimeout(() => {
        // Notificamos al servidor que hemos acabado nuestra parte
        multiplayerStore.submitRoundResult()
      }, 800)

      return
    }

    // Lógica original individual
    if (index === targetIndex.value) {
      isTransitioning.value = true
      clickedIndices.value.set(index, 'correct')

      setTimeout(() => {
        nextRound()
        setTimeout(() => {
          isTransitioning.value = false
        }, 200)
      }, 800)
    } else {
      clickedIndices.value.set(index, 'incorrect')
      timeLeft.value = Math.max(0, timeLeft.value - 3)
      score.value = Math.max(0, score.value - 5)
      if (timeLeft.value === 0) endGame()
      setTimeout(() => clickedIndices.value.delete(index), 500)
    }
  }

  function startGame () {
    showStartOverlay.value = false
    showGameOverOverlay.value = false
    isTransitioning.value = false
    correctClicked.value = false
    score.value = 0
    timeLeft.value = 60
    currentLevel.value = 1
    generateBoard()

    timerInterval = setInterval(() => {
      if (!isTransitioning.value && timeLeft.value > 0) {
        timeLeft.value--
        if (timeLeft.value <= 0) endGame()
      }
    }, 1000)
  }

  function endGame (silent = false) {
    clearInterval(timerInterval)

    if (props.isMultiplayer) {
      multiplayerStore.submitRoundResult()
      return
    }

    if (silent) {
      emit('game-over', score.value)
    } else {
      showGameOverOverlay.value = true
    }
  }

  function returnToMenu () {
    emit('game-over', score.value)
  }

  onMounted(() => {
    if (props.isMultiplayer) {
      startGame()
    }
  })

  // Listener para acciones multijugador
  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      emit('game-over', score.value)
      return
    }

    if (msg.type === 'ROUND_FINISHED') {
      nextRound()
      return
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 1))
      }

      if (msg.action?.type === 'BOARD_SYNC') {
        console.log('Tablero sincronizado recibido')
        board.value = msg.action.board
        allTeamTargets.value = msg.action.targets
        // Reseteamos estados visuales
        isTransitioning.value = false
        clickedIndices.value.clear()
      }

      if (msg.action?.type === 'RADAR_CLICK') {
        const { index, status } = msg.action
        clickedIndices.value.set(index, status)
        if (status === 'incorrect') {
          setTimeout(() => clickedIndices.value.delete(index), 500)
        }
      }
    }
  })

  // Notificar puntuación al servidor en modo multijugador
  watch(score, newScore => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'SCORE_UPDATE',
        score: newScore,
      })
    }
  })

  onBeforeUnmount(() => {
    if (timerInterval) clearInterval(timerInterval)
  })
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: #0f172a;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none;
}

.board {
  max-width: 90%;
  max-height: 90%;
  z-index: 2;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.board-transitioning {
  opacity: 0;
  transform: scale(0.95);
}

.letter-cell {
  color: #334155;
  transition: color 0.2s;
}

.letter-correct {
  color: #00e5ff !important;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.8);
  transform: scale(1.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10;
}

.letter-incorrect {
  color: #ff5252 !important;
  text-shadow: 0 0 10px rgba(255, 82, 82, 0.5);
  transition: all 0.2s;
}

.flashlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.4s ease-in-out;
}

.flashlight-hidden {
  opacity: 0 !important;
}

.bg-slate-800 { background-color: #1e293b; }
.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }

.hud-pill {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 999px;
  padding: 10px 22px;
  backdrop-filter: blur(4px);
}
</style>
