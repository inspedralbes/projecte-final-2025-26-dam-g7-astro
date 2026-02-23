<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <div class="hud d-flex justify-space-between align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="text-h5 font-weight-bold text-cyan-accent-3">Temps: <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
      <div class="text-h6 text-white bg-slate-800 px-4 py-1 rounded-pill border-cyan">Objectiu: Troba la '{{ targetChar }}'</div>
      <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
    </div>

    <!-- Afegim la classe board-hidden per quan estem regenerant -->
    <div 
      class="board d-flex flex-wrap justify-center align-center" 
      :style="{ width: boardSize + 'px' }"
      :class="{ 
        'board-transitioning': isTransitioning && !correctClicked,
        'board-hidden': isChangingLevel 
      }"
    >
      <div 
        v-for="(letter, index) in board" 
        :key="index"
        class="letter-cell d-flex justify-center align-center text-h4 font-weight-bold cursor-pointer"
        :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
        :class="{ 'letter-correct': correctClicked && index === targetIndex }"
        @click="checkLetter(index)"
      >
        {{ letter }}
      </div>
    </div>

    <!-- La capa de foscor/llanterna -->
    <div 
      class="flashlight-overlay" 
      :class="{ 
        'flashlight-off': isTransitioning, 
        'flashlight-full-dark': isChangingLevel 
      }"
      :style="{ 
        '--mouseX': mouseX + 'px', 
        '--mouseY': mouseY + 'px',
        '--tunnelSize': currentTunnelSize + 'px'
      }"
    ></div>

    <!-- Overlays de Inici i Final (es mantenen igual) -->
    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">Escàner de Ràdar</h2>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black block" @click="startGame">
          COMENÇAR
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="100">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="450">
        <h2 class="text-h4 font-weight-bold text-white mb-2">¡Escàner Completat!</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">Punts Totals: {{ score }}</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" @click="returnToMenu">TORNAR AL MENÚ</v-btn>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';

const emit = defineEmits(['game-over']);

const showStartOverlay = ref(true);
const showGameOverOverlay = ref(false);
const isTransitioning = ref(false); // Controla la il·luminació d'èxit
const isChangingLevel = ref(false);  // Controla el fosc total i canvi de lletres
const correctClicked = ref(false);
const score = ref(0);
const timeLeft = ref(60);
let timerInterval = null;

const mouseX = ref(0);
const mouseY = ref(0);
const gameArea = ref(null);

const board = ref([]);
const currentLevel = ref(1);
const targetIndex = ref(-1);
const targetChar = ref('');

const levels = [
  { distractor: 'p', target: 'q', grid: 5, tunnel: 250 },
  { distractor: 'b', target: 'd', grid: 7, tunnel: 200 },
  { distractor: 'm', target: 'n', grid: 9, tunnel: 150 },
  { distractor: 'O', target: 'Q', grid: 12, tunnel: 120 },
  { distractor: 'E', target: 'F', grid: 15, tunnel: 100 }
];

const currentConfig = computed(() => levels[Math.min(currentLevel.value - 1, levels.length - 1)]);
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
  let newBoard = Array(totalCells).fill(config.distractor);
  targetIndex.value = Math.floor(Math.random() * totalCells);
  newBoard[targetIndex.value] = config.target;
  board.value = newBoard;
};

const checkLetter = (index) => {
  if (showStartOverlay.value || showGameOverOverlay.value || isTransitioning.value || isChangingLevel.value) return;

  if (index === targetIndex.value) {
    // 1. Fase d'èxit: Il·luminem tot
    isTransitioning.value = true;
    correctClicked.value = true;
    
    setTimeout(() => {
      // 2. Fase de fosc total: Amaguem el tauler
      correctClicked.value = false;
      isChangingLevel.value = true;
      
      setTimeout(() => {
        // 3. Canvi de lletres (mentre està tot negre)
        score.value += (currentLevel.value * 10);
        timeLeft.value = Math.min(60, timeLeft.value + 3);
        currentLevel.value++;
        generateBoard();

        // 4. Tornem a la normalitat
        setTimeout(() => {
          isTransitioning.value = false;
          isChangingLevel.value = false;
        }, 300); // Temps perquè l'usuari es prepari
        
      }, 400); // Temps que roman en fosc total
      
    }, 800); // Temps que roman il·luminat per l'èxit

  } else {
    timeLeft.value = Math.max(0, timeLeft.value - 3);
    score.value = Math.max(0, score.value - 5);
    if (timeLeft.value === 0) endGame();
  }
};

const startGame = () => {
  showStartOverlay.value = false;
  showGameOverOverlay.value = false;
  isTransitioning.value = false;
  isChangingLevel.value = false;
  score.value = 0;
  timeLeft.value = 60;
  currentLevel.value = 1;
  generateBoard();
  
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isTransitioning.value && !isChangingLevel.value && timeLeft.value > 0) {
      timeLeft.value--;
      if (timeLeft.value <= 0) endGame();
    }
  }, 1000);
};

const endGame = () => {
  clearInterval(timerInterval);
  showGameOverOverlay.value = true; 
};

const returnToMenu = () => emit('game-over', score.value);

onBeforeUnmount(() => clearInterval(timerInterval));
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: #0b1120; /* Color fons molt fosc */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none;
}

.board {
  max-width: 90%;
  max-height: 90%;
  z-index: 2;
  transition: opacity 0.3s ease;
}

/* Quan canviem de nivell, el tauler desapareix totalment */
.board-hidden {
  opacity: 0 !important;
}

.letter-cell {
  color: #1e293b; /* Color de les lletres a la foscor */
  transition: color 0.2s, transform 0.2s;
}

.letter-correct {
  color: #00e5ff !important;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.8);
  transform: scale(1.4);
  z-index: 10;
}

.flashlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.3s ease;
  background: radial-gradient(
    circle var(--tunnelSize) at var(--mouseX) var(--mouseY), 
    transparent 0%, 
    rgba(11, 17, 32, 0.98) 80%, 
    rgba(11, 17, 32, 1) 100%
  );
}

/* "Il·lumina tot" */
.flashlight-off {
  opacity: 0;
}

/* "Fosc total" per tapar el canvi de lletres */
.flashlight-full-dark {
  opacity: 1 !important;
  background: #0b1120 !important; /* Tapem el gradient amb un color sòlid */
}

.bg-slate-800 { background-color: #1e293b; }
.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }
</style>