<template>
  <v-container ref="gameArea" class="d-flex flex-column align-center justify-center game-container w-100 opendyslexic" :class="{ 'game-paused': props.isPaused, 'freeze-cursor-hide': multiplayerStore.activeBossEffect === 'FREEZE' }" fluid style="min-height: 800px" @mousemove="handleMouseMove" @click="handlePlayAreaClick">

    <v-card
      v-if="!isPlaying && !isGameOver && !isWaitingForOthers"
      class="pa-10 text-center bg-grey-darken-4 border-cyan"
      max-width="800"
      rounded="xl"
      width="100%"
    >
      <v-icon class="mb-6 animate-bounce" color="cyan-accent-3" icon="mdi-timer-sand" size="100" />
      <h1 class="text-h2 font-weight-black text-white mb-6">{{ $t('rhymeSquad.title') }}</h1>
      <p class="text-h5 text-grey-lighten-1 mb-10" v-html="$t('rhymeSquad.desc')" />

      <!-- AVISOS DE ROLES MULTIJUGADOR (Solo COOP 2vs2) -->
      <div v-if="isCoop2vs2" class="mb-8">
        <v-row>
          <v-col cols="12" md="6">
            <div
              class="pa-6 rounded-xl border-2 mb-4 h-100 d-flex flex-column align-center justify-center transition-all"
              :class="subRole === 'catcher' ? 'bg-green-darken-4 border-green' : 'bg-grey-darken-3 opacity-50'"
            >
              <v-icon :color="subRole === 'catcher' ? 'green-accent-3' : 'grey'" size="64" class="mb-4">mdi-basket-fill</v-icon>
              <h2 class="text-h4 font-weight-black mb-2" :class="subRole === 'catcher' ? 'text-green-accent-3' : 'text-grey'">{{ $t('rhymeSquad.roleCatcher') || 'RECOL·LECTOR' }}</h2>
              <p class="text-body-1 text-white">{{ $t('rhymeSquad.catcherDesc') || '¡Atrapa només les paraules que rimin amb la pista!' }}</p>
              <v-chip v-if="subRole === 'catcher'" color="green-accent-3" class="mt-4 font-weight-bold">TEU ROL</v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div
              class="pa-6 rounded-xl border-2 mb-4 h-100 d-flex flex-column align-center justify-center transition-all"
              :class="subRole === 'sniper' ? 'bg-red-darken-4 border-red' : 'bg-grey-darken-3 opacity-50'"
            >
              <v-icon :color="subRole === 'sniper' ? 'red-accent-3' : 'grey'" size="64" class="mb-4">mdi-target</v-icon>
              <h2 class="text-h4 font-weight-black mb-2" :class="subRole === 'sniper' ? 'text-red-accent-3' : 'text-grey'">{{ $t('rhymeSquad.roleSniper') || 'DESTRUCTOR' }}</h2>
              <p class="text-body-1 text-white">{{ $t('rhymeSquad.sniperDesc') || '¡Destrueix les paraules que NO rimin per protegir al company!' }}</p>
              <v-chip v-if="subRole === 'sniper'" color="red-accent-3" class="mt-4 font-weight-bold">TEU ROL</v-chip>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- AVISO DE DUELO -->
      <div v-if="props.isDuel || props.isRace" class="mb-8 pa-6 rounded-xl bg-orange-darken-4 border-orange border-2 d-flex flex-column align-center justify-center">
        <v-icon color="orange-accent-3" size="80" class="mb-4 animate-pulse">mdi-sword-cross</v-icon>
        <h2 class="text-h3 font-weight-black text-orange-accent-1 mb-2">{{ props.isRace ? 'MISSIÓ PLANETÀRIA' : '¡DUELO COMPETITIVO!' }}</h2>
        <p class="text-h6 text-white text-center">Atrapa todas las rimas posibles. Tus aciertos restarán tiempo a tu rival.</p>
      </div>

      <div v-if="isCoop2vs2 && !isHost" class="mt-4 text-center">
        <v-progress-circular color="cyan-accent-3" indeterminate size="32" />
        <p class="text-h6 text-cyan-accent-3 mt-4">{{ $t('rhymeSquad.waitingForHost') || 'Esperant que el Comandant iniciï la missió...' }}</p>
      </div>

      <v-btn
        v-if="!isMultiplayer"
        block
        class="font-weight-black text-black text-h6"
        color="cyan-accent-3"
        height="60"
        rounded="pill"
        size="x-large"
        @click="handleStartClick"
      >
        {{ $t('rhymeSquad.startMission') }}
      </v-btn>
      <div v-else-if="isHost || !isCoop2vs2" class="text-h6 text-cyan-accent-2 animate-pulse mt-4">
        {{ $t('multiplayerLobby.autoStarting') || 'LA MISIÓN COMENZARÁ TRAS EL BRIEFING...' }}
      </div>
    </v-card>

    <div v-if="isWaitingForOthers" class="start-overlay d-flex flex-column align-center justify-center">
      <v-card class="pa-10 text-center bg-slate-900 border-cyan rounded-xl elevation-24">
        <v-progress-circular indeterminate color="cyan-accent-3" size="64" class="mb-4" />
        <h2 class="text-h4 font-weight-bold text-white mb-2">¡Partida Finalizada!</h2>
        <p class="text-h6 text-grey-lighten-1">Esperando a que el rival termine...</p>
      </v-card>
    </div>

    <template v-else-if="isPlaying">
      <!-- Header Arcade Persistente -->
      <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'BOSS'" class="arcade-hud w-100 pa-4 d-flex justify-space-between align-center">
        <div class="hud-left d-flex gap-4">
          <div class="arcade-stat score">
            <span class="label">SCORE</span>
            <span class="value">{{ score.toString().padStart(6, '0') }}</span>
          </div>
          <div class="arcade-stat combo" v-if="combo > 0">
            <span class="label">COMBO</span>
            <span class="value text-cyan-accent-2">x{{ combo }}</span>
          </div>
        </div>

        <div class="hud-center">
          <div v-if="currentTarget" class="mission-objective pa-4 rounded-xl">
            <div class="objective-label">{{ $t('rhymeSquad.findRhymes') }}</div>
            <div class="objective-word glow-text">{{ currentTarget.word.toUpperCase() }}</div>
            <div class="objective-ending text-caption text-amber-accent-1">{{ currentTarget.ending.toUpperCase() }}</div>
          </div>
        </div>

        <div class="hud-right d-flex gap-4 align-center">
          <div v-if="!isMultiplayer" class="arcade-stat time" :class="{ 'critical': timeLeft <= 10 }">
            <v-icon icon="mdi-timer-outline" class="mr-2" />
            <span class="value">{{ timeLeft }}s</span>
          </div>
          <div class="lives-display d-flex gap-1">
            <v-icon 
              v-for="i in (isCoop2vs2 ? 10 : 3)" 
              :key="i"
              :icon="i <= lives ? 'mdi-heart' : 'mdi-heart-outline'"
              :color="i <= lives ? 'red-accent-2' : 'grey-darken-2'"
              size="24"
              class="heart-icon"
            />
          </div>
        </div>
      </div>

      <div class="play-area w-100 flex-grow-1 position-relative overflow-hidden" ref="playArea" style="min-height: 80vh; height: calc(100vh - 160px);">
        <!-- Carril Central Vertical de Juego rectangular -->
        <div class="vertical-game-track mx-auto position-relative h-100" style="max-width: 680px; width: 95%; background: rgba(15, 23, 42, 0.45); border-left: 1px dashed rgba(0,229,255,0.2) !important; border-right: 1px dashed rgba(0,229,255,0.2) !important;">
          <!-- Límite Láser de Seguridad discontinuo -->
          <div class="laser-boundary"></div>

          <transition-group name="word-pop">
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
              <div class="word-bubble" :class="[getWordStatusClass(word.status), { 'bubble-turbo': isTurbo }]">
                {{ word.text }}
              </div>
            </div>
          </transition-group>
        </div>

        <transition name="fade-up">
          <div v-if="showTimeBonus" class="time-bonus-feedback text-h2 font-weight-black text-green-accent-3">+2s</div>
        </transition>

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
              size="150"
              class="feedback-icon-anim"
            >
              mdi-check-circle
            </v-icon>
            <v-icon
              v-else
              color="error"
              size="150"
              class="feedback-icon-anim"
            >
              mdi-close-circle
            </v-icon>
          </div>
        </v-overlay>
        <!-- Cursor de Espectador -->
        <div 
          v-if="props.isSpectator && props.spectatedPlayer && multiplayerStore.remoteCursors[props.spectatedPlayer]" 
          class="spectator-cursor"
          :style="{
            left: multiplayerStore.remoteCursors[props.spectatedPlayer].x + '%',
            top: multiplayerStore.remoteCursors[props.spectatedPlayer].y + 'px'
          }"
        >
          <div class="cursor-dot"></div>
          <div class="cursor-label">{{ props.spectatedPlayer }}</div>
        </div>

        <!-- Cursor Local Virtual (Hielo) -->
        <div 
          v-if="multiplayerStore.activeBossEffect === 'FREEZE' && isPlaying" 
          class="local-virtual-cursor"
          :style="{
            left: virtualMouseX + '%',
            top: virtualMouseY + '%'
          }"
        >
          <div class="cursor-dot-freeze"></div>
        </div>
      </div>
    </template>

    <v-overlay
      v-if="!isMultiplayer"
      v-model="isGameOver"
      class="align-center justify-center"
      persistent
      z-index="100"
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

  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { rhymeData } from '@/data/rhymeGamesData'
import { useAstroStore } from '@/stores/astroStore'
import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'

const { t, locale } = useI18n()
const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()

// --- LCG RANDOM FOR SYNC ---
let currentSeed = 0
function lcgRandom() {
  currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
  return currentSeed / 4294967296
}

const emit = defineEmits(['game-over', 'action'])
const props = defineProps({
  isMultiplayer: { type: Boolean, default: false },
  isRace: { type: Boolean, default: false },
  isDuel: { type: Boolean, default: false },
  autoStart: { type: Boolean, default: false },
  duration: { type: Number, default: 60 },
  isPaused: { type: Boolean, default: false },
  isSpectator: { type: Boolean, default: false },
  spectatedPlayer: { type: String, default: null },
})

const isCoop2vs2 = computed(() => {
  return props.isMultiplayer && multiplayerStore.room?.gameConfig?.modality === '2vs2'
})
const subRole = computed(() => {
  if (!isCoop2vs2.value) return 'catcher'
  return multiplayerStore.subRole || 'catcher'
})
const isHost = computed(() => {
  const host = multiplayerStore.room?.host
  return (typeof host === 'object' ? host.username || host.user : host) === astroStore.user
})
const isAuthority = computed(() => {
  if (props.isSpectator) return false
  if (!props.isMultiplayer) return true
  const hostName = (typeof multiplayerStore.room?.host === 'object' ? multiplayerStore.room?.host?.username || multiplayerStore.room?.host?.user : multiplayerStore.room?.host)
  if (hostName === astroStore.user) return true
  const modality = multiplayerStore.room?.gameConfig?.modality
  const mode = multiplayerStore.room?.gameConfig?.mode
  if (props.isDuel || props.isRace || modality === '1vs1' || mode === 'TOURNAMENT' || mode === 'RACE' || mode === 'BOSS') return true
  return false
})
const anyRivalAlive = computed(() => {
  if (!props.isMultiplayer) return true
  const rivals = Object.keys(multiplayerStore.playerTimes || {}).filter(u => u !== astroStore.user)
  if (rivals.length === 0) return true 
  return rivals.some(u => (multiplayerStore.playerTimes?.[u] || 0) > 0)
})
const isWaitingForOthers = ref(false)

const currentDictionary = computed(() => {
  return rhymeData[locale.value] || rhymeData['es']
})

const playArea = ref(null)
const isPlaying = ref(false)
const isGameOver = ref(false)
const score = ref(0)
const lives = ref(isCoop2vs2.value ? 10 : 3)
const timeLeft = ref(props.duration)
const combo = ref(0)
const maxCombo = ref(0)
const correctHits = ref(0)
const incorrectHits = ref(0)
const isTurbo = ref(false)
const showTimeBonus = ref(false)
const showFeedback = ref(false)
const feedbackType = ref('success')
const virtualMouseX = ref(50)
const virtualMouseY = ref(50)
const targetX = ref(50)
const targetY = ref(50)

// --- MULTIJUGADOR: SEGUIMIENTO DE RATÓN Y SYNC ---
let lastMouseSync = 0
const gameArea = ref(null)
function handleMouseMove(e) {
  if (!isPlaying.value || props.isSpectator || !gameArea.value) return
  
  const el = gameArea.value.$el || gameArea.value
  if (!el.getBoundingClientRect) return
  
  const rect = el.getBoundingClientRect()
  targetX.value = ((e.clientX - rect.left) / rect.width) * 100
  targetY.value = ((e.clientY - rect.top) / rect.height) * 100

  if (multiplayerStore.activeBossEffect !== 'FREEZE') {
    virtualMouseX.value = targetX.value
    virtualMouseY.value = targetY.value
  }

  const now = Date.now()
  if (props.isMultiplayer && now - lastMouseSync > 50) {
    lastMouseSync = now
    multiplayerStore.sendGameAction({ type: 'MOUSE_MOVE', x: virtualMouseX.value, y: virtualMouseY.value })
    
    if (isAuthority.value) {
      multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        score: score.value,
        lives: lives.value,
        timeLeft: timeLeft.value,
        target: currentTarget.value
      })
    }
  }
}

function tickFreezeEffect() {
  if (multiplayerStore.activeBossEffect === 'FREEZE') {
    const damping = 0.07
    virtualMouseX.value += (targetX.value - virtualMouseX.value) * damping
    virtualMouseY.value += (targetY.value - virtualMouseY.value) * damping
  }
  requestAnimationFrame(tickFreezeEffect)
}

function handlePlayAreaClick(e) {
  if (!isPlaying.value || props.isSpectator || multiplayerStore.activeBossEffect !== 'FREEZE') return

  // Cuando está congelado, el clic se procesa en la posición virtual
  const words = activeWords.value.filter(w => w.status === 'falling')
  const foundWord = words.find(w => {
    // Aproximación de colisión (RhymeSquad usa % para X y px para Y... espera, yo lo cambié a % arriba?)
    // Mirando el template, line 127: left: word.x + '%', top: word.y + 'px'
    // Tengo que convertir virtualMouseY (%) a PX para comparar con word.y
    const el = gameArea.value.$el || gameArea.value
    const rect = el.getBoundingClientRect()
    const vy_px = (virtualMouseY.value / 100) * rect.height
    
    const dx = Math.abs(w.x - virtualMouseX.value)
    const dy = Math.abs(w.y - vy_px)
    return dx < 8 && dy < 40 // Ajuste fino de la caja de colisión
  })

  if (foundWord) {
    checkWord(foundWord)
  }
}

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
let currentSpeed = 2.2
let bonusTimeout = null

function handleStartClick() {
  if (isCoop2vs2.value && isAuthority.value) {
    multiplayerStore.sendGameAction({ type: 'RHYME_START' })
  }
  startGame()
  requestAnimationFrame(tickFreezeEffect)
  
  if (props.isMultiplayer && isAuthority.value && (props.isDuel || props.isRace)) {
    multiplayerStore.sendGameAction({
      type: 'SPECTATOR_SYNC',
      target: currentTarget.value,
      score: score.value,
      lives: lives.value,
      timeLeft: timeLeft.value
    })
  }
}

function startGame() {
  isPlaying.value = true
  isGameOver.value = false
  isWaitingForOthers.value = false
  score.value = 0
  lives.value = isCoop2vs2.value ? 10 : 3
  timeLeft.value = props.duration
  combo.value = 0
  maxCombo.value = 0
  correctHits.value = 0
  incorrectHits.value = 0
  isTurbo.value = false
  activeWords.value = []
  currentSpawnRate = 1200
  currentSpeed = 2.2

  if (!props.isMultiplayer || isAuthority.value) {
    if (!currentTarget.value) pickNewTarget()
    if (isCoop2vs2.value && isAuthority.value) {
      multiplayerStore.sendGameAction({ type: 'RHYME_TARGET_SYNC', target: currentTarget.value })
    }
  }
  if (gameLoopInterval) clearInterval(gameLoopInterval)
  gameLoopInterval = setInterval(gameTick, 16)

  let lastTick = Date.now()
  timerInterval = setInterval(() => {
    if (!isPlaying.value || props.isPaused || isWaitingForOthers.value) return
    if (isAuthority.value) {
      const now = Date.now()
      const delta = Math.floor((now - lastTick) / 1000)
      if (delta >= 1) {
        lastTick = now
        if (isAuthority.value) {
          const isSuddenDeath = multiplayerStore.room?.status === 'SUDDEN_DEATH'
          if (!isSuddenDeath) {
            timeLeft.value = Math.max(0, timeLeft.value - Math.floor(delta))
          }
          multiplayerStore.timeLeft = timeLeft.value
          if (!isSuddenDeath) {
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }
          
          multiplayerStore.sendGameAction({
            type: 'SPECTATOR_SYNC',
            target: currentTarget.value,
            score: score.value,
            lives: lives.value,
            timeLeft: timeLeft.value
          })
        }
      }
      if (timeLeft.value <= 0) {
        timeLeft.value = 0
        if (isCoop2vs2.value && isAuthority.value) {
          multiplayerStore.sendGameAction({ type: 'RHYME_TIME_UP' })
        }
        endGame()
      }
    }
  }, 500)
}

function pickNewTarget() {
  const isShared = multiplayerStore.room?.gameConfig?.sharedChallenge
  const rnd = (props.isMultiplayer && (!props.isDuel || isShared)) ? lcgRandom() : Math.random()
  const dict = currentDictionary.value
  currentTarget.value = dict[Math.floor(rnd * dict.length)]
}

let lastSpawnTime = 0
function gameTick() {
  if (!isPlaying.value || props.isPaused || isWaitingForOthers.value) return

  if (isAuthority.value) {
    const now = Date.now()
    if (now - lastSpawnTime > currentSpawnRate) {
      spawnWord()
      lastSpawnTime = now
    }
  }

  activeWords.value.forEach(word => {
    if (word.status === 'falling') {
      word.y += word.speed
    }
  })

  const limit = playArea.value ? playArea.value.clientHeight - 80 : 620
  const outIndices = []
  activeWords.value.forEach((word, index) => {
    if (word.y > limit) {
      if (word.status === 'falling') {
        if (word.isRhyme && isAuthority.value) {
          incorrectHits.value++
          takeDamage()
          triggerFeedback('error')
        }
      }
      outIndices.push(index)
    }
  })

  for (let i = outIndices.length - 1; i >= 0; i--) {
    activeWords.value.splice(outIndices[i], 1)
  }

  if (isAuthority.value && score.value > 0 && score.value % 500 === 0) {
    currentSpeed = Math.min(10, currentSpeed + 0.05)
    currentSpawnRate = Math.max(500, currentSpawnRate - 10)
  }
}

function spawnWord() {
  if (!isPlaying.value || !isAuthority.value) return
  
  let wordsToSpawn = 1
  if (isTurbo.value && Math.random() < 0.15) wordsToSpawn = 2
  
  const zones = [{ min: 5, max: 25 }, { min: 35, max: 55 }, { min: 65, max: 85 }]
  zones.sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < wordsToSpawn; i++) {
    const isRhyme = Math.random() < 0.35
    const wordList = isRhyme ? currentTarget.value.rhymes : currentTarget.value.fakes
    const wordText = wordList[Math.floor(Math.random() * wordList.length)]
    const targetZone = zones[i % zones.length]
    const posX = Math.random() * (targetZone.max - targetZone.min) + targetZone.min
    const newWord = {
      id: wordIdCounter++,
      text: wordText,
      isRhyme: isRhyme,
      status: 'falling',
      x: posX,
      y: -50 - (i * 100), // Spreads spawned words vertically to avoid clumping
      speed: isTurbo.value ? currentSpeed * 1.15 : currentSpeed,
    }
    activeWords.value.push(newWord)
    if (isCoop2vs2.value && isAuthority.value) {
      multiplayerStore.sendGameAction({ type: 'RHYME_SPAWN_WORD', word: newWord })
    }
  }
}

function checkWord(word) {
  if (!isPlaying.value || props.isPaused || isWaitingForOthers.value || word.status !== 'falling' || lives.value <= 0) return

  let isActionCorrect = false

  if (isCoop2vs2.value) {
    if (subRole.value === 'catcher') {
      isActionCorrect = word.isRhyme
    } else if (subRole.value === 'sniper') {
      isActionCorrect = !word.isRhyme
    }
  } else {
    isActionCorrect = word.isRhyme
  }

  if (isActionCorrect) {
    word.status = 'correct'
    correctHits.value++
    if (lives.value > 0) {
      if (anyRivalAlive.value) {
        timeLeft.value = Math.min(props.duration || 90, timeLeft.value + 2)
        triggerTimeBonusVisual()
      }
    }
    const timeBonus = Math.floor(timeLeft.value / 10)
    score.value += (isTurbo.value ? 20 : 10) + timeBonus
    combo.value++
    if (combo.value > maxCombo.value) maxCombo.value = combo.value
    if (combo.value >= 10) isTurbo.value = true
    if (combo.value % 5 === 0 && isAuthority.value) pickNewTarget()
    triggerFeedback('success')
    
    if (props.isRace) {
      multiplayerStore.rechargeFuel(2)
    }

      if (props.isMultiplayer) {
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({
          type: 'SABOTAGE',
          subtype: 'REDUCE_TIME',
          amount: isSaboteurActive ? 6 : 3,
        })

        // LÓGICA MODO JEFE
        if (multiplayerStore.room?.gameConfig?.mode === 'BOSS') {
          const isBoss = multiplayerStore.room.gameConfig.boss === astroStore.user
          if (!isBoss) {
            multiplayerStore.sendGameAction({ type: 'HERO_ATTACK' })
          }
        }

        if (props.isDuel) {
          multiplayerStore.sendGameAction({
            type: 'TIME_PENALTY',
            amount: isSaboteurActive ? 8 : 4,
          })
        }
      }
  } else {
    word.status = 'incorrect'
    incorrectHits.value++
    takeDamage()
    triggerFeedback('error')
  }

  if (props.isMultiplayer) {
    if (isCoop2vs2.value) {
      multiplayerStore.sendGameAction({ type: 'RHYME_CATCH', id: word.id, status: word.status })
    } else {
      multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        target: currentTarget.value,
        score: score.value,
        lives: lives.value,
        timeLeft: timeLeft.value
      })
    }
  }

  setTimeout(() => {
    const idx = activeWords.value.findIndex(w => w.id === word.id)
    if (idx !== -1) activeWords.value.splice(idx, 1)
  }, 350)
}

function triggerTimeBonusVisual() {
  showTimeBonus.value = true
  if (bonusTimeout) clearTimeout(bonusTimeout)
  bonusTimeout = setTimeout(() => {
    showTimeBonus.value = false
  }, 500)
}

function takeDamage() {
  if (isCoop2vs2.value) {
    if (isAuthority.value) {
      lives.value = Math.max(0, lives.value - 1)
      multiplayerStore.sendGameAction({ type: 'LIVES_SYNC', lives: lives.value })
    } else {
      multiplayerStore.sendGameAction({ type: 'TAKE_DAMAGE' })
    }
  } else {
    lives.value = Math.max(0, lives.value - 1)
  }

  combo.value = 0
  isTurbo.value = false

  if (lives.value <= 0) {
    endGame()
  }
}

function endGame(silent = false) {
  if (!isPlaying.value) return
  isPlaying.value = false
  clearInterval(gameLoopInterval)
  clearInterval(timerInterval)

  if (props.isMultiplayer && !silent) {
    isWaitingForOthers.value = true
    multiplayerStore.submitRoundResult()
  }
  emit('game-over', score.value)
}

function returnToMenu() {
  emit('game-over', score.value)
}

function getWordStatusClass(status) {
  if (status === 'correct') return 'word-correct'
  if (status === 'incorrect') return 'word-incorrect'
  return 'word-falling'
}

onMounted(() => {
  if (props.isSpectator && props.spectatedPlayer) {
    const lastSync = multiplayerStore.lastSpectatorSync[props.spectatedPlayer]
    if (lastSync && (lastSync.type === 'SPECTATOR_SYNC' || lastSync.type === 'RHYME_TARGET_SYNC')) {
      applySpectatorSync(lastSync)
    }
  } else if (props.isMultiplayer) {
    if (isCoop2vs2.value && !isHost.value) {
      multiplayerStore.sendGameAction({ type: 'REQUEST_RHYME_SYNC' })
    }
    
    const s = multiplayerStore.room?.gameConfig?.seed
    if (s) {
      currentSeed = typeof s === 'string' ? s.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : s
    }

    const startDelay = isCoop2vs2.value ? 3000 : 0
    setTimeout(() => {
      if (!isPlaying.value) {
        if (isAuthority.value) handleStartClick()
        else startGame()
      }
    }, startDelay)
  }
})

function applySpectatorSync(data) {
  if (!data) return
  if (data.target) currentTarget.value = data.target
  if (data.score !== undefined) score.value = data.score
  if (data.lives !== undefined) lives.value = data.lives
  if (data.timeLeft !== undefined) timeLeft.value = data.timeLeft
  if (!isPlaying.value) {
      isPlaying.value = true
      if (gameLoopInterval) clearInterval(gameLoopInterval)
      gameLoopInterval = setInterval(gameTick, 16)
  }
}

onUnmounted(() => {
  clearInterval(gameLoopInterval)
  clearInterval(timerInterval)
})

watch(() => multiplayerStore.lastMessage, msg => {
  if (!msg) return

  if (msg.type === 'ROUND_ENDED_BY_WINNER' && !isGameOver.value && isPlaying.value) {
    endGame(true)
    return
  }

  // LÓGICA DE ESPECTADOR
  if (props.isSpectator) {
    if (msg.from === props.spectatedPlayer && msg.type === 'GAME_ACTION') {
      const a = msg.action
      if (a.type === 'SPECTATOR_SYNC' || a.type === 'RHYME_TARGET_SYNC') applySpectatorSync(a)
      if (a.type === 'RHYME_SPAWN_WORD') activeWords.value.push(a.word)
      if (a.type === 'RHYME_CATCH' || a.type === 'RHYME_DESTROY') {
        const id = a.id
        const index = activeWords.value.findIndex(w => w.id === id)
        if (index !== -1) {
          activeWords.value[index].status = a.status || 'caught'
          setTimeout(() => {
            const idx = activeWords.value.findIndex(w => w.id === id)
            if (idx !== -1) activeWords.value.splice(idx, 1)
          }, 350)
        }
      }
      if (a.type === 'TIME_SYNC') timeLeft.value = a.timeLeft
      if (a.type === 'LIVES_SYNC') {
        lives.value = a.lives
        if (lives.value <= 0) endGame()
      }
    }
    return
  }

  // LÓGICA DE JUGADOR NORMAL
  if (msg.type === 'TIME_ATTACK') {
    timeLeft.value = Math.max(0, timeLeft.value - 3)
    triggerFeedback('error')
  }

  if (msg.type === 'GAME_ACTION') {
    const a = msg.action
    if (isCoop2vs2.value) {
      if (a.type === 'RHYME_START' && !isAuthority.value) startGame()
      if (a.type === 'RHYME_SPAWN_WORD' && !isAuthority.value) {
        activeWords.value.push(a.word)
      }
      if (a.type === 'RHYME_CATCH') {
        const id = a.id
        const index = activeWords.value.findIndex(w => w.id === id)
        if (index !== -1) {
          activeWords.value[index].status = a.status
          if (a.status === 'correct' && isAuthority.value) {
            const timeBonus = Math.floor(timeLeft.value / 10)
            score.value += (isTurbo.value ? 20 : 10) + timeBonus
          }
          setTimeout(() => {
            const idx = activeWords.value.findIndex(w => w.id === id)
            if (idx !== -1) activeWords.value.splice(idx, 1)
          }, 350)
        }
      }
      if (a.type === 'RHYME_DESTROY') {
        const id = a.id
        const index = activeWords.value.findIndex(w => w.id === id)
        if (index !== -1) {
          activeWords.value[index].status = a.status || 'caught'
          setTimeout(() => {
            const idx = activeWords.value.findIndex(w => w.id === id)
            if (idx !== -1) activeWords.value.splice(idx, 1)
          }, 350)
        }
      }
      if (a.type === 'TAKE_DAMAGE' && isAuthority.value) takeDamage()
      if (a.type === 'LIVES_SYNC' && !isAuthority.value) {
        lives.value = a.lives
        if (lives.value <= 0) endGame()
      }
      if (a.type === 'TIME_SYNC' && !isAuthority.value) {
        timeLeft.value = a.timeLeft
        if (timeLeft.value <= 0) endGame()
      }
    }
    if (a.type === 'SABOTAGE' && a.subtype === 'REDUCE_TIME' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (a.amount || 2))
      if (timeLeft.value <= 0) endGame()
    }
    if (a.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
      timeLeft.value = Math.max(0, timeLeft.value - (a.amount || 5))
      if (timeLeft.value <= 0) endGame()
    }
    if (a.type === 'REQUEST_SYNC' && isAuthority.value && isPlaying.value) {
      multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        target: currentTarget.value,
        score: score.value,
        lives: lives.value,
        timeLeft: timeLeft.value
      })
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

watch(() => multiplayerStore.timeLeft, newTime => {
  if (props.isMultiplayer) {
    timeLeft.value = newTime
    if (timeLeft.value <= 0 && isPlaying.value) endGame()
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

.arcade-hud {
  z-index: 100;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
}

.arcade-stat {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 229, 255, 0.1);
}

.arcade-stat .label {
  font-size: 10px;
  color: #00e5ff;
  letter-spacing: 1px;
}

.arcade-stat .value {
  font-size: 24px;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.arcade-stat.time.critical .value {
  color: #ff5252;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

.mission-objective {
  background: rgba(0, 229, 255, 0.1);
  border: 2px dashed #00e5ff;
  text-align: center;
  min-width: 250px;
}

.objective-label {
  font-size: 12px;
  color: #00e5ff;
  letter-spacing: 2px;
}

.objective-word {
  font-size: 32px;
  font-weight: 900;
  color: white;
}

.glow-text {
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.8);
}
.laser-boundary {
  position: absolute;
  bottom: 80px;
  left: 0;
  width: 100%;
  height: 2px;
  border-top: 2px dashed rgba(244, 67, 54, 0.7);
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.8), 0 0 20px rgba(244, 67, 54, 0.4);
  z-index: 5;
  pointer-events: none;
}

.word-bubble-container {
  position: absolute;
  cursor: pointer;
  z-index: 10;
}

.word-bubble-container:hover .word-bubble {
  transform: scale(1.08);
}

.word-bubble {
  background: rgba(15, 23, 42, 0.9);
  color: #00e5ff !important;
  border: 2px solid #00e5ff;
  box-shadow: 0 4px 10px rgba(0, 229, 255, 0.15), 0 0 6px rgba(0, 229, 255, 0.25);
  padding: 10px 22px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1.2rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.word-bubble::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #00e5ff;
}

.word-correct {
  background: #00e676 !important;
  color: white !important;
  border-color: #00e676 !important;
  box-shadow: 0 8px 16px rgba(0, 230, 118, 0.3), 0 0 8px rgba(0, 230, 118, 0.2);
  animation: premium-pop-correct 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes premium-pop-correct {
  0% { transform: scale(1) rotate(0); }
  30% { transform: scale(0.75) rotate(-2deg); }
  75% { transform: scale(1.2) rotate(4deg); }
  100% { transform: scale(1.15) rotate(4deg); }
}

.word-correct::after { border-top-color: #00e676; }

.word-incorrect {
  background: #ff5252 !important;
  color: white !important;
  border-color: #ff5252 !important;
  box-shadow: 0 8px 16px rgba(255, 82, 82, 0.3), 0 0 8px rgba(255, 82, 82, 0.2);
  animation: premium-pop-incorrect 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes premium-pop-incorrect {
  0% { transform: scale(1); }
  30% { transform: scale(0.75); }
  50% { transform: scale(1.15) translateX(-8px); }
  75% { transform: scale(1.15) translateX(8px); }
  100% { transform: scale(1); }
}

.word-incorrect::after { border-top-color: #ff5252; }

.bubble-turbo {
  background: rgba(15, 23, 42, 0.95) !important;
  color: #ff007f !important;
  border-color: #ff007f !important;
  box-shadow: 0 8px 16px rgba(255, 0, 127, 0.35), 0 0 8px rgba(255, 0, 127, 0.2) !important;
  transition: all 0.3s ease;
}

.bubble-turbo::after { border-top-color: #ff007f !important; }

@keyframes jitter {
  0% { transform: translate(0,0); }
  25% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); }
  75% { transform: translate(1px, 1px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.time-bonus-feedback {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 100;
  text-shadow: 0 0 20px rgba(0, 230, 118, 0.5);
}

.feedback-icon-anim {
  animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 0 20px currentColor);
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.5s ease-out;
}
.fade-up-enter-from { opacity: 0; transform: translate(-50%, 0); }
.fade-up-leave-to { opacity: 0; transform: translate(-50%, -100px); }

.start-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
}

.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 2px solid #00e5ff; }

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

.stat-label { color: #94a3b8; font-size: 0.9rem; margin-bottom: 5px; }
.stat-value { font-size: 2.5rem; font-weight: 900; }

.pointer-events-none { pointer-events: none !important; }

.spectator-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  transition: left 0.1s linear, top 0.1s linear;
}

.cursor-dot {
  width: 12px;
  height: 12px;
  background: #00e5ff;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 10px #00e5ff;
}

.cursor-label {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 229, 255, 0.8);
  color: black;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  z-index: 1001;
}

.freeze-cursor-hide {
  cursor: none !important;
}

.freeze-cursor-hide * {
  cursor: none !important;
}

.local-virtual-cursor {
  position: absolute;
  width: 30px;
  height: 30px;
  pointer-events: none;
  z-index: 5000;
  transform: translate(-50%, -50%);
}

.cursor-dot-freeze {
  width: 14px;
  height: 14px;
  background: #00e5ff;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 15px #00e5ff, 0 0 5px rgba(255,255,255,0.8);
}
</style>

