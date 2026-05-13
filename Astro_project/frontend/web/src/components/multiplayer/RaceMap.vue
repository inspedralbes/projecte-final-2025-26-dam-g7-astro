<template>
  <div class="race-map-container">
    <div class="map-header">
      <h2 class="text-h4 font-weight-black text-white glow-text">CARTA DE NAVEGACIÓ</h2>
      <p class="text-subtitle-2 text-cyan-accent-2">PLANIFICA LA TEVA RUTA I GESTIONA EL COMBUSTIBLE</p>
    </div>

    <div class="map-viewport" ref="mapRef">
      <!-- LÍNEAS DE CONEXIÓN -->
      <svg class="path-lines">
        <template v-for="(node, id) in nodes" :key="'line-' + id">
          <line
            v-for="neighborId in node.neighbors"
            :key="id + '-' + neighborId"
            :x1="node.x + '%'"
            :y1="node.y + '%'"
            :x2="(nodes[neighborId]?.x || 0) + '%'"
            :y2="(nodes[neighborId]?.y || 0) + '%'"
            class="map-line"
            :class="{ 
              'line-active': isPathUnlocked(id, neighborId),
              'line-option': isPathOption(id, neighborId)
            }"
          />
        </template>
        
        <!-- RASTRES DE TOTS ELS JUGADORS (Incluyendo tramo activo) -->
        <template v-for="(player, uname) in playersProgressWithHistory" :key="'trail-' + uname">
          <template v-for="(pId, i) in player.history" :key="'trail-line-' + uname + '-' + i">
            <line
              v-if="i < player.history.length - 1 && nodes[pId] && nodes[player.history[i+1]]"
              :x1="nodes[pId].x + '%'"
              :y1="nodes[pId].y + '%'"
              :x2="nodes[player.history[i+1]].x + '%'"
              :y2="nodes[player.history[i+1]].y + '%'"
              class="trail-line"
              :style="{ stroke: getPlayerColor(uname), opacity: uname === astroStore.user ? 0.8 : 0.4 }"
            />
          </template>
        </template>
      </svg>

      <!-- NAUS DE TOTS ELS JUGADORS -->
      <template v-for="player in multiplayerStore.room?.players" :key="'ship-' + (player.username || player)">
        <div 
          v-if="nodes[multiplayerStore.playersProgress[player.username || player] || 'START']"
          class="player-rocket"
          style="pointer-events: none;"
          :class="{ 
            'local-rocket': (player.username || player) === astroStore.user,
            'is-stunned': (player.username || player) === astroStore.user && multiplayerStore.isStunned 
          }"
          :style="{ 
            left: nodes[multiplayerStore.playersProgress[player.username || player] || 'START'].x + '%', 
            top: nodes[multiplayerStore.playersProgress[player.username || player] || 'START'].y + '%', 
            transform: `translate(-50%, -50%) rotate(${shipRotations[player.username || player] || 90}deg)` 
          }"
        >
          <!-- Icono de Nave en lugar de Avatar -->
          <div class="ship-icon-container" :style="{ color: getPlayerColor(player.username || player) }">
            <v-icon size="42" class="ship-v-icon">mdi-rocket</v-icon>
            <div class="ship-engine-fire" />
          </div>
          
          <div 
            class="player-name-tag" 
            :style="{ transform: `rotate(${- (shipRotations[player.username || player] || 90)}deg)` }"
          >
            {{ (player.username || player) === astroStore.user ? 'TÚ' : (player.username || player) }}
          </div>
          <div v-if="(player.username || player) === astroStore.user" class="rocket-glow" />
        </div>
      </template>

      <!-- NODOS (PLANETAS E ICONOS) -->
      <div
        v-for="(node, id) in nodes"
        :key="id"
        class="map-node"
        :style="{ left: node.x + '%', top: node.y + '%' }"
        :class="{
          'node-available': isNodeAvailable(id),
          'node-completed': isNodeCompleted(id),
          'node-current': currentNodeId === id,
          'node-special': node.type !== 'planet'
        }"
        @click.stop="handleNodeClick(id)"
      >
        <v-tooltip activator="parent" location="top" offset="20">
          <div class="map-tooltip-content pa-3">
            <div class="text-subtitle-1 font-weight-bold">{{ node.name }}</div>
            <v-divider color="cyan" class="my-2" />
            
            <!-- Previsualización del Evento -->
            <div class="event-preview mt-2 pt-2 border-top-thin">
              <div v-if="node.game" class="d-flex flex-column text-amber-accent-2 mb-2 bg-black-opacity-50 pa-2 rounded-lg border-amber">
                <div class="d-flex align-center mb-1">
                  <v-icon size="20" class="mr-2">mdi-controller-classic</v-icon>
                  <span class="text-subtitle-2 font-weight-black">MISSIÓ DE JOC</span>
                </div>
                <div class="text-h6 font-weight-black text-white ml-7">{{ $t('games.' + node.game) || node.game }}</div>
              </div>

              <template v-if="node.type === 'fuel'">
                <div class="d-flex align-center text-orange-accent-2">
                  <v-icon size="16" class="mr-2">mdi-gas-station</v-icon>
                  <span class="text-caption">+25% Combustible</span>
                </div>
              </template>
              <template v-else-if="node.type === 'coins'">
                <div class="d-flex align-center text-yellow-accent-4">
                  <v-icon size="16" class="mr-2">mdi-gold</v-icon>
                  <span class="text-caption">+250 AstroMonedas</span>
                </div>
                <div class="text-caption text-red-accent-1 ml-6">(Cost Fuel x2 per càrrega pesada)</div>
              </template>
              <template v-else-if="node.type === 'battle'">
                <div class="d-flex align-center text-red-accent-2">
                  <v-icon size="16" class="mr-2">mdi-sword-cross</v-icon>
                  <span class="text-caption font-weight-black">DUEL 1vs1 (MARIO PARTY STYLE)</span>
                </div>
                <div class="text-caption text-white ml-6">El perdedor es queda paralitzat 30 segons!</div>
                <div v-if="isNodeClaimed(id)" class="text-subtitle-2 font-weight-black text-red-accent-2">
                  <v-icon size="20" class="mr-2">mdi-block-helper</v-icon>
                  CAMÍ BLOQUEJAT PER RIVAL
                </div>
              </template>
              <template v-else-if="node.anomaly === 'nebulosa'">
                <div class="d-flex align-center text-purple-accent-1">
                  <v-icon size="16" class="mr-2">mdi-weather-dust</v-icon>
                  <span class="text-caption">Boira (Visibilitat -50%)</span>
                </div>
              </template>
              <!-- ... -->
            </div>
          </div>
        </v-tooltip>

        <div class="node-content" :class="{ 'goal-node': node.isGoal, 'node-claimed': isNodeClaimed(id) }">
          <div v-if="node.type === 'planet' || node.type === 'mystery' || node.type === 'coins' || node.type === 'battle'" class="planet-container" :class="node.type">
            <v-icon v-if="node.isGoal" color="amber-accent-4" size="48" class="goal-icon">mdi-trophy-variant</v-icon>
            <v-icon v-else-if="isNodeClaimed(id)" color="grey-darken-1" size="32">mdi-lock</v-icon>
            <v-icon v-else-if="node.type === 'battle'" color="red-accent-2" size="40">mdi-sword-cross</v-icon>
            <v-icon v-else-if="node.type === 'coins'" color="yellow-accent-4" size="36">mdi-gold</v-icon>
            <v-icon v-else-if="node.type === 'mystery'" color="white" size="32" class="mystery-icon">mdi-help-circle-outline</v-icon>
            <v-icon v-else-if="node.icon" color="cyan-accent-2" size="48">{{ node.icon }}</v-icon>
            <img v-else-if="node.img" :src="node.img" class="planet-img" />
            <v-icon v-else color="cyan-accent-2" size="48">mdi-planet</v-icon>
            <div class="planet-glow" :class="{ 'goal-glow': node.isGoal, 'coins-glow': node.type === 'coins', 'battle-glow': node.type === 'battle', 'claimed-glow': isNodeClaimed(id) }" />
          </div>
          <div v-else-if="node.type === 'fuel'" class="fuel-node" :class="{ 'node-claimed': isNodeClaimed(id) }">
            <v-icon color="orange-accent-3" size="32">mdi-gas-station</v-icon>
          </div>
          <div class="node-label" :class="{ 'goal-label': node.isGoal, 'battle-label': node.type === 'battle' }">{{ node.name }}</div>
        </div>
      </div>
    </div>

    <!-- FOOTER INFO -->
    <div class="map-footer d-flex align-center justify-space-between px-8">
      <div class="d-flex align-center">
        <v-icon color="cyan-accent-2" class="mr-2">mdi-information-outline</v-icon>
        <span class="text-caption text-cyan-accent-1">FES CLICK EN UN PLANETA ADJACENT PER SALTAR</span>
      </div>
      <div class="d-flex align-center">
        <v-chip size="small" color="orange" variant="outlined" class="mr-4">
          COST DE SALT: 15u
        </v-chip>
      </div>
    </div>
    
    <!-- LLEGENDA DEL MAPA -->
    <div class="map-legend pa-4 rounded-xl">
      <div class="text-overline text-cyan-accent-2 mb-2 tracking-widest">LLEGENDA DE SECTOR</div>
      <div class="legend-item"><v-icon size="small" color="cyan-accent-2" class="mr-2">mdi-planet</v-icon> <span>Planeta (Missió de Joc)</span></div>
      <div class="legend-item"><v-icon size="small" color="yellow-accent-4" class="mr-2">mdi-gold</v-icon> <span>Mina d'Or (+250 AstroCoins)</span></div>
      <div class="legend-item"><v-icon size="small" color="orange-accent-3" class="mr-2">mdi-gas-station</v-icon> <span>Estació Fuel (+25%)</span></div>
      <div class="legend-item"><v-icon size="small" color="red-accent-2" class="mr-2">mdi-sword-cross</v-icon> <span>Arena de Duel (1vs1)</span></div>
      <div class="legend-item"><v-icon size="small" color="white" class="mr-2">mdi-help-circle-outline</v-icon> <span>Sector Desconegut (?)</span></div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, watch, onMounted } from 'vue'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'
  import { useAstroStore } from '@/stores/astroStore'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()
  const emit = defineEmits(['select-planet', 'map-ready'])

  // --- ESTADO DE MOVIMIENTO Y RASTRO ---
  const shipRotations = ref({})

  // Inicializar historial
  onMounted(() => {
    // Inicializar rotaciones
    if (multiplayerStore.room?.players) {
      multiplayerStore.room.players.forEach(p => {
        shipRotations.value[p.username || p] = 90
      })
    }
  })


  function getPlayerColor(username) {
    if (username === astroStore.user) return '#00e5ff'
    const colors = ['#f50057', '#00e676', '#ffea00', '#d500f9', '#ff9100', '#2979ff']
    const idx = (username.length + username.charCodeAt(0)) % colors.length
    return colors[idx]
  }

  function getPlayerAvatar (username) {
    if (!username) return '/Astronauta_blanc.jpg'
    if (username === astroStore.user) {
      return getAvatarUrl(astroStore.avatar, username)
    }
    const explorer = astroStore.explorers?.find(e => e.user === username)
    if (explorer) {
      return getAvatarUrl(explorer.avatar, username)
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
  }

  function getAvatarUrl (avatarName, username) {
    if (avatarName && typeof avatarName === 'string' && (avatarName.includes('.jpg') || avatarName.includes('.png'))) {
      return `/${avatarName.trim()}`
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
  }

  const planetPool = [
    { name: 'Mart', img: '/planet_mars_futuristic_1778453321030.png' },
    { name: 'Venus', img: '/planet_venus_futuristic_1778453938668.png' },
    { name: 'Júpiter', img: '/planet_jupiter_futuristic_1778453635180.png' },
    { name: 'Saturn', img: '/planet_saturn_futuristic_1778453954991.png' },
    { name: 'Neptú', img: '/planet_crystal_nexus_1778453706790.png' },
    { name: 'Osiris', img: '/planet_mars_futuristic_1778453321030.png' },
    { name: 'Arcadia', img: '/planet_venus_futuristic_1778453938668.png' },
    { name: 'Nova Prime', img: '/planet_jupiter_futuristic_1778453635180.png' },
    { name: 'Gliese-581', img: '/planet_saturn_futuristic_1778453954991.png' }
  ]
  const gamePool = ['WordConstruction', 'RadioSignal', 'RadarScan', 'SymmetryBreaker', 'SyllableQuest', 'RhymeSquad', 'SpelledRosco']
  const anomalyPool = ['nebulosa', 'meteorits', 'raig-tempesta', 'raton-mirall', null]

  const nodes = computed(() => {
    const seed = (multiplayerStore.room?.id || 'BASE') + (multiplayerStore.room?.gameConfig?.seed || '')
    const seedSum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // Barajar gamePool basado en el seed para que cada sala tenga juegos distintos al inicio
    const shuffledGames = [...gamePool].sort((a, b) => {
      const valA = Math.sin(seedSum + a.length)
      const valB = Math.sin(seedSum + b.length)
      return valA - valB
    })

    const random = (idx) => {
      const x = Math.sin(seedSum + idx) * 10000
      return x - Math.floor(x)
    }

    const baseNodes = {
      'START': { name: 'Base Alpha', x: 5, y: 50, type: 'planet', icon: 'mdi-space-station', neighbors: [], game: null, anomaly: null },
      'FINISH': { name: 'META FINAL', x: 95, y: 50, type: 'planet', img: '/planet_crystal_nexus_1778453706790.png', neighbors: [], game: 'SpelledRosco', anomaly: null, isGoal: true }
    }

    const generatedNodes = {}
    const playersCount = multiplayerStore.room?.players?.length || 2
    // Mínimo de columnas = jugadores * 2 + 4, para que todos puedan jugar al menos 2 partidas
    const columns = Math.max(8, playersCount * 2 + 4)
    
    let lastColumnIds = ['START']

    for (let c = 1; c <= columns; c++) {
      // Embudo PROPORCIONAL garantizado:
      //  0%–40%  → Zona AMPLIA: al menos un nodo por jugador
      //  40%–70% → Zona MEDIA:  reducción gradual
      //  70%–100%→ Zona FINAL:  convergencia 1–2 nodos hacia la meta
      const phase = c / columns
      let numNodes
      if (phase < 0.4) {
        // Fase inicial: al menos playersCount nodos para que cada jugador tenga camino propio
        // Fase inicial: garantizamos suficientes nodos para objetivos + planetas jugables
        numNodes = Math.max(playersCount + 3, Math.ceil(playersCount * 1.5)) + Math.floor(random(c) * 2)
      } else if (phase < 0.7) {
        // Fase media: reducción gradual suave de playersCount → playersCount/3
        const fadeFactor = 1 - ((phase - 0.4) / 0.3) // 1.0 → 0.0
        const maxN = Math.max(2, Math.ceil(playersCount * 0.6))
        const minN = Math.max(2, Math.ceil(playersCount * 0.25))
        numNodes = Math.round(minN + fadeFactor * (maxN - minN)) + 1 + Math.floor(random(c) * 2)
      } else {
        // Fase final: 1–3 nodos, embudo hacia la meta
        numNodes = 1 + Math.floor(random(c) * 2)
      }

      const currentColumnIds = []
      
      for (let i = 0; i < numNodes; i++) {
        const id = `C${c}_N${i}`
        currentColumnIds.push(id)
        
        const r = random(c * 100 + i)
        let type = 'planet'
        
        const planetInfo = planetPool[Math.floor(random(c * 50 + i * 20) * planetPool.length)]
        
        // Jitter para evitar cuadrícula rígida
        const xJitter = (random(c * 13 + i) - 0.5) * 4 // +/- 2%
        const yJitter = (random(c * 7 + i) - 0.5) * 8 // +/- 4%
 
        generatedNodes[id] = {
          name: planetInfo.name,
          x: (c / (columns + 1)) * 90 + 5 + xJitter,
          y: (i + 1) * (100 / (numNodes + 1)) + yJitter,
          type: 'planet',
          neighbors: [],
          game: (() => {
            // Rotar la lista para asegurar variedad y evitar repeticiones en la misma columna
            const gameIdx = (c * 10 + i) % shuffledGames.length
            return shuffledGames[gameIdx]
          })(),
          anomaly: random(c + i + 55) > 0.8 ? anomalyPool[Math.floor(random(c + i) * anomalyPool.length)] : null,
          img: planetInfo.img,
          isBattle: false
        }
      }
      
      if (lastColumnIds.includes('START')) {
        baseNodes.START.neighbors = [...currentColumnIds]
      } else {
        lastColumnIds.forEach(prevId => {
          const prevNode = generatedNodes[prevId]
          currentColumnIds.forEach(currId => {
            const currNode = generatedNodes[currId]
            if (Math.abs(currNode.y - prevNode.y) < 45) prevNode.neighbors.push(currId)
          })
          if (prevNode.neighbors.length === 0) {
            prevNode.neighbors.push(currentColumnIds[Math.floor(random(prevId.length) * currentColumnIds.length)])
          }
        })
      }
      lastColumnIds = currentColumnIds
    }

    lastColumnIds.forEach(id => generatedNodes[id].neighbors.push('FINISH'))

    // ASIGNACIÓN DE OBJETIVOS SEGÚN CONFIGURACIÓN DEL LOBBY (Distribuida por columnas)
    const config = multiplayerStore.room?.gameConfig || {}
    const targets = [
      { type: 'battle',  count: config.numBattles      ?? 2, name: 'ARENA DE DUEL' },
      { type: 'coins',   count: config.numGoldMines    ?? 1, name: "MINA D'OR" },
      { type: 'fuel',    count: config.numFuelStations ?? 1, name: 'ESTACIÓ FUEL' },
      { type: 'mystery', count: config.numMysteryNodes ?? 3, name: 'SECTOR DESCONEGUT' }
    ]

    // Agrupar IDs por columna para repartir
    const nodesByCol = {}
    for (let c = 1; c <= columns; c++) {
      nodesByCol[c] = Object.keys(generatedNodes).filter(id => id.startsWith(`C${c}_`))
    }

    // Crear una lista de columnas barajada para repartir los objetivos por TODO el mapa
    let availableCols = []
    for (let i = 0; i < 3; i++) {
      // Ahora usamos todas las columnas dinámicas, no solo las 6 primeras
      const allCols = Array.from({ length: columns }, (_, index) => index + 1)
      const shuffled = allCols.sort(() => random(i + 123) - 0.5)
      availableCols = [...availableCols, ...shuffled]
    }

    let colIdx = 0
    targets.forEach(target => {
      for (let i = 0; i < target.count; i++) {
        // Buscar una columna de la lista barajada que tenga planetas libres
        let found = false
        let attempts = 0
        while (!found && attempts < availableCols.length) {
          const col = availableCols[colIdx % availableCols.length]
          colIdx++
          attempts++
          
          const possibleIds = nodesByCol[col].filter(id => generatedNodes[id].type === 'planet')
          if (possibleIds.length > 0) {
            const selectedId = possibleIds[Math.floor(random(i + colIdx) * possibleIds.length)]
            generatedNodes[selectedId].type = target.type
            generatedNodes[selectedId].name = target.name
            generatedNodes[selectedId].game = null
            
            // Si es un nodo misterio, le asignamos una anomalía obligatoria
            if (target.type === 'mystery') {
              generatedNodes[selectedId].anomaly = anomalyPool[Math.floor(random(selectedId.length) * anomalyPool.length)]
            }
            
            if (target.type === 'battle') generatedNodes[selectedId].isBattle = true
            found = true
          }
        }
      }
    })

    const generatedMap = { ...baseNodes, ...generatedNodes }
    emit('map-ready', generatedMap)
    return generatedMap
  })

  function calculateRotation(fromId, toId) {
    const from = nodes.value[fromId]
    const to = nodes.value[toId]
    if (!from || !to) return 90
    
    const dy = to.y - from.y
    const dx = to.x - from.x
    // atan2 devuelve radianes, sumamos 90 porque el icono apunta hacia arriba
    return (Math.atan2(dy, dx) * 180 / Math.PI) + 90
  }

  watch(() => multiplayerStore.playersProgress, (newProgress, oldProgress) => {
    if (!newProgress || !nodes.value) return
    for (const [uname, nodeId] of Object.entries(newProgress)) {
      const oldNodeId = oldProgress ? oldProgress[uname] : 'START'
      if (nodeId && oldNodeId && nodeId !== oldNodeId && nodes.value[nodeId] && nodes.value[oldNodeId]) {
        shipRotations.value[uname] = calculateRotation(oldNodeId, nodeId)
      }
    }
  }, { deep: true, immediate: true })

  // --- FUNCIONES DE ESTADO (Definidas antes de los computeds que las usan si fuera necesario) ---
  const isNodeCompleted = (id) => {
    return (multiplayerStore.completedPlanets || []).includes(id)
  }

  const isNodeClaimed = (id) => {
    if (id === 'START' || id === 'FINISH') return false
    
    // Un nodo está reclamado si CUALQUIER OTRO jugador ya lo ha completado
    // O si CUALQUIER OTRO jugador está actualmente en él (lo ha "saltado" pero no terminado el juego)
    let isClaimedByOthers = false
    
    for (const [uname, planets] of Object.entries(multiplayerStore.playersCompletedPlanets)) {
      if (uname !== astroStore.user && planets.includes(id)) {
        isClaimedByOthers = true
        break
      }
    }
    
    if (!isClaimedByOthers) {
      for (const [uname, nodeId] of Object.entries(multiplayerStore.playersProgress)) {
        if (uname !== astroStore.user && nodeId === id) {
          isClaimedByOthers = true
          break
        }
      }
    }
    
    const isBattleClaimed = (multiplayerStore.room?.gameConfig?.claimedNodes || []).includes(id)
    
    return isClaimedByOthers || isBattleClaimed
  }

  const isNodeAvailable = (id) => {
    if (id === 'START') return true
    if (isNodeClaimed(id)) return false
    if (multiplayerStore.raceFuel <= 0) return false // Fuera de combustible
    
    // Si es vecino del nodo actual (donde está la nave), está disponible
    const current = nodes.value[currentNodeId.value]
    if (current && current.neighbors.includes(id)) return true

    // También si es vecino de cualquier nodo ya completado
    return Object.entries(nodes.value).some(([nodeId, data]) => {
      return (multiplayerStore.completedPlanets || []).includes(nodeId) && data.neighbors.includes(id)
    })
  }

  const isPathUnlocked = (id1, id2) => {
    // Una línea se ilumina si el nodo de origen ya ha sido completado
    return isNodeCompleted(id1)
  }

  const isPathOption = (id1, id2) => {
    // Es una opción si sale del nodo actual hacia un vecino disponible
    return id1 === currentNodeId.value && nodes.value[id1]?.neighbors.includes(id2)
  }

  const currentNodeId = computed(() => multiplayerStore.raceProgress || 'START')
  
  // Helper para renderizar trails que incluyen la posición actual
  const playersProgressWithHistory = computed(() => {
    const combined = {}
    // Usamos todos los jugadores de la sala
    const players = multiplayerStore.room?.players || []
    players.forEach(p => {
      const uname = p.username || p
      const completed = multiplayerStore.playersCompletedPlanets[uname] || []
      const current = multiplayerStore.playersProgress[uname] || 'START'
      
      const history = ['START', ...completed]
      if (current !== 'START' && !history.includes(current)) {
        history.push(current)
      }
      
      combined[uname] = { history }
    })
    return combined
  })

  const partnerNodeId = computed(() => {
    const others = Object.keys(multiplayerStore.playersProgress).filter(u => u !== astroStore.user)
    return others.length > 0 ? multiplayerStore.playersProgress[others[0]] : 'START'
  })

  function handleNodeClick(id) {
    console.log('--- CLIC EN NODO DEL MAPA ---', id)
    if (!nodes.value[id]) {
      console.warn('ERROR: El nodo no existe en nodes.value')
      return
    }
    
    const node = nodes.value[id]
    console.log('DATOS DEL NODO:', { type: node.type, game: node.game, isBattle: node.isBattle })

    if (isNodeAvailable(id)) {
      console.log('Nodo disponible, procesando salto...')
      const node = nodes.value[id]
      
      // Bloqueo por STUN (Parálisis)
      if (multiplayerStore.isStunned) {
        // Podríamos mostrar un mensaje aquí
        return
      }

      let cost = 8
      if (node.type === 'coins') cost = 15
      if (node.type === 'mystery') cost = 4

      if (multiplayerStore.raceFuel >= cost || node.type === 'fuel') {
        if (node.type === 'fuel') {
          multiplayerStore.raceFuel = Math.min(100, multiplayerStore.raceFuel + 25)
        } else {
          multiplayerStore.consumeFuel(cost)
        }

        if (node.type === 'coins') {
          if (astroStore.addCoins) astroStore.addCoins(250)
          else astroStore.userCoins += 250
        }
        
        console.log('Emitiendo select-planet hacia el Lobby...')
        emit('select-planet', { id, node })
      } else {
        console.warn('Combustible insuficiente para este salto. Coste:', cost, 'Disponible:', multiplayerStore.raceFuel)
      }
    } else {
      console.warn('El nodo no está disponible para saltar desde la posición actual.')
    }
  }
</script>

<style scoped>
.race-map-container {
  width: 100%;
  height: 100vh;
  /* Eliminamos el fondo redundante para usar el del Lobby */
  background: transparent;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-header { 
  margin-top: 60px;
  padding: 30px; 
  text-align: center; 
  z-index: 10; 
}

.ship-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 10px currentColor);
}

.ship-v-icon {
  filter: drop-shadow(0 0 5px rgba(255,255,255,0.5));
}

.ship-engine-fire {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 15px;
  background: linear-gradient(to top, transparent, #ff9100, #ffea00);
  border-radius: 50%;
  animation: flicker 0.1s infinite alternate;
  z-index: -1;
}

@keyframes flicker {
  from { height: 10px; opacity: 0.8; }
  to { height: 18px; opacity: 1; }
}
.map-viewport { flex-grow: 1; position: relative; margin: 0 100px; }

.path-lines { 
  position: absolute; 
  inset: 0; 
  width: 100%; 
  height: 100%; 
  z-index: 1; 
  pointer-events: none !important; /* BLOQUEO TOTAL PARA QUE NO ROBE CLICS */
}
.map-line { 
  stroke: rgba(255, 255, 255, 0.1); 
  stroke-width: 2; 
  stroke-dasharray: 4; 
  transition: all 0.5s ease; 
}
.line-active { stroke: rgba(0, 229, 255, 0.2); stroke-dasharray: none; stroke-width: 3; }

.line-option {
  stroke: #00e5ff;
  stroke-width: 4;
  stroke-dasharray: 8;
  animation: blink-path 1s infinite ease-in-out;
  filter: drop-shadow(0 0 5px #00e5ff);
}

@keyframes blink-path {
  0%, 100% { stroke-opacity: 0.3; }
  50% { stroke-opacity: 1; }
}

.trail-line {
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 8px currentColor);
  stroke-dasharray: 10, 5;
  animation: dash-flow 2s linear infinite;
}

@keyframes dash-flow {
  from { stroke-dashoffset: 30; }
  to { stroke-dashoffset: 0; }
}

.map-node {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 80px; /* Área de clic aún más grande */
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999 !important; /* PRIORIDAD MÁXIMA */
  pointer-events: auto !important;
  transition: all 0.3s ease;
}

.node-content { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  pointer-events: none; /* Dejamos que el padre capture el hover */
}

.planet-container {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 229, 255, 0.2);
  transition: all 0.3s ease;
}

.planet-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

.planet-glow {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.available .planet-container {
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
}

.current .planet-container {
  border-color: #00e5ff;
  box-shadow: 0 0 25px rgba(0, 229, 255, 0.6);
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { transform: scale(1); border-color: #00e5ff; }
  50% { transform: scale(1.05); border-color: #00e5ff00; }
  100% { transform: scale(1); border-color: #00e5ff; }
}

.mystery-icon { z-index: 1; }

.node-label {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.map-tooltip-content {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #00e5ff;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.bg-black-opacity-50 {
  background: rgba(0, 0, 0, 0.5);
}

.border-amber {
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.fuel-bar-container {
  width: 200px;
  height: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}


.player-rocket {
  position: absolute;
  width: 24px;
  height: 24px;
  z-index: 100;
  /* Transición suave para posición y rotación */
  transition: 
    left 1.5s cubic-bezier(0.4, 0, 0.2, 1),
    top 1.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.8s ease-out;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.player-name-tag {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 900;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

.ship-avatar {
  border: 2px solid white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.border-cyan { border-color: #00e5ff !important; box-shadow: 0 0 15px #00e5ff !important; }
.border-white { border-color: white !important; }

.trail-line {
  stroke-width: 10;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.8;
  filter: blur(2px);
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-trail 1.5s forwards ease-out;
}

@keyframes draw-trail {
  to { stroke-dashoffset: 0; }
}

.local-trail {
  stroke: #00e5ff;
  opacity: 0.5;
  filter: blur(3px) drop-shadow(0 0 5px #00e5ff);
}

.partner-trail {
  stroke: #f50057;
  opacity: 0.4;
  filter: blur(3px) drop-shadow(0 0 5px #f50057);
}

.local-rocket .v-icon {
  filter: drop-shadow(0 0 8px #00e5ff);
  animation: ship-float 2s infinite ease-in-out;
}

.rocket-glow {
  position: absolute;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

@keyframes ship-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.1); }
}

.partner-rocket {
  z-index: 90;
  opacity: 0.8;
  transform: translate(-50%, -50%) rotate(45deg) scale(0.85);
}

.custom-map-tooltip {
  background: rgba(15, 23, 42, 0.9) !important;
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  backdrop-filter: blur(8px);
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8) !important;
}

@keyframes pulse-node {
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(0, 229, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
}

.goal-node .planet-container {
  width: 80px;
  height: 80px;
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
  box-shadow: 0 0 30px rgba(255, 193, 7, 0.4);
}

.goal-glow {
  background: radial-gradient(circle, rgba(255, 193, 7, 0.4) 0%, transparent 70%) !important;
  animation: goal-pulse 2s infinite;
}

@keyframes goal-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 0.6; }
}

.goal-label {
  color: #ffc107 !important;
  font-size: 14px !important;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

.battle-glow {
  background: radial-gradient(circle, rgba(255, 82, 82, 0.4) 0%, transparent 70%) !important;
  animation: battle-pulse 1.5s infinite;
}

@keyframes battle-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.5; }
}

.battle-label {
  color: #ff5252 !important;
  font-weight: 900 !important;
  text-shadow: 0 0 10px rgba(255, 82, 82, 0.5);
}

.claimed-glow {
  background: radial-gradient(circle, rgba(255, 82, 82, 0.4) 0%, transparent 70%) !important;
}

.node-claimed {
  filter: grayscale(1) brightness(0.5) blur(1px);
  cursor: not-allowed !important;
  opacity: 0.6;
}

/* Animación de Nave Paralizada (STUN) */
.player-rocket.is-stunned {
  animation: ship-shake 0.1s infinite, ship-smoke 2s infinite;
  filter: grayscale(0.5) brightness(0.7) drop-shadow(0 0 10px #ff5252);
}

@keyframes ship-shake {
  0%, 100% { transform: translate(-50%, -50%) rotate(45deg); }
  25% { transform: translate(-52%, -50%) rotate(44deg); }
  75% { transform: translate(-48%, -50%) rotate(46deg); }
}

.glow-text {
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.6);
}

.map-footer {
  height: 80px;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid rgba(0, 229, 255, 0.3);
  z-index: 10;
}

.map-legend {
  position: absolute;
  left: 30px;
  top: 120px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.2);
  backdrop-filter: blur(10px);
  z-index: 20;
  width: 220px;
  pointer-events: none;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #cbd5e1;
  text-transform: uppercase;
}
</style>
