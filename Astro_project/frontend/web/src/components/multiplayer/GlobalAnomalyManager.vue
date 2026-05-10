<template>
  <div class="anomaly-manager">
    <!-- EFEKTE: NEBULOSA -->
    <transition name="fade">
      <div v-if="activeAnomaly === 'nebulosa'" class="anomaly-nebulosa" />
    </transition>

    <!-- EFEKTE: PLUJA DE METEORITS -->
    <div v-if="activeAnomaly === 'meteorits'" class="anomaly-meteorits">
      <div 
        v-for="m in meteors" 
        :key="m.id" 
        class="meteor"
        :style="{ 
          left: m.x + 'px', 
          top: m.y + 'px', 
          width: m.size + 'px', 
          height: m.size + 'px',
          transform: `rotate(${m.rotation}deg)` 
        }"
        @mouseenter="onMeteorHit"
      >
        <div class="meteor-core" />
        <div class="meteor-trail" />
      </div>
    </div>

    <!-- BLOQUEO DE CLIC (Sanción por meteorito) -->
    <transition name="fade">
      <div v-if="clickDisabled" class="click-blocker d-flex flex-column align-center justify-center">
        <v-icon color="error" icon="mdi-cursor-default-click-off" size="64" />
        <div class="text-h6 font-weight-black text-error mt-4">¡SISTEMAS BLOQUEADOS!</div>
      </div>
    </transition>

    <!-- EFEKTE: RAIG ALIENÍGENA -->
    <div v-if="activeAnomaly === 'raig-alienigena'" class="anomaly-raig">
      <div class="alien-cursor-eye" :style="cursorStyle" />
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

  const activeAnomaly = ref(null) // 'nebulosa', 'meteorits', 'raig-alienigena'
  const clickDisabled = ref(false)
  const meteors = ref([])
  const mouseX = ref(0)
  const mouseY = ref(0)

  let anomalyInterval = null
  let meteorInterval = null

  const cursorStyle = computed(() => ({
    left: mouseX.value + 'px',
    top: mouseY.value + 'px',
  }))

  function startRandomAnomalies () {
    anomalyInterval = setInterval(() => {
      if (activeAnomaly.value) return // No solapar
      
      const rand = Math.random()
      if (rand < 0.3) triggerAnomaly('nebulosa')
      else if (rand < 0.6) triggerAnomaly('meteorits')
      else if (rand < 0.9) triggerAnomaly('raig-alienigena')
    }, 15000) // Intentar cada 15s
  }

  function triggerAnomaly (type) {
    activeAnomaly.value = type
    console.log(`🚀 ANOMALÍA ACTIVADA: ${type}`)
    
    if (type === 'meteorits') startMeteorRain()
    if (type === 'raig-alienigena') document.body.style.cursor = 'none'

    setTimeout(() => {
      activeAnomaly.value = null
      if (type === 'meteorits') stopMeteorRain()
      if (type === 'raig-alienigena') document.body.style.cursor = 'auto'
    }, 8000) // Dura 8 segundos
  }

  function startMeteorRain () {
    meteorInterval = setInterval(() => {
      const id = Date.now() + Math.random()
      const newMeteor = {
        id,
        x: Math.random() * window.innerWidth,
        y: -100,
        size: 30 + Math.random() * 40,
        speed: 5 + Math.random() * 10,
        rotation: Math.random() * 360,
      }
      meteors.value.push(newMeteor)

      // Animación de caída
      const fall = () => {
        const m = meteors.value.find(mt => mt.id === id)
        if (!m) return
        m.y += m.speed
        m.rotation += 2
        if (m.y < window.innerHeight) requestAnimationFrame(fall)
        else meteors.value = meteors.value.filter(mt => mt.id !== id)
      }
      requestAnimationFrame(fall)
    }, 800)
  }

  function stopMeteorRain () {
    clearInterval(meteorInterval)
    meteors.value = []
  }

  function onMeteorHit () {
    if (clickDisabled.value) return
    clickDisabled.value = true
    console.warn('💥 ¡Impacto de meteorito! Clic deshabilitado.')
    setTimeout(() => {
      clickDisabled.value = false
    }, 2000)
  }

  const updateMouse = (e) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }

  onMounted(() => {
    startRandomAnomalies()
    window.addEventListener('mousemove', updateMouse)
  })

  onUnmounted(() => {
    clearInterval(anomalyInterval)
    clearInterval(meteorInterval)
    window.removeEventListener('mousemove', updateMouse)
    document.body.style.cursor = 'auto'
  })
</script>

<style scoped>
.anomaly-manager {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.anomaly-nebulosa {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%);
  backdrop-filter: blur(8px) brightness(0.5);
  pointer-events: none;
}

.anomaly-meteorits {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.meteor {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
}

.meteor-core {
  width: 100%;
  height: 100%;
  background: #555;
  border-radius: 40% 60% 50% 50%;
  box-shadow: inset -5px -5px 10px #000, 0 0 20px #ff4500;
  position: relative;
}

.meteor-trail {
  position: absolute;
  top: -40px;
  left: 50%;
  width: 10px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #ff4500);
  transform: translateX(-50%);
  filter: blur(4px);
}

.click-blocker {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 0, 0, 0.2);
  backdrop-filter: grayscale(1) blur(2px);
  pointer-events: auto;
  z-index: 2000;
}

.anomaly-raig {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.alien-cursor-eye {
  position: fixed;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #00ff00 20%, #004400 60%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 3000;
  border: 4px solid #00ff00;
  box-shadow: 0 0 30px #00ff00;
  animation: eye-scan 2s infinite alternate;
}

@keyframes eye-scan {
  from { transform: translate(-50%, -50%) scale(1); }
  to { transform: translate(-50%, -50%) scale(1.5); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
