<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container pa-4">
    
    <v-card v-if="!isPlaying && !isGameOver" width="100%" max-width="800" class="pa-10 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-timer-sand" color="cyan-accent-3" size="100" class="mb-6 animate-bounce"></v-icon>
      <h1 class="text-h2 font-weight-black text-white mb-6">Escuadrón de Rimas</h1>
      <p class="text-h5 text-grey-lighten-1 mb-10">
        Tienes <span class="text-cyan-accent-3 font-weight-bold">60 SEGUNDOS</span>. Atrapa rimas para sumar 1 segundo extra. <br>
        <span class="text-red-accent-2 mt-2 d-block">¡Si fallas o dejas que una rima caiga al vacío, perderás vidas!</span>
      </p>
      <v-btn color="cyan-accent-3" size="x-large" height="60" block rounded="pill" class="font-weight-black text-black text-h6" @click="startGame">
        INICIAR MISIÓN
      </v-btn>
    </v-card>

    <template v-else-if="isPlaying">
      
      <v-card width="100%" max-width="1200" class="mb-4 pa-6 bg-deep-purple-darken-4 elevation-10 flex-shrink-0" rounded="xl" style="z-index: 10;">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h2 class="text-h4 font-weight-bold text-cyan-accent-2 mb-2">🎧 Escuadrón Fonológico</h2>
            <div class="text-subtitle-1 text-grey-lighten-2 mt-1">
              <span class="font-weight-bold">Punts: {{ score }}</span>
              <span class="mx-3">|</span>
              <span class="font-weight-bold" :class="timeLeft <= 15 ? 'text-red-accent-2 animate-pulse' : 'text-blue-lighten-2'">
                {{ $t('rhymeSquad.time', { time: timeLeft }) }}
              </span>
              <span class="mx-3">|</span>
              <span :class="lives === 1 ? 'text-red-accent-2 font-weight-bold' : 'text-green-accent-3'">Vides: {{ lives }}</span>
            </div>
          </div>

          <div class="text-center px-10 target-box rounded-xl py-3">
            <div class="text-h6 text-cyan-accent-1 text-uppercase font-weight-bold">Busca rimas con:</div>
            <div class="text-h2 font-weight-black text-white glow-text my-1">{{ currentTarget.word }}</div>
          </div>

          <div class="d-flex align-center gap-6">
            <v-chip v-if="combo > 0" :color="isTurbo ? 'purple-accent-3' : 'amber-accent-3'" size="x-large" class="font-weight-bold text-h6" :class="{ 'animate-pulse': isTurbo }">
              COMBO x{{ combo }} {{ isTurbo ? '🔥' : '' }}
            </v-chip>
            <v-btn icon="mdi-close" size="large" variant="text" color="grey" @click="forceEndGame"></v-btn>
          </div>
        </div>
      </v-card>

      <div 
        class="play-area position-relative rounded-xl overflow-hidden w-100" 
        :class="{ 'turbo-mode': isTurbo }"
        @click.self="missClick" 
        style="max-width: 1200px; height: 75vh; min-height: 600px; border: 2px solid rgba(255, 255, 255, 0.1);"
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
          <div v-if="showTimeBonus" class="time-bonus-feedback text-h2 font-weight-black text-green-accent-3">+1s</div>
        </transition>
      </div>
    </template>

    <v-card v-else-if="isGameOver && !isMultiplayer" width="100%" max-width="600" class="pa-10 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon :icon="lives > 0 ? 'mdi-flag-checkered' : 'mdi-skull-crossbones'" :color="lives > 0 ? 'cyan-accent-2' : 'red-accent-2'" size="100" class="mb-4"></v-icon>
      <h2 class="text-h3 text-white mb-2">{{ lives > 0 ? '¡Tiempo Agotado!' : '¡Misión Fallida!' }}</h2>
      
      <div class="d-flex justify-space-around my-8">
        <div class="text-center">
            <div class="text-h2 text-success font-weight-bold">{{ correctHits }}</div>
            <div class="text-subtitle-1">Rimas Atrapadas</div>
        </div>
        <div class="text-center">
            <div class="text-h2 text-error font-weight-bold">{{ incorrectHits }}</div>
            <div class="text-subtitle-1">Errors y Omisiones</div>
        </div>
      </div>
      
      <p class="text-h4 text-white mb-2">Puntuación Final: {{ score }}</p>
      <p class="text-h6 text-grey-lighten-1 mb-8">Combo Máximo: x{{ maxCombo }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="x-large" height="60" rounded="pill" class="text-black font-weight-bold text-h6 block w-100">
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

// DICCIONARIO ESTRUCTURADO Y LOCALIZADO
const currentDictionary = computed(() => {
    return rhymeData[locale.value] || rhymeData['es'];
});

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

const currentTarget = ref(currentDictionary.value[0]);
const activeWords = ref([]);

// CONTROLES INTERNOS
let gameLoopInterval = null;
let timerInterval = null;
let wordIdCounter = 0;
let currentSpawnRate = 1200; 
let currentSpeed = 5; 
let bonusTimeout = null;

// Observa cambios en el idioma para actualizar target si está jugando
watch(locale, () => {
    if (!isPlaying.value) pickNewTarget();
});

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
  const randomIndex = Math.floor(Math.random() * currentDictionary.value.length);
  currentTarget.value = currentDictionary.value[randomIndex];
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
    
    // MODIFICACIÓN: Sumar 1 segundo en lugar de 2
    timeLeft.value += 1;
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
    
    // Eliminamos la palabra del DOM primero
    activeWords.value.splice(wordIndex, 1);

    // MODIFICACIÓN: Si NO se clicó, era la correcta (isRhyme) y seguía cayendo... cuenta como fallo total
    if (!clicked && word.isRhyme && word.status === 'falling') {
      incorrectHits.value++;
      takeDamage();
    }
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
  border: 2px solid rgba(0, 229, 255, 0.4);
}

.glow-text {
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.8);
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
  top: -100px;
  padding: 12px 24px;      /* Tamaño revertido */
  border-radius: 30px;     /* Tamaño revertido */
  font-weight: 900;
  font-size: 1.3rem;       /* Tamaño revertido */
  color: white;
  user-select: none;
  animation-name: fallAnimation;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  transition: all 0.2s ease;
  z-index: 10;
}

.word-falling {
  background: rgba(30, 41, 59, 0.9);
  border: 3px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.word-falling:hover {
  transform: scale(1.1);
  border-color: #00e5ff;
}

.word-correct {
  background: #00c853 !important;
  border: 3px solid #b9f6ca !important;
  box-shadow: 0 0 35px rgba(0, 200, 83, 0.9) !important;
  transform: scale(1.2);
  color: white;
  z-index: 20;
}

.word-incorrect {
  background: #d50000 !important;
  border: 3px solid #ff8a80 !important;
  box-shadow: 0 0 35px rgba(213, 0, 0, 0.9) !important;
  transform: scale(0.9) rotate(5deg);
  color: white;
  z-index: 20;
}

.time-bonus-feedback {
  position: absolute;
  top: 30px;
  right: 50px;
  z-index: 30;
  pointer-events: none;
  text-shadow: 0 0 15px rgba(0, 200, 83, 0.9);
}

@keyframes fallAnimation {
  0% { top: -100px; opacity: 0; }
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
  0% { transform: scale(1); box-shadow: 0 0 15px rgba(224, 64, 251, 0.5); }
  100% { transform: scale(1.05); box-shadow: 0 0 30px rgba(224, 64, 251, 0.9); }
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