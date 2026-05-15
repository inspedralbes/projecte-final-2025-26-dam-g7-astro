<template>
  <v-container ref="gameArea" class="fill-height d-flex flex-column align-center justify-center word-construction-container" :class="{ 'game-paused': props.isPaused }" style="position: relative;">

    <!-- Cursors remots -->
    <div v-if="props.isMultiplayer && !props.isRace && !props.isDuel" class="remote-cursors-container">
      <div
        v-for="(pos, username) in multiplayerStore.remoteCursors"
        :key="username"
        class="remote-cursor"
        :style="{ left: pos.x + '%', top: pos.y + '%' }"
      >
        <div class="cursor-pointer" />
        <div class="cursor-label">{{ username }}</div>
      </div>
    </div>

    <!-- Capçalera del joc -->
    <v-card class="mb-6 pa-4 bg-deep-purple-darken-4 elevation-10" max-width="600" rounded="xl" width="100%">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">{{ $t('wordConstruction.level', { level: level }) }}</h2>
          <div class="text-caption text-grey-lighten-2">
            <span>{{ $t('wordConstruction.score', { score: score }) }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">{{ $t('wordConstruction.time', { time: timeLeft }) }}</span>
          </div>
        </div>
        <!-- Barra de progrés "Construcció" -->
        <div class="d-flex flex-column align-end">
          <span class="text-overline mb-1">{{ $t('wordConstruction.baseStatus') }}</span>
          <v-progress-linear
            color="success"
            height="10"
            :model-value="(currentStep / totalSteps) * 100"
            rounded
            striped
            style="width: 150px"
          />
        </div>
      </div>
    </v-card>

    <!-- Àrea de Joc -->
    <v-card
      v-if="!gameFinished"
      class="pa-6 text-center bg-grey-darken-4"
      max-width="600"
      rounded="xl"
      width="100%"
    >

      <p class="text-h6 mb-2 text-grey-lighten-1">{{ $t('wordConstruction.dragInstruction') }}</p>
      <p class="text-body-2 text-cyan-accent-2 mb-6" v-html="$t('wordConstruction.hint', { hint: currentWordObj.hint })" />

      <!-- Lletres arrossegables -->
      <draggable
        v-model="scrambledLetters"
        :animation="180"
        chosen-class="chosen-chip"
        class="d-flex justify-center flex-wrap gap-2 mb-6"
        :disabled="isRoundLocked || props.isPaused"
        ghost-class="ghost-chip"
        item-key="id"
        tag="div"
      >
        <template #item="{ element }">
          <v-chip
            class="ma-1 text-h4 font-weight-black pa-6"
            color="cyan-accent-3"
            label
            variant="outlined"
          >
            {{ element.letter }}
          </v-chip>
        </template>
      </draggable>

      <p class="text-subtitle-1 text-grey-lighten-1 mb-6">
        {{ $t('wordConstruction.currentOrder') }}<strong class="text-cyan-accent-2">{{ orderedGuess }}</strong>
      </p>

      <v-btn
        block
        class="font-weight-bold text-black mb-3"
        color="cyan-accent-3"
        :disabled="isRoundLocked"
        rounded="lg"
        size="x-large"
        @click="checkAnswer"
      >
        {{ $t('wordConstruction.buildBlock') }}
      </v-btn>

      <v-btn
        block
        color="grey-lighten-1"
        :disabled="isRoundLocked"
        rounded="lg"
        variant="outlined"
        @click="shuffleCurrentLetters"
      >
        {{ $t('wordConstruction.shuffleLetters') }}
      </v-btn>

      <v-alert
        v-if="message"
        class="mt-6 rounded-lg animate-bounce"
        :type="messageType"
        variant="tonal"
      >
        {{ message }}
      </v-alert>
    </v-card>


  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import draggable from 'vuedraggable'
  import { useI18n } from 'vue-i18n'
  import { wordConstructionData } from '@/data/wordConstructionData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t, locale } = useI18n()
  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()

  const props = defineProps({
    isMultiplayer: { type: Boolean, default: false },
    isRace: { type: Boolean, default: false },
    isDuel: { type: Boolean, default: false },
    duration: { type: Number, default: 60 },
    isPaused: { type: Boolean, default: false },
  })

  const emit = defineEmits(['game-over'])

  const isHost = computed(() => (multiplayerStore.room?.host?.username || multiplayerStore.room?.host) === astroStore.user)
  const anyRivalAlive = computed(() => {
    if (!props.isMultiplayer) return true
    const rivals = Object.keys(multiplayerStore.playerTimes).filter(u => u !== astroStore.user)
    if (rivals.length === 0) return true 
    return rivals.some(u => multiplayerStore.playerTimes[u] > 0)
  })
  const isCompetitiveMode = computed(() => props.isDuel || props.isRace || multiplayerStore.room?.gameConfig?.modality === '2vs2')

  // --- LCG RANDOM PARA SINCRONIZACIÓN ---
  let currentSeed = 0
  function lcgRandom () {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
    return currentSeed / 4294967296
  }

  // --- ESTAT DEL JOC ---
  const level = ref(1)
  const score = ref(0)
  const timeLeft = ref(props.duration)
  const currentWordObj = ref({ word: '', hint: '' })
  const scrambledLetters = ref([])
  const gameFinished = ref(false)
  const isRoundLocked = ref(false)
  const currentStep = ref(0)
  const totalSteps = ref(5)
  const message = ref('')
  const messageType = ref('success')
  let timerInterval = null
  let isUpdatingFromSync = false

  function normalizeWordObj (entry = {}) {
    return {
      ...entry,
      word: String(entry.word || '').toUpperCase(),
    }
  }

  function normalizeLetters (letters = []) {
    return (Array.isArray(letters) ? letters : []).map(tile => ({
      ...tile,
      letter: String(tile.letter || '').toUpperCase(),
    }))
  }

  const wordPool = computed(() => {
    if (!props.isMultiplayer && astroStore.plan === 'GRUPAL' && astroStore.role === 'STUDENT' && multiplayerStore.room?.gameConfig?.trainingSet) {
       // Si hay un set de entrenamiento específico
    }
    const fallback = wordConstructionData[locale.value] || wordConstructionData['es']
    return fallback.map(normalizeWordObj)
  })

  const orderedGuess = computed(() => scrambledLetters.value.map(l => l.letter).join(''))

  function loadNextWord () {
    const isShared = multiplayerStore.room?.gameConfig?.sharedChallenge
    const rnd = (props.isMultiplayer && (!props.isDuel || isShared)) ? lcgRandom() : Math.random()
    const randomIndex = Math.floor(rnd * wordPool.value.length)
    const wordObj = wordPool.value[randomIndex]

    currentWordObj.value = wordObj
    const letters = wordObj.word.split('').map((l, idx) => ({ id: idx, letter: l }))
    
    // Shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(lcgRandom() * (i + 1))
      const temp = letters[i]
      letters[i] = letters[j]
      letters[j] = temp
    }
    scrambledLetters.value = letters
    isRoundLocked.value = false

    if (props.isMultiplayer && isHost.value && !props.isDuel && !props.isRace) {
      multiplayerStore.sendGameAction({
        type: 'BOARD_SYNC',
        wordObj: wordObj,
        letters: letters,
      })
    }
  }

  function shuffleCurrentLetters () {
    const letters = [...scrambledLetters.value]
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = letters[i]
      letters[i] = letters[j]
      letters[j] = temp
    }
    scrambledLetters.value = letters
  }

  function checkAnswer (fromSync = false) {
    if (isRoundLocked.value) return

    if (orderedGuess.value.toUpperCase() === currentWordObj.value.word.toUpperCase()) {
      currentStep.value++
      const timeBonus = Math.floor(timeLeft.value / 4)
      score.value += (level.value * 20) + timeBonus
      message.value = t('wordConstruction.correctBlock')
      messageType.value = 'success'
      isRoundLocked.value = true

      if (props.isRace) {
        multiplayerStore.rechargeFuel(15) // +15% per bloc construït
      }

      if (props.isMultiplayer && !fromSync) {
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: isSaboteurActive ? 10 : 5 })

        if (!props.isDuel && !props.isRace) {
          multiplayerStore.sendGameAction({ type: 'WORD_SUCCESS', currentStep: currentStep.value, score: score.value })
        } else if (props.isDuel) {
          multiplayerStore.sendGameAction({ type: 'TIME_PENALTY', amount: isSaboteurActive ? 12 : 6 })
        }
      }

      setTimeout(() => {
        message.value = ''
        if (currentStep.value >= totalSteps.value) {
          level.value++
          currentStep.value = 0
          if (anyRivalAlive.value) {
            timeLeft.value = Math.min(90, timeLeft.value + 15)
          }
        }
        loadNextWord()
      }, 1500)
    } else if (!fromSync) {
      message.value = t('wordConstruction.wrongBlock')
      messageType.value = 'error'
      timeLeft.value = Math.max(0, timeLeft.value - 3)
      if (props.isDuel || props.isRace || !props.isMultiplayer) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      setTimeout(() => { message.value = '' }, 1500)
    }

    if (props.isMultiplayer && !fromSync && !props.isDuel && !props.isRace) {
      multiplayerStore.sendGameAction({ type: 'ANSWER_CHECKED' })
    }
  }

  function finishGame () {
    if (gameFinished.value) return
    gameFinished.value = true
    if (timerInterval) clearInterval(timerInterval)

    if (props.isMultiplayer) {
      multiplayerStore.submitRoundResult()
    }
    
    // En individual o carrera salimos directamente (el componente padre muestra resultados)
    if (!props.isMultiplayer || props.isRace) {
      emitExit()
    }
  }

  function emitExit () {
    emit('game-over', score.value)
  }

  function startTimer () {
    if (timerInterval) clearInterval(timerInterval)
    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (gameFinished.value || props.isPaused) return
      if (!props.isMultiplayer || isHost.value || props.isDuel || props.isRace) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000
          
          if (props.isMultiplayer) {
            if (isHost.value || props.isDuel || props.isRace) {
              multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
            }
            if (props.isDuel || props.isRace || !props.isMultiplayer) {
              multiplayerStore.timeLeft = timeLeft.value
            }
          } else {
            multiplayerStore.timeLeft = timeLeft.value
          }

          if (timeLeft.value <= 0) {
            if (props.isRace && !props.isDuel) {
              finishGame()
            } else {
              if (props.isMultiplayer && isHost.value && !props.isDuel && !props.isRace) {
                multiplayerStore.sendGameAction({ type: 'WC_TIME_UP' })
              }
              finishGame()
            }
          }
        }
      }
    }, 500)
  }

  // ---- MULTIJUGADOR: SEGUIMIENTO DE RATÓN ----
  function handleMouseMove (e) {
    if (!props.isMultiplayer || props.isRace || props.isDuel || gameFinished.value) return
    const container = document.querySelector('.word-construction-container')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    multiplayerStore.sendGameAction({ type: 'MOUSE_MOVE', x, y })
  }

  onMounted(async () => {
    window.addEventListener('mousemove', handleMouseMove)

    if (props.isMultiplayer) {
      if (multiplayerStore.room?.gameConfig?.seed) {
        currentSeed = typeof multiplayerStore.room.gameConfig.seed === 'string' ? multiplayerStore.room.gameConfig.seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : multiplayerStore.room.gameConfig.seed
      }
    }
    loadNextWord()
    if (props.isMultiplayer || props.isRace) {
      setTimeout(() => {
        if (!gameFinished.value) startTimer()
      }, 3000)
    } else {
      startTimer()
    }
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER' && !gameFinished.value) {
      finishGame()
      return
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2))
      if (timeLeft.value <= 0 && !gameFinished.value) {
        finishGame()
      }
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'BOARD_SYNC') {
      currentWordObj.value = normalizeWordObj(msg.action.wordObj)
      scrambledLetters.value = normalizeLetters(msg.action.letters)
      message.value = ''
      isRoundLocked.value = false
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ORDER_SYNC' && msg.from !== astroStore.user) {
      isUpdatingFromSync = true
      scrambledLetters.value = normalizeLetters(msg.action.letters)
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ANSWER_CHECKED') {
      checkAnswer(true)
    }

    if (msg.action?.type === 'WC_TIME_UP') {
      finishGame()
      return
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'SCORE_UPDATE' && msg.from !== astroStore.user) {
        multiplayerStore.roundScores[msg.from] = msg.action.score
        return
      }

      if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME' && msg.from !== astroStore.user) {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2))
        if (props.isDuel || props.isRace || !props.isMultiplayer) {
          multiplayerStore.timeLeft = timeLeft.value
        }
        if (timeLeft.value <= 0 && !gameFinished.value) {
          finishGame()
        }
      }

      if (msg.action?.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 5))
        if (props.isDuel || props.isRace || !props.isMultiplayer) {
          multiplayerStore.timeLeft = timeLeft.value
        }
        if (timeLeft.value <= 0 && !gameFinished.value) {
          finishGame()
        }
      }

      if (msg.action?.type === 'BOARD_SYNC' && !props.isDuel && !props.isRace) {
        currentWordObj.value = msg.action.wordObj
        scrambledLetters.value = msg.action.letters
        message.value = ''
        isRoundLocked.value = false
      }

      if (msg.action?.type === 'ORDER_SYNC' && msg.from !== astroStore.user && !props.isDuel && !props.isRace) {
        isUpdatingFromSync = true
        scrambledLetters.value = msg.action.letters
      }

      if (msg.action?.type === 'ANSWER_CHECKED' && !props.isDuel && !props.isRace) {
        checkAnswer(true)
      }

      if (msg.action?.type === 'WC_TIME_UP' && !props.isDuel && !props.isRace) {
        finishGame()
      }

      if (msg.action?.type === 'TIME_SYNC' && !isHost.value && !props.isDuel && !props.isRace) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) finishGame()
      }
      if (msg.action?.type === 'WORD_SUCCESS' && !props.isDuel && !props.isRace) {
        currentStep.value = msg.action.currentStep
        score.value = msg.action.score
        message.value = t('wordConstruction.partnerBuilt')
        messageType.value = 'success'
        setTimeout(() => {
          message.value = ''
        }, 2000)
      }
    }
  }, { immediate: true })

  watch(scrambledLetters, newVal => {
    if (isUpdatingFromSync) {
      isUpdatingFromSync = false
      return
    }
    if (props.isMultiplayer && !props.isDuel && !props.isRace && !isRoundLocked.value) {
      multiplayerStore.sendGameAction({
        type: 'ORDER_SYNC',
        letters: newVal,
      })
    }
  })

  watch(score, newScore => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
    }
    if (props.isDuel || props.isRace) {
      multiplayerStore.roundScores[astroStore.user] = newScore
    }
  })
</script>

<style scoped>
.ghost-chip {
  opacity: 0.45;
}

.chosen-chip {
  transform: scale(1.06);
  transition: transform 0.2s ease;
}

.border-cyan {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
}

.remote-cursors-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.remote-cursor {
  position: absolute;
  transition: all 0.1s linear;
  transform: translate(-50%, -50%);
}

.cursor-pointer {
  width: 12px;
  height: 12px;
  background: #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 10px #00e5ff;
}

.cursor-label {
  font-size: 10px;
  background: rgba(0, 229, 255, 0.8);
  color: #000;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: bold;
  margin-top: 4px;
  white-space: nowrap;
}

.word-construction-container {
  background: radial-gradient(circle at center, #0d0221 0%, #020617 100%);
}
.game-paused {
  pointer-events: none !important;
  filter: blur(4px) grayscale(0.5);
  transition: all 0.3s ease;
}
</style>
