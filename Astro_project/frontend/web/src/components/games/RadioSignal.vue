<template>
  <div class="radio-cabinet">
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
          <button class="replay-btn" @click="speakPhrase(1.0)">
            <v-icon size="18">mdi-volume-high</v-icon>
          </button>
          <span class="input-label">{{ $t('radioSignal.incomingTransmission') }}</span>
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
      </div>
      <div v-else class="input-placeholder">
        <v-icon color="#444" size="18">mdi-antenna</v-icon>
        <span>{{ $t('radioSignal.waiting') }}</span>
      </div>
    </div>

    <!-- INTERFAZ COOPERATIVA: TRANSMISIÓN BIDIRECCIONAL -->
    <div v-if="isMultiplayer" class="coop-status-bar">
      <div class="coop-panel">
        <div class="coop-label">{{ $t('radioSignal.partnerComms') || 'COMUNICACIÓ AMB EL COMPANY' }}</div>

        <!-- Historial de mensajes -->
        <div ref="chatHistoryRef" class="chat-history mb-2">
          <div v-for="(msg, i) in multiplayerStore.coopChatMessages" :key="i" class="chat-msg">
            <span class="chat-user">{{ msg.from === astroStore.user ? t('radioSignal.you') : t('radioSignal.partner') }}:</span>
            <span class="chat-text">{{ msg.text }}</span>
          </div>
          <div v-if="multiplayerStore.partnerText" class="chat-msg typing">
            <span class="chat-user">{{ $t('radioSignal.partner') }}:</span>
            <span class="chat-text italic">{{ multiplayerStore.partnerText }}...</span>
          </div>
        </div>

        <div class="partner-signal-box mb-2">
          <span class="signal-label">{{ $t('radioSignal.youHear') || 'SENTS:' }}</span>
          <span class="signal-text">{{ multiplayerStore.partnerText || '---' }}</span>
        </div>
        <input
          v-model="localTransmitText"
          class="transmit-input"
          :placeholder="$t('radioSignal.typeAndEnter') || 'Escriu un missatge i prem Enter...'"
          @input="sendTransmission"
          @keyup.enter="sendChatMessage"
        >
      </div>
    </div>

    <v-snackbar v-model="showError" color="error" location="top" timeout="1500">
      ✖ {{ $t('radioSignal.error') || 'DADES INCORRECTES - TORNA A INTENTAR' }}
    </v-snackbar>

    <!-- Overlay de Éxito Prominente -->
    <v-overlay
      v-model="showSuccess"
      class="align-center justify-center"
      contained
      scrim="#000"
      opacity="0.7"
    >
      <div class="success-flash-container text-center pa-10">
        <v-icon color="success" size="150" class="mb-6 success-icon-anim">mdi-check-decagram-outline</v-icon>
        <h2 class="text-h2 font-weight-black text-success glow-text-success mb-2">{{ $t('radioSignal.success') }}</h2>
        <div class="text-h4 text-white font-weight-bold">{{ $t('radioSignal.successDesc') }}</div>
      </div>
    </v-overlay>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { radioSignalData } from '@/data/radioSignalData'
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
  })

  const emit = defineEmits(['game-over'])

  const subRole = computed(() => multiplayerStore.subRole)
  const myTeam = computed(() => multiplayerStore.room?.gameConfig?.teams?.[astroStore.user])
  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)
  const localTransmitText = ref('')

  // Frecuencia objetivo
  const targetFrequency = ref(Math.random() * 90 + 5)
  const currentFrequency = ref(Math.random() * 20)
  const tuningThreshold = 2
  const userGuess = ref('')
  const isTuned = ref(false)
  const showError = ref(false)
  const showSuccess = ref(false)
  const score = ref(0)
  const timeLeft = ref(props.isMultiplayer ? 90 : 60)
  const gameFinished = ref(false)
  let roundTimer = null

  const phrases = computed(() => radioSignalData[locale.value] || radioSignalData['es'])
  const shuffledPhrases = ref([])
  const phraseIndex = ref(0)
  const phraseToSolve = ref('')
  const phraseToHear = ref('')

  let speechRepeatTimer = null

  // Initialize phrases
  onMounted(() => {
    shuffledPhrases.value = [...phrases.value].sort(() => Math.random() - 0.5).slice(0, 8)
    phraseToSolve.value = shuffledPhrases.value[0]
    phraseToHear.value = shuffledPhrases.value[0]

    // SINCRONIZACIÓN DE ESTADO ASIMÉTRICO (Desde el Server)
    if (props.isMultiplayer) {
      const room = multiplayerStore.room
      if (room?.gameConfig?.radioData && myTeam.value) {
        const teamData = room.gameConfig.radioData[myTeam.value]
        if (teamData) {
          targetFrequency.value = teamData.frequency
          // Asimetría: uno resuelve una parte y el otro la otra
          if (subRole.value === 'listener') {
            phraseToSolve.value = teamData.phrase
            phraseToHear.value = teamData.partnerPhrase || phrases.value[1]
          } else {
            phraseToSolve.value = teamData.partnerPhrase || phrases.value[1]
            phraseToHear.value = teamData.phrase
          }
        }
      }
    }
  })

  // ---- DIAL ----
  const knobRotation = ref(0)
  let isDragging = false
  let startAngle = 0
  let currentKnobRotation = 0

  function removeDragListeners () {
    window.removeEventListener('mousemove', onRotating)
    window.removeEventListener('mouseup', stopRotating)
    window.removeEventListener('touchmove', onRotating)
    window.removeEventListener('touchend', stopRotating)
  }

  onMounted(() => {
    knobRotation.value = (currentFrequency.value / 100) * 360
    currentKnobRotation = knobRotation.value
  })

  function startRotating (e) {
    if (gameFinished.value) return
    isDragging = true
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
    const knob = e.currentTarget.getBoundingClientRect()
    const cx = knob.left + knob.width / 2
    const cy = knob.top + knob.height / 2
    startAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) - currentKnobRotation
    window.addEventListener('mousemove', onRotating)
    window.addEventListener('mouseup', stopRotating)
    window.addEventListener('touchmove', onRotating, { passive: false })
    window.addEventListener('touchend', stopRotating)
    initAudio()
  }

  function onRotating (e) {
    if (!isDragging || gameFinished.value) return
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
    const knobEl = document.querySelector('.knob-container')
    if (!knobEl) return
    const knob = knobEl.getBoundingClientRect()
    const cx = knob.left + knob.width / 2
    const cy = knob.top + knob.height / 2
    const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI)
    let rotation = angle - startAngle
    while (rotation < 0) rotation += 360
    while (rotation >= 360) rotation -= 360
    currentKnobRotation = rotation
    knobRotation.value = rotation
    currentFrequency.value = (rotation / 360) * 100
    updateNoise()
    if (isTuned.value) {
      isTuned.value = false; stopSpeechLoop()
    }
  }

  function stopRotating () {
    if (gameFinished.value) return
    isDragging = false
    removeDragListeners()
    const distance = Math.abs(currentFrequency.value - targetFrequency.value)
    if (distance < tuningThreshold) {
      isTuned.value = true
      if (gainNode && audioCtx) gainNode.gain.setTargetAtTime(0.005, audioCtx.currentTime, 0.1)
      startSpeechLoop()
    } else {
      isTuned.value = false
      stopSpeechLoop()
    }
  }

  // ---- AUDIO ----
  let audioCtx = null
  let noiseNode = null
  let gainNode = null
  let filterNode = null

  async function initAudio () {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') await audioCtx.resume(); return
    }
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const buf = audioCtx.createBuffer(1, 2 * audioCtx.sampleRate, audioCtx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      noiseNode = audioCtx.createBufferSource()
      noiseNode.buffer = buf; noiseNode.loop = true
      filterNode = audioCtx.createBiquadFilter()
      filterNode.type = 'bandpass'; filterNode.frequency.value = 800; filterNode.Q.value = 1.2
      gainNode = audioCtx.createGain(); gainNode.gain.value = 0.15
      noiseNode.connect(filterNode); filterNode.connect(gainNode); gainNode.connect(audioCtx.destination)
      noiseNode.start()
    } catch {
      console.warn('Audio error')
    }
  }

  function updateNoise () {
    if (!gainNode || !audioCtx) return
    const dist = Math.abs(currentFrequency.value - targetFrequency.value)
    gainNode.gain.setTargetAtTime(Math.max(0.01, Math.min(dist / 15, 0.2)), audioCtx.currentTime, 0.1)
  }

  // ---- ONDAS ----
  const targetWaveCanvas = ref(null)
  const currentWaveCanvas = ref(null)
  let animationFrame = null
  let time = 0

  function drawWaves () {
    time += 0.04
    if (targetWaveCanvas.value && currentWaveCanvas.value) {
      renderWave(targetWaveCanvas.value, true)
      renderWave(currentWaveCanvas.value, false)
    }
    animationFrame = requestAnimationFrame(drawWaves)
  }

  function renderWave (canvas, isTarget) {
    const ctxWave = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctxWave.clearRect(0, 0, w, h)

    ctxWave.strokeStyle = '#0d1117'; ctxWave.lineWidth = 0.5
    for (let i = 0; i < w; i += 18) {
      ctxWave.beginPath(); ctxWave.moveTo(i, 0); ctxWave.lineTo(i, h); ctxWave.stroke()
    }
    for (let i = 0; i < h; i += 18) {
      ctxWave.beginPath(); ctxWave.moveTo(0, i); ctxWave.lineTo(w, i); ctxWave.stroke()
    }
    ctxWave.strokeStyle = '#1a2030'; ctxWave.lineWidth = 1
    ctxWave.beginPath(); ctxWave.moveTo(0, h / 2); ctxWave.lineTo(w, h / 2); ctxWave.stroke()

    const cleanAmp = 22, cleanFreq = 0.08, cleanPhase = time

    if (isTarget) {
      ctxWave.beginPath(); ctxWave.lineWidth = 2.5; ctxWave.strokeStyle = '#FF9800'; ctxWave.setLineDash([])
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * cleanFreq + cleanPhase) * cleanAmp
        x === 0 ? ctxWave.moveTo(x, y) : ctxWave.lineTo(x, y)
      }
      ctxWave.stroke()
      if (isTuned.value) {
        ctxWave.shadowBlur = 15; ctxWave.shadowColor = '#FF9800'; ctxWave.stroke(); ctxWave.shadowBlur = 0
      }
    } else {
      const dist = Math.abs(currentFrequency.value - targetFrequency.value)
      const prox = Math.max(0, 1 - (dist / 50))
      ctxWave.beginPath(); ctxWave.lineWidth = 2; ctxWave.strokeStyle = `hsl(${180 + prox * 10}, 100%, ${50 + prox * 20}%)`
      for (let x = 0; x < w; x++) {
        const clean = Math.sin(x * cleanFreq + cleanPhase) * cleanAmp
        const c1 = Math.sin(x * 0.23 + time * 1.5) * 18
        const c2 = Math.sin(x * 0.07 + time * 0.7) * 12
        const c3 = Math.sin(x * 0.35 + time * 2.3) * 8
        const noise = (Math.random() - 0.5) * 10 * (1 - prox)
        const y = h / 2 + clean * prox + (c1 + c2 * 0.5 + c3 * 0.3 + noise) * (1 - prox)
        x === 0 ? ctxWave.moveTo(x, y) : ctxWave.lineTo(x, y)
      }
      ctxWave.stroke()
      if (prox > 0.8) {
        ctxWave.shadowBlur = 10 * prox; ctxWave.shadowColor = '#00E5FF'; ctxWave.stroke(); ctxWave.shadowBlur = 0
      }
    }
  }

  // ---- VOZ ----
  function startSpeechLoop () {
    if (!isTuned.value || gameFinished.value) return
    speakPhrase(1)
  }

  function stopSpeechLoop () {
    if (speechRepeatTimer) {
      clearTimeout(speechRepeatTimer)
      speechRepeatTimer = null
    }
    window.speechSynthesis.cancel()
  }

  function speakPhrase (volume = 1) {
    if (!window.speechSynthesis || gameFinished.value) return

    window.speechSynthesis.cancel()

    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(phraseToHear.value)

      const setupVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        const targetLang = locale.value === 'ca' ? 'ca' : 'es'
        const v = voices.find(v => v.lang.includes(targetLang))
          || voices.find(v => v.lang.includes('es') && v.name.includes('Google'))
          || voices.find(v => v.lang.includes('es')) || voices[0]
        if (v) u.voice = v
      }

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          setupVoice()
          window.speechSynthesis.speak(u)
        }
      } else {
        setupVoice()
        window.speechSynthesis.speak(u)
      }

      u.lang = locale.value === 'ca' ? 'ca-ES' : 'es-ES'
      u.rate = 0.9
      u.pitch = 1
      u.volume = volume
    }, 50)
  }

  // ---- TRANSMISIÓN COOPERATIVA ----
  function sendTransmission () {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'PARTNER_TYPING',
        text: localTransmitText.value,
      })
    }
  }

  function sendChatMessage () {
    if (props.isMultiplayer && localTransmitText.value.trim()) {
      multiplayerStore.sendGameAction({
        type: 'COOP_CHAT',
        text: localTransmitText.value.trim(),
      })
      localTransmitText.value = ''
      multiplayerStore.sendGameAction({
        type: 'PARTNER_TYPING',
        text: '',
      })
    }
  }

  function checkPhrase () {
    if (gameFinished.value) return
    const norm = s => s.toUpperCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')

    if (norm(userGuess.value) === norm(phraseToSolve.value)) {
      score.value += 150
      timeLeft.value += 15
      userGuess.value = ''
      showSuccess.value = true

      targetFrequency.value = Math.random() * 90 + 5

      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'RADIO_PHRASE_SOLVED',
          teamId: myTeam.value,
          pointsGained: 150,
          newFreq: targetFrequency.value
        })
      } else {
        phraseIndex.value++
        const nextPhrase = shuffledPhrases.value[phraseIndex.value] || phrases.value[0]
        phraseToSolve.value = nextPhrase
        phraseToHear.value = nextPhrase
      }

      isTuned.value = false
      stopSpeechLoop()
      updateNoise()
    } else {
      showError.value = true
      userGuess.value = ''
    }
  }

  function startTimer () {
    if (roundTimer) clearInterval(roundTimer)

    if (!props.isMultiplayer || isHost.value) {
      roundTimer = setInterval(() => {
        if (gameFinished.value) return
        timeLeft.value = Math.max(0, timeLeft.value - 1)

        if (props.isMultiplayer && isHost.value) {
          multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
        }

        if (timeLeft.value === 0) {
          finishGame()
        }
      }, 1000)
    }
  }

  function finishGame (silent = false) {
    if (gameFinished.value) return

    gameFinished.value = true
    isDragging = false
    removeDragListeners()
    stopSpeechLoop()
    stopAudio()

    if (props.isMultiplayer && !silent) {
      multiplayerStore.submitRoundResult()
      return
    }

    if (roundTimer) {
      clearInterval(roundTimer)
      roundTimer = null
    }
    const reward = score.value + timeLeft.value
    emit('game-over', reward)
  }

  function stopAudio () {
    stopSpeechLoop()
    if (noiseNode) try {
      noiseNode.stop()
    } catch {}
    if (audioCtx) audioCtx.close()
    noiseNode = null
    filterNode = null
    gainNode = null
    audioCtx = null
  }

  onMounted(() => {
    drawWaves()
    if (props.isMultiplayer) {
      // Delay para el briefing (Reducido a 3s)
      setTimeout(() => {
        startTimer()
      }, 3000)
    } else {
      startTimer()
    }
  })

  // Listener para eventos multijugador
  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      if (!gameFinished.value) {
        finishGame(true)
        emit('game-over', score.value)
      }
      return
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'RADIO_INIT_ASYNC' && !isHost.value) {
        targetFrequency.value = msg.action.newFreq
        phraseToSolve.value = msg.action.guestSolve
        phraseToHear.value = msg.action.hostSolve
      }

      if (msg.action?.type === 'RADIO_PHRASE_SOLVED' && msg.action.teamId === myTeam.value) {
        score.value += msg.action.pointsGained
        targetFrequency.value = msg.action.newFreq
        
        // Rotamos frases para el equipo
        phraseIndex.value++
        const p1 = shuffledPhrases.value[phraseIndex.value] || phrases.value[0]
        const p2 = shuffledPhrases.value[phraseIndex.value + 1] || phrases.value[1]

        if (subRole.value === 'listener') {
          phraseToSolve.value = p1
          phraseToHear.value = p2
        } else {
          phraseToSolve.value = p2
          phraseToHear.value = p1
        }
      }

      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) finishGame()
      }
    }
  }, { immediate: true })

  watch(score, newScore => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'SCORE_UPDATE',
        score: newScore,
      })
    }
  })

  onUnmounted(() => {
    isDragging = false
    removeDragListeners()
    if (roundTimer) clearInterval(roundTimer)
    stopSpeechLoop()
    stopAudio()
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })
</script>

<style scoped>
.radio-cabinet {
    max-width: 460px;
    width: 95vw;
    background: linear-gradient(145deg, #2c2f36 0%, #1e2028 50%, #282b33 100%);
    border: 3px solid #3d424d;
    border-radius: 14px;
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
    font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold;
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
.input-active { animation: fadeUp 0.3s ease-out; }
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
.send-btn {
    background: #00E5FF; color: #080a0e; border: none; border-radius: 4px;
    padding: 0 16px; font-family: 'Courier New', monospace; font-weight: bold;
    cursor: pointer; transition: all 0.2s; font-size: 11px;
}
.send-btn:hover { background: #fff; box-shadow: 0 0 12px #00E5FF; }

.input-placeholder {
    height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; color: #444; font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 2px;
}

.coop-status-bar {
    margin-top: 15px;
    background: rgba(0, 229, 255, 0.05);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 8px;
    padding: 10px;
}

.coop-label {
    font-size: 10px;
    color: #00E5FF;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 10px;
    text-align: center;
}

.chat-history {
    height: 80px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    padding: 5px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
}

.chat-msg {
    margin-bottom: 4px;
    line-height: 1.2;
}

.chat-user {
    color: #00E5FF;
    font-weight: bold;
    margin-right: 5px;
}

.chat-text {
    color: #fff;
}

.typing .chat-text {
    color: #aaa;
}

.partner-signal-box {
    background: rgba(255, 152, 0, 0.1);
    border: 1px dashed rgba(255, 152, 0, 0.3);
    border-radius: 4px;
    padding: 6px;
    display: flex;
    gap: 10px;
    align-items: center;
}

.signal-label {
    font-size: 9px;
    color: #FF9800;
    font-weight: bold;
}

.signal-text {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #fff;
    letter-spacing: 1px;
}

.transmit-input {
    width: 100%;
    background: #0a0c10;
    border: 1px solid #2d3139;
    border-radius: 4px;
    padding: 6px 10px;
    color: #00E5FF;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    outline: none;
}

.transmit-input:focus {
    border-color: #00E5FF;
}

.italic {
    font-style: italic;
}

/* ÉXITO FEEDBACK */
.glow-text-success {
    text-shadow: 0 0 20px rgba(76, 175, 80, 0.8), 0 0 40px rgba(76, 175, 80, 0.4);
}

.success-icon-anim {
    animation: success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes success-pop {
    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
    70% { transform: scale(1.2) rotate(10deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
}

.success-flash-container {
    background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, transparent 70%);
}
</style>
