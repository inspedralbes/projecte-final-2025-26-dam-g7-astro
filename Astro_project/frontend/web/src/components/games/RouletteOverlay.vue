<template>
  <v-fade-transition>
    <div v-if="show" class="roulette-overlay d-flex align-center justify-center">
      <div class="roulette-container pa-8 rounded-xl text-center">
        <h2 class="text-h4 font-weight-black text-cyan-accent-2 mb-8 tracking-widest">
          SELECCIONANDO MISIÓN...
        </h2>
        
        <div class="slot-machine-wrapper mb-8">
          <div class="slot-window">
             <div class="slot-reel" :style="reelStyle">
                <div v-for="(game, index) in extendedGames" :key="index" class="slot-item py-4" :class="{ 'selected-glow': !isSpinning && game === targetGame }">
                   <v-icon :icon="getGameIcon(game)" size="x-large" :color="!isSpinning && game === targetGame ? 'cyan-accent-2' : 'white'" class="mb-2"></v-icon>
                   <div class="text-h5 font-weight-bold" :class="!isSpinning && game === targetGame ? 'text-cyan-accent-2' : 'text-white'">{{ game }}</div>
                </div>
             </div>
          </div>
        </div>

        <v-progress-linear
          indeterminate
          color="cyan-accent-2"
          rounded
          height="6"
          class="mt-4"
        ></v-progress-linear>
      </div>
    </div>
  </v-fade-transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  show: Boolean,
  targetGame: String,
  games: Array
});

const emit = defineEmits(['finished']);

const reelPosition = ref(0);
const duration = 3000; // 3 segundos de animación

// Duplicamos la lista para crear el efecto infinito
const extendedGames = computed(() => {
  return [...props.games, ...props.games, ...props.games, ...props.games];
});

const getGameIcon = (name) => {
    const icons = {
        'RadarScan': 'mdi-radar',
        'RadioSignal': 'mdi-waveform',
        'RhymeSquad': 'mdi-microphone-variant',
        'SpelledRosco': 'mdi-alphabetical-variant',
        'SymmetryBreaker': 'mdi-reflect-horizontal',
        'WordConstruction': 'mdi-hammer-wrench'
    };
    return icons[name] || 'mdi-controller';
};

const reelStyle = computed(() => ({
  transform: `translateY(-${reelPosition.value}px)`,
  transition: isSpinning.value ? `transform ${duration}ms cubic-bezier(0.15, 0, 0.15, 1)` : 'none'
}));

const isSpinning = ref(false);

let spinTimeout1 = null;
let spinTimeout2 = null;

const startSpin = () => {
  isSpinning.value = true;
  const itemHeight = 100; // Altura de cada slot item
  const targetIndex = props.games.indexOf(props.targetGame);
  
  // Girar varias vueltas y aterrizar en el target
  const extraLaps = 2;
  const totalItems = props.games.length;
  const finalIndex = (extraLaps * totalItems) + targetIndex;
  
  spinTimeout1 = setTimeout(() => {
    reelPosition.value = finalIndex * itemHeight;
  }, 100);

  spinTimeout2 = setTimeout(() => {
    isSpinning.value = false;
    emit('finished');
  }, duration + 500);
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    // Limpiar timeouts anteriores para evitar conflictos entre rondas
    if (spinTimeout1) clearTimeout(spinTimeout1);
    if (spinTimeout2) clearTimeout(spinTimeout2);
    isSpinning.value = false;
    reelPosition.value = 0;
    setTimeout(startSpin, 500);
  }
});
</script>

<style scoped>
.roulette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 9999;
}

.roulette-container {
  background: rgba(10, 25, 41, 0.95);
  border: 2px solid #00e5ff;
  box-shadow: 0 0 50px rgba(0, 229, 255, 0.3);
  width: 90%;
  max-width: 500px;
}

.slot-machine-wrapper {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  overflow: hidden;
  height: 100px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.slot-window {
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.slot-item {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.selected-glow {
  text-shadow: 0 0 15px #00e5ff;
  color: #00e5ff !important;
  transform: scale(1.1);
}

.tracking-widest {
  letter-spacing: 0.2em;
}
</style>
