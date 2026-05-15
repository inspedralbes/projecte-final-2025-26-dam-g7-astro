<template>
  <div ref="gameArea" class="game-container" :class="{ 'game-paused': props.isPaused }" @mousemove="updateFlashlight">
    <div class="hud d-flex justify-center align-center pa-2 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">{{ $t('radarScan.points', { score }) }}</div>
        <div class="text-h5 font-weight-bold text-cyan-accent-3">{{ $t('radarScan.time') }} <span
            :class="{ 'text-red': timeLeft <= 10 }">{{ timeLeft }}s</span></div>
      </div>
    </div>

    <div class="board d-flex flex-wrap justify-center align-center"
      :class="{ 'board-transitioning': isTransitioning && !correctClicked }" :style="{ width: boardSize + 'px' }">
      <div v-for="(letter, index) in board" :key="index"
        class="letter-cell d-flex justify-center align-center text-h4 font-weight-bold cursor-pointer" :class="{
          'letter-correct': clickedIndices.get(index) === 'correct',
          'letter-incorrect': clickedIndices.get(index) === 'incorrect'
        }" :style="{ width: cellSize + 'px', height: cellSize + 'px' }" @click="checkLetter(index)">
        {{ letter }}
      </div>
    </div>

    <!-- ÚNICA CAPA DE ILUMINACIÓN (SOPORTA MULTIPLES FOCOS VIA BLEND-MODE) -->
    <div class="flashlight-overlay" :class="{ 'flashlight-hidden': isTransitioning }" :style="flashlightStyle" />

    <!-- Cursors remots -->
    <div v-if="props.isMultiplayer && !props.isRace && !props.isDuel" class="remote-cursors-container">
      <div v-for="(cursor, id) in multiplayerStore.remoteCursors" :key="'cursor-' + id">
        <div v-if="id !== astroStore.user" class="remote-cursor"
          :style="{ left: (cursor.x / 10) + '%', top: (cursor.y / 10) + '%' }">
          <div class="cursor-pointer-visual">
            <v-icon color="cyan-accent-3" size="32">mdi-rhombus-outline</v-icon>
            <span class="cursor-label">{{ id }}</span>
          </div>
        </div>
      </div>
    </div>

    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">{{ $t('radarScan.title') }}</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          {{ $t('radarScan.desc') }}
        </p>
        <v-btn v-if="!isMultiplayer" class="font-weight-black text-black block" color="cyan-accent-3" rounded="xl"
          size="x-large" @click="startGame">
          {{ $t('radarScan.startBtn') }}
        </v-btn>
        <div v-else class="text-h6 text-cyan-accent-2 animate-pulse mt-4">
          {{ $t('multiplayerLobby.autoStarting') || 'LA MISIÓN COMENZARÁ TRAS EL BRIEFING...' }}
        </div>
      </v-card>
    </v-overlay>

    <v-overlay v-if="!isMultiplayer" v-model="showGameOverOverlay" class="align-center justify-center" persistent
      z-index="100">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="450">
        <v-icon class="mb-4" color="amber-accent-3" icon="mdi-trophy" size="80" />
        <h2 class="text-h4 font-weight-bold text-white mb-2">{{ $t('radarScan.completed') }}</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">{{ $t('radarScan.totalPoints', { score }) }}</p>
        <v-btn class="font-weight-black text-black px-8" color="cyan-accent-3" rounded="xl" size="x-large"
          @click="returnToMenu">
          {{ $t('radarScan.returnMenu') }}
        </v-btn>
      </v-card>
    </v-overlay>

    <!-- Feedback Visual Overlay -->
    <v-overlay v-model="showFeedback" contained class="align-center justify-center pointer-events-none" persistent
      no-click-animation scrim="transparent" style="z-index: 1000;">
      <div class="feedback-container" :class="feedbackType">
        <v-icon v-if="feedbackType === 'success'" color="success" size="120" class="feedback-icon animate-success">
          mdi-check-circle
        </v-icon>
        <v-icon v-else color="error" size="120" class="feedback-icon animate-error">
          mdi-close-circle
        </v-icon>
      </div>
    </v-overlay>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { radarScanData } from '@/data/radarScanData'
import { useAstroStore } from '@/stores/astroStore'
import { useMultiplayerStore } from '@/stores/multiplayerStore'

const { t, locale } = useI18n()
const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()

const emit = defineEmits(['game-over'])
const props = defineProps({
  isMultiplayer: {
    type: Boolean,
    default: false,
  },
  isRace: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number,
    default: 60,
  },
  isDuel: {
    type: Boolean,
    default: false,
  },
  autoStart: {
    type: Boolean,
    default: false,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
})

// --- VARIABLES D'ESTAT ---
const showStartOverlay = ref(!props.autoStart)
const showGameOverOverlay = ref(false)
const isTransitioning = ref(false)
const correctClicked = ref(false)
const score = ref(0)
const timeLeft = ref(props.duration)
const startTime = ref(0)
const totalDuration = ref(60)
let timerInterval = null

// --- REFORÇ VISUAL I SONOR ---
const showFeedback = ref(false)
const feedbackType = ref('success')
const sounds = {
  success: '/assets/sounds/success.mp3',
  error: '/assets/sounds/error.mp3',
}

function triggerFeedback(type) {
  feedbackType.value = type
  showFeedback.value = true
  const audio = new Audio(sounds[type])
  audio.volume = 0.4
  audio.play().catch(e => console.warn('Audio play blocked:', e))
  setTimeout(() => { showFeedback.value = false }, 800)
}

// --- SISTEMA DE VISIÓ ---
const mouseX = ref(0)
const mouseY = ref(0)
const gameArea = ref(null)

// Throttle per enviar posició del rató al servidor (cada 25ms)
function throttle(func, limit) {
  let lastRan
  let lastFunc
  return function (...args) {
    if (lastRan) {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    } else {
      func(...args)
      lastRan = Date.now()
    }
  }
}

const sendMouseMove = throttle((x, y) => {
  if (props.isMultiplayer && gameArea.value) {
    multiplayerStore.sendGameAction({
      type: 'MOUSE_MOVE',
      x: Math.round((x / gameArea.value.clientWidth) * 1000),
      y: Math.round((y / gameArea.value.clientHeight) * 1000),
    })
  }
}, 25)

// --- LÒGICA DEL TAULER ---
const board = ref([])
const currentLevel = ref(1)
const targetIndices = ref([])
const clickedIndices = ref(new Map())
const completedTargets = ref(new Set())

const isHost = computed(() => (multiplayerStore.room?.host?.username || multiplayerStore.room?.host) === astroStore.user)
const anyRivalAlive = computed(() => {
  if (!props.isMultiplayer) return true
  const rivals = Object.keys(multiplayerStore.playerTimes || {}).filter(u => u !== astroStore.user)
  if (rivals.length === 0) return true 
  return rivals.some(u => (multiplayerStore.playerTimes?.[u] || 0) > 0)
})

// --- CONFIGURACIÓ DE NIVELLS ---
const levels = computed(() => radarScanData[locale.value] || radarScanData['es'])

// --- COMPUTADES ---
const currentConfig = computed(() => {
  return levels.value[Math.min(currentLevel.value - 1, levels.value.length - 1)]
})
const currentTunnelSize = computed(() => currentConfig.value.tunnel)
const cellSize = computed(() => Math.max(30, 600 / currentConfig.value.grid))
const boardSize = computed(() => currentConfig.value.grid * cellSize.value)

const flashlightStyle = computed(() => {
  if (!gameArea.value) return {}
  const tunnelSize = (currentTunnelSize.value || 100) * 1.5
  const lightSpots = [
    `radial-gradient(circle ${tunnelSize}px at ${mouseX.value}px ${mouseY.value}px, rgba(0, 229, 255, 0.8) 0%, rgba(0, 229, 255, 0.2) 50%, rgba(11, 17, 32, 0) 100%)`,
  ]

  // Añadir focos de compañeros en multiplayer (solo si es cooperativo)
  const isCoop = props.isMultiplayer && !props.isRace && !props.isDuel;
  if (isCoop) {
    for (const [id, cursor] of Object.entries(multiplayerStore.remoteCursors)) {
      if (id !== astroStore.user && gameArea.value) {
        const pxX = (cursor.x / 1000) * gameArea.value.clientWidth
        const pxY = (cursor.y / 1000) * gameArea.value.clientHeight
        lightSpots.push(`radial-gradient(circle ${tunnelSize}px at ${pxX}px ${pxY}px, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(11, 17, 32, 0) 100%)`)
      }
    }
  }

  return {
    'background-color': '#05070d',
    'background-image': lightSpots.join(', '),
    'background-blend-mode': 'screen',
    'z-index': 5,
  }
})

// --- FUNCIONS CORE ---
function updateFlashlight(e) {
  if (!gameArea.value) return
  const rect = gameArea.value.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top

  if (props.isMultiplayer && !props.isRace && !props.isDuel) {
    sendMouseMove(mouseX.value, mouseY.value)
  }
}

function generateBoard() {
  const config = currentConfig.value
  const totalCells = config.grid * config.grid
  clickedIndices.value.clear()
  completedTargets.value.clear()
  const isCoop = props.isMultiplayer && !props.isRace && !props.isDuel;
  const isShared = multiplayerStore.room?.gameConfig?.sharedChallenge

  if (isCoop && isShared) {
    if (isHost.value) {
      const newBoard = Array.from({ length: totalCells }, () => config.distractor)
      const t1 = Math.floor(Math.random() * totalCells)
      let t2
      do {
        t2 = Math.floor(Math.random() * totalCells)
      } while (t2 === t1)

      newBoard[t1] = config.target
      newBoard[t2] = config.target
      targetIndices.value = [t1, t2]
      board.value = newBoard

      multiplayerStore.sendGameAction({
        type: 'BOARD_SYNC',
        board: newBoard,
        targetIndices: [t1, t2],
      })
    }
  } else if (props.isDuel && isShared) {
    if (isHost.value) {
      const newBoard = Array.from({ length: totalCells }, () => config.distractor)
      const target = Math.floor(Math.random() * totalCells)
      newBoard[target] = config.target
      targetIndices.value = [target]
      board.value = newBoard
      
      multiplayerStore.sendGameAction({
        type: 'BOARD_SYNC',
        board: newBoard,
        targetIndices: [target],
      })
    }
  } else {
    const newBoard = Array.from({ length: totalCells }, () => config.distractor)
    const target = Math.floor(Math.random() * totalCells)
    targetIndices.value = [target]
    newBoard[target] = config.target
    board.value = newBoard
  }
}

function nextRound() {
  const timeBonus = Math.floor(timeLeft.value / 2)
  score.value += (currentLevel.value * 25) + timeBonus
  if (anyRivalAlive.value) {
    timeLeft.value = Math.min(60, timeLeft.value + 10)
  }
  currentLevel.value++
  completedTargets.value.clear()
  generateBoard()
}

function checkLetter(index) {
  if (showStartOverlay.value || showGameOverOverlay.value || timeLeft.value <= 0 || isTransitioning.value) return
  if (completedTargets.value.has(index)) return

  const isCorrect = targetIndices.value.includes(index)

  if (props.isMultiplayer) {
    multiplayerStore.sendGameAction({
      type: 'RADAR_CLICK',
      index,
      status: isCorrect ? 'correct' : 'incorrect',
      user: astroStore.user,
    })

    if (!isCorrect) {
      timeLeft.value = Math.max(0, timeLeft.value - 5)
      if (props.isDuel || props.isRace || !props.isMultiplayer) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      score.value = Math.max(0, score.value - 5)
      clickedIndices.value.set(index, 'incorrect')
      triggerFeedback('error')
      if (timeLeft.value === 0) endGame()
      setTimeout(() => clickedIndices.value.delete(index), 500)
      return
    }

    clickedIndices.value.set(index, 'correct')
    completedTargets.value.add(index)
    if (anyRivalAlive.value) {
      timeLeft.value = Math.min(60, timeLeft.value + 3)
    }
    triggerFeedback('success')

    if (props.isDuel) {
      const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
      multiplayerStore.sendGameAction({
        type: 'TIME_PENALTY',
        amount: isSaboteurActive ? 6 : 3,
      })
    }

    if (completedTargets.value.size >= targetIndices.value.length) {
      isTransitioning.value = true
      
      if (isHost.value) {
        setTimeout(() => {
          multiplayerStore.sendGameAction({ type: 'RADAR_NEXT_ROUND' })
          nextRound()
          setTimeout(() => {
            isTransitioning.value = false
          }, 200)
        }, 800)
      }

      if (props.isRace) {
        multiplayerStore.rechargeFuel(12) // Recarga 12% por ronda
      }
    }
    return
  }

  if (isCorrect) {
    clickedIndices.value.set(index, 'correct')
    completedTargets.value.add(index)
    timeLeft.value = Math.min(60, timeLeft.value + 3)
    triggerFeedback('success')

    if (completedTargets.value.size >= targetIndices.value.length) {
      isTransitioning.value = true
      setTimeout(() => {
        nextRound()
        setTimeout(() => {
          isTransitioning.value = false
        }, 200)
      }, 800)
    }
  } else {
    clickedIndices.value.set(index, 'incorrect')
    timeLeft.value = Math.max(0, timeLeft.value - 5)
    score.value = Math.max(0, score.value - 5)
    triggerFeedback('error')
    if (timeLeft.value === 0) endGame()
    setTimeout(() => clickedIndices.value.delete(index), 500)
  }
}

function startGame() {
  showStartOverlay.value = false
  showGameOverOverlay.value = false
  score.value = 0
  
  const boost = astroStore.equippedSkinBoost
  if (boost && boost.type === 'time') {
    totalDuration.value = Math.floor(props.duration * boost.multiplier)
    timeLeft.value = totalDuration.value
  } else {
    totalDuration.value = props.duration
    timeLeft.value = props.duration
  }

  startTime.value = Date.now()
  currentLevel.value = 1
  generateBoard()

  if (props.isMultiplayer && isHost.value && !props.isRace && !props.isDuel) {
    multiplayerStore.sendGameAction({
      type: 'START_TIME_SYNC',
      startTime: startTime.value,
      duration: totalDuration.value,
    })
  }

  let lastTick = Date.now()
  timerInterval = setInterval(() => {
    if (!isTransitioning.value && timeLeft.value > 0 && !props.isPaused) {
      if (!props.isMultiplayer || isHost.value || props.isDuel || props.isRace) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000

          if (isHost.value || props.isDuel || props.isRace) {
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }
          
          if (props.isDuel || props.isRace || !props.isMultiplayer) {
            multiplayerStore.timeLeft = timeLeft.value
          }

          if (timeLeft.value <= 0) {
            if (props.isMultiplayer && isHost.value && !props.isRace && !props.isDuel) {
              multiplayerStore.sendGameAction({ type: 'RADAR_TIME_UP' })
            }
            endGame()
          }
        }
      }
    }
  }, 500)
}

function endGame(silent = false) {
  if (timerInterval) clearInterval(timerInterval)
  if (props.isMultiplayer) {
    multiplayerStore.submitRoundResult()
    return
  }
  if (silent || props.isRace) {
    emit('game-over', score.value)
  } else {
    showGameOverOverlay.value = true
  }
}

function returnToMenu() {
  emit('game-over', score.value)
}

onMounted(() => {
  if (props.isMultiplayer || props.isRace || props.autoStart) {
    // Delay para el briefing (Reducido a 3s)
    setTimeout(() => {
      startGame()
    }, 3000)
  }
})

watch(() => multiplayerStore.lastMessage, msg => {
  if (!msg) return

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    showGameOverOverlay.value = true
    return
  }

  if (msg.type === 'GAME_ACTION') {
    if (msg.action?.type === 'TIME_SYNC' && !isHost.value && !props.isDuel && !props.isRace) {
      timeLeft.value = msg.action.timeLeft
      if (timeLeft.value <= 0) endGame()
    }

    if (msg.action?.type === 'START_TIME_SYNC' && !props.isDuel && !props.isRace) {
      startTime.value = msg.action.startTime
      totalDuration.value = msg.action.duration
    }

    if (msg.action?.type === 'SCORE_UPDATE' && msg.from !== astroStore.user) {
      multiplayerStore.roundScores[msg.from] = msg.action.score
      return
    }

    if (msg.action?.type === 'BOARD_SYNC' && !isHost.value && (!props.isRace || props.isDuel)) {
      board.value = msg.action.board
      targetIndices.value = msg.action.targetIndices
      isTransitioning.value = false
      clickedIndices.value.clear()
      completedTargets.value.clear()
    }

    if (msg.action?.type === 'RADAR_NEXT_ROUND' && !props.isDuel && !props.isRace) {
      nextRound()
      setTimeout(() => {
        isTransitioning.value = false
      }, 200)
    }

    if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2))
      if (props.isDuel || props.isRace) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      if (timeLeft.value <= 0) endGame()
    }

    if (msg.action?.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 5))
      if (props.isDuel || props.isRace) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      if (timeLeft.value <= 0) endGame()
    }

    if (msg.action?.type === 'RADAR_TIME_UP' && !props.isDuel && !props.isRace) {
      endGame()
    }

    if (msg.action?.type === 'RADAR_CLICK' && !props.isDuel && !props.isRace) {
      const { index, status } = msg.action
      if (status === 'incorrect') {
        clickedIndices.value.set(index, status)
        setTimeout(() => clickedIndices.value.delete(index), 500)
      } else if (status === 'correct') {
        clickedIndices.value.set(index, 'correct')
        completedTargets.value.add(index)
        if (completedTargets.value.size >= targetIndices.value.length) {
          isTransitioning.value = true
          if (isHost.value) {
            setTimeout(() => {
              multiplayerStore.sendGameAction({ type: 'RADAR_NEXT_ROUND' })
              nextRound()
              setTimeout(() => {
                isTransitioning.value = false
              }, 200)
            }, 800)
          }
        }
      }
    }
  }
}, { immediate: true })

watch(score, newScore => {
  if (props.isMultiplayer) {
    multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
  }
  if (props.isDuel || props.isRace) {
    multiplayerStore.roundScores[astroStore.user] = newScore
  }
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100vh;
  background-color: #05070d;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Orbitron', sans-serif;
  user-select: none;
  position: relative;
}

.hud-pill {
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  padding: 12px 32px;
  border-radius: 100px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.board {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  gap: 12px;
  padding: 40px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, transparent 70%);
  border: 2px solid rgba(0, 229, 255, 0.1);
  border-radius: 50%;
  transition: all 0.5s ease;
}

.board::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: 
    repeating-radial-gradient(circle, transparent 0, transparent 40px, rgba(0, 229, 255, 0.05) 41px, rgba(0, 229, 255, 0.05) 42px),
    repeating-conic-gradient(from 0deg, transparent 0deg, transparent 44deg, rgba(0, 229, 255, 0.05) 45deg, rgba(0, 229, 255, 0.05) 46deg);
  pointer-events: none;
  border-radius: 50%;
}

.board-transitioning {
  transform: translate(-50%, -50%) scale(1.1) rotate(10deg);
  opacity: 0;
}

.letter-cell {
  background: rgba(30, 41, 59, 0.2);
  color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 229, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s;
  user-select: none;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
}

.letter-cell:hover {
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.4);
}

.letter-correct {
  background: rgba(0, 230, 118, 0.2) !important;
  border-color: #00e676 !important;
  color: #00e676 !important;
  transform: scale(1.2) rotate(360deg);
  box-shadow: 0 0 30px rgba(0, 230, 118, 0.5);
  z-index: 2;
}

.letter-incorrect {
  background: rgba(255, 82, 82, 0.2) !important;
  border-color: #ff5252 !important;
  color: #ff5252 !important;
  animation: shake 0.4s;
}

.flashlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.5s ease;
}

/* Efecto Escáner */
.flashlight-overlay::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 50%; height: 2px;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.6), transparent);
  transform-origin: left center;
  animation: radar-sweep 4s linear infinite;
}

@keyframes radar-sweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.flashlight-hidden {
  opacity: 0 !important;
}

.bg-slate-900 {
  background-color: #0f172a;
}

.border-cyan {
  border: 1px solid #00e5ff;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.feedback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.feedback-icon {
  filter: drop-shadow(0 0 20px currentColor);
}

.animate-success {
  animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.animate-error {
  animation: shake 0.4s ease-in-out forwards;
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 6;
  transition: all 0.1s linear;
  transform: translate(-50%, -50%);
}

.cursor-pointer-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cursor-label {
  font-size: 10px;
  background: rgba(0, 229, 255, 0.9);
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 900;
  margin-top: 4px;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  white-space: nowrap;
}

.pointer-events-none {
  pointer-events: none !important;
}
</style>
