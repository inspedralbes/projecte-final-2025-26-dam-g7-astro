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
      
      <p class="text-h6 mb-4 text-grey-lighten-1">Reordena les lletres per construir l'estructura!</p>
      
      <!-- Lletres barrejades -->
      <div class="d-flex justify-center flex-wrap gap-2 mb-8">
        <v-chip
          v-for="(letter, index) in scrambledLetters"
          :key="index"
          class="ma-1 text-h4 font-weight-black pa-6"
          color="cyan-accent-3"
          variant="outlined"
          label
        >
          {{ letter }}
        </v-chip>
      </div>

      <!-- Input d'usuari -->
      <v-text-field
        v-model="userGuess"
        label="Escriu la paraula correcta"
        variant="solo-filled"
        bg-color="grey-darken-3"
        color="cyan-accent-3"
        class="mb-4 text-center centered-input"
        @keyup.enter="checkAnswer"
        autofocus
      ></v-text-field>

      <v-btn 
        @click="checkAnswer" 
        color="cyan-accent-3" 
        size="x-large" 
        block 
        rounded="lg"
        class="font-weight-bold text-black"
      >
        Construir Bloc
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
      
      <v-btn @click="emitExit" color="red-accent-2" variant="flat" size="large" rounded="pill">
        Tornar a la Nau
      </v-btn>
    </v-card>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Definim els events per comunicar-nos amb el component pare
const emit = defineEmits(['game-over']);

// --- DADES DEL JOC ---
const words = [
  { word: 'NAU', hint: 'Vehicle espacial' },
  { word: 'ASTRE', hint: 'Cos celeste' },
  { word: 'PLANETA', hint: 'Orbita al voltant d\'una estrella' },
  { word: 'GALAXY', hint: 'Conjunt d\'estrelles' }, // Variant anglesa/cat
  { word: 'COET', hint: 'Propulsió a raig' },
  { word: 'LLUNA', hint: 'Satèl·lit natural' }
];

// --- ESTAT ---
const level = ref(1);
const score = ref(0);
const currentWordObj = ref({});
const scrambledLetters = ref([]);
const userGuess = ref('');
const message = ref('');
const messageType = ref('info');
const gameFinished = ref(false);

// Gamificació: Progrés de construcció
const currentStep = ref(0);
const totalSteps = ref(5); // Paraules per guanyar

// --- LÒGICA ---

// Funció per barrejar lletres (Fisher-Yates)
const shuffleString = (str) => {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const loadNextWord = () => {
  if (currentStep.value >= totalSteps.value) {
    finishGame();
    return;
  }
  
  // Selecciona una paraula aleatòria
  const randomIndex = Math.floor(Math.random() * words.length);
  currentWordObj.value = words[randomIndex];
  
  // Assegurem que estigui barrejada i no sigui igual a l'original
  let shuffled = shuffleString(currentWordObj.value.word);
  while (shuffled.join('') === currentWordObj.value.word) {
    shuffled = shuffleString(currentWordObj.value.word);
  }
  
  scrambledLetters.value = shuffled;
  userGuess.value = '';
  message.value = '';
};

const checkAnswer = () => {
  if (!userGuess.value) return;

  const guess = userGuess.value.toUpperCase().trim();
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
.centered-input :deep(input) {
  text-align: center;
  text-transform: uppercase;
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 0.2rem;
}

.border-cyan {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
}
</style>