<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    
    <!-- Capçalera del joc -->
    <v-card width="100%" max-width="600" class="mb-6 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">Nivell {{ level }}</h2>
          <span class="text-caption text-grey-lighten-2">Puntuació: {{ score }}</span>
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
      >
        Construir Bloc
      </v-btn>

      <v-btn
        @click="shuffleCurrentLetters"
        color="grey-lighten-1"
        variant="outlined"
        block
        rounded="lg"
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
      <p class="text-h5 text-cyan-accent-2 mb-6">Punts Totals: {{ score }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="large" rounded="pill" class="text-black font-weight-bold">
        Tornar al Menú
      </v-btn>
    </v-card>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import draggable from 'vuedraggable';

// Definim els events per comunicar-nos amb el component pare
const emit = defineEmits(['game-over']);

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
  { word: 'SUPERNOVA', hint: 'Explosió final d\'una estrella' }
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

// Gamificació: Progrés de construcció
const currentStep = ref(0);
const totalSteps = ref(5); // Paraules per guanyar

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
  const randomIndex = Math.floor(Math.random() * words.length);
  currentWordObj.value = words[randomIndex];
  shuffleCurrentLetters();
  message.value = '';
};

const checkAnswer = () => {
  if (!scrambledLetters.value.length) return;

  const guess = orderedGuess.value.toUpperCase().trim();
  const correct = currentWordObj.value.word.toUpperCase();

  if (guess === correct) {
    // Correcte
    score.value += 100 + (level.value * 10);
    currentStep.value++;
    message.value = "Correcte! Bloc afegit a l'estructura.";
    messageType.value = "success";
    
    setTimeout(() => {
      loadNextWord();
    }, 1000);
  } else {
    // Incorrecte
    score.value = Math.max(0, score.value - 20); // No baixar de 0
    message.value = "Error estructural! Torna-ho a intentar.";
    messageType.value = "error";
  }
};

const finishGame = () => {
  gameFinished.value = true;
  // Opcional: Enviar puntuació a la store/backend aquí
};

const emitExit = () => {
  emit('game-over', score.value);
};

// --- INICI ---
onMounted(() => {
  loadNextWord();
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
