<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container">
    
    <!-- Capçalera -->
    <v-card width="100%" max-width="800" class="mb-2 pa-2 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h6 font-weight-bold text-cyan-accent-2">🚀 Rosco Estelar</h2>
          <div class="text-caption text-grey-lighten-2">
            <template v-if="!isMultiplayer">
              <span>Puntuació: {{ score }}</span>
              <span class="mx-2">|</span>
              <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">Temps: {{ timeLeft }}s</span>
            </template>
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
      <v-col cols="12" md="6" class="d-flex justify-center align-center position-relative star-col mb-4 mb-md-0">
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
          <div v-if="canSeeDefinition" class="mb-4 position-relative">
            <v-chip color="cyan" label class="mb-2 font-weight-bold">Definició</v-chip>
            <p class="text-h6 text-white transition-all">
                {{ isFogActive ? scrambledQuestion : currentLetter.question }}
            </p>
            <!-- Fog Effect Over Definition -->
            <div v-if="isFogActive" class="fog-effect">
                <div v-for="n in 5" :key="n" class="fog-overlay" :style="{ animationDelay: (n * 0.5) + 's' }"></div>
            </div>

          </div>
          <div v-else class="mb-4 text-center py-8">
            <v-icon size="48" color="cyan-darken-2" class="mb-2">mdi-account-voice</v-icon>
            <p class="text-h6 text-grey-lighten-1">ESCOLTA EL TEU COMPANY</p>
            <p class="text-caption text-grey">Ell té la definició</p>
          </div>

          <v-divider class="mb-4 border-opacity-25"></v-divider>

          <div v-if="canInput" class="text-center mb-4">
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
          <div v-else class="text-center py-4">
              <v-chip color="orange" variant="outlined" label>EL COMPANY ESCRIU LA RESPOSTA</v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Cursores compartis (Només en COOPERATIU) -->
    <template v-if="remoteCursor">
         <div 
           class="remote-cursor-game"
           :style="{ left: remoteCursor.x + '%', top: remoteCursor.y + '%' }"
         >
           <v-icon icon="mdi-cursor-default" color="cyan-accent-2" size="24" class="mouse-icon-shadow"></v-icon>
           <div class="cursor-tag-mini">{{ remoteCursor.user }}</div>
         </div>
    </template>

    <!-- Pantalla Final (només en single player) -->
    <v-card v-if="gameFinished && !isMultiplayer" width="100%" max-width="500" class="pa-8 text-center bg-grey-darken-4 border-cyan" rounded="xl">
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

    <!-- Efecto Shield Visual -->
    <div v-if="hasShield" class="shield-indicator">
        <v-icon icon="mdi-shield-star" color="cyan-accent-2" size="large"></v-icon>
        <span>IMPULS ESTEL·LAR ACTIU</span>
    </div>

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

// --- DADES DEL JOC ---
const allLettersData = [
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
  { char: 'G', question: "Felí domèstic molt independent i juganer.", answer: "GAT" },
  { char: 'A', question: "Au rapinyaire de gran envergadura, símbol de llibertat.", answer: "AGUILA" },
  { char: 'D', question: "Mamífer marí molt intel·ligent que viu en grups.", answer: "DOLFI" },
  { char: 'E', question: "El mamífer terrestre més gran del món.", answer: "ELEFANT" },
  { char: 'L', question: "Gran felí conegut com el rei de la selva.", answer: "LLEO" },
  { char: 'T', question: "Rèptil amb closca dura que es mou lentament.", answer: "TORTUGA" },
  { char: 'C', question: "Animal amb vuit tentacles que viu al fons del mar.", answer: "CRANC" },
  { char: 'P', question: "Ocell tropical de colors vius que pot imitar sons.", answer: "LLORO" },
  { char: 'A', question: "La unitat bàsica de la matèria.", answer: "ATOM" },
  { char: 'C', question: "Unitat bàsica dels éssers vius.", answer: "CELULA" },
  { char: 'G', question: "Força que atrau els objectes cap al centre de la Terra.", answer: "GRAVETAT" },
  { char: 'O', question: "Gas essencial per a la respiració dels éssers vius.", answer: "OXIGEN" },
  { char: 'H', question: "L'element químic més lleuger de l'univers.", answer: "HIDROGEN" },
  { char: 'E', question: "Capacitat per fer un treball o produir un canvi.", answer: "ENERGIA" },
  { char: 'M', question: "Aparell que fa que les coses petites es vegin grans.", answer: "MICROSCOPI" },
  { char: 'V', question: "Rapidesa amb què un objecte canvia de posició.", answer: "VELOCITAT" },
  { char: 'M', question: "Gran massa d'aigua salada que cobreix la Terra.", answer: "MAR" },
  { char: 'V', question: "Muntanya que pot fer erupció amb lava.", answer: "VOLCA" },
  { char: 'R', question: "Corrent natural d'aigua que desemboca al mar.", answer: "RIU" },
  { char: 'I', question: "Porció de terra envoltada d'aigua per tots els costats.", answer: "ILLA" },
  { char: 'D', question: "Zona àrida amb molt poques precipitacions.", answer: "DESERT" },
  { char: 'S', question: "Gran extensió de bosc tropical amb molta biodiversitat.", answer: "SELVA" },
  { char: 'L', question: "Massa d'aigua dolça envoltada de terra.", answer: "LLAC" },
  { char: 'P', question: "Fruita allargada i groga molt energètica.", answer: "PLATAN" },
  { char: 'T', question: "Fruita vermella molt usada en amanides i salses.", answer: "TOMAQUET" },
  { char: 'F', question: "Preparat comestible fet amb llet coagulada.", answer: "FORMATGE" },
  { char: 'X', question: "Dolç elaborat amb cacau.", answer: "XOCOLATA" },
  { char: 'P', question: "Plat italià amb base de massa, tomàquet i formatge.", answer: "PIZZA" },
  { char: 'M', question: "Producte dolç que fan les abelles.", answer: "MEL" },
  { char: 'A', question: "Fruita vermella o verda que creix als arbres.", answer: "POMA" },
  { char: 'F', question: "Esport d'equip amb una pilota rodona i porteries.", answer: "FUTBOL" },
  { char: 'B', question: "Esport on es llança una pilota a una cistella.", answer: "BASQUET" },
  { char: 'N', question: "Esport aquàtic on es fan braçades a la piscina.", answer: "NATACIO" },
  { char: 'T', question: "Esport de raqueta amb una pilota sobre una xarxa.", answer: "TENNIS" },
  { char: 'C', question: "Esport on es pedala amb dues rodes.", answer: "CICLISME" },
  { char: 'R', question: "Esport d'equip amb una pilota ovalada.", answer: "RUGBY" },
  { char: 'E', question: "Esport d'hivern on es llisca per la neu.", answer: "ESQUI" },
  { char: 'R', question: "Màquina programable que pot fer tasques automàtiques.", answer: "ROBOT" },
  { char: 'I', question: "Xarxa global que connecta ordinadors de tot el món.", answer: "INTERNET" },
  { char: 'P', question: "Acció de crear instruccions perquè un ordinador faci una tasca.", answer: "PROGRAMAR" },
  { char: 'W', question: "Lloc a internet on pots consultar informació.", answer: "WEB" },
  { char: 'D', question: "Informació emmagatzemada en sistemes informàtics.", answer: "DADES" },
  { char: 'S', question: "Dispositiu electrònic de butxaca amb pantalla tàctil.", answer: "SMARTPHONE" },
  { char: 'B', question: "Gran extensió de terreny cobert d'arbres.", answer: "BOSC" },
  { char: 'F', question: "Part de la planta que sol ser de colors i atrau insectes.", answer: "FLOR" },
  { char: 'A', question: "Planta gran amb tronc llenyós i branques.", answer: "ARBRE" },
  { char: 'P', question: "Precipitació d'aigua que cau dels núvols.", answer: "PLUJA" },
  { char: 'N', question: "Massa visible de gotes d'aigua al cel.", answer: "NUVOL" },
  { char: 'L', question: "Font natural de llum que ve del Sol.", answer: "LLUM" },
  { char: 'V', question: "Moviment de l'aire a l'atmosfera.", answer: "VENT" },
  { char: 'C', question: "Edifici fortificat medieval amb torres i muralles.", answer: "CASTELL" },
  { char: 'M', question: "Lloc on s'exposen obres d'art i objectes històrics.", answer: "MUSEU" },
  { char: 'L', question: "Conjunt de signes escrits que serveix per comunicar-se.", answer: "LLENGUA" },
  { char: 'G', question: "Instrument de cordes molt popular en el rock.", answer: "GUITARRA" },
  { char: 'P', question: "Instrument de tecles blanques i negres.", answer: "PIANO" },
  { char: 'B', question: "Instrument de percussió que es toca amb baquetes.", answer: "BATERIA" },
  { char: 'F', question: "Instrument de vent de fusta amb forats.", answer: "FLAUTA" },
  { char: 'M', question: "Art de combinar sons de forma agradable.", answer: "MUSICA" },
];

// --- STAR GEOMETRY ---
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
  return letterPositions.map(pos => {
    const pPrev = starPoints[(pos - 1 + 10) % 10];
    const pCurr = starPoints[pos];
    const pNext = starPoints[(pos + 1) % 10];
    const pCenter = { x: STAR_CENTER, y: STAR_CENTER };
    return `${pCenter.x},${pCenter.y} ${pPrev.x},${pPrev.y} ${pCurr.x},${pCurr.y} ${pNext.x},${pNext.y}`;
  });
});

// --- ESTADO DEL JUEGO ---
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

const rocketAnimating = ref(false);
const rocketPos = reactive({ x: 0, y: 0 });
const trailParticles = ref([]);
const visitedSegments = ref(new Set());

// --- MULTIJUGADOR Y COOPERATIVO ---
const isCoop = computed(() => props.isMultiplayer && multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE');

const myTeam = computed(() => {
    if (!isCoop.value) return null;
    return multiplayerStore.room?.gameConfig?.teams?.find(t => t.members.includes(astroStore.user));
});

const myTeamId = computed(() => myTeam.value?.id);
const isMyTeammate = (user) => myTeam.value?.members.includes(user) && user !== astroStore.user;

const myRole = computed(() => {
    if (!myTeam.value) return null;
    return myTeam.value.members[0] === astroStore.user ? 'A' : 'B';
});

const currentLetter = computed(() => {
    if (roscoLetters.value.length === 0) return { char: '?', question: '' };
    return roscoLetters.value[currentIndex.value];
});

// --- EFECTES MULTIJUGADOR ---
const isFogActive = computed(() => Object.values(multiplayerStore.activeEffects).some(e => e.type === 'EFFECT_FOG_ROSCO'));

const scrambledQuestion = computed(() => {
  if (!currentLetter.value?.question) return '';
  return currentLetter.value.question.split('').map(char => {
    if (char === ' ') return ' ';
    return Math.random() > 0.4 ? char : (['#','*','@','%','&'][Math.floor(Math.random()*5)]);
  }).join('');
});

const canSeeDefinition = computed(() => {
    if (!props.isMultiplayer) return true;
    if (isCoop.value) return myRole.value === 'A';
    return true; 
});

const canInput = computed(() => {
    if (!props.isMultiplayer) return true;
    if (isCoop.value) return myRole.value === 'B';
    return true; 
});

const remoteCursor = computed(() => {
  if (!props.isMultiplayer || !isCoop.value) return null;
  const opp = multiplayerStore.room?.players?.find(p => p !== astroStore.user);
  if (!opp) return null;
  const pos = multiplayerStore.remoteCursors[opp];
  if (!pos) return null;
  
  const playArea = document.querySelector('.game-container');
  if (!playArea) return null;
  const rect = playArea.getBoundingClientRect();
  const clientX = (pos.x / 100) * window.innerWidth;
  const clientY = (pos.y / 100) * window.innerHeight;
  
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
    user: opp
  };
});

// --- LÓGICA DE INICIO Y RELOJ ---
onMounted(() => {
    const seed = props.isMultiplayer ? (multiplayerStore.room?.gameConfig?.seed ?? Math.random()) : Math.random();
    const seededRandom = (s) => {
        let x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    const shuffled = [...allLettersData].sort((a, b) => {
        const idxA = allLettersData.indexOf(a);
        const idxB = allLettersData.indexOf(b);
        return seededRandom(seed * (idxA + 1)) - seededRandom(seed * (idxB + 1));
    });
    roscoLetters.value = shuffled.slice(0, 5).map(l => ({ ...l, status: 'pending' }));
    startTimer();
});

onUnmounted(() => { 
    if (timerInterval) clearInterval(timerInterval); 
    if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(null);
});

const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameFinished.value) return;
        timeLeft.value = Math.max(0, timeLeft.value - 1);
        if (props.isMultiplayer) multiplayerStore.setLocalTimeLeft(timeLeft.value);
        if (timeLeft.value === 0) finishGame();
    }, 1000);
};

// --- WATCHERS ---
watch(() => multiplayerStore.activeEffects, (effects) => {
    hasShield.value = Object.values(effects).some(e => e.type === 'EFFECT_SHIELD');
}, { deep: true });

watch(score, (newScore) => {
    if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore });
    }
});

watch(() => multiplayerStore.lastMessage, (msg) => {
    if (!msg) return;
    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
        gameFinished.value = true;
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE' && msg.from !== astroStore.user) {
        let shouldApply = (isCoop.value) ? (msg.action.targetTeamId === myTeamId.value) : true;
        if (shouldApply && msg.action.subtype === 'REDUCE_TIME') {
            timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 15));
        }
    }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'BONUS' && msg.action?.subtype === 'ADD_TIME') {
        if (isCoop.value && isMyTeammate(msg.from)) {
            timeLeft.value = Math.min(999, timeLeft.value + (msg.action.amount || 15));
        }
    }
    if (isCoop.value && isMyTeammate(msg.from) && msg.type === 'GAME_ACTION') {
        if (msg.action.type === 'ADVANCE_TURN') {
            currentIndex.value = msg.action.nextIndex;
            if (msg.action.wasCorrect !== undefined) {
                 roscoLetters.value[msg.action.prevIndex].status = msg.action.wasCorrect ? 'correct' : 'incorrect';
                 if (msg.action.wasCorrect) score.value += 100;
            }
            animateRocket(msg.action.prevIndex, msg.action.nextIndex);
        }
        if (msg.action.type === 'FINISH_GAME') finishGame();
    }
});

// --- ACCIONES DEL JUEGO ---
const normalize = (str) => str.toUpperCase().trim().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const clearInput = () => { rawInput.value = ''; };

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
        if (props.isMultiplayer) {
            timeLeft.value = Math.min(timeLeft.value + 10, 999);
            if (!isCoop.value) multiplayerStore.sendGameAction({ type: 'SABOTAGE', subtype: 'REDUCE_TIME', amount: 15 });
            else multiplayerStore.sendGameAction({ type: 'BONUS', subtype: 'ADD_TIME', amount: 10 });
        }
    } else {
        if (hasShield.value) {
            hasShield.value = false;
            feedbackMessage.value = "Impuls Estel·lar! Fallada no comptabilitzada.";
            feedbackColor.value = 'cyan-accent-3';
            showFeedback.value = true;
            setTimeout(() => { showFeedback.value = false; rawInput.value = ''; isChecking.value = false; }, 1500);
            return;
        }
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
        if (isCoop.value) {
            const status = roscoLetters.value[prevIndex].status;
            multiplayerStore.sendGameAction({
                type: 'ADVANCE_TURN',
                prevIndex,
                nextIndex: nextIdx,
                wasCorrect: status === 'correct' ? true : (status === 'incorrect' ? false : undefined)
            });
        }
        await animateRocket(prevIndex, nextIdx);
        currentIndex.value = nextIdx;
    } else {
        if (isCoop.value) multiplayerStore.sendGameAction({ type: 'FINISH_GAME' });
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
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
};

const animateRocket = (fromIdx, toIdx) => {
  return new Promise((resolve) => {
    const startPointIdx = letterPositions[fromIdx];
    const endPointIdx = letterPositions[toIdx];
    const path = [];
    let curr = startPointIdx;
    while(curr !== endPointIdx) {
      curr = (curr + 1) % 10;
      path.push(starPoints[curr]);
    }
    rocketAnimating.value = true;
    const durationPerStep = 200;
    const animateStep = (stepIdx) => {
      if (stepIdx >= path.length) {
        setTimeout(() => { rocketAnimating.value = false; trailParticles.value = []; resolve(); }, 50);
        return;
      }
      const from = stepIdx === 0 ? starPoints[startPointIdx] : path[stepIdx - 1];
      const to = path[stepIdx];
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationPerStep, 1);
        rocketPos.x = from.x + (to.x - from.x) * progress;
        rocketPos.y = from.y + (to.y - from.y) * progress;
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
        } else animateStep(stepIdx + 1);
      };
      requestAnimationFrame(animate);
    };
    animateStep(0);
  });
};

const emitExit = () => { emit('game-over', finalReward.value); };

// --- HELPERS VISUALES ---
const correctCount = computed(() => roscoLetters.value.filter(l => l.status === 'correct').length);
const incorrectCount = computed(() => roscoLetters.value.filter(l => l.status === 'incorrect').length);
const finalReward = computed(() => score.value + timeLeft.value);

const getBubbleClass = (letter, index) => {
    if (index === currentIndex.value && !gameFinished.value) return 'node-current';
    if (letter.status === 'correct') return 'node-correct';
    if (letter.status === 'incorrect') return 'node-incorrect';
    return 'node-pending';
};

const getStarNodeStyle = (index) => {
    const point = starPoints[letterPositions[index]];
    return { left: `${(point.x / 400) * 100}%`, top: `${(point.y / 400) * 100}%` };
};

const getChipColor = (letter) => {
    if (letter.status === 'correct') return 'success';
    if (letter.status === 'incorrect') return 'error';
    return 'grey';
};

const isTipGlowing = (tipIdx) => roscoLetters.value[tipIdx]?.status === 'correct';
const isSegmentGlowing = (segIdx) => {
  return roscoLetters.value.some((l, i) => {
    if (l.status !== 'correct') return false;
    const seg1 = i * 2;
    const seg0 = (i * 2 - 1 + 10) % 10;
    return segIdx === seg1 || segIdx === seg0;
  });
};
</script>

<style scoped>
.game-container {
    background-color: #0b0f19;
}

.star-col {
    min-height: 340px;
}

.star-wrapper {
    position: relative;
    width: 340px;
    height: 340px;
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
    width: 50px; height: 50px;
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
    font-size: 1.2rem;
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
    width: 60px; height: 60px;
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
    width: 80px; height: 80px;
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
    font-size: 1.8rem !important;
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

/* Efectes */
.fog-effect {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 10; pointer-events: none;
    overflow: hidden; border-radius: 12px;
}
.fog-overlay {
    position: absolute; width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    top: -50%; left: -50%;
    animation: fog-drift 4s linear infinite;
}
@keyframes fog-drift {
    0% { transform: translate(0, 0); }
    33% { transform: translate(150px, 100px); }
    66% { transform: translate(50px, 200px); }
    100% { transform: translate(0, 0); }
}



.shield-indicator {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid #00e5ff;
    padding: 8px 16px;
    border-radius: 30px;
    color: #00e5ff;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
    z-index: 100;
}

.transition-all {
    transition: all 0.5s ease;
}
.game-container {
  position: relative;
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

.mouse-icon-shadow {
  filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5));
}
</style>
