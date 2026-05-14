<template>
  <v-container ref="gameArea" class="fill-height d-flex flex-column align-center justify-center word-construction-container" :class="{ 'game-paused': props.isPaused }" style="position: relative;">

    <!-- Cursors remots -->
    <div v-if="props.isMultiplayer" class="remote-cursors-container">
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
        {{ $t('wordConstruction.shuffleAgain') }}
      </v-btn>

      <!-- Feedback -->
      <v-alert v-if="message" class="mt-4" :type="messageType" variant="tonal">
        {{ message }}
      </v-alert>

      <!-- Feedback Visual Overlay -->
      <v-overlay
        v-model="showFeedback"
        contained
        class="align-center justify-center pointer-events-none"
        persistent
        no-click-animation
        scrim="transparent"
      >
        <div class="feedback-container" :class="feedbackType">
          <v-icon
            v-if="feedbackType === 'success'"
            color="success"
            size="120"
            class="feedback-icon animate-success"
          >
            mdi-check-circle
          </v-icon>
          <v-icon
            v-else
            color="error"
            size="120"
            class="feedback-icon animate-error"
          >
            mdi-close-circle
          </v-icon>
        </div>
      </v-overlay>
    </v-card>

    <!-- Pantalla de Final de Joc -->
    <v-card
      v-else-if="gameFinished"
      class="pa-8 text-center bg-grey-darken-4 border-cyan"
      max-width="500"
      rounded="xl"
      width="100%"
    >
      <v-icon class="mb-4" color="yellow-accent-4" icon="mdi-trophy" size="80" />
      <h2 class="text-h4 text-white mb-2">{{ $t('wordConstruction.completedTitle') || 'MISSIÓ COMPLETADA' }}</h2>
      <p class="text-h5 text-cyan-accent-2 mb-2">{{ $t('wordConstruction.totalPoints', { score: score }) }}</p>
      
      <template v-if="!props.isMultiplayer">
        <p class="text-subtitle-1 text-grey-lighten-1 mb-1">{{ $t('wordConstruction.timeRemaining', { time: timeLeft }) }}</p>
        <p class="text-h6 text-cyan-accent-2 mb-6">{{ $t('wordConstruction.reward', { reward: finalReward }) }}</p>
        <v-btn
          color="cyan-accent-3"
          rounded="pill"
          size="large"
          class="text-black font-weight-bold"
          variant="flat"
          @click="emitExit"
        >
          {{ $t('wordConstruction.getReward') }}
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          class="text-black font-weight-bold"
          color="cyan-accent-3"
          rounded="pill"
          size="large"
          variant="flat"
          @click="emitExit"
        >
          {{ $t('wordConstruction.getReward') }}
        </v-btn>
      </template>
    </v-card>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import draggable from 'vuedraggable'
  import { wordConstructionData } from '@/data/wordConstructionData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useGroupStore } from '@/stores/groupStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()
  const groupStore = useGroupStore()
  const { locale, t } = useI18n()

  const gameArea = ref(null)



  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
    isRace: {
      type: Boolean,
      default: false,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['game-over'])

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

  const wordsList = computed(() => {
    if (!props.isMultiplayer && groupStore.trainingActiveSupplySet?.gameId === 'WordConstruction' && groupStore.trainingActiveSupplySet?.content?.length > 0) {
      return groupStore.trainingActiveSupplySet.content.map(normalizeWordObj)
    }
    if (astroStore.plan === 'GRUPAL' && astroStore.role === 'STUDENT' && groupStore.activeSupplySet?.content?.length > 0) {
      return groupStore.activeSupplySet.content.map(normalizeWordObj)
    }
    const fallback = wordConstructionData[locale.value] || wordConstructionData['es']
    return fallback.map(normalizeWordObj)
  })

  const level = ref(1)
  const score = ref(0)
  const currentWordObj = ref({ word: '', hint: '' })
  const scrambledLetters = ref([])
  const message = ref('')
  const messageType = ref('info')
  const gameFinished = ref(false)
  const letterId = ref(0)
  const isRoundLocked = ref(false)
  let isUpdatingFromSync = false
  const totalTime = 90
  const timeLeft = ref(totalTime)
  const isPlaying = ref(false)
  let timerInterval = null

  const currentStep = ref(0)
  const totalSteps = ref(5)
  const finalReward = computed(() => score.value + timeLeft.value)

  // --- REFORÇ VISUAL I SONOR ---
  const showFeedback = ref(false)
  const feedbackType = ref('success')

  const sounds = {
    success: '/assets/sounds/success.mp3',
    error: '/assets/sounds/error.mp3',
  }

  function triggerFeedback (type) {
    feedbackType.value = type
    showFeedback.value = true

    const audio = new Audio(sounds[type])
    audio.volume = 0.4
    audio.play().catch(e => console.warn('Audio play blocked:', e))

    setTimeout(() => {
      showFeedback.value = false
    }, 800)
  }

  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)

  let currentSeed = 12_345
  function lcgRandom () {
    currentSeed = (currentSeed * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return currentSeed / 4_294_967_296
  }

  const orderedGuess = computed(() => scrambledLetters.value.map(tile => tile.letter).join(''))

  function shuffleArray (arr) {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(lcgRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  function toLetterTiles (word) {
    return String(word || '').toUpperCase().split('').map(letter => ({
      id: letterId.value++,
      letter,
    }))
  }

  function shuffleCurrentLetters () {
    if (!currentWordObj.value.word) return
    let shuffled = shuffleArray(toLetterTiles(currentWordObj.value.word))

    while (
      shuffled.map(tile => tile.letter).join('') === currentWordObj.value.word
      && currentWordObj.value.word.length > 1
    ) {
      shuffled = shuffleArray(toLetterTiles(currentWordObj.value.word))
    }

    scrambledLetters.value = shuffled
  }

  function loadNextWord () {
    if (currentStep.value >= totalSteps.value) {
      if (!props.isMultiplayer) {
        finishGame()
        return
      }
      currentStep.value = 0
    }

    const currentWords = wordsList.value
    if (!currentWords || currentWords.length === 0) return

    if (!props.isMultiplayer || isHost.value) {
      let randomIndex
      randomIndex = props.isMultiplayer ? Math.floor(lcgRandom() * currentWords.length) : Math.floor(Math.random() * currentWords.length)

      currentWordObj.value = currentWords[randomIndex]
      shuffleCurrentLetters()

      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'BOARD_SYNC',
          wordObj: currentWordObj.value,
          letters: scrambledLetters.value,
        })
      }
    }
    message.value = ''
  }

  function checkAnswer (fromRemote = false) {
    if (scrambledLetters.value.length === 0 || isRoundLocked.value) return

    const guess = orderedGuess.value.toUpperCase().trim()
    const correct = currentWordObj.value.word.toUpperCase()

    if (guess === correct) {
      if (props.isMultiplayer && !fromRemote) {
        multiplayerStore.sendGameAction({ type: 'ANSWER_CHECKED', guess })
      }

      isRoundLocked.value = true
      let pointsGained = 100 + (level.value * 10)
      timeLeft.value = Math.min(90, timeLeft.value + 5)

      message.value = t('wordConstruction.msgCorrect')
      score.value += pointsGained
      currentStep.value++
      messageType.value = 'success'
      triggerFeedback('success')

      if (props.isRace) {
        multiplayerStore.rechargeFuel(10) // Recarga 10% por cada bloque
      }

      if (props.isMultiplayer) {
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({
          type: 'WORD_SUCCESS',
          currentStep: currentStep.value,
          score: score.value,
        })

        multiplayerStore.sendGameAction({
          type: 'SABOTAGE',
          subtype: 'REDUCE_TIME',
          amount: isSaboteurActive ? 4 : 2,
        })

        if (isHost.value) {
          multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
        }
      }

      setTimeout(() => {
        loadNextWord()
        isRoundLocked.value = false
      }, 1000)
    } else {
      score.value = Math.max(0, score.value - 20)
      message.value = t('wordConstruction.msgIncorrect')
      messageType.value = 'error'
      triggerFeedback('error')
    }
  }

  async function finishGame (silent = false) {
    if (gameFinished.value) return

    gameFinished.value = true
    isPlaying.value = false
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    if (props.isMultiplayer && !silent) {
      multiplayerStore.submitRoundResult()
      return
    }
  }

  function emitExit () {
    emit('game-over', finalReward.value)
  }

  function startTimer () {
    isPlaying.value = true
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    let lastTick = Date.now()

    timerInterval = setInterval(() => {
      if (gameFinished.value || props.isPaused) return

      if (!props.isMultiplayer || isHost.value) {
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
              multiplayerStore.sendGameAction({ type: 'WC_TIME_UP' })
            }
            finishGame()
          }
        }
      }
    }, 500)
  }

  // ---- MULTIJUGADOR: SEGUIMIENTO DE RATÓN ----
  function handleMouseMove (e) {
    if (!props.isMultiplayer || gameFinished.value) return
    const container = document.querySelector('.word-construction-container')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    multiplayerStore.updateCursor(x, y)
  }

  onMounted(async () => {
    window.addEventListener('mousemove', handleMouseMove)
    if (astroStore.plan === 'GRUPAL' && astroStore.role === 'STUDENT') {
      await groupStore.fetchActiveSupplySetForStudent(astroStore.user, 'WordConstruction')
    }

    if (props.isMultiplayer) {
      if (multiplayerStore.room?.gameConfig?.seed) {
        currentSeed = Math.floor(multiplayerStore.room.gameConfig.seed * 10_000)
      }
      loadNextWord()
      // El temporizador sí espera al briefing (10s)
      setTimeout(() => {
        startTimer()
      }, 10000)
    } else {
      loadNextWord()
      startTimer()
    }
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER' && !gameFinished.value && isPlaying.value) {
      gameFinished.value = true
      if (timerInterval) clearInterval(timerInterval)
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
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) finishGame()
      }
      if (msg.action?.type === 'WORD_SUCCESS') {
        currentStep.value = msg.action.currentStep
        score.value = msg.action.score
        message.value = t('wordConstruction.partnerBuilt')
        messageType.value = 'success'
        setTimeout(() => {
          message.value = ''
        }, 2000)
      }
      if (msg.action?.type === 'SCORE_UPDATE' && !isHost.value) {
        score.value = msg.action.score
        if (msg.action.currentStep !== undefined) {
          currentStep.value = msg.action.currentStep
        }
      }
    }
  }, { immediate: true })

  watch(scrambledLetters, newVal => {
    if (isUpdatingFromSync) {
      isUpdatingFromSync = false
      return
    }
    if (props.isMultiplayer && !isRoundLocked.value) {
      multiplayerStore.sendGameAction({
        type: 'ORDER_SYNC',
        letters: newVal,
      })
    }
  }, { deep: true })

  watch(score, newScore => {
    if (props.isMultiplayer && isHost.value) {
      multiplayerStore.sendGameAction({
        type: 'SCORE_UPDATE',
        score: newScore,
        currentStep: currentStep.value,
      })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    if (timerInterval) {
      clearInterval(timerInterval)
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
  z-index: 1000;
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  transition: all 0.1s ease-out;
  transform: translate(-50%, -50%);
}

.cursor-pointer {
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.cursor-label {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #00e5ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  font-weight: bold;
  border: 1px solid rgba(0, 229, 255, 0.3);
}

/* Feedback Animations */
.animate-success {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.pointer-events-none {
  pointer-events: none !important;
}

.feedback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.game-paused {
  pointer-events: none !important;
  filter: blur(4px) grayscale(0.5);
  transition: all 0.3s ease;
}
</style>
