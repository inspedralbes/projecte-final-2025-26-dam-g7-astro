<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container">
    
    <!-- Capçalera -->
    <v-card width="100%" max-width="800" class="mb-4 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">{{ $t('spelledRosco.title') }}</h2>
          <div class="text-caption text-grey-lighten-2">
            <span>{{ $t('spelledRosco.score', { score: score }) }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">{{ $t('spelledRosco.time', { time: timeLeft }) }}</span>
          </div>
        </div>
        <div class="d-flex align-center gap-4">
          <v-chip v-for="(l, i) in roscoLetters" :key="i" :color="getChipColor(l)" size="small" label class="mx-1 font-weight-bold">
            {{ l.char }}
          </v-chip>
          <v-btn icon="mdi-close" variant="text" color="grey" @click="emitExit"></v-btn>
        </div>
      </div>
    </v-card>

    <!-- Joc Principal -->
    <v-row v-if="!gameFinished" class="w-100 d-flex justify-center align-center" no-gutters>
      
      <!-- Estrella -->
      <v-col cols="12" md="6" class="d-flex justify-center align-center position-relative star-col mb-8 mb-md-0">
        <div class="star-wrapper">
          <svg class="star-svg" viewBox="0 0 400 400">
            <!-- Polígons d'il·luminació interior (Puntes) -->
            <polygon v-for="(points, i) in tipPolygons" :key="'tip-'+i"
              :points="points"
              class="star-tip-fill" :class="{ 'tip-glowing': isTipGlowing(i) }"
            />

            <!-- Línies del contorn -->
            <line v-for="(seg, i) in starSegments" :key="'line-'+i"
              :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2"
              class="star-line" :class="{ 'line-glowing': isSegmentGlowing(i) }"
            />

            <g v-if="rocketAnimating" class="rocket-trail-group">
              <circle :cx="rocketPos.x" :cy="rocketPos.y" r="6" fill="url(#rocketGlow)" />
              <circle v-for="(p, i) in trailParticles" :key="'trail-'+i"
                :cx="p.x" :cy="p.y" :r="p.r"
                :fill="p.color" :opacity="p.opacity"
              />
            </g>
            <defs>
              <radialGradient id="rocketGlow">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="1" />
                <stop offset="50%" stop-color="#00b8d4" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#0097a7" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#00e5ff" stop-opacity="0" />
              </radialGradient>
            </defs>
          </svg>

          <div 
            v-for="(letter, index) in roscoLetters" 
            :key="index"
            class="star-node elevation-8"
            :class="getBubbleClass(letter, index)"
            :style="getStarNodeStyle(index)"
          >
            <span class="node-letter">{{ letter.char }}</span>
            <div v-if="index === currentIndex && !gameFinished" class="node-pulse"></div>
          </div>

          <div class="star-center">
            <div class="text-h2 font-weight-black center-letter">{{ currentLetter.char }}</div>
          </div>
        </div>
      </v-col>

      <!-- Panell de Pregunta i Resposta -->
      <v-col cols="12" md="6" class="px-md-8">
        <v-card class="pa-6 bg-grey-darken-4 elevation-5" rounded="xl" border>
          <div class="mb-4">
            <v-chip color="cyan" label class="mb-2 font-weight-bold">{{ $t('spelledRosco.definition') }}</v-chip>
            <p class="text-h6 text-white">{{ currentLetter.question }}</p>
          </div>

          <v-divider class="mb-6 border-opacity-25"></v-divider>

          <div class="text-center mb-4">
            <p class="text-overline text-grey-lighten-1 mb-2">{{ $t('spelledRosco.writeWord') }}</p>
            
            <v-text-field
              v-model="rawInput"
              variant="outlined"
              color="cyan-accent-3"
              bg-color="#263238"
              :placeholder="$t('spelledRosco.placeholder')"
              class="mb-4 spelling-input"
              density="comfortable"
              hide-details
              autofocus
              @keydown.enter="checkAnswer"
            ></v-text-field>

            <div class="d-flex justify-center gap-4 mb-4">
               <v-btn
                color="orange-accent-3"
                size="x-large"
                variant="tonal"
                class="px-4"
                @click="pasapalabra"
              >
                {{ $t('spelledRosco.pasapalabra') }}
              </v-btn>
            </div>

              <v-btn
                color="success"
                size="large"
                block
                rounded="lg"
                class="font-weight-bold text-white elevation-4"
                @click="checkAnswer"
                :disabled="rawInput.length === 0"
              >
                {{ $t('spelledRosco.confirm') }}
              </v-btn>
              
              <v-btn
                variant="text"
                color="red-accent-2"
                class="mt-2"
                @click="clearInput"
                size="small"
              >
                {{ $t('spelledRosco.clearAll') }}
              </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pantalla Final (només en single player) -->
    <v-card v-else-if="!isMultiplayer" width="100%" max-width="500" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-school" color="cyan-accent-2" size="80" class="mb-4"></v-icon>
      <h2 class="text-h4 text-white mb-2">{{ $t('spelledRosco.completedTitle') }}</h2>
      <div class="d-flex justify-space-around my-6">
        <div class="text-center">
            <div class="text-h3 text-success font-weight-bold">{{ correctCount }}</div>
            <div class="text-caption">{{ $t('spelledRosco.correctHits') }}</div>
        </div>
        <div class="text-center">
            <div class="text-h3 text-error font-weight-bold">{{ incorrectCount }}</div>
            <div class="text-caption">{{ $t('spelledRosco.incorrectHits') }}</div>
        </div>
      </div>
      <p class="text-h5 text-white mb-2">{{ $t('spelledRosco.finalScore', { score: score }) }}</p>
      <p class="text-subtitle-1 text-grey-lighten-1 mb-1">{{ $t('spelledRosco.timeRemaining', { time: timeLeft }) }}</p>
      <p class="text-h6 text-cyan-accent-2 mb-6">{{ $t('spelledRosco.reward', { reward: finalReward }) }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="large" rounded="pill" class="text-black font-weight-bold">
        {{ $t('spelledRosco.getReward') }}
      </v-btn>
    </v-card>

    <v-snackbar v-model="showFeedback" :color="feedbackColor" timeout="2000" location="top">
       {{ feedbackMessage }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
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

const emit = defineEmits(['game-over']);

// Computada reactiva per dependre de l'idioma
const allLettersData = computed(() => {
    return roscoData[locale.value] || roscoData['es'];
});

// --- STAR GEOMETRY (Outline Star: 5 tips, 10 points) ---
const STAR_CENTER = 200;
const STAR_RADIUS = 150;
const INNER_RADIUS = 60; 

const starPoints = Array.from({ length: 10 }, (_, i) => {
  const angle = (i * 36 - 90) * (Math.PI / 180);
  const r = i % 2 === 0 ? STAR_RADIUS : INNER_RADIUS;
  return {
    x: STAR_CENTER + Math.cos(angle) * r,
    y: STAR_CENTER + Math.sin(angle) * r,
  };
});

const letterPositions = [0, 2, 4, 6, 8];

const starSegments = computed(() => {
  return starPoints.map((point, i) => {
    const nextIdx = (i + 1) % 10;
    return {
      x1: point.x, y1: point.y,
      x2: starPoints[nextIdx].x, y2: starPoints[nextIdx].y,
    };
  });
});

const tipPolygons = computed(() => {
  // Cada punta (i=0,2,4,6,8) usa el seu punt, l'anterior i el següent (que són INTERIORS)
  return letterPositions.map(pos => {
    const pPrev = starPoints[(pos - 1 + 10) % 10];
    const pCurr = starPoints[pos];
    const pNext = starPoints[(pos + 1) % 10];
    const pCenter = { x: STAR_CENTER, y: STAR_CENTER };
    // Formem un rombe o triangle des del centre per omplir la punta
    return `${pCenter.x},${pCenter.y} ${pPrev.x},${pPrev.y} ${pCurr.x},${pCurr.y} ${pNext.x},${pNext.y}`;
  });
});

// Estat del joc
const roscoLetters = ref([]); 
const currentIndex = ref(0);
const rawInput = ref('');
const gameFinished = ref(false);
const score = ref(0);
const showFeedback = ref(false);
const feedbackMessage = ref('');
const feedbackColor = ref('info');
const isChecking = ref(false);
const totalTime = 90;
const timeLeft = ref(totalTime);
const isWaitingForOthers = ref(false);
let timerInterval = null;

// Rocket animation state
const rocketAnimating = ref(false);
const rocketPos = reactive({ x: 0, y: 0 });
const trailParticles = ref([]);
const visitedSegments = ref(new Set());

// Computed
const currentLetter = computed(() => {
    if (roscoLetters.value.length === 0) return { char: '?', question: '' };
    return roscoLetters.value[currentIndex.value];
});

const correctCount = computed(() => roscoLetters.value.filter(l => l.status === 'correct').length);
const incorrectCount = computed(() => roscoLetters.value.filter(l => l.status === 'incorrect').length);
const finalReward = computed(() => score.value + timeLeft.value);

// Helper: normalize string (remove accents, uppercase, trim spaces)
const normalize = (str) => {
    return str.toUpperCase().trim().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Initialization - pick 5 random
onMounted(() => {
    const shuffled = [...allLettersData].sort(() => Math.random() - 0.5);
    roscoLetters.value = shuffled.slice(0, 5).map(l => ({ ...l, status: 'pending' }));
    startTimer();
});

// Listener para eventos multijugador
watch(() => multiplayerStore.lastMessage, (msg) => {
    if (!msg) return;

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
        gameFinished.value = true;
        emitExit();
    }

    // Rebre sabotatge del rival: restar temps
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 15));
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

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

const clearInput = () => { rawInput.value = ''; };

// Rocket Animation - Following the outline
const animateRocket = (fromIdx, toIdx) => {
  return new Promise((resolve) => {
    // fromIdx i toIdx són índexs de lletres (0..4)
    // Els convertim a índexs de starPoints (multiplicant per 2)
    const startPointIdx = letterPositions[fromIdx];
    const endPointIdx = letterPositions[toIdx];
    
    // Determinem el camí més curt pel contorn
    const path = [];
    let curr = startPointIdx;
    while(curr !== endPointIdx) {
      curr = (curr + 1) % 10;
      path.push(starPoints[curr]);
    }
    
    rocketAnimating.value = true;
    trailParticles.value = [];
    
    const durationPerStep = 200;
    const animateStep = (stepIdx) => {
      if (stepIdx >= path.length) {
        setTimeout(() => {
          rocketAnimating.value = false;
          trailParticles.value = [];
          resolve();
        }, 50);
        return;
      }
      
      const from = stepIdx === 0 ? starPoints[startPointIdx] : path[stepIdx - 1];
      const to = path[stepIdx];
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationPerStep, 1);
        const eased = progress; // Linear per a camins llargs
        
        rocketPos.x = from.x + (to.x - from.x) * eased;
        rocketPos.y = from.y + (to.y - from.y) * eased;
        
        if (progress < 1) {
          trailParticles.value.push({
            x: rocketPos.x + (Math.random() - 0.5) * 8,
            y: rocketPos.y + (Math.random() - 0.5) * 8,
            r: Math.random() * 3 + 1,
            color: '#00e5ff',
            opacity: 1,
          });
          if (trailParticles.value.length > 20) trailParticles.value.shift();
          requestAnimationFrame(animate);
        } else {
          animateStep(stepIdx + 1);
        }
      };
      requestAnimationFrame(animate);
    };
    
    animateStep(0);
  });
};

const isTipGlowing = (tipIdx) => {
  return roscoLetters.value[tipIdx]?.status === 'correct';
};

const isSegmentGlowing = (segIdx) => {
  // Cada lletra i (0..4) està associada als segments (i*2-1) i (i*2)
  return roscoLetters.value.some((l, i) => {
    if (l.status !== 'correct') return false;
    const seg1 = i * 2;
    const seg0 = (i * 2 - 1 + 10) % 10;
    return segIdx === seg1 || segIdx === seg0;
  });
};

const isSegmentVisited = (segIdx) => false; // Ja no usem visitedSegments per a les línies

// Game Logic
const checkAnswer = async () => {
    if (rawInput.value.trim() === '' || isChecking.value) return;
    
    isChecking.value = true;
    const userAnswer = normalize(rawInput.value);
    const correctAnswer = normalize(currentLetter.value.answer);

    if (userAnswer === correctAnswer) {
        roscoLetters.value[currentIndex.value].status = 'correct';
        score.value += 100;
        feedbackMessage.value = t('spelledRosco.msgCorrect');
        feedbackColor.value = 'success';
        // Sabotatge multijugador: +10s per a tu, -15s per al rival
        if (props.isMultiplayer) {
            timeLeft.value = Math.min(timeLeft.value + 10, 999);
            multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: 15 });
        }
    } else {
        roscoLetters.value[currentIndex.value].status = 'incorrect';
        feedbackMessage.value = t('spelledRosco.msgIncorrect', { answer: currentLetter.value.answer });
        feedbackColor.value = 'error';
    }

    showFeedback.value = true;
    
    setTimeout(async () => {
        showFeedback.value = false;
        rawInput.value = '';
        await advanceTurn();
        isChecking.value = false;
    }, 1200);
};

const pasapalabra = () => {
    if (isChecking.value) return;
    rawInput.value = '';
    advanceTurn();
};

const advanceTurn = async () => {
    const prevIndex = currentIndex.value;
    let nextIdx = -1;
    
    for (let i = currentIndex.value + 1; i < roscoLetters.value.length; i++) {
        if (roscoLetters.value[i].status === 'pending') { nextIdx = i; break; }
    }

    if (nextIdx === -1) {
        for (let i = 0; i < currentIndex.value; i++) {
            if (roscoLetters.value[i].status === 'pending') { nextIdx = i; break; }
        }
    }

    if (nextIdx !== -1) {
        visitedSegments.value.add(prevIndex);
        await animateRocket(prevIndex, nextIdx);
        currentIndex.value = nextIdx;
    } else {
        finishGame();
    }
};

const finishGame = (silent = false) => {
    if (gameFinished.value) return;
    
    if (props.isMultiplayer && !silent) {
        if (timerInterval) clearInterval(timerInterval);
        multiplayerStore.submitRoundResult();
        return;
    }

    gameFinished.value = true;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

const startTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (gameFinished.value) return;
        timeLeft.value = Math.max(0, timeLeft.value - 1);
        if (timeLeft.value === 0) {
            finishGame();
        }
    }, 1000);
};

const emitExit = () => { emit('game-over', finalReward.value); };

// Visual Helpers
const getBubbleClass = (letter, index) => {
    if (index === currentIndex.value && !gameFinished.value) return 'node-current';
    if (letter.status === 'correct') return 'node-correct';
    if (letter.status === 'incorrect') return 'node-incorrect';
    return 'node-pending';
};

const getStarNodeStyle = (index) => {
    const pointIdx = letterPositions[index];
    const point = starPoints[pointIdx];
    return {
        left: `${(point.x / 400) * 100}%`,
        top: `${(point.y / 400) * 100}%`,
    };
};

const getChipColor = (letter) => {
    if (letter.status === 'correct') return 'success';
    if (letter.status === 'incorrect') return 'error';
    return 'grey';
};
</script>

<style scoped>
.game-container {
    background-color: #0b0f19;
}

.star-col {
    min-height: 420px;
}

.star-wrapper {
    position: relative;
    width: 400px;
    height: 400px;
}

.star-svg {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 1;
}

.star-line {
    stroke: rgba(0, 229, 255, 0.4);
    stroke-width: 2.5;
    stroke-linecap: round;
    transition: all 0.5s ease;
}

.star-line.line-glowing {
    stroke: #00e5ff;
    stroke-width: 6;
    filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.9));
    opacity: 1;
}

.star-tip-fill {
    fill: #00e5ff;
    opacity: 0;
    transition: opacity 0.8s ease;
    pointer-events: none;
}

.star-tip-fill.tip-glowing {
    opacity: 0.6;
    filter: blur(2px) drop-shadow(0 0 15px rgba(0, 229, 255, 0.8));
}

@keyframes line-glow {
    0% { filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.4)); }
    100% { filter: drop-shadow(0 0 10px rgba(255, 213, 79, 0.8)); }
}

.star-node {
    position: absolute;
    width: 60px; height: 60px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    transform: translate(-50%, -50%);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 3px solid rgba(255, 255, 255, 0.2);
}

.node-letter {
    font-size: 1.5rem;
    font-weight: 900;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    z-index: 2;
}

.node-pending {
    background: linear-gradient(145deg, #1e3a5f, #0d1b30);
    box-shadow: 0 4px 15px rgba(30, 58, 95, 0.5);
    border-color: rgba(100, 180, 255, 0.3);
}

.node-current {
    background: linear-gradient(145deg, #00e5ff, #0097a7);
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.6), 0 0 60px rgba(0, 229, 255, 0.2);
    border-color: #80DEEA;
    animation: node-float 2s ease-in-out infinite;
    width: 70px; height: 70px;
}

.node-current .node-letter { color: #0b0f19; }

.node-correct {
    background: linear-gradient(145deg, #43a047, #1b5e20);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.6);
    border-color: #69f0ae;
}

.node-incorrect {
    background: linear-gradient(145deg, #e53935, #b71c1c);
    box-shadow: 0 0 20px rgba(244, 67, 54, 0.6);
    border-color: #ff8a80;
}

.node-pulse {
    position: absolute;
    top: -8px; left: -8px; right: -8px; bottom: -8px;
    border-radius: 50%;
    border: 2px solid #00e5ff;
    animation: pulse-ring 1.5s ease-out infinite;
    z-index: 0;
}

@keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.5); opacity: 0; }
}

@keyframes node-float {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, calc(-50% - 6px)) scale(1.05); }
}

.star-center {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 100px; height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, rgba(5, 5, 20, 1) 90%);
    border: 3px solid rgba(0, 229, 255, 0.5);
    border-radius: 50%;
    box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
    z-index: 5;
}

.center-letter {
    color: #00e5ff;
    text-shadow: 0 0 15px rgba(0, 229, 255, 0.6);
    line-height: 1;
    font-size: 2rem !important;
}

.rocket-trail-group circle {
    transition: all 0.05s linear;
}

.spelling-input :deep(.v-field__input) {
    color: #00e5ff !important;
    font-size: 1.3rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 3px;
}
</style>
