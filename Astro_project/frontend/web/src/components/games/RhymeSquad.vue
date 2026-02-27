<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container pa-4">
    
    <v-card v-if="!isPlaying && !isGameOver" width="100%" max-width="600" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-timer-sand" color="cyan-accent-3" size="80" class="mb-4 animate-bounce"></v-icon>
      <h1 class="text-h3 font-weight-black text-white mb-4">Escuadrón de Rimas</h1>
      <p class="text-h6 text-grey-lighten-1 mb-8">
        Tienes <span class="text-cyan-accent-3 font-weight-bold">60 SEGUNDOS</span>. Atrapa rimas para sumar 2 segundos extra. ¡Si fallas perderás vidas!
      </p>
      <v-btn color="cyan-accent-3" size="x-large" block rounded="pill" class="font-weight-black text-black" @click="startGame">
        INICIAR MISIÓN
      </v-btn>
    </v-card>

    <template v-else-if="isPlaying">
      
      <v-card width="100%" max-width="1000" class="mb-4 pa-4 bg-deep-purple-darken-4 elevation-10 flex-shrink-0" rounded="xl" style="z-index: 10;">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h2 class="text-h5 font-weight-bold text-cyan-accent-2">🎧 Escuadrón Fonológico</h2>
            <div class="text-caption text-grey-lighten-2 mt-1">
              <span class="font-weight-bold">Punts: {{ score }}</span>
              <span class="mx-2">|</span>
              <span class="font-weight-bold" :class="timeLeft <= 15 ? 'text-red-accent-2 animate-pulse' : 'text-blue-lighten-2'">
                Temps: {{ timeLeft }}s
              </span>
              <span class="mx-2">|</span>
              <span :class="lives === 1 ? 'text-red-accent-2 font-weight-bold' : 'text-green-accent-3'">Vides: {{ lives }}</span>
            </div>
          </div>

          <div class="text-center px-6 target-box rounded-lg">
            <div class="text-caption text-cyan-accent-1 text-uppercase">Busca rimas con:</div>
            <div class="text-h4 font-weight-black text-white glow-text">{{ currentTarget.word }}</div>
          </div>

          <div class="d-flex align-center gap-4">
            <v-chip v-if="combo > 0" :color="isTurbo ? 'purple-accent-3' : 'amber-accent-3'" class="font-weight-bold" :class="{ 'animate-pulse': isTurbo }">
              COMBO x{{ combo }} {{ isTurbo ? '🔥' : '' }}
            </v-chip>
            <v-btn icon="mdi-close" variant="text" color="grey" @click="forceEndGame"></v-btn>
          </div>
        </div>
      </v-card>

      <div 
        class="play-area position-relative rounded-xl overflow-hidden w-100" 
        :class="{ 'turbo-mode': isTurbo }"
        @click.self="missClick" 
        style="max-width: 1000px; height: 65vh; min-height: 450px; border: 1px solid rgba(255, 255, 255, 0.1);"
      >
        <div class="nebula-bg" v-if="isTurbo"></div>
        
        <transition-group name="fade">
          <div 
            v-for="word in activeWords" 
            :key="word.id"
            class="falling-word"
            :class="getWordStatusClass(word.status)"
            :style="{ left: word.x + '%', animationDuration: word.speed + 's' }"
            @mousedown="catchWord(word)"
            @animationend="removeWord(word.id, false)"
          >
            {{ word.text }}
          </div>
        </transition-group>
        
        <transition name="fade-up">
          <div v-if="showTimeBonus" class="time-bonus-feedback text-h4 font-weight-black text-green-accent-3">+2s</div>
        </transition>
      </div>
    </template>

    <v-card v-else-if="isGameOver" width="100%" max-width="500" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon :icon="lives > 0 ? 'mdi-flag-checkered' : 'mdi-skull-crossbones'" :color="lives > 0 ? 'cyan-accent-2' : 'red-accent-2'" size="80" class="mb-4"></v-icon>
      <h2 class="text-h4 text-white mb-2">{{ lives > 0 ? '¡Tiempo Agotado!' : '¡Misión Fallida!' }}</h2>
      
      <div class="d-flex justify-space-around my-6">
        <div class="text-center">
            <div class="text-h3 text-success font-weight-bold">{{ correctHits }}</div>
            <div class="text-caption">Rimas Atrapadas</div>
        </div>
        <div class="text-center">
            <div class="text-h3 text-error font-weight-bold">{{ incorrectHits }}</div>
            <div class="text-caption">Errores</div>
        </div>
      </div>
      
      <p class="text-h5 text-white mb-2">Puntuación Final: {{ score }}</p>
      <p class="text-subtitle-1 text-grey-lighten-1 mb-6">Combo Máximo: x{{ maxCombo }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="large" rounded="pill" class="text-black font-weight-bold block w-100">
        Obtener Recompensa
      </v-btn>
    </v-card>

    <!-- Overlay de Espera Multijugador -->
    <v-overlay v-model="isWaitingForOthers" class="align-center justify-center" persistent z-index="150">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="400">
        <v-progress-circular indeterminate color="cyan-accent-3" size="64" class="mb-4"></v-progress-circular>
        <h2 class="text-h4 font-weight-bold text-white mb-2">Muntant resultats...</h2>
        <p class="text-body-1 text-grey-lighten-1">Esperant que el company acabi la seva missió.</p>
      </v-card>
    </v-overlay>

  </v-container>
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

// DICCIONARIO ESTRUCTURADO
const dictionary = [
  { word: 'BOTÓN', ending: 'ÓN', rhymes: ['LEÓN', 'AVIÓN', 'CAMIÓN', 'BALÓN', 'MELÓN', 'RATÓN', 'CORAZÓN'], fakes: ['CASA', 'PERRO', 'MESA', 'GATO', 'LIBRO', 'SILLA', 'COCHE'] },
  { word: 'CUNA', ending: 'UNA', rhymes: ['LUNA', 'DUNA', 'FORTUNA', 'VACUNA', 'ACEITUNA', 'NINGUNA'], fakes: ['SOL', 'MAR', 'TIERRA', 'FUEGO', 'AIRE', 'AGUA', 'CIELO'] },
  { word: 'CANTAR', ending: 'AR', rhymes: ['JUGAR', 'SALTAR', 'BAILAR', 'VOLAR', 'PENSAR', 'LLORAR', 'AMAR'], fakes: ['CORRER', 'DORMIR', 'VIVIR', 'REIR', 'COMER', 'BEBER', 'LEER'] },
  { word: 'QUESO', ending: 'ESO', rhymes: ['HUESO', 'PESO', 'BESO', 'ESPESO', 'ACCESO', 'ILESO'], fakes: ['PAN', 'AGUA', 'VINO', 'LECHE', 'FRUTA', 'CARNE', 'SOPA'] },
  { word: 'ESPEJO', ending: 'EJO', rhymes: ['CONEJO', 'CANGREJO', 'VIEJO', 'REFLEJO', 'CONSEJO'], fakes: ['CRISTAL', 'PARED', 'PUERTA', 'VENTANA', 'SUELO'] }
];

// ESTADOS
const isPlaying = ref(false);
const isGameOver = ref(false);
const score = ref(0);
const lives = ref(3);
const timeLeft = ref(60);
const combo = ref(0);
const maxCombo = ref(0);
const correctHits = ref(0);
const incorrectHits = ref(0);
const isTurbo = ref(false);
const showTimeBonus = ref(false);

const currentTarget = ref(dictionary[0]);
const activeWords = ref([]);

// CONTROLES INTERNOS
let gameLoopInterval = null;
let timerInterval = null;
let wordIdCounter = 0;
let currentSpawnRate = 1200; 
let currentSpeed = 5; 
let bonusTimeout = null;

const startGame = () => {
  score.value = 0;
  lives.value = 3;
  timeLeft.value = 60;
  combo.value = 0;
  maxCombo.value = 0;
  correctHits.value = 0;
  incorrectHits.value = 0;
  isTurbo.value = false;
  activeWords.value = [];
  
  isPlaying.value = true;
  isGameOver.value = false;
  currentSpawnRate = 1200; 
  currentSpeed = 5; 
  
  pickNewTarget();
  gameLoopInterval = setInterval(spawnWord, currentSpawnRate);
  
  // Reloj de cuenta atrás
  timerInterval = setInterval(() => {
    if (!isPlaying.value) return;
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      timeLeft.value = 0;
      endGame();
    }
  }, 1000);
};

const pickNewTarget = () => {
  const randomIndex = Math.floor(Math.random() * dictionary.length);
  currentTarget.value = dictionary[randomIndex];
};

const spawnWord = () => {
  if (!isPlaying.value) return;

  let wordsToSpawn = 1;
  if (combo.value > 3 && Math.random() < 0.35) wordsToSpawn = 2;
  if (isTurbo.value && Math.random() < 0.25) wordsToSpawn = 3;

  const zones = [
    { min: 5, max: 25 },   // Izquierda
    { min: 35, max: 55 },  // Centro
    { min: 65, max: 85 }   // Derecha
  ];
  zones.sort(() => Math.random() - 0.5);

  for (let i = 0; i < wordsToSpawn; i++) {
    const isRhyme = Math.random() < 0.35; 
    const wordList = isRhyme ? currentTarget.value.rhymes : currentTarget.value.fakes;
    const wordText = wordList[Math.floor(Math.random() * wordList.length)];

    const targetZone = zones[i % zones.length];
    const posX = Math.random() * (targetZone.max - targetZone.min) + targetZone.min;

    activeWords.value.push({
      id: wordIdCounter++,
      text: wordText,
      isRhyme: isRhyme,
      status: 'falling', 
      x: posX,
      speed: isTurbo.value ? currentSpeed * 0.75 : currentSpeed
    });
  }

  if (currentSpawnRate > 500) {
    clearInterval(gameLoopInterval);
    currentSpawnRate -= 20;
    currentSpeed -= 0.05;
    gameLoopInterval = setInterval(spawnWord, currentSpawnRate);
  }
};

const catchWord = (word) => {
  if (!isPlaying.value || word.status !== 'falling') return;

  if (word.isRhyme) {
    word.status = 'correct';
    correctHits.value++;
    
    // Sumar 2 segundos de tiempo
    timeLeft.value += 2;
    triggerTimeBonusVisual();

    const points = isTurbo.value ? 20 : 10;
    score.value += points;
    combo.value += 1;
    if (combo.value > maxCombo.value) maxCombo.value = combo.value;
    
    if (combo.value >= 10 && !isTurbo.value) {
      isTurbo.value = true;
    }

    if (combo.value % 5 === 0) pickNewTarget();

  } else {
    word.status = 'incorrect';
    incorrectHits.value++;
    takeDamage();
  }

  setTimeout(() => {
    removeWord(word.id, true);
  }, 350);
};

const triggerTimeBonusVisual = () => {
    showTimeBonus.value = true;
    if(bonusTimeout) clearTimeout(bonusTimeout);
    bonusTimeout = setTimeout(() => {
        showTimeBonus.value = false;
    }, 500);
};

const removeWord = (id, clicked) => {
  const wordIndex = activeWords.value.findIndex(w => w.id === id);
  if (wordIndex > -1) {
    const word = activeWords.value[wordIndex];
    if (!clicked && word.isRhyme && word.status === 'falling') {
      combo.value = 0;
      isTurbo.value = false;
    }
    activeWords.value.splice(wordIndex, 1);
  }
};

const missClick = () => {
  if (!isPlaying.value) return;
  combo.value = 0;
  isTurbo.value = false;
};

const takeDamage = () => {
  lives.value -= 1;
  combo.value = 0;
  isTurbo.value = false;
  
  if (lives.value <= 0) {
    endGame();
  }
};

const forceEndGame = () => {
  endGame();
};

const endGame = (silent = false) => {
  if (props.isMultiplayer && !silent) {
    isPlaying.value = false;
    isGameOver.value = false; // No mostrar el overlay de single player
    clearInterval(gameLoopInterval);
    clearInterval(timerInterval);
    activeWords.value = [];
    multiplayerStore.submitRoundResult();
    return;
  }

  isPlaying.value = false;
  isGameOver.value = true;
  clearInterval(gameLoopInterval);
  clearInterval(timerInterval);
  activeWords.value = [];
};

const emitExit = () => { 
    emit('game-over', score.value); 
};

onMounted(() => {
  if (props.isMultiplayer) {
    startGame();
  }
});

// Listener para eventos multijugador
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    // El servidor ha cerrado la ronda, emitimos game-over para que el Lobby lo gestione
    isPlaying.value = false;
    isGameOver.value = true;
    emitExit();
  }
});

// Notificar puntuación al servidor en modo multijugador
watch(score, (newScore) => {
  if (props.isMultiplayer) {
    multiplayerStore.sendGameAction({
      type: 'SCORE_UPDATE',
      score: newScore
    });
  }
});

onUnmounted(() => {
  clearInterval(gameLoopInterval);
  clearInterval(timerInterval);
  if(bonusTimeout) clearTimeout(bonusTimeout);
});

const getWordStatusClass = (status) => {
    if (status === 'correct') return 'word-correct';
    if (status === 'incorrect') return 'word-incorrect';
    return 'word-falling';
};
</script>

<style scoped>
.game-container {
  background-color: transparent;
}

.target-box {
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
}

.glow-text {
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.6);
}

.border-cyan { border-color: #00e5ff !important; border-width: 2px; border-style: solid; }

.play-area {
  background: radial-gradient(circle at 50% 10%, #1a233a 0%, #05070d 100%);
  cursor: crosshair;
}

.turbo-mode.play-area {
  background: radial-gradient(circle at 50% 10%, #311042 0%, #0b051a 100%);
}

.nebula-bg {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 100%; height: 100%;
    background: radial-gradient(circle, rgba(224, 64, 251, 0.1) 0%, transparent 60%);
    pointer-events: none;
    animation: pulse-bg 2s infinite alternate;
}

.falling-word {
  position: absolute;
  top: -60px;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: 900;
  font-size: 1.3rem;
  color: white;
  user-select: none;
  animation-name: fallAnimation;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  transition: all 0.2s ease;
  z-index: 10;
}

.word-falling {
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
.word-falling:hover {
  transform: scale(1.1);
  border-color: #00e5ff;
}

.word-correct {
  background: #00c853 !important;
  border: 2px solid #b9f6ca !important;
  box-shadow: 0 0 25px rgba(0, 200, 83, 0.8) !important;
  transform: scale(1.2);
  color: white;
  z-index: 20;
}

.word-incorrect {
  background: #d50000 !important;
  border: 2px solid #ff8a80 !important;
  box-shadow: 0 0 25px rgba(213, 0, 0, 0.8) !important;
  transform: scale(0.9) rotate(5deg);
  color: white;
  z-index: 20;
}

/* Indicador visual de tiempo extra */
.time-bonus-feedback {
  position: absolute;
  top: 20px;
  right: 40px;
  z-index: 30;
  pointer-events: none;
  text-shadow: 0 0 10px rgba(0, 200, 83, 0.8);
}

@keyframes fallAnimation {
  0% { top: -60px; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes pulse-bg {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

.animate-pulse {
  animation: pulse-chip 1s infinite alternate;
}

@keyframes pulse-chip {
  0% { transform: scale(1); box-shadow: 0 0 10px rgba(224, 64, 251, 0.5); }
  100% { transform: scale(1.05); box-shadow: 0 0 25px rgba(224, 64, 251, 0.9); }
}

.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-leave-to {
  opacity: 0;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.5s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>