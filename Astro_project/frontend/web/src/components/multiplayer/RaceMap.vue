<template>
  <div class="race-map-container">
    <div class="map-header">
      <h2 class="text-h4 font-weight-black text-white glow-text">MAPA DE NAVEGACIÓ</h2>
      <p class="text-subtitle-2 text-cyan-accent-2">TRIA EL TEU PRÒXIM DESTÍ</p>
    </div>

    <div class="map-viewport" ref="mapRef">
      <svg class="path-lines">
        <template v-for="(planet, id) in planets" :key="'line-' + id">
          <line
            v-for="neighborId in planet.neighbors"
            :key="id + '-' + neighborId"
            :x1="planet.x + '%'"
            :y1="planet.y + '%'"
            :x2="planets[neighborId].x + '%'"
            :y2="planets[neighborId].y + '%'"
            class="map-line"
            :class="{ 'line-active': isPathUnlocked(id, neighborId) }"
          />
        </template>
      </svg>

      <div
        v-for="(planet, id) in planets"
        :key="id"
        class="planet-node"
        :style="{ left: planet.x + '%', top: planet.y + '%' }"
        :class="{
          'node-available': isPlanetAvailable(id),
          'node-completed': isPlanetCompleted(id),
          'node-current': currentPlanetId === id
        }"
        @click="handlePlanetClick(id)"
      >
        <div class="planet-icon-wrapper">
          <v-icon :icon="planet.icon" :size="currentPlanetId === id ? 48 : 32" />
          <div class="planet-glow" />
        </div>
        <div class="planet-label">{{ planet.name }}</div>
        
        <!-- Marcador del Rival -->
        <div v-if="partnerPlanetId === id" class="rival-marker">
          <v-avatar size="24" class="border-red">
            <v-img :src="partnerAvatar" />
          </v-avatar>
        </div>
      </div>
    </div>

    <div class="map-footer d-flex justify-space-between align-center px-8">
      <div class="fuel-info d-flex align-center">
        <v-icon icon="mdi-gas-station" color="orange" class="mr-2" />
        <span class="text-h6 font-weight-bold text-orange">{{ Math.floor(multiplayerStore.raceFuel) }}%</span>
      </div>
      <div class="finish-info">
        <span class="text-overline text-grey">PROGRESSIÓ</span>
        <div class="progress-dots d-flex gap-1">
          <div 
            v-for="i in 5" 
            :key="i" 
            class="dot" 
            :class="{ 'dot-active': multiplayerStore.raceProgress >= i }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'
  import { useAstroStore } from '@/stores/astroStore'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const emit = defineEmits(['select-planet'])

  const planets = {
    'START': { name: 'Estació Base', x: 10, y: 50, icon: 'mdi-satellite-variant', neighbors: ['PLANET_1', 'PLANET_2'], game: null },
    'PLANET_1': { name: 'Mart', x: 30, y: 30, icon: 'mdi-planet', neighbors: ['PLANET_3'], game: 'WordConstruction' },
    'PLANET_2': { name: 'Venus', x: 30, y: 70, icon: 'mdi-planet', neighbors: ['PLANET_3', 'PLANET_4'], game: 'RadarScan' },
    'PLANET_3': { name: 'Júpiter', x: 60, y: 30, icon: 'mdi-planet', neighbors: ['FINISH'], game: 'RadioSignal' },
    'PLANET_4': { name: 'Saturn', x: 60, y: 70, icon: 'mdi-planet', neighbors: ['FINISH'], game: 'SymmetryBreaker' },
    'FINISH': { name: 'Alfa Centauri', x: 90, y: 50, icon: 'mdi-flag-checkered', neighbors: [], game: 'SpelledRosco' }
  }

  const currentPlanetId = computed(() => {
    // Mapear raceProgress a planetas (simplificado por ahora)
    const keys = Object.keys(planets)
    return keys[multiplayerStore.raceProgress] || 'START'
  })

  const partnerPlanetId = computed(() => {
    const keys = Object.keys(planets)
    return keys[multiplayerStore.partnerProgress] || 'START'
  })

  const partnerAvatar = computed(() => {
    if (!multiplayerStore.room) return '/Astronauta_blanc.jpg'
    const op = multiplayerStore.room.players.find(p => (p.username || p) !== astroStore.user)
    const name = op?.username || op
    const explorer = astroStore.explorers?.find(e => e.user === name)
    return explorer?.avatar ? `/${explorer.avatar}` : '/Astronauta_blanc.jpg'
  })

  function isPlanetAvailable(id) {
    const planet = planets[currentPlanetId.value]
    return planet.neighbors.includes(id)
  }

  function isPlanetCompleted(id) {
    const keys = Object.keys(planets)
    return keys.indexOf(id) < keys.indexOf(currentPlanetId.value)
  }

  function isPathUnlocked(id1, id2) {
    return isPlanetCompleted(id1) && (id1 === currentPlanetId.value || isPlanetCompleted(id2))
  }

  function handlePlanetClick(id) {
    if (isPlanetAvailable(id)) {
      const cost = 15
      if (multiplayerStore.raceFuel >= cost) {
        multiplayerStore.consumeFuel(cost)
        emit('select-planet', { id, game: planets[id].game })
      } else {
        // Notificar falta de combustible?
      }
    }
  }
</script>

<style scoped>
.race-map-container {
  width: 100%;
  height: 100vh;
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-header {
  padding: 40px;
  text-align: center;
  z-index: 10;
}

.map-viewport {
  flex-grow: 1;
  position: relative;
  margin: 0 100px;
}

.path-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-line {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 4;
  stroke-dasharray: 10;
}

.line-active {
  stroke: #00e5ff;
  stroke-dasharray: none;
  filter: drop-shadow(0 0 5px #00e5ff);
}

.planet-node {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.planet-icon-wrapper {
  width: 60px;
  height: 60px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #64748b;
}

.node-available .planet-icon-wrapper {
  border-color: #00e5ff;
  color: #00e5ff;
  animation: pulse-available 2s infinite;
}

.node-completed .planet-icon-wrapper {
  background: #00e5ff;
  border-color: #00e5ff;
  color: #020617;
}

.node-current .planet-icon-wrapper {
  border-color: #facc15;
  color: #facc15;
  transform: scale(1.2);
}

.planet-label {
  margin-top: 10px;
  font-weight: 900;
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.node-available .planet-label { color: white; }

.rival-marker {
  position: absolute;
  top: -15px;
  right: -15px;
  animation: bounce 1s infinite alternate;
}

.map-footer {
  height: 100px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 229, 255, 0.2);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
}
.dot-active {
  background: #00e5ff;
  box-shadow: 0 0 10px #00e5ff;
}

@keyframes pulse-available {
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(0, 229, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-5px); }
}

.glow-text {
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
}
</style>
