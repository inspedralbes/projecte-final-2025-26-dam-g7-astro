<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'BOSS'" class="hud d-flex justify-center align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
        <div v-if="!isMultiplayer" class="text-h5 font-weight-bold text-cyan-accent-3">Temps: <span :class="{'text-red': timeLeft <= 10}">{{ timeLeft }}s</span></div>
      </div>
    </div>

    <div 
      class="board board-neon d-flex flex-wrap justify-center align-center" 
      :style="{ width: boardSize + 'px' }"
      :class="{ 'board-transitioning': isTransitioning && !correctClicked }"
    >
      <div 
        v-for="(letter, index) in board" 
        :key="index"
        class="letter-cell d-flex justify-center align-center text-h4 font-weight-bold cursor-pointer"
        :style="{ width: cellSize + 'px', height: cellSize + 'px', fontSize: (cellSize * 0.6) + 'px' }"
        :class="{ 
          'letter-correct': correctClicked && index === targetIndex, 
          'letter-pop': clickedIndex === index 
        }"
        @click="checkLetter(index)"
      >
        {{ letter }}
      </div>
    </div>

    <canvas 
      ref="flashlightCanvas"
      class="flashlight-canvas" 
      :class="{ 'flashlight-hidden': isTransitioning }"
    ></canvas>

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
import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();

const emit = defineEmits(['game-over', 'action']);
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

const anyRivalAlive = computed(() => {
  if (!props.isMultiplayer) return true
  if (!multiplayerStore.playerTimes) return true
  const rivals = Object.keys(multiplayerStore.playerTimes).filter(u => u !== astroStore.user)
  if (rivals.length === 0) return true 
  return rivals.some(u => (multiplayerStore.playerTimes[u] || 0) > 0)
})

// --- VARIABLES D'ESTAT ---
const showStartOverlay = ref(!props.isSpectator);
const showGameOverOverlay = ref(false);
const isTransitioning = ref(false);
const correctClicked = ref(false);
const clickedIndex = ref(-1);
const score = ref(0);
const timeLeft = ref(props.duration || 60);
let timerInterval = null;

// --- SISTEMA DE VISIÓ ---
const mouseX = ref(0);
const mouseY = ref(0);
const targetMouseX = ref(0);
const targetMouseY = ref(0);
const gameArea = ref(null);
const flashlightCanvas = ref(null);

const myTeam = computed(() => {
  if (!multiplayerStore.room?.gameConfig?.teams) return null;
  return multiplayerStore.room.gameConfig.teams[astroStore.user];
});

const teammateName = computed(() => {
  if (!props.isMultiplayer || !myTeam.value) return null;
  const teams = multiplayerStore.room.gameConfig.teams;
  return Object.keys(teams).find(u => u !== astroStore.user && teams[u] === myTeam.value);
});

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

const drawLightCircle = (ctx, x, y, radius) => {
  const grad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

const drawCanvasFlashlight = () => {
  const canvas = flashlightCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Fill dark background
  ctx.fillStyle = 'rgba(11, 17, 32, 0.98)';
  ctx.fillRect(0, 0, w, h);

  // destination-out to carve
  ctx.globalCompositeOperation = 'destination-out';

  const tunnelSize = currentTunnelSize.value;

  // 1. Local light
  drawLightCircle(ctx, displayMouseX.value, displayMouseY.value, tunnelSize);

  // 2. Teammate's light
  const isCoop2vs2 = props.isMultiplayer && multiplayerStore.room?.gameConfig?.modality === '2vs2';
  if (isCoop2vs2 && teammateName.value) {
    const cursor = multiplayerStore.remoteCursors[teammateName.value];
    if (cursor) {
      const tmX = (cursor.x / 1000) * w;
      const tmY = (cursor.y / 1000) * h;
      drawLightCircle(ctx, tmX, tmY, tunnelSize);
    }
  }

  // Restore composite
  ctx.globalCompositeOperation = 'source-over';
};

watch([mouseX, mouseY, () => multiplayerStore.remoteCursors], () => {
  drawCanvasFlashlight();
}, { deep: true });

const resizeCanvas = () => {
  const canvas = flashlightCanvas.value;
  const container = gameArea.value?.$el || gameArea.value;
  if (canvas && container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawCanvasFlashlight();
  }
};

// --- LÓGICA DEL TAULER ---
const board = ref([]);
const currentLevel = ref(1);
const targetIndex = ref(-1);

// --- CONFIGURACIÓ DE NIVELLS ---
const levels = [
  { distractor: 'p', target: 'q', gridX: 6, gridY: 6, tunnel: 280 },
  { distractor: 'b', target: 'd', gridX: 8, gridY: 8, tunnel: 240 },
  { distractor: 'm', target: 'n', gridX: 10, gridY: 10, tunnel: 200 },
  { distractor: 'O', target: 'Q', gridX: 11, gridY: 11, tunnel: 170 },
  { distractor: 'E', target: 'F', gridX: 12, gridY: 12, tunnel: 140 }
];

// --- COMPUTADES ---
const currentConfig = computed(() => {
  return levels[Math.min(currentLevel.value - 1, levels.length - 1)];
});
const currentTunnelSize = computed(() => currentConfig.value.tunnel);

// Max board cap size (perfect central square of max 420px, dynamically fits clientHeight)
const targetBoardCap = computed(() => {
  if (!gameArea.value) return 420;
  const maxH = gameArea.value.clientHeight - 180;
  const maxW = gameArea.value.clientWidth * 0.9;
  return Math.min(420, Math.min(maxH, maxW));
});

const cellSize = computed(() => {
  const gridCount = currentConfig.value.gridX;
  // boardSize = gridCount * cellSize + (gridCount - 1) * 8 (gap)
  // Therefore: cellSize = (boardSize - (gridCount - 1) * 8) / gridCount
  const size = (targetBoardCap.value - (gridCount - 1) * 8) / gridCount;
  return Math.max(16, size);
});

const boardSize = computed(() => {
  const gridCount = currentConfig.value.gridX;
  return gridCount * cellSize.value + (gridCount - 1) * 8;
});

// --- FUNCIONS CORE ---
let lastMouseSync = 0;
const updateFlashlight = (e) => {
  if (!gameArea.value || props.isSpectator) return;
  const el = gameArea.value?.$el || gameArea.value;
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  const rect = el.getBoundingClientRect();
  targetMouseX.value = e.clientX - rect.left;
  targetMouseY.value = e.clientY - rect.top;

  // Si no está congelado, la linterna sigue al ratón instantáneamente
  if (multiplayerStore.activeBossEffect !== 'FREEZE') {
    mouseX.value = targetMouseX.value;
    mouseY.value = targetMouseY.value;
  }

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

// Loop de suavizado para el efecto de congelación (fricción de hielo)
const tickFreezeEffect = () => {
  if (multiplayerStore.activeBossEffect === 'FREEZE') {
    const damping = 0.08; // Factor de lentitud
    mouseX.value += (targetMouseX.value - mouseX.value) * damping;
    mouseY.value += (targetMouseY.value - mouseY.value) * damping;
  }
  requestAnimationFrame(tickFreezeEffect);
};

onMounted(() => {
  requestAnimationFrame(tickFreezeEffect);
});

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
  if (anyRivalAlive.value) {
    timeLeft.value += 5; // +5s por acierto
  }
  currentLevel.value++;
  
  if (props.isMultiplayer) {
    emit('action', { type: 'SCORE_UPDATE', score: score.value, timeLeft: timeLeft.value });
  }
  
  generateBoard();
};

const checkLetter = (index) => {
  if (showStartOverlay.value || showGameOverOverlay.value || timeLeft.value <= 0 || isTransitioning.value || props.spectatedPlayer) return;

  clickedIndex.value = index;
  setTimeout(() => {
    if (clickedIndex.value === index) clickedIndex.value = -1;
  }, 350);

  if (index === targetIndex.value) {
    isTransitioning.value = true;
    correctClicked.value = true;
    
    setTimeout(() => {
      correctClicked.value = false;
      
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'RADAR_CELL_REVEAL',
          index: index
        });

        multiplayerStore.sendGameAction({
          type: 'SABOTAGE',
          subtype: 'REDUCE_TIME',
          amount: 1
        });

        // LÓGICA MODO JEFE
        if (multiplayerStore.room?.gameConfig?.mode === 'BOSS') {
          const isBoss = multiplayerStore.room.gameConfig.boss === astroStore.user
          if (!isBoss) {
            // El Héroe ataca al Jefe al acertar
            multiplayerStore.sendGameAction({ type: 'HERO_ATTACK' })
          }
        }
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
      const isSuddenDeath = multiplayerStore.room?.status === 'SUDDEN_DEATH';
      if (timeLeft.value > 0 && !isSuddenDeath) {
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
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 200);

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
    if (msg.action?.type === 'RADAR_CELL_REVEAL' && msg.from !== astroStore.user) {
        isTransitioning.value = true;
        correctClicked.value = true;
        clickedIndex.value = msg.action.index;
        
        setTimeout(() => {
          correctClicked.value = false;
          nextRound();
          setTimeout(() => {
            isTransitioning.value = false;
          }, 200);
        }, 800);
    }
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
  window.removeEventListener('resize', resizeCanvas);
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
  max-width: 500px;
  max-height: 500px;
  aspect-ratio: 1 / 1;
  width: 95%;
  margin-top: 130px;
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
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.45);
  transform: scale(1.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10;
}

.letter-pop {
  animation: premium-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes premium-pop {
  0% { transform: scale(1); }
  30% { transform: scale(0.72); }
  75% { transform: scale(1.22); }
  100% { transform: scale(1); }
}

.board-neon {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.45), inset 0 0 15px rgba(0, 229, 255, 0.2);
  border-radius: 16px;
  padding: 10px;
}

.flashlight-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.4s ease-in-out;
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

