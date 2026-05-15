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
        <div v-if="!isMultiplayer || props.isDuel">
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
            <div v-if="correctWordsInOrder.length === 0" class="text-grey-darken-1">
              {{ $t('syllableQuest.clickOrder') }}
            </div>
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
          style="z-index: 1000;"
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

    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { syllableData as syllableQuestData } from '@/data/syllableGamesData'
import { useAstroStore } from '@/stores/astroStore'
import { useGroupStore } from '@/stores/groupStore'
import { useMultiplayerStore } from '@/stores/multiplayerStore'

const { t, locale } = useI18n()
const astroStore = useAstroStore()
const groupStore = useGroupStore()
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
  const rivals = Object.keys(multiplayerStore.playerTimes || {}).filter(u => u !== astroStore.user)
  if (rivals.length === 0) return true 
  return rivals.some(u => (multiplayerStore.playerTimes?.[u] || 0) > 0)
})

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

// LCG Random
let currentSeed = 0
function lcgRandom() {
  currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
  return currentSeed / 4294967296
}

function normalizeWordData(entry = {}) {
  return {
    text: String(entry.text || ''),
    syllables: Number(entry.syllables) || 0,
  }
}

const gameData = computed(() => {
  if (!props.isMultiplayer && groupStore.trainingActiveSupplySet?.gameId === 'SyllableQuest' && groupStore.trainingActiveSupplySet?.content?.length > 0) {
    return groupStore.trainingActiveSupplySet.content
  }
  if (
    astroStore.plan === 'GRUPAL'
    && astroStore.role === 'STUDENT'
    && groupStore.activeSupplySet?.gameId === 'SyllableQuest'
    && groupStore.activeSupplySet?.content?.length > 0
  ) {
    return groupStore.activeSupplySet.content
  }
  return syllableQuestData[locale.value] || syllableQuestData['es']
})

const words = computed(() => {
  const normalized = gameData.value
    .map(normalizeWordData)
    .filter(item => item.text && item.syllables > 0)
  return normalized.length > 0 ? normalized : (syllableQuestData[locale.value] || syllableQuestData['es']).map(normalizeWordData)
})

const currentWordIndex = ref(0)
const currentWord = computed(() => words.value[currentWordIndex.value % words.value.length])
const userSyllables = ref(0)
const score = ref(0)
const timeLeft = ref(props.duration)
const message = ref('')
const messageType = ref('success')
const gameFinished = ref(false)
let timerInterval = null

// Multiplayer Phrase logic
const phrases = [
  'Aquest és un joc de paraules',
  'Ens agrada molt programar amb vue',
  'La missió espacial ja ha començat',
  'Avui fa un dia molt bonic',
  'Astro és l’assistent del futur',
  'Agafa el comandament de la nau',
]
const currentPhraseIndex = ref(0)
const shuffledWords = ref([])
const correctWordsInOrder = ref([])
const usedWordIndices = ref(new Set())

function addSyllable() {
  if (gameFinished.value || props.isPaused) return
  if (userSyllables.value < 8) {
    userSyllables.value++
  }
}

function checkSyllables() {
  if (gameFinished.value || props.isPaused) return
  if (userSyllables.value === currentWord.value.syllables) {
    score.value += 20 + (currentWord.value.syllables * 5)
    if (anyRivalAlive.value) {
      timeLeft.value = Math.min(90, timeLeft.value + 5)
    }
    message.value = t('syllableQuest.correct')
    messageType.value = 'success'
    triggerFeedback('success')
    
    if (props.isRace) {
      multiplayerStore.rechargeFuel(10)
    }

    if (props.isMultiplayer) {
      const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
      multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: isSaboteurActive ? 6 : 3 })
      if (props.isDuel) {
        multiplayerStore.sendGameAction({ type: 'TIME_PENALTY', amount: isSaboteurActive ? 10 : 5 })
      }
    }

    setTimeout(() => {
      message.value = ''
      userSyllables.value = 0
      currentWordIndex.value++
    }, 1000)
  } else {
    timeLeft.value = Math.max(0, timeLeft.value - 5)
    if (props.isDuel || props.isRace || !props.isMultiplayer) {
      multiplayerStore.timeLeft = timeLeft.value
    }
    message.value = t('syllableQuest.incorrect')
    messageType.value = 'error'
    triggerFeedback('error')
    setTimeout(() => { message.value = '' }, 1000)
  }
}

function syncPhrase() {
  const isShared = multiplayerStore.room?.gameConfig?.sharedChallenge
  const rnd = (props.isMultiplayer && (!props.isDuel || isShared)) ? lcgRandom() : Math.random()
  const idx = Math.floor(rnd * phrases.length)
  const phrase = phrases[idx]
  const wordsArr = phrase.split(' ')
  
  // Use LCG for shuffling to maintain sync
  const shuffled = [...wordsArr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(lcgRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  currentPhraseIndex.value = idx
  shuffledWords.value = shuffled
  usedWordIndices.value.clear()
  correctWordsInOrder.value = []

  if (props.isMultiplayer && isHost.value && !props.isDuel && !props.isRace) {
    multiplayerStore.sendGameAction({ type: 'PHRASE_SYNC', phraseIndex: idx, shuffled })
  }
}

function handleWordClick(idx) {
  if (gameFinished.value || props.isPaused) return
  const clickedWord = shuffledWords.value[idx]
  const phraseWords = phrases[currentPhraseIndex.value].split(' ')
  const nextRequiredWord = phraseWords[correctWordsInOrder.value.length]

  const isCorrect = clickedWord === nextRequiredWord
  
  if (props.isMultiplayer && !props.isDuel && !props.isRace) {
    multiplayerStore.sendGameAction({ type: 'PHRASE_CLICK', index: idx, word: clickedWord, correct: isCorrect })
  }

  if (isCorrect) {
    processCorrectClick(idx, clickedWord)
  } else {
    processIncorrectClick()
  }
}

function processCorrectClick(idx, word) {
  usedWordIndices.value.add(idx)
  correctWordsInOrder.value.push(word)
  score.value += 15
  triggerFeedback('success')

  const phraseWords = phrases[currentPhraseIndex.value].split(' ')
  if (correctWordsInOrder.value.length === phraseWords.length) {
    message.value = 'Frase completada!'
    messageType.value = 'success'
    setTimeout(() => {
      message.value = ''
      syncPhrase()
    }, 1500)
  }
}

function processIncorrectClick() {
  timeLeft.value = Math.max(0, timeLeft.value - 8)
  if (props.isDuel || props.isRace || !props.isMultiplayer) {
    multiplayerStore.timeLeft = timeLeft.value
  }
  triggerFeedback('error')
  message.value = 'Ordre incorrecte!'
  messageType.value = 'error'
  setTimeout(() => { message.value = '' }, 1000)
}

function startTimer() {
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
          if (props.isDuel || props.isRace) {
            multiplayerStore.timeLeft = timeLeft.value
          }
        }
      }
      if (timeLeft.value <= 0) finishGame()
    }
  }, 500)
}

function finishGame() {
  if (gameFinished.value) return
  gameFinished.value = true
  if (timerInterval) clearInterval(timerInterval)

  if (props.isMultiplayer && !props.isDuel && !props.isRace) {
    multiplayerStore.submitRoundResult()
  }
  
  if (!props.isMultiplayer || props.isRace || props.isDuel) {
    emitExit()
  }
}

function emitExit() {
  emit('game-over', score.value)
}

onMounted(() => {
  const boost = astroStore.equippedSkinBoost
  if (boost && boost.type === 'time') {
    timeLeft.value = Math.floor(props.duration * boost.multiplier)
  } else {
    timeLeft.value = props.duration
  }

  startTimer()
  if (!props.isMultiplayer || isHost.value || props.isDuel || props.isRace) {
    if (multiplayerStore.room?.gameConfig?.seed) {
      const s = multiplayerStore.room.gameConfig.seed
      currentSeed = typeof s === 'string' ? s.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : s
    }
    syncPhrase()
  }
})

watch(() => multiplayerStore.lastMessage, msg => {
  if (!msg) return

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    finishGame()
    return
  }

  if (msg.type === 'GAME_ACTION') {
    if (msg.action?.type === 'SCORE_UPDATE' && msg.from !== astroStore.user) {
      multiplayerStore.roundScores[msg.from] = msg.action.score
      return
    }

    if (msg.action?.type === 'PHRASE_SYNC' && !props.isDuel && !props.isRace) {
      shuffledWords.value = msg.action.shuffled
      currentPhraseIndex.value = msg.action.phraseIndex
      usedWordIndices.value.clear()
      correctWordsInOrder.value = []
    }

    if (msg.action?.type === 'PHRASE_CLICK' && !props.isDuel && !props.isRace) {
      if (msg.action.correct) {
        processCorrectClick(msg.action.index, msg.action.word)
      } else {
        processIncorrectClick()
      }
    }

    if (msg.action?.type === 'TIME_SYNC' && !isHost.value && !props.isDuel && !props.isRace) {
      timeLeft.value = msg.action.timeLeft
      if (timeLeft.value <= 0) finishGame()
    }
    if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2))
      if (props.isDuel || props.isRace) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      if (timeLeft.value <= 0) finishGame()
    }

    if (msg.action?.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 5))
      if (props.isDuel || props.isRace) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      if (timeLeft.value <= 0) finishGame()
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

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.game-shell {
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  border: 1px solid rgba(255, 193, 7, 0.3);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.game-paused {
  pointer-events: none !important;
  filter: blur(4px) grayscale(0.5);
  transition: all 0.3s ease;
}

.hud-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.gap-4 { gap: 1rem; }
.ga-2 { gap: 0.5rem; }
.ga-3 { gap: 0.75rem; }

.min-height-100 { min-height: 100px; }

.border-dashed {
  border: 2px dashed rgba(255, 255, 255, 0.1);
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
</style>
