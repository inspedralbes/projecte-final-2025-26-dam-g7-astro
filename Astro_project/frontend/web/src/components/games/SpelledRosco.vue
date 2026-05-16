<template>
  <v-container ref="gameArea" class="game-container pa-0 w-100 opendyslexic position-relative" fluid style="min-height: 800px; overflow: hidden; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);" @mousemove="handleMouseMove">
    

    <!-- HUD -->
    <div class="hud d-flex justify-space-between align-center px-6 w-100 position-absolute" style="top: 20px; z-index: 20;">
      <div class="hud-pill d-flex align-center ga-6 border-cyan">
        <div class="stat-item">
          <v-icon color="amber-accent-3" size="28" class="mr-2">mdi-rocket-launch</v-icon>
          <span class="text-h4 font-weight-black text-white">{{ score }}</span>
        </div>
        <div v-if="isMultiplayer && subRole" class="stat-item border-l pl-4" style="border-color: rgba(255,255,255,0.1) !important;">
          <v-chip size="small" color="cyan-accent-3" variant="flat" class="font-weight-black text-black">
            {{ subRole.toUpperCase() }}
          </v-chip>
        </div>
        <div class="stat-item border-l pl-6" style="border-color: rgba(255,255,255,0.1) !important;">
          <v-icon color="success" size="24" class="mr-1">mdi-check</v-icon>
          <span class="text-h6 font-weight-bold text-success">{{ correctCount }}</span>
          <v-icon color="error" size="24" class="ml-4 mr-1">mdi-close</v-icon>
          <span class="text-h6 font-weight-bold text-error">{{ incorrectCount }}</span>
        </div>
      </div>

      <div class="hud-pill border-amber">
        <div class="stat-item" :class="{ 'timer-critical': timeLeft <= 10 }">
          <v-icon :color="timeLeft <= 10 ? 'red-accent-2' : 'amber-accent-3'" size="28" class="mr-2">mdi-clock-fast</v-icon>
          <span class="text-h3 font-weight-black text-white">{{ timeLeft }}s</span>
        </div>
      </div>
    </div>

    <div v-if="!gameFinished" class="game-content-wrapper d-flex flex-column align-center justify-center">
      <!-- ROSCO STAR VISUALIZER -->
      <div class="rosco-visualizer position-relative" style="width: 450px; height: 450px;">
        <svg viewBox="0 0 400 400" width="100%" height="100%" class="star-svg">
          <!-- Star Outline -->
          <path :d="starPath" class="star-track" />
          
          <!-- Tip Segments (Background) -->
          <polygon 
            v-for="(poly, i) in tipPolygons" 
            :key="'poly-'+i"
            :points="poly"
            class="star-segment"
            :class="{ 
              'active': currentIndex === i,
              'correct': roscoLetters[i]?.status === 'correct',
              'incorrect': roscoLetters[i]?.status === 'incorrect'
            }"
          />

          <!-- Particle Trail -->
          <circle 
            v-for="p in trailParticles" 
            :key="p.id"
            :cx="p.x" :cy="p.y"
            :r="p.size"
            :fill="p.color"
            :opacity="p.opacity"
          />

          <!-- Letters on Tips -->
          <g v-for="(pos, i) in letterPositions" :key="'letter-'+i">
            <circle 
              :cx="starPoints[pos].x" 
              :cy="starPoints[pos].y" 
              r="22" 
              class="letter-node"
              :class="{ 
                'active': currentIndex === i,
                'correct': roscoLetters[i]?.status === 'correct',
                'incorrect': roscoLetters[i]?.status === 'incorrect'
              }"
            />
            <text 
              :x="starPoints[pos].x" 
              :y="starPoints[pos].y" 
              dy=".35em"
              class="letter-text"
            >
              {{ roscoLetters[i]?.char || '?' }}
            </text>
          </g>

          <!-- Rocket Sprite -->
          <g class="rocket-sprite" :style="rocketTransform">
            <v-icon color="amber-accent-3" size="32" class="rocket-icon">mdi-rocket</v-icon>
            <!-- Engine fire -->
            <path d="M-8,16 L0,28 L8,16" fill="orange" opacity="0.8">
              <animate attributeName="d" values="M-8,16 L0,28 L8,16; M-8,16 L0,22 L8,16; M-8,16 L0,28 L8,16" dur="0.1s" repeatCount="indefinite" />
            </path>
          </g>
        </svg>

        <!-- Partner Emoji / Hint Floating -->
        <div v-if="multiplayerStore.partnerEmoji" class="partner-hint-bubble">
          <div class="hint-label">{{ $t('spelledRosco.hintFromPartner') }}</div>
          <div class="hint-content">{{ multiplayerStore.partnerEmoji }}</div>
        </div>
      </div>

      <!-- INTERFACE CARD -->
      <v-card class="question-card pa-6 text-center bg-slate-900 border-cyan rounded-xl elevation-24 mt-8" width="600">
        <div class="question-header d-flex align-center justify-space-between mb-4">
          <div class="letter-badge">{{ $t('spelledRosco.letter') }} {{ currentLetter.char }}</div>
          <v-chip color="cyan-accent-3" variant="outlined" size="small" density="comfortable">
            {{ currentIndex + 1 }} / {{ roscoLetters.length }}
          </v-chip>
        </div>

        <div class="question-text mb-8">
          {{ currentLetter.question }}
        </div>

        <!-- INPUT SECTION -->
        <div v-if="!isGuesser || (isGuesser && !isTranslator)" class="input-section d-flex ga-4">
          <v-text-field
            v-model="rawInput"
            :placeholder="$t('spelledRosco.inputPlaceholder')"
            variant="solo-filled"
            flat
            rounded="lg"
            bg-color="rgba(255,255,255,0.05)"
            class="answer-input"
            autofocus
            autocomplete="off"
            @keydown.enter="checkAnswer"
            @input="onTyping"
            :disabled="isChecking || isTranslator || isSender || props.isSpectator"
          >
            <template v-slot:append-inner>
              <v-btn icon="mdi-send" variant="text" color="cyan-accent-3" @click="checkAnswer" :disabled="isChecking || isTranslator || isSender || props.isSpectator" />
            </template>
          </v-text-field>

          <v-btn
            color="amber-accent-4"
            variant="flat"
            height="56"
            rounded="lg"
            class="font-weight-black px-6"
            @click="skipLetter"
            :disabled="isChecking || isTranslator || isSender || props.isSpectator"
          >
            {{ $t('spelledRosco.pass') }}
          </v-btn>
        </div>

        <!-- TRANSLATOR / SENDER HINT SECTION -->
        <div v-if="isTranslator || isSender" class="hint-sender-box pa-4 mt-2">
          <p class="text-caption text-cyan-accent-2 mb-2">{{ $t('spelledRosco.sendHintToPartner') }}</p>
          <div class="d-flex ga-2">
            <v-text-field
              v-model="textHint"
              variant="solo"
              density="compact"
              placeholder="Ej: PLANETA"
              hide-details
              @keydown.enter="sendTextHint"
            />
            <v-btn color="cyan-accent-3" icon="mdi-send" size="small" @click="sendTextHint" />
          </div>
        </div>
      </v-card>
    </div>

    <!-- GAME FINISHED OVERLAY -->
    <v-overlay v-model="gameFinished" class="align-center justify-center" persistent z-index="200">
      <v-card class="pa-10 text-center bg-slate-900 border-amber rounded-xl elevation-24" width="450">
        <v-icon color="amber-accent-3" size="80" class="mb-4">mdi-rocket-launch</v-icon>
        <h2 class="text-h3 font-weight-black text-white mb-2">{{ $t('spelledRosco.completed') }}</h2>
        <div class="final-score my-8">
          <div class="text-h6 text-grey">{{ $t('spelledRosco.totalPointsLabel') }}</div>
          <div class="text-h2 font-weight-black text-cyan-accent-3">{{ score }}</div>
        </div>
        <v-btn color="cyan-accent-3" block size="x-large" rounded="pill" class="text-black font-weight-black" @click="returnToMenu">
          {{ $t('spelledRosco.returnMenu') }}
        </v-btn>
      </v-card>
    </v-overlay>

    <!-- Feedback Message Overlay -->
    <v-snackbar
      v-model="showFeedback"
      :color="feedbackColor"
      timeout="1500"
      location="top"
      flat
      class="rosco-snackbar"
    >
      <div class="text-center font-weight-black">{{ feedbackMessage }}</div>
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { roscoData } from '@/data/roscoGamesData'
import { useAstroStore } from '@/stores/astroStore'
import { useMultiplayerStore } from '@/stores/multiplayerStore'
import { isValidHint } from '@/utils/hintValidator'
import { getWordCategory, getWordType } from '@/utils/roscoHints'

const { t, locale } = useI18n()
const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()

const emit = defineEmits(['game-over'])
const props = defineProps({
  isMultiplayer: { type: Boolean, default: false },
  isRace: { type: Boolean, default: false },
  duration: { type: Number, default: 60 },
  isDuel: { type: Boolean, default: false },
  autoStart: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  isSpectator: { type: Boolean, default: false },
  spectatedPlayer: { type: String, default: null },
})

const textHint = ref('')
const currentHints = reactive({ category: '', type: '' })
const isPlaying = ref(false)

function throttle(func, limit) {
  let lastRan, lastFunc
  return function (...args) {
    if (lastRan) {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func(...args); lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    } else {
      func(...args); lastRan = Date.now()
    }
  }
}

const roscoLetters = ref([]), currentIndex = ref(0), rawInput = ref(''), gameFinished = ref(false), score = ref(0), showFeedback = ref(false), feedbackMessage = ref(''), feedbackColor = ref('info'), isChecking = ref(false), timeLeft = ref(props.duration), rocketAnimating = ref(false), rocketPos = reactive({ x: 0, y: 0 }), trailParticles = ref([]), visitedSegments = ref(new Set())
let timerInterval = null
let currentSeed = 0

const STAR_CENTER = 200
const STAR_RADIUS = 150
const INNER_RADIUS = 60

const starPoints = Array.from({ length: 10 }, (_, i) => {
  const angle = (i * 36 - 90) * (Math.PI / 180)
  const r = i % 2 === 0 ? STAR_RADIUS : INNER_RADIUS
  return { x: STAR_CENTER + Math.cos(angle) * r, y: STAR_CENTER + Math.sin(angle) * r }
})

const letterPositions = [0, 2, 4, 6, 8]

const starSegments = computed(() => starPoints.map((point, i) => ({
  x1: point.x, y1: point.y,
  x2: starPoints[(i + 1) % 10].x, y2: starPoints[(i + 1) % 10].y,
})))

const tipPolygons = computed(() => letterPositions.map(pos => {
  const pPrev = starPoints[(pos - 1 + 10) % 10], pCurr = starPoints[pos], pNext = starPoints[(pos + 1) % 10], pCenter = { x: STAR_CENTER, y: STAR_CENTER }
  return `${pCenter.x},${pCenter.y} ${pPrev.x},${pPrev.y} ${pCurr.x},${pCurr.y} ${pNext.x},${pNext.y}`
}))

const anyRivalAlive = computed(() => {
  if (!props.isMultiplayer) return true
  const rivals = Object.keys(multiplayerStore.playerTimes || {}).filter(u => u !== astroStore.user)
  if (rivals.length === 0) return true 
  return rivals.some(u => (multiplayerStore.playerTimes?.[u] || 0) > 0)
})

const subRole = computed(() => multiplayerStore.subRole)
const isHost = computed(() => {
  const host = multiplayerStore.room?.host
  return (typeof host === 'object' ? host.username || host.user : host) === astroStore.user
})
const isAuthority = computed(() => {
  if (props.isSpectator) return false
  if (!props.isMultiplayer) return true
  if (isHost.value) return true
  // En duelos, torneos o carreras cada jugador es autoridad de su propio minijuego
  const modality = multiplayerStore.room?.gameConfig?.modality
  const mode = multiplayerStore.room?.gameConfig?.mode
  if (props.isDuel || props.isRace || modality === '1vs1' || mode === 'TOURNAMENT' || mode === 'RACE') return true
  return false
})
const isTranslator = computed(() => props.isMultiplayer && !props.isDuel && subRole.value === 'translator')
const isSender = computed(() => props.isMultiplayer && !props.isDuel && subRole.value === 'sender')
const isGuesser = computed(() => props.isMultiplayer && !props.isDuel && subRole.value === 'guesser')

const currentLetter = computed(() => roscoLetters.value.length > 0 ? roscoLetters.value[currentIndex.value] : { char: '?', question: '', answer: '' })

watch(currentLetter, (newVal) => {
  if (newVal?.answer) {
    currentHints.category = getWordCategory(newVal.answer)
    currentHints.type = getWordType(newVal.answer)
  }
})

const correctCount = computed(() => roscoLetters.value.filter(l => l.status === 'correct').length)
const incorrectCount = computed(() => roscoLetters.value.filter(l => l.status === 'incorrect').length)
const finalReward = computed(() => Math.floor(score.value / 10))

function normalize(text) {
  return text ? text.toUpperCase().trim().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, "") : ""
}

const sounds = { success: '/assets/sounds/success.mp3', error: '/assets/sounds/error.mp3' }
function playFeedbackSound(type) {
  const audio = new Audio(sounds[type]); audio.volume = 0.4; audio.play().catch(() => {})
}

function lcgRandom() {
  currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
  return currentSeed / 4294967296
}

function shuffleArray(array) {
  const isShared = multiplayerStore.room?.gameConfig?.sharedChallenge;
  const useLCG = props.isMultiplayer && (!props.isDuel || isShared);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const rnd = useLCG ? lcgRandom() : Math.random()
    const j = Math.floor(rnd * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function initRosco(force = false) {
  const allData = roscoData[locale.value] || roscoData['es']
  if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.roscoData && !force && !props.isDuel && !props.isRace) {
    const teamId = multiplayerStore.room?.gameConfig?.teams[astroStore.user]
    const data = multiplayerStore.room?.gameConfig?.roscoData[teamId] || multiplayerStore.room?.gameConfig?.roscoData.default
    if (data && (roscoLetters.value.length === 0 || force)) {
      roscoLetters.value = data.map(l => ({ ...l, status: 'pending' }))
      currentIndex.value = 0; rocketPos.x = starPoints[0].x; rocketPos.y = starPoints[0].y
    }
  } else if (roscoLetters.value.length === 0 || force) {
    if (!props.isMultiplayer || isHost.value || props.isDuel || props.isRace) {
      const uniqueChars = []; const seenChars = new Set()
      const shuffledPool = shuffleArray([...allData])
      for (const item of shuffledPool) {
        if (!seenChars.has(item.char)) { uniqueChars.push(item); seenChars.add(item.char) }
        if (uniqueChars.length >= 5) break
      }
      const data = uniqueChars.map(l => ({ ...l, status: 'pending' }))
      roscoLetters.value = data; currentIndex.value = 0; rocketPos.x = starPoints[0].x; rocketPos.y = starPoints[0].y
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({ type: 'ROSCO_SYNC', data })
        if (props.isDuel || props.isRace) {
            multiplayerStore.sendGameAction({
                type: 'SPECTATOR_SYNC',
                data: data,
                index: currentIndex.value,
                score: score.value,
                timeLeft: timeLeft.value
            })
        }
        if (!props.isDuel && !props.isRace) {
          multiplayerStore.sendGameAction({ type: 'INDEX_SYNC', index: 0 })
        }
      }
    } else {
      multiplayerStore.sendGameAction({ type: 'REQUEST_ROSCO_SYNC' })
    }
  }
}

function startGame() {
  isPlaying.value = true
  gameFinished.value = false
  score.value = 0
  timeLeft.value = props.duration
  
  const boost = astroStore.equippedSkinBoost
  if (boost && boost.type === 'time') {
    timeLeft.value = Math.floor(props.duration * boost.multiplier)
  }

  initRosco()
  startTimer()
}

function sendTextHint() {
  const hint = textHint.value?.trim()
  if (!hint) return
  if (!isValidHint(hint, currentLetter.value.answer)) {
    feedbackMessage.value = t('spelledRosco.msgCheatDetected'); feedbackColor.value = 'error'; showFeedback.value = true; textHint.value = ''; return
  }
  multiplayerStore.sendGameAction({ type: 'PARTNER_EMOJI', emoji: hint })
  textHint.value = ''
}

onMounted(() => {
  if (multiplayerStore.room?.gameConfig?.seed) {
    const s = multiplayerStore.room.gameConfig.seed
    currentSeed = typeof s === 'string' ? s.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : s
  }
  
  if (props.isSpectator && props.spectatedPlayer) {
    const lastSync = multiplayerStore.lastSpectatorSync[props.spectatedPlayer]
    if (lastSync && (lastSync.type === 'SPECTATOR_SYNC' || lastSync.type === 'ROSCO_SYNC')) {
      applySpectatorSync(lastSync)
    }
  } else {
    initRosco()
    setTimeout(() => { 
      if (!gameFinished.value && !isPlaying.value) startGame() 
    }, (props.isMultiplayer || props.isRace || props.autoStart) ? 3000 : 0)
  }
})

function applySpectatorSync(data) {
  if (!data) return
  if (data.data) roscoLetters.value = data.data
  if (data.index !== undefined && data.index !== currentIndex.value) {
     const start = letterPositions[currentIndex.value]
     const end = letterPositions[data.index]
     if (!rocketAnimating.value) {
       rocketAnimating.value = true
       animateRocketPath(start, end).then(() => {
         currentIndex.value = data.index
         rocketAnimating.value = false
       })
     } else {
       currentIndex.value = data.index // Sync instantáneo si ya se está moviendo
     }
  }
  if (data.score !== undefined) score.value = data.score
  if (data.timeLeft !== undefined) timeLeft.value = data.timeLeft
  if (!isPlaying.value) {
      isPlaying.value = true
      startTimer()
  }
}

watch(() => multiplayerStore.room, () => initRosco(), { deep: true })
const emitTyping = throttle(text => {
  if (props.isMultiplayer && !isTranslator.value && !isSender.value && !props.isDuel) multiplayerStore.sendGameAction({ type: 'TYPING_SYNC', text })
}, 150)
let lastMouseSync = 0
const gameArea = ref(null)
function handleMouseMove(e) {
  if (!isPlaying.value || props.isSpectator || !gameArea.value) return
  const rect = gameArea.value.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100

  const now = Date.now()
  if (props.isMultiplayer && now - lastMouseSync > 50) {
    lastMouseSync = now
    multiplayerStore.sendGameAction({ type: 'MOUSE_MOVE', x, y })
    
    // Sync periódico para espectadores
    if (isAuthority.value) {
      multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        score: score.value,
        timeLeft: timeLeft.value,
        index: currentIndex.value,
        data: roscoLetters.value
      })
    }
  }
}

function onTyping() { emitTyping(rawInput.value) }

  watch(() => multiplayerStore.lastMessage, msg => {
  if (!msg) return

  // LÓGICA ESPECTADOR
  if (props.isSpectator) {
    if (msg.from === props.spectatedPlayer && msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'SPECTATOR_SYNC' || msg.action?.type === 'ROSCO_SYNC' || msg.action?.type === 'INDEX_SYNC') {
        applySpectatorSync(msg.action)
      }
      if (msg.action?.type === 'TIME_SYNC') {
        timeLeft.value = msg.action.timeLeft
      }
    }
    return
  }

  if (msg.type === 'ROUND_ENDED_BY_WINNER') { gameFinished.value = true; emitExit() }
  if (msg.type === 'GAME_ACTION') {
    const a = msg.action
    if (a.type === 'ADVANCE_LETTER' && (isSender.value || isTranslator.value) && !props.isDuel && !props.isRace) {
      roscoLetters.value[a.index].status = a.status; score.value = a.score
      if (a.status === 'correct') timeLeft.value = Math.min(timeLeft.value + 20, 999)
      advanceTurn()
    }
    if (a.type === 'ROSCO_SYNC' && (props.isDuel || props.isRace || !isHost.value) && msg.from !== astroStore.user) {
      roscoLetters.value = a.data; currentIndex.value = 0; rocketPos.x = starPoints[0].x; rocketPos.y = starPoints[0].y
    }
    if (a.type === 'TIME_SYNC' && !isHost.value && !props.isDuel && !props.isRace) {
      timeLeft.value = a.timeLeft
      if (timeLeft.value <= 0) finishGame()
    }
    if (a.type === 'INDEX_SYNC' && !isHost.value && !props.isDuel && !props.isRace) currentIndex.value = a.index
    if (a.type === 'SABOTAGE' && a.subtype === 'REDUCE_TIME' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (a.amount || 15))
    }
    if (a.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (a.amount || 8))
    }
    if (a.type === 'REQUEST_SYNC' && isHost.value && isPlaying.value) {
      multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        score: score.value,
        timeLeft: timeLeft.value,
        index: currentIndex.value,
        data: roscoLetters.value
      })
    }
  }
  if (msg.type === 'GAME_ROLES_SWAPPED') {
    feedbackMessage.value = t('spelledRosco.rolesSwapped'); feedbackColor.value = 'warning'; showFeedback.value = true
    setTimeout(() => showFeedback.value = false, 2000)
  }
}, { immediate: true })

function checkAnswer() {
  if (isChecking.value || gameFinished.value || isTranslator.value || isSender.value) return
  isChecking.value = true
  const userAnswer = normalize(rawInput.value)
  const correctAnswer = normalize(currentLetter.value.answer)
  handleResult(userAnswer === correctAnswer ? 'correct' : 'incorrect')
}

function handleResult(status) {
  roscoLetters.value[currentIndex.value].status = status
  if (status === 'correct') {
    score.value += 100 + Math.floor(timeLeft.value / 2)
    if (anyRivalAlive.value) {
      timeLeft.value = Math.min(timeLeft.value + 20, 999)
    }
    feedbackMessage.value = t('spelledRosco.msgCorrect'); feedbackColor.value = 'success'; playFeedbackSound('success')
    if (props.isRace) multiplayerStore.rechargeFuel(25)
    if (props.isMultiplayer) {
      const sabo = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
      multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: sabo ? 30 : 15 })
      if (props.isDuel) multiplayerStore.sendGameAction({ type: 'TIME_PENALTY', amount: sabo ? 20 : 10 })
    }
  } else {
    score.value = Math.max(0, score.value - 25); timeLeft.value = Math.max(0, timeLeft.value - 10)
    feedbackMessage.value = t('spelledRosco.msgIncorrect'); feedbackColor.value = 'error'; playFeedbackSound('error')
  }
  showFeedback.value = true
  if (props.isMultiplayer && !props.isDuel && !props.isRace) {
    multiplayerStore.sendGameAction({ type: 'ADVANCE_LETTER', index: currentIndex.value, status, score: score.value })
  }
  
  if (props.isMultiplayer && (props.isDuel || props.isRace)) {
    multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        data: roscoLetters.value,
        index: currentIndex.value,
        score: score.value,
        timeLeft: timeLeft.value
    })
  }
  setTimeout(() => { showFeedback.value = false; rawInput.value = ''; isChecking.value = false; advanceTurn() }, 1000)
}

function skipLetter() {
  if (isChecking.value || gameFinished.value || isTranslator.value || isSender.value) return
  advanceTurn()
}

function advanceTurn() {
  if (rocketAnimating.value) return
  
  let next = (currentIndex.value + 1) % roscoLetters.value.length; let loops = 0
  while (roscoLetters.value[next].status !== 'pending' && loops < roscoLetters.value.length) { 
    next = (next + 1) % roscoLetters.value.length; loops++ 
  }
  
  if (loops >= roscoLetters.value.length) {
    if (timeLeft.value > 5) {
      feedbackMessage.value = t('spelledRosco.msgAllCorrectNext') || 'COMPLETADO'; feedbackColor.value = 'success'; showFeedback.value = true
      setTimeout(() => { if (!gameFinished.value) initRosco(true) }, 3000)
    } else { finishGame() }
  } else {
    const startPointIndex = letterPositions[currentIndex.value]
    const endPointIndex = letterPositions[next]
    rocketAnimating.value = true
    animateRocketPath(startPointIndex, endPointIndex).then(() => {
      currentIndex.value = next
      rocketAnimating.value = false
      if (props.isMultiplayer && isHost.value && !props.isDuel && !props.isRace) {
        multiplayerStore.sendGameAction({ type: 'INDEX_SYNC', index: currentIndex.value })
      }
    })
  }
}

async function animateRocketPath(start, end) {
  let currentPos = start
  while (currentPos !== end) {
    const nextPos = (currentPos + 1) % 10
    await animateSegment(starPoints[currentPos], starPoints[nextPos])
    visitedSegments.value.add(currentPos)
    currentPos = nextPos
  }
}

function animateSegment(p1, p2) {
  return new Promise(resolve => {
    const duration = 200
    const start = Date.now()
    const frame = () => {
      const elapsed = Date.now() - start
      const t = Math.min(1, elapsed / duration)
      rocketPos.x = p1.x + (p2.x - p1.x) * t
      rocketPos.y = p1.y + (p2.y - p1.y) * t
      
      if (Math.random() > 0.5) {
        trailParticles.value.push({
          id: Math.random(),
          x: rocketPos.x,
          y: rocketPos.y,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#00e5ff' : '#ffea00',
          opacity: 1
        })
      }

      if (t < 1) requestAnimationFrame(frame)
      else resolve()
    }
    frame()
  })
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)
  let lastTick = Date.now()
  timerInterval = setInterval(() => {
    if (gameFinished.value || props.isPaused) {
      lastTick = Date.now() // Reset tick to avoid jump when unpausing
      return
    }
    if (!props.isMultiplayer || isHost.value || props.isDuel || props.isRace) {
      const now = Date.now()
      const delta = Math.floor((now - lastTick) / 1000)
      if (delta >= 1) {
        timeLeft.value = Math.max(0, timeLeft.value - delta)
        lastTick += delta * 1000

        if (props.isMultiplayer) {
          if (isHost.value || props.isDuel || props.isRace) {
            multiplayerStore.timeLeft = timeLeft.value
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
            
            // Sync para observadores
            multiplayerStore.sendGameAction({
              type: 'SPECTATOR_SYNC',
              score: score.value,
              timeLeft: timeLeft.value,
              index: currentIndex.value,
              data: roscoLetters.value
            })
          }
        }
        if (timeLeft.value === 0) finishGame()
      }
    }
  }, 500)
}

function finishGame() { 
  if (gameFinished.value) return
  gameFinished.value = true
  if (timerInterval) clearInterval(timerInterval)
  if (props.isMultiplayer) {
    multiplayerStore.submitRoundResult()
  }
  if (!props.isMultiplayer || props.isRace || props.isDuel) {
    setTimeout(() => emitExit(), 1000)
  }
}

function emitExit() { emit('game-over', finalReward.value) }
function returnToMenu() { emitExit() }

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const starPath = computed(() => {
  return starPoints.reduce((acc, p, i) => acc + (i === 0 ? 'M' : 'L') + p.x + ',' + p.y, '') + 'Z'
})

const rocketTransform = computed(() => {
  return {
    transform: `translate(${rocketPos.x}px, ${rocketPos.y}px)`
  }
})

setInterval(() => {
  trailParticles.value = trailParticles.value.filter(p => {
    p.opacity -= 0.05
    return p.opacity > 0
  })
}, 50)

watch(score, (newScore) => {
  if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
  if (props.isDuel || props.isRace) {
    multiplayerStore.roundScores = { ...multiplayerStore.roundScores, [astroStore.user]: newScore }
  }
})
</script>

<style scoped>
.game-container {
  user-select: none;
}

.star-decor-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

.hud-pill {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  padding: 10px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

.border-cyan { border: 1px solid rgba(0, 229, 255, 0.3); }
.border-amber { border: 1px solid rgba(255, 179, 0, 0.3); }

.stat-item { display: flex; align-items: center; }

.timer-critical {
  animation: timer-pulse 0.5s infinite alternate;
}

@keyframes timer-pulse {
  from { transform: scale(1); filter: drop-shadow(0 0 0 red); }
  to { transform: scale(1.1); filter: drop-shadow(0 0 10px red); }
}

.rosco-visualizer {
  z-index: 5;
}

.star-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 4;
}

.star-segment {
  fill: rgba(0, 229, 255, 0.02);
  stroke: none;
  transition: all 0.3s;
}

.star-segment.active { fill: rgba(0, 229, 255, 0.1); }
.star-segment.correct { fill: rgba(0, 230, 118, 0.1); }
.star-segment.incorrect { fill: rgba(255, 82, 82, 0.1); }

.letter-node {
  fill: #1e293b;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.letter-node.active {
  stroke: #00e5ff;
  stroke-width: 4;
  r: 25;
  filter: drop-shadow(0 0 10px #00e5ff);
}

.letter-node.correct { stroke: #00e676; fill: rgba(0, 230, 118, 0.1); }
.letter-node.incorrect { stroke: #ff5252; fill: rgba(255, 82, 82, 0.1); }

.letter-text {
  fill: white;
  font-weight: 900;
  font-size: 18px;
  text-anchor: middle;
  pointer-events: none;
}

.rocket-sprite {
  transition: transform 0.1s linear;
}

.rocket-icon {
  transform: rotate(90deg);
}

.question-card {
  z-index: 10;
  position: relative;
  background: rgba(15, 23, 42, 0.95);
}

.letter-badge {
  background: #00e5ff;
  color: #000;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 1.1rem;
}

.question-text {
  font-size: 1.8rem;
  line-height: 1.4;
  color: white;
  min-height: 100px;
}

.answer-input :deep(input) {
  font-size: 1.4rem;
  font-weight: bold;
  text-align: center;
  color: #00e5ff !important;
}

.partner-hint-bubble {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 229, 255, 0.9);
  padding: 10px 20px;
  border-radius: 20px;
  color: #000;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.5);
  animation: hint-bounce 2s infinite ease-in-out;
}

@keyframes hint-bounce {
  0%, 100% { transform: translate(-50%, -60%); }
  50% { transform: translate(-50%, -40%); }
}

.hint-label { font-size: 10px; font-weight: bold; opacity: 0.7; }
.hint-content { font-size: 24px; font-weight: 900; }

.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 2px solid rgba(0, 229, 255, 0.3); }

.hint-sender-box {
  background: rgba(0, 229, 255, 0.05);
  border-radius: 12px;
  border: 1px dashed rgba(0, 229, 255, 0.2);
}
</style>
