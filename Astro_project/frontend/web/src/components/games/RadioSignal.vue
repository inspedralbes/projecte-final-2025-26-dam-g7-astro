<template>
    <div class="radio-cabinet">
        <div class="screw screw-tl"></div>
        <div class="screw screw-tr"></div>
        <div class="screw screw-bl"></div>
        <div class="screw screw-br"></div>

        <div class="radio-brand">
            <div class="brand-text">ASTRO <span class="brand-model">RX-7</span></div>
            <div class="brand-subtitle">COMMS RECEIVER</div>
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
                <div class="input-row">
                    <input
                        v-model="userGuess"
                        class="radio-input"
                        placeholder="Escriu la frase..."
                        @keyup.enter="checkPhrase"
                        autofocus
                    />
                    <button class="send-btn" @click="checkPhrase">
                        SEND
                    </button>
                </div>
            </div>
            <div v-else class="input-placeholder">
                <v-icon size="18" color="#444">mdi-antenna</v-icon>
                <span>ESPERANT SENYAL...</span>
            </div>
        </div>

        <v-snackbar v-model="showError" color="error" timeout="1500" location="top">
            ✗ DADES INCORRECTES - TORNA A INTENTAR
        </v-snackbar>

        <v-snackbar v-model="showSuccess" color="success" timeout="2000" location="top">
            ✓ SENYAL DESXIFRADA! +150 PTS | +15s
        </v-snackbar>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();

const props = defineProps({
    isMultiplayer: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['game-over']);

// Frecuencia objetivo
const targetFrequency = ref(Math.random() * 90 + 5);
const currentFrequency = ref(Math.random() * 20); 
const tuningThreshold = 2.0;
const userGuess = ref('');
const isTuned = ref(false);
const showError = ref(false);
const showSuccess = ref(false); // NUEVO: Feedback de éxito
const score = ref(0);
const timeLeft = ref(60);
const gameFinished = ref(false);
let roundTimer = null;

const phrases = [
    'EL VAIXELL DAURAT BRILLA DE DIA',
    // 'LA BIODIVERSITAT ABUNDA AL BOSC',
    'EL PETIT PAQUET VA QUEDAR AL PARC',
    'ELS DRACS BOTEN SOBRE LES PEDRES',
    'TRES TRISTOS TIGRES MENGEN BLAT',
    // 'LES FLORS CREIXEN AL COSTAT DE LA PLACA',
    // 'LA MAMA EM MIMA MOLT CADA MATI',
    'LA SARA SURT SOLA SEMPRE SENSE BARRET',
    'EN PEP POSA PERES PER AL PAPA',
    'EXTRAORDINARI DESCOBRIMENT A LA BIBLIOTECA',
    // 'INCOMPRENSIBLE PREDICCIO METEOROLOGICA',
    'LA NAU ESPACIAL DESPEGA A L\'ALBA',
    'BASE LUNAR REPORTA BON ESTAT',
];
// Phrases shuffled at start
const shuffledPhrases = [...phrases].sort(() => Math.random() - 0.5).slice(0, 4); // 4 frases per partida
const phraseIndex = ref(0); // Frase atual
const currentPhrase = ref(shuffledPhrases[0]);
const totalPhrases = shuffledPhrases.length;
let speechRepeatTimer = null;

// ---- DIAL ----
const knobRotation = ref(0);
let isDragging = false;
let startAngle = 0;
let currentKnobRotation = 0;

const removeDragListeners = () => {
    window.removeEventListener('mousemove', onRotating);
    window.removeEventListener('mouseup', stopRotating);
    window.removeEventListener('touchmove', onRotating);
    window.removeEventListener('touchend', stopRotating);
};

knobRotation.value = (currentFrequency.value / 100) * 360;
currentKnobRotation = knobRotation.value;

const startRotating = (e) => {
    if (gameFinished.value) return;
    isDragging = true;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    const knob = e.currentTarget.getBoundingClientRect();
    const cx = knob.left + knob.width / 2;
    const cy = knob.top + knob.height / 2;
    startAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) - currentKnobRotation;
    window.addEventListener('mousemove', onRotating);
    window.addEventListener('mouseup', stopRotating);
    window.addEventListener('touchmove', onRotating, { passive: false });
    window.addEventListener('touchend', stopRotating);
    initAudio();
};

const onRotating = (e) => {
    if (!isDragging || gameFinished.value) return;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    const knob = document.querySelector('.knob-container').getBoundingClientRect();
    const cx = knob.left + knob.width / 2;
    const cy = knob.top + knob.height / 2;
    const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    let rotation = angle - startAngle;
    while (rotation < 0) rotation += 360;
    while (rotation >= 360) rotation -= 360;
    currentKnobRotation = rotation;
    knobRotation.value = rotation;
    currentFrequency.value = (rotation / 360) * 100;
    updateNoise();
    if (isTuned.value) { isTuned.value = false; stopSpeechLoop(); }
};

const stopRotating = () => {
    if (gameFinished.value) return;
    isDragging = false;
    removeDragListeners();
    const distance = Math.abs(currentFrequency.value - targetFrequency.value);
    if (distance < tuningThreshold) {
        isTuned.value = true;
        if (gainNode && audioCtx) gainNode.gain.setTargetAtTime(0.005, audioCtx.currentTime, 0.1);
        startSpeechLoop();
    } else {
        isTuned.value = false;
        stopSpeechLoop();
    }
};

// ---- AUDIO ----
let audioCtx = null;
let noiseNode = null;
let gainNode = null;
let filterNode = null;

const initAudio = async () => {
    if (audioCtx) { if (audioCtx.state === 'suspended') await audioCtx.resume(); return; }
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = audioCtx.createBuffer(1, 2 * audioCtx.sampleRate, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buf; noiseNode.loop = true;
        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'bandpass'; filterNode.frequency.value = 800; filterNode.Q.value = 1.2;
        gainNode = audioCtx.createGain(); gainNode.gain.value = 0.15;
        noiseNode.connect(filterNode); filterNode.connect(gainNode); gainNode.connect(audioCtx.destination);
        noiseNode.start();
    } catch (e) { console.warn('Audio error'); }
};

const updateNoise = () => {
    if (!gainNode || !audioCtx) return;
    const dist = Math.abs(currentFrequency.value - targetFrequency.value);
    gainNode.gain.setTargetAtTime(Math.max(0.01, Math.min(dist / 15, 0.2)), audioCtx.currentTime, 0.1);
};

// ---- ONDAS ----
const targetWaveCanvas = ref(null);
const currentWaveCanvas = ref(null);
let animationFrame = null;
let time = 0;

const drawWaves = () => {
    time += 0.04;
    if (targetWaveCanvas.value && currentWaveCanvas.value) {
        renderWave(targetWaveCanvas.value, true);
        renderWave(currentWaveCanvas.value, false);
    }
    animationFrame = requestAnimationFrame(drawWaves);
};

const renderWave = (canvas, isTarget) => {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 18) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += 18) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();

    const cleanAmp = 22, cleanFreq = 0.08, cleanPhase = time;

    if (isTarget) {
        ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#FF9800'; ctx.setLineDash([]);
        for (let x = 0; x < w; x++) {
            const y = h/2 + Math.sin(x * cleanFreq + cleanPhase) * cleanAmp;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        if (isTuned.value) { ctx.shadowBlur = 15; ctx.shadowColor = '#FF9800'; ctx.stroke(); ctx.shadowBlur = 0; }
    } else {
        const dist = Math.abs(currentFrequency.value - targetFrequency.value);
        const prox = Math.max(0, 1 - (dist / 50));
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = `hsl(${180 + prox * 10}, 100%, ${50 + prox * 20}%)`;
        for (let x = 0; x < w; x++) {
            const clean = Math.sin(x * cleanFreq + cleanPhase) * cleanAmp;
            const c1 = Math.sin(x * 0.23 + time * 1.5) * 18;
            const c2 = Math.sin(x * 0.07 + time * 0.7) * 12;
            const c3 = Math.sin(x * 0.35 + time * 2.3) * 8;
            const noise = (Math.random() - 0.5) * 10 * (1 - prox);
            const y = h/2 + clean * prox + (c1 + c2*0.5 + c3*0.3 + noise) * (1 - prox);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        if (prox > 0.8) { ctx.shadowBlur = 10 * prox; ctx.shadowColor = '#00E5FF'; ctx.stroke(); ctx.shadowBlur = 0; }
    }
};

// ---- VOZ ----
const startSpeechLoop = () => {
    if (!isTuned.value || gameFinished.value) return;
    speakPhrase(1.0);
};

const stopSpeechLoop = () => {
    if (speechRepeatTimer) {
        clearTimeout(speechRepeatTimer);
        speechRepeatTimer = null;
    }
    window.speechSynthesis.cancel();
};

const speakPhrase = (volume = 1.0) => {
    if (!window.speechSynthesis || gameFinished.value) return;
    
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentPhrase.value);
    
    // Configurar veus
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.includes('ca')) ||
              voices.find(v => v.lang.includes('es') && v.name.includes('Google')) ||
              voices.find(v => v.lang.includes('es')) || voices[0];
    
    if (v) u.voice = v;
    u.lang = 'ca-ES';
    u.rate = 0.8;
    u.pitch = 0.8;
    u.volume = volume;

    // Lògica de repetició robusta: quan acaba, espera 1s i torna a parlar si seguim afinats
    u.onend = () => {
        if (isTuned.value && !gameFinished.value) {
            speechRepeatTimer = setTimeout(() => {
                if (isTuned.value && !gameFinished.value) speakPhrase(volume);
            }, 1000);
        }
    };

    window.speechSynthesis.speak(u);
};

// LÓGICA CORE CORREGIDA
const checkPhrase = () => {
    if (gameFinished.value) return;
    const norm = (s) => s.toUpperCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    if (norm(userGuess.value) === norm(currentPhrase.value)) {
        // En lugar de acabar, damos Puntos + Tiempo y cambiamos de frecuencia (Lógica dev)
        score.value += 150;
        timeLeft.value += 15;
        userGuess.value = '';
        showSuccess.value = true;
        
        // Generamos nueva señal objetivo
        currentPhrase.value = phrases[Math.floor(Math.random() * phrases.length)];
        targetFrequency.value = Math.random() * 90 + 5;
        
        // Reseteamos el estado para que vuelva a buscar
        isTuned.value = false;
        stopSpeechLoop();
        updateNoise();
    } else { 
        showError.value = true; 
        userGuess.value = ''; 
    }
};

const startTimer = () => {
    if (roundTimer) {
        clearInterval(roundTimer);
    }

    roundTimer = setInterval(() => {
        if (gameFinished.value) return;
        timeLeft.value = Math.max(0, timeLeft.value - 1);
        if (timeLeft.value === 0) {
            finishGame();
        }
    }, 1000);
};

const finishGame = (silent = false) => {
    if (gameFinished.value) return;
    
    if (props.isMultiplayer && !silent) {
        multiplayerStore.submitRoundResult();
        return;
    }

    gameFinished.value = true;
    isDragging = false;
    removeDragListeners();
    if (roundTimer) {
        clearInterval(roundTimer);
        roundTimer = null;
    }
    const reward = score.value + timeLeft.value;
    stopSpeechLoop();
    stopAudio();
    emit('game-over', reward);
};

const stopAudio = () => {
    stopSpeechLoop();
    if (noiseNode) try { noiseNode.stop(); } catch(e) {}
    if (audioCtx) audioCtx.close();
    noiseNode = null;
    filterNode = null;
    gainNode = null;
    audioCtx = null;
};

onMounted(() => {
    drawWaves();
    startTimer();
});

// Listener para eventos multijugador (Mantenemos de HEAD)
watch(() => multiplayerStore.lastMessage, (msg) => {
    if (!msg) return;

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
        // Alguien ganó la ronda, cerrar este juego formalmente
        gameFinished.value = true; 
        emit('game-over', score.value + timeLeft.value);
    }
});

// Notificar puntuación al servidor en modo multijugador (Mantenemos de HEAD)
watch(score, (newScore) => {
    if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
            type: 'SCORE_UPDATE',
            score: newScore
        });
    }
});

onUnmounted(() => {
    isDragging = false;
    removeDragListeners();
    if (roundTimer) clearInterval(roundTimer);
    stopSpeechLoop();
    stopAudio();
    if (animationFrame) cancelAnimationFrame(animationFrame);
});
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
</style>