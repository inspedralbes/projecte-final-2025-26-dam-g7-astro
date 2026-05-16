<template>
  <div class="boss-arsenal-container pa-4 rounded-xl border-amber elevation-10">
    <div class="text-overline text-amber-accent-2 mb-4 d-flex align-center">
      <v-icon size="18" class="mr-2">mdi-sword-cross</v-icon>
      ARSENAL DEL JEFE
    </div>

    <!-- Barra de Cooldown Global -->
    <div class="cooldown-section mb-6">
      <div class="d-flex justify-space-between mb-1">
        <span class="text-caption text-grey-lighten-1">RECARGA DE ENERGÍA</span>
        <span class="text-caption font-weight-black" :class="onCooldown ? 'text-red' : 'text-green'">
          {{ onCooldown ? Math.ceil(timeLeft / 1000) + 's' : 'LISTO' }}
        </span>
      </div>
      <v-progress-linear
        :model-value="cooldownProgress"
        height="10"
        rounded="pill"
        :color="onCooldown ? 'red-accent-4' : 'green-accent-4'"
        striped
      />
    </div>

    <!-- Botones de Ataque -->
    <v-row dense>
      <v-col v-for="attack in attacks" :key="attack.id" cols="6">
        <v-btn
          block
          height="80"
          :color="attack.color"
          :disabled="onCooldown"
          class="attack-btn rounded-lg d-flex flex-column"
          @click="launchAttack(attack.id)"
        >
          <v-icon size="30" class="mb-1">{{ attack.icon }}</v-icon>
          <div class="text-7px font-weight-black">{{ attack.name }}</div>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useMultiplayerStore } from '@/stores/multiplayerStore'

const multiplayerStore = useMultiplayerStore()

const attacks = [
  { id: 'BLACK_HOLE', name: 'AGUJERO NEGRO', icon: 'mdi-vortex', color: 'deep-purple-darken-4' },
  { id: 'LIGHTNING_STORM', name: 'RELÁMPAGOS', icon: 'mdi-weather-lightning', color: 'blue-darken-4' },
  { id: 'FREEZE', name: 'CONGELACIÓN', icon: 'mdi-snowflake', color: 'cyan-darken-4' },
  { id: 'ZERO_GRAVITY', name: 'GRAVEDAD 0', icon: 'mdi-axis-z-rotate-clockwise', color: 'orange-darken-4' },
  { id: 'CHANGE_GAME', name: 'CAMBIAR JUEGO', icon: 'mdi-refresh', color: 'green-darken-4' }
]

const lastAttackTime = ref(0)
const cooldownDuration = ref(30000)
const currentTime = ref(Date.now())
let timerInterval = null

const onCooldown = computed(() => {
  return (currentTime.value - lastAttackTime.value) < cooldownDuration.value
})

const timeLeft = computed(() => {
  return Math.max(0, cooldownDuration.value - (currentTime.value - lastAttackTime.value))
})

const cooldownProgress = computed(() => {
  if (!onCooldown.value) return 100
  return ((currentTime.value - lastAttackTime.value) / cooldownDuration.value) * 100
})

function launchAttack(id) {
  if (onCooldown.value) return
  
  multiplayerStore.sendGameAction({
    type: 'BOSS_ATTACK',
    attackType: id
  })
  
  // Optimismo local, el servidor sincronizará el tiempo exacto
  lastAttackTime.value = Date.now()
}

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (msg && msg.type === 'BOSS_COOLDOWN_SYNC') {
    lastAttackTime.value = msg.lastAttack
    cooldownDuration.value = msg.cooldown
  }
})

onMounted(() => {
  timerInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 100)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.boss-arsenal-container {
  background: rgba(25, 0, 0, 0.4);
  border: 1px solid rgba(255, 111, 0, 0.3);
  width: 100%;
}

.attack-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.attack-btn:not(:disabled):hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
}

.text-7px {
  font-size: 8px;
}
</style>
