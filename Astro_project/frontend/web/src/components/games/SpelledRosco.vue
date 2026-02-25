<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container">
    
    <!-- Capçalera -->
    <v-card width="100%" max-width="800" class="mb-4 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">🚀 Rosco Estelar</h2>
          <div class="text-caption text-grey-lighten-2">
            <span>Puntuació: {{ score }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">Temps: {{ timeLeft }}s</span>
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
            <line v-for="(seg, i) in starSegments" :key="'line-'+i"
              :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2"
              class="star-line" :class="{ 'line-visited': isSegmentVisited(i) }"
            />
            <g v-if="rocketAnimating" class="rocket-trail-group">
              <circle :cx="rocketPos.x" :cy="rocketPos.y" r="8" fill="url(#rocketGlow)" />
              <circle v-for="(p, i) in trailParticles" :key="'trail-'+i"
                :cx="p.x" :cy="p.y" :r="p.r"
                :fill="p.color" :opacity="p.opacity"
              />
            </g>
            <defs>
              <radialGradient id="rocketGlow">
                <stop offset="0%" stop-color="#FFD54F" stop-opacity="1" />
                <stop offset="50%" stop-color="#FF6D00" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#FF3D00" stop-opacity="0" />
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
            <v-chip color="cyan" label class="mb-2 font-weight-bold">Definició</v-chip>
            <p class="text-h6 text-white">{{ currentLetter.question }}</p>
          </div>

          <v-divider class="mb-6 border-opacity-25"></v-divider>

          <div class="text-center mb-4">
            <p class="text-overline text-grey-lighten-1 mb-2">ESCRIU LA PARAULA</p>
            
            <v-text-field
              v-model="rawInput"
              variant="outlined"
              color="cyan-accent-3"
              bg-color="#263238"
              placeholder="Escriu aquí..."
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
                Pasapalabra
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
                Confirmar
              </v-btn>
              
              <v-btn
                variant="text"
                color="red-accent-2"
                class="mt-2"
                @click="clearInput"
                size="small"
              >
                Esborrar tot
              </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pantalla Final -->
    <v-card v-else width="100%" max-width="500" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
      <v-icon icon="mdi-school" color="cyan-accent-2" size="80" class="mb-4"></v-icon>
      <h2 class="text-h4 text-white mb-2">Rosco Completat!</h2>
      <div class="d-flex justify-space-around my-6">
        <div class="text-center">
            <div class="text-h3 text-success font-weight-bold">{{ correctCount }}</div>
            <div class="text-caption">Encerts</div>
        </div>
        <div class="text-center">
            <div class="text-h3 text-error font-weight-bold">{{ incorrectCount }}</div>
            <div class="text-caption">Errors</div>
        </div>
      </div>
      <p class="text-h5 text-white mb-2">Puntuació Final: {{ score }}</p>
      <p class="text-subtitle-1 text-grey-lighten-1 mb-1">Temps Restant: {{ timeLeft }}s</p>
      <p class="text-h6 text-cyan-accent-2 mb-6">Recompensa: {{ finalReward }}</p>
      
      <v-btn @click="emitExit" color="cyan-accent-3" variant="flat" size="large" rounded="pill" class="text-black font-weight-bold">
        Obtenir Recompensa
      </v-btn>
    </v-card>

    <v-snackbar v-model="showFeedback" :color="feedbackColor" timeout="2000" location="top">
       {{ feedbackMessage }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';

const emit = defineEmits(['game-over']);

// --- DADES DEL JOC (temes variats) ---
const allLettersData = [
  // 🌌 Espai
  { char: 'A', question: "Cos rocallós que orbita al voltant del Sol.", answer: "ASTEROIDE" },
  { char: 'C', question: "Astre de gel i pols amb una cua lluminosa.", answer: "COMETA" },
  { char: 'E', question: "Esfera de gas que emet llum i calor.", answer: "ESTRELLA" },
  { char: 'G', question: "Sistema enorme d'estrelles units per la gravetat.", answer: "GALAXIA" },
  { char: 'N', question: "Núvol de gas on neixen noves estrelles.", answer: "NEBULOSA" },
  { char: 'P', question: "Cos celest que orbita una estrella.", answer: "PLANETA" },
  { char: 'S', question: "L'estrella central del nostre sistema.", answer: "SOL" },
  { char: 'T', question: "Instrument per observar objectes llunyans a l'espai.", answer: "TELESCOPI" },
  { char: 'U', question: "Tot el que existeix: matèria, energia, espai i temps.", answer: "UNIVERS" },
  { char: 'O', question: "Trajectòria corba d'un objecte a l'espai.", answer: "ORBITA" },
  // 🐾 Animals
  { char: 'G', question: "Felí domèstic molt independent i juganer.", answer: "GAT" },
  { char: 'A', question: "Au rapinyaire de gran envergadura, símbol de llibertat.", answer: "AGUILA" },
  { char: 'D', question: "Mamífer marí molt intel·ligent que viu en grups.", answer: "DOLFI" },
  { char: 'E', question: "El mamífer terrestre més gran del món.", answer: "ELEFANT" },
  { char: 'L', question: "Gran felí conegut com el rei de la selva.", answer: "LLEO" },
  { char: 'T', question: "Rèptil amb closca dura que es mou lentament.", answer: "TORTUGA" },
  { char: 'C', question: "Animal amb vuit tentacles que viu al fons del mar.", answer: "CRANC" },
  { char: 'P', question: "Ocell tropical de colors vius que pot imitar sons.", answer: "LLORO" },
  // 🔬 Ciència
  { char: 'A', question: "La unitat bàsica de la matèria.", answer: "ATOM" },
  { char: 'C', question: "Unitat bàsica dels éssers vius.", answer: "CELULA" },
  { char: 'G', question: "Força que atrau els objectes cap al centre de la Terra.", answer: "GRAVETAT" },
  { char: 'O', question: "Gas essencial per a la respiració dels éssers vius.", answer: "OXIGEN" },
  { char: 'H', question: "L'element químic més lleuger de l'univers.", answer: "HIDROGEN" },
  { char: 'E', question: "Capacitat per fer un treball o produir un canvi.", answer: "ENERGIA" },
  { char: 'M', question: "Aparell que fa que les coses petites es vegin grans.", answer: "MICROSCOPI" },
  { char: 'V', question: "Rapidesa amb què un objecte canvia de posició.", answer: "VELOCITAT" },
  // 🌍 Geografia
  { char: 'M', question: "Gran massa d'aigua salada que cobreix la Terra.", answer: "MAR" },
  { char: 'V', question: "Muntanya que pot fer erupció amb lava.", answer: "VOLCA" },
  { char: 'R', question: "Corrent natural d'aigua que desemboca al mar.", answer: "RIU" },
  { char: 'I', question: "Porció de terra envoltada d'aigua per tots els costats.", answer: "ILLA" },
  { char: 'D', question: "Zona àrida amb molt poques precipitacions.", answer: "DESERT" },
  { char: 'S', question: "Gran extensió de bosc tropical amb molta biodiversitat.", answer: "SELVA" },
  { char: 'L', question: "Massa d'aigua dolça envoltada de terra.", answer: "LLAC" },
  // 🍎 Aliments
  { char: 'P', question: "Fruita allargada i groga molt energètica.", answer: "PLATAN" },
  { char: 'T', question: "Fruita vermella molt usada en amanides i salses.", answer: "TOMAQUET" },
  { char: 'F', question: "Preparat comestible fet amb llet coagulada.", answer: "FORMATGE" },
  { char: 'X', question: "Dolç elaborat amb cacau.", answer: "XOCOLATA" },
  { char: 'P', question: "Plat italià amb base de massa, tomàquet i formatge.", answer: "PIZZA" },
  { char: 'M', question: "Producte dolç que fan les abelles.", answer: "MEL" },
  { char: 'A', question: "Fruita vermella o verda que creix als arbres.", answer: "POMA" },
  // ⚽ Esports
  { char: 'F', question: "Esport d'equip amb una pilota rodona i porteries.", answer: "FUTBOL" },
  { char: 'B', question: "Esport on es llança una pilota a una cistella.", answer: "BASQUET" },
  { char: 'N', question: "Esport aquàtic on es fan braçades a la piscina.", answer: "NATACIO" },
  { char: 'T', question: "Esport de raqueta amb una pilota sobre una xarxa.", answer: "TENNIS" },
  { char: 'C', question: "Esport on es pedala amb dues rodes.", answer: "CICLISME" },
  { char: 'R', question: "Esport d'equip amb una pilota ovalada.", answer: "RUGBY" },
  { char: 'E', question: "Esport d'hivern on es llisca per la neu.", answer: "ESQUI" },
  // 💻 Tecnologia
  { char: 'R', question: "Màquina programable que pot fer tasques automàtiques.", answer: "ROBOT" },
  { char: 'I', question: "Xarxa global que connecta ordinadors de tot el món.", answer: "INTERNET" },
  { char: 'P', question: "Acció de crear instruccions perquè un ordinador faci una tasca.", answer: "PROGRAMAR" },
  { char: 'W', question: "Lloc a internet on pots consultar informació.", answer: "WEB" },
  { char: 'D', question: "Informació emmagatzemada en sistemes informàtics.", answer: "DADES" },
  { char: 'S', question: "Dispositiu electrònic de butxaca amb pantalla tàctil.", answer: "SMARTPHONE" },
  // 🌿 Natura
  { char: 'B', question: "Gran extensió de terreny cobert d'arbres.", answer: "BOSC" },
  { char: 'F', question: "Part de la planta que sol ser de colors i atrau insectes.", answer: "FLOR" },
  { char: 'A', question: "Planta gran amb tronc llenyós i branques.", answer: "ARBRE" },
  { char: 'P', question: "Precipitació d'aigua que cau dels núvols.", answer: "PLUJA" },
  { char: 'N', question: "Massa visible de gotes d'aigua al cel.", answer: "NUVOL" },
  { char: 'L', question: "Font natural de llum que ve del Sol.", answer: "LLUM" },
  { char: 'V', question: "Moviment de l'aire a l'atmosfera.", answer: "VENT" },
  // 🏛 Història i Cultura
  { char: 'C', question: "Edifici fortificat medieval amb torres i muralles.", answer: "CASTELL" },
  { char: 'M', question: "Lloc on s'exposen obres d'art i objectes històrics.", answer: "MUSEU" },
  { char: 'L', question: "Conjunt de signes escrits que serveix per comunicar-se.", answer: "LLENGUA" },
  // 🎵 Música
  { char: 'G', question: "Instrument de cordes molt popular en el rock.", answer: "GUITARRA" },
  { char: 'P', question: "Instrument de tecles blanques i negres.", answer: "PIANO" },
  { char: 'B', question: "Instrument de percussió que es toca amb baquetes.", answer: "BATERIA" },
  { char: 'F', question: "Instrument de vent de fusta amb forats.", answer: "FLAUTA" },
  { char: 'M', question: "Art de combinar sons de forma agradable.", answer: "MUSICA" },
];

// --- STAR GEOMETRY ---
const STAR_CENTER = 200;
const STAR_RADIUS = 150;

const starPoints = Array.from({ length: 5 }, (_, i) => {
  const angle = (i * 72 - 90) * (Math.PI / 180);
  return {
    x: STAR_CENTER + Math.cos(angle) * STAR_RADIUS,
    y: STAR_CENTER + Math.sin(angle) * STAR_RADIUS,
  };
});

const starOrder = [0, 2, 4, 1, 3];
const starSegments = starOrder.map((from, i) => {
  const to = starOrder[(i + 1) % 5];
  return {
    x1: starPoints[from].x, y1: starPoints[from].y,
    x2: starPoints[to].x, y2: starPoints[to].y,
  };
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

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

const clearInput = () => { rawInput.value = ''; };

// Rocket Animation
const animateRocket = (fromIdx, toIdx) => {
  return new Promise((resolve) => {
    const from = starPoints[fromIdx];
    const to = starPoints[toIdx];
    rocketAnimating.value = true;
    trailParticles.value = [];
    
    const duration = 600;
    const startTime = Date.now();
    const trailColors = ['#FFD54F', '#FF9800', '#FF5722', '#FF3D00'];
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      rocketPos.x = from.x + (to.x - from.x) * eased;
      rocketPos.y = from.y + (to.y - from.y) * eased;
      
      if (progress < 1) {
        trailParticles.value.push({
          x: rocketPos.x + (Math.random() - 0.5) * 10,
          y: rocketPos.y + (Math.random() - 0.5) * 10,
          r: Math.random() * 4 + 2,
          color: trailColors[Math.floor(Math.random() * trailColors.length)],
          opacity: 1 - progress,
        });
        if (trailParticles.value.length > 20) {
          trailParticles.value = trailParticles.value.slice(-20);
        }
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          rocketAnimating.value = false;
          trailParticles.value = [];
          resolve();
        }, 100);
      }
    };
    
    requestAnimationFrame(animate);
  });
};

const isSegmentVisited = (segIdx) => visitedSegments.value.has(segIdx);

// Game Logic
const checkAnswer = async () => {
    if (rawInput.value.trim() === '' || isChecking.value) return;
    
    isChecking.value = true;
    const userAnswer = normalize(rawInput.value);
    const correctAnswer = normalize(currentLetter.value.answer);

    if (userAnswer === correctAnswer) {
        roscoLetters.value[currentIndex.value].status = 'correct';
        score.value += 100;
        feedbackMessage.value = "Correcte! Molt bé!";
        feedbackColor.value = 'success';
    } else {
        roscoLetters.value[currentIndex.value].status = 'incorrect';
        feedbackMessage.value = `Incorrecte! Era "${currentLetter.value.answer}"`;
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

const finishGame = () => {
    if (gameFinished.value) return;
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
    const point = starPoints[index];
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
    stroke: rgba(100, 180, 255, 0.15);
    stroke-width: 3;
    stroke-linecap: round;
    transition: all 0.5s ease;
}

.star-line.line-visited {
    stroke: #FFD54F;
    stroke-width: 4;
    filter: drop-shadow(0 0 6px rgba(255, 213, 79, 0.6));
    animation: line-glow 2s ease-in-out infinite alternate;
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
    width: 90px; height: 90px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, rgba(10, 10, 30, 0.95) 80%);
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 50%;
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.15);
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
