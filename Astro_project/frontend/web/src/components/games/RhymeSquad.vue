<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container pa-4">
    
    <v-card v-if="!isPlaying && !isGameOver && !isMultiplayer" width="100%" max-width="800" class="pa-10 text-center bg-grey-darken-4 border-cyan" rounded="xl">
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
      
      <v-card width="100%" max-width="1200" class="mx-auto mb-6 pa-6 bg-deep-purple-darken-4 elevation-12 flex-shrink-0" rounded="xl" style="z-index: 10; border: 1px solid rgba(255,255,255,0.1);">
        <div class="d-flex justify-space-between align-center px-4">
          <div style="flex: 1;">
            <h2 class="text-h4 font-weight-bold text-cyan-accent-2 mb-2">🎧 Escuadrón Fonológico</h2>
            <div class="text-subtitle-1 text-grey-lighten-2 mt-1">
              <span class="font-weight-bold">Punts: {{ score }}</span>
              <span class="mx-3">|</span>
              <span class="font-weight-bold" :class="timeLeft <= 15 ? 'text-red-accent-2 animate-pulse' : 'text-blue-lighten-2'">
                Temps: {{ timeLeft }}s
              </span>
              <span class="mx-3">|</span>
              <span :class="lives === 1 ? 'text-red-accent-2 font-weight-bold' : 'text-green-accent-3'">Vides: {{ lives }}</span>
            </div>
          </div>

          <div class="text-center px-10 target-box rounded-xl py-3" style="flex: 1;">
            <div class="text-h6 text-cyan-accent-1 text-uppercase font-weight-bold">Busca rimas con:</div>
            <div class="text-h2 font-weight-black text-white glow-text my-1">{{ currentTarget.word }}</div>
          </div>

          <div class="d-flex align-center justify-end gap-6" style="flex: 1;">
            <v-chip v-if="combo > 0" :color="isTurbo ? 'purple-accent-3' : 'amber-accent-3'" size="x-large" class="font-weight-bold text-h6" :class="{ 'animate-pulse': isTurbo }">
              COMBO x{{ combo }} {{ isTurbo ? '🔥' : '' }}
            </v-chip>
            <v-btn icon="mdi-close" size="large" variant="text" color="grey" @click="forceEndGame"></v-btn>
          </div>
        </div>
      </v-card>

      <div 
        class="play-area position-relative rounded-xl overflow-hidden w-100 mx-auto" 
        :class="{ 'turbo-mode': isTurbo }"
        @click.self="missClick" 
        style="max-width: 1200px; height: 65vh; min-height: 500px; border: 4px solid rgba(255, 255, 255, 0.05); box-shadow: 0 0 30px rgba(0,0,0,0.5);"
      >
        <div class="nebula-bg" v-if="isTurbo"></div>
        
        <transition-group name="fade">
          <div 
            v-for="word in activeWords" 
            :key="word.id"
            class="falling-word"
            :class="[getWordStatusClass(word.status), word.direction || 'top-down', { 'magnet-glow': isMagnetActive && word.isRhyme }]"

            :style="{ 
                left: word.x + '%', 
                top: word.y + '%',
                animationDuration: word.speed + 's' 
            }"
            @mousedown="catchWord(word)"
            @animationend="removeWord(word.id, false)"
          >
            {{ word.text }}
          </div>
        </transition-group>
        
        <transition name="fade-up">
          <div v-if="showTimeBonus" class="time-bonus-feedback text-h2 font-weight-black text-green-accent-3">+1s</div>
        </transition>

        <!-- Banners d'Efectes -->
        <div v-if="isDustStormActive" class="rs-effect-banner storm-banner">
            <v-icon icon="mdi-weather-windy" class="mr-2"></v-icon>
            TEMPESTA DE POLS
        </div>
        <div v-if="isMagnetActive" class="rs-effect-banner magnet-banner">
            <v-icon icon="mdi-magnet" class="mr-2"></v-icon>
            IMANT DE RIMES
        </div>




        <!-- Cursores compartis (Només en COOPERATIU) -->
        <template v-if="remoteCursor">
             <div 
               class="remote-cursor-game"
               :style="{ left: remoteCursor.x + '%', top: remoteCursor.y + '%' }"
             >
               <v-icon icon="mdi-cursor-default" color="cyan-accent-2" size="24" class="mouse-icon-shadow"></v-icon>
               <div class="cursor-tag-mini">{{ remoteCursor.user }}</div>
             </div>
        </template>
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

    <v-card v-else-if="isGameOver && isMultiplayer" width="100%" max-width="500" class="pa-10 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-account-group" color="cyan-accent-2" size="100" class="mb-6 animate-bounce"></v-icon>
      <h2 class="text-h3 text-white mb-2">¡Perfecto, equipo!</h2>
      <p class="text-h5 text-grey-lighten-1 mb-10">Esperando a que la misión actual finalice...</p>
      <v-progress-circular indeterminate color="cyan-accent-3" size="64" width="6"></v-progress-circular>
    </v-card>

    <!-- Overlay de Espera Multijugador (Manual) -->
    <v-overlay v-model="isWaitingForOthers" class="align-center justify-center" persistent z-index="150">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="400">
        <v-progress-circular indeterminate color="cyan-accent-3" size="64" class="mb-4"></v-progress-circular>
        <h2 class="text-h4 font-weight-bold text-white mb-2">Sincronizando...</h2>
        <p class="text-body-1 text-grey-lighten-1">Esperando al resto de la tripulación.</p>
      </v-card>
    </v-overlay>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
const remoteCursor = computed(() => {
  if (!props.isMultiplayer || multiplayerStore.room?.gameConfig?.mode !== 'COOPERATIVE') return null;
  const opp = multiplayerStore.room?.players?.find(p => p !== astroStore.user);
  if (!opp) return null;
  const pos = multiplayerStore.remoteCursors[opp];
  if (!pos) return null;
  
  // Convertir porcentaje de pantalla a pixels locales
  const playArea = document.querySelector('.play-area');
  if (!playArea) return null;
  const rect = playArea.getBoundingClientRect();
  const clientX = (pos.x / 100) * window.innerWidth;
  const clientY = (pos.y / 100) * window.innerHeight;
  
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
    user: opp
  };
});

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
const isWaitingForOthers = ref(false);
const score = ref(0);
const lives = ref(3);
const timeLeft = ref(60);
const combo = ref(0);
const maxCombo = ref(0);
const correctHits = ref(0);
const incorrectHits = ref(0);
const isTurbo = ref(false);
const showTimeBonus = ref(false);

// --- EFECTES MULTIJUGADOR ---
const isDustStormActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_STORM'));
const isMagnetActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_MAGNET'));


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
  
  timerInterval = setInterval(() => {
    if (!isPlaying.value) return;
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      timeLeft.value = 0;
      endGame();
    }
  }, 1000);
};

let currentSeed = 1;
const seededDice = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
};

const pickNewTarget = () => {
  const randomIndex = Math.floor(seededDice() * dictionary.length);
  currentTarget.value = dictionary[randomIndex];
};

const spawnWord = () => {
  if (!isPlaying.value) return;

  let wordsToSpawn = 1;
  const rnd = seededDice();
  if (combo.value > 3 && rnd < 0.35) wordsToSpawn = 2;
  if (isTurbo.value && rnd < 0.25) wordsToSpawn = 3;

  const zones = [
    { min: 5, max: 25 },   // Izquierda
    { min: 35, max: 55 },  // Centro
    { min: 65, max: 85 }   // Derecha
  ];
  zones.sort(() => seededDice() - 0.5);

  for (let i = 0; i < wordsToSpawn; i++) {
    const isRhyme = seededDice() < 0.35; 
    const wordList = isRhyme ? currentTarget.value.rhymes : currentTarget.value.fakes;
    const wordText = wordList[Math.floor(seededDice() * wordList.length)];

    const targetZone = zones[i % zones.length];
    const posX = seededDice() * (targetZone.max - targetZone.min) + targetZone.min;
    
    // Direcció aleatòria si hi ha tempesta
    let direction = 'top-down';
    let x = posX;
    let y = -10; // Per defecte fora per dalt
    
    if (isDustStormActive.value) {
        const dRnd = seededDice();
        if (dRnd < 0.25) { direction = 'left-right'; x = -20; y = seededDice() * 80 + 10; }
        else if (dRnd < 0.5) { direction = 'right-left'; x = 110; y = seededDice() * 80 + 10; }
        else if (dRnd < 0.75) { direction = 'bottom-up'; x = posX; y = 110; }
        else { direction = 'top-down'; x = posX; y = -10; }
    } else {
        x = posX;
        y = -10;
    }


    activeWords.value.push({
      id: wordIdCounter++,
      text: wordText,
      isRhyme: isRhyme,
      status: 'falling', 
      x: x,
      y: y,
      direction: direction,
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

const catchWord = (word, fromRemote = false) => {
  if (!isPlaying.value || word.status !== 'falling') return;

  // Si es cooperativo y lo hemos atrapado nosotros, notificamos
  if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE' && !fromRemote) {
    multiplayerStore.sendGameAction({
      type: 'WORD_CAUGHT',
      id: word.id,
      isRhyme: word.isRhyme
    });
  }

  if (word.isRhyme) {
    word.status = 'correct';
    if (!fromRemote) {
        correctHits.value++;
        timeLeft.value += 1;
        triggerTimeBonusVisual();
        const points = isTurbo.value ? 20 : 10;
        score.value += points;
        combo.value += 1;
        if (combo.value > maxCombo.value) maxCombo.value = combo.value;
        if (combo.value >= 10 && !isTurbo.value) isTurbo.value = true;
        if (combo.value % 5 === 0) pickNewTarget();

        // Enviar SABOTAGE / BONUS (1 segon per paraula encertada)
        if (props.isMultiplayer) {
          if (multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE') {
            multiplayerStore.sendGameAction({ type: 'BONUS', subtype: 'ADD_TIME', amount: 1 });
          } else {
            multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: 1 });
          }
        }
    }
  } else {
    word.status = 'incorrect';
    if (!fromRemote) {
        incorrectHits.value++;
        takeDamage();
    }
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
    isGameOver.value = true;
    isWaitingForOthers.value = true;
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

const isCoop = computed(() => props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE');
const myTeam = computed(() => multiplayerStore.room?.gameConfig?.teams?.find(t => t.members.includes(astroStore.user)));
const myTeamId = computed(() => myTeam.value?.id);
const isMyTeammate = (user) => myTeam.value?.members.includes(user) && user !== astroStore.user;

onMounted(() => {
  if (props.isMultiplayer) {
    if (multiplayerStore.room?.gameConfig?.seed) {
        // Usamos la semilla del servidor para que todos vean lo mismo
        currentSeed = Math.floor(multiplayerStore.room.gameConfig.seed * 10000);
    }
    startGame();
  }
});

// Listener para eventos multijugador
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    // El Lobby gestiona el tancament del component via watcher de lastMessage
    isPlaying.value = false;
    isGameOver.value = true;
  }

  // Sincronización de capturas en modo cooperativo (Solo Compañero)
  if (isCoop.value && isMyTeammate(msg.from) && msg.type === 'GAME_ACTION' && msg.action?.type === 'WORD_CAUGHT') {
     const word = activeWords.value.find(w => w.id === msg.action.id);
     if (word) {
        catchWord(word, true);
     }
  }

  // REBRE SABOTATGE: Restar temps (Dirigit o Global)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.from !== astroStore.user) {
    let shouldApply = false;
    if (isCoop.value) {
       if (msg.action.targetTeamId && msg.action.targetTeamId === myTeamId.value) shouldApply = true;
    } else {
       shouldApply = true;
    }

    if (shouldApply && msg.action.subtype === 'REDUCE_TIME') {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 1));
      if(timeLeft.value <= 0 && isPlaying.value) endGame();
    }
  }
  
  // REBRE BONUS: Sumar temps (Solo Compañero)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'BONUS' && msg.action?.subtype === 'ADD_TIME') {
    if (isCoop.value && isMyTeammate(msg.from)) {
      timeLeft.value = Math.min(99, timeLeft.value + (msg.action.amount || 1));
      triggerTimeBonusVisual();
    }
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

/* Direccions */
.top-down { animation-name: fallAnimation; }
.bottom-up { animation-name: riseAnimation; }
.left-right { animation-name: rightAnimation; }
.right-left { animation-name: leftAnimation; }

@keyframes riseAnimation {
  0% { top: 110%; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { top: -20%; opacity: 0; }
}

@keyframes rightAnimation {
  0% { left: -20%; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { left: 110%; opacity: 0; }
}

@keyframes leftAnimation {
  0% { left: 110%; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { left: -20%; opacity: 0; }
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
/* Efectes Banners */
.rs-effect-banner {
    position: absolute;
    bottom: 20px;
    left: 20px;
    padding: 8px 16px;
    border-radius: 12px;
    font-weight: bold;
    color: white;
    z-index: 100;
    font-size: 0.9rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    animation: rs-slideInLeft 0.3s ease-out;
}
.storm-banner {
    background: linear-gradient(90deg, #64748b, #334155);
    border-left: 4px solid #f1f5f9;
}
.magnet-banner {
    background: linear-gradient(90deg, #ec4899, #be185d);
    border-left: 4px solid #fbcfe8;
    bottom: 70px;
}
@keyframes rs-slideInLeft {
    from { transform: translateX(-50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
.magnet-glow {
    box-shadow: 0 0 20px #ec4899 !important;
    border-color: #fbcfe8 !important;
    animation: magnet-pulse 1s infinite alternate;
}
@keyframes magnet-pulse {
    from { transform: scale(1); }
    to { transform: scale(1.1); }
}



.remote-cursor-game {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.05s linear;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cursor-tag-mini {
  background: rgba(0, 229, 255, 0.8);
  color: black;
  font-size: 8px;
  font-weight: 900;
  padding: 0px 4px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>
