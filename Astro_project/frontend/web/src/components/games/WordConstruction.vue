<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    
    <!-- Capçalera del joc -->
    <v-card width="100%" max-width="600" class="mb-6 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">{{ $t('wordConstruction.level', { level: level }) }}</h2>
          <div class="text-caption text-grey-lighten-2">
            <span>{{ $t('wordConstruction.score', { score: score }) }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">{{ $t('wordConstruction.time', { time: timeLeft }) }}</span>
          </div>
        </div>
        <!-- Barra de progrés "Construcció" -->
        <div class="d-flex flex-column align-end">
          <span class="text-overline mb-1">{{ $t('wordConstruction.baseStatus') }}</span>
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
      
      <p class="text-h6 mb-2 text-grey-lighten-1">{{ $t('wordConstruction.dragInstruction') }}</p>
      <p class="text-body-2 text-cyan-accent-2 mb-6" v-html="$t('wordConstruction.hint', { hint: currentWordObj.hint })"></p>

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
        {{ $t('wordConstruction.currentOrder') }}<strong class="text-cyan-accent-2">{{ orderedGuess }}</strong>
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
        {{ $t('wordConstruction.buildBlock') }}
      </v-btn>

      <v-btn
        @click="shuffleCurrentLetters"
        color="grey-lighten-1"
        variant="outlined"
        block
        rounded="lg"
        :disabled="isRoundLocked"
      >
        {{ $t('wordConstruction.shuffleAgain') }}
      </v-btn>

      <!-- Feedback -->
      <v-alert v-if="message" :type="messageType" class="mt-4" variant="tonal">
        {{ message }}
      </v-alert>
    </v-card>

    <!-- Pantalla de Final de Joc -->
    <v-card v-else width="100%" max-width="500" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-trophy" color="yellow-accent-4" size="80" class="mb-4"></v-icon>
      <h2 class="text-h4 text-white mb-2">{{ $t('wordConstruction.completedTitle') }}</h2>
      <p class="text-h5 text-cyan-accent-2 mb-2">{{ $t('wordConstruction.totalPoints', { score: score }) }}</p>
      <p class="text-subtitle-1 text-grey-lighten-1 mb-1">{{ $t('wordConstruction.timeRemaining', { time: timeLeft }) }}</p>
      <p class="text-h6 text-cyan-accent-2 mb-6">{{ $t('wordConstruction.reward', { reward: finalReward }) }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="large" rounded="pill" class="text-black font-weight-bold">
        {{ $t('wordConstruction.getReward') }}
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

const { locale, t } = useI18n();
// Definim els events per comunicar-nos amb el component pare
const emit = defineEmits(['game-over']);

// Luego lo podemos conectar a la base de datos
const words = computed(() => {
    return wordConstructionData[locale.value] || wordConstructionData['es'];
});

// --- ESTAT ---
const level = ref(1);
const score = ref(0);
const currentWordObj = ref(words.value[0]);
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

// Gamificació: Progrés de construcció
const currentStep = ref(0);
const totalSteps = ref(5); // Paraules per guanyar
const finalReward = computed(() => score.value + timeLeft.value);

// --- LÒGICA ---
const orderedGuess = computed(() => scrambledLetters.value.map((tile) => tile.letter).join(''));

// Funció per barrejar lletres (Fisher-Yates) mantenint identificadors únics
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
  
  // Selecciona una paraula aleatòria
  const randomIndex = Math.floor(Math.random() * words.value.length);
  currentWordObj.value = words.value[randomIndex];
  shuffleCurrentLetters();
  message.value = '';
};

const checkAnswer = () => {
  if (!scrambledLetters.value.length || isRoundLocked.value) return;

  const guess = orderedGuess.value.toUpperCase().trim();
  const correct = currentWordObj.value.word.toUpperCase();

  if (guess === correct) {
    isRoundLocked.value = true;

    // Recompensa base
    let pointsGained = 100 + (level.value * 10);
    
    // Bonus per temps (guanyes temps)
    timeLeft.value = Math.min(totalTime, timeLeft.value + 5);

    // Bonus per diferencia de punts (si l'altre va molt enrere)
    if (props.isMultiplayer && opponentName.value) {
      const myMatchScore = multiplayerStore.room?.gameConfig?.scores?.[astroStore.user] || 0;
      const oppMatchScore = multiplayerStore.room?.gameConfig?.scores?.[opponentName.value] || 0;
      
      // Si estas guanyant per més de 100 punts a la partida general, bonus de "Superioritat"
      if (myMatchScore - oppMatchScore > 100) {
        pointsGained += 50; 
        message.value = "Correcte! +5s Temps i Bonus de Superioritat! 🔥";
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
    message.value = t('wordConstruction.msgIncorrect');
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

  // REBRE SABOTATGE: Restar temps
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
    timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2));
    if (timeLeft.value <= 0 && !gameFinished.value) {
      finishGame();
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
