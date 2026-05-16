<template>
    <div class="radio-cabinet" :class="{ 'game-paused': props.isPaused }">
        <div class="screw screw-tl"></div>
        <div class="screw screw-tr"></div>
        <div class="screw screw-bl"></div>
        <div class="screw screw-br"></div>

        <div class="radio-brand">
            <div class="brand-text">ASTRO <span class="brand-model">RX-7</span></div>
            <div class="brand-subtitle">{{ $t('radioSignal.commsReceiver') }}</div>
        </div>

        <div class="session-hud">
            <div class="hud-pill">Punts: {{ score }}</div>
            <div v-if="!isMultiplayer" class="hud-pill" :class="{ 'hud-pill-alert': timeLeft <= 10 }">Temps: {{ timeLeft }}s</div>
        </div>

        <div class="screen-housing">
            <div class="screen-bezel">
                <div class="wave-panels">
                    <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
                        <div class="screen-label">TARGET</div>
                        <canvas ref="targetWaveCanvas" width="260" height="90"></canvas>
                        <div class="scanline"></div>
                    </div>
                    <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
                        <div class="screen-label">SIGNAL</div>
                        <canvas ref="currentWaveCanvas" width="260" height="90"></canvas>
                        <div class="scanline"></div>
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
                <div class="indicator-dot" :class="isTuned ? 'dot-green' : 'dot-off'"></div>
                <div class="indicator-dot" :class="!isTuned ? 'dot-red' : 'dot-off'"></div>
            </div>
            <div class="status-display">
                <span :class="isTuned ? 'status-sync' : 'status-lost'">
                    {{ isTuned ? '● LOCKED' : '○ SCANNING' }}
                </span>
            </div>
        </div>

        <div class="dial-housing">
            <div class="dial-markings">
                <span v-for="n in 11" :key="n" class="dial-mark" 
                    :style="{ left: ((n-1) * 10) + '%' }">
                    {{ (n-1) * 10 }}
                </span>
            </div>
            <div class="dial-track">
                <div class="dial-indicator" :style="{ left: currentFrequency + '%' }"></div>
            </div>
            <div class="knob-row">
                <div
                    class="knob-container"
                    :class="{ 'pointer-events-none': props.isSpectator }"
                    @mousedown="startRotating"
                    @touchstart.prevent="startRotating"
                >
                    <div class="knob-body" :style="{ transform: `rotate(${knobRotation}deg)` }">
                        <div class="knob-line"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="input-housing">
            <div v-if="isTuned" class="input-active">
                <div class="input-header">
                    <button class="replay-btn" @click="speakPhrase(1.0)">
                        <v-icon size="18">mdi-volume-high</v-icon>
                    </button>
                    <span class="input-label">INCOMING TRANSMISSION</span>
                </div>
                
                <!-- MOSTRAR FRASE AL RECEPTOR EN COOP (Lògica de fe82024) -->
                <div v-if="props.isMultiplayer && !isHost && !props.isDuel && !props.isRace" class="phrase-display-coop mb-2">
                    <div class="text-caption text-grey-lighten-1" style="font-size: 10px;">TRANSMET AQUESTA FRASE:</div>
                    <div class="text-h6 text-amber-accent-2 font-weight-bold" style="font-size: 14px; color: #FFB300;">{{ currentPhrase.phrase }}</div>
                </div>

                <div class="input-row">
                    <input
                        v-model="userGuess"
                        class="radio-input"
                        :disabled="props.isSpectator"
                        placeholder="Escriu la frase..."
                        @keyup.enter="checkPhrase"
                        :autofocus="!props.isSpectator"
                    />
                    <button class="send-btn" :disabled="props.isSpectator" @click="checkPhrase">
                        SEND
                    </button>
                </div>
                <div v-if="errorTip" class="error-tip-msg mt-2" style="font-size: 10px; color: #f44336;">
                    {{ errorTip }}
                </div>
            </div>
            <div v-else class="input-placeholder">
                <v-icon size="18" color="#444">mdi-antenna</v-icon>
                <span>ESPERANT SENYAL...</span>
            </div>
        </div>

        <!-- Feedback Visual Overlay (Lògica de fe82024) -->
        <v-overlay
            v-model="showFeedback"
            contained
            class="align-center justify-center pointer-events-none"
            persistent
            no-click-animation
            scrim="transparent"
            style="z-index: 1000;"
        >
            <div class="feedback-container">
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

        <!-- START OVERLAY -->
        <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
            <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
                <v-icon class="mb-4" color="cyan-accent-3" icon="mdi-radio-tower" size="64" />
                <h2 class="text-h4 font-weight-bold text-white mb-4">Senyal de Ràdio</h2>
                <p class="text-body-1 text-grey-lighten-1 mb-6">Sintonitza la freqüència correcta i descifra el missatge.</p>
                <v-btn
                    v-if="!isMultiplayer"
                    block
                    class="font-weight-black text-black"
                    color="cyan-accent-3"
                    rounded="xl"
                    size="x-large"
                    @click="startGame"
                >
                    COMENÇAR
                </v-btn>
                <div v-else class="text-h6 text-cyan-accent-2 animate-pulse mt-4">
                    LA MISSIÓ COMENÇARÀ TRAS EL BRIEFING...
                </div>
            </v-card>
        </v-overlay>

        <!-- Cursor de Espectador -->
        <div 
            v-if="props.isSpectator && props.spectatedPlayer && multiplayerStore.remoteCursors[props.spectatedPlayer]" 
            class="spectator-cursor"
            :style="{
                left: multiplayerStore.remoteCursors[props.spectatedPlayer].x + '%',
                top: multiplayerStore.remoteCursors[props.spectatedPlayer].y + '%'
            }"
        >
            <div class="cursor-dot"></div>
            <div class="cursor-label">{{ props.spectatedPlayer }}</div>
        </div>
    </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { radioSignalData } from '@/data/radioSignalData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t, locale } = useI18n()
  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()

  const props = defineProps({
    isMultiplayer: { type: Boolean, default: false },
    isRace: { type: Boolean, default: false },
    isDuel: { type: Boolean, default: false },
    duration: { type: Number, default: 90 },
    autoStart: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    isSpectator: { type: Boolean, default: false },
    spectatedPlayer: { type: String, default: null },
  })

  const emit = defineEmits(['game-over', 'action'])

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

  const isAuthority = computed(() => {
    if (props.isSpectator) return false
    if (!props.isMultiplayer) return true
    const hostName = multiplayerStore.room?.host?.username || multiplayerStore.room?.host
    if (hostName === astroStore.user) return true
    // En duelos, torneos o carreras cada jugador es autoridad de su propio minijuego
    const modality = multiplayerStore.room?.gameConfig?.modality
    const mode = multiplayerStore.room?.gameConfig?.mode
    if (props.isDuel || props.isRace || modality === '1vs1' || mode === 'TOURNAMENT' || mode === 'RACE') return true
    return false
  })

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
  const isPlaying = ref(false)

  const phrases = computed(() => {
    return radioSignalData[locale.value] || radioSignalData['es']
  })
  const shuffledPhrases = ref([])
  const currentPhraseIdx = ref(0)

  const currentPhrase = computed(() => {
    if (shuffledPhrases.value.length === 0) return { phrase: '...', hint: '' }
    const p = shuffledPhrases.value[currentPhraseIdx.value % shuffledPhrases.value.length]
    return typeof p === 'string' ? { phrase: p, hint: '' } : p
  })

  // --- CANVAS & WAVEFORMS ---
  const targetWaveCanvas = ref(null)
  const currentWaveCanvas = ref(null)
  let animationId = null
  let time = 0

  function drawWaves () {
    if (!isPlaying.value || props.isPaused) {
      animationId = requestAnimationFrame(drawWaves)
      return
    }

    const tCtx = targetWaveCanvas.value?.getContext('2d')
    const cCtx = currentWaveCanvas.value?.getContext('2d')
    if (!tCtx || !cCtx) {
      animationId = requestAnimationFrame(drawWaves)
      return
    }

    tCtx.clearRect(0, 0, 260, 90)
    cCtx.clearRect(0, 0, 260, 90)

    time += 0.05
    const w = 260, h = 90
    const cleanAmp = 22, cleanFreq = 0.08, cleanPhase = time
    const dist = Math.abs(currentFrequency.value - targetFrequency.value)
    const prox = Math.max(0, 1 - (dist / 15)) // Un poco más exigente que el original de 50

    // Draw Background Grid
    tCtx.strokeStyle = 'rgba(0, 229, 255, 0.05)'
    cCtx.strokeStyle = 'rgba(0, 229, 255, 0.05)'
    for (let i = 0; i < w; i += 20) {
      tCtx.beginPath(); tCtx.moveTo(i, 0); tCtx.lineTo(i, h); tCtx.stroke()
      cCtx.beginPath(); cCtx.moveTo(i, 0); cCtx.lineTo(i, h); cCtx.stroke()
    }

    // Draw Target Wave (Orange)
    tCtx.beginPath()
    tCtx.strokeStyle = '#FF9800'
    tCtx.lineWidth = 2.5
    for (let x = 0; x < w; x++) {
      const y = h/2 + Math.sin(x * cleanFreq + cleanPhase) * cleanAmp
      if (x === 0) tCtx.moveTo(x, y); else tCtx.lineTo(x, y)
    }
    tCtx.stroke()

    // Draw Current Wave (Blue/Cyan with Noise)
    cCtx.beginPath()
    cCtx.strokeStyle = `hsl(${180 + prox * 10}, 100%, ${50 + prox * 20}%)`
    cCtx.lineWidth = 2
    for (let x = 0; x < w; x++) {
      const clean = Math.sin(x * cleanFreq + cleanPhase) * cleanAmp
      const c1 = Math.sin(x * 0.23 + time * 1.5) * 18
      const c2 = Math.sin(x * 0.07 + time * 0.7) * 12
      const c3 = Math.sin(x * 0.35 + time * 2.3) * 8
      const n = (Math.random() - 0.5) * 10 * (1 - prox)
      
      const y = h/2 + clean * prox + (c1 + c2 * 0.5 + c3 * 0.3 + n) * (1 - prox)
      if (x === 0) cCtx.moveTo(x, y); else cCtx.lineTo(x, y)
    }
    cCtx.stroke()

    if (isTuned.value) {
      cCtx.shadowBlur = 15
      cCtx.shadowColor = '#00E5FF'
      cCtx.stroke()
      cCtx.shadowBlur = 0
    }

    animationId = requestAnimationFrame(drawWaves)
  }

  // --- KNOB INTERACTION ---
  const knobRotation = ref(0)
  let isDraggingKnob = false
  let lastMouseSync = 0

  function handleMouseMove (e) {
    if (!isPlaying.value || props.isSpectator) return
    const rect = currentWaveCanvas.value?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const now = Date.now()
    if (props.isMultiplayer && now - lastMouseSync > 33) {
      lastMouseSync = now
      multiplayerStore.sendGameAction({
        type: 'MOUSE_MOVE',
        x: Math.round((x / rect.width) * 1000),
        y: Math.round((y / rect.height) * 1000),
      })
      
      // Sincronización periódica solo bajo demanda o cambios críticos
    }
  }

  function startRotating (e) {
    isDraggingKnob = true
    window.addEventListener('mousemove', handleRotate)
    window.addEventListener('mouseup', stopRotating)
    window.addEventListener('touchmove', handleRotate)
    window.addEventListener('touchend', stopRotating)
  }

  function handleRotate (e) {
    if (!isDraggingKnob || props.isSpectator) return
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
    if (diff < 0.6) {
      if (!isTuned.value) {
        isTuned.value = true
        speakPhrase(0.8)
      }
    } else {
      isTuned.value = false
    }
  }

  // --- AUDIO ---
  const voices = ref([])
  function loadVoices() {
    voices.value = window.speechSynthesis.getVoices()
  }
  window.speechSynthesis.onvoiceschanged = loadVoices
  loadVoices()

  function speakPhrase (volume = 1.0) {
    if (!isTuned.value) return
    
    const shouldSpeak = !props.isMultiplayer || isAuthority.value
    if (!shouldSpeak) return

    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(currentPhrase.value.phrase)
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
    if (!isTuned.value || !userGuess.value.trim() || props.spectatedPlayer) return

    const normalizedGuess = userGuess.value.trim().toLowerCase().replace(/[.,!?;:]/g, '')
    const normalizedTarget = currentPhrase.value.phrase.toLowerCase().replace(/[.,!?;:]/g, '')

    if (normalizedGuess === normalizedTarget) {
      score.value += 100 + (currentLevel.value * 20)
      timeLeft.value += 5 // +5s por acierto
      
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
        emit('action', { type: 'SCORE_UPDATE', score: score.value, timeLeft: timeLeft.value })
        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: isSaboteurActive ? 15 : 8 })
        
        if (!props.isDuel && !props.isRace) {
          multiplayerStore.sendGameAction({ type: 'RADIO_PHRASE_CORRECT', score: score.value, nextIdx: currentPhraseIdx.value, nextFreq: targetFrequency.value })
        } else if (props.isDuel || props.isRace) {
          multiplayerStore.sendGameAction({ type: 'RADIO_PHRASE_CORRECT', score: score.value, nextIdx: currentPhraseIdx.value, nextFreq: targetFrequency.value })
          multiplayerStore.sendGameAction({ type: 'TIME_PENALTY', amount: isSaboteurActive ? 15 : 10 })
        }
      }
    } else {
      timeLeft.value = Math.max(0, timeLeft.value - 10)
      errorTip.value = t('radioSignal.wrongPhrase')
      triggerFeedback('error')
      setTimeout(() => { errorTip.value = '' }, 3000)
    }
  }

  function startGame () {
    showStartOverlay.value = false
    isPlaying.value = true
    score.value = 0
    timeLeft.value = props.duration
    currentFrequency.value = 50
    
    let randomFunc = Math.random
    if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.seed) {
      let seed = (multiplayerStore.room.gameConfig.seed + '-' + currentLevel.value).split('').reduce((a, b) => a + b.charCodeAt(0), 0)
      randomFunc = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
      }
    }
    targetFrequency.value = randomFunc() * 100
    
    if (shuffledPhrases.value.length === 0) {
      shuffledPhrases.value = [...phrases.value].sort(() => Math.random() - 0.5)
    }

    if (props.isMultiplayer && isAuthority.value && !props.isDuel && !props.isRace) {
      multiplayerStore.sendGameAction({ type: 'RADIO_SYNC_PHRASES', phrases: shuffledPhrases.value })
    }

    if (props.isMultiplayer && isAuthority.value && (props.isDuel || props.isRace)) {
        multiplayerStore.sendGameAction({
            type: 'SPECTATOR_SYNC',
            phrases: shuffledPhrases.value,
            targetFreq: targetFrequency.value,
            phraseIdx: currentPhraseIdx.value,
            score: score.value,
            timeLeft: timeLeft.value
        })
    }

    drawWaves()
    startTimer()
  }

  let timerInterval = null
  function startTimer () {
    if (timerInterval) clearInterval(timerInterval)
    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (!isPlaying.value || props.isPaused) {
        lastTick = Date.now()
        return
      }
      
      const now = Date.now()
      const delta = (now - lastTick) / 1000
      
      if (delta >= 1) {
        lastTick = now
        if (isAuthority.value) {
          timeLeft.value = Math.max(0, timeLeft.value - Math.floor(delta))
          if (props.isMultiplayer && isAuthority.value) {
            multiplayerStore.timeLeft = timeLeft.value
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }
          if (timeLeft.value <= 0) endGame()
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
    emit('game-over', score.value)
  }

  onMounted(() => {
    if (props.isSpectator && props.spectatedPlayer) {
      const lastSync = multiplayerStore.lastSpectatorSync[props.spectatedPlayer]
      if (lastSync && (lastSync.type === 'SPECTATOR_SYNC' || lastSync.type === 'RADIO_SYNC_PHRASES')) {
        applySpectatorSync(lastSync)
      }
    } else if (props.isMultiplayer || props.isRace || props.autoStart) {
      setTimeout(() => {
        if (!isPlaying.value) startGame()
      }, 3000)
    }
  })

  function applySpectatorSync (data) {
    if (data.freq !== undefined) currentFrequency.value = data.freq
    if (data.targetFreq !== undefined) targetFrequency.value = data.targetFreq
    if (data.level !== undefined) currentLevel.value = data.level
    if (data.score !== undefined) score.value = data.score
    if (data.timeLeft !== undefined) timeLeft.value = data.timeLeft
    if (data.phraseIdx !== undefined) currentPhraseIdx.value = data.phraseIdx
    if (data.phrases !== undefined) shuffledPhrases.value = data.phrases
    showStartOverlay.value = false
    isPlaying.value = true
    if (!animationId) drawWaves()
    if (!timerInterval) startTimer()
  }

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
    cancelAnimationFrame(animationId)
    window.speechSynthesis.cancel()
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER' && isPlaying.value) {
      endGame()
      return
    }

    // LÓGICA ESPECTADOR
    if (props.isSpectator) {
        if (msg.from === props.spectatedPlayer && msg.type === 'GAME_ACTION') {
            if (msg.action?.type === 'SPECTATOR_SYNC' || msg.action?.type === 'RADIO_SYNC_PHRASES') {
                applySpectatorSync(msg.action)
            }
            if (msg.action?.type === 'RADIO_PHRASE_CORRECT') {
                score.value = msg.action.score
                currentPhraseIdx.value = msg.action.nextIdx
                targetFrequency.value = msg.action.nextFreq
                isTuned.value = true // Forzamos tuneado para ver el mensaje
                triggerFeedback('success')
                setTimeout(() => { isTuned.value = false }, 1000)
            }
            if (msg.action?.type === 'TIME_SYNC') {
                timeLeft.value = msg.action.timeLeft
            }
            if (msg.action?.type === 'RADIO_TIME_UP') {
                endGame()
            }
        }
        return
    }


    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'REQUEST_SYNC' && !props.isSpectator && isAuthority.value) {
          multiplayerStore.sendGameAction({
              type: 'SPECTATOR_SYNC',
              freq: currentFrequency.value,
              targetFreq: targetFrequency.value,
              level: currentLevel.value,
              score: score.value,
              timeLeft: timeLeft.value,
              phraseIdx: currentPhraseIdx.value,
              phrases: shuffledPhrases.value
          })
      }
      if (msg.action?.type === 'TIME_SYNC' && !isAuthority.value && !props.isDuel && !props.isRace) {
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
        triggerFeedback('success')
      }
      if (msg.action?.type === 'RADIO_TIME_UP' && !props.isDuel && !props.isRace) {
        endGame()
      }

      if (msg.type === 'TIME_ATTACK') {
        timeLeft.value = Math.max(0, timeLeft.value - 3)
        triggerFeedback('error')
      }
      if (msg.action?.type === 'REQUEST_SYNC' && isAuthority.value && isPlaying.value) {
        multiplayerStore.sendGameAction({
          type: 'SPECTATOR_SYNC',
          score: score.value,
          timeLeft: timeLeft.value,
          phraseIdx: currentPhraseIdx.value,
          targetFreq: targetFrequency.value,
          freq: currentFrequency.value,
          level: currentLevel.value,
          phrases: shuffledPhrases.value
        })
      }
    }
  })

  watch(score, newScore => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
    }
  })
</script>

<style scoped>
.radio-cabinet {
    max-width: 460px;
    width: 95vw;
    background: linear-gradient(145deg, #2c2f36 0%, #1e2028 50%, #282b33 100%);
    border: 3px solid #3d424d;
    border-radius: 14px;
    margin: 0 auto;
    padding: 16px;
    position: relative;
    box-shadow:
        0 8px 30px rgba(0,0,0,0.6),
        inset 0 1px 0 rgba(255,255,255,0.05),
        inset 0 -1px 0 rgba(0,0,0,0.3);
}

.screw {
    position: absolute;
    width: 12px; height: 12px;
    background: radial-gradient(circle at 40% 35%, #888 0%, #444 100%);
    border-radius: 50%;
    border: 1px solid #333;
    z-index: 2;
}
.screw::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 8px; height: 1.5px;
    background: #333;
    transform: translate(-50%, -50%) rotate(45deg);
}
.screw-tl { top: 8px; left: 8px; }
.screw-tr { top: 8px; right: 8px; }
.screw-bl { bottom: 8px; left: 8px; }
.screw-br { bottom: 8px; right: 8px; }

.radio-brand { text-align: center; margin-bottom: 10px; padding: 4px 0; }
.brand-text { 
    font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: bold;
    color: #ccc; letter-spacing: 6px; text-shadow: 0 0 8px rgba(200,200,200,0.15);
}
.brand-model { color: #00E5FF; font-size: 12px; letter-spacing: 2px; }
.brand-subtitle { font-size: 8px; color: #555; letter-spacing: 4px; margin-top: 2px; }

.session-hud {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}

.hud-pill {
    background: #15171c;
    border: 1px solid #2a2e36;
    border-radius: 999px;
    color: #d3d7e0;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 1px;
    padding: 6px 12px;
}

.hud-pill-alert {
    color: #ff6e6e;
    border-color: #8b2d2d;
}

.screen-housing {
    background: #111;
    border: 2px solid #3a3f4b;
    border-radius: 8px;
    padding: 6px;
    margin-bottom: 10px;
}
.screen-bezel {
    background: #080a0e;
    border: 1px solid #222;
    border-radius: 4px;
    padding: 4px;
    overflow: hidden;
}
.wave-panels { display: flex; gap: 6px; }
.wave-screen {
    flex: 1;
    background: #040608;
    border: 1px solid #1a1e26;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.4s, box-shadow 0.4s;
}
.screen-synced { border-color: #00E5FF !important; box-shadow: inset 0 0 15px rgba(0,229,255,0.1); }
.screen-label {
    position: absolute; top: 3px; left: 6px;
    font-size: 7px; color: #334; font-weight: bold; letter-spacing: 2px; z-index: 1;
}
canvas { display: block; width: 100%; height: auto; }
.scanline {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
    pointer-events: none;
}

.indicator-strip {
    display: flex; align-items: center; justify-content: space-between;
    background: #15171c;
    border: 1px solid #2a2e36;
    border-radius: 6px;
    padding: 6px 12px;
    margin-bottom: 10px;
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
    background: #15171c;
    border: 1px solid #2a2e36;
    border-radius: 6px;
    padding: 10px 14px 14px;
    margin-bottom: 10px;
}
.dial-markings {
    position: relative; height: 14px; margin-bottom: 4px;
}
.dial-mark {
    position: absolute; transform: translateX(-50%);
    font-size: 8px; color: #444; font-family: 'Courier New', monospace;
}
.dial-track {
    position: relative; height: 6px;
    background: #222; border-radius: 3px;
    margin-bottom: 12px; border: 1px solid #333;
}
.dial-indicator {
    position: absolute; top: -3px;
    width: 4px; height: 12px;
    background: #f44336;
    border-radius: 2px;
    transform: translateX(-50%);
    transition: left 0.05s linear;
    box-shadow: 0 0 6px rgba(244,67,54,0.4);
}
.knob-row { display: flex; justify-content: center; }
.knob-container {
    width: 80px; height: 80px;
    cursor: pointer; user-select: none;
    position: relative;
}
.knob-body {
    width: 100%; height: 100%;
    background: radial-gradient(circle at 38% 32%, #d0d0d0 0%, #8a8a8a 60%, #666 100%);
    border-radius: 50%;
    border: 3px solid #444;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2);
    transition: transform 0.05s linear;
    position: relative;
}
.knob-line {
    position: absolute; top: 6px; left: 50%;
    width: 3px; height: 14px;
    background: #222;
    border-radius: 2px;
    transform: translateX(-50%);
}

.input-housing {
    min-height: 90px;
    background: #15171c;
    border: 1px solid #2a2e36;
    border-radius: 6px;
    padding: 10px;
}

.input-active {
    animation: slideIn 0.3s ease-out;
}

.spectator-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  transition: left 0.1s linear, top 0.1s linear;
  transform: translate(-50%, -50%);
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
}

@keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.input-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.replay-btn {
    background: none; border: 1px solid #00E5FF; border-radius: 4px;
    padding: 4px 6px; cursor: pointer; color: #00E5FF;
    transition: all 0.2s;
}
.replay-btn:hover { background: rgba(0,229,255,0.1); }
.input-label { font-size: 10px; color: #00E5FF; letter-spacing: 2px; font-weight: bold; font-family: 'Courier New', monospace; }
.input-row { display: flex; gap: 6px; }
.radio-input {
    flex: 1; background: #0a0c10; border: 1px solid #2d3139;
    border-radius: 4px; padding: 8px 10px;
    color: #00E5FF; font-family: 'Courier New', monospace; font-size: 13px;
    outline: none; transition: border-color 0.3s;
}
.radio-input:focus { border-color: #00E5FF; }
.radio-input::placeholder { color: #334; }
.send-btn {
    background: #00E5FF; color: #111; border: none; border-radius: 4px;
    padding: 8px 16px; font-weight: bold; font-size: 12px; letter-spacing: 1px;
    cursor: pointer; transition: all 0.2s;
}
.send-btn:hover { background: #33ecff; box-shadow: 0 0 10px rgba(0,229,255,0.3); }
.input-placeholder {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 70px; gap: 6px;
    font-size: 10px; color: #333; letter-spacing: 2px; font-family: 'Courier New', monospace;
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
.feedback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.pointer-events-none {
  pointer-events: none !important;
}
</style>
