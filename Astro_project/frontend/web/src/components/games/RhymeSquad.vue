<template>
  <v-container class="d-flex flex-column align-center justify-center game-container w-100 opendyslexic" :class="{ 'game-paused': props.isPaused }" fluid style="min-height: 800px">

    <div class="hud d-flex justify-space-between align-center px-4 w-100 position-absolute" style="top: 20px; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-6">
        <div class="stat-item">
          <v-icon color="amber-accent-3" size="24" class="mr-2">mdi-star</v-icon>
          <span class="text-h5 font-weight-bold text-white">{{ score }}</span>
        </div>
        <div class="stat-item">
          <v-icon color="red-accent-2" size="24" class="mr-2">mdi-heart</v-icon>
          <span class="text-h5 font-weight-bold text-white">{{ lives }}</span>
        </div>
      </div>

      <div class="hud-pill">
        <div class="stat-item" :class="{ 'timer-critical': timeLeft <= 10 }">
          <v-icon :color="timeLeft <= 10 ? 'red-accent-2' : 'cyan-accent-3'" size="24" class="mr-2">mdi-timer-outline</v-icon>
          <span class="text-h4 font-weight-black text-white">{{ timeLeft }}s</span>
        </div>
      </div>

      <div v-if="combo > 1" class="combo-pill animate-bounce">
        <span class="text-h5 font-weight-black">x{{ combo }} COMBO!</span>
      </div>
    </div>

    <div class="game-area-wrapper position-relative w-100" style="height: 650px; margin-top: 60px;">
      <div v-if="!isPlaying && !isGameOver && !isWaitingForOthers" class="start-overlay d-flex flex-column align-center justify-center">
        <v-card class="pa-10 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="500">
          <v-icon color="cyan-accent-3" size="100" class="mb-6">mdi-music-note-rhyme</v-icon>
          <h1 class="text-h3 font-weight-black text-white mb-4">RHYME SQUAD</h1>
          <p class="text-h6 text-grey-lighten-1 mb-8">
            Selecciona las palabras que riman con el objetivo. ¡Mantén el combo para obtener bonus de tiempo!
          </p>
          <v-btn
            v-if="!isMultiplayer"
            class="font-weight-black text-black px-12"
            color="cyan-accent-3"
            rounded="pill"
            size="x-large"
            @click="handleStartClick"
          >
            INICIAR MISIÓN
          </v-btn>
          <div v-else class="text-h5 text-cyan-accent-2 animate-pulse">
            {{ $t('multiplayerLobby.autoStarting') || 'LA MISIÓN COMENZARÁ TRAS EL BRIEFING...' }}
          </div>
        </v-card>
      </div>

      <div v-if="isWaitingForOthers" class="start-overlay d-flex flex-column align-center justify-center">
        <v-card class="pa-10 text-center bg-slate-900 border-cyan rounded-xl elevation-24">
          <v-progress-circular indeterminate color="cyan-accent-3" size="64" class="mb-4" />
          <h2 class="text-h4 font-weight-bold text-white mb-2">¡Partida Finalizada!</h2>
          <p class="text-h6 text-grey-lighten-1">Esperando a que el rival termine...</p>
        </v-card>
      </div>

      <div v-if="isPlaying" class="play-area w-100 h-100 position-relative overflow-hidden">
        <div v-if="currentTarget" class="target-container d-flex flex-column align-center">
          <div class="target-label">RIMA CON:</div>
          <div class="target-word">{{ currentTarget.word.toUpperCase() }}</div>
          <div class="target-ending">{{ currentTarget.ending.toUpperCase() }}</div>
        </div>

        <div
          v-for="word in activeWords"
          :key="word.id"
          class="word-bubble-container"
          :style="{
            left: word.x + '%',
            top: word.y + 'px',
            transform: 'translateX(-50%)'
          }"
          @click="checkWord(word)"
        >
          <div class="word-bubble" :class="{ 'bubble-turbo': isTurbo }">
            {{ word.text }}
          </div>
        </div>
      </div>

      <v-overlay
        v-if="!isMultiplayer"
        v-model="isGameOver"
        class="align-center justify-center"
        persistent
      >
        <v-card class="pa-10 text-center bg-slate-900 border-cyan rounded-xl elevation-24" min-width="400">
          <v-icon color="amber-accent-3" size="80" class="mb-4">mdi-trophy-variant</v-icon>
          <h2 class="text-h3 font-weight-bold text-white mb-2">MISIÓN COMPLETADA</h2>
          <div class="stats-grid my-8">
            <div class="stat-box">
              <div class="stat-label">Puntos</div>
              <div class="stat-value text-cyan-accent-2">{{ score }}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Máx Combo</div>
              <div class="stat-value text-amber-accent-3">{{ maxCombo }}</div>
            </div>
          </div>
          <v-btn
            class="font-weight-black text-black px-12"
            color="cyan-accent-3"
            rounded="pill"
            size="x-large"
            @click="returnToMenu"
          >
            VOLVER AL MENÚ
          </v-btn>
        </v-card>
      </v-overlay>
    </div>

    <!-- Feedback Visual Overlay -->
    <v-overlay
      v-model="showFeedback"
      contained
      class="align-center justify-center pointer-events-none"
      persistent
      no-click-animation
      scrim="transparent"
    >
      <v-icon
        :color="feedbackType === 'success' ? 'success' : 'error'"
        size="150"
        class="feedback-icon-anim"
      >
        {{ feedbackType === 'success' ? 'mdi-check-circle' : 'mdi-close-circle' }}
      </v-icon>
    </v-overlay>

  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { rhymeData } from '@/data/rhymeGamesData'
import { useAstroStore } from '@/stores/astroStore'
import { useMultiplayerStore } from '@/stores/multiplayerStore'

const { t, locale } = useI18n()
const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()

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

const emit = defineEmits(['game-over'])

const subRole = computed(() => multiplayerStore.subRole)
const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)
const isWaitingForOthers = ref(false)

const currentDictionary = computed(() => {
  return rhymeData[locale.value] || rhymeData['es']
})

const isPlaying = ref(false)
const isGameOver = ref(false)
const score = ref(0)
const lives = ref(props.isMultiplayer ? 10 : 3)
const timeLeft = ref(60)
const combo = ref(0)
const maxCombo = ref(0)
const correctHits = ref(0)
const incorrectHits = ref(0)
const isTurbo = ref(false)
const showTimeBonus = ref(false)

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
  audio.volume = 0.3
  audio.play().catch(e => console.warn('Audio blocked:', e))

  setTimeout(() => {
    showFeedback.value = false
  }, 600)
}

const currentTarget = ref(null)
const activeWords = ref([])

let gameLoopInterval = null
let timerInterval = null
let wordIdCounter = 0
let currentSpawnRate = 1200
let currentSpeed = 5
let bonusTimeout = null

function handleStartClick() {
  if (props.isMultiplayer && isHost.value) {
    multiplayerStore.sendGameAction({ type: 'RHYME_START' })
  }
  startGame()
}

function startGame() {
  isPlaying.value = true
  isGameOver.value = false
  isWaitingForOthers.value = false
  score.value = 0
  lives.value = props.isMultiplayer ? 10 : 3
  combo.value = 0
  maxCombo.value = 0
  correctHits.value = 0
  incorrectHits.value = 0
  activeWords.value = []
  currentSpawnRate = 1200
  currentSpeed = 3
  
  const boost = astroStore.equippedSkinBoost
  if (boost && boost.type === 'time') {
    timeLeft.value = Math.floor(60 * boost.multiplier)
  } else {
    timeLeft.value = 60
  }

  pickNewTarget()
  startTimer()
  gameLoop()
}

function pickNewTarget() {
  const dict = currentDictionary.value
  currentTarget.value = dict[Math.floor(Math.random() * dict.length)]
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (isPlaying.value && !props.isPaused && !isWaitingForOthers.value) {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        endGame()
      }
    }
  }, 1000)
}

function spawnWord() {
  if (!isPlaying.value || props.isPaused || isWaitingForOthers.value) return

  const isRhyme = Math.random() > 0.4
  let text = ''

  if (isRhyme) {
    text = currentTarget.value.rhymes[Math.floor(Math.random() * currentTarget.value.rhymes.length)]
  } else {
    text = currentTarget.value.fakes[Math.floor(Math.random() * currentTarget.value.fakes.length)]
  }

  activeWords.value.push({
    id: wordIdCounter++,
    text,
    isRhyme,
    x: 10 + Math.random() * 80,
    y: -50,
  })
}

function gameLoop() {
  if (gameLoopInterval) clearInterval(gameLoopInterval)

  let lastSpawn = 0
  gameLoopInterval = setInterval(() => {
    if (!isPlaying.value || props.isPaused || isWaitingForOthers.value) return

    const now = Date.now()
    if (now - lastSpawn > currentSpawnRate) {
      spawnWord()
      lastSpawn = now
    }

    activeWords.value.forEach(word => {
      word.y += currentSpeed
    })

    const limit = 600
    const outIndices = []
    activeWords.value.forEach((word, index) => {
      if (word.y > limit) {
        if (word.isRhyme) {
          lives.value--
          combo.value = 0
          triggerFeedback('error')
          if (lives.value <= 0) endGame()
        }
        outIndices.push(index)
      }
    })

    for (let i = outIndices.length - 1; i >= 0; i--) {
      activeWords.value.splice(outIndices[i], 1)
    }

    if (score.value > 0 && score.value % 500 === 0) {
      currentSpeed = Math.min(10, currentSpeed + 0.1)
      currentSpawnRate = Math.max(600, currentSpawnRate - 20)
    }
  }, 16)
}

function checkWord(word) {
  if (!isPlaying.value || props.isPaused || isWaitingForOthers.value) return

  const index = activeWords.value.findIndex(w => w.id === word.id)
  if (index === -1) return

  activeWords.value.splice(index, 1)

  if (word.isRhyme) {
    score.value += 100 * (combo.value + 1)
    combo.value++
    if (combo.value > maxCombo.value) maxCombo.value = combo.value
    correctHits.value++
    triggerFeedback('success')

    if (combo.value >= 5) {
      timeLeft.value = Math.min(99, timeLeft.value + 2)
      showTimeBonus.value = true
      if (bonusTimeout) clearTimeout(bonusTimeout)
      bonusTimeout = setTimeout(() => { showTimeBonus.value = false }, 1000)
    }

    if (Math.random() > 0.7) pickNewTarget()
  } else {
    lives.value--
    combo.value = 0
    incorrectHits.value++
    triggerFeedback('error')
    if (lives.value <= 0) endGame()
  }
}

function endGame() {
  isPlaying.value = false
  clearInterval(gameLoopInterval)
  clearInterval(timerInterval)

  if (props.isMultiplayer) {
    isWaitingForOthers.value = true
    multiplayerStore.submitRoundResult()
  } else {
    isGameOver.value = true
  }
}

function returnToMenu() {
  emit('game-over', score.value)
}

onMounted(() => {
  if (props.isMultiplayer) {
    setTimeout(() => {
      if (!isPlaying.value) handleStartClick()
    }, 3000)
  }
})

onUnmounted(() => {
  clearInterval(gameLoopInterval)
  clearInterval(timerInterval)
})

watch(() => multiplayerStore.lastMessage, msg => {
  if (!msg) return

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    isWaitingForOthers.value = false
    isGameOver.value = true
    isPlaying.value = false
    return
  }

  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'RHYME_START' && !isPlaying.value) {
    startGame()
  }
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.hud-pill {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 20px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.timer-critical {
  animation: pulse-red 0.5s infinite alternate;
}

@keyframes pulse-red {
  from { transform: scale(1); filter: drop-shadow(0 0 0px red); }
  to { transform: scale(1.1); filter: drop-shadow(0 0 10px red); }
}

.combo-pill {
  background: linear-gradient(45deg, #ff9100, #ffea00);
  padding: 8px 20px;
  border-radius: 100px;
  color: black;
  box-shadow: 0 0 20px rgba(255, 145, 0, 0.5);
}

.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(5px);
}

.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 2px solid #00e5ff; }

.target-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 229, 255, 0.1);
  padding: 15px 40px;
  border-radius: 15px;
  border: 2px dashed #00e5ff;
  text-align: center;
}

.target-label {
  font-size: 0.8rem;
  color: #00e5ff;
  letter-spacing: 2px;
  margin-bottom: 5px;
}

.target-word {
  font-size: 2.5rem;
  font-weight: 900;
  color: white;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

.target-ending {
  font-size: 1.2rem;
  color: #ffea00;
  font-weight: bold;
}

.word-bubble-container {
  position: absolute;
  cursor: pointer;
  transition: transform 0.1s;
}

.word-bubble-container:hover {
  transform: translateX(-50%) scale(1.1);
}

.word-bubble {
  background: white;
  color: #1e293b;
  padding: 12px 25px;
  border-radius: 30px;
  font-weight: bold;
  font-size: 1.3rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
}

.word-bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid white;
}

.bubble-turbo {
  background: #ffea00;
  animation: jitter 0.1s infinite;
}

@keyframes jitter {
  0% { transform: translate(0,0); }
  25% { transform: translate(2px, -2px); }
  50% { transform: translate(-2px, 2px); }
  75% { transform: translate(2px, 2px); }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 15px;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 900;
}

.feedback-icon-anim {
  animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scale-up {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
