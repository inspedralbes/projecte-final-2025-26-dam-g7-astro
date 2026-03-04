<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    
    <v-card width="100%" max-width="600" class="mb-6 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">Nivell {{ level }}</h2>
          <div class="text-caption text-grey-lighten-2 d-flex align-center">
            <span>Puntuació: {{ score }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">Temps: {{ timeLeft }}s</span>
            <v-icon v-if="isSlowTimeActive" size="small" color="blue-accent-2" class="ml-1">mdi-timer-sand-empty</v-icon>
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

    <v-card v-if="!gameFinished" width="100%" max-width="600" class="pa-6 text-center bg-grey-darken-4" rounded="xl">
      
      <p class="text-h6 mb-2 text-grey-lighten-1">Arrossega les lletres per construir l'estructura!</p>
      <p class="text-body-2 text-cyan-accent-2 mb-6">Pista: {{ currentWordObj.hint }}</p>

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
          <v-chip class="ma-1 text-h4 font-weight-black pa-6" color="cyan-accent-3" variant="outlined" label>
            {{ element.letter }}
          </v-chip>
        </template>
      </draggable>

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

const currentStep = ref(0);
const totalSteps = ref(5);
const finalReward = computed(() => score.value + timeLeft.value);

const orderedGuess = computed(() => scrambledLetters.value.map((tile) => tile.letter).join(''));

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
  if (currentStep.value >= totalSteps.value) { finishGame(); return; }
  const randomIndex = Math.floor(Math.random() * words.length);
  currentWordObj.value = words[randomIndex];
  shuffleCurrentLetters();
  message.value = '';
};

const checkAnswer = () => {
  if (!scrambledLetters.value.length || isRoundLocked.value) return;

  const guess = orderedGuess.value.toUpperCase().trim();
  const correct = currentWordObj.value.word.toUpperCase();

  if (guess === correct) {
    isRoundLocked.value = true;
    score.value += 100 + (level.value * 10);
    timeLeft.value = Math.min(totalTime, timeLeft.value + 5);
    message.value = "Correcte! Bloc afegit a l'estructura.";
    messageType.value = "success";
    currentStep.value++;
    
    if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: 2 });

    setTimeout(() => { loadNextWord(); isRoundLocked.value = false; }, 1000);
  } else {
    // ESCUDO
    if (isShieldActive.value) {
      isShieldActive.value = false;
      message.value = "¡Escudo táctico activado! Te has salvado del error.";
      messageType.value = "warning";
      return; 
    }
    score.value = Math.max(0, score.value - 20); 
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
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  emit('game-over', score.value);
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  const tickTime = isSlowTimeActive.value ? 1250 : 1000;
  timerInterval = setInterval(() => {
    if (gameFinished.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value === 0) finishGame();
  }, tickTime);
};

onMounted(() => { 
    isShieldActive.value = (astroStore.activeBoosters?.shieldGamesLeft || 0) > 0;
    loadNextWord(); startTimer(); 
});
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;
  if (msg.type === 'ROUND_ENDED_BY_WINNER') { gameFinished.value = true; emit('game-over', score.value); }
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
    timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2));
    if (timeLeft.value <= 0 && !gameFinished.value) finishGame();
  }
});
watch(score, (newScore) => { if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore }); });
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval); });
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
