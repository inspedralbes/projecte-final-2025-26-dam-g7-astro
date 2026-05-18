<template>
  <div class="anomaly-manager" :class="{ 'stunned-cursor': clickDisabled }">
    <!-- NEBULOSA -->
    <transition name="fade">
      <div v-if="activeAnomaly === 'nebulosa'" class="anomaly-nebulosa" />
    </transition>

    <!-- METEORITOS EN PICADO -->
    <div v-if="activeAnomaly === 'meteorits'" class="anomaly-meteorits">
      <div 
        v-for="m in meteors" 
        :key="m.id" 
        class="meteor"
        :style="{ left: m.x + 'px', top: m.y + 'px', width: m.size + 'px', transform: 'rotate(20deg)' }"
      >
        <img src="/sci_fi_meteorite_fire_1778453762296.png" class="meteor-img" />
        <div class="meteor-trail" />
      </div>
    </div>

    <!-- TORMENTA DE RAYOS -->
    <div v-if="activeAnomaly === 'raig-tempesta'" class="anomaly-tempesta">
      <div 
        v-for="s in lightningStrikes" 
        :key="s.id" 
        class="lightning-container"
        :style="{ left: s.x + 'px' }"
      >
        <div v-if="s.state === 'warning'" class="lightning-warning-group">
          <div class="lightning-column" />
          <div class="lightning-warning-circle" />
        </div>
        <div v-if="s.state === 'active'" class="lightning-bolt" />
      </div>
    </div>

    <!-- FLASH DE TORMENTA -->
    <transition name="fade-fast">
      <div v-if="stormFlash" class="storm-flash-overlay" />
    </transition>

    <!-- BLOQUEO VISUAL (STUN) -->
    <transition name="fade">
      <div v-if="clickDisabled" class="stun-overlay d-flex flex-column align-center justify-center">
        <div class="stun-glitch-text">SISTEMES BLOQUEJATS</div>
        <v-icon color="cyan-accent-1" size="80" class="stun-icon">mdi-lightning-bolt</v-icon>
      </div>
    </transition>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'

  const props = defineProps({
    forcedAnomaly: { type: String, default: null }
  })

  const multiplayerStore = useMultiplayerStore()
  const activeAnomaly = ref(null)
  const clickDisabled = ref(false)
  const meteors = ref([])
  const lightningStrikes = ref([])
  const stormFlash = ref(false)
  const mouseX = ref(0)
  const mouseY = ref(0)

  // Variables de control de intervalos (definidas pronto para evitar ReferenceError)
  let meteorInterval = null
  let lightningInterval = null

  const globalTimeLeft = computed(() => multiplayerStore.timeLeft)

  watch(() => props.forcedAnomaly, (newVal) => {
    stopAll()
    if (newVal) triggerAnomaly(newVal)
  }, { immediate: true })

  function triggerAnomaly (type) {
    activeAnomaly.value = type
    if (type === 'meteorits') startMeteorRain()
    if (type === 'raig-tempesta') startLightningStorm()
  }

  function stopAll() {
    activeAnomaly.value = null
    meteors.value = []
    lightningStrikes.value = []
    document.body.style.cursor = 'auto'
    clearInterval(meteorInterval)
    clearInterval(lightningInterval)
  }

  // Lógica de Rayos (Tormenta Masiva)
  function startLightningStorm() {
    // Primera ráfaga inmediata
    spawnLightningWave()
    
    // Ráfagas cada 15 segundos como pide el usuario
    lightningInterval = setInterval(() => {
      spawnLightningWave()
    }, 15000)
  }

  function spawnLightningWave() {
    const numStrikes = 6 + Math.floor(Math.random() * 4) // Entre 6 y 10 rayos por ráfaga
    
    for (let i = 0; i < numStrikes; i++) {
      // Retrasos pequeños entre rayos de la misma ráfaga para efecto orgánico
      setTimeout(() => {
        const strike = { 
          id: Date.now() + Math.random(), 
          x: Math.random() * window.innerWidth, 
          state: 'warning' 
        }
        lightningStrikes.value.push(strike)

        setTimeout(() => {
          strike.state = 'active'
          
          // Flash al primer rayo de la ráfaga
          if (i === 0) {
            stormFlash.value = true
            setTimeout(() => stormFlash.value = false, 150)
          }

          // Comprobar colisión con el ratón
          if (Math.abs(mouseX.value - strike.x) < 35) { // Un poco más estrecho para que sea esquivable entre tantos
            applyStun()
          }
          setTimeout(() => {
            lightningStrikes.value = lightningStrikes.value.filter(s => s.id !== strike.id)
          }, 400) // Un poco más de duración visual
        }, 1000) // 1s de aviso
      }, i * 150)
    }
  }

  // Lógica de Meteoritos (Oleadas cada 15s)
  function startMeteorRain() {
    spawnMeteorWave()
    meteorInterval = setInterval(() => {
      spawnMeteorWave()
    }, 15000)
  }

  function spawnMeteorWave() {
    const numMeteors = 15 + Math.floor(Math.random() * 10)
    for (let i = 0; i < numMeteors; i++) {
      setTimeout(() => {
        const m = { 
          id: Date.now() + Math.random(), 
          x: Math.random() * (window.innerWidth + 200), 
          y: -100, 
          speed: 10 + Math.random() * 5, 
          size: 50 + Math.random() * 40 
        }
        meteors.value.push(m)

        const animate = () => {
          if (!meteors.value.find(item => item.id === m.id)) return
          m.y += m.speed
          m.x -= m.speed * 0.4
          
          // Colisión con el ratón
          if (Math.abs(mouseX.value - m.x) < (m.size/2) && Math.abs(mouseY.value - m.y) < (m.size/2)) {
            applyStun()
            meteors.value = meteors.value.filter(item => item.id !== m.id)
            return
          }

          if (m.y < window.innerHeight + 100 && m.x > -100) {
            requestAnimationFrame(animate)
          } else {
            meteors.value = meteors.value.filter(item => item.id !== m.id)
          }
        }
        animate()
      }, i * 100)
    }
  }

  function applyStun() {
    if (clickDisabled.value) return
    clickDisabled.value = true
    setTimeout(() => clickDisabled.value = false, 2500)
  }

  const handleMouseMove = (e) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }

  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
  })

  onUnmounted(() => {
    stopAll()
    window.removeEventListener('mousemove', handleMouseMove)
  })
</script>

<style scoped>
.anomaly-manager {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

/* Efecto Stun (Parpadeo) */
.stunned-cursor {
  cursor: wait !important;
  animation: flash-red 0.2s infinite;
}

@keyframes flash-red {
  0% { background: rgba(0, 229, 255, 0.1); }
  50% { background: rgba(255, 255, 255, 0.2); }
  100% { background: rgba(0, 229, 255, 0.1); }
}

/* Meteoritos */
.meteor {
  position: absolute;
  filter: drop-shadow(0 0 20px #ff4500);
}
.meteor-img { width: 100%; height: auto; }
.meteor-trail {
  position: absolute;
  top: -50px;
  left: 50%;
  width: 4px;
  height: 80px;
  background: linear-gradient(to bottom, transparent, #ff4500);
  transform: translateX(-50%);
}

/* Rayos */
.lightning-container {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  transform: translateX(-50%);
  pointer-events: none;
}

.lightning-warning-group {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightning-column {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  border-left: 2px dashed rgba(0, 229, 255, 0.4);
  animation: pulse-column 0.5s infinite alternate;
}

.lightning-warning-circle {
  position: absolute;
  bottom: 50px;
  width: 60px;
  height: 60px;
  border: 3px solid #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  animation: pulse-warn 0.4s infinite;
}

@keyframes pulse-column {
  from { opacity: 0.2; transform: scaleX(1); }
  to { opacity: 0.8; transform: scaleX(2); }
}

.lightning-bolt {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, #fff, #00e5ff, #fff, transparent);
  box-shadow: 0 0 50px #00e5ff;
  animation: bolt-strike 0.3s ease-out;
}

@keyframes bolt-strike {
  0% { opacity: 0; transform: scaleX(0.1); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(0.1); }
}

.stun-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 10001;
}

.stun-glitch-text {
  color: #00e5ff;
  font-size: 3rem;
  font-weight: 900;
  text-shadow: 2px 2px #ff00de, -2px -2px #00ff00;
}

.storm-flash-overlay {
  position: fixed;
  inset: 0;
  background: white;
  opacity: 0.3;
  z-index: 10002;
  pointer-events: none;
}

.fade-fast-enter-active, .fade-fast-leave-active {
  transition: opacity 0.1s ease-out;
}
.fade-fast-enter-from, .fade-fast-leave-to {
  opacity: 0;
}
</style>
