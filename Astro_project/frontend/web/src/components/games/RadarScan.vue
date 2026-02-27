<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <div class="hud d-flex justify-center align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">{{ $t('radarScan.points', { score }) }}</div>
        <div class="text-h5 font-weight-bold text-cyan-accent-3">{{ $t('radarScan.time') }} <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
      </div>
    </div>

    <div 
      class="board d-flex flex-wrap justify-center align-center" 
      :style="{ width: boardSize + 'px' }"
      :class="{ 'board-transitioning': isTransitioning && !correctClicked }"
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

    <div 
      class="flashlight-overlay" 
      :class="{ 'flashlight-hidden': isTransitioning }"
      :style="{ 
        '--mouseX': mouseX + 'px', 
        '--mouseY': mouseY + 'px',
        '--tunnelSize': currentTunnelSize + 'px'
      }"
    ></div>

    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">{{ $t('radarScan.title') }}</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          {{ $t('radarScan.desc') }}
        </p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black block" @click="startGame">
          {{ $t('radarScan.startBtn') }}
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="100">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="450">
        <v-icon icon="mdi-trophy" color="amber-accent-3" size="80" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-white mb-2">{{ $t('radarScan.completed') }}</h2>
        <p class="text-h6 text-cyan-accent-3 mb-8">{{ $t('radarScan.totalPoints', { score }) }}</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black px-8" @click="returnToMenu">
          {{ $t('radarScan.returnMenu') }}
        </v-btn>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['game-over']);
const { t } = useI18n();

// --- VARIABLES D'ESTAT ---
const showStartOverlay = ref(true);
const showGameOverOverlay = ref(false);
const isTransitioning = ref(false);
const correctClicked = ref(false);
const score = ref(0);
const timeLeft = ref(60);
let timerInterval = null;

// --- SISTEMA DE VISIÓ ---
const mouseX = ref(0);
const mouseY = ref(0);
const gameArea = ref(null);

// --- LÒGICA DEL TAULER ---
const board = ref([]);
const currentLevel = ref(1);
const targetIndex = ref(-1);

// --- CONFIGURACIÓ DE NIVELLS ---
const levels = [
  { distractor: 'p', target: 'q', grid: 5, tunnel: 250 },
  { distractor: 'b', target: 'd', grid: 7, tunnel: 200 },
  { distractor: 'm', target: 'n', grid: 9, tunnel: 150 },
  { distractor: 'O', target: 'Q', grid: 12, tunnel: 120 },
  { distractor: 'E', target: 'F', grid: 15, tunnel: 100 }
];

// --- COMPUTADES ---
const currentConfig = computed(() => {
  return levels[Math.min(currentLevel.value - 1, levels.length - 1)];
});
const currentTunnelSize = computed(() => currentConfig.value.tunnel);
const cellSize = computed(() => Math.max(30, 600 / currentConfig.value.grid));
const boardSize = computed(() => currentConfig.value.grid * cellSize.value);

// --- FUNCIONS CORE ---
const updateFlashlight = (e) => {
  if (!gameArea.value) return;
  const rect = gameArea.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
};

const generateBoard = () => {
  const config = currentConfig.value;
  const totalCells = config.grid * config.grid;
  
  let newBoard = Array(totalCells).fill(config.distractor);
  targetIndex.value = Math.floor(Math.random() * totalCells);
  newBoard[targetIndex.value] = config.target;
  
  board.value = newBoard;
};

const nextRound = () => {
  score.value += (currentLevel.value * 10);
  timeLeft.value = Math.min(60, timeLeft.value + 1);
  currentLevel.value++;
  generateBoard();
};

const checkLetter = (index) => {
  if (showStartOverlay.value || showGameOverOverlay.value || timeLeft.value <= 0 || isTransitioning.value) return;

  if (index === targetIndex.value) {
    isTransitioning.value = true;
    correctClicked.value = true;
    
    setTimeout(() => {
      correctClicked.value = false;
      nextRound(); 
      
      setTimeout(() => {
        isTransitioning.value = false;
      }, 200);
      
    }, 800);

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
  correctClicked.value = false;
  score.value = 0;
  timeLeft.value = 60;
  currentLevel.value = 1;
  generateBoard();
  
  timerInterval = setInterval(() => {
    if (!isTransitioning.value && timeLeft.value > 0) {
      timeLeft.value--;
      if (timeLeft.value <= 0) endGame();
    }
  }, 1000);
};

const endGame = () => {
  clearInterval(timerInterval);
  showGameOverOverlay.value = true; 
};

const returnToMenu = () => {
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
  user-select: none;
}

.board {
  max-width: 90%;
  max-height: 90%;
  z-index: 2;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.board-transitioning {
  opacity: 0;
  transform: scale(0.95);
}

.letter-cell {
  color: #334155;
  transition: color 0.2s;
}

.letter-correct {
  color: #00e5ff !important;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.8);
  transform: scale(1.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
  transition: opacity 0.4s ease-in-out; 
  background: radial-gradient(
    circle var(--tunnelSize) at var(--mouseX) var(--mouseY), 
    transparent 0%, 
    rgba(11, 17, 32, 0.98) 80%, 
    rgba(11, 17, 32, 1) 100%
  );
}

.flashlight-hidden {
  opacity: 0 !important;
}

.bg-slate-800 { background-color: #1e293b; }
.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }

.hud-pill {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 999px;
  padding: 10px 22px;
  backdrop-filter: blur(4px);
}
</style>
