<template>
  <div class="radio-cabinet" :class="{ 'dyslexic-font': accessibilityMode }">
    <div class="screw screw-tl" />
    <div class="screw screw-tr" />
    <div class="screw screw-bl" />
    <div class="screw screw-br" />

    <div class="radio-brand">
      <div class="brand-text">ASTRO <span class="brand-model">RX-7</span></div>
      <div class="brand-subtitle">COMMS RECEIVER</div>
      <button
        class="access-toggle"
        :title="accessibilityMode ? 'Desactivar modo lectura fácil' : 'Activar modo lectura fácil'"
        @click="accessibilityMode = !accessibilityMode"
      >
        <v-icon :color="accessibilityMode ? '#00E5FF' : '#555'" size="14">mdi-format-font</v-icon>
      </button>
    </div>

    <!-- Guía Visual de Roles -->
    <div v-if="isMultiplayer" class="role-guidance">
      <div v-if="subRole === 'listener'" class="guidance-pill listener">
        <v-icon color="white" size="14">mdi-ear-hearing</v-icon> TU ESCUCHAS | FRASE: {{ currentPhrase }}
      </div>
      <div v-if="subRole === 'writer'" class="guidance-pill writer">
        <v-icon color="white" size="14">mdi-keyboard</v-icon> TU ESCRIBES
      </div>
    </div>

    <div class="session-hud">
      <div class="hud-pill">Punts: {{ score }}</div>
      <div class="hud-pill" :class="{ 'hud-pill-alert': timeLeft <= 10 }">Temps: {{ timeLeft }}s</div>
    </div>

    <div class="screen-housing">
      <div class="screen-bezel">
        <div class="wave-panels">
          <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
            <div class="screen-label">TARGET</div>
            <canvas ref="targetWaveCanvas" height="90" width="260" />
            <div class="scanline" />
          </div>
          <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
            <div class="screen-label">SIGNAL</div>
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
          {{ isTuned ? '● LOCKED' : '○ SCANNING' }}
        </span>
      </div>
    </div>

    <!-- Solo el Oyente (o en single player) tiene acceso al Dial -->
    <div v-if="!isMultiplayer || subRole === 'listener'" class="dial-housing">
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
    <div v-else-if="subRole === 'writer'" class="writer-placeholder">
      <v-icon color="#00E5FF" size="48">mdi-radio-tower</v-icon>
      <div class="placeholder-text">FREQ. REQUERIDA: <span class="text-white">{{ targetFrequency.toFixed(1) }} MHz</span></div>
      <div class="placeholder-sub">Informa al teu company per a que sintonitzi</div>
    </div>

    <div class="screen-housing">
      <div class="screen-bezel">
        <!-- MINI CHAT INTEGRADO EN PANTALLA -->
        <div v-if="isMultiplayer" class="radio-mini-chat custom-scrollbar">
          <div v-for="(m, i) in multiplayerStore.coopChatMessages" :key="i" class="chat-msg" :class="{ 'msg-me': m.from === astroStore.user }">
            <span class="msg-sender">{{ m.from === astroStore.user ? 'TU' : 'COMP' }}:</span>
            <span class="msg-text">{{ m.text }}</span>
          </div>
        </div>

        <div class="wave-panels">
          <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
            <span class="screen-label">OSC-A</span>
            <canvas ref="canvasA" class="wave-canvas" />
            <div class="scanline" />
          </div>
          <div class="wave-screen" :class="{ 'screen-synced': isTuned }">
            <span class="screen-label">OSC-B</span>
            <canvas ref="canvasB" class="wave-canvas" />
            <div class="scanline" />
          </div>
        </div>
      </div>
    </div>
    <div class="input-housing">
      <!-- El escritor siempre ve el input, el oyente lo ve bloqueado -->
      <div v-if="isTuned || (isMultiplayer && subRole === 'writer')" class="input-active">
        <div class="input-header">
          <button v-if="!isMultiplayer || subRole === 'listener'" class="replay-btn" @click="() => { initAudio(); speakPhrase(1.0); }">
            <v-icon size="18">mdi-volume-high</v-icon>
          </button>
          <span class="input-label">
            {{ (isMultiplayer && subRole === 'listener') ? 'COMUNICACIÓN ACTIVA' : 'INCOMING TRANSMISSION' }}
          </span>
        </div>
        <div class="input-row">
          <input
            v-model="userGuess"
            autofocus
            class="radio-input"
            :disabled="isMultiplayer && subRole === 'listener'"
            :placeholder="(isMultiplayer && subRole === 'listener') ? 'El compañero está escribiendo...' : 'Escriu la frase...'"
            @keyup.enter="checkPhrase"
          >
          <button v-if="!isMultiplayer || subRole === 'writer'" class="send-btn" @click="checkPhrase">
            SEND
          </button>
          <!-- INPUT CHAT INTEGRADO -->
          <div v-if="isMultiplayer" class="mini-chat-inline">
             <input v-model="chatInput" class="mini-chat-input" placeholder="Chat..." @keyup.enter="sendRadioChat">
          </div>
        </div>
        <!-- Feedback de lo que escribe el compañero -->
        <div v-if="isMultiplayer && subRole === 'listener' && partnerText" class="partner-typing-indicator">
          <div class="typing-dots">
            <span /><span /><span />
          </div>
          <span class="partner-preview">"{{ partnerText }}"</span>
        </div>
      </div>
      <div v-else class="input-placeholder">
        <v-icon color="#444" size="18">mdi-antenna</v-icon>
        <span>ESPERANT SENYAL...</span>
      </div>
    </div>

    <v-snackbar v-model="showError" color="error" location="top" timeout="1500">
      ✗ DADES INCORRECTES - TORNA A INTENTAR
    </v-snackbar>

    <v-snackbar v-model="showSuccess" color="success" location="top" timeout="2000">
      ✓ SENYAL DESXIFRADA! +500 PTS | +10s
    </v-snackbar>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['game-over'])

  // Roles y Sincronización Cooperativa
  const subRole = computed(() => multiplayerStore.subRole)
  const partnerText = computed(() => multiplayerStore.partnerText)
  const accessibilityMode = ref(false)

  // Mini-chat de Radio
  const chatInput = ref('')
  const radioMessages = ref([])

  function sendRadioChat () {
    if (!chatInput.value.trim()) return
    multiplayerStore.sendGameAction({
      type: 'COOP_CHAT',
      text: chatInput.value.trim(),
    })
    chatInput.value = ''
  }

  // Frecuencia objetivo
  const targetFrequency = ref(Math.random() * 90 + 5)
  const currentFrequency = ref(Math.random() * 20)
  const tuningThreshold = 2
  const userGuess = ref('')
  const isTuned = ref(false)
  const showError = ref(false)
  const showSuccess = ref(false)
  const score = ref(0)
  const timeLeft = ref(60)
  const gameFinished = ref(false)
  let roundTimer = null

  // Sincronización de onda (Listener -> Writer)
  watch(currentFrequency, newFreq => {
    if (props.isMultiplayer && subRole.value === 'listener' && !gameFinished.value) {
      multiplayerStore.sendGameAction({
        type: 'FREQ_SYNC',
        frequency: newFreq,
      })
    }
  })

  // Recibir frecuencia del compañero
  watch(() => multiplayerStore.lastMessage, msg => {
    if (msg?.type === 'GAME_ACTION' && msg.action?.type === 'FREQ_SYNC' && subRole.value === 'writer') {
      currentFrequency.value = msg.action.frequency
      const dist = Math.abs(currentFrequency.value - targetFrequency.value)
      isTuned.value = dist < tuningThreshold
    }
  })

  const phrases = [
    'EL VAIXELL DAURAT BRILLA DE DIA',
    'EL PETIT PAQUET VA QUEDAR AL PARC',
    'ELS DRACS BOTEN SOBRE LES PEDRES',
    'TRES TRISTOS TIGRES MENGEN BLAT',
    'LA SARA SURT SOLA SEMPRE SENSE BARRET',
    'EN PEP POSA PERES PER AL PAPA',
    'EXTRAORDINARI DESCOBRIMENT A LA BIBLIOTECA',
    'LA NAU ESPACIAL DESPEGA A L\'ALBA',
    'BASE LUNAR REPORTA BON ESTAT',
  ]
  const shuffledPhrases = [...phrases].sort(() => Math.random() - 0.5)
  const currentPhrase = ref(shuffledPhrases[0])
  let speechRepeatTimer = null

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

  function startRotating (e) {
    if (gameFinished.value || (props.isMultiplayer && subRole.value !== 'listener')) return
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
    if (!isDragging || gameFinished.value || (props.isMultiplayer && subRole.value !== 'listener')) return
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0)
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0)
    const knob = document.querySelector('.knob-container').getBoundingClientRect()
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
    if (gameFinished.value || (props.isMultiplayer && subRole.value !== 'listener')) return
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
    if (props.isMultiplayer && subRole.value !== 'listener') return

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
    if (!gainNode || !audioCtx || (props.isMultiplayer && subRole.value !== 'listener')) return
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
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 0.5
    for (let i = 0; i < w; i += 18) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke() }
    for (let i = 0; i < h; i += 18) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke() }
    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
    const cleanAmp = 22, cleanFreq = 0.08, cleanPhase = time
    if (isTarget) {
      ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#FF9800'; ctx.setLineDash([])
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * cleanFreq + cleanPhase) * cleanAmp
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      if (isTuned.value) { ctx.shadowBlur = 15; ctx.shadowColor = '#FF9800'; ctx.stroke(); ctx.shadowBlur = 0 }
    } else {
      const dist = Math.abs(currentFrequency.value - targetFrequency.value)
      const prox = Math.max(0, 1 - (dist / 50))
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = `hsl(${180 + prox * 10}, 100%, ${50 + prox * 20}%)`
      for (let x = 0; x < w; x++) {
        const clean = Math.sin(x * cleanFreq + cleanPhase) * cleanAmp
        const c1 = Math.sin(x * 0.23 + time * 1.5) * 18
        const c2 = Math.sin(x * 0.07 + time * 0.7) * 12
        const noise = (Math.random() - 0.5) * 10 * (1 - prox)
        const y = h / 2 + clean * prox + (c1 + c2 * 0.5 + noise) * (1 - prox)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      if (prox > 0.8) { ctx.shadowBlur = 10 * prox; ctx.shadowColor = '#00E5FF'; ctx.stroke(); ctx.shadowBlur = 0 }
    }
  }

  function startSpeechLoop () {
    if (!isTuned.value || gameFinished.value || (props.isMultiplayer && subRole.value !== 'listener')) return
    speakPhrase(1, false)
  }

  function stopSpeechLoop () {
    if (speechRepeatTimer) { clearTimeout(speechRepeatTimer); speechRepeatTimer = null }
    window.speechSynthesis.cancel()
  }

  function speakPhrase (volume = 1, force = true) {
    if (!window.speechSynthesis || gameFinished.value) return
    // Evitar que ambos escuchen si no es necesario, pero si el usuario le da al botón explícitamente, debería sonar.
    // Si es automático (force=false) solo el oyente escucha. Si es manual (clic), cualquiera escucha.
    if (!force && props.isMultiplayer && subRole.value !== 'listener') return

    window.speechSynthesis.cancel()
    
    // Timeout mínimo para asegurar que el cancel se procesa
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(currentPhrase.value)
      u.lang = 'ca-ES'; u.rate = 0.85; u.pitch = 0.9; u.volume = volume
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        const v = voices.find(v => v.lang.includes('ca')) || voices.find(v => v.lang.includes('es')) || voices[0]
        if (v) u.voice = v
      }
      u.onend = () => {
        if (!force && isTuned.value && !gameFinished.value) {
          speechRepeatTimer = setTimeout(() => { if (isTuned.value && !gameFinished.value) speakPhrase(volume, false) }, 1500)
        }
      }
      window.speechSynthesis.speak(u)
    }, 100)
  }

  function initGame (force = false) {
    if (force) {
      targetFrequency.value = Math.random() * 90 + 5
      currentPhrase.value = phrases[Math.floor(Math.random() * phrases.length)]
      userGuess.value = ''
      isTuned.value = false
      stopSpeechLoop()
      updateNoise()
    }
  }

  function checkPhrase () {
    if (gameFinished.value || (props.isMultiplayer && subRole.value === 'listener')) return
    const norm = s => s.toUpperCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    if (norm(userGuess.value) === norm(currentPhrase.value)) {
      score.value += 500
      timeLeft.value = Math.min(60, timeLeft.value + 10)
      showSuccess.value = true
      
      if (props.isMultiplayer && !isHost.value) {
        multiplayerStore.sendGameAction({ type: 'SIGNAL_SUCCESS' })
      }

      if (timeLeft.value > 0) initGame(true)
      else finishGame()
    } else {
      showError.value = true
      userGuess.value = ''
    }
  }

  function startTimer () {
    if (roundTimer) clearInterval(roundTimer)
    let lastTick = Date.now()
    roundTimer = setInterval(() => {
      if (gameFinished.value) return
      if (!props.isMultiplayer || isHost.value) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000
          
          if (props.isMultiplayer && isHost.value) {
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }

          if (timeLeft.value === 0) finishGame()
        }
      }
    }, 500)
  }

  function finishGame (silent = false) {
    if (gameFinished.value) return
    if (props.isMultiplayer && !silent && timeLeft.value === 0) {
      multiplayerStore.submitRoundResult(); return
    }
    gameFinished.value = true; if (roundTimer) { clearInterval(roundTimer); roundTimer = null }
    stopSpeechLoop(); stopAudio()
    emit('game-over', score.value + timeLeft.value)
  }

  function stopAudio () {
    stopSpeechLoop()
    if (noiseNode) try { noiseNode.stop() } catch {}
    if (audioCtx) audioCtx.close()
    noiseNode = null; filterNode = null; gainNode = null; audioCtx = null
  }

  onMounted(() => {
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {}
    if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.radioData) {
      const teamId = multiplayerStore.room?.gameConfig?.teams[astroStore.user]
      const data = multiplayerStore.room?.gameConfig?.radioData[teamId] || multiplayerStore.room?.gameConfig?.radioData['default']
      if (data) { targetFrequency.value = data.frequency; currentPhrase.value = data.phrase }
    }
    drawWaves(); startTimer()
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return
    if (msg.type === 'ROUND_ENDED_BY_WINNER') { gameFinished.value = true; emit('game-over', score.value + timeLeft.value) }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'TIME_SYNC' && !isHost.value) timeLeft.value = msg.action.timeLeft
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SCORE_UPDATE' && !isHost.value) score.value = msg.action.score
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SIGNAL_SUCCESS' && isHost.value) {
       score.value += 500
       timeLeft.value = Math.min(60, timeLeft.value + 10)
       initGame(true)
    }
  })

  watch(score, newScore => { if (props.isMultiplayer && isHost.value) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore }) })

  onUnmounted(() => {
    removeDragListeners(); if (roundTimer) clearInterval(roundTimer)
    stopSpeechLoop(); stopAudio(); if (animationFrame) cancelAnimationFrame(animationFrame)
  })
</script>

<style scoped>
.radio-cabinet {
    max-width: 460px; width: 95vw;
    background: linear-gradient(145deg, #2c2f36 0%, #1e2028 50%, #282b33 100%);
    border: 3px solid #3d424d; border-radius: 14px; padding: 16px; position: relative;
    box-shadow: 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3);
}
.hide-cursor { cursor: none; }
.screw { position: absolute; width: 12px; height: 12px; background: radial-gradient(circle at 40% 35%, #888 0%, #444 100%); border-radius: 50%; border: 1px solid #333; z-index: 2; }
.screw::after { content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 1.5px; background: #333; transform: translate(-50%, -50%) rotate(45deg); }
.screw-tl { top: 8px; left: 8px; } .screw-tr { top: 8px; right: 8px; } .screw-bl { bottom: 8px; left: 8px; } .screw-br { bottom: 8px; right: 8px; }
.radio-brand { text-align: center; margin-bottom: 10px; }
.brand-text { font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #ccc; letter-spacing: 6px; }
.brand-model { color: #00E5FF; font-size: 12px; }
.brand-subtitle { font-size: 8px; color: #555; letter-spacing: 4px; }
.session-hud { display: flex; justify-content: center; gap: 10px; margin-bottom: 10px; }
.hud-pill { background: #15171c; border: 1px solid #2a2e36; border-radius: 999px; color: #d3d7e0; font-family: 'Courier New', monospace; font-size: 12px; padding: 6px 12px; }
.hud-pill-alert { color: #ff6e6e; border-color: #8b2d2d; }
.screen-housing { background: #111; border: 2px solid #3a3f4b; border-radius: 8px; padding: 6px; margin-bottom: 10px; }
.screen-bezel { background: #080a0e; border: 1px solid #222; border-radius: 4px; padding: 4px; }
.wave-panels { display: flex; gap: 6px; }
.wave-screen { flex: 1; background: #040608; border: 1px solid #1a1e26; border-radius: 3px; position: relative; overflow: hidden; }
.screen-synced { border-color: #00E5FF !important; }
.screen-label { position: absolute; top: 3px; left: 6px; font-size: 7px; color: #334; z-index: 1; }
.scanline { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px); pointer-events: none; }
.indicator-strip { display: flex; align-items: center; justify-content: space-between; background: #15171c; border: 1px solid #2a2e36; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; }
.freq-value { font-family: 'Courier New', monospace; font-size: 22px; color: #00E5FF; }
.indicator-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-green { background: #4caf50; } .dot-red { background: #f44336; } .dot-off { background: #222; }
.dial-housing { background: #15171c; border: 1px solid #2a2e36; border-radius: 6px; padding: 10px 14px 14px; margin-bottom: 10px; }
.dial-track { position: relative; height: 6px; background: #222; border-radius: 3px; margin-bottom: 12px; }
.dial-indicator { position: absolute; top: -3px; width: 4px; height: 12px; background: #f44336; }
.knob-container { width: 80px; height: 80px; cursor: pointer; position: relative; margin: 0 auto; }
.knob-body { width: 100%; height: 100%; background: radial-gradient(circle at 38% 32%, #d0d0d0 0%, #8a8a8a 60%, #666 100%); border-radius: 50%; border: 3px solid #444; position: relative; }
.knob-line { position: absolute; top: 6px; left: 50%; width: 3px; height: 14px; background: #222; transform: translateX(-50%); }
.input-housing { min-height: 90px; background: #15171c; border: 1px solid #2a2e36; border-radius: 6px; padding: 10px; }
.radio-input { width: 100%; background: #000; border: 1px solid #333; color: #00E5FF; padding: 8px; font-family: 'Courier New', monospace; }
.send-btn { background: #00E5FF; color: #000; border: none; padding: 8px 16px; font-weight: bold; cursor: pointer; }
.input-placeholder { display: flex; align-items: center; justify-content: center; height: 70px; gap: 8px; color: #444; }
</style>
.radio-mini-chat { position: absolute; top: 10px; right: 10px; width: 120px; max-height: 60px; background: rgba(0,0,0,0.7); border: 1px solid #333; border-radius: 4px; padding: 4px; overflow-y: auto; font-size: 9px; z-index: 10; pointer-events: none; }
.chat-msg { margin-bottom: 2px; }
.msg-sender { color: #00E5FF; font-weight: bold; }
.mini-chat-inline { margin-left: 8px; flex: 1; }
.mini-chat-input { width: 100%; background: #080a0e; border: 1px solid #333; color: #fff; padding: 4px 8px; font-size: 11px; border-radius: 4px; }
