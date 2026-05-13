<template>
  <v-container class="text-center d-flex justify-center align-center fill-height" :class="{ 'game-paused': props.isPaused }" fluid>
    <v-card class="pa-6 bg-slate-900 border-amber game-shell mb-10" max-width="560" rounded="xl" width="100%">
      <div class="hud-row mb-6">
        <div class="text-subtitle-1 text-amber-accent-2 font-weight-bold">{{ $t('syllableQuest.points', { score: score }) }}</div>
        <div class="text-subtitle-1 font-weight-bold" :class="timeLeft <= 10 ? 'text-red-accent-2' : 'text-cyan-accent-2'">
          {{ $t('syllableQuest.time', { time: timeLeft }) }}
        </div>
      </div>

      <template v-if="!gameFinished">
        <div v-if="!isMultiplayer">
          <div class="text-h4 mb-2">{{ currentWord.text }}</div>
          <div class="text-caption text-grey-lighten-1 mb-6">{{ $t('syllableQuest.missionProgress', { current: currentWordIndex + 1, total: words.length }) }}</div>

          <div class="d-flex justify-center gap-4 mb-8">
            <v-avatar
              v-for="n in currentWord.syllables"
              :key="n"
              class="elevation-4"
              :color="userSyllables >= n ? 'amber-accent-3' : 'grey-darken-3'"
              size="60"
            >
              <v-icon v-if="userSyllables >= n">mdi-music-note</v-icon>
            </v-avatar>
          </div>

          <v-btn
            class="mb-4"
            color="amber-accent-3"
            icon="mdi-hand-clap"
            size="x-large"
            @click="addSyllable"
          />

          <p class="text-subtitle-1 mb-4">{{ $t('syllableQuest.clickInstruction') }}</p>

          <v-btn
            block
            class="font-weight-bold"
            color="success"
            rounded="lg"
            @click="checkSyllables"
          >
            {{ $t('syllableQuest.check') }}
          </v-btn>
        </div>

        <!-- REDISSENY MULTIPLAYER: ORDENAR FRASES -->
        <div v-else>
          <div class="text-h5 mb-4 text-amber-accent-2 font-weight-bold">{{ $t('syllableQuest.orderPhrase') }}</div>

          <div class="phrase-display mb-8 pa-4 bg-slate-800 rounded-lg min-height-100 d-flex flex-wrap justify-center ga-2 border-dashed">
            <v-chip
              v-for="(word, idx) in correctWordsInOrder"
              :key="'correct-'+idx"
              class="text-h6 font-weight-bold"
              color="success"
              label
            >
              {{ word }}
            </v-chip>
              {{ $t('syllableQuest.clickOrder') }}
          </div>

          <div class="d-flex flex-wrap justify-center ga-3 mb-6">
            <v-btn
              v-for="(word, idx) in shuffledWords"
              :key="'word-'+idx"
              class="text-none font-weight-bold"
              color="amber-accent-3"
              :disabled="usedWordIndices.has(idx)"
              rounded="pill"
              @click="handleWordClick(idx)"
            >
              {{ word }}
            </v-btn>
          </div>
        </div>

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
      </template>

      <template v-else>
        <v-icon class="mb-4" color="amber-accent-3" icon="mdi-trophy" size="70" />
        <h2 class="text-h4 mb-3">{{ $t('syllableQuest.completedTitle') }}</h2>
        <p class="text-h6 mb-1">{{ $t('syllableQuest.finalScore', { score: score }) }}</p>
        <p class="text-subtitle-1 text-grey-lighten-1 mb-1">{{ $t('syllableQuest.timeRemaining', { time: timeLeft }) }}</p>
        <p class="text-h6 text-cyan-accent-2 mb-6">{{ $t('syllableQuest.reward', { reward: finalReward }) }}</p>

        <v-btn
          class="text-black font-weight-bold"
          color="amber-accent-3"
          rounded="pill"
          size="large"
          @click="emitExit"
        >
          {{ $t('syllableQuest.getReward') }}
        </v-btn>
      </template>
    </v-card>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { syllableData } from '@/data/syllableGamesData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { locale, t } = useI18n()
  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const emit = defineEmits(['game-over'])
  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
  })

  // --- LÒGICA SINGLEPLAYER (SÍL·LABES) ---
  const words = computed(() => syllableData[locale.value] || syllableData['es'])

  const currentWordIndex = ref(0)
  const currentWord = computed(() => words.value[currentWordIndex.value])
  const userSyllables = ref(0)
  const score = ref(0)
  const timeLeft = ref(60)
  const gameFinished = ref(false)
  const message = ref('')
  const messageType = ref('info')
  const finalReward = computed(() => score.value + timeLeft.value)
  let timerInterval = null

  // --- REFORÇ VISUAL I SONOR ---
  const showFeedback = ref(false)
  const feedbackType = ref('success') // 'success' o 'error'

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

  // --- LÒGICA MULTIPLAYER (ORDENAR FRASES) ---
  const multiplayerPhrases = [
    'LA INTEL·LIGÈNCIA ARTIFICIAL ENS AJUDA A PROGRAMAR MILLOR',
    'L\'ESPAI ÉS UN LLOC IMMENS I PLE DE MISTERIS',
    'EL SISTEMA SOLAR TÉ VUIT PLANETES I UN SOL',
    'LA LLUNA ÉS EL NOSTRE SATÈL·LIT NATURAL',
    'LES ESTRELLES BRILLEN EN LA NIT FOSCA',
  ]
  const currentPhraseIndex = ref(0)
  const currentPhrase = computed(() => multiplayerPhrases[currentPhraseIndex.value])
  const originalWords = computed(() => currentPhrase.value.split(' '))
  const shuffledWords = ref([])
  const usedWordIndices = ref(new Set())
  const correctWordsInOrder = ref([])

  function shuffleArray (array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  function handleWordClick (index) {
    if (gameFinished.value || props.isPaused) return
    const clickedWord = shuffledWords.value[index]
    const nextCorrectWord = originalWords.value[correctWordsInOrder.value.length]

    if (clickedWord === nextCorrectWord) {
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'PHRASE_CLICK',
          index: index,
          word: clickedWord,
          correct: true,
        })
      } else {
        processCorrectClick(index, clickedWord)
      }
    } else {
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'PHRASE_CLICK',
          index: index,
          word: clickedWord,
          correct: false,
        })
      } else {
        processIncorrectClick()
      }
    }
  }

  function processCorrectClick (index, word) {
    usedWordIndices.value.add(index)
    correctWordsInOrder.value.push(word)

    if (correctWordsInOrder.value.length === originalWords.value.length) {
      score.value += 100
      message.value = t('syllableQuest.phraseCompleted')
      messageType.value = 'success'
      triggerFeedback('success')

      setTimeout(() => {
        if (currentPhraseIndex.value < multiplayerPhrases.length - 1) {
          currentPhraseIndex.value++
          // Si es multijugador, el host sincroniza. Si es singleplayer, sincronizamos siempre.
          if (!props.isMultiplayer || isHost.value) syncPhrase()
        } else {
          finishGame()
        }
      }, 1500)
    }
  }

  function processIncorrectClick () {
    message.value = t('syllableQuest.incorrectOrder')
    messageType.value = 'error'
    timeLeft.value = Math.max(0, timeLeft.value - 3)
    triggerFeedback('error')

    setTimeout(() => {
      usedWordIndices.value.clear()
      correctWordsInOrder.value = []
      message.value = ''
    }, 1000)
  }

  function syncPhrase () {
    const shuffled = shuffleArray(originalWords.value)
    shuffledWords.value = shuffled
    usedWordIndices.value.clear()
    correctWordsInOrder.value = []

    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'PHRASE_SYNC',
        shuffled: shuffled,
        phraseIndex: currentPhraseIndex.value,
      })
    }
  }

  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)

  function addSyllable () {
    if (gameFinished.value || props.isPaused) return
    if (userSyllables.value < 8) userSyllables.value++
  }

  function finishGame (silent = false) {
    if (gameFinished.value) return

    if (props.isMultiplayer && !silent) {
      gameFinished.value = true
      if (timerInterval) clearInterval(timerInterval)
      multiplayerStore.submitRoundResult()
      return
    }

    gameFinished.value = true
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function checkSyllables () {
    if (gameFinished.value || props.isPaused) return

    const currentGoal = currentWord.value.syllables

    if (userSyllables.value === currentGoal) {
      score.value += 60
      message.value = t('syllableQuest.msgCorrect')
      messageType.value = 'success'
      triggerFeedback('success')

      if (currentWordIndex.value >= words.value.length - 1) {
        finishGame()
        return
      }

      currentWordIndex.value++
      userSyllables.value = 0
    } else {
      score.value = Math.max(0, score.value - 10)
      message.value = t('syllableQuest.msgIncorrect')
      messageType.value = 'error'
      userSyllables.value = 0
      triggerFeedback('error')
    }
  }

  function startTimer () {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    timerInterval = setInterval(() => {
      if (gameFinished.value || props.isPaused) return

      if (!props.isMultiplayer || isHost.value) {
        timeLeft.value = Math.max(0, timeLeft.value - 1)

        if (props.isMultiplayer && isHost.value) {
          multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
        }

        if (timeLeft.value === 0) {
          finishGame()
        }
      }
    }, 1000)
  }

  function emitExit () {
    emit('game-over', finalReward.value)
  }

  onMounted(() => {
    startTimer()
    if (!props.isMultiplayer || isHost.value) {
      syncPhrase()
    }
  })

  // Listener para eventos multijugador
  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      finishGame(true)
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'PHRASE_SYNC') {
        shuffledWords.value = msg.action.shuffled
        currentPhraseIndex.value = msg.action.phraseIndex
        usedWordIndices.value.clear()
        correctWordsInOrder.value = []
      }

      if (msg.action?.type === 'PHRASE_CLICK') {
        if (msg.action.correct) {
          processCorrectClick(msg.action.index, msg.action.word)
        } else {
          processIncorrectClick()
        }
      }

      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) finishGame()
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

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })
</script>

<style scoped>
.game-shell {
  border: 1px solid rgba(255, 193, 7, 0.45);
}

.game-paused {
  pointer-events: none !important;
  filter: blur(4px) grayscale(0.5);
  transition: all 0.3s ease;
}

.hud-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bg-slate-900 {
  background-color: #0f172a;
}

.border-amber {
  border: 1px solid rgba(255, 193, 7, 0.35);
}

/* Animacions de Feedback */
.feedback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

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
</style>
