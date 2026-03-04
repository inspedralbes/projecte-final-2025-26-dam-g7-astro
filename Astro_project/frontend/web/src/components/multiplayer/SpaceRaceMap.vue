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
      <!-- Fondo Espacial Profundo con Parallax -->
      <div class="space-bg" :style="parallaxStyle">
        <div v-for="n in 100" :key="n" class="star" :style="getRandomStarStyle()"></div>
      </div>

      <!-- Túnel Hiperespacio (Efecto visual al ganar) -->
      <div v-if="isHyperspace" class="hyperspace-tunnel">
        <div v-for="n in 20" :key="'h-'+n" class="tunnel-ring"></div>
      </div>

      <!-- Circuito Curvo (SVG Principal) -->
      <svg class="main-circuit" viewBox="0 0 1000 400">
        <!-- Glow del Camino -->
        <path 
          :d="circuitPath" 
          fill="none" 
          stroke="rgba(0, 229, 255, 0.1)" 
          stroke-width="12" 
          stroke-linecap="round"
        />
        <!-- Línea del Camino -->
        <path 
          id="racePath"
          :d="circuitPath" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.2)" 
          stroke-width="2" 
          stroke-dasharray="10 10"
        />

        <!-- Planetas / Checkpoints -->
        <g v-for="(point, i) in checkpointCoords" :key="'cp-'+i">
          <circle :cx="point.x" :cy="point.y" r="20" :class="'planet-svg planet-' + (i+1)" />
          <text :x="point.x" :y="point.y + 35" text-anchor="middle" class="checkpoint-label">PLANETA {{ i + 1 }}</text>
        </g>

        <!-- Amenaza -->
        <g :transform="`translate(${threatCoords.x - 40}, ${threatCoords.y - 40})`" class="threat-g" :class="hazardType.toLowerCase()">
          <rect x="0" y="0" width="80" height="80" fill="transparent" />
          <foreignObject width="80" height="80">
            <div class="threat-visual d-flex flex-column align-center">
              <v-icon :icon="getHazardIcon()" size="40" color="white"></v-icon>
              <div class="text-7px font-weight-bold text-white mt-1">{{ hazardType.replace('_', ' ') }}</div>
            </div>
          </foreignObject>
        </g>

        <!-- Naves de los Equipos -->
        <g v-for="team in teams" :key="team.id" :transform="`translate(${getTeamCoords(team).x - 20}, ${getTeamCoords(team).y - 40})`">
          <foreignObject width="100" height="80" style="overflow: visible;">
            <div class="ship-container" :class="{ 'my-ship': isPlayerInTeam(team) }">
              <v-icon icon="mdi-rocket-launch" :color="team.isBot ? '#94a3b8' : '#00e5ff'" size="24" class="ship-icon"></v-icon>
              <div class="ship-tag">
                <span class="text-7px font-weight-black">EQ {{ team.id }}</span>
                <v-icon v-if="team.isBot" icon="mdi-robot" size="8" class="ml-1"></v-icon>
              </div>
            </div>
          </foreignObject>
        </g>
      </svg>

      <!-- HUD de Información -->
      <div class="hud-info">
        <div class="evacuation-timer text-right">
          <div class="text-overline text-cyan-accent-2 line-height-1">SALTO HIPERESPACIAL EN</div>
          <div class="time-value" :class="{ 'critical-time': remainingTime < 30 }">
            {{ formatTime(remainingTime) }}
          </div>
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
  background: #020617;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 229, 255, 0.2);
  margin-bottom: 20px;
}

.space-bg { 
  position: absolute; 
  width: 200%; 
  height: 100%; 
  z-index: 0; 
  transition: transform 0.5s linear;
}

.star {
  position: absolute;
  width: 2px; height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 4s infinite;
}

/* SVG Circuit */
.main-circuit {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
}

.checkpoint-label {
  fill: #94a3b8;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
}

.planet-svg {
  filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
}

.planet-1 { fill: #444; }
.planet-2 { fill: #5b21b6; }
.planet-3 { fill: #166534; }
.planet-4 { fill: #991b1b; }
.planet-5 { fill: #0369a1; }

/* Ship Visuals */
.ship-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.ship-icon {
  filter: drop-shadow(0 0 5px currentColor);
}

.my-ship .ship-icon {
  transform: scale(1.3);
  filter: drop-shadow(0 0 10px #00e5ff);
}

.ship-tag {
  background: rgba(0,0,0,0.8);
  padding: 1px 6px;
  border-radius: 10px;
  margin-top: 4px;
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
}

.my-ship .ship-tag {
  border-color: #00e5ff;
  background: rgba(0, 229, 255, 0.2);
}

/* Threat Visuals */
.threat-visual {
  animation: pulse-threat 2s infinite;
}

.black_hole .threat-visual { color: #a855f7; }
.kraken_space .threat-visual { color: #10b981; }
.supernova .threat-visual { color: #ef4444; }

@keyframes pulse-threat {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

/* Estilos Mini Overlay (Minimapa durante el juego) */
.mini-overlay {
  position: fixed !important;
  top: 20px;
  right: 20px;
  width: 280px !important;
  height: 120px !important;
  background: rgba(10, 25, 41, 0.7) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 229, 255, 0.4) !important;
  z-index: 2100;
  padding: 10px;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  margin-bottom: 0px !important;
}

.mini-hud-horizontal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mini-timer {
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  color: white;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.mini-circuit-container {
  flex: 1;
}

.mini-circuit-container svg {
  width: 100%;
  height: 100%;
}

.mini-glow-cyan {
  filter: drop-shadow(0 0 5px #00e5ff);
}

.mini-glow-red {
  filter: drop-shadow(0 0 5px #f43f5e);
}

@keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
