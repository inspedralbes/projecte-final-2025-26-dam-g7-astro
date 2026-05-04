<template>
  <div
    ref="gameArea"
    class="game-container"
    :class="{ 'hide-cursor': isPlaying }"
    @mousemove="handlePointerMove"
    @mousedown.left.prevent="beginFiring"
    @mouseup.left="stopFiring"
    @mouseleave="stopFiring"
  >
    <!-- HUD -->
    <div class="hud pa-4 w-100 position-absolute" style="top: 0; z-index: 12;">
      <div class="d-flex justify-center align-center">
        <div class="hud-pill d-flex align-center ga-6">
          <div class="text-h5 font-weight-bold text-amber-accent-3">{{ $t('symmetryBreaker.points', { score }) }}</div>
          <div class="text-h6 text-cyan-accent-2">{{ $t('symmetryBreaker.target', { target: currentChallenge?.target || '-' }) }}</div>
          <div 
            class="text-h5 font-weight-bold" 
            :class="isPenaltyActive || timeLeft <= 10 ? 'text-red-accent-2' : 'text-white'"
          >
            {{ $t('symmetryBreaker.time', { time: Math.ceil(timeLeft) }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de progrés (Fixada perquè arribi al final) -->
    <div class="lock-meter-wrapper">
      <div class="text-caption text-grey-lighten-1 mb-1">{{ $t('symmetryBreaker.lockMeter', { round }) }}</div>
      <v-progress-linear
        :model-value="holdProgressPct"
        color="lime-accent-3"
        height="10"
        rounded
        striped
      ></v-progress-linear>
    </div>

    <!-- Canvas -->
    <canvas ref="gameCanvas"></canvas>

    <div
      v-if="roundHintVisible"
      :key="roundHintToken"
      class="round-target-hint"
    >
      {{ roundHintText }}
    </div>

    <!-- Overlays -->
    <v-overlay v-if="!isMultiplayer" v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">{{ $t('symmetryBreaker.title') }}</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          {{ $t('symmetryBreaker.desc') }}
        </p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black" @click="startGame">
          {{ $t('symmetryBreaker.startMission') }}
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay v-if="!isMultiplayer" v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="120">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="400">
        <v-icon icon="mdi-target-variant" color="cyan-accent-3" size="70" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-white mb-2">{{ $t('symmetryBreaker.endMission') }}</h2>
        <p class="text-h5 text-amber-accent-2 mb-6">{{ $t('symmetryBreaker.points', { score }) }}</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black px-8" @click="returnToMenu">
          {{ $t('symmetryBreaker.returnMenu') }}
        </v-btn>
      </v-card>
    </v-overlay>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();

const props = defineProps({
  isMultiplayer: {
    type: Boolean,
    default: false
  }
});

const { t } = useI18n();
const emit = defineEmits(['game-over']);

const targetLocale = computed(() => {
  return t('symmetryBreaker.title') === "Symmetry Breaker" ? 'es' : 'ca'; // Basic check but we are translating a "dummy text" below
});

// Since language is dynamic, game sets should be dynamic
const confusionSetsDynamic = computed(() => {
    // You can adapt target and decoys conditionally if they have language dependencies.
    // For now we map as is since they are short simple words. (e.g., ORBITA vs ORBETA).
    // Let's assume this requires identical sets in ES / CA for now, or adapt them later.
    return [
      { target: 'B', decoys: ['D', 'P', 'Q', '8'] },
      { target: 'M', decoys: ['N', 'W', 'H', 'U'] },
      { target: 'FORMA', decoys: ['FIRMA', 'NORMA', 'FARMA', 'FORAT'] },
      { target: 'CASA', decoys: ['COSA', 'CAPA', 'CARA', 'CAIXA'] },
      { target: 'LLETRA', decoys: ['LLETRA?', 'LETRA', 'LINTER', 'LENTA'] },
      { target: 'ORBITA', decoys: ['ORBETA', 'ORBE', 'ORBITS', 'ORDITA'] }
    ]
});

const wordSets = confusionSets.filter((s) => s.target.length > 1);
const letterSets = confusionSets.filter((s) => s.target.length === 1);

const gameArea = ref(null);
const gameCanvas = ref(null);
let ctx = null;

const showStartOverlay = ref(true);
const showGameOverOverlay = ref(false);
const isPlaying = ref(false);

const score = ref(0);
const timeLeft = ref(60);
const round = ref(1);
const isPenaltyActive = ref(false);
const roundHintText = ref('');
const roundHintVisible = ref(false);
const roundHintToken = ref(0);
const successfulLocks = ref(0);

const currentChallenge = ref(null);
const targets = ref([]);
const mouseX = ref(0);
const mouseY = ref(0);
const isFiring = ref(false);
const holdProgressMs = ref(0);
const holdRequiredMs = ref(1000);

const HUD_SAFE_TOP = 170;
const EDGE_PADDING = 18;
const BASE_DECOYS = 4;
const MAX_DECOYS = 10;
const BASE_ENTITY_SIZE = 110;
const UNIFORM_COLORS_FROM_ROUND = 15;
const CLASSIC_TARGET_RING = '#00e5ff';
const CLASSIC_TARGET_FILL = 'rgba(0, 229, 255, 0.14)';
const CLASSIC_DECOY_RING = 'rgba(255, 255, 255, 0.25)';
const CLASSIC_DECOY_FILL = 'rgba(255, 255, 255, 0.06)';
const PROGRESS_DECAY_OUTSIDE = 950;
const PROGRESS_DECAY_ON_DECOY = 700;

let animationFrame = null;
let lastFrameTs = 0;
let roundHintTimeout = null;

const holdProgressPct = computed(() =>
  Math.min(100, (holdProgressMs.value / holdRequiredMs.value) * 100)
);

function randomBetween(min, max) {
  if (max <= min) return min;
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomVelocity(speed) {
  const angle = Math.random() * Math.PI * 2;
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  };
}

function resolveEntityColors({ isTarget, isUniformMode }) {
  if (isUniformMode) {
    return {
      ringColor: CLASSIC_DECOY_RING,
      fillColor: CLASSIC_DECOY_FILL
    };
  }

  return {
    ringColor: isTarget ? CLASSIC_TARGET_RING : CLASSIC_DECOY_RING,
    fillColor: isTarget ? CLASSIC_TARGET_FILL : CLASSIC_DECOY_FILL
  };
}

function getHorizontalMenuOverlap() {
  if (!gameArea.value) return { left: 0, right: 0 };

  const areaRect = gameArea.value.getBoundingClientRect();
  const leftMenu = document.querySelector('.left-sidebar');
  const rightMenu = document.querySelector('.right-sidebar');

  const overlapWith = (menuEl) => {
    if (!menuEl) return 0;
    const menuRect = menuEl.getBoundingClientRect();
    const overlap = Math.min(areaRect.right, menuRect.right) - Math.max(areaRect.left, menuRect.left);
    return Math.max(0, overlap);
  };

  return {
    left: overlapWith(leftMenu),
    right: overlapWith(rightMenu)
  };
}

function getPlayBounds(size) {
  const menuOverlap = getHorizontalMenuOverlap();
  const rawMinX = size / 2 + EDGE_PADDING + menuOverlap.left;
  const rawMaxX = gameCanvas.value.width - size / 2 - EDGE_PADDING - menuOverlap.right;
  const minX = Math.min(rawMinX, rawMaxX);
  const maxX = Math.max(rawMinX, rawMaxX);

  const rawMinY = Math.max(HUD_SAFE_TOP, size / 2 + EDGE_PADDING);
  const rawMaxY = gameCanvas.value.height - size / 2 - EDGE_PADDING;
  const minY = Math.min(rawMinY, rawMaxY);
  const maxY = Math.max(rawMinY, rawMaxY);

  return { minX, maxX, minY, maxY };
}

function resizeCanvas() {
  if (gameCanvas.value && gameArea.value) {
    const rect = gameArea.value.getBoundingClientRect();
    gameCanvas.value.width = rect.width;
    gameCanvas.value.height = rect.height;
  }
}

function triggerRoundHint(text) {
  roundHintText.value = String(text || '');
  roundHintVisible.value = false;
  roundHintToken.value += 1;

  if (roundHintTimeout) {
    clearTimeout(roundHintTimeout);
    roundHintTimeout = null;
  }

  requestAnimationFrame(() => {
    roundHintVisible.value = true;
  });

  roundHintTimeout = setTimeout(() => {
    roundHintVisible.value = false;
    roundHintTimeout = null;
  }, 1000);
}

function generateTargets() {
  if (!gameCanvas.value) return;

  const sourceSet = round.value <= 6 ? wordSets.value : letterSets.value;
  const challenge = sourceSet[Math.floor(Math.random() * sourceSet.length)];
  currentChallenge.value = challenge;
  triggerRoundHint(challenge.target);

  const decoyCount = Math.min(MAX_DECOYS, BASE_DECOYS + Math.floor((round.value - 1) / 2));
  const totalEntities = 1 + decoyCount;

  const entitySize = BASE_ENTITY_SIZE;
  const baseSpeed = 80;
  const currentSpeed = baseSpeed + (round.value - 1) * 18;
  const bounds = getPlayBounds(entitySize);
  const isUniformMode = round.value >= UNIFORM_COLORS_FROM_ROUND;

  const newTargets = [];
  for (let i = 0; i < totalEntities; i++) {
    const isTarget = i === 0;
    const text = isTarget
      ? challenge.target
      : challenge.decoys[Math.floor(Math.random() * challenge.decoys.length)];
    const velocity = randomVelocity(currentSpeed * randomBetween(0.92, 1.08));
    const { ringColor, fillColor } = resolveEntityColors({ isTarget, isUniformMode });

    newTargets.push({
      text,
      isTarget,
      size: entitySize,
      x: randomBetween(bounds.minX, bounds.maxX),
      y: randomBetween(bounds.minY, bounds.maxY),
      vx: velocity.vx,
      vy: velocity.vy,
      bounds,
      ringColor,
      fillColor
    });
  }

  targets.value = newTargets;
  holdProgressMs.value = 0;
}

function update(dt) {
  if (!isPlaying.value) return;

  let hoveredTarget = null;
  for (const t of targets.value) {
    const dist = Math.hypot(mouseX.value - t.x, mouseY.value - t.y);
    if (dist < t.size / 2) {
      hoveredTarget = t;
      break;
    }
  }

  const hasPenaltyShot = isFiring.value && (!hoveredTarget || !hoveredTarget.isTarget);
  const timePenalty = hasPenaltyShot ? 2 : 1;
  isPenaltyActive.value = timePenalty > 1;
  timeLeft.value -= dt * timePenalty;

  if (timeLeft.value <= 0) {
    endGame();
    return;
  }

  targets.value.forEach((t) => {
    t.x += t.vx * dt;
    t.y += t.vy * dt;

    if (t.x < t.bounds.minX || t.x > t.bounds.maxX) {
      t.vx *= -1;
      t.x = clamp(t.x, t.bounds.minX, t.bounds.maxX);
    }
    if (t.y < t.bounds.minY || t.y > t.bounds.maxY) {
      t.vy *= -1;
      t.y = clamp(t.y, t.bounds.minY, t.bounds.maxY);
    }
  });

  if (isFiring.value && hoveredTarget && hoveredTarget.isTarget) {
    holdProgressMs.value = Math.min(holdRequiredMs.value, holdProgressMs.value + dt * 1000);
    if (holdProgressMs.value >= holdRequiredMs.value) {
      holdProgressMs.value = holdRequiredMs.value;
      lockTarget();
      return;
    }
  } else if (isFiring.value && !hoveredTarget) {
    holdProgressMs.value = Math.max(0, holdProgressMs.value - (dt * PROGRESS_DECAY_OUTSIDE));
  } else if (isFiring.value && hoveredTarget && !hoveredTarget.isTarget) {
    holdProgressMs.value = Math.max(0, holdProgressMs.value - (dt * PROGRESS_DECAY_ON_DECOY));
  }
}

function lockTarget() {
  const pointsEarned = 100 + (round.value * 22) + (successfulLocks.value * 18);
  score.value += pointsEarned;
  successfulLocks.value += 1;
  timeLeft.value = Math.min(99, timeLeft.value + 3);
  round.value++;
  generateTargets();

  // Sabotatge: -2s al rival en multiplayer
  if (props.isMultiplayer) {
    multiplayerStore.sendGameAction({
      type: 'SABOTAGE',
      subtype: 'REDUCE_TIME',
      amount: 2
    });
  }
}

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

  if (isFiring.value) {
    ctx.beginPath();
    ctx.moveTo(gameCanvas.value.width / 2, gameCanvas.value.height);
    ctx.lineTo(mouseX.value, mouseY.value);
    ctx.strokeStyle = isPenaltyActive.value ? '#ff5252' : '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const drawEntity = (t) => {
    ctx.save();
    ctx.translate(t.x, t.y);

    ctx.beginPath();
    ctx.arc(0, 0, t.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = t.fillColor || 'rgba(10, 20, 40, 0.85)';
    ctx.fill();
    ctx.lineWidth = t.isTarget ? 3 : 2;
    ctx.strokeStyle = t.ringColor || (t.isTarget ? '#00e5ff' : 'rgba(255, 255, 255, 0.25)');
    ctx.stroke();

    const textLength = String(t.text || '').length;
    const fontScale = textLength <= 1 ? 0.36 : textLength <= 4 ? 0.30 : 0.25;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${t.size * fontScale}px 'Roboto Mono'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  };

  targets.value.filter((t) => !t.isTarget).forEach(drawEntity);
  const mainTarget = targets.value.find((t) => t.isTarget);
  if (mainTarget) drawEntity(mainTarget);

  ctx.beginPath();
  ctx.arc(mouseX.value, mouseY.value, 18, 0, Math.PI * 2);
  ctx.strokeStyle = isFiring.value ? '#00e5ff' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function gameLoop(ts) {
  if (!isPlaying.value) return;
  const dt = Math.min(0.1, (ts - lastFrameTs) / 1000);
  lastFrameTs = ts;
  update(dt);
  draw();
  animationFrame = requestAnimationFrame(gameLoop);
}

function handlePointerMove(e) {
  if (!gameArea.value) return;
  const rect = gameArea.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
}

function beginFiring() { if (isPlaying.value) isFiring.value = true; }
function stopFiring() { isFiring.value = false; }

function startGame() {
  showStartOverlay.value = false;
  showGameOverOverlay.value = false;
  score.value = 0;
  timeLeft.value = 60;
  round.value = 1;
  successfulLocks.value = 0;
  isFiring.value = false;
  isPenaltyActive.value = false;
  holdProgressMs.value = 0;
  isPlaying.value = true;
  resizeCanvas();
  mouseX.value = gameCanvas.value.width / 2;
  mouseY.value = gameCanvas.value.height * 0.75;
  generateTargets();
  lastFrameTs = performance.now();
  animationFrame = requestAnimationFrame(gameLoop);
}

function endGame(silent = false) {
  if (props.isMultiplayer && !silent) {
    isPlaying.value = false;
    isFiring.value = false;
    cancelAnimationFrame(animationFrame);
    multiplayerStore.submitRoundResult();
    return;
  }

  isPlaying.value = false;
  isFiring.value = false;
  roundHintVisible.value = false;
  showGameOverOverlay.value = true;
  cancelAnimationFrame(animationFrame);
}

function returnToMenu() {
  emit('game-over', score.value);
}

onMounted(() => {
  ctx = gameCanvas.value.getContext('2d');
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  if (props.isMultiplayer) {
    startGame();
  }
});

// Listener para eventos multijugador
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;

  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    isPlaying.value = false;
    isFiring.value = false;
    cancelAnimationFrame(animationFrame);
    returnToMenu();
  }

  // Rebre sabotatge del rival: restar temps al propi rellotge
  if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
    timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2));
    if (timeLeft.value <= 0 && isPlaying.value) endGame();
  }
});

// Notificar puntuación al servidor en modo multijugador
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
  cancelAnimationFrame(animationFrame);
  if (roundHintTimeout) {
    clearTimeout(roundHintTimeout);
    roundHintTimeout = null;
  }
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

canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.hide-cursor { cursor: none; }

.hud-pill {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 50px;
  padding: 10px 30px;
  backdrop-filter: blur(10px);
}

.lock-meter-wrapper {
  position: absolute;
  top: 95px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  z-index: 10;
  text-align: center;
}

.round-target-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 11;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.94);
  font-size: clamp(80px, 18vw, 180px);
  font-weight: 900;
  letter-spacing: 0.06em;
  text-shadow: 0 0 24px rgba(0, 229, 255, 0.45);
  animation: hint-fade-out 1s ease-out forwards;
}

@keyframes hint-fade-out {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }
</style>
