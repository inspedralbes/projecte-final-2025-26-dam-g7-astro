<template>
  <div class="fuel-container">
    <div class="fuel-label">
      <v-icon :class="{ 'blink-red': fuel < 25 }" color="cyan-accent-2" icon="mdi-fuel" size="small" />
      <span class="text-overline ml-2 font-weight-bold tracking-widest">{{ $t('multiplayerLobby.fuel') || 'COMBUSTIBLE QUÀNTIC' }}</span>
      <span class="fuel-percent ml-auto">{{ Math.round(fuel) }}%</span>
    </div>
    <div class="fuel-track">
      <div 
        class="fuel-fill" 
        :class="fuelColorClass"
        :style="{ width: fuel + '%' }"
      >
        <div class="fuel-glow" />
      </div>
      <div v-if="fuel < 25" class="warning-overlay">
        {{ $t('multiplayerLobby.lowFuel') || '¡COMBUSTIBLE CRÍTICO!' }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    fuel: {
      type: Number,
      required: true,
    },
  })

  const fuelColorClass = computed(() => {
    if (props.fuel > 60) return 'fuel-high'
    if (props.fuel > 25) return 'fuel-mid'
    return 'fuel-low'
  })
</script>

<style scoped>
.fuel-container {
  width: 100%;
  max-width: 400px;
  background: rgba(15, 23, 42, 0.8);
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  backdrop-filter: blur(10px);
}

.fuel-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #fff;
}

.fuel-percent {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  color: #00e5ff;
}

.fuel-track {
  height: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.fuel-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  position: relative;
}

.fuel-high {
  background: linear-gradient(90deg, #00e5ff, #00b0ff);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

.fuel-mid {
  background: linear-gradient(90deg, #ffab40, #ff9100);
  box-shadow: 0 0 15px rgba(255, 145, 0, 0.5);
}

.fuel-low {
  background: linear-gradient(90deg, #ff5252, #d50000);
  box-shadow: 0 0 20px rgba(255, 82, 82, 0.8);
  animation: fuel-pulse 1s infinite alternate;
}

.fuel-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: white;
  filter: blur(8px);
  opacity: 0.5;
}

.warning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: blink 0.5s infinite;
}

.blink-red {
  animation: blink-color 0.5s infinite;
}

@keyframes blink {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes blink-color {
  0% { color: #ff5252; }
  50% { color: #fff; }
  100% { color: #ff5252; }
}

@keyframes fuel-pulse {
  from { filter: brightness(1); }
  to { filter: brightness(1.3); }
}

@keyframes fuel-pulse-scale {
  from { transform: scale(1); }
  to { transform: scale(1.02); }
}
</style>
