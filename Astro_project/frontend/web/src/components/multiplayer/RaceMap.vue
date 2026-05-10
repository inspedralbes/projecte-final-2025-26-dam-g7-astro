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

      <!-- COHETES -->
      <div
        class="player-rocket"
        :style="{ left: playerPos.x + '%', top: playerPos.y + '%' }"
      >
        <img src="/sci_fi_rocket_top_view_1778453796570.png" class="rocket-img" />
        <div class="rocket-engine-glow" />
      </div>

      <div
        class="partner-rocket"
        :style="{ left: partnerPos.x + '%', top: partnerPos.y + '%' }"
      >
        <img src="/sci_fi_rocket_top_view_1778453796570.png" class="rocket-img partner-img" />
      </div>

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
        <v-tooltip activator="parent" location="top" offset="20">
          <div class="planet-tooltip-content pa-2">
            <div class="text-subtitle-1 font-weight-bold">{{ planet.name }}</div>
            <div v-if="planet.game" class="text-caption text-cyan-accent-2">
              MISSIÓ: {{ $t('games.' + planet.game) || planet.game }}
            </div>
            <div v-else class="text-caption text-grey">PUNT DE CONTROL</div>
          </div>
        </v-tooltip>

        <div class="planet-icon-wrapper">
          <img :src="planet.img" class="planet-image" />
          <div class="planet-glow" />
        </div>
        <div class="planet-label">{{ planet.name }}</div>
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
    'START': { name: 'Estació Base', x: 10, y: 50, img: '/Astronauta_blanc.jpg', neighbors: ['PLANET_1', 'PLANET_2'], game: null, anomaly: null },
    'PLANET_1': { name: 'Mart', x: 30, y: 30, img: '/planet_mars_futuristic_1778453321030.png', neighbors: ['PLANET_3'], game: 'WordConstruction', anomaly: 'meteorits' },
    'PLANET_2': { name: 'Venus', x: 30, y: 70, img: '/planet_venus_futuristic_1778453938668.png', neighbors: ['PLANET_3', 'PLANET_4'], game: 'RadarScan', anomaly: 'nebulosa' },
    'PLANET_3': { name: 'Júpiter', x: 60, y: 30, img: '/planet_jupiter_futuristic_1778453635180.png', neighbors: ['FINISH'], game: 'RadioSignal', anomaly: 'raig-alienigena' },
    'PLANET_4': { name: 'Saturn', x: 60, y: 70, img: '/planet_saturn_futuristic_1778453954991.png', neighbors: ['FINISH'], game: 'SymmetryBreaker', anomaly: 'raig-tempesta' },
    'FINISH': { name: 'Alfa Centauri', x: 90, y: 50, img: '/planet_crystal_nexus_1778453706790.png', neighbors: [], game: 'SpelledRosco', anomaly: null }
  }

  const currentPlanetId = computed(() => multiplayerStore.raceProgress)

  const partnerPlanetId = computed(() => multiplayerStore.partnerProgress)

  const playerPos = computed(() => ({
    x: planets[currentPlanetId.value].x,
    y: planets[currentPlanetId.value].y
  }))

  const partnerPos = computed(() => ({
    x: planets[partnerPlanetId.value].x + 4,
    y: planets[partnerPlanetId.value].y + 4
  }))

  const partnerAvatar = computed(() => {
    if (!multiplayerStore.room) return '/Astronauta_blanc.jpg'
    const op = multiplayerStore.room.players.find(p => (p.username || p) !== astroStore.user)
    const name = op?.username || op
    const explorer = astroStore.explorers?.find(e => e.user === name)
    return explorer?.avatar ? `/${explorer.avatar}` : '/Astronauta_blanc.jpg'
  })

  function isPlanetAvailable (id) {
    if (id === 'START') return true
    // Disponible si es vecino de un planeta completado
    return Object.entries(planets).some(([planetId, data]) => {
      return multiplayerStore.completedPlanets.includes(planetId) && data.neighbors.includes(id)
    })
  }

  function isPlanetCompleted (id) {
    return multiplayerStore.completedPlanets.includes(id)
  }

  function isPathUnlocked (id1, id2) {
    // El camino está desbloqueado si el primer planeta está completado
    return multiplayerStore.completedPlanets.includes(id1)
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

.player-rocket {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%) rotate(90deg);
  z-index: 50;
  transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.partner-rocket {
  position: absolute;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%) rotate(90deg);
  z-index: 45;
  transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  opacity: 0.7;
}

.rocket-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 10px #00e5ff);
}

.partner-img {
  filter: drop-shadow(0 0 5px #ff5252);
}

.rocket-engine-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 10px;
  background: #00e5ff;
  filter: blur(10px);
  transform: translateX(-50%);
  border-radius: 50%;
  animation: engine-pulse 0.2s infinite alternate;
}

@keyframes engine-pulse {
  from { opacity: 0.5; transform: translateX(-50%) scale(1); }
  to { opacity: 1; transform: translateX(-50%) scale(1.5); }
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

.planet-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.planet-node:hover .planet-image {
  transform: scale(1.2) rotate(5deg);
}

.planet-tooltip-content {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #00e5ff;
  border-radius: 8px;
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

.node-current .planet-image {
  filter: drop-shadow(0 0 20px #00e5ff);
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
