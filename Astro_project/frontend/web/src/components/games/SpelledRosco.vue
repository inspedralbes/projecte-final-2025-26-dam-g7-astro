<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container">
    
    <!-- Capçalera -->
    <v-card width="100%" max-width="800" class="mb-4 pa-4 bg-deep-purple-darken-4 elevation-10" rounded="xl">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">Pasapalabra Deletreado</h2>
          <span class="text-caption text-grey-lighten-2">Puntuació: {{ score }}</span>
        </div>
        <div class="d-flex align-center gap-4">
          <div class="text-h5 font-weight-bold text-white">{{ formatTime(timeLeft) }}</div>
          <v-btn icon="mdi-close" variant="text" color="grey" @click="emitExit"></v-btn>
        </div>
      </div>
    </v-card>

    <!-- Joc Principal -->
    <v-row v-if="!gameFinished" class="w-100 d-flex justify-center align-center" no-gutters>
      
      <!-- Rosco Circular -->
      <v-col cols="12" md="6" class="d-flex justify-center align-center position-relative rosco-container mb-8 mb-md-0">
        <div class="rosco-circle">
          <div 
            v-for="(letter, index) in roscoLetters" 
            :key="letter.char"
            class="letter-bubble elevation-5"
            :class="getBubbleClass(letter, index)"
            :style="getBubbleStyle(index, roscoLetters.length)"
          >
            {{ letter.char }}
          </div>
          
          <!-- Centre del Rosco (Info actual) -->
          <div class="rosco-center text-center pa-2">
            <div class="text-h2 font-weight-black text-white mb-2">{{ currentLetter.char }}</div>
            <div class="text-caption text-grey-lighten-1">Lletra actual</div>
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
            <p class="text-overline text-grey-lighten-1 mb-2">LLETREJA LA PARAULA</p>
            
            <!-- Visualització de la paraula lletrejada -->
            <div class="spelling-display mb-4 d-flex justify-center flex-wrap gap-2">
              <span 
                v-for="(char, i) in userInputDisplay" 
                :key="i" 
                class="spelling-char"
              >
                {{ char }}
              </span>
              <span class="spelling-cursor" v-if="!isChecking">|</span>
            </div>
            
            <!-- Input Ocult per teclat físic/mòbil -->
            <input 
              ref="hiddenInput" 
              v-model="rawInput" 
              type="text" 
              class="hidden-input" 
              @input="handleInput" 
              @keydown.enter="checkAnswer"
              autocomplete="off"
            >

            <div class="d-flex justify-center gap-4 mb-4">
               <v-btn
                color="cyan-accent-3"
                size="x-large"
                variant="outlined"
                class="px-8"
                @click="startListening"
                :loading="isListening"
              >
                <v-icon icon="mdi-microphone" start></v-icon>
                Dir per veu
              </v-btn>
              
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
      <p class="text-h5 text-white mb-6">Puntuació Final: {{ score }}</p>
      
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useAstroStore } from '@/stores/astroStore';

const emit = defineEmits(['game-over']);
const astroStore = useAstroStore();

// --- DADES DEL JOC ---
// Un petit set de dades per exemple. En un cas real, n'hi hauria 26.
const allLettersData = [
  { char: 'A', question: "Cos rocallós més petit que un planeta que orbita al voltant del Sol.", answer: "ASTEROIDE" },
  { char: 'B', question: "Teoria de la gran explosió que va originar l'Univers.", answer: "BIGBANG" },
  { char: 'C', question: "Astre de gel i pols que quan s'apropa al Sol forma una cua lluminosa.", answer: "COMETA" },
  { char: 'D', question: "Fenomen d'una estrella que en realitat són dues orbitant entre elles.", answer: "DOBLE" },
  { char: 'E', question: "Esfera de gas gegant que emet la seva pròpia llum i calor.", answer: "ESTRELLA" },
  { char: 'F', question: "Partícula elemental que transporta la llum i la radiació electromagnètica.", answer: "FOTO" },
  { char: 'G', question: "Sistema enorme d'estrelles, gas i pols units per la gravetat.", answer: "GALAXIA" },
  { char: 'H', question: "L'element químic més lleuger després de l'hidrogen, molt abundant al Sol.", answer: "HELI" },
  { char: 'I', question: "Espai que es troba entre les estrelles d'una galàxia.", answer: "INTERESTELAR" },
  { char: 'J', question: "El planeta més gran del nostre Sistema Solar.", answer: "JUPITER" },
  { char: 'L', question: "L'únic satèl·lit natural de la Terra.", answer: "LLUNA" },
  { char: 'M', question: "Fragment de roca espacial que arriba a terra sense cremar-se del tot.", answer: "METEORIT" },
  { char: 'N', question: "Núvol gegant de gas i pols on sovint neixen noves estrelles.", answer: "NEBULOSA" },
  { char: 'O', question: "Trajectòria corba que descriu un objecte al voltant d'un altre a l'espai.", answer: "ORBITA" },
  { char: 'P', question: "Cos celest que orbita una estrella i té prou massa per ser esfèric.", answer: "PLANETA" },
  { char: 'Q', question: "Objecte llunyà i extremadament brillant alimentat per un forat negre gegant.", answer: "QUASAR" },
  { char: 'R', question: "Emissió d'energia a través de l'espai en forma d'ones o partícules.", answer: "RADIACIO" },
  { char: 'S', question: "L'estrella central del nostre sistema planetari.", answer: "SOL" },
  { char: 'T', question: "Instrument que permet observar objectes llunyans a l'espai.", answer: "TELESCOPI" },
  { char: 'U', question: "Tot el que existeix: matèria, energia, espai i temps.", answer: "UNIVERS" },
  { char: 'V', question: "Nom de la nostra pròpia galàxia: Via...", answer: "LACTIA" },
  { char: 'X', question: "Tipus de radiació electromagnètica d'alta energia capaç de travessar cossos: Raigs...", answer: "X" },
  { char: 'Y', question: "Conté la Y. Unitat de distància astronòmica (no oficial) però usada en context anglosaxó per iarda planetària.", answer: "YARD" },
  { char: 'Z', question: "Punt de l'esfera celeste situat directament sobre el cap de l'observador.", answer: "ZENIT" },
];

// Estat de les lletres: 0: pending, 1: correct, 2: incorrect, 3: current
const roscoLetters = ref([]); 
const currentIndex = ref(0);
const rawInput = ref('');
const timeLeft = ref(180); // 3 minuts
let timerInterval = null;
const gameFinished = ref(false);
const score = ref(0);
const isListening = ref(false);
const showFeedback = ref(false);
const feedbackMessage = ref('');
const feedbackColor = ref('info');
const hiddenInput = ref(null);
const gameSaved = ref(false);

// Computed
const currentLetter = computed(() => {
    if (roscoLetters.value.length === 0) return {};
    return roscoLetters.value[currentIndex.value];
});

const userInputDisplay = computed(() => {
    return rawInput.value.toUpperCase().split('');
});

const correctCount = computed(() => roscoLetters.value.filter(l => l.status === 'correct').length);
const incorrectCount = computed(() => roscoLetters.value.filter(l => l.status === 'incorrect').length);

const isChecking = ref(false);

// Initialization
onMounted(() => {
    // Inicialitzem el rosco
    // Agafem les dades i creem l'estat local.
    // Per fer-ho maco visualment, potser volem omplir fins a 26 lletres o fer-ho amb les que tenim.
    // Fem servir les que tenim, es distribuiran en cercle.
    roscoLetters.value = allLettersData.map(l => ({
        ...l,
        status: 'pending' // pending, correct, incorrect, ignored?
    }));

    startTimer();
    focusInput();
});

onUnmounted(() => {
    clearInterval(timerInterval);
});

// Timer
const startTimer = () => {
    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            finishGame();
        }
    }, 1000);
};

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Input Handling
const focusInput = () => {
    nextTick(() => {
        hiddenInput.value?.focus();
    });
};

const handleInput = (e) => {
    // Netejar input: només lletres
    const val = e.target.value;
    // Acceptem lletres i espais (per si el speech posa espais)
    rawInput.value = val.replace(/[^a-zA-ZçÇñÑ ]/g, ''); 
};

const clearInput = () => {
    rawInput.value = '';
    focusInput();
};

// Game Logic
const checkAnswer = () => {
    if (rawInput.value.trim() === '') return;
    
    isChecking.value = true;
    const userAnswer = rawInput.value.toUpperCase().replace(/\s/g, ''); // Treiem espais per comprovar: S O L => SOL
    const correctAnswer = currentLetter.value.answer.toUpperCase();

    // Check spelling
    if (userAnswer === correctAnswer) {
        // Correct
        roscoLetters.value[currentIndex.value].status = 'correct';
        score.value += 100;
        feedbackMessage.value = "Correcte! Molt bé lletrejat.";
        feedbackColor.value = 'success';
    } else {
        // Incorrect
        roscoLetters.value[currentIndex.value].status = 'incorrect';
        feedbackMessage.value = `Incorrecte! Era "${correctAnswer}"`;
        feedbackColor.value = 'error';
    }

    showFeedback.value = true;
    
    setTimeout(() => {
        isChecking.value = false;
        rawInput.value = '';
        showFeedback.value = false;
        advanceTurn();
    }, 1500);
};

const pasapalabra = () => {
    if (isChecking.value) return;
    // Deixa status 'pending' però passa torn
    // En un pasapalabra real, torna a sortir després.
    // Implementació simple: busquem el següent index que estigui 'pending'
    rawInput.value = '';
    advanceTurn();
};

const advanceTurn = () => {
    // Trobar el següent index que tingui status 'pending'
    // Comencem a buscar des de currentIndex + 1
    let nextIdx = -1;
    
    // 1. Buscar des de l'actual cap al final
    for (let i = currentIndex.value + 1; i < roscoLetters.value.length; i++) {
        if (roscoLetters.value[i].status === 'pending') {
            nextIdx = i;
            break;
        }
    }

    // 2. Si no trobem, buscar des de l'inici fins a l'actual
    if (nextIdx === -1) {
        for (let i = 0; i < currentIndex.value; i++) {
            if (roscoLetters.value[i].status === 'pending') {
                nextIdx = i;
                break;
            }
        }
    }

    if (nextIdx !== -1) {
        currentIndex.value = nextIdx;
        focusInput();
    } else {
        // No queden pendents
        finishGame();
    }
};

const finishGame = async () => {
    if (gameFinished.value) return;

    gameFinished.value = true;
    clearInterval(timerInterval);
};

const emitExit = () => {
    emit('game-over', score.value);
};

// Voice Recognition
const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("El teu navegador no suporta reconeixement de veu o no tens permís. Fes servir Chrome.");
        return;
    }

    try {
        // Demanem permís explícit primer (com proposaves tu)
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        isListening.value = true;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ca-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            rawInput.value = transcript; 
            isListening.value = false;
            focusInput();
        };

        recognition.onerror = (event) => {
            console.error("Error reconeixement veu:", event.error);
            isListening.value = false;
            if (event.error === 'not-allowed') {
                alert("🔴 PERMÍS DENETGAT: Revisa la configuració del micròfon al costat de la URL del navegador.");
            } else {
                alert(`Error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            isListening.value = false;
        };

        recognition.start();
    } catch (err) {
        console.error("Error al accedir al micròfon:", err);
        alert("No s'ha pogut accedir al micròfon. Verifica els permisos al navegador.");
        isListening.value = false;
    }
};

// Visual Helpers
const getBubbleClass = (letter, index) => {
    if (index === currentIndex.value && !gameFinished.value) return 'bubble-current';
    if (letter.status === 'correct') return 'bubble-correct';
    if (letter.status === 'incorrect') return 'bubble-incorrect';
    return 'bubble-pending';
};

const getBubbleStyle = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - (Math.PI / 2); // Start at top (-90deg)
    const radius = 180; // pixels (Increased radius for better spacing)
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
    };
};

</script>

<style scoped>
.game-container {
    background-color: #0b0f19; /* Dark space background */
}

/* Rosco Styles */
.rosco-container {
    height: 350px;
}

.rosco-circle {
    position: relative;
    width: 0; /* Center point precisely at (0,0) in relative parent */
    height: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.rosco-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, rgba(10, 10, 30, 0.9) 75%);
    border: 3px solid rgba(0, 229, 255, 0.4);
    border-radius: 50%;
    box-shadow: 0 0 40px rgba(0, 229, 255, 0.25);
    z-index: 1; /* Davant de les línies però darrere de les bombolles si s'encavalquen */
}

/* Efecte de pulsació per a la lletra actual */
.rosco-center .text-h2 {
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
    line-height: 1;
}

.letter-bubble {
    position: absolute;
    top: 50%; /* Start from center point */
    left: 50%;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 1.2rem;
    color: white;
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.bubble-pending {
    background: linear-gradient(135deg, #1e88e5, #1565c0);
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
}

.bubble-correct {
    background: linear-gradient(135deg, #43a047, #2e7d32);
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);
    transform: scale(1.1); /* Override translate? No, this might break translate. Use scale in transform but we are setting transform in style. Careful. */
    /* Wait, style bindings override class styles for transform usually if inline. 
       Actually, `translate` is separate from `scale` in modern CSS, but older combines them in `transform`.
       To avoid conflict, I'll wrappers or just change border/color.
    */
    border-color: #69f0ae;
}

/* Fix for transform conflict: apply scale to inner content or handle differently.
   Let's just rely on color changes for now to be safe with the inline styles.
*/

.bubble-incorrect {
    background: linear-gradient(135deg, #e53935, #c62828);
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.8);
    border-color: #ff8a80;
}

.bubble-current {
    background: linear-gradient(135deg, #00e5ff, #00b0ff);
    box-shadow: 0 0 20px #00e5ff;
    color: black;
    z-index: 10;
    width: 50px;
    height: 50px;
    /* Requires adjusting translate? The inline style controls translate. Changing width/height will shift center if not centered.
       The bubbles are centered by flex in parent circle, but absolute positioned.
       Margin auto might help? No.
       The transform translates from the center point. 
       If I increase size, it expands from center (50% 50%). So it should be fine.
    */
}

.spelling-display {
    min-height: 60px;
    border: 2px solid #546e7a;
    border-radius: 8px;
    background-color: #263238;
    padding: 10px;
    align-items: center;
}

.spelling-char {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    background-color: #37474f;
    border: 1px solid #78909c;
    border-radius: 4px;
    font-size: 1.5rem;
    font-weight: bold;
    color: #00e5ff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.spelling-cursor {
    font-size: 2rem;
    color: #00e5ff;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

.hidden-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    /* But it needs to be focusable. Don't use display:none */
    width: 1px;
    height: 1px;
}
</style>
