<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <!-- HUD -->
    <div class="hud d-flex justify-space-between align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="text-h5 font-weight-bold text-cyan-accent-3">Temps: <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
      <div class="text-h6 text-white bg-slate-800 px-4 py-1 rounded-pill border-cyan">Objectiu: Troba la '{{ targetChar }}'</div>
      <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
    </div>

    <!-- TAULER -->
    <div 
      class="board d-flex flex-wrap justify-center align-center" 
      :style="{ width: boardSize + 'px' }"
      :class="{ 
        'board-hidden': isChangingLevel 
      }"
    >
      <!-- FIX: Usem :data-char per evitar Ctrl+F -->
      <div 
        v-for="(letter, index) in board" 
        :key="index"
        class="letter-cell d-flex justify-center align-center font-weight-black cursor-pointer"
        :data-char="letter"
        :style="{ 
          width: cellSize + 'px', 
          height: cellSize + 'px',
          fontSize: (cellSize * 0.6) + 'px' 
        }"
        :class="{ 'letter-correct': correctClicked && index === targetIndex }"
        @click="checkLetter(index)"
      ></div>
    </div>

    <!-- LLANTERNA (Capa fosca) -->
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

    <!-- OVERLAYS (Inici / Final) -->
    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">Escàner de Ràdar</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">Troba la lletra diferent. La teva llanterna és l'única guia.</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black block" @click="startGame">
          COMENÇAR
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="100">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="450">
        <v-icon icon="mdi-trophy" color="amber-accent-3" size="80" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-white mb-2">¡Escàner Completat!</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">Punts Totals: {{ score }}</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black px-8" @click="returnToMenu">
          OBTENIR RECOMPENSA
        </v-btn>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';

const emit = defineEmits(['game-over']);

const showStartOverlay = ref(true);
const showGameOverOverlay = ref(false);
const isTransitioning = ref(false);
const isChangingLevel = ref(false);
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
  { distractor: 'p', target: 'q', grid: 6, tunnel: 180 },
  { distractor: 'b', target: 'd', grid: 8, tunnel: 160 },
  { distractor: 'm', target: 'n', grid: 10, tunnel: 140 },
  { distractor: 'O', target: 'Q', grid: 12, tunnel: 120 },
  { distractor: 'E', target: 'F', grid: 15, tunnel: 100 }
];

const currentConfig = computed(() => levels[Math.min(currentLevel.value - 1, levels.length - 1)]);
const currentTunnelSize = computed(() => currentConfig.value.tunnel);
const cellSize = computed(() => Math.max(30, 580 / currentConfig.value.grid));
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
    isTransitioning.value = true;
    correctClicked.value = true;
    
    setTimeout(() => {
      correctClicked.value = false;
      isChangingLevel.value = true;
      
      setTimeout(() => {
        score.value += (currentLevel.value * 10);
        timeLeft.value = Math.min(60, timeLeft.value + 3);
        currentLevel.value++;
        generateBoard();

        setTimeout(() => {
          isTransitioning.value = false;
          isChangingLevel.value = false;
        }, 200);
      }, 300);
    }, 700);

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
  background-color: #020617; /* Fons extremadament fosc */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none;
}

.board {
  max-width: 95%;
  max-height: 95%;
  z-index: 2;
  transition: opacity 0.2s ease;
}

.board-hidden {
  opacity: 0 !important;
}

/* LLETRES */
.letter-cell {
  color: #f8fafc; /* Color de la lletra (ara molt clar per veure-la bé) */
  position: relative;
}

/* ANTI CTRL+F: La lletra no existeix al DOM com a text */
.letter-cell::before {
  content: attr(data-char);
}

.letter-correct {
  color: #00e5ff !important;
  text-shadow: 0 0 20px rgba(0, 229, 255, 1);
  transform: scale(1.5);
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* LLANTERNA */
.flashlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.3s ease;
  /* Llanterna més forta: transparent al centre, negre opac ràpidament */
  background: radial-gradient(
    circle var(--tunnelSize) at var(--mouseX) var(--mouseY), 
    transparent 0%, 
    transparent 40%, 
    rgba(2, 6, 23, 0.95) 75%, 
    rgba(2, 6, 23, 1) 100%
  );
}

.flashlight-off {
  opacity: 0;
}

.flashlight-full-dark {
  opacity: 1 !important;
  background: #020617 !important;
}

.bg-slate-800 { background-color: #1e293b; }
.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }
</style>