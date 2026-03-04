<template>
  <div class="space-race-map" :class="{ 'hyperspace-active': isHyperspace, 'mini-overlay': miniMode }">
    <!-- Solo mostrar el mini-mapa simplificado si es miniMode -->
    <template v-if="miniMode">
      <div class="mini-hud-horizontal">
         <div class="mini-timer d-flex align-center">
            <v-icon icon="mdi-timer-outline" size="small" color="cyan-accent-2" class="mr-2"></v-icon>
            {{ formatTime(remainingTime) }}
         </div>
         <div class="mini-circuit-container">
            <svg viewBox="0 0 1000 400">
               <path :d="circuitPath" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="40" stroke-linecap="round" />
               <path :d="circuitPath" fill="none" stroke="rgba(0, 229, 255, 0.4)" stroke-width="4" stroke-dasharray="10 10" />
               <!-- Amenaza -->
               <circle :cx="threatCoords.x" :cy="threatCoords.y" r="40" fill="#f43f5e" class="mini-glow-red" />
               <!-- Equipos -->
               <circle 
                  v-for="team in teams" 
                  :key="'m-'+team.id"
                  :cx="getTeamCoords(team).x" 
                  :cy="getTeamCoords(team).y" 
                  r="30" 
                  :fill="isPlayerInTeam(team) ? '#00e5ff' : (team.isBot ? '#64748b' : '#f59e0b')"
                  class="mini-glow-cyan"
               />
            </svg>
         </div>
      </div>
    </template>

    <template v-else>
      <!-- Fondo Minimalista (Sin estrellas para efecto silueta) -->
      <div class="space-bg-minimal"></div>

      <!-- Circuito Curvo (SVG Principal con Efecto Silueta) -->
      <svg class="main-circuit" viewBox="0 0 1000 400">
        <!-- Glow Intenso del Camino -->
        <path 
          :d="circuitPath" 
          fill="none" 
          stroke="rgba(0, 229, 255, 0.4)" 
          stroke-width="20" 
          stroke-linecap="round"
          class="path-glow-external"
        />
        <path 
          :d="circuitPath" 
          fill="none" 
          stroke="rgba(0, 229, 255, 0.2)" 
          stroke-width="12" 
          stroke-linecap="round"
        />
        <!-- Línea del Camino (Silueta) -->
        <path 
          id="racePath"
          :d="circuitPath" 
          fill="none" 
          stroke="#fff" 
          stroke-width="1" 
          stroke-dasharray="8 8"
          opacity="0.6"
        />

        <!-- Checkpoints Minimalistas (Solo puntos de luz) -->
        <g v-for="(point, i) in checkpointCoords" :key="'cp-'+i">
          <circle :cx="point.x" :cy="point.y" r="8" :class="'checkpoint-dot dp-' + (i+1)" />
          <text v-if="i > 0 && i < 4" :x="point.x" :y="point.y - 20" text-anchor="middle" class="checkpoint-label-minimal">P{{ i }}</text>
        </g>

        <!-- Amenaza (Simplificada) -->
        <g :transform="`translate(${threatCoords.x}, ${threatCoords.y})`" class="threat-minimal">
           <circle r="30" fill="rgba(244, 63, 94, 0.2)" class="threat-pulse-glow" />
           <v-icon :icon="getHazardIcon()" size="24" color="#f43f5e" x="-12" y="-12"></v-icon>
        </g>

        <!-- Naves de los Equipos (Siluetas) -->
        <g v-for="team in teams" :key="team.id" :transform="`translate(${getTeamCoords(team).x}, ${getTeamCoords(team).y})`">
          <circle r="15" :fill="isPlayerInTeam(team) ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255,255,255,0.1)'" class="ship-glow" />
          <v-icon 
            icon="mdi-rocket-launch" 
            :color="isPlayerInTeam(team) ? '#00e5ff' : (team.isBot ? '#64748b' : '#f59e0b')" 
            size="20" 
            x="-10" y="-10"
            :class="{ 'ship-float': true, 'my-ship-pulse': isPlayerInTeam(team) }"
          ></v-icon>
          <text y="-25" text-anchor="middle" class="team-label-minimal" :class="{ 'my-team-text': isPlayerInTeam(team) }">
            {{ team.id }}
          </text>
        </g>
      </svg>

      <!-- HUD Minimalista -->
      <div class="hud-minimal">
        <div class="timer-minimal">
          <span class="label">STATUS: </span>
          <span class="value" :class="{ 'critical': remainingTime < 30 }">{{ formatTime(remainingTime) }}</span>
        </div>
      </div>
    </template>

    <!-- Victory/Defeat Overlay -->
    <v-fade-transition>
      <div v-if="gameResult" class="game-result-overlay d-flex flex-column align-center justify-center">
        <v-icon :icon="gameResult === 'win' ? 'mdi-trophy' : 'mdi-skull'" size="120" :color="gameResult === 'win' ? 'amber' : 'error'"></v-icon>
        <h2 class="text-h2 font-weight-black mt-4" :class="gameResult === 'win' ? 'text-amber' : 'text-error'">
          {{ gameResult === 'win' ? '¡SISTEMA SALVADO!' : '¡MISIÓN FALLIDA!' }}
        </h2>
        <p class="text-h5 text-white mt-2">{{ resultSubtext }}</p>
      </div>
    </v-fade-transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';

const props = defineProps({
  teams: { type: Array, default: () => [] },
  hazardType: { type: String, default: 'BLACK_HOLE' },
  hazardProgress: { type: Number, default: 0 },
  timeLimit: { type: Number, default: 0 },
  startTime: { type: Number, default: Date.now },
  miniMode: { type: Boolean, default: false }
});

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();
const remainingTime = ref(props.timeLimit);
const isHyperspace = ref(false);
const gameResult = ref(null); // 'win' o 'lose'
const resultSubtext = ref('');
let timerInterval = null;

// Observar mensajes del servidor
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;
  if (msg.type === 'SPACE_RACE_WIN') {
    gameResult.value = 'win';
    resultSubtext.value = `El Equipo ${msg.winnerTeam} ha alcanzado el hiperespacio.`;
    triggerHyperspace();
  } else if (msg.type === 'SPACE_RACE_LOSE') {
    gameResult.value = 'lose';
    resultSubtext.value = msg.reason === 'HAZARD_CAUGHT' ? 'La amenaza os ha alcanzado...' : 'Se acabó el tiempo de evacuación.';
  }
});

// Camino Curvo definido por puntos Bezier
const circuitPath = "M 50 200 C 150 50, 350 50, 500 200 C 650 350, 850 350, 950 200";

// Coordenadas de los checkpoints (Planetas) a lo largo del path
const checkpointPercent = [0, 25, 50, 75, 100];
const checkpointCoords = computed(() => checkpointPercent.map(p => getPointOnPath(p)));

const threatCoords = computed(() => getPointOnPath(Math.min(props.hazardProgress, 100)));

const getTeamCoords = (team) => getPointOnPath(team.progress || 0);

// Función matemática para obtener un punto en el path SVG
// Simplificada para el ejemplo (en producción se usaría path.getPointAtLength())
function getPointOnPath(percent) {
  const t = percent / 100;
  // Implementación simplificada de la curva Bezier cúbica del path
  // P0=(50,200), P1=(150,50), P2=(350,50), P3=(500,200) - Primera mitad
  // P3=(500,200), P4=(650,350), P5=(850,350), P6=(950,200) - Segunda mitad
  if (t <= 0.5) {
    const t2 = t * 2;
    const x = bezier(50, 150, 350, 500, t2);
    const y = bezier(200, 50, 50, 200, t2);
    return { x, y };
  } else {
    const t2 = (t - 0.5) * 2;
    const x = bezier(500, 650, 850, 950, t2);
    const y = bezier(200, 350, 350, 200, t2);
    return { x, y };
  }
}

function bezier(p0, p1, p2, p3, t) {
  return Math.pow(1-t, 3)*p0 + 3*Math.pow(1-t, 2)*t*p1 + 3*(1-t)*Math.pow(t, 2)*p2 + Math.pow(t, 3)*p3;
}

const parallaxStyle = computed(() => {
  const avgProgress = props.teams.reduce((acc, t) => acc + (t.progress || 0), 0) / (props.teams.length || 1);
  return {
    transform: `translateX(-${avgProgress * 0.5}%)`
  };
});

const isPlayerInTeam = (team) => team.members.includes(astroStore.user);

const getHazardIcon = () => {
  switch (props.hazardType) {
    case 'BLACK_HOLE': return 'mdi-Invert-colors';
    case 'KRAKEN_SPACE': return 'mdi-skull';
    case 'SUPERNOVA': return 'mdi-flare';
    default: return 'mdi-alert';
  }
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getRandomStarStyle = () => ({
  top: Math.random() * 100 + '%',
  left: Math.random() * 200 + '%', // Más ancho para el parallax
  animationDelay: Math.random() * 5 + 's',
  opacity: Math.random() * 0.7 + 0.3,
  transform: `scale(${Math.random() * 1 + 0.5})`
});

function triggerHyperspace() {
  isHyperspace.value = true;
  setTimeout(() => {
    // La animación dura unos segundos
  }, 4000);
}

onMounted(() => {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - props.startTime) / 1000);
    remainingTime.value = Math.max(0, props.timeLimit - elapsed);
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.space-race-map {
  width: 100%;
  height: 400px;
  background: #010409;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(0, 229, 255, 0.1);
  box-shadow: inset 0 0 50px rgba(0, 229, 255, 0.05);
}

.space-bg-minimal {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at 50% 50%, #0a1120 0%, #010409 100%);
  z-index: 0;
}

/* SVG Circuit Silhouette */
.main-circuit {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
}

.path-glow-external {
  filter: blur(8px);
  opacity: 0.4;
}

.checkpoint-dot {
  fill: #1e293b;
  stroke: rgba(0, 229, 255, 0.3);
  stroke-width: 2;
  filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.2));
}

.checkpoint-label-minimal {
  fill: rgba(0, 229, 255, 0.5);
  font-size: 12px;
  font-weight: bold;
  font-family: 'Roboto Mono', monospace;
}

.threat-minimal {
  transition: all 0.5s linear;
}

.threat-pulse-glow {
  animation: pulse-threat-glow 1.5s infinite;
}

@keyframes pulse-threat-glow {
  0% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.5); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.2; }
}

.ship-glow {
  filter: blur(4px);
  opacity: 0.5;
}

.my-ship-pulse {
  animation: my-ship-glow 2s infinite;
}

@keyframes my-ship-glow {
  0%, 100% { filter: drop-shadow(0 0 2px #00e5ff); }
  50% { filter: drop-shadow(0 0 10px #00e5ff); }
}

.ship-float {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.team-label-minimal {
  fill: #64748b;
  font-size: 10px;
  font-weight: bold;
  font-family: 'Roboto Mono', monospace;
}

.my-team-text {
  fill: #00e5ff;
  font-size: 12px;
}

.hud-minimal {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0,0,0,0.5);
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(4px);
}

.timer-minimal {
  font-family: 'Roboto Mono', monospace;
  font-size: 18px;
  color: #fff;
}

.timer-minimal .label { color: #64748b; font-size: 10px; }
.timer-minimal .value.critical { color: #f43f5e; animation: blink 1s infinite; }

/* Estilos Mini Overlay (Minimapa) */
.mini-overlay {
  position: fixed !important;
  top: 20px;
  right: 20px;
  width: 320px !important;
  height: 140px !important;
  background: rgba(1, 4, 9, 0.8) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  z-index: 2100;
  padding: 12px;
  border-radius: 20px !important;
  box-shadow: 0 12px 48px rgba(0,0,0,0.6);
}

.mini-timer {
  font-family: 'Roboto Mono', monospace;
  font-size: 16px;
  color: #00e5ff;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
