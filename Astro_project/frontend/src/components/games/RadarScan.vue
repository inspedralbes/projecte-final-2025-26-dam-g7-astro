<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <div class="hud d-flex justify-space-between align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="text-h5 font-weight-bold text-cyan-accent-3">Temps: <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
      <div class="text-h6 text-white bg-slate-800 px-4 py-1 rounded-pill border-cyan">Objectiu: Troba la '{{ targetChar }}'</div>
      <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
    </div>

    <div class="board d-flex flex-wrap justify-center align-center" :style="{ width: boardSize + 'px' }">
      <div 
        v-for="(letter, index) in board" 
        :key="index"
        class="letter-cell d-flex justify-center align-center text-h4 font-weight-bold cursor-pointer"
        :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
        @click="checkLetter(index)"
      >
        {{ letter }}
      </div>
    </div>

    <div 
      class="flashlight-overlay" 
      :style="{ 
        '--mouseX': mouseX + 'px', 
        '--mouseY': mouseY + 'px',
        '--tunnelSize': currentTunnelSize + 'px'
      }"
    ></div>

    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">Escàner de Ràdar</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          Troba la lletra diferent abans que s'esgoti el temps. Vigila, el teu camp de visió és limitat i fer clics a l'atzar et restarà temps!
        </p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black block" @click="startGame">
          COMENÇAR (60s)
        </v-btn>
      </v-card>
    </v-overlay>
    <v-overlay v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="100">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="450">
        <v-icon icon="mdi-trophy" color="amber-accent-3" size="80" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-white mb-2">¡Escàner Completat!</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">Punts Totals: {{ score }}</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black px-8" @click="returnToMenu">
          TORNAR AL MENÚ
        </v-btn>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';

const emit = defineEmits(['game-over']);

// Variables d'estat
const showStartOverlay = ref(true);
const score = ref(0);
const timeLeft = ref(60);
let timerInterval = null;

// Sistema de visió (Llanterna)
const mouseX = ref(0);
const mouseY = ref(0);
const gameArea = ref(null);

// Lògica del tauler
const board = ref([]);
const currentLevel = ref(1);
const targetIndex = ref(-1);
const targetChar = ref('');

// Configuració de nivells (escalat de dificultat)
const levels = [
  { distractor: 'p', target: 'q', grid: 5, tunnel: 250 }, // Nivell 1: Fàcil, llanterna gran
  { distractor: 'b', target: 'd', grid: 7, tunnel: 200 }, // Nivell 2: Mitjà, llanterna normal
  { distractor: 'm', target: 'n', grid: 9, tunnel: 150 }, // Nivell 3: Difícil, llanterna petita
  { distractor: 'O', target: 'Q', grid: 12, tunnel: 120 },// Nivell 4: Moltes lletres
  { distractor: 'E', target: 'F', grid: 15, tunnel: 100 } // Nivell 5+: Extrem
];

// Computades per l'estil del tauler
const currentConfig = computed(() => {
  return levels[Math.min(currentLevel.value - 1, levels.length - 1)];
});
const currentTunnelSize = computed(() => currentConfig.value.tunnel);
const cellSize = computed(() => Math.max(30, 600 / currentConfig.value.grid));
const boardSize = computed(() => currentConfig.value.grid * cellSize.value);

const updateFlashlight = (e) => {
  if (!gameArea.value) return;
  const rect = gameArea.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
};

const generateBoard = () => {
  const config = currentConfig.value;
  const totalCells = config.grid * config.grid;
  targetChar.value = config.target;
  
  // Omplim el tauler amb distractors
  let newBoard = Array(totalCells).fill(config.distractor);
  
  // Col·loquem l'objectiu aleatòriament
  targetIndex.value = Math.floor(Math.random() * totalCells);
  newBoard[targetIndex.value] = config.target;
  
  board.value = newBoard;
};

const nextRound = () => {
  score.value += (currentLevel.value * 10); // Més punts per nivells més alts
  timeLeft.value = Math.min(60, timeLeft.value + 3); // Bonificació de temps
  currentLevel.value++;
  generateBoard();
};

const checkLetter = (index) => {
  if (showStartOverlay.value || timeLeft.value <= 0) return;

  if (index === targetIndex.value) {
    nextRound();
  } else {
    // Penalització severa per fer clics a cegues
    timeLeft.value = Math.max(0, timeLeft.value - 3);
    score.value = Math.max(0, score.value - 5);
    
    // Si el temps arriba a 0 per la penalització, acabem al moment
    if (timeLeft.value === 0) endGame();
  }
};

const startGame = () => {
  showStartOverlay.value = false;
  score.value = 0;
  timeLeft.value = 60;
  currentLevel.value = 1;
  generateBoard();
  
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      endGame();
    }
  }, 1000);
};

// Afegeix aquesta variable amb la resta de variables d'estat
const showGameOverOverlay = ref(false);

// ... (la resta del codi es manté igual fins al final) ...

// Substitueix l'antiga funció endGame per aquestes dues:
const endGame = () => {
  clearInterval(timerInterval);
  // En lloc d'emetre directament, mostrem el popup
  showGameOverOverlay.value = true; 
};

const returnToMenu = () => {
  // Ara sí, l'usuari ha clicat el botó i avisem al pare per sortir
  emit('game-over', score.value); 
};

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: #0f172a;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none; /* Evita que l'usuari seleccioni text fent doble clic */
}

.board {
  max-width: 90%;
  max-height: 90%;
  z-index: 2; /* Per sota de la llanterna però els clics passen gràcies al pointer-events */
}

.letter-cell {
  color: #334155; /* Color fosc per defecte perquè es vegi poc si falla la llanterna */
  transition: color 0.2s;
}

/* LA MÀGIA DEL TÚNEL */
.flashlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* IMPORTANTÍSSIM: Permet que els clics travessin aquesta capa fosca */
  z-index: 5;
  background: radial-gradient(
    circle var(--tunnelSize) at var(--mouseX) var(--mouseY), 
    transparent 0%, 
    rgba(11, 17, 32, 0.98) 80%, 
    rgba(11, 17, 32, 1) 100%
  );
}

.bg-slate-800 { background-color: #1e293b; }
.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }
</style>