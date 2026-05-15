<template>
  <div class="radio-cabinet" :class="{ 'game-paused': props.isPaused }">
    <div class="screw screw-tl" />
    <div class="screw screw-tr" />
    <div class="screw screw-bl" />
    <div class="screw screw-br" />

    <div class="radio-brand">
      <div class="brand-text">ASTRO <span class="brand-model">RX-7</span></div>
      <div class="brand-subtitle">{{ $t('radioSignal.commsReceiver') }}</div>
    </div>

    <div class="session-hud">
      <div class="hud-pill">{{ $t('radioSignal.points', { score }) }}</div>
      <div class="hud-pill" :class="{ 'hud-pill-alert': timeLeft <= 10 }">{{ $t('radioSignal.time', { time: timeLeft }) }}</div>
    </div>

    <div class="screen-housing">
      <div class="screen-bezel">
        <div class="wave-panels">
          <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
            <div class="screen-label">{{ $t('radioSignal.targetLabel') }}</div>
            <canvas ref="targetWaveCanvas" height="90" width="260" />
            <div class="scanline" />
          </div>
          <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
            <div class="screen-label">{{ $t('radioSignal.signalLabel') }}</div>
            <canvas ref="currentWaveCanvas" height="90" width="260" />
            <div class="scanline" />
          </div>
        </div>
      </div>
    </div>

    <div class="indicator-strip">
      <div class="freq-display">
        <div class="freq-value">{{ currentFrequency.toFixed(1) }}</div>
        <div class="freq-unit">MHz</div>
      </div>
      <div class="indicator-lights">
        <div class="indicator-dot" :class="isTuned ? 'dot-green' : 'dot-off'" />
        <div class="indicator-dot" :class="!isTuned ? 'dot-red' : 'dot-off'" />
      </div>
      <div class="status-display">
        <span :class="isTuned ? 'status-sync' : 'status-lost'">
          {{ isTuned ? $t('radioSignal.locked') : $t('radioSignal.scanning') }}
        </span>
      </div>
    </div>

    <div class="dial-housing">
      <div class="dial-markings">
        <span
          v-for="n in 11"
          :key="n"
          class="dial-mark"
          :style="{ left: ((n-1) * 10) + '%' }"
        >
          {{ (n-1) * 10 }}
        </span>
      </div>
      <div class="dial-track">
        <div class="dial-indicator" :style="{ left: currentFrequency + '%' }" />
      </div>
      <div class="knob-row">
        <div
          class="knob-container"
          @mousedown="startRotating"
          @touchstart.prevent="startRotating"
        >
          <div class="knob-body" :style="{ transform: `rotate(${knobRotation}deg)` }">
            <div class="knob-line" />
          </div>
        </div>
      </div>
    </div>

    <div class="input-housing">
      <div v-if="isTuned" class="input-active">
        <div class="input-header">
          <button class="replay-btn" @click="speakPhrase(1.0)" :title="$t('radioSignal.replay')">
            <v-icon size="18">mdi-volume-high</v-icon>
          </button>
          <span class="input-label">{{ $t('radioSignal.incomingTransmission') }}</span>
        </div>
        
        <!-- MOSTRAR FRASE AL RECEPTOR EN COOP -->
        <div v-if="props.isMultiplayer && !isHost && !props.isDuel && !props.isRace" class="phrase-display-coop mb-2">
          <div class="text-caption text-grey-lighten-1">{{ $t('radioSignal.transmitThis') || 'TRANSMET AQUESTA FRASE:' }}</div>
          <div class="text-h6 text-amber-accent-2 font-weight-bold">{{ currentPhrase.phrase }}</div>
        </div>

        <div class="input-row">
          <input
            v-model="userGuess"
            autofocus
            class="radio-input"
            :placeholder="$t('radioSignal.placeholder')"
            @keyup.enter="checkPhrase"
          >
          <button class="send-btn" @click="checkPhrase">
            {{ $t('radioSignal.send') }}
          </button>
        </div>
        <transition name="fade">
          <div v-if="errorTip" class="error-tip-msg mt-2">
            <v-icon color="red-accent-2" size="16" class="mr-1">mdi-alert-circle</v-icon>
            {{ errorTip }}
          </div>
        </transition>
      </div>
      <div v-else class="input-placeholder">
        <v-icon color="grey-darken-3" size="24">mdi-radio-off</v-icon>
        <div>{{ $t('radioSignal.noSignal') }}</div>
      </div>
    </div>

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

    <!-- COOP STATUS BAR -->
    <div v-if="props.isMultiplayer && !props.isRace && !props.isDuel" class="coop-status-bar">
      <div class="coop-label">XARXA DE TRANSMISSIÓ COMPARTIDA</div>
      <div ref="chatBox" class="chat-history">
        <div v-for="(msg, idx) in chatHistory" :key="idx" class="chat-msg">
          <span class="chat-user">[{{ msg.user }}]:</span>
          <span class="chat-text" :class="msg.type">{{ msg.text }}</span>
        </div>
      </div>
    </div>

    <!-- START OVERLAY -->
    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <v-icon class="mb-4" color="cyan-accent-3" icon="mdi-radio-tower" size="64" />
        <h2 class="text-h4 font-weight-bold text-white mb-4">{{ $t('radioSignal.title') }}</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">{{ $t('radioSignal.desc') }}</p>
        
        <div v-if="isMultiplayer && !props.isRace && !props.isDuel" class="mb-6 pa-4 rounded-lg bg-deep-purple-darken-4 border-cyan">
          <div v-if="isHost" class="text-cyan-accent-2 font-weight-bold">
            <v-icon start>mdi-ear-hearing</v-icon> ETS L'OIENT: Escolta la frase i escriu-la!
          </div>
          <div v-else class="text-amber-accent-2 font-weight-bold">
            <v-icon start>mdi-eye</v-icon> ETS EL RECEPTOR: Mira la frase i comunica-la al teu company!
          </div>
        </div>

        <v-btn
          v-if="!isMultiplayer"
          block
          class="font-weight-black text-black"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="startGame"
        >
          {{ $t('radioSignal.startBtn') }}
        </v-btn>
        <div v-else class="text-h6 text-cyan-accent-2 animate-pulse mt-4">
          {{ $t('multiplayerLobby.autoStarting') || 'LA MISIÓN COMENZARÁ TRAS EL BRIEFING...' }}
        </div>
      </v-card>
    </v-overlay>

  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { radioSignalData } from '@/data/radioSignalData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useGroupStore } from '@/stores/groupStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t, locale } = useI18n()
  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()
  const groupStore = useGroupStore()

  const props = defineProps({
    isMultiplayer: { type: Boolean, default: false },
    isRace: { type: Boolean, default: false },
    isDuel: { type: Boolean, default: false },
    duration: { type: Number, default: 90 },
    autoStart: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
  })
  })
  const emit = defineEmits(['game-over'])

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
    setTimeout(() => { showFeedback.value = false }, 800)
  }

  const isHost = computed(() => (multiplayerStore.room?.host?.username || multiplayerStore.room?.host) === astroStore.user)
  const anyRivalAlive = computed(() => {
    if (!props.isMultiplayer) return true
    const rivals = Object.keys(multiplayerStore.playerTimes).filter(u => u !== astroStore.user)
    if (rivals.length === 0) return true 
    return rivals.some(u => multiplayerStore.playerTimes[u] > 0)
  })
  const isCompetitiveMode = computed(() => props.isDuel || props.isRace || multiplayerStore.room?.gameConfig?.modality === '2vs2')

  // --- GAME STATE ---
  const score = ref(0)
  const timeLeft = ref(props.duration)
  const currentFrequency = ref(50.0)
  const targetFrequency = ref(75.5)
  const isTuned = ref(false)
  const currentLevel = ref(1)
  const userGuess = ref('')
  const errorTip = ref('')
  const showStartOverlay = ref(!props.autoStart)
  const showGameOverOverlay = ref(false)
  const isPlaying = ref(false)
  const chatHistory = ref([])
  const chatBox = ref(null)

  function normalizePhrase (entry) {
    if (typeof entry === 'string') return entry
    if (entry && typeof entry === 'object') {
      return String(entry.phrase || entry.text || entry).trim()
    }
    return ''
  }

  const gameData = computed(() => {
    if (!props.isMultiplayer && groupStore.trainingActiveSupplySet?.gameId === 'RadioSignal' && groupStore.trainingActiveSupplySet?.content?.length > 0) {
      return groupStore.trainingActiveSupplySet.content
    }
    return radioSignalData[locale.value] || radioSignalData['es']
  })

  const phrases = computed(() => {
    const normalized = gameData.value.map(normalizePhrase).filter(Boolean)
    return normalized.length > 0 ? normalized : (radioSignalData[locale.value] || radioSignalData['es'])
  })
  const shuffledPhrases = ref([])
  const currentPhraseIdx = ref(0)

  const currentPhrase = computed(() => {
    if (shuffledPhrases.value.length === 0) return { phrase: '...', hint: '' }
    const p = shuffledPhrases.value[currentPhraseIdx.value % shuffledPhrases.value.length]
    return typeof p === 'string' ? { phrase: p, hint: '' } : p
  })

  const myTeam = computed(() => {
    return multiplayerStore.room?.gameConfig?.teams?.[astroStore.user]
  })

  const subRole = computed(() => multiplayerStore.subRole)
  })

  // --- CANVAS & WAVEFORMS ---
  const targetWaveCanvas = ref(null)
  const currentWaveCanvas = ref(null)
  let animationId = null
  let time = 0

  function drawWaves () {
  function drawWaves () {
    if (!isPlaying.value || props.isPaused) {
      animationId = requestAnimationFrame(drawWaves)
      return
    }

    const tCtx = targetWaveCanvas.value?.getContext('2d')
    const cCtx = currentWaveCanvas.value?.getContext('2d')
    if (!tCtx || !cCtx) return

    tCtx.clearRect(0, 0, 260, 90)
    cCtx.clearRect(0, 0, 260, 90)

    time += 0.05
    const targetFreqVal = 0.1 + (targetFrequency.value / 100) * 0.4
    const currentFreqVal = 0.1 + (currentFrequency.value / 100) * 0.4
    const diff = Math.abs(targetFrequency.value - currentFrequency.value)
    const noise = diff > 2 ? (diff / 20) : 0

    // Draw Background Grid
    tCtx.strokeStyle = 'rgba(0, 229, 255, 0.1)'
    cCtx.strokeStyle = 'rgba(0, 229, 255, 0.1)'
    for (let i = 0; i < 260; i += 40) {
      tCtx.beginPath(); tCtx.moveTo(i, 0); tCtx.lineTo(i, 90); tCtx.stroke()
      cCtx.beginPath(); cCtx.moveTo(i, 0); cCtx.lineTo(i, 90); cCtx.stroke()
    }
    }

    // Draw Target Wave
    tCtx.beginPath()
    tCtx.strokeStyle = '#00E5FF'
    tCtx.lineWidth = 2
    tCtx.shadowBlur = 5
    tCtx.shadowColor = '#00E5FF'
    for (let x = 0; x < 260; x++) {
      const y = 45 + Math.sin(x * targetFreqVal + time) * 30
      if (x === 0) tCtx.moveTo(x, y); else tCtx.lineTo(x, y)
    }
    tCtx.stroke()

    // Draw Current Wave
    cCtx.beginPath()
    cCtx.strokeStyle = isTuned.value ? '#00E676' : '#FF5252'
    cCtx.lineWidth = 2
    cCtx.shadowBlur = 5
    cCtx.shadowColor = cCtx.strokeStyle
    for (let x = 0; x < 260; x++) {
      const n = (Math.random() - 0.5) * noise * 30
      const y = 45 + Math.sin(x * currentFreqVal + time) * 30 + n
      if (x === 0) cCtx.moveTo(x, y); else cCtx.lineTo(x, y)
    }
    cCtx.stroke()

    animationId = requestAnimationFrame(drawWaves)
  }

  // --- KNOB INTERACTION ---
  const knobRotation = ref(0)
  let isDraggingKnob = false

  function startRotating (e) {
    isDraggingKnob = true
    window.addEventListener('mousemove', handleRotate)
    window.addEventListener('mouseup', stopRotating)
    window.addEventListener('touchmove', handleRotate)
    window.addEventListener('touchend', stopRotating)
  }

  function handleRotate (e) {
    if (!isDraggingKnob) return
    const rect = document.querySelector('.knob-container').getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI)
    knobRotation.value = angle
    
    // Map rotation to frequency (0-100)
    const normAngle = (angle + 180) % 360 // 0 to 360
    currentFrequency.value = (normAngle / 360) * 100
    checkTuning()
  }

  function stopRotating () {
    isDraggingKnob = false
    window.removeEventListener('mousemove', handleRotate)
    window.removeEventListener('mouseup', stopRotating)
    window.removeEventListener('touchmove', handleRotate)
    window.removeEventListener('touchend', stopRotating)
  }

  function checkTuning () {
    const diff = Math.abs(currentFrequency.value - targetFrequency.value)
    if (diff < 1.5) {
      if (!isTuned.value) {
        isTuned.value = true
        speakPhrase(0.8)
      }
    } else {
      isTuned.value = false
    }
  }

  // --- AUDIO FIX ---
  const voices = ref([])
  function loadVoices() {
    voices.value = window.speechSynthesis.getVoices()
  }
  window.speechSynthesis.onvoiceschanged = loadVoices
  loadVoices()

  function speakPhrase (volume = 1.0) {
    if (!isTuned.value) return
    
    // Solo habla si es el host (oyente) o modo individual o duelo/carrera
    const shouldSpeak = !props.isMultiplayer || isHost.value || props.isDuel || props.isRace
    if (!shouldSpeak) return

    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(currentPhrase.value.phrase)
    
    // Detectar mejor el idioma y forzar voz si es posible
    const lang = locale.value === 'ca' ? 'ca-ES' : 'es-ES'
    utter.lang = lang
    
    const targetVoice = voices.value.find(v => v.lang.startsWith(lang))
    if (targetVoice) utter.voice = targetVoice
    
    utter.rate = 0.85
    utter.pitch = 1.0
    utter.volume = volume
    window.speechSynthesis.speak(utter)
  }

  function checkPhrase () {
    if (!isTuned.value || !userGuess.value.trim()) return

    const normalizedGuess = userGuess.value.trim().toLowerCase().replace(/[.,!?;:]/g, '')
    const normalizedTarget = currentPhrase.value.phrase.toLowerCase().replace(/[.,!?;:]/g, '')

    if (normalizedGuess === normalizedTarget) {
      score.value += 100 + (currentLevel.value * 20)
      
      // SOLO SUMAR TIEMPO SI EL RIVAL ESTÁ VIVO
      if (anyRivalAlive.value) {
        timeLeft.value = Math.min(120, timeLeft.value + 15)
      }

      currentLevel.value++
      currentPhraseIdx.value++
      targetFrequency.value = Math.random() * 100
      userGuess.value = ''
      isTuned.value = false
      errorTip.value = ''
      triggerFeedback('success')

      if (props.isRace) {
        multiplayerStore.rechargeFuel(20)
      }

      if (props.isMultiplayer) {
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: isSaboteurActive ? 15 : 8 })
        
        if (!props.isDuel && !props.isRace) {
          multiplayerStore.sendGameAction({ type: 'RADIO_PHRASE_CORRECT', score: score.value, nextIdx: currentPhraseIdx.value, nextFreq: targetFrequency.value })
          addChatMessage('SISTEMA', t('radioSignal.correctPhrase'), 'success')
        } else if (props.isDuel) {
          multiplayerStore.sendGameAction({ type: 'TIME_PENALTY', amount: isSaboteurActive ? 15 : 10 })
        }
      }
    } else {
      timeLeft.value = Math.max(0, timeLeft.value - 10)
      if (props.isDuel || props.isRace || !props.isMultiplayer) {
        multiplayerStore.timeLeft = timeLeft.value
      }
      errorTip.value = t('radioSignal.wrongPhrase')
      triggerFeedback('error')
      setTimeout(() => { errorTip.value = '' }, 3000)
    }
  }

  function addChatMessage (user, text, type = 'info') {
    chatHistory.value.push({ user, text, type })
    setTimeout(() => {
      if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
    }, 50)
  }

  function startGame () {
    showStartOverlay.value = false
    isPlaying.value = true
    score.value = 0
    timeLeft.value = props.duration
    currentFrequency.value = 50
    targetFrequency.value = Math.random() * 100
    
    if (shuffledPhrases.value.length === 0) {
      shuffledPhrases.value = [...phrases.value].sort(() => Math.random() - 0.5)
    }

    if (props.isMultiplayer && isHost.value && !props.isDuel && !props.isRace) {
      multiplayerStore.sendGameAction({ type: 'RADIO_SYNC_PHRASES', phrases: shuffledPhrases.value })
    }

    drawWaves()
    startTimer()
  }

  let timerInterval = null
  function startTimer () {
    if (timerInterval) clearInterval(timerInterval)
    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (!isPlaying.value || props.isPaused) return
      
      if (!props.isMultiplayer || isHost.value || props.isDuel || props.isRace) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000
          
          if (props.isMultiplayer) {
            // En duelo/race TODOS envían su tiempo para que el rival sepa si estamos vivos
            if (isHost.value || props.isDuel || props.isRace) {
              multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
            }
            
            if (props.isDuel || props.isRace || !props.isMultiplayer) {
              multiplayerStore.timeLeft = timeLeft.value
            }
          } else {
            multiplayerStore.timeLeft = timeLeft.value
          }
        }

        if (timeLeft.value <= 0) {
          if (props.isRace && !props.isDuel) {
             endGame()
          } else {
            if (props.isMultiplayer && isHost.value && !props.isDuel && !props.isRace) {
              multiplayerStore.sendGameAction({ type: 'RADIO_TIME_UP' })
            }
            endGame()
          }
        }
      }
    }, 500)
  }

  function endGame () {
    isPlaying.value = false
    if (timerInterval) clearInterval(timerInterval)
    cancelAnimationFrame(animationId)

    if (props.isMultiplayer) {
      multiplayerStore.submitRoundResult()
    }
    
    if (props.isRace || !props.isMultiplayer) {
      emitExit()
    }
  }

  function returnToMenu () {
    emit('game-over', score.value)
  }

  function emitExit () {
    emit('game-over', score.value)
  }

  onMounted(() => {
    if (props.isMultiplayer || props.isRace) {
      if (!isHost.value && !props.isDuel && !props.isRace) {
        multiplayerStore.sendGameAction({ type: 'REQUEST_RADIO_SYNC' })
      }
      
      // Aplicar boost de tiempo si el avatar lo permite
      const boost = astroStore.equippedSkinBoost
      const baseTime = props.isMultiplayer ? 90 : 60
      if (boost && boost.type === 'time') {
        timeLeft.value = Math.floor(baseTime * boost.multiplier)
      } else {
        timeLeft.value = baseTime
      }
      setTimeout(() => {
        if (!isPlaying.value) startGame()
      }, 3000)
    }
  })

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
    cancelAnimationFrame(animationId)
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return
    if (msg.type === 'ROUND_ENDED_BY_WINNER' && isPlaying.value) {
      endGame()
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
      }

      if (msg.action?.type === 'RADIO_PHRASE_SOLVED' && msg.action.teamId === myTeam.value) {
        score.value += msg.action.pointsGained
        targetFrequency.value = msg.action.newFreq
        currentPhraseIdx.value++
        isTuned.value = false
        addChatMessage('SISTEMA', t('radioSignal.partnerCorrect'), 'success')
        }
        if (timeLeft.value <= 0) endGame()
      }

      if (msg.action?.type === 'TIME_PENALTY' && msg.from !== astroStore.user) {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 5))
        if (props.isDuel || props.isRace || !props.isMultiplayer) {
          multiplayerStore.timeLeft = timeLeft.value
        }
        if (timeLeft.value <= 0) endGame()
      }

      if (msg.action?.type === 'TIME_SYNC' && !isHost.value && !props.isDuel && !props.isRace) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) endGame()
      }

      if (msg.action?.type === 'RADIO_SYNC_PHRASES' && !props.isDuel && !props.isRace) {
        shuffledPhrases.value = msg.action.phrases
        if (!isPlaying.value) startGame()
      }

      if (msg.action?.type === 'RADIO_PHRASE_CORRECT' && !props.isDuel && !props.isRace) {
        score.value = msg.action.score
        currentPhraseIdx.value = msg.action.nextIdx
        targetFrequency.value = msg.action.nextFreq
        isTuned.value = false
        addChatMessage('SISTEMA', t('radioSignal.partnerCorrect'), 'success')
      }

      if (msg.action?.type === 'RADIO_TIME_UP' && !props.isDuel && !props.isRace) {
        endGame()
      }
      if (msg.action?.type === 'REQUEST_RADIO_SYNC' && isHost.value && !props.isDuel && !props.isRace) {
        multiplayerStore.sendGameAction({ type: 'RADIO_SYNC_PHRASES', phrases: shuffledPhrases.value })
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

  // Iniciar automáticamente si se solicita
  if (props.isMultiplayer || props.isRace || props.autoStart) {
    setTimeout(() => {
      if (!isPlaying.value) startGame()
    }, 3000)
  }
</script>

<style scoped>
.radio-cabinet {
    position: relative;
    width: 600px;
    height: 650px;
    background: #2a2e36;
    border: 12px solid #1a1e26;
    border-radius: 12px;
    padding: 40px 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.1);
}

.game-paused {
    pointer-events: none;
    filter: blur(4px) grayscale(0.5);
    transition: all 0.3s ease;
}

.screw {
    position: absolute; width: 14px; height: 14px; background: #444; border-radius: 50%;
    border: 1px solid #222; box-shadow: inset 0 1px 3px rgba(255,255,255,0.2);
}
.screw::after {
    content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 1.5px;
    background: #333; transform: translate(-50%, -50%) rotate(45deg);
}
.screw-tl { top: 8px; left: 8px; }
.screw-tr { top: 8px; right: 8px; }
.screw-bl { bottom: 8px; left: 8px; }
.screw-br { bottom: 8px; right: 8px; }

.radio-brand { margin-bottom: 20px; border-bottom: 1px solid #3a3e46; padding-bottom: 10px; }
.brand-text { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 900; color: #555; }
.brand-model { color: #f44336; font-size: 16px; margin-left: 8px; }
.brand-subtitle { font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 4px; }

.session-hud { display: flex; justify-content: space-between; margin-bottom: 15px; }
.hud-pill {
    background: #000; border: 1px solid #333; border-radius: 4px;
    padding: 4px 12px; font-family: 'Courier New', monospace; font-size: 12px; color: #00E5FF;
}
.hud-pill-alert { color: #f44336; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.screen-housing {
    background: #1a1e26; border: 2px solid #3a3e46; border-radius: 8px; padding: 6px; margin-bottom: 10px;
}
.screen-bezel { background: #080a0e; border: 1px solid #222; border-radius: 4px; padding: 4px; overflow: hidden; }
.wave-panels { display: flex; gap: 6px; }
.wave-screen {
    flex: 1; background: #040608; border: 1px solid #1a1e26; border-radius: 3px;
    position: relative; overflow: hidden; transition: border-color 0.4s, box-shadow 0.4s;
}
.screen-synced { border-color: #00E5FF !important; box-shadow: inset 0 0 15px rgba(0,229,255,0.1); }
.screen-label {
    position: absolute; top: 3px; left: 6px; font-size: 7px; color: #334; font-weight: bold; letter-spacing: 2px; z-index: 1;
}
canvas { display: block; width: 100%; height: auto; }
.scanline {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
    pointer-events: none;
}

.indicator-strip {
    display: flex; align-items: center; justify-content: space-between;
    background: #15171c; border: 1px solid #2a2e36; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px;
}
.freq-display { display: flex; align-items: baseline; gap: 4px; }
.freq-value {
    font-family: 'Courier New', monospace; font-size: 22px; font-weight: bold;
    color: #00E5FF; text-shadow: 0 0 10px rgba(0,229,255,0.4);
}
.freq-unit { font-size: 10px; color: #456; letter-spacing: 1px; }
.indicator-lights { display: flex; gap: 8px; }
.indicator-dot { width: 8px; height: 8px; border-radius: 50%; transition: all 0.3s; }
.dot-green { background: #4caf50; box-shadow: 0 0 8px #4caf50; }
.dot-red { background: #f44336; box-shadow: 0 0 8px #f44336; }
.dot-off { background: #222; }
.status-display { font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 1px; }
.status-sync { color: #4caf50; }
.status-lost { color: #666; }

.dial-housing {
    background: #15171c; border: 1px solid #2a2e36; border-radius: 6px; padding: 10px 14px 14px; margin-bottom: 10px;
}
.dial-markings { position: relative; height: 14px; margin-bottom: 4px; }
.dial-mark {
    position: absolute; transform: translateX(-50%); font-size: 8px; color: #444; font-family: 'Courier New', monospace;
}
.dial-track {
    position: relative; height: 6px; background: #222; border-radius: 3px; margin-bottom: 12px; border: 1px solid #333;
}
.dial-indicator {
    position: absolute; top: -3px; width: 4px; height: 12px; background: #f44336;
    border-radius: 2px; transform: translateX(-50%); transition: left 0.05s linear; box-shadow: 0 0 6px rgba(244,67,54,0.4);
}
.knob-row { display: flex; justify-content: center; }
.knob-container { width: 80px; height: 80px; cursor: pointer; user-select: none; position: relative; }
.knob-body {
    width: 100%; height: 100%;
    background: radial-gradient(circle at 38% 32%, #d0d0d0 0%, #8a8a8a 60%, #666 100%);
    border-radius: 50%; border: 3px solid #444; box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2);
    transition: transform 0.05s linear; position: relative;
}
.knob-line {
    position: absolute; top: 6px; left: 50%; width: 3px; height: 14px; background: #222; border-radius: 2px; transform: translateX(-50%);
}

.input-housing {
    min-height: 90px; background: #15171c; border: 1px solid #2a2e36; border-radius: 6px; padding: 10px;
}
.input-active { animation: fadeUp 0.3s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.input-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.replay-btn {
    background: none; border: 1px solid #00E5FF; border-radius: 4px; padding: 4px 6px; cursor: pointer; color: #00E5FF; transition: all 0.2s;
}
.replay-btn:hover { background: rgba(0,229,255,0.1); }
.input-label { font-size: 10px; color: #00E5FF; letter-spacing: 2px; font-weight: bold; font-family: 'Courier New', monospace; }
.input-row { display: flex; gap: 6px; }
.radio-input {
    flex: 1; background: #0a0c10; border: 1px solid #2d3139; border-radius: 4px; padding: 8px 10px;
    color: #00E5FF; font-family: 'Courier New', monospace; font-size: 13px; outline: none; transition: border-color 0.3s;
}
.radio-input:focus { border-color: #00E5FF; }
.send-btn {
    background: #00E5FF; color: #080a0e; border: none; border-radius: 4px; padding: 0 16px;
    font-family: 'Courier New', monospace; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 11px;
}
.send-btn:hover { background: #fff; box-shadow: 0 0 12px #00E5FF; }

.input-placeholder {
    height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; color: #444; font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 2px;
}

.coop-status-bar {
    margin-top: 15px; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 8px; padding: 10px;
}
.coop-label { font-size: 10px; color: #00E5FF; font-weight: bold; letter-spacing: 1px; margin-bottom: 10px; text-align: center; }
.chat-history {
    height: 80px; overflow-y: auto; background: rgba(0, 0, 0, 0.3); border-radius: 4px; padding: 5px; font-family: 'Courier New', monospace;
}
.chat-msg { font-size: 10px; margin-bottom: 4px; }
.chat-user { color: #999; margin-right: 6px; }
.chat-text.success { color: #4caf50; }
.chat-text.error { color: #f44336; }
.chat-text.info { color: #00E5FF; }

.error-tip-msg { font-size: 10px; color: #f44336; font-family: 'Courier New', monospace; }

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

.feedback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pointer-events-none {
  pointer-events: none !important;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
