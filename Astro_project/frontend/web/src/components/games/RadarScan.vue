<template>
  <div class="game-container" @mousemove="updateFlashlight" ref="gameArea">
    <div class="hud d-flex justify-space-between align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 10;">
      <div v-if="!props.isMultiplayer" class="text-h5 font-weight-bold text-cyan-accent-3 d-flex align-center">
        Temps: <span :class="{'text-red': timeLeft <= 10}" class="mx-1">{{ timeLeft }}s</span>
        <v-icon v-if="isSlowTimeActive" size="small" color="blue-accent-2" class="ml-1">mdi-timer-sand-empty</v-icon>
      </div>
      <!-- En multijugador asume toda la atención central, por lo que aplicamos mr-auto si no mostramos el otro div para centrar igualmente -->
      <div class="text-h6 text-white bg-slate-800 px-4 py-1 rounded-pill border-cyan" :class="{ 'mx-auto': props.isMultiplayer }">Objectiu: Troba la '{{ targetChar }}'</div>
      <div v-if="!props.isMultiplayer" class="text-h5 font-weight-bold text-amber-accent-3 d-flex align-center">
        Punts: {{ score }}
        <div v-if="isShieldActive" class="ml-3">
          <v-icon color="teal-accent-4">mdi-shield-check</v-icon>
        </div>
      </div>
    </div>

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
        :class="{ 
          'letter-correct': correctClicked && index === targetIndex,
          'letter-decoy': decoyIndex === index && correctClicked
        }"
        @click="checkLetter(index)"
      >
        {{ letter }}
      </div>
    </div>

    <!-- La capa de foscor/llanterna en SVG para soportar agujeros múltiples perfectos -->
    <svg 
      class="flashlight-overlay" 
      :class="{ 
        'flashlight-off': isTransitioning, 
        'flashlight-full-dark': isChangingLevel,
        'sweep-active': isSweepActive 
      }"
    >
      <defs>
        <radialGradient id="holeGradient">
           <stop offset="0%" stop-color="black" />
           <stop offset="80%" stop-color="black" />
           <stop offset="100%" stop-color="white" />
        </radialGradient>
        <mask id="radarHolesMask">
           <!-- Fons totalment blanc (invisible/opac al rect) -->
           <rect width="100%" height="100%" fill="white" />
           <!-- Forat pel jugador local (negre transparenta) -->
           <circle :cx="mouseX" :cy="mouseY" :r="isSweepActive ? currentTunnelSize * 2.5 : currentTunnelSize" fill="url(#holeGradient)" />
           <!-- Forat pel jugador remot (negre transparenta) -->
           <circle v-if="remoteCursor" :cx="remoteCursor.x" :cy="remoteCursor.y" :r="isSweepActive ? currentTunnelSize * 2.5 : currentTunnelSize" fill="url(#holeGradient)" />
        </mask>
      </defs>
      
      <!-- Rectangle negre fosc al 100%. Mirem a través només si no estem en pantalla fosca total -->
      <rect width="100%" height="100%" fill="#0b1120" :mask="isChangingLevel ? null : 'url(#radarHolesMask)'" />
    </svg>

    <div v-if="isSweepActive" class="sweep-banner">
        <v-icon icon="mdi-radar" class="mr-2"></v-icon>
        BARRER D'ALTA ENERGIA ACTIU
    </div>
    <div v-if="isDecoyActive" class="decoy-banner">
        <v-icon icon="mdi-drone" class="mr-2"></v-icon>
        DRONS ESQUERS DETECTATS
    </div>

    <!-- Cursors compartits (Visibles per sobre de la flashlight) -->
    <template v-if="props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE'">
         <div 
           v-for="(pos, user) in multiplayerStore.remoteCursors" 
           :key="'cursor-'+user" 
           class="remote-cursor-game"
           :style="{ left: (remoteCursor?.x || 0) + 'px', top: (remoteCursor?.y || 0) + 'px' }"
         >
           <v-icon icon="mdi-cursor-default" color="cyan-accent-2" size="24"></v-icon>
           <div class="cursor-tag-mini">{{ user }}</div>
         </div>
    </template>

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

    <v-snackbar v-model="showShieldFeedback" color="warning" timeout="2000" location="top">
      <v-icon start>mdi-shield-check</v-icon> ERROR ANULADO. EL ESCUDO TE HA SALVADO.
    </v-snackbar>
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
  isMultiplayer: { type: Boolean, default: false }
});

// LÓGICA DE BOOSTERS
const isSlowTimeActive = computed(() => (astroStore.activeBoosters?.slowTimeGamesLeft || 0) > 0);
const isShieldActive = ref(false);
const showShieldFeedback = ref(false);

const showStartOverlay = ref(true);
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
const decoyIndex = ref(-1);
const targetChar = ref('');

// --- EFECTES MULTIJUGADOR ---
const isSweepActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_SWEEP'));
const isDecoyActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_DECOY'));

const levels = [
  { distractor: 'p', target: 'q', grid: 5, tunnel: 250 },
  { distractor: 'b', target: 'd', grid: 7, tunnel: 200 },
  { distractor: 'm', target: 'n', grid: 9, tunnel: 150 },
  { distractor: 'O', target: 'Q', grid: 12, tunnel: 120 },
  { distractor: 'E', target: 'F', grid: 15, tunnel: 100 }
];

const isCoop = computed(() => props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE');
const currentConfig = computed(() => levels[Math.min(currentLevel.value - 1, levels.length - 1)]);
const currentTunnelSize = computed(() => currentConfig.value.tunnel / 2);
const cellSize = computed(() => Math.max(30, 600 / currentConfig.value.grid));
const boardSize = computed(() => currentConfig.value.grid * cellSize.value);

const updateFlashlight = (e) => {
  if (!gameArea.value) return;
  const rect = gameArea.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
};

const remoteCursor = computed(() => {
  if (!props.isMultiplayer || multiplayerStore.room?.gameConfig?.mode !== 'COOPERATIVE') return null;
  const opp = multiplayerStore.room?.players?.find(p => p !== astroStore.user);
  if (!opp) return null;
  const pos = multiplayerStore.remoteCursors[opp];
  if (!pos) return null;
  
  if (!gameArea.value) return null;
  const rect = gameArea.value.getBoundingClientRect();
  const clientX = (pos.x / 100) * window.innerWidth;
  const clientY = (pos.y / 100) * window.innerHeight;
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
});

let currentSeed = 1;
const seededDice = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
};

const generateBoard = () => {
  const config = currentConfig.value;
  const totalCells = config.grid * config.grid;
  targetChar.value = config.target;
  let newBoard = Array(totalCells).fill(config.distractor);
  // Usar semilla para que el objetivo sea el mismo
  targetIndex.value = Math.floor(seededDice() * totalCells);
  newBoard[targetIndex.value] = config.target;
  
  // Si hay drones esquers, añadir otro objetivo falso
  if (isDecoyActive.value) {
    let dIndex;
    do {
      dIndex = Math.floor(seededDice() * totalCells);
    } while (dIndex === targetIndex.value);
    decoyIndex.value = dIndex;
    newBoard[decoyIndex.value] = config.target;
  } else {
    decoyIndex.value = -1;
  }
  
  board.value = newBoard;
};

const nextRound = () => {
  score.value += (currentLevel.value * 10);
  timeLeft.value = Math.min(60, timeLeft.value + 1);
  currentLevel.value++;
  generateBoard();
};

const checkLetter = (index, fromRemote = false) => {
  if (showStartOverlay.value || timeLeft.value <= 0 || isTransitioning.value) return;

  if (index === targetIndex.value || fromRemote) {
    if (fromRemote) targetIndex.value = index; // Sincronizar por si acaso
    
    isTransitioning.value = true;
    correctClicked.value = true;
    
    // Si somos nosotros los que acertamos en cooperativo, avisamos
    if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE' && !fromRemote) {
        multiplayerStore.sendGameAction({ type: 'TARGET_FOUND', index });
    }

    setTimeout(() => {
      correctClicked.value = false;
      isChangingLevel.value = true;
      
      // Enviar sabotatge o bonus en multijugador
      if (props.isMultiplayer && !fromRemote) {
        if (multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE') {
          multiplayerStore.sendGameAction({ type: 'BONUS', subtype: 'ADD_TIME', amount: 2 });
        } else {
          multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: 1 });
        }
      }
      
      setTimeout(() => {
        nextRound(); 
        setTimeout(() => {
          isTransitioning.value = false;
          isChangingLevel.value = false;
        }, 300);
      }, 400);
    }, 800);
  } else {
    // INTERCEPCIÓN DEL ESCUDO
    if (isShieldActive.value) {
        isShieldActive.value = false;
        showShieldFeedback.value = true;
        return; // Sin penalización de tiempo
    }
    timeLeft.value = Math.max(0, timeLeft.value - 3);
    score.value = Math.max(0, score.value - 5);
    if (timeLeft.value === 0) endGame();
  }
};

const myTeam = computed(() => multiplayerStore.room?.gameConfig?.teams?.find(t => t.members.includes(astroStore.user)));
const myTeamId = computed(() => myTeam.value?.id);
const isMyTeammate = (user) => myTeam.value?.members.includes(user) && user !== astroStore.user;

const startGame = () => {
  showStartOverlay.value = false;
  isTransitioning.value = false;
  isChangingLevel.value = false;
  correctClicked.value = false;
  score.value = 0;
  timeLeft.value = 60;
  currentLevel.value = 1;
  isShieldActive.value = (astroStore.activeBoosters?.shieldGamesLeft || 0) > 0;
  
  generateBoard();
  
  const tickTime = isSlowTimeActive.value ? 1250 : 1000;
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(timeLeft.value);
      if (timeLeft.value <= 0) {
          timeLeft.value = 0;
          if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(0);
          endGame();
      }
    }
  }, tickTime);
};

const endGame = (silent = false) => {
  clearInterval(timerInterval);
  if (props.isMultiplayer && !silent) {
    multiplayerStore.submitRoundResult();
    return;
  }
  emit('game-over', score.value);
};

onMounted(() => {
  if (props.isMultiplayer) {
    if (multiplayerStore.room?.gameConfig?.seed) {
        currentSeed = Math.floor(multiplayerStore.room.gameConfig.seed * 10000);
    }
    startGame();
  }
});

// Listener para acciones multijugador
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    // El Lobby gestiona el tancament del component via watcher de lastMessage
    return;
  }

  // REBRE SABOTATGE: Restar temps (Dirigit o Global)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.from !== astroStore.user) {
      let shouldApply = false;
      if (isCoop.value) {
          if (msg.action.targetTeamId && msg.action.targetTeamId === myTeamId.value) shouldApply = true;
      } else {
          shouldApply = true;
      }

      if (shouldApply && msg.action.subtype === 'REDUCE_TIME') {
          timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 1));
      }
  }

  // REBRE BONUS: Sumar temps (Solo Compañero)
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'BONUS' && msg.action?.subtype === 'ADD_TIME') {
      if (isCoop.value && isMyTeammate(msg.from)) {
          timeLeft.value = Math.min(60, timeLeft.value + (msg.action.amount || 2));
      }
  }

  // REBRE TROBADA COOPERATIVA (Solo Compañero)
  if (isCoop.value && isMyTeammate(msg.from) && msg.type === 'GAME_ACTION' && msg.action?.type === 'TARGET_FOUND') {
      checkLetter(msg.action.index, true);
  }
});

watch(score, (newScore) => {
  if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore });
});

onBeforeUnmount(() => { 
    if (timerInterval) clearInterval(timerInterval); 
    if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(null);
});
</script>


<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: #0b1120;
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

.board-hidden {
  opacity: 0 !important;
}

.board-transitioning {
  opacity: 0;
  transform: scale(0.95);
}

.letter-cell {
  color: #1e293b;
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
}

.flashlight-off {
  opacity: 0 !important;
}

.flashlight-full-dark {
  opacity: 1 !important;
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

/* Efectes */
.sweep-active {
    background: rgba(11, 17, 32, 0.95) !important;
}

.sweep-banner, .decoy-banner {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: bold;
    color: white;
    z-index: 100;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
    animation: slideInUp 0.5s ease-out;
}

.sweep-banner {
    background: linear-gradient(90deg, #00e5ff, #0097a7);
    border: 1px solid #e0f7fa;
}

.decoy-banner {
    background: linear-gradient(90deg, #f43f5e, #be123c);
    border: 1px solid #ffe4e6;
}

@keyframes slideInUp {
    from { transform: translate(-50%, 20px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

.letter-decoy {
    color: #f43f5e !important;
    text-shadow: 0 0 15px rgba(244, 63, 94, 0.8);
    transform: scale(1.3);
}

.remote-cursor-game {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.05s linear;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cursor-tag-mini {
  background: rgba(0, 229, 255, 0.8);
  color: black;
  font-size: 8px;
  font-weight: 900;
  padding: 0px 4px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>
