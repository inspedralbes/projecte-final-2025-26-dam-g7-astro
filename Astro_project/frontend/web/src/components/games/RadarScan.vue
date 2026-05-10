<template>
  <div ref="gameArea" class="game-container" @mousemove="updateFlashlight">
    <div class="hud d-flex justify-center align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">{{ $t('radarScan.points', { score }) }}</div>
        <div class="text-h5 font-weight-bold text-cyan-accent-3">{{ $t('radarScan.time') }} <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
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

    <!-- Cursors remots -->
    <div v-if="props.isMultiplayer" class="remote-cursors-container">
      <div
        v-for="(cursor, id) in multiplayerStore.remoteCursors"
        :key="'cursor-'+id"
      >
        <div v-if="id !== astroStore.user" class="remote-cursor" :style="{ left: (cursor.x / 10) + '%', top: (cursor.y / 10) + '%' }">
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
        <v-btn
          v-if="!isMultiplayer"
          class="font-weight-black text-black block"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="startGame"
        >
          {{ $t('radarScan.startBtn') }}
        </v-btn>
        <div v-else class="text-h6 text-cyan-accent-2 animate-pulse mt-4">
          {{ $t('multiplayerLobby.autoStarting') || 'LA MISIÓN COMENZARÁ TRAS EL BRIEFING...' }}
        </div>
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
        <h2 class="text-h4 font-weight-bold text-white mb-2">{{ $t('radarScan.completed') }}</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">{{ $t('radarScan.totalPoints', { score }) }}</p>
        <v-btn
          class="font-weight-black text-black px-8"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="returnToMenu"
        >
          {{ $t('radarScan.returnMenu') }}
        </v-btn>
      </v-card>
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
  })

  // --- VARIABLES D'ESTAT ---
  const showStartOverlay = ref(true)
  const showGameOverOverlay = ref(false)
  const isTransitioning = ref(false)
  const correctClicked = ref(false)
  const score = ref(0)
  const timeLeft = ref(60)
  const startTime = ref(0)
  const totalDuration = ref(60)
  let timerInterval = null

  // --- SISTEMA DE VISIÓ ---
  const mouseX = ref(0)
  const mouseY = ref(0)
  const gameArea = ref(null)

  // Throttle per enviar posició del rató al servidor (cada 25ms)
  function throttle (func, limit) {
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

  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)

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
    const tunnelSize = currentTunnelSize.value
    const lightSpots = [
      `radial-gradient(circle ${tunnelSize}px at ${mouseX.value}px ${mouseY.value}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 40%, rgba(11,17,32,0) 100%)`,
    ]

    // Añadir focos de compañeros en multiplayer
    if (props.isMultiplayer) {
      for (const [id, cursor] of Object.entries(multiplayerStore.remoteCursors)) {
        if (id !== astroStore.user && gameArea.value) {
          const pxX = (cursor.x / 1000) * gameArea.value.clientWidth
          const pxY = (cursor.y / 1000) * gameArea.value.clientHeight
          lightSpots.push(`radial-gradient(circle ${tunnelSize}px at ${pxX}px ${pxY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 40%, rgba(11,17,32,0) 100%)`)
        }
      }
    }

    return {
      'background-color': '#0b1120',
      'background-image': lightSpots.join(', '),
      'background-blend-mode': 'lighten',
      'mix-blend-mode': 'multiply',
      'z-index': 5,
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
    completedTargets.value.clear()

    if (props.isMultiplayer) {
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
    } else {
      const newBoard = Array.from({ length: totalCells }, () => config.distractor)
      const target = Math.floor(Math.random() * totalCells)
      targetIndices.value = [target]
      newBoard[target] = config.target
      board.value = newBoard
    }
  }

  function nextRound () {
    score.value += (currentLevel.value * 10)
    timeLeft.value = Math.min(60, timeLeft.value + 10)
    currentLevel.value++
    completedTargets.value.clear()
    generateBoard()
  }

  function checkLetter (index) {
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
        score.value = Math.max(0, score.value - 5)
        clickedIndices.value.set(index, 'incorrect')
        setTimeout(() => clickedIndices.value.delete(index), 500)
        return
      }

      clickedIndices.value.set(index, 'correct')
      completedTargets.value.add(index)
      timeLeft.value = Math.min(60, timeLeft.value + 3)

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
      return
    }

    if (isCorrect) {
      clickedIndices.value.set(index, 'correct')
      completedTargets.value.add(index)
      timeLeft.value = Math.min(60, timeLeft.value + 3)

      if (completedTargets.value.size >= targetIndices.value.length) {
        isTransitioning.value = true
        setTimeout(() => {
          nextRound()
          setTimeout(() => {
            isTransitioning.value = false
          }, 200)
        }, 800)
      }

      if (props.isRace) {
        multiplayerStore.rechargeFuel(12) // Recarga 12% por ronda
      }
    } else {
      clickedIndices.value.set(index, 'incorrect')
      timeLeft.value = Math.max(0, timeLeft.value - 5)
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
    totalDuration.value = 60
    timeLeft.value = 60
    startTime.value = Date.now()
    currentLevel.value = 1
    generateBoard()

    if (props.isMultiplayer && isHost.value) {
      multiplayerStore.sendGameAction({
        type: 'START_TIME_SYNC',
        startTime: startTime.value,
        duration: totalDuration.value,
      })
    }

    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (!isTransitioning.value && timeLeft.value > 0) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000

          if (props.isMultiplayer && isHost.value) {
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }

          if (timeLeft.value <= 0) {
            if (props.isMultiplayer && isHost.value) {
              multiplayerStore.sendGameAction({ type: 'RADAR_TIME_UP' })
            }
            endGame()
          }
        }
      }
    }, 500)
  }

  function endGame (silent = false) {
    clearInterval(timerInterval)
    if (props.isMultiplayer) {
      multiplayerStore.submitRoundResult()
      return
    }
    if (silent) emit('game-over', score.value)
    else showGameOverOverlay.value = true
  }

  function returnToMenu () {
    emit('game-over', score.value)
  }

  onMounted(() => {
    if (props.isMultiplayer) {
      // Delay para el briefing (Reducido a 3s)
      setTimeout(() => {
        startGame()
      }, 3000)
    }
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      emit('game-over', score.value)
      return
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) endGame()
      }

      if (msg.action?.type === 'START_TIME_SYNC') {
        startTime.value = msg.action.startTime
        totalDuration.value = msg.action.duration
      }

      if (msg.action?.type === 'BOARD_SYNC' && !isHost.value) {
        board.value = msg.action.board
        targetIndices.value = msg.action.targetIndices
        isTransitioning.value = false
        clickedIndices.value.clear()
        completedTargets.value.clear()
      }

      if (msg.action?.type === 'RADAR_NEXT_ROUND' && !isHost.value) {
        nextRound()
        setTimeout(() => {
          isTransitioning.value = false
        }, 200)
      }

      if (msg.action?.type === 'RADAR_TIME_UP') {
        endGame()
      }

      if (msg.action?.type === 'RADAR_CLICK') {
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
  })

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

.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }

.hud-pill {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 999px;
  padding: 10px 22px;
  backdrop-filter: blur(4px);
}

.remote-cursors-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: left, top;
}

.cursor-pointer-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.cursor-label {
  font-size: 0.75rem;
  background: #00e5ff;
  color: black;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}
</style>
