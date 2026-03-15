<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    
    <v-card width="100%" max-width="600" class="mb-6 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">Nivell {{ level }}</h2>
          <div class="text-caption text-grey-lighten-2 d-flex align-center">
            <template v-if="!props.isMultiplayer">
              <span>Puntuació: {{ score }}</span>
              <span class="mx-2">|</span>
              <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">Temps: {{ timeLeft }}s</span>
            </template>
            <v-icon v-if="isSlowTimeActive" size="small" color="blue-accent-2" :class="props.isMultiplayer ? '' : 'ml-1'">mdi-timer-sand-empty</v-icon>
            <v-icon v-if="isShieldActive" size="small" color="teal-accent-4" class="ml-2">mdi-shield-check</v-icon>
          </div>
        </div>
        <div class="d-flex flex-column align-end">
          <span class="text-overline mb-1">Estat de la Base</span>
          <v-progress-linear
            :model-value="(currentStep / totalSteps) * 100"
            color="success"
            height="10"
            rounded
            striped
            style="width: 150px"
          ></v-progress-linear>
        </div>
      </div>
    </v-card>

    <!-- Àrea de Joc -->
    <v-card v-if="!gameFinished" width="100%" max-width="600" class="pa-6 text-center bg-grey-darken-4 position-relative overflow-hidden game-board" rounded="xl">

      
      <p class="text-h6 mb-2 text-grey-lighten-1">Arrossega les lletres per construir l'estructura!</p>
      <div class="d-flex justify-center align-center gap-4 mb-4">
         <p class="text-body-2 text-cyan-accent-2 mb-0">Pista: {{ currentWordObj.hint }}</p>
         <v-chip size="small" color="amber" variant="outlined" class="font-weight-black">BLOC {{ currentStep + 1 }} / {{ totalSteps }}</v-chip>
      </div>

      <draggable
        v-model="scrambledLetters"
        class="d-flex justify-center flex-wrap gap-2 mb-6 drag-container"
        item-key="id"
        :animation="300"
        ghost-class="ghost-item"
        @start="drag = true"
        @end="onDragEnd"
        :disabled="gameFinished"
      >
        <template #item="{ element }">
          <v-chip
            class="ma-1 text-h4 font-weight-black pa-6 transition-all drag-item-chip"
            color="cyan-accent-3"
            variant="outlined"
            label
            :class="{ 
              'dragging': drag 
            }"
          >
            {{ element.letter }}
          </v-chip>
        </template>
      </draggable>

      <div class="word-card-container position-relative">
        <!-- Efectos de Sabotaje -->
        <div v-if="isMeteorActive" class="meteor-shower-container">
            <div v-for="n in 6" :key="'meteor-'+n" class="meteor" :style="getMeteorStyle(n)"></div>
            <div class="meteor-banner-text">¡LLUVIA DE METEORITOS!</div>
        </div>

        <div v-if="isFogActive" class="fog-overlay-full">
            <div v-for="n in 8" :key="'fog-'+n" class="fog-particle" :style="{ '--d': n }"></div>
            <div class="fog-text">NIEBLA ESPACIAL</div>
        </div>
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

      <p class="text-subtitle-1 text-grey-lighten-1 mb-6">
        Ordre actual: <strong class="text-cyan-accent-2">{{ orderedGuess }}</strong>
      </p>

      <v-btn @click="checkAnswer" color="cyan-accent-3" size="x-large" block rounded="lg" class="font-weight-bold text-black mb-3" :disabled="isRoundLocked">
        Construir Bloc
      </v-btn>

      <v-btn @click="shuffleCurrentLetters" color="grey-lighten-1" variant="outlined" block rounded="lg" :disabled="isRoundLocked">
        Barrejar de nou
      </v-btn>

      <v-alert v-if="message" :type="messageType" class="mt-4" variant="tonal">
        {{ message }}
      </v-alert>
    </v-card>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import draggable from 'vuedraggable';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();

const props = defineProps({ isMultiplayer: { type: Boolean, default: false } });
const emit = defineEmits(['game-over']);

// BOOSTERS
const isSlowTimeActive = computed(() => (astroStore.activeBoosters?.slowTimeGamesLeft || 0) > 0);
const isShieldActive = ref(false);

const remoteCursor = computed(() => {
  if (!props.isMultiplayer || multiplayerStore.room?.gameConfig?.mode !== 'COOPERATIVE') return null;
  const opp = multiplayerStore.room?.players?.find(p => p !== astroStore.user);
  if (!opp) return null;
  const pos = multiplayerStore.remoteCursors[opp];
  if (!pos) return null;
  
  // Convertir porcentaje de pantalla a pixels locales
  const playArea = document.querySelector('.game-board');
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

const words = Object.freeze([
  { word: 'NAU', hint: 'Vehicle espacial' },
  { word: 'PAU', hint: 'Persona que s\'encarrega de la IA' },
  { word: 'ASTRE', hint: 'Cos celeste' },
  { word: 'PLANETA', hint: 'Orbita al voltant d\'una estrella' },
  { word: 'GALAXIA', hint: 'Conjunt immens d\'estrelles' }
]);

const level = ref(1);
const score = ref(0);
const currentWordObj = ref(words[0]);
const scrambledLetters = ref([]);
const message = ref('');
const messageType = ref('info');
const gameFinished = ref(false);
const letterId = ref(0);
const isRoundLocked = ref(false);
const totalTime = 90;
const timeLeft = ref(totalTime);
let timerInterval = null;
const drag = ref(false); // Estado para controlar si se está arrastrando

// --- EFECTOS MULTIJUGADOR ---
const isMeteorActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_METEOR'));
const isQuantumActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_QUANTUM'));
const isFogActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_FOG'));

const getMeteorStyle = (n) => {
    return {
        left: (n * 15) + '%',
        top: '-10%',
        animationDelay: (n * 0.4) + 's'
    };
};
// (Netejat)


const currentStep = ref(0);
const totalSteps = ref(5);
const finalReward = computed(() => score.value + timeLeft.value);

const orderedGuess = computed(() => scrambledLetters.value.map((tile) => tile.letter).join(''));

let currentSeed = 1;
const seededDice = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
};

// Funció per barrejar lletres (Fisher-Yates) mantenint identificadors únics
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededDice() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const toLetterTiles = (word) => word.split('').map((letter) => ({ id: letterId.value++, letter }));

const shuffleCurrentLetters = () => {
  let shuffled = shuffleArray(toLetterTiles(currentWordObj.value.word));
  while (shuffled.map((tile) => tile.letter).join('') === currentWordObj.value.word && currentWordObj.value.word.length > 1) {
    shuffled = shuffleArray(toLetterTiles(currentWordObj.value.word));
  }
  scrambledLetters.value = shuffled;
};

const loadNextWord = () => {
  if (currentStep.value >= totalSteps.value) {
    finishGame();
    return;
  }
  
  // Selecciona una paraula aleatòria usando semilla
  const randomIndex = Math.floor(seededDice() * words.length);
  currentWordObj.value = words[randomIndex];
  shuffleCurrentLetters();
  message.value = '';
};

const checkAnswer = (fromRemote = false) => {
  if (!scrambledLetters.value.length || isRoundLocked.value) return;

  const guess = orderedGuess.value.toUpperCase().trim();
  const correct = currentWordObj.value.word.toUpperCase();

  if (guess === correct || fromRemote) {
    isRoundLocked.value = true;
    score.value += 100;
    timeLeft.value = Math.min(totalTime, timeLeft.value + 8);

    // En cooperativo, si nosotros hemos acertado, avisamos al otro para avanzar juntos
    if (props.isMultiplayer && isCooperative.value && !fromRemote) {
       multiplayerStore.sendGameAction({ type: 'ANSWER_CHECKED', guess });
    }

    setTimeout(() => {
      currentStep.value++;
      if (currentStep.value < totalSteps.value) {
        loadNextWord();
        isRoundLocked.value = false;
      } else {
        finishGame();
      }
    }, 1000);
  } else {
    // ERROR: Resta pero NO bloquea
    score.value = Math.max(0, score.value - 50);
    message.value = 'ORDRE INCORRECTE!';
    messageType.value = 'error';
    
    // Sacudida visual de error
    const board = document.querySelector('.game-board');
    if (board) {
      board.classList.add('error-shake');
      setTimeout(() => board.classList.remove('error-shake'), 500);
    }
  }
};

const onDragEnd = () => {
  drag.value = false;
  // Solo sincronizamos al terminar de arrastrar para no saturar 
  // el socket ni provocar bucles infinitos visuales (flickering)
  if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE') {
     multiplayerStore.sendGameAction({ type: 'DRAG_UPDATE', letters: scrambledLetters.value });
  }
};

const finishGame = async (silent = false) => {
  if (gameFinished.value) return;
  if (props.isMultiplayer && !silent) {
    gameFinished.value = true;
    if (timerInterval) clearInterval(timerInterval);
    multiplayerStore.submitRoundResult();
    return;
  }
  gameFinished.value = true;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  emit('game-over', score.value);
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  const tickTime = isSlowTimeActive.value ? 1250 : 1000;
  timerInterval = setInterval(() => {
    if (gameFinished.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(timeLeft.value);
    if (timeLeft.value === 0) finishGame();
  }, tickTime);
};

const isCooperative = computed(() => multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE');
const myTeam = computed(() => multiplayerStore.room?.gameConfig?.teams?.find(t => t.members.includes(astroStore.user)));
const myTeamId = computed(() => myTeam.value?.id);
const isMyTeammate = (user) => myTeam.value?.members.includes(user) && user !== astroStore.user;

// --- INICI ---
onMounted(() => {
  if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.seed) {
     currentSeed = Math.floor(multiplayerStore.room.gameConfig.seed * 10000);
  }
  isShieldActive.value = (astroStore.activeBoosters?.shieldGamesLeft || 0) > 0;
  loadNextWord();
  startTimer();
});
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    // El Lobby gestiona el tancament del component via watcher de lastMessage
    gameFinished.value = true;
  }

  // REBRE SABOTATGE: Restar temps (Dirigit o Global)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.from !== astroStore.user) {
    let shouldApply = false;
    if (isCooperative.value) {
       // Si nos apuntan específicamente a nuestro equipo
       if (msg.action.targetTeamId && msg.action.targetTeamId === myTeamId.value) shouldApply = true;
    } else {
       // BATTLE individual: nos afecta todo lo que no sea nuestro
       shouldApply = true;
    }

    if (shouldApply && msg.action.subtype === 'REDUCE_TIME') {
      timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2));
      if (timeLeft.value <= 0 && !gameFinished.value) finishGame();
    }
  }

  // REBRE BONUS: Sumar temps (Solo para el compañero de equipo)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'BONUS' && msg.action?.subtype === 'ADD_TIME') {
    if (isCooperative.value && isMyTeammate(msg.from)) {
      timeLeft.value = Math.min(totalTime, timeLeft.value + (msg.action.amount || 3));
    }
  }

  // REBRE MOVIMENT DE LLETRES (DRAG) de l'altre jugador (Solo compañero)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'DRAG_UPDATE' && isMyTeammate(msg.from)) {
     if (!drag.value) {
        scrambledLetters.value = msg.action.letters;
     }
  }

  // Sincronizar respuesta cooperativa (Solo compañero)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ANSWER_CHECKED' && isMyTeammate(msg.from)) {
     checkAnswer(true);
  }
});
watch(score, (newScore) => { if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore }); });
onUnmounted(() => { 
  if (timerInterval) clearInterval(timerInterval); 
  if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(null);
});
</script>


<style scoped>
.ghost-chip {
  opacity: 0.45;
}

.chosen-chip {
  transform: scale(1.06);
  transition: transform 0.2s ease;
}

.border-cyan {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
}

/* Efectes Multijugador */
.meteor-shower-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 100; pointer-events: none;
    overflow: hidden;
    background: rgba(255, 87, 34, 0.1);
}
.meteor {
    position: absolute; width: 4px; height: 60px;
    background: linear-gradient(to bottom, transparent, #ff5722, #ffee58);
    opacity: 0.8; filter: blur(1px);
    animation: meteor-fall 1.5s linear infinite;
}
@keyframes meteor-fall {
    from { transform: translateY(-100px) rotate(25deg); }
    to { transform: translateY(600px) rotate(25deg); }
}
.meteor-banner-text {
    position: absolute; top: 20%; width: 100%; text-align: center;
    color: #ff5722; font-weight: 900; font-size: 2rem;
    text-shadow: 0 0 20px #ff5722; animation: pulse 1s infinite alternate;
}

.fog-overlay-full {
    position: absolute; top:0; left:0; width:100%; height:100%;
    z-index: 100; pointer-events: none;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
}
.fog-particle {
    position: absolute; width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
    top: 50%; left: 50%;
    animation: fog-move 10s linear infinite;
    animation-delay: calc(var(--d) * -1.2s);
}
@keyframes fog-move {
    0% { transform: translate(-150%, -150%); }
    25% { transform: translate(50%, -120%); }
    50% { transform: translate(120%, 50%); }
    75% { transform: translate(-80%, 130%); }
    100% { transform: translate(-150%, -150%); }
}
.fog-text {
    position: absolute; bottom: 10%; width: 100%; text-align: center;
    color: white; font-weight: 800; font-size: 1.5rem; letter-spacing: 15px;
    opacity: 0.6;
}
</style>
