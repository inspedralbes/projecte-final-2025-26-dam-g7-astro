<template>
  <div ref="gameArea" class="v-container v-container--fluid fill-height d-flex flex-column align-center justify-center word-construction-container" :class="{ 'game-paused': props.isPaused }" style="position: relative;" @mousemove="handleMouseMove">

    <!-- Cursors remots -->
    <div v-if="props.isMultiplayer && !isCompetitiveMode" class="remote-cursors-container">
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
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">{{ $t('wordConstruction.level', { level: state.level }) }}</h2>
        <div v-if="!isMultiplayer" class="text-caption text-grey-lighten-2">
          <span>{{ $t('wordConstruction.score', { score: state.score }) }}</span>
          <span class="mx-2">|</span>
          <span :class="{ 'text-red-accent-2': state.timeLeft <= 15 }">{{ $t('wordConstruction.time', { time: state.timeLeft }) }}</span>
        </div>
        <div v-else class="text-caption text-grey-lighten-2">
          <span>{{ $t('wordConstruction.score', { score: state.score }) }}</span>
        </div>
        </div>
        <!-- Barra de progrés "Construcció" -->
        <div class="d-flex flex-column align-end">
          <span class="text-overline mb-1">{{ $t('wordConstruction.baseStatus') }}</span>
          <v-progress-linear
            color="success"
            height="10"
            :model-value="(state.currentStep / state.totalSteps) * 100"
            rounded
            striped
            style="width: 150px"
          />
        </div>
      </div>
    </v-card>

    <!-- Àrea de Joc -->
    <v-card
      v-if="!state.gameFinished"
      class="pa-6 text-center bg-grey-darken-4"
      max-width="600"
      rounded="xl"
      width="100%"
    >

      <p class="text-h6 mb-2 text-grey-lighten-1">{{ $t('wordConstruction.dragInstruction') }}</p>
      <p class="text-body-2 text-cyan-accent-2 mb-6" v-html="$t('wordConstruction.hint', { hint: state.currentWordObj.hint })" />

      <!-- Lletres arrossegables -->
      <draggable
        v-model="state.scrambledLetters"
        :animation="180"
        chosen-class="chosen-chip"
        class="d-flex justify-center flex-wrap gap-2 mb-6"
        :disabled="state.isRoundLocked || props.isPaused || props.isSpectator"
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
        :disabled="state.isRoundLocked || props.isSpectator"
        rounded="lg"
        size="x-large"
        @click="checkAnswer"
      >
        {{ $t('wordConstruction.buildBlock') }}
      </v-btn>

      <v-btn
        block
        color="grey-lighten-1"
        :disabled="state.isRoundLocked || props.isSpectator"
        rounded="lg"
        variant="outlined"
        @click="shuffleCurrentLetters"
      >
        {{ $t('wordConstruction.shuffleLetters') }}
      </v-btn>

      <v-alert
        v-if="state.message"
        class="mt-6 rounded-lg animate-bounce"
        :type="state.messageType"
        variant="tonal"
      >
        {{ state.message }}
      </v-alert>
    </v-card>


  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch, shallowRef } from 'vue'
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
    isSpectator: { type: Boolean, default: false },
    spectatedPlayer: { type: String, default: null }
  })

  const emit = defineEmits(['game-over'])

  const isAuthority = computed(() => {
    if (props.isSpectator) return false
    if (!props.isMultiplayer) return true
    const hostName = multiplayerStore.room?.host?.username || multiplayerStore.room?.host
    if (hostName === astroStore.user) return true
    const modality = multiplayerStore.room?.gameConfig?.modality
    const mode = multiplayerStore.room?.gameConfig?.mode
    if (props.isDuel || props.isRace || modality === '1vs1' || mode === 'TOURNAMENT' || mode === 'RACE') return true
    return false
  })
  
  const isLocalPlayerActive = computed(() => !props.isSpectator)
  const anyRivalAlive = computed(() => {
    if (!props.isMultiplayer) return true
    const rivals = Object.keys(multiplayerStore.playerTimes).filter(u => u !== astroStore.user)
    if (rivals.length === 0) return true 
    return rivals.some(u => multiplayerStore.playerTimes[u] > 0)
  })

  const isCompetitiveMode = computed(() => props.isDuel || props.isRace || multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT' || multiplayerStore.room?.gameConfig?.modality === '1vs1')

  // --- LCG RANDOM PARA SINCRONIZACIÓN ---
  let currentSeed = 0
  function lcgRandom () {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
    return currentSeed / 4294967296
  }

  // --- ESTAT DEL JOC (Factory Pattern per a reinici fàcil) ---
  const getInitialState = () => ({
    level: 1,
    score: 0,
    timeLeft: props.duration,
    currentWordObj: { word: '', hint: '' },
    scrambledLetters: [],
    gameFinished: false,
    isRoundLocked: false,
    currentStep: 0,
    totalSteps: 5,
    message: '',
    messageType: 'success'
  })

  const state = ref(getInitialState())

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
    const fallback = wordConstructionData[locale.value] || wordConstructionData['es']
    return fallback.map(normalizeWordObj)
  })

  const orderedGuess = computed(() => state.value.scrambledLetters.map(l => l.letter).join(''))

  function loadNextWord () {
    const isShared = multiplayerStore.room?.gameConfig?.sharedChallenge
    const useLCG = props.isMultiplayer || props.isDuel || props.isRace || isShared
    const rnd = useLCG ? lcgRandom() : Math.random()
    const randomIndex = Math.floor(rnd * wordPool.value.length)
    const wordObj = wordPool.value[randomIndex]

    state.value.currentWordObj = wordObj
    const letters = wordObj.word.split('').map((l, idx) => ({ id: idx, letter: l }))
    
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(lcgRandom() * (i + 1))
      const temp = letters[i]
      letters[i] = letters[j]
      letters[j] = temp
    }
    state.value.scrambledLetters = letters
    state.value.isRoundLocked = false

    if (props.isMultiplayer && isAuthority.value) {
      multiplayerStore.sendGameAction({
        type: 'SPECTATOR_SYNC',
        level: state.value.level,
        score: state.value.score,
        currentStep: state.value.currentStep,
        totalSteps: state.value.totalSteps,
        scrambledLetters: state.value.scrambledLetters,
        currentWordObj: wordObj,
        timeLeft: state.value.timeLeft
      })
    }
  }

  function shuffleCurrentLetters () {
    const letters = [...state.value.scrambledLetters]
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = letters[i]
      letters[i] = letters[j]
      letters[j] = temp
    }
    state.value.scrambledLetters = letters
  }

  function checkAnswer (fromSync = false) {
    if (state.value.isRoundLocked) return

    if (orderedGuess.value.toUpperCase() === state.value.currentWordObj.word.toUpperCase()) {
      state.value.currentStep++
      const timeBonus = Math.floor(state.value.timeLeft / 4)
      state.value.score += (state.value.level * 20) + timeBonus
      state.value.message = t('wordConstruction.correctBlock')
      state.value.messageType = 'success'
      state.value.isRoundLocked = true

      if (props.isRace) {
        multiplayerStore.rechargeFuel(15)
      }

      if (props.isMultiplayer && !fromSync) {
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: isSaboteurActive ? 10 : 5 })

        // LÓGICA MODO JEFE
        if (multiplayerStore.room?.gameConfig?.mode === 'BOSS') {
          const isBoss = multiplayerStore.room.gameConfig.boss === astroStore.user
          if (isBoss) {
            multiplayerStore.sendGameAction({ type: 'BOSS_ACTION', actionType: 'FREEZE' })
          } else {
            multiplayerStore.sendGameAction({ type: 'HERO_ATTACK' })
          }
        }

        // Siempre enviar WORD_SUCCESS para que los espectadores vean el progreso
        multiplayerStore.sendGameAction({ type: 'WORD_SUCCESS', currentStep: state.value.currentStep, score: state.value.score })

        if (props.isDuel) {
          multiplayerStore.sendGameAction({ type: 'TIME_PENALTY', amount: isSaboteurActive ? 12 : 6 })
        }
      }

      setTimeout(() => {
        state.value.message = ''
        if (state.value.currentStep >= state.value.totalSteps) {
          state.value.level++
          state.value.currentStep = 0
          if (anyRivalAlive.value) {
            state.value.timeLeft = Math.min(90, state.value.timeLeft + 15)
          }
        }
        loadNextWord()
      }, 1500)
    } else if (!fromSync) {
      state.value.message = t('wordConstruction.wrongBlock')
      state.value.messageType = 'error'
      state.value.timeLeft = Math.max(0, state.value.timeLeft - 3)
      if (props.isDuel || props.isRace || !props.isMultiplayer) {
        multiplayerStore.timeLeft = state.value.timeLeft
      }
      setTimeout(() => { state.value.message = '' }, 1500)
    }

    if (props.isMultiplayer && !fromSync && !props.isDuel && !props.isRace) {
      multiplayerStore.sendGameAction({ type: 'ANSWER_CHECKED' })
    }
  }

  function finishGame () {
    if (state.value.gameFinished) return
    state.value.gameFinished = true
    if (timerInterval) clearInterval(timerInterval)

    if (props.isMultiplayer) {
      multiplayerStore.submitRoundResult()
    }
    
    emitExit()
  }

  function emitExit () {
    emit('game-over', state.value.score)
  }

  let timerInterval = null
  function startTimer () {
    if (timerInterval) clearInterval(timerInterval)
    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (state.value.gameFinished || props.isPaused) return
      if (isAuthority.value) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          state.value.timeLeft = Math.max(0, state.value.timeLeft - delta)
          lastTick += delta * 1000
          
          if (props.isMultiplayer) {
            multiplayerStore.timeLeft = state.value.timeLeft
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: state.value.timeLeft })
            
            multiplayerStore.sendGameAction({
              type: 'SPECTATOR_SYNC',
              level: state.value.level,
              score: state.value.score,
              currentStep: state.value.currentStep,
              totalSteps: state.value.totalSteps,
              scrambledLetters: state.value.scrambledLetters,
              currentWordObj: state.value.currentWordObj,
              timeLeft: state.value.timeLeft
            })
          }

          if (state.value.timeLeft <= 0) {
            finishGame()
          }
        }
      }
    }, 500)
  }

  function triggerFeedback (type) {
    state.value.messageType = type
    state.value.message = type === 'success' ? t('wordConstruction.correctBlock') : t('wordConstruction.wrongBlock')
    setTimeout(() => { state.value.message = '' }, 1500)
  }

  let lastMouseSync = 0
  const gameArea = ref(null)
  function handleMouseMove (e) {
    if (!isLocalPlayerActive.value || !gameArea.value) return
    const rect = gameArea.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const now = Date.now()
    if (props.isMultiplayer && now - lastMouseSync > 50) {
      lastMouseSync = now
      multiplayerStore.sendGameAction({ type: 'MOUSE_MOVE', x, y })
    }
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
        if (!state.value.gameFinished) startTimer()
      }, 3000)
    } else {
      startTimer()
    }
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER' && !state.value.gameFinished) {
      finishGame()
      return
    }

    if (props.isSpectator) {
      if (msg.from === props.spectatedPlayer && msg.type === 'GAME_ACTION') {
        const a = msg.action
        if (a.type === 'BOARD_SYNC' || a.type === 'SPECTATOR_SYNC') {
          applySpectatorSync(a)
        }
        if (a.type === 'ORDER_SYNC') {
          state.value.scrambledLetters = normalizeLetters(a.letters)
        }
        if (a.type === 'WORD_SUCCESS') {
          state.value.currentStep = a.currentStep
          state.value.score = a.score
          triggerFeedback('success')
        }
        if (a.type === 'TIME_SYNC') {
          state.value.timeLeft = a.timeLeft
        }
      }
      return
    }

    if (msg.type === 'GAME_ACTION') {
      const a = msg.action
      if (a.type === 'APPLY_INTERFERENCE') {
        if (a.actionType === 'FREEZE') {
           // Congelación manejada por FreezeOverlay.vue, pero podemos pausar localmente
        }
        if (a.actionType === 'SCRAMBLE') {
           shuffleCurrentLetters()
           triggerFeedback('error')
        }
      }
      if (a.type === 'SABOTAGE' && a.subtype === 'REDUCE_TIME' && msg.from !== astroStore.user) {
        state.value.timeLeft = Math.max(0, state.value.timeLeft - (a.amount || 2))
        if (state.value.timeLeft <= 0 && !state.value.gameFinished) finishGame()
      }
      if (a.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
        state.value.timeLeft = Math.max(0, state.value.timeLeft - (a.amount || 5))
        if (state.value.timeLeft <= 0 && !state.value.gameFinished) finishGame()
      }
      if (a.type === 'BOARD_SYNC' && !props.isDuel && !props.isRace) {
        state.value.currentWordObj = normalizeWordObj(a.wordObj)
        state.value.scrambledLetters = normalizeLetters(a.letters)
        state.value.message = ''
        state.value.isRoundLocked = false
      }
      if (a.type === 'ORDER_SYNC' && msg.from !== astroStore.user && !props.isDuel && !props.isRace) {
        state.value.scrambledLetters = normalizeLetters(a.letters)
      }
      if (a.type === 'ANSWER_CHECKED' && !props.isDuel && !props.isRace) {
        checkAnswer(true)
      }
      if (a.type === 'TIME_SYNC' && !isAuthority.value && !props.isDuel && !props.isRace) {
        state.value.timeLeft = a.timeLeft
        if (state.value.timeLeft <= 0) finishGame()
      }
      if (a.type === 'WORD_SUCCESS' && !props.isDuel && !props.isRace) {
        state.value.currentStep = a.currentStep
        state.value.score = a.score
        state.value.message = t('wordConstruction.partnerBuilt')
        state.value.messageType = 'success'
        setTimeout(() => { state.value.message = '' }, 2000)
      }
    }
  }, { immediate: true })

  function applySpectatorSync (data) {
    if (!data) return
    if (data.level !== undefined) state.value.level = data.level
    if (data.score !== undefined) state.value.score = data.score
    if (data.currentStep !== undefined) state.value.currentStep = data.currentStep
    if (data.totalSteps !== undefined) state.value.totalSteps = data.totalSteps
    if (data.timeLeft !== undefined) state.value.timeLeft = data.timeLeft
    if (data.currentWordObj) state.value.currentWordObj = normalizeWordObj(data.currentWordObj)
    if (data.scrambledLetters) state.value.scrambledLetters = normalizeLetters(data.scrambledLetters)
  }

  watch(() => multiplayerStore.timeLeft, (newTime) => {
    if (props.isMultiplayer) {
      state.value.timeLeft = Math.ceil(newTime);
      if (state.value.timeLeft <= 0 && !state.value.gameFinished) finishGame();
    }
  });

  watch(() => state.value.scrambledLetters, newVal => {
    if (props.isMultiplayer && !isRoundLocked.value) {
      multiplayerStore.sendGameAction({ type: 'ORDER_SYNC', letters: newVal })
    }
  }, { deep: true })

  watch(() => state.value.score, newScore => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
    }
    if (props.isDuel || props.isRace) {
      multiplayerStore.roundScores[astroStore.user] = newScore
    }
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    if (timerInterval) clearInterval(timerInterval)
  })
</script>

<style scoped>
.ghost-chip { opacity: 0.45; }
.chosen-chip { transform: scale(1.06); transition: transform 0.2s ease; }
.border-cyan { border: 2px solid #00e5ff; box-shadow: 0 0 20px rgba(0, 229, 255, 0.3); }
.remote-cursors-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
.remote-cursor { position: absolute; transition: all 0.1s linear; transform: translate(-50%, -50%); }
.cursor-pointer { width: 12px; height: 12px; background: #00e5ff; border-radius: 50%; box-shadow: 0 0 10px #00e5ff; }
.cursor-label { font-size: 10px; background: rgba(0, 229, 255, 0.8); color: #000; padding: 1px 4px; border-radius: 4px; font-weight: bold; margin-top: 4px; white-space: nowrap; }
.word-construction-container { background: radial-gradient(circle at center, #0d0221 0%, #020617 100%); }
.game-paused { pointer-events: none !important; filter: blur(4px) grayscale(0.5); transition: all 0.3s ease; }
</style>
