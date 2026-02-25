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
    <div class="hud d-flex justify-center align-center pa-4 w-100 position-absolute" style="top: 0; z-index: 12;">
      <div class="hud-pill d-flex align-center ga-8">
        <div class="text-h5 font-weight-bold text-amber-accent-3">Punts: {{ score }}</div>
        <div class="text-h6 text-cyan-accent-2">Objectiu: {{ currentChallenge?.target || '-' }}</div>
        <div class="text-h5 font-weight-bold" :class="timeLeft <= 10 ? 'text-red-accent-2' : 'text-white'">
          Temps: {{ timeLeft }}s
        </div>
      </div>
    </div>

    <div class="lock-meter-wrapper">
      <div class="text-caption text-grey-lighten-1 mb-1">Bloqueig de precisió</div>
      <v-progress-linear
        :model-value="holdProgressPct"
        color="lime-accent-3"
        height="12"
        rounded
        striped
      ></v-progress-linear>
    </div>

    <div class="play-field" v-if="isPlaying">
      <div
        v-for="entity in targets"
        :key="entity.id"
        class="target-entity"
        :class="{ 'target-correct': entity.isTarget, 'target-hovered': hoveredTargetId === entity.id }"
        :style="getEntityStyle(entity)"
      >
        <div class="target-glow"></div>
        <div class="target-text">{{ entity.text }}</div>
      </div>

      <div
        class="crosshair"
        :class="{ 'crosshair-firing': isFiring }"
        :style="{ left: `${mouseX}px`, top: `${mouseY}px` }"
      ></div>

      <div
        v-if="isFiring"
        class="laser-beam"
        :style="laserStyle"
      ></div>
    </div>

    <v-overlay v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="460">
        <h2 class="text-h4 font-weight-bold text-white mb-4">Lexical Shooter</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-3">
          Joc de precisió: identifica la lletra o paraula objectiu i mantén el làser sobre l'objectiu correcte.
        </p>
        <p class="text-body-2 text-cyan-accent-2 mb-6">
          No val clicar: cal mantenir apuntat amb precisió mentre prems el ratolí.
        </p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black" @click="startGame">
          INICIAR MISSIÓ
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay v-model="showGameOverOverlay" class="align-center justify-center" persistent z-index="120">
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="460">
        <v-icon icon="mdi-crosshairs-gps" color="cyan-accent-3" size="80" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-white mb-2">Missió completada</h2>
        <p class="text-h6 text-amber-accent-2 mb-1">Punts: {{ score }}</p>
        <p class="text-subtitle-1 text-grey-lighten-1 mb-1">Temps restant: {{ timeLeft }}s</p>
        <p class="text-h6 text-cyan-accent-2 mb-7">Recompensa: {{ finalReward }}</p>
        <v-btn color="cyan-accent-3" size="x-large" rounded="xl" class="font-weight-black text-black px-8" @click="returnToMenu">
          TORNAR AL MENÚ
        </v-btn>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';

const emit = defineEmits(['game-over']);

const confusionSets = [
  { target: 'B', decoys: ['D', 'P', 'Q', '8'] },
  { target: 'M', decoys: ['N', 'W', 'H', 'U'] },
  { target: 'FORMA', decoys: ['FIRMA', 'NORMA', 'FARMA', 'FORAT'] },
  { target: 'CASA', decoys: ['COSA', 'CAPA', 'CARA', 'CAIXA'] },
  { target: 'LLETRA', decoys: ['LLETRA?', 'LETRA', 'LINTER', 'LENTA'] },
  { target: 'ORBITA', decoys: ['ORBETA', 'ORBE', 'ORBITS', 'ORDITA'] }
];

const showStartOverlay = ref(true);
const showGameOverOverlay = ref(false);
const isPlaying = ref(false);

const score = ref(0);
const timeLeft = ref(75);
const round = ref(1);

const currentChallenge = ref(null);
const targets = ref([]);

const mouseX = ref(320);
const mouseY = ref(360);
const isFiring = ref(false);
const hoveredTargetId = ref(null);
const holdProgressMs = ref(0);
const holdRequiredMs = ref(850);
let wrongPenaltyCooldown = 0;

const gameArea = ref(null);
let timerInterval = null;
let animationFrame = null;
let lastFrameTs = 0;
let nextEntityId = 1;

const holdProgressPct = computed(() => {
  if (!holdRequiredMs.value) return 0;
  return Math.min(100, (holdProgressMs.value / holdRequiredMs.value) * 100);
});

const finalReward = computed(() => score.value + timeLeft.value);

const laserStyle = computed(() => {
  if (!isFiring.value) return {};
  const startX = (gameArea.value?.clientWidth || 0) / 2;
  const startY = (gameArea.value?.clientHeight || 0) - 12;
  const dx = mouseX.value - startX;
  const dy = mouseY.value - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${length}px`,
    transform: `rotate(${angle}deg)`
  };
});

function getBounds() {
  const width = gameArea.value?.clientWidth || 1280;
  const height = gameArea.value?.clientHeight || 720;

  return {
    minX: 40,
    maxX: width - 40,
    minY: 145,
    maxY: height - 55
  };
}

function pickChallenge() {
  const index = Math.floor(Math.random() * confusionSets.length);
  return confusionSets[index];
}

function computeEntitySize(text) {
  const length = String(text || '').length;
  if (length <= 2) return 84;
  if (length <= 4) return 104;
  return 122;
}

function randomVelocity(baseSpeed) {
  const angle = Math.random() * Math.PI * 2;
  return {
    vx: Math.cos(angle) * baseSpeed,
    vy: Math.sin(angle) * baseSpeed
  };
}

function generateTargets() {
  const challenge = pickChallenge();
  currentChallenge.value = challenge;

  const count = Math.min(10, 6 + Math.floor(round.value / 2));
  const targetIndex = Math.floor(Math.random() * count);
  const bounds = getBounds();

  const entities = [];

  for (let i = 0; i < count; i++) {
    const isTarget = i === targetIndex;
    const text = isTarget
      ? challenge.target
      : challenge.decoys[Math.floor(Math.random() * challenge.decoys.length)];

    const size = computeEntitySize(text);
    const speed = Math.min(180, 65 + (round.value * 7) + (Math.random() * 30));
    const velocity = randomVelocity(speed);

    let x = bounds.minX + Math.random() * Math.max(1, (bounds.maxX - bounds.minX));
    let y = bounds.minY + Math.random() * Math.max(1, (bounds.maxY - bounds.minY));

    for (let attempt = 0; attempt < 40; attempt++) {
      const overlaps = entities.some((entity) => {
        const dx = x - entity.x;
        const dy = y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < ((size + entity.size) * 0.55);
      });

      if (!overlaps) break;

      x = bounds.minX + Math.random() * Math.max(1, (bounds.maxX - bounds.minX));
      y = bounds.minY + Math.random() * Math.max(1, (bounds.maxY - bounds.minY));
    }

    entities.push({
      id: nextEntityId++,
      text,
      isTarget,
      x,
      y,
      size,
      vx: velocity.vx,
      vy: velocity.vy
    });
  }

  targets.value = entities;
  hoveredTargetId.value = null;
  holdProgressMs.value = 0;
  holdRequiredMs.value = Math.max(620, 920 - Math.floor(round.value * 12));
  wrongPenaltyCooldown = 0;
}

function distanceToEntity(entity) {
  const dx = mouseX.value - entity.x;
  const dy = mouseY.value - entity.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateHoveredTarget() {
  let nearest = null;
  let nearestDist = Number.POSITIVE_INFINITY;

  for (const entity of targets.value) {
    const dist = distanceToEntity(entity);
    if (dist <= entity.size * 0.5 && dist < nearestDist) {
      nearest = entity;
      nearestDist = dist;
    }
  }

  hoveredTargetId.value = nearest ? nearest.id : null;
  return nearest;
}

function applyWrongPenalty() {
  score.value = Math.max(0, score.value - 25);
  timeLeft.value = Math.max(0, timeLeft.value - 2);
  holdProgressMs.value = 0;

  if (timeLeft.value === 0) {
    endGame();
  }
}

function lockTarget() {
  score.value += 60 + (round.value * 8);
  timeLeft.value = Math.min(99, timeLeft.value + 1);
  round.value += 1;
  generateTargets();
}

function processAim(deltaMs) {
  const hovered = updateHoveredTarget();

  if (!isFiring.value || !hovered) {
    holdProgressMs.value = Math.max(0, holdProgressMs.value - (deltaMs * 1.5));
    return;
  }

  if (!hovered.isTarget) {
    holdProgressMs.value = 0;
    wrongPenaltyCooldown -= deltaMs;
    if (wrongPenaltyCooldown <= 0) {
      applyWrongPenalty();
      wrongPenaltyCooldown = 320;
    }
    return;
  }

  const preciseRadius = hovered.size * 0.3;
  const dist = distanceToEntity(hovered);

  if (dist <= preciseRadius) {
    holdProgressMs.value += deltaMs;
  } else {
    holdProgressMs.value = Math.max(0, holdProgressMs.value - (deltaMs * 2));
  }

  if (holdProgressMs.value >= holdRequiredMs.value) {
    lockTarget();
  }
}

function moveTargets(deltaSeconds) {
  const bounds = getBounds();

  for (const entity of targets.value) {
    entity.x += entity.vx * deltaSeconds;
    entity.y += entity.vy * deltaSeconds;

    const half = entity.size * 0.5;

    if (entity.x - half < bounds.minX) {
      entity.x = bounds.minX + half;
      entity.vx = Math.abs(entity.vx);
    } else if (entity.x + half > bounds.maxX) {
      entity.x = bounds.maxX - half;
      entity.vx = -Math.abs(entity.vx);
    }

    if (entity.y - half < bounds.minY) {
      entity.y = bounds.minY + half;
      entity.vy = Math.abs(entity.vy);
    } else if (entity.y + half > bounds.maxY) {
      entity.y = bounds.maxY - half;
      entity.vy = -Math.abs(entity.vy);
    }
  }
}

function animationLoop(ts) {
  if (!isPlaying.value) return;

  if (!lastFrameTs) {
    lastFrameTs = ts;
  }

  const deltaMs = Math.min(45, ts - lastFrameTs);
  const deltaSeconds = deltaMs / 1000;
  lastFrameTs = ts;

  moveTargets(deltaSeconds);
  processAim(deltaMs);

  animationFrame = requestAnimationFrame(animationLoop);
}

function handlePointerMove(event) {
  if (!gameArea.value) return;
  const rect = gameArea.value.getBoundingClientRect();
  mouseX.value = event.clientX - rect.left;
  mouseY.value = event.clientY - rect.top;
}

function beginFiring() {
  if (!isPlaying.value) return;
  isFiring.value = true;
}

function stopFiring() {
  isFiring.value = false;
  holdProgressMs.value = Math.max(0, holdProgressMs.value - 120);
}

function startGame() {
  showStartOverlay.value = false;
  showGameOverOverlay.value = false;
  isPlaying.value = true;
  isFiring.value = false;

  score.value = 0;
  timeLeft.value = 75;
  round.value = 1;
  holdProgressMs.value = 0;
  holdRequiredMs.value = 850;

  generateTargets();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPlaying.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value === 0) {
      endGame();
    }
  }, 1000);

  if (animationFrame) cancelAnimationFrame(animationFrame);
  lastFrameTs = 0;
  animationFrame = requestAnimationFrame(animationLoop);
}

function endGame() {
  if (!isPlaying.value) return;

  isPlaying.value = false;
  isFiring.value = false;
  holdProgressMs.value = 0;
  hoveredTargetId.value = null;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  showGameOverOverlay.value = true;
}

function returnToMenu() {
  emit('game-over', finalReward.value);
}

function getEntityStyle(entity) {
  const isHovered = hoveredTargetId.value === entity.id;
  const scale = isHovered ? 1.06 : 1;

  return {
    left: `${entity.x}px`,
    top: `${entity.y}px`,
    width: `${entity.size}px`,
    height: `${entity.size}px`,
    transform: `translate(-50%, -50%) scale(${scale})`
  };
}

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 640px;
  background:
    radial-gradient(circle at 20% 10%, rgba(0, 229, 255, 0.12), transparent 35%),
    radial-gradient(circle at 80% 80%, rgba(41, 121, 255, 0.08), transparent 40%),
    linear-gradient(180deg, #060b17 0%, #0f172a 100%);
  overflow: hidden;
  user-select: none;
}

.hide-cursor {
  cursor: none;
}

.hud-pill {
  background: rgba(15, 23, 42, 0.93);
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 999px;
  padding: 10px 22px;
  backdrop-filter: blur(4px);
}

.lock-meter-wrapper {
  position: absolute;
  top: 82px;
  left: 50%;
  transform: translateX(-50%);
  width: min(360px, calc(100% - 40px));
  z-index: 11;
}

.play-field {
  position: absolute;
  inset: 0;
}

.target-entity {
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(145deg, rgba(20, 32, 58, 0.92), rgba(7, 12, 26, 0.96));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms linear;
}

.target-correct {
  border-color: rgba(0, 229, 255, 0.55);
  box-shadow: 0 0 18px rgba(0, 229, 255, 0.14);
}

.target-hovered {
  border-color: rgba(255, 213, 79, 0.85);
  box-shadow: 0 0 22px rgba(255, 213, 79, 0.22);
}

.target-glow {
  position: absolute;
  inset: 8px;
  border-radius: 999px;
  background: radial-gradient(circle at 40% 35%, rgba(255, 255, 255, 0.06), transparent 70%);
}

.target-text {
  position: relative;
  z-index: 1;
  color: #f7fbff;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: clamp(0.85rem, 1.7vw, 1.1rem);
  letter-spacing: 0.04em;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
  pointer-events: none;
}

.crosshair {
  position: absolute;
  width: 34px;
  height: 34px;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(148, 163, 184, 0.75);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(148, 163, 184, 0.25);
  z-index: 14;
  pointer-events: none;
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(148, 163, 184, 0.8);
  transform: translate(-50%, -50%);
}

.crosshair::before {
  width: 18px;
  height: 1px;
}

.crosshair::after {
  width: 1px;
  height: 18px;
}

.crosshair-firing {
  border-color: rgba(0, 229, 255, 0.95);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.45);
}

.crosshair-firing::before,
.crosshair-firing::after {
  background: rgba(0, 229, 255, 1);
}

.laser-beam {
  position: absolute;
  height: 2px;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.8), rgba(0, 229, 255, 0.1));
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
  z-index: 13;
  pointer-events: none;
}

.bg-slate-900 {
  background-color: #0f172a;
}

.border-cyan {
  border: 1px solid #00e5ff;
}
</style>
