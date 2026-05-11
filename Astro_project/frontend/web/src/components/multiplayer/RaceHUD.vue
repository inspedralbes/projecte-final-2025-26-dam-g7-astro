<template>
  <div class="race-hud">
    <!-- BARRA DE PROGRESO COMPARTIDA (SUPERIOR) -->
    <div class="top-hud">
      <SharedProgressBar
        :local-avatar="localAvatar"
        :local-name="localName"
        :local-progress="multiplayerStore.raceProgress"
        :partner-avatar="partnerAvatar"
        :partner-name="partnerName"
        :partner-progress="multiplayerStore.partnerProgress"
        :sequence="sequence"
      />
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
  import { useMultiplayerStore } from '@/stores/multiplayerStore'
  import FuelBar from './FuelBar.vue'
  import GlobalAnomalyManager from './GlobalAnomalyManager.vue'
  import SharedProgressBar from './SharedProgressBar.vue'

  const props = defineProps({
    sequence: {
      type: Array,
      required: true,
    },
  })

  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()

  const localName = computed(() => astroStore.user)
  const localAvatar = computed(() => getPlayerAvatar(astroStore.user))

  const opponentName = computed(() => {
    if (!multiplayerStore.room) return 'Rival'
    const op = multiplayerStore.room.players.find(p => (p.username || p) !== astroStore.user)
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
  padding: 40px;
  display: flex;
  justify-content: flex-start;
  pointer-events: auto;
}
</style>
