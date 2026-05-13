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

    <!-- RATÓN ESPEJO -->
    <div v-if="activeAnomaly === 'raton-mirall'" class="mirror-mouse-overlay">
      <div class="mirror-cursor" :style="mirrorCursorStyle">
        <v-icon color="cyan-accent-3" size="32">mdi-cursor-default</v-icon>
        <div class="mirror-glow" />
      </div>
      <div class="mirror-hint">{{ $t('anomalies.mirrorHint') || '¡CONTROL INVERTIT!' }}</div>
    </div>

    <!-- TORMENTA DE RAYOS -->
    <div v-if="activeAnomaly === 'raig-tempesta'" class="anomaly-tempesta">
      <div 
        v-for="s in lightningStrikes" 
        :key="s.id" 
        class="lightning-container"
        :style="{ left: s.x + 'px' }"
      >
        <div v-if="s.state === 'warning'" class="lightning-warning" />
        <div v-if="s.state === 'active'" class="lightning-bolt" />
      </div>
    </div>

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

  const props = defineProps({
    forcedAnomaly: { type: String, default: null }
  })

  const activeAnomaly = ref(null)
  const clickDisabled = ref(false)
  const meteors = ref([])
  const lightningStrikes = ref([])
  const mouseX = ref(0)
  const mouseY = ref(0)

  // Variables de control de intervalos (definidas pronto para evitar ReferenceError)
  let meteorInterval = null
  let lightningInterval = null

  // Estilo del ratón espejo (inversión central)
  const mirrorCursorStyle = computed(() => ({
    left: (window.innerWidth - mouseX.value) + 'px',
    top: (window.innerHeight - mouseY.value) + 'px'
  }))

  watch(() => props.forcedAnomaly, (newVal) => {
    stopAll()
    if (newVal) triggerAnomaly(newVal)
  }, { immediate: true })

  function triggerAnomaly (type) {
    activeAnomaly.value = type
    if (type === 'meteorits') startMeteorRain()
    if (type === 'raig-tempesta') startLightningStorm()
    if (type === 'raton-mirall') document.body.style.cursor = 'none'
  }

  function stopAll() {
    activeAnomaly.value = null
    meteors.value = []
    lightningStrikes.value = []
    document.body.style.cursor = 'auto'
    clearInterval(meteorInterval)
    clearInterval(lightningInterval)
  }

  // Lógica de Rayos
  function startLightningStorm() {
    lightningInterval = setInterval(() => {
      const strike = { id: Date.now(), x: Math.random() * window.innerWidth, state: 'warning' }
      lightningStrikes.value.push(strike)

      setTimeout(() => {
        strike.state = 'active'
        // Comprobar si el ratón está cerca de la línea del rayo (eje X)
        if (Math.abs(mouseX.value - strike.x) < 40) {
          applyStun()
        }
        setTimeout(() => {
          lightningStrikes.value = lightningStrikes.value.filter(s => s.id !== strike.id)
        }, 300)
      }, 1200)
    }, 1500)
  }

  // Lógica de Meteoritos
  function startMeteorRain() {
    meteorInterval = setInterval(() => {
      const m = { id: Date.now(), x: Math.random() * (window.innerWidth + 200), y: -100, speed: 12, size: 40 + Math.random() * 40 }
      meteors.value.push(m)
      const animate = () => {
        if (!meteors.value.includes(m)) return
        m.y += m.speed
        m.x -= m.speed * 0.3 // Caída en diagonal
        if (m.y < window.innerHeight) requestAnimationFrame(animate)
        else meteors.value = meteors.value.filter(item => item.id !== m.id)
      }
      animate()
    }, 800)
  }

  function applyStun() {
    if (clickDisabled.value) return
    clickDisabled.value = true
    setTimeout(() => clickDisabled.value = false, 2500)
  }

  const handleMirrorClick = (e) => {
    if (activeAnomaly.value === 'raton-mirall') {
      // Evitamos que el click real active nada
      e.preventDefault()
      e.stopImmediatePropagation()

      // Calculamos la posición del espejo
      const mirrorX = window.innerWidth - e.clientX
      const mirrorY = window.innerHeight - e.clientY

      // Buscamos el elemento bajo el espejo
      const target = document.elementFromPoint(mirrorX, mirrorY)
      if (target) {
        // Disparamos el click en el target remoto
        target.click()
        // Eventos extra para componentes complejos
        const opts = { bubbles: true, cancelable: true, view: window, clientX: mirrorX, clientY: mirrorY }
        target.dispatchEvent(new MouseEvent('mousedown', opts))
        target.dispatchEvent(new MouseEvent('mouseup', opts))
      }
    }
  }

  const handleMouseMove = (e) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }

  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMirrorClick, true)
    window.addEventListener('click', handleMirrorClick, true)
  })

  onUnmounted(() => {
    stopAll()
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mousedown', handleMirrorClick, true)
    window.removeEventListener('click', handleMirrorClick, true)
    document.body.style.cursor = 'auto'
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
  width: 80px;
  transform: translateX(-50%);
}
.lightning-warning {
  position: absolute;
  bottom: 50px;
  left: 50%;
  width: 60px;
  height: 60px;
  border: 3px dashed #00e5ff;
  border-radius: 50%;
  transform: translateX(-50%);
  animation: pulse-warn 0.4s infinite;
}
.lightning-bolt {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, #fff, #00e5ff, #fff, transparent);
  box-shadow: 0 0 50px #00e5ff;
  animation: bolt-strike 0.3s ease-out;
}

/* Ratón Espejo */
.mirror-cursor {
  position: fixed;
  transform: translate(-50%, -50%);
  z-index: 10000;
}
.mirror-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.5) 0%, transparent 70%);
  animation: rotate-glow 2s infinite linear;
}

@keyframes bolt-strike {
  0% { opacity: 0; transform: scaleX(0.1); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(0.1); }
}

@keyframes pulse-warn {
  from { transform: translateX(-50%) scale(0.8); opacity: 0.2; }
  to { transform: translateX(-50%) scale(1.2); opacity: 1; }
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
</style>
