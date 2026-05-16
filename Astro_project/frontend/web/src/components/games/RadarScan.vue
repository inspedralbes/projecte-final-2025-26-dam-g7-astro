<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <div class="hud d-flex justify-center align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
        <div v-if="!isMultiplayer" class="text-h5 font-weight-bold text-cyan-accent-3">Temps: <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
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
        :style="{ width: cellSize + 'px', height: cellSize + 'px', fontSize: (cellSize * 0.6) + 'px' }"
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
        '--mouseX': displayMouseX + 'px', 
        '--mouseY': displayMouseY + 'px',
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

    <v-overlay v-if="!isMultiplayer" v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="100">
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
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();

const emit = defineEmits(['game-over']);
const props = defineProps({
  isMultiplayer: { type: Boolean, default: false },
  isRace: { type: Boolean, default: false },
  duration: { type: Number, default: 60 },
  isPaused: { type: Boolean, default: false },
  isSpectator: { type: Boolean, default: false },
  spectatedPlayer: { type: String, default: null },
  isDuel: { type: Boolean, default: false }
});

const isAuthority = computed(() => {
  if (props.isSpectator) return false
  if (!props.isMultiplayer) return true
  const hostName = multiplayerStore.room?.host?.username || multiplayerStore.room?.host
  if (hostName === astroStore.user) return true
  // En duelos, torneos o carreras cada jugador es autoridad de su propio minijuego
  const modality = multiplayerStore.room?.gameConfig?.modality
  const mode = multiplayerStore.room?.gameConfig?.mode
  if (props.isDuel || props.isRace || modality === '1vs1' || mode === 'TOURNAMENT' || mode === 'RACE') return true
  return false
})

// --- VARIABLES D'ESTAT ---
const showStartOverlay = ref(!props.isSpectator);
const showGameOverOverlay = ref(false);
const isTransitioning = ref(false);
const correctClicked = ref(false);
const score = ref(0);
const timeLeft = ref(props.duration || 60);
let timerInterval = null;

// --- SISTEMA DE VISIÓ ---
const mouseX = ref(0);
const mouseY = ref(0);
const gameArea = ref(null);

// Computada para saber qué ratón mostrar (el local o el del jugador observado)
const displayMouseX = computed(() => {
  if (props.isSpectator && props.spectatedPlayer) {
    const cursor = multiplayerStore.remoteCursors[props.spectatedPlayer];
    if (cursor) {
      const width = gameArea.value?.clientWidth || window.innerWidth;
      return (cursor.x / 1000) * width;
    }
  }
  return mouseX.value;
});
const displayMouseY = computed(() => {
  if (props.isSpectator && props.spectatedPlayer) {
    const cursor = multiplayerStore.remoteCursors[props.spectatedPlayer];
    if (cursor) {
      const height = gameArea.value?.clientHeight || window.innerHeight;
      return (cursor.y / 1000) * height;
    }
  }
  return mouseY.value;
});

// --- LÓGICA DEL TAULER ---
const board = ref([]);
const currentLevel = ref(1);
const targetIndex = ref(-1);

// --- CONFIGURACIÓ DE NIVELLS ---
const levels = [
  { distractor: 'p', target: 'q', gridX: 20, gridY: 10, tunnel: 300 },
  { distractor: 'b', target: 'd', gridX: 25, gridY: 12, tunnel: 250 },
  { distractor: 'm', target: 'n', gridX: 30, gridY: 15, tunnel: 200 },
  { distractor: 'O', target: 'Q', gridX: 35, gridY: 18, tunnel: 180 },
  { distractor: 'E', target: 'F', gridX: 40, gridY: 20, tunnel: 150 }
];

// --- COMPUTADES ---
const currentConfig = computed(() => {
  return levels[Math.min(currentLevel.value - 1, levels.length - 1)];
});
const currentTunnelSize = computed(() => currentConfig.value.tunnel);
const cellSize = computed(() => {
  if (!gameArea.value) return 40;
  const availableWidth = gameArea.value.clientWidth * 0.9;
  // Restamos HUD (110) + margen inferior (40) + un poco de padding extra (20) = 170
  const availableHeight = gameArea.value.clientHeight - 170;
  
  const widthBasedSize = availableWidth / currentConfig.value.gridX;
  const heightBasedSize = availableHeight / currentConfig.value.gridY;
  
  // Limitar tamaño máximo para que no se vea gigante en 4K
  return Math.min(50, Math.max(16, Math.min(widthBasedSize, heightBasedSize)));
});
const boardSize = computed(() => currentConfig.value.gridX * cellSize.value);

// --- FUNCIONS CORE ---
let lastMouseSync = 0;
const updateFlashlight = (e) => {
  if (!gameArea.value || props.isSpectator) return;
  const rect = gameArea.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;

  const now = Date.now();
  if (props.isMultiplayer && now - lastMouseSync > 33) { // 30 FPS sync
    lastMouseSync = now;
    multiplayerStore.sendGameAction({
      type: 'MOUSE_MOVE',
      x: Math.round((mouseX.value / gameArea.value.clientWidth) * 1000),
      y: Math.round((mouseY.value / gameArea.value.clientHeight) * 1000)
    });
  }
};

const generateBoard = () => {
  // Eliminamos el return de espectador para que ellos también lo generen con el seed
  const config = currentConfig.value;
  const totalCells = config.gridX * config.gridY;
  
  // Usar una semilla si está disponible para que ambos jugadores vean lo mismo
  let randomFunc = Math.random;
  if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.seed) {
    let seed = String(multiplayerStore.room.gameConfig.seed + currentLevel.value).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    randomFunc = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  let newBoard = Array(totalCells).fill(config.distractor);
  targetIndex.value = Math.floor(randomFunc() * totalCells);
  
  // ASEGURAR QUE LA LETRA ES DIFERENTE
  if (config.target === config.distractor) {
    console.warn("⚠️ RadarScan: Target y Distractor son iguales. Forzando 'X' vs 'O'.");
    newBoard[targetIndex.value] = 'X';
  } else {
    newBoard[targetIndex.value] = config.target;
  }
  
  board.value = newBoard;
  showStartOverlay.value = false; // El espectador no ve el overlay de inicio

  if (props.isMultiplayer && !props.isSpectator) {
    multiplayerStore.sendGameAction({
      type: 'SPECTATOR_SYNC',
      board: newBoard,
      targetIndex: targetIndex.value,
      level: currentLevel.value,
      score: score.value,
      timeLeft: timeLeft.value
    });
  }
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
      
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'SABOTAGE',
          subtype: 'REDUCE_TIME',
          amount: 1
        });
      }

      nextRound(); 
      
      setTimeout(() => {
        isTransitioning.value = false;
      }, 200);
      
    }, 800);

  } else {
    timeLeft.value = Math.max(0, timeLeft.value - 3);
    score.value = Math.max(0, score.value - 5);
    if (props.isMultiplayer) multiplayerStore.timeLeft = timeLeft.value;
    if (timeLeft.value === 0) endGame();
  }
};

const startGame = () => {
  showStartOverlay.value = false;
  showGameOverOverlay.value = false;
  isTransitioning.value = false;
  correctClicked.value = false;
  score.value = 0;
  timeLeft.value = props.duration || 60;
  currentLevel.value = 1;
  generateBoard();
  
  let lastTick = Date.now();
  timerInterval = setInterval(() => {
    if (showStartOverlay.value || showGameOverOverlay.value || props.isPaused) {
      lastTick = Date.now();
      return;
    }
    
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    
    if (delta >= 1) {
      lastTick = now;
      if (timeLeft.value > 0) {
        timeLeft.value = Math.max(0, timeLeft.value - Math.floor(delta));
        
        if (props.isMultiplayer && isAuthority.value) {
          multiplayerStore.timeLeft = timeLeft.value;
          multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value });
        }

        if (timeLeft.value <= 0) endGame();
      }
    }
  }, 500);
};

const endGame = (silent = false) => {
  clearInterval(timerInterval);
  if (props.isMultiplayer) {
    multiplayerStore.submitRoundResult();
  }
  emit('game-over', score.value);
};

const returnToMenu = () => {
  emit('game-over', score.value); 
};

onMounted(() => {
  if (props.isSpectator && props.spectatedPlayer) {
    const lastSync = multiplayerStore.lastSpectatorSync[props.spectatedPlayer];
    if (lastSync && lastSync.type === 'SPECTATOR_SYNC') {
      applySpectatorSync(lastSync);
    } else {
      generateBoard(); // Generar localmente si no hay sync
    }
    multiplayerStore.sendGameAction({ type: 'REQUEST_SYNC' });
  } else if (props.isMultiplayer || props.isRace || (props.duration && !props.isSpectator)) {
    // Pequeño delay para asegurar que gameArea.value esté listo antes de iniciar
    setTimeout(() => {
      startGame();
    }, 100);
  }
});

function applySpectatorSync(data) {
  if (!data) return;
  if (data.board) board.value = data.board;
  if (data.targetIndex !== undefined) targetIndex.value = data.targetIndex;
  if (data.level !== undefined) currentLevel.value = data.level;
  if (data.score !== undefined) score.value = data.score;
  if (data.timeLeft !== undefined) timeLeft.value = data.timeLeft;
  showStartOverlay.value = false;
}

// Listener para acciones multijugador
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    emit('game-over', score.value);
    return;
  }

  if (msg.type === 'TIME_ATTACK') {
    timeLeft.value = Math.max(0, timeLeft.value - 3);
    return;
  }

  if (msg.type === 'GAME_ACTION') {
    if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 1));
    }
    if (msg.action?.type === 'SPECTATOR_SYNC' && props.isSpectator && msg.from === props.spectatedPlayer) {
        applySpectatorSync(msg.action);
    }
    if (msg.action?.type === 'REQUEST_SYNC' && !props.isSpectator && isAuthority.value) {
        multiplayerStore.sendGameAction({
            type: 'SPECTATOR_SYNC',
            board: board.value,
            targetIndex: targetIndex.value,
            level: currentLevel.value,
            score: score.value,
            timeLeft: timeLeft.value
        });
    }
  }
});

// Sincronización de tiempo global para Torneo/Duelos
watch(() => multiplayerStore.timeLeft, (newTime) => {
  if (props.isMultiplayer) {
    timeLeft.value = Math.ceil(newTime);
    if (timeLeft.value <= 0) endGame();
  }
});

// Regenerar tablero si cambia el seed o el nivel
watch([() => multiplayerStore.room?.gameConfig?.seed, currentLevel], () => {
  generateBoard();
});

// Notificar puntuació al servidor en modo multijugador
watch(score, (newScore) => {
  if (props.isMultiplayer) {
    multiplayerStore.sendGameAction({
      type: 'SCORE_UPDATE',
      score: newScore
    });
  }
});

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
  max-width: 1400px;
  width: 95%;
  margin-top: 110px; /* Reducido para dar más espacio vertical */
  margin-bottom: 30px;
  gap: 8px;
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
