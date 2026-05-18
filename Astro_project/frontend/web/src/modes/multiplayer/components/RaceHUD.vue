<template>
  <div class="race-hud">
    <!-- BARRA DE PROGRESO COMPARTIDA (SUPERIOR) -->
    <div class="top-hud">
      <SharedProgressBar
        :local-avatar="localAvatar"
        :local-name="localName"
        :local-progress="localProgressIndex"
        :partner-avatar="partnerAvatar"
        :partner-name="partnerName"
        :partner-progress="partnerProgressIndex"
        :sequence="sequence"
      />
    </div>

    <!-- BOTÓN DESPEGAR (ESTILO AMONG US) -->
    <div v-if="isInsideGame && (multiplayerStore.roundScores[localName] || 0) > 0" class="eject-container">
      <v-btn
        class="despegar-btn animate-alert"
        color="error"
        rounded="pill"
        variant="elevated"
        @click="$emit('finish-mission')"
      >
        <div class="d-flex flex-column align-center">
          <v-icon size="40" class="mb-1">mdi-rocket-launch</v-icon>
          <span class="text-h4 font-weight-black">DESPEGAR</span>
          <span class="text-caption font-weight-bold opacity-70">TORNAR AL MAPA</span>
        </div>
      </v-btn>
    </div>

    <!-- BARRA DE COMBUSTIBLE (LATERAL O INFERIOR) -->
    <div class="bottom-hud">
      <FuelBar :fuel="multiplayerStore.raceFuel" />
    </div>

    <!-- GESTOR DE ANOMALÍAS -->
    <GlobalAnomalyManager />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'
  import FuelBar from './FuelBar.vue'
  import GlobalAnomalyManager from './GlobalAnomalyManager.vue'
  import SharedProgressBar from './SharedProgressBar.vue'

  const props = defineProps({
    sequence: {
      type: Array,
      required: true,
    },
    isInsideGame: {
      type: Boolean,
      default: false,
    }
  })
  
  const emit = defineEmits(['finish-mission'])

  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()

  // Cálculo dinámico del progreso basado en la columna del nodo
  const getProgressFromId = (id) => {
    if (!id || id === 'START') return 0
    if (id === 'FINISH') return 100
    if (id.startsWith('C')) {
      const col = parseInt(id.split('_')[0].replace('C', ''))
      // 6 columnas intermedias + FINISH (paso 7)
      return Math.round((col / 7) * 100)
    }
    return 0
  }

  const localProgressIndex = computed(() => getProgressFromId(multiplayerStore.raceProgress))
  const partnerProgressIndex = computed(() => getProgressFromId(multiplayerStore.partnerProgress))

  const localName = computed(() => astroStore.user)
  const localAvatar = computed(() => getPlayerAvatar(astroStore.user))

  const opponentName = computed(() => {
    if (!multiplayerStore.room) return 'Rival'
    const players = Array.isArray(multiplayerStore.room.players) ? multiplayerStore.room.players : []
    const op = players.find(p => (p.username || p) !== astroStore.user)
    return op?.username || op || 'Rival'
  })

  const partnerName = computed(() => opponentName.value)
  const partnerAvatar = computed(() => getPlayerAvatar(partnerName.value))

  function getAvatarUrl (avatarName, username) {
    if (avatarName && typeof avatarName === 'string' && (avatarName.includes('.jpg') || avatarName.includes('.png'))) {
      return `/${avatarName.trim()}`
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
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
</script>

<style scoped>
.race-hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 500;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.top-hud {
  padding: 20px;
  display: flex;
  justify-content: center;
  pointer-events: auto;
}

.bottom-hud {
  padding: 40px 40px 100px 40px; /* Subimos la barra aumentando el padding inferior */
  display: flex;
  justify-content: flex-start;
  align-items: center; /* Alineamos botón y barra */
  pointer-events: auto;
}

.eject-container {
  position: absolute;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: auto;
  z-index: 1000;
}

.despegar-btn {
  width: 180px;
  height: 180px !important;
  border: 8px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 0 40px rgba(244, 67, 54, 0.6) !important;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.despegar-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 60px rgba(244, 67, 54, 0.8) !important;
}

.despegar-btn:active {
  transform: scale(0.95);
}

.animate-alert {
  animation: alert-pulse 1s infinite alternate;
}

@keyframes alert-pulse {
  from { border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 0 30px rgba(244, 67, 54, 0.4); }
  to { border-color: rgba(255, 255, 255, 0.8); box-shadow: 0 0 60px rgba(244, 67, 54, 0.7); }
}

.bottom-hud {
  padding: 40px 40px 100px 40px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  pointer-events: auto;
}
</style>

