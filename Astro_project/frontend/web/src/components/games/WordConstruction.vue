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
        <!-- Barra de progr├®s "Construcció" -->
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
    <v-card v-if="!gameFinished" width="100%" max-width="600" class="pa-6 text-center bg-grey-darken-4" rounded="xl">
      
      <p class="text-h6 mb-2 text-grey-lighten-1">Arrossega les lletres per construir l'estructura!</p>
      <p class="text-body-2 text-cyan-accent-2 mb-6">Pista: {{ currentWordObj.hint }}</p>

      <!-- Lletres arrossegables -->
      <draggable
        v-model="scrambledLetters"
        item-key="id"
        tag="div"
        class="d-flex justify-center flex-wrap gap-2 mb-6"
        :animation="180"
        ghost-class="ghost-chip"
        chosen-class="chosen-chip"
      >
        <template #item="{ element }">
          <v-chip
            class="ma-1 text-h4 font-weight-black pa-6"
            color="cyan-accent-3"
            variant="outlined"
            label
          >
            {{ element.letter }}
          </v-chip>
        </template>
      </draggable>

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
      <h2 class="text-h4 text-white mb-2">┬íConstrucció Completada!</h2>
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
    { word: 'RATOLI', hint: 'Per moure el cursor (sense accent)' }, 
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
    { word: 'PA', hint: 'Fet amb farina i aigua' },
    { word: 'OU', hint: 'El posen les gallines' },
    { word: 'CARN', hint: 'Aliment d\'origen animal' },
    { word: 'LLET', hint: 'Beguda blanca' },
    { word: 'SUC', hint: 'Líquid de les fruites' },
    { word: 'SOPA', hint: 'Menjar líquid calent' },
    { word: 'SAL', hint: 'Condiment blanc salat' },
    { word: 'MEL', hint: 'La fan les abelles' },
    { word: 'VI', hint: 'Beguda de raïm' },
    { word: 'TE', hint: 'Infusió de fulles' },

    // --- TEMA: COLORS ---
    { word: 'BLAUC', hint: 'Color del cel (sense accent)' }, 
    { word: 'GROC', hint: 'Color del sol' },
    { word: 'VERD', hint: 'Color de l\'herba' },
    { word: 'ROIG', hint: 'Color de la sang' },
    { word: 'NEGRE', hint: 'Absència de llum' },
    { word: 'BLANC', hint: 'Color de la neu' },
    { word: 'GRIS', hint: 'Color del plom' },
    { word: 'ROSA', hint: 'Color suau o flor' },

    // --- TEMA: PROFESSIONS ---
    { word: 'METGE', hint: 'Cura malalts' },
    { word: 'MEC', hint: 'Arregla cotxes (abreviatura de mecànic)' },
    { word: 'POLI', hint: 'Agent de la llei (col·loquial)' },
    { word: 'CHEF', hint: 'Cuiner professional' },
    { word: 'JUTGE', hint: 'Dicta sentències' }
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
const totalTime = 60;
const timeLeft = ref(totalTime);
let timerInterval = null;

const currentStep = ref(0);
const totalSteps = ref(5);
const finalReward = computed(() => score.value + timeLeft.value);

const isHost = computed(() => multiplayerStore.room?.host === astroStore.user);
const opponentName = computed(() => {
  return Object.keys(multiplayerStore.room?.gameConfig?.scores || {}).find(p => p !== astroStore.user);
});

// LCG per a aleatorietat determinista
let currentSeed = 12345;
function lcgRandom() {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
}

const orderedGuess = computed(() => scrambledLetters.value.map((tile) => tile.letter).join(''));

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(lcgRandom() * (i + 1));
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
  
  if (!props.isMultiplayer || isHost.value) {
    let randomIndex;
    if (props.isMultiplayer) {
      randomIndex = Math.floor(lcgRandom() * words.length);
    } else {
      randomIndex = Math.floor(Math.random() * words.length);
    }
    
    currentWordObj.value = words[randomIndex];
    shuffleCurrentLetters();

    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'BOARD_SYNC',
        wordObj: currentWordObj.value,
        letters: scrambledLetters.value
      });
    }
  }
  message.value = '';
};

const checkAnswer = (fromRemote = false) => {
  if (!scrambledLetters.value.length || isRoundLocked.value) return;

  const guess = orderedGuess.value.toUpperCase().trim();
  const correct = currentWordObj.value.word.toUpperCase();

  // En cooperativo, si nosotros hemos acertado, avisamos al otro
  if (props.isMultiplayer && !fromRemote && guess === correct) {
     multiplayerStore.sendGameAction({ type: 'ANSWER_CHECKED', guess });
  }

  if (guess === correct || (fromRemote)) {
    isRoundLocked.value = true;

    // Recompensa base
    let pointsGained = 100 + (level.value * 10);
    
    // Bonus per temps (guanyes temps)
    timeLeft.value = Math.min(totalTime, timeLeft.value + 5);

    // Bonus per diferencia de punts (si l'altre va molt enrere)
    if (props.isMultiplayer && opponentName.value) {
      const myMatchScore = multiplayerStore.room?.gameConfig?.scores?.[astroStore.user] || 0;
      const oppMatchScore = multiplayerStore.room?.gameConfig?.scores?.[opponentName.value] || 0;
      
      // Si estas guanyant per m├®s de 100 punts a la partida general, bonus de "Superioritat"
      if (myMatchScore - oppMatchScore > 100) {
        pointsGained += 50; 
        message.value = "Correcte! +5s Temps i Bonus de Superioritat! ­ƒöÑ";
      } else {
        message.value = "Correcte! +5s Temps. Bloc afegit!";
      }
    } else {
      message.value = "Correcte! Bloc afegit a l'estructura.";
    }

    score.value += pointsGained;
    currentStep.value++;
    messageType.value = "success";
    
    // Notificar sabotatge/bonus (visualment al HUD del rival)
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'SABOTAGE',
        subtype: 'REDUCE_TIME',
        amount: 2 // Restem 2s al rival per cada paraula encertada? 
      });
    }

    setTimeout(() => {
      loadNextWord();
      isRoundLocked.value = false;
    }, 1000);
  } else {
    // Incorrecte
    score.value = Math.max(0, score.value - 20); // No baixar de 0
    message.value = "Error estructural! Torna-ho a intentar.";
    messageType.value = "error";
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
    // El servidor ha cerrado la ronda, emitimos game-over para que el Lobby lo gestione
    gameFinished.value = true;
    emitExit(); 
  }

  // REBRE SABOTATGE: Restar temps (Solo en Individual)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
    timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2));
    if (timeLeft.value <= 0 && !gameFinished.value) {
      finishGame();
    }
  }

  // REBRE SYNC DEL TAULER (Del Host)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'BOARD_SYNC') {
    currentWordObj.value = msg.action.wordObj;
    scrambledLetters.value = msg.action.letters;
    message.value = '';
    isRoundLocked.value = false;
  }

  // SYNC ARRAY DRAGGING
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ORDER_SYNC' && msg.from !== astroStore.user) {
    scrambledLetters.value = msg.action.letters;
  }

  // REBRE RESPOSTA COOPERATIVA
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ANSWER_CHECKED') {
     checkAnswer(true);
  }
});

// Enviar sync d'ordre
watch(scrambledLetters, (newVal) => {
  if (props.isMultiplayer && !isRoundLocked.value) {
    multiplayerStore.sendGameAction({
      type: 'ORDER_SYNC',
      letters: newVal
    });
  }
}, { deep: true });

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
</style>
