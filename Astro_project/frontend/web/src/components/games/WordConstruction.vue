<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    
    <!-- Capçalera del joc -->
    <v-card width="100%" max-width="600" class="mb-6 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">Nivell {{ level }}</h2>
          <div class="text-caption text-grey-lighten-2">
            <span>Puntuació: {{ score }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">Temps: {{ timeLeft }}s</span>
          </div>
        </div>
        <!-- Barra de progrés "Construcció" -->
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
        <!-- Overlay Meteoritos -->
        <div v-if="isMeteorActive" class="meteor-shower-container">
            <div v-for="n in 12" :key="n" class="meteor" :style="getMeteorStyle(n)"></div>
            <div class="meteor-banner-text">¡AVISO: LLUVIA DE METEORITOS!</div>
        </div>

        <!-- Overlay Boira (Niebla) -->
        <div v-if="isFogActive" class="fog-overlay-full">
            <div class="fog-particle" v-for="n in 10" :key="'f-'+n"></div>
            <div class="fog-text">SISTEMA INTERFERIDO: ERROR DE VISIÓN</div>
        </div>
      
      <p class="text-h6 mb-2 text-grey-lighten-1">Arrossega les lletres per construir l'estructura!</p>
      <div class="d-flex justify-center align-center gap-4 mb-4">
         <p class="text-body-2 text-cyan-accent-2 mb-0">Pista: {{ currentWordObj.hint }}</p>
         <v-chip size="small" color="amber" variant="outlined" class="font-weight-black">BLOC {{ currentStep + 1 }} / {{ totalSteps }}</v-chip>
      </div>

      <!-- Lletres arrossegables -->
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
            :color="isQuantumActive && element.letter === currentWordObj.word[0] ? 'yellow-accent-4' : 'cyan-accent-3'"
            variant="outlined"
            label
            :class="{ 
              'quantum-glow': isQuantumActive && element.letter === currentWordObj.word[0],
              'dragging': drag 
            }"
          >
            {{ element.letter }}
          </v-chip>
        </template>
      </draggable>

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

      <v-btn
        @click="checkAnswer"
        color="cyan-accent-3"
        size="x-large"
        block
        rounded="lg"
        class="font-weight-bold text-black mb-3"
        :disabled="isRoundLocked"
      >
        Construir Bloc
      </v-btn>

      <v-btn
        @click="shuffleCurrentLetters"
        color="grey-lighten-1"
        variant="outlined"
        block
        rounded="lg"
        :disabled="isRoundLocked"
      >
        Barrejar de nou
      </v-btn>

      <!-- Feedback -->
      <v-alert v-if="message" :type="messageType" class="mt-4" variant="tonal">
        {{ message }}
      </v-alert>
    </v-card>

    <!-- Pantalla de Final de Joc -->
    <v-card v-else width="100%" max-width="500" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-trophy" color="yellow-accent-4" size="80" class="mb-4"></v-icon>
      <h2 class="text-h4 text-white mb-2">¡Construcció Completada!</h2>
      <p class="text-h5 text-cyan-accent-2 mb-2">Punts Totals: {{ score }}</p>
      <p class="text-subtitle-1 text-grey-lighten-1 mb-1">Temps Restant: {{ timeLeft }}s</p>
      <p class="text-h6 text-cyan-accent-2 mb-6">Recompensa: {{ finalReward }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="large" rounded="pill" class="text-black font-weight-bold">
        Obtenir Recompensa
      </v-btn>
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

const props = defineProps({
  isMultiplayer: {
    type: Boolean,
    default: false
  }
});

// Definim els events per comunicar-nos amb el component pare
const emit = defineEmits(['game-over']);
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
// Luego lo podemos conectar a la base de datos
const words = Object.freeze([
  { word: 'NAU', hint: 'Vehicle espacial' },
  { word: 'PAU', hint: 'Persona que s\'encarrega de la IA' },
  { word: 'ASTRE', hint: 'Cos celeste' },
  { word: 'PLANETA', hint: 'Orbita al voltant d\'una estrella' },
  { word: 'GALAXIA', hint: 'Conjunt immens d\'estrelles' },
  { word: 'COET', hint: 'Propulsió a raig' },
  { word: 'LLUNA', hint: 'Satèl·lit natural' },
  { word: 'ORBITA', hint: 'Trajectòria al voltant d\'un cos' },
  { word: 'COMETA', hint: 'Cos amb cua brillant' },
  { word: 'NEBULOSA', hint: 'Núvol de gas i pols a l\'espai' },
  { word: 'SUPERNOVA', hint: 'Explosió final d\'una estrella' },

  { word: 'SOL', hint: 'L\'estrella del nostre sistema' },
  { word: 'MART', hint: 'El planeta vermell' },
  { word: 'LLUM', hint: 'Viatja molt ràpid per l\'espai' },
  { word: 'OVNI', hint: 'Objecte Volador No Identificat' },
  { word: 'CEL', hint: 'El veus si mires amunt' },
  { word: 'GAS', hint: 'Estat de la matèria a les nebuloses' },
  { word: 'FORAT', hint: 'Pot ser negre i engolir-ho tot' },

  // --- TEMA: TECNOLOGIA I INFORMÀTICA ---
  { word: 'CODI', hint: 'Instruccions per a un programa' },
  { word: 'DADES', hint: 'Informació que processa la IA' },
  { word: 'XIP', hint: 'Cervell de silici d\'un ordinador' },
  { word: 'WEB', hint: 'Pàgina d\'Internet' },
  { word: 'APP', hint: 'Programa per a mòbil' },
  { word: 'BOT', hint: 'Programa que fa tasques automàtiques' },
  { word: 'WIFI', hint: 'Connexió sense cables' },
  { word: 'XARXA', hint: 'Conjunt d\'ordinadors connectats' },
  { word: 'NODE', hint: 'Punt de connexió' },
  { word: 'RAM', hint: 'Memòria temporal' },
  { word: 'RATOLI', hint: 'Per moure el cursor (sense accent)' }, // "Ratolí" té 6, "MOUSE" 5, però "RATOLI" sense accent entra si acceptes treure accents. Si no:
  { word: 'TECLA', hint: 'La prems per escriure' },
  { word: 'PIXEL', hint: 'Punt de color en una pantalla' },

  // --- TEMA: NATURA I ANIMALS ---
  { word: 'GAT', hint: 'Felí domèstic' },
  { word: 'GOS', hint: 'El millor amic de l\'home' },
  { word: 'PEIX', hint: 'Viu sota l\'aigua' },
  { word: 'BOSC', hint: 'Lloc ple d\'arbres' },
  { word: 'RIU', hint: 'Corrent d\'aigua dolça' },
  { word: 'MAR', hint: 'Massa d\'aigua salada' },
  { word: 'AVE', hint: 'Animal amb plomes que vola' },
  { word: 'TIGRE', hint: 'Felí gran i ratllat' },
  { word: 'LLEO', hint: 'Rei de la selva' },
  { word: 'FLOR', hint: 'Part acolorida d\'una planta' },
  { word: 'ARBRE', hint: 'Planta gran amb tronc' },
  { word: 'MUNT', hint: 'Elevació del terreny (muntanya curta)' },

  // --- TEMA: CASA I OBJECTES ---
  { word: 'LLIT', hint: 'Mobles per dormir' },
  { word: 'TAULA', hint: 'Moble per menjar o treballar' },
  { word: 'SOFA', hint: 'Seient còmode per a varis' },
  { word: 'CLAU', hint: 'Obre panys' },
  { word: 'PORTA', hint: 'Entrada a una habitació' },
  { word: 'MUR', hint: 'Paret gruixuda' },
  { word: 'EINA', hint: 'Utensili per treballar' },
  { word: 'GOT', hint: 'Recipient per beure' },
  { word: 'PLAT', hint: 'On es serveix el menjar' },

  // --- TEMA: COS HUMÀ ---
  { word: 'ULL', hint: 'Òrgan per veure' },
  { word: 'PEU', hint: 'Part del cos per caminar' },
  { word: 'BOCA', hint: 'Per parlar i menjar' },
  { word: 'DIT', hint: 'En tens cinc a cada mà' },
  { word: 'COR', hint: 'Bomba la sang' },
  { word: 'SANG', hint: 'Líquid vermell vital' },
  { word: 'PELL', hint: 'Cobreix tot el cos' },
  { word: 'DENT', hint: 'Peça dura per mastegar' },
  { word: 'OS', hint: 'Part dura de l\'esquelet' },

  // --- TEMA: MENJAR ---
  { word: 'POMA', hint: 'Fruita vermella o verda' },
  { word: 'PERA', hint: 'Fruita amb forma de bombeta' },
  { word: 'PA', hint: 'Aliment bàsic de farina' },
  { word: 'COCA', hint: 'Menjar típic dolç o salat' },
  { word: 'MEL', hint: 'La fan les abelles' },
  { word: 'OLI', hint: 'Or líquid per cuinar' },
  { word: 'SAL', hint: 'Dona gust salat' },
  { word: 'ARROS', hint: 'Ingredient de la paella' },
  { word: 'SOPA', hint: 'Plat líquid i calent' },
  { word: 'CARN', hint: 'Aliment proteic animal' },

  // --- TEMA: TEMPS I ABSTRACTE ---
  { word: 'ANY', hint: '365 dies' },
  { word: 'MES', hint: 'Part d\'un any' },
  { word: 'DIA', hint: 'Té 24 hores' },
  { word: 'HORA', hint: '60 minuts' },
  { word: 'ESTIU', hint: 'L\'estació més calorosa' },
  { word: 'HIVERN', hint: 'L\'estació més freda' },
  { word: 'NOM', hint: 'Com es diu una persona' },
  { word: 'MON', hint: 'El planeta Terra (abstracte)' }
]);

// --- ESTAT ---
const level = ref(1);
const score = ref(0);
const currentWordObj = ref(words[0]);
const scrambledLetters = ref([]);
const message = ref('');
const messageType = ref('info');
const gameFinished = ref(false);
const letterId = ref(0);
const gameSaved = ref(false);
const isWaitingForOthers = ref(false);
const isRoundLocked = ref(false);
const totalTime = 90;
const timeLeft = ref(totalTime);
let timerInterval = null;
const drag = ref(false); // Estado para controlar si se está arrastrando

// --- EFECTES MULTIJUGADOR ---
const isMeteorActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_METEORS'));
const isQuantumActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_QUANTUM'));
const isFogActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_FOG'));

const getMeteorStyle = (n) => ({
    left: (n * 12) + '%',
    animationDelay: (n * 0.4) + 's',
    animationDuration: (1.5 + Math.random()) + 's'
});

// Gamificació: Progrés de construcció
const currentStep = ref(0);
const totalSteps = ref(5); // Paraules per guanyar
const finalReward = computed(() => score.value + timeLeft.value);

// --- LÒGICA ---
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

const toLetterTiles = (word) =>
  word.split('').map((letter) => ({
    id: letterId.value++,
    letter,
  }));

const shuffleCurrentLetters = () => {
  let shuffled = shuffleArray(toLetterTiles(currentWordObj.value.word));

  while (
    shuffled.map((tile) => tile.letter).join('') === currentWordObj.value.word &&
    currentWordObj.value.word.length > 1
  ) {
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const emitExit = () => {
  emit('game-over', finalReward.value);
};

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    if (gameFinished.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value === 0) {
      finishGame();
    }
  }, 1000);
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
  loadNextWord();
  startTimer();
});

// Listener para eventos multijugador
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
  if (timerInterval) {
    clearInterval(timerInterval);
  }
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

/* Efectes */
.meteor-shower-container {
    position: absolute;
    inset: 0;
    z-index: 50;
    pointer-events: none;
    overflow: hidden;
}

.meteor {
    position: absolute;
    top: -50px;
    width: 40px;
    height: 100px;
    background: linear-gradient(to bottom, transparent, #ff5722, #f44336);
    filter: blur(2px);
    border-radius: 50% 50% 10px 10px;
    opacity: 0.8;
    animation: meteor-fall linear infinite;
}

@keyframes meteor-fall {
    from { transform: translateY(-100px) rotate(45deg); }
    to { transform: translateY(800px) rotate(45deg); }
}

.meteor-banner-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ff5722;
    font-weight: 900;
    font-size: 2rem;
    text-shadow: 0 0 10px #000;
    z-index: 60;
    animation: blink 1s infinite;
}

.error-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
}
.quantum-glow {
    border: 3px solid #ffea00 !important;
    box-shadow: 0 0 15px #ffea00 !important;
    animation: pulse-quantum 1.5s infinite;
}

@keyframes pulse-quantum {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.transition-all { transition: all 0.3s ease; }

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
.fog-overlay-full {
    position: absolute;
    inset: 0;
    z-index: 150;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.fog-text {
    color: white;
    font-weight: 900;
    font-size: 1.5rem;
    text-shadow: 0 0 10px #000;
    background: rgba(0,0,0,0.5);
    padding: 10px 20px;
    border-radius: 10px;
}

.fog-particle {
    position: absolute;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: fog-float 10s infinite alternate;
}

@keyframes fog-float {
    from { transform: translate(-20%, -20%); }
    to { transform: translate(20%, 20%); }
}
</style>
