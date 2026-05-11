<template>
  <v-container class="d-flex flex-column align-center justify-center game-container w-100 opendyslexic" fluid style="min-height: 800px">

    <!-- Capçalera -->
    <v-card class="mb-4 pa-4 bg-deep-purple-darken-4 elevation-10" max-width="800" rounded="xl" width="100%">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">
            🚀 {{ $t('spelledRosco.title') }}
            <span v-if="props.isMultiplayer && subRole" class="text-caption text-uppercase">({{ subRole }})</span>
          </h2>
          <div class="text-caption text-grey-lighten-2">
            <span>{{ $t('spelledRosco.score', { score: score }) }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">{{ $t('spelledRosco.time', { time: timeLeft }) }}</span>
          </div>
        </div>
        <div class="d-flex align-center gap-4">
          <v-chip
            v-for="(l, i) in roscoLetters"
            :key="i"
            class="mx-1 font-weight-bold"
            :color="getChipColor(l)"
            label
            size="small"
          >
            {{ l.char }}
          </v-chip>
          <v-btn color="grey" icon="mdi-close" variant="text" @click="emitExit" />
        </div>
      </div>
    </v-card>

    <!-- Joc Principal -->
    <v-row v-if="!gameFinished" class="w-100 d-flex justify-center align-center" no-gutters>

      <!-- Estrella -->
      <v-col class="d-flex justify-center align-center position-relative star-col mb-8 mb-lg-0" cols="12" lg="6">
        <div class="star-wrapper">
          <svg class="star-svg" viewBox="0 0 400 400">
            <!-- Polígons d'il·luminació interior (Puntes) -->
            <polygon
              v-for="(points, i) in tipPolygons"
              :key="'tip-'+i"
              class="star-tip-fill"
              :class="{ 'tip-glowing': isTipGlowing(i) }"
              :points="points"
            />

            <!-- Línies del contorn -->
            <line
              v-for="(seg, i) in starSegments"
              :key="'line-'+i"
              class="star-line"
              :class="{ 'line-glowing': isSegmentGlowing(i) }"
              :x1="seg.x1"
              :x2="seg.x2"
              :y1="seg.y1"
              :y2="seg.y2"
            />

            <g v-if="rocketAnimating" class="rocket-trail-group">
              <circle :cx="rocketPos.x" :cy="rocketPos.y" fill="url(#rocketGlow)" r="6" />
              <circle
                v-for="(p, i) in trailParticles"
                :key="'trail-'+i"
                :cx="p.x"
                :cy="p.y"
                :fill="p.color"
                :opacity="p.opacity"
                :r="p.r"
              />
            </g>
            <defs>
              <radialGradient id="rocketGlow">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="1" />
                <stop offset="50%" stop-color="#00b8d4" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#0097a7" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#00e5ff" stop-opacity="0" />
              </radialGradient>
            </defs>
          </svg>

          <div
            v-for="(letter, index) in roscoLetters"
            :key="index"
            class="star-node elevation-8"
            :class="getBubbleClass(letter, index)"
            :style="getStarNodeStyle(index)"
          >
            <span class="node-letter">{{ letter.char }}</span>
            <div v-if="index === currentIndex && !gameFinished" class="node-pulse" />
          </div>

          <div class="star-center">
            <div class="text-h2 font-weight-black center-letter">{{ currentLetter.char }}</div>
          </div>
        </div>
      </v-col>

      <!-- Panell de Pregunta i Resposta -->
      <v-col class="px-lg-8" cols="12" lg="6">
        <v-card border class="pa-6 bg-grey-darken-4 elevation-5" rounded="xl">
          <div class="mb-4 text-center">
            <!-- RENDERIZADO CONDICIONAL DE PISTA -->
            <template v-if="isTranslator">
              <v-chip class="mb-2 font-weight-bold" color="amber" label>{{ $t('spelledRosco.translatorClue') }}</v-chip>
              <div class="hieroglyph-internal-container d-flex justify-center gap-4 pa-4">
                <div v-for="(emoji, index) in (currentLetter.hieroglyphs || ['❓','❓','❓'])" :key="index" class="hieroglyph-box elevation-10">
                  <span class="emoji-text">{{ emoji }}</span>
                </div>
              </div>
            </template>
            <template v-else-if="isSender">
              <v-chip class="mb-2 font-weight-bold" color="light-blue" label>{{ $t('spelledRosco.senderClue') }}</v-chip>
              <p class="text-h4 text-cyan-accent-2 font-weight-black mb-4">{{ currentLetter.answer }}</p>

              <v-card class="pa-4 bg-grey-darken-3 rounded-lg elevation-4">
                <div class="text-caption text-grey-lighten-1 mb-2">{{ $t('spelledRosco.writeHint') }}</div>
                <v-text-field
                  v-model="textHint"
                  bg-color="grey-darken-4"
                  class="mb-3 hint-text-field"
                  density="comfortable"
                  hide-details
                  :placeholder="$t('spelledRosco.hintPlaceholder')"
                  prepend-inner-icon="mdi-chat-processing"
                  rounded="lg"
                  variant="solo-filled"
                  @keydown.enter="sendTextHint"
                />
                <v-btn
                  block
                  class="text-black font-weight-bold"
                  color="cyan-accent-3"
                  :disabled="!textHint.trim()"
                  @click="sendTextHint"
                >
                  {{ $t('spelledRosco.sendClue') }}
                </v-btn>
              </v-card>
            </template>
            <template v-else-if="isGuesser">
              <v-chip class="mb-2 font-weight-bold" color="cyan" label>{{ $t('spelledRosco.guess') }}</v-chip>

              <!-- Pistas inteligentes -->
              <div class="d-flex justify-center gap-2 mb-4">
                <v-chip class="font-weight-black elevation-2" color="amber-darken-3" size="small" variant="flat">
                  <v-icon icon="mdi-tag" size="14" start />
                  {{ currentHints.category }}
                </v-chip>
                <v-chip class="font-weight-black elevation-2" color="indigo-accent-2" size="small" variant="flat">
                  <v-icon icon="mdi-shape" size="14" start />
                  {{ currentHints.type }}
                </v-chip>
              </div>

              <!-- EMOJI HISTORY -->
              <div class="emoji-history-internal pa-4 rounded-xl elevation-5 bg-deep-purple-darken-4 border-cyan">
                <div class="text-caption text-cyan-accent-2 mb-2 font-weight-bold">{{ $t('spelledRosco.partnerClues') }}</div>
                <div class="d-flex flex-wrap gap-2 justify-center min-chat-bubble-internal">
                  <div
                    v-for="(emoji, index) in multiplayerStore.partnerEmojis"
                    :key="index"
                    class="emoji-item-internal animate-pop-in"
                  >
                    <span class="text-h3">{{ emoji }}</span>
                  </div>
                  <div v-if="!multiplayerStore.partnerEmojis || multiplayerStore.partnerEmojis.length === 0" class="text-body-2 text-grey italic">
                    {{ $t('spelledRosco.waitingClues') }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <v-chip class="mb-2 font-weight-bold" color="cyan" label>{{ $t('spelledRosco.definition') }}</v-chip>
              <p class="text-h6 text-white">{{ currentLetter.question }}</p>
            </template>
          </div>

          <v-divider class="mb-6 border-opacity-25" />

          <div class="text-center mb-4">
            <p class="text-overline text-grey-lighten-1 mb-2">
              <span v-if="isTranslator">{{ $t('spelledRosco.typingPartner') }}</span>
              <span v-else-if="isSender">{{ $t('spelledRosco.sendEmojiClue') }}</span>
              <span v-else>{{ $t('spelledRosco.writeWord') }}</span>
            </p>

            <v-text-field
              v-if="!isTranslator && !isSender"
              v-model="rawInput"
              autofocus
              bg-color="#263238"
              class="mb-4 spelling-input"
              color="cyan-accent-3"
              density="comfortable"
              hide-details
              :placeholder="$t('spelledRosco.placeholder')"
              variant="outlined"
              @input="onTyping"
              @keydown.enter="checkAnswer"
            />

            <!-- GHOST TEXT PARA EL TRADUCTOR -->
            <div v-else-if="isTranslator" class="ghost-text-container mb-4 pa-4 rounded-lg">
              <span class="text-h4 text-cyan-accent-2 font-weight-black">{{ multiplayerStore.partnerText || '...' }}</span>
              <div v-if="multiplayerStore.partnerText" class="typing-indicator mt-2">
                <v-progress-linear color="cyan" height="2" indeterminate />
              </div>
            </div>

            <div v-if="!isTranslator && !isSender" class="d-flex justify-center gap-4 mb-4">
              <v-btn
                class="px-4"
                color="orange-accent-3"
                size="x-large"
                variant="tonal"
                @click="pasapalabra"
              >
                {{ $t('spelledRosco.pasapalabra') }}
              </v-btn>
            </div>

            <v-btn
              v-if="!isTranslator && !isSender"
              block
              class="font-weight-bold text-white elevation-4"
              color="success"
              :disabled="rawInput.length === 0"
              rounded="lg"
              size="large"
              @click="checkAnswer"
            >
              {{ $t('spelledRosco.confirm') }}
            </v-btn>

            <v-btn
              v-if="!isTranslator && !isSender"
              class="mt-2"
              color="red-accent-2"
              size="small"
              variant="text"
              @click="clearInput"
            >
              {{ $t('spelledRosco.clearAll') }}
            </v-btn>

            <div v-if="isTranslator" class="text-body-2 text-grey-lighten-1">
              {{ $t('spelledRosco.translatorGuide') }}
            </div>
            <div v-if="isSender" class="text-body-2 text-grey-lighten-1">
              {{ $t('spelledRosco.senderGuide') }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pantalla Final -->
    <v-card
      v-else-if="gameFinished"
      class="pa-8 text-center bg-grey-darken-4 border-cyan"
      max-width="500"
      rounded="xl"
      width="100%"
    >
      <v-icon class="mb-4" color="cyan-accent-2" icon="mdi-school" size="80" />
      <h2 class="text-h4 text-white mb-2">{{ $t('spelledRosco.completedTitle') || 'MISSIÓ COMPLETADA' }}</h2>
      <div class="d-flex justify-space-around my-6">
        <div class="text-center">
          <div class="text-h3 text-success font-weight-bold">{{ correctCount }}</div>
          <div class="text-caption">{{ $t('spelledRosco.correctHits') }}</div>
        </div>
        <div class="text-center">
          <div class="text-h3 text-error font-weight-bold">{{ incorrectCount }}</div>
          <div class="text-caption">{{ $t('spelledRosco.incorrectHits') }}</div>
        </div>
      </div>
      <p class="text-h5 text-white mb-2">{{ $t('spelledRosco.finalScore', { score: score }) }}</p>
      
      <template v-if="!isMultiplayer">
        <p class="text-subtitle-1 text-grey-lighten-1 mb-1">{{ $t('spelledRosco.timeRemaining', { time: timeLeft }) }}</p>
        <p class="text-h6 text-cyan-accent-2 mb-6">{{ $t('spelledRosco.reward', { reward: finalReward }) }}</p>
        <v-btn
          class="text-black font-weight-bold"
          color="cyan-accent-3"
          rounded="pill"
          size="large"
          variant="flat"
          @click="emitExit"
        >
          {{ $t('spelledRosco.getReward') }}
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
          {{ $t('spelledRosco.getReward') }}
        </v-btn>
      </template>
    </v-card>

    <v-overlay
      v-model="showFeedback"
      contained
      class="align-center justify-center pointer-events-none"
      persistent
      no-click-animation
      scrim="transparent"
    >
      <div class="feedback-container" :class="feedbackColor === 'success' ? 'success' : 'error'">
        <v-icon
          v-if="feedbackColor === 'success'"
          color="success"
          size="140"
          class="feedback-icon animate-success"
        >
          mdi-check-circle
        </v-icon>
        <v-icon
          v-else-if="feedbackColor === 'error'"
          color="error"
          size="140"
          class="feedback-icon animate-error"
        >
          mdi-close-circle
        </v-icon>
      </div>
    </v-overlay>

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

  const textHint = ref('')
  const currentHints = reactive({
    category: '',
    type: '',
  })

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

  const allLettersData = computed(() => {
    return roscoData[locale.value] || roscoData['es']
  })

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

  const roscoLetters = ref([]), currentIndex = ref(0), rawInput = ref(''), gameFinished = ref(false), score = ref(0), showFeedback = ref(false), feedbackMessage = ref(''), feedbackColor = ref('info'), isChecking = ref(false), totalTime = 60, timeLeft = ref(totalTime), rocketAnimating = ref(false), rocketPos = reactive({ x: 0, y: 0 }), trailParticles = ref([]), visitedSegments = ref(new Set())
  let timerInterval = null

  // --- REFORÇ VISUAL I SONOR ---
  const sounds = {
    success: '/assets/sounds/success.mp3',
    error: '/assets/sounds/error.mp3',
  }

  function playFeedbackSound (type) {
    const audio = new Audio(sounds[type])
    audio.volume = 0.4
    audio.play().catch(e => console.warn('Audio play blocked:', e))
  }

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

  const emit = defineEmits(['game-over'])

  const subRole = computed(() => multiplayerStore.subRole)
  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)
  const isTranslator = computed(() => props.isMultiplayer && subRole.value === 'translator')
  const isSender = computed(() => props.isMultiplayer && subRole.value === 'sender')
  const isGuesser = computed(() => props.isMultiplayer && subRole.value === 'guesser')

  function sendTextHint () {
    const hint = textHint.value?.trim()
    if (!hint) return

    if (!isValidHint(hint, currentLetter.value.answer)) {
      feedbackMessage.value = t('spelledRosco.msgCheatDetected')
      feedbackColor.value = 'error'
      showFeedback.value = true
      textHint.value = ''
      return
    }

    multiplayerStore.sendGameAction({
      type: 'PARTNER_EMOJI',
      emoji: hint,
    })
    textHint.value = ''
  }

  const currentLetter = computed(() => roscoLetters.value.length > 0 ? roscoLetters.value[currentIndex.value] : { char: '?', question: '', hieroglyphs: [] })
  watch(() => currentLetter.value, newLetter => {
    if (newLetter?.answer) {
      currentHints.category = getWordCategory(newLetter.answer); currentHints.type = getWordType(newLetter.answer)
    }
  }, { immediate: true })
  const correctCount = computed(() => roscoLetters.value.filter(l => l.status === 'correct').length), incorrectCount = computed(() => roscoLetters.value.filter(l => l.status === 'incorrect').length), finalReward = computed(() => score.value + timeLeft.value)
  function normalize (str) {
    return str.toUpperCase().trim().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036F]/g, '')
  }

  function initRosco (force = false) {
    if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.roscoData && !force) {
      const teamId = multiplayerStore.room?.gameConfig?.teams[astroStore.user], data = multiplayerStore.room?.gameConfig?.roscoData[teamId] || multiplayerStore.room?.gameConfig?.roscoData.default
      if (data && (roscoLetters.value.length === 0 || force)) {
        roscoLetters.value = data.map(l => ({ ...l, status: 'pending' }))
        currentIndex.value = 0
        rocketPos.x = starPoints[0].x
        rocketPos.y = starPoints[0].y
      }
    } else if (roscoLetters.value.length === 0 || force) {
      if (!props.isMultiplayer || isHost.value) {
        const shuffled = [...allLettersData.value].sort(() => Math.random() - 0.5), data = shuffled.slice(0, 5).map(l => ({ ...l, status: 'pending' }))
        roscoLetters.value = data
        currentIndex.value = 0
        rocketPos.x = starPoints[0].x
        rocketPos.y = starPoints[0].y
        if (props.isMultiplayer) {
          multiplayerStore.sendGameAction({ type: 'ROSCO_SYNC', data })
          multiplayerStore.sendGameAction({ type: 'INDEX_SYNC', index: 0 })
        }
      } else {
        multiplayerStore.sendGameAction({ type: 'REQUEST_ROSCO_SYNC' })
      }
    }
  }

  onMounted(() => {
    initRosco()
    if (props.isMultiplayer) {
      setTimeout(() => {
        startTimer()
      }, 3000)
    } else {
      startTimer()
    }
  })
  watch(() => multiplayerStore.room, () => initRosco(), { deep: true })
  const emitTyping = throttle(text => {
    if (props.isMultiplayer && !isTranslator.value && !isSender.value) multiplayerStore.sendGameAction({ type: 'TYPING_SYNC', text })
  }, 150)
  function onTyping () {
    emitTyping(rawInput.value)
  }

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return
    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      gameFinished.value = true; emitExit()
    }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ADVANCE_LETTER' && (isSender.value || isTranslator.value)) {
      roscoLetters.value[msg.action.index].status = msg.action.status; score.value = msg.action.score
      if (msg.action.status === 'correct') {
        timeLeft.value = Math.min(timeLeft.value + 20, 999)
      }
      advanceTurn()
    }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ROSCO_SYNC' && !isHost.value) {
      roscoLetters.value = msg.action.data
      currentIndex.value = 0
      rocketPos.x = starPoints[0].x
      rocketPos.y = starPoints[0].y
    }
    if (msg.type === 'GAME_ROLES_SWAPPED') {
      feedbackMessage.value = t('spelledRosco.rolesSwapped'); feedbackColor.value = 'warning'; showFeedback.value = true
      setTimeout(() => showFeedback.value = false, 2000)
    }
    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) finishGame()
      }
      if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 15))
      }
      if (msg.action?.type === 'INDEX_SYNC' && !isHost.value) {
        currentIndex.value = msg.action.index
      }
    }
  }, { immediate: true })

  function checkAnswer () {
    if (isChecking.value || gameFinished.value || isTranslator.value || isSender.value) return
    isChecking.value = true
    const userAnswer = normalize(rawInput.value)
    const correctAnswer = normalize(currentLetter.value.answer)

    if (userAnswer === correctAnswer) {
      handleResult('correct')
    } else {
      handleResult('incorrect')
    }
  }

  function handleResult (status) {
    roscoLetters.value[currentIndex.value].status = status
    if (status === 'correct') {
      score.value += 100
      timeLeft.value = Math.min(timeLeft.value + 20, 999)
      feedbackMessage.value = t('spelledRosco.msgCorrect')
      feedbackColor.value = 'success'
      playFeedbackSound('success')
      if (props.isRace) {
        multiplayerStore.rechargeFuel(20) // Recarga 20% por palabra (es más difícil)
      }
      if (props.isMultiplayer) {
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: isSaboteurActive ? 30 : 15 })
      }
    } else {
      score.value = Math.max(0, score.value - 25)
      feedbackMessage.value = t('spelledRosco.msgIncorrect')
      feedbackColor.value = 'error'
      playFeedbackSound('error')
    }
    showFeedback.value = true

    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'ADVANCE_LETTER', index: currentIndex.value, status, score: score.value })
      multiplayerStore.sendGameAction({ type: 'CLEAR_EMOJIS' })
      if (isHost.value) multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
    }

    setTimeout(() => {
      showFeedback.value = false
      clearInput()
      isChecking.value = false
      advanceTurn()
    }, 1000)
  }

  function pasapalabra () {
    if (isChecking.value || gameFinished.value) return
    advanceTurn()
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'INDEX_SYNC', index: currentIndex.value })
    }
  }

  function advanceTurn () {
    let next = (currentIndex.value + 1) % roscoLetters.value.length
    let loops = 0
    while (roscoLetters.value[next].status !== 'pending' && loops < roscoLetters.value.length) {
      next = (next + 1) % roscoLetters.value.length
      loops++
    }
    if (loops >= roscoLetters.value.length) {
      if (timeLeft.value > 5) {
        feedbackMessage.value = t('spelledRosco.msgAllCorrectNext') || '¡COMPLETADO! Generando nuevo rosco...'
        feedbackColor.value = 'success'
        showFeedback.value = true
        setTimeout(() => {
          if (!gameFinished.value) initRosco(true)
        }, 3000)
      } else {
        finishGame()
      }
    } else {
      animateRocket(currentIndex.value, next).then(() => {
        currentIndex.value = next
      })
    }
  }

  async function animateRocket (from, to) {
    rocketAnimating.value = true
    const start = letterPositions[from], end = letterPositions[to]
    let curr = start
    while (curr !== end) {
      curr = (curr + 1) % 10
      const p = starPoints[curr]
      rocketPos.x = p.x; rocketPos.y = p.y
      await new Promise(r => setTimeout(r, 150))
    }
    rocketAnimating.value = false
  }

  function startTimer () {
    timerInterval = setInterval(() => {
      if (gameFinished.value) return
      if (!props.isMultiplayer || isHost.value) {
        timeLeft.value = Math.max(0, timeLeft.value - 1)
        if (props.isMultiplayer && isHost.value) {
          multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
        }
        if (timeLeft.value === 0) finishGame()
      }
    }, 1000)
  }

  watch(score, (newScore) => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
    }
  })

  function finishGame () {
    gameFinished.value = true
    if (timerInterval) clearInterval(timerInterval)
    if (props.isMultiplayer) multiplayerStore.submitRoundResult()
  }

  function emitExit () {
    emit('game-over', finalReward.value)
  }

  function getChipColor (letter) {
    if (letter.status === 'correct') return 'success'
    if (letter.status === 'incorrect') return 'error'
    return 'grey'
  }

  function getBubbleClass (letter, index) {
    return {
      'node-correct': letter.status === 'correct',
      'node-incorrect': letter.status === 'incorrect',
      'node-active': index === currentIndex.value && !gameFinished.value,
    }
  }

  function getStarNodeStyle (index) {
    const p = starPoints[letterPositions[index]]
    return { left: p.x + 'px', top: p.y + 'px' }
  }

  function isTipGlowing (tipIdx) {
    const pos = letterPositions[tipIdx]
    return tipIdx === currentIndex.value || visitedSegments.value.has(pos)
  }

  function isSegmentGlowing (segIdx) {
    return visitedSegments.value.has(segIdx)
  }

  function clearInput () {
    rawInput.value = ''
  }

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
  })
</script>

<style scoped>
.game-container {
  background: radial-gradient(circle at center, #0d0221 0%, #020617 100%);
  color: white;
  min-height: 800px;
}

.star-wrapper {
  position: relative;
  width: 400px;
  height: 400px;
}

.star-svg {
  width: 100%;
  height: 100%;
}

.star-line {
  stroke: rgba(0, 229, 255, 0.2);
  stroke-width: 2;
}

.line-glowing {
  stroke: #00e5ff;
  stroke-width: 4;
  filter: drop-shadow(0 0 5px #00e5ff);
}

.star-tip-fill {
  fill: rgba(0, 229, 255, 0.05);
  transition: fill 0.3s;
}

.tip-glowing {
  fill: url(#tipGlow);
}

.star-node {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
  z-index: 10;
  transition: all 0.3s;
}

.node-letter {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 1.2rem;
  color: #94a3b8;
}

.node-active {
  border-color: #00e5ff;
  box-shadow: 0 0 15px #00e5ff;
  scale: 1.2;
}

.node-active .node-letter { color: #fff; }

.node-correct {
  background: #059669;
  border-color: #10b981;
}

.node-correct .node-letter { color: #fff; }

.node-incorrect {
  background: #dc2626;
  border-color: #ef4444;
}

.node-incorrect .node-letter { color: #fff; }

.star-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.center-letter {
  font-family: 'Orbitron', sans-serif;
  color: #00e5ff;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
}

.node-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.4);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { scale: 1; opacity: 0.6; }
  100% { scale: 1.8; opacity: 0; }
}

.spelling-input :deep(input) {
  font-family: 'Orbitron', sans-serif;
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.hieroglyph-box {
  width: 70px;
  height: 70px;
  background: #1e1b4b;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-text { font-size: 2.5rem; }

.ghost-text-container {
  background: rgba(0, 229, 255, 0.05);
  border: 1px dashed #00e5ff;
}

.animate-pop-in {
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  0% { scale: 0; opacity: 0; }
  100% { scale: 1; opacity: 1; }
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
</style>
