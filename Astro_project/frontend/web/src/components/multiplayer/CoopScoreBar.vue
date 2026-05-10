<template>
  <div class="coop-score-bar-wrapper" :class="[`theme-${theme}`, { 'is-compact': compact }]">
    <div v-if="teamName" class="team-label">{{ teamName }}</div>
    
    <div class="score-main-container">
      <!-- Estrellas de progreso (estilo Just Dance) -->
      <div class="stars-track">
        <div 
          v-for="n in 5" 
          :key="n" 
          class="star-wrapper"
          :class="{ 'star-filled': n <= activeStars, 'star-pulse': n === activeStars }"
        >
          <v-icon 
            :icon="n <= activeStars ? 'mdi-star' : 'mdi-star-outline'" 
            :class="n <= activeStars ? 'active-star-icon' : 'dimmed-star-icon'"
            :size="compact ? (n <= activeStars ? 22 : 16) : (n <= activeStars ? 28 : 20)"
          />
        </div>
      </div>

      <!-- Barra de progreso con gradiente y glow -->
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: fillPercentage + '%' }">
          <div class="fill-glow"></div>
          <div class="fill-sparkles"></div>
        </div>
        
        <!-- Marcadores de hitos -->
        <div class="milestone" style="left: 20%"></div>
        <div class="milestone" style="left: 40%"></div>
        <div class="milestone" style="left: 60%"></div>
        <div class="milestone" style="left: 80%"></div>
      </div>

      <!-- Texto de puntuación y rating -->
      <div class="score-info">
        <div v-if="!compact" class="rating-label" :class="ratingClass">{{ ratingLabel }}</div>
        <div class="score-number-container d-flex align-center gap-3">
          <transition name="score-pop" mode="out-in">
            <span :key="score" class="score-number">{{ formattedScore }}</span>
          </transition>
          
          <!-- Team specific timer -->
          <div v-if="time !== null" class="team-timer-pill ml-2" :class="{ 'timer-critical': time <= 10 }">
            <v-icon icon="mdi-timer-outline" size="14" class="mr-1" />
            {{ Math.ceil(time) }}s
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 5000,
    },
    teamName: {
      type: String,
      default: '',
    },
    theme: {
      type: String,
      default: 'cyan', // 'cyan', 'green', 'red', 'amber', 'purple'
    },
    compact: {
      type: Boolean,
      default: false,
    },
    time: {
      type: Number,
      default: null,
    },
  })

  const fillPercentage = computed(() => {
    return Math.min(100, (props.score / props.maxScore) * 100)
  })

  const activeStars = computed(() => {
    if (fillPercentage.value >= 100) return 5
    if (fillPercentage.value >= 80) return 4
    if (fillPercentage.value >= 60) return 3
    if (fillPercentage.value >= 40) return 2
    if (fillPercentage.value >= 20) return 1
    return 0
  })

  const formattedScore = computed(() => {
    return props.score.toLocaleString()
  })

  const ratingLabel = computed(() => {
    if (fillPercentage.value >= 100) return 'GALACTIC LEGEND'
    if (fillPercentage.value >= 80) return 'SUPERSTAR'
    if (fillPercentage.value >= 60) return 'GREAT'
    if (fillPercentage.value >= 40) return 'GOOD'
    if (fillPercentage.value >= 20) return 'OK'
    return 'COOP'
  })

  const ratingClass = computed(() => {
    if (fillPercentage.value >= 100) return 'rating-galactic'
    if (fillPercentage.value >= 80) return 'rating-superstar'
    if (fillPercentage.value >= 60) return 'rating-great'
    return ''
  })
</script>

<style scoped>
.coop-score-bar-wrapper {
  width: 100%;
  max-width: 600px;
  padding: 10px;
  position: relative;
  transition: all 0.3s ease;
}

.score-main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stars-track {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
  padding: 0 10px;
}

.star-wrapper {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 0 0px transparent);
}

.star-filled {
  filter: drop-shadow(0 0 8px var(--accent-glow, rgba(255, 193, 7, 0.6)));
  transform: scale(1.2);
}

.star-pulse {
  animation: star-bounce 1s infinite alternate;
}

@keyframes star-bounce {
  from { transform: scale(1.1); }
  to { transform: scale(1.3); }
}

.progress-track {
  width: 100%;
  height: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 999px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.progress-fill {
  height: 100%;
  background: var(--gradient);
  border-radius: 999px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.fill-glow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
  border-radius: 999px;
}

.fill-sparkles {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: radial-gradient(circle, white 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
  animation: move-sparkles 10s linear infinite;
}

@keyframes move-sparkles {
  from { background-position: 0 0; }
  to { background-position: 100% 0; }
}

.milestone {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: rgba(255,255,255,0.1);
  z-index: 1;
}

.score-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rating-label {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 0.7rem;
  letter-spacing: 2px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: -4px;
}

.score-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
}

.team-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
  background: rgba(0,0,0,0.4);
  padding: 2px 12px;
  border-radius: 4px;
  border-left: 3px solid var(--accent-color, #00e5ff);
}

.team-timer-pill {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
}

.timer-critical {
  background: rgba(255, 82, 82, 0.2);
  border-color: rgba(255, 82, 82, 0.5);
  color: #ff5252;
  animation: timer-pulse-mini 0.5s infinite alternate;
}

@keyframes timer-pulse-mini {
  from { transform: scale(1); opacity: 0.8; }
  to { transform: scale(1.1); opacity: 1; }
}

/* Compact Mode */
.is-compact {
  padding: 4px 10px;
}

.is-compact .score-main-container {
  flex-direction: row;
  gap: 15px;
}

.is-compact .stars-track {
  width: 140px;
  max-width: 140px;
  padding: 0;
  gap: 2px;
}

.is-compact .progress-track {
  flex-grow: 1;
  height: 8px;
}

.is-compact .score-number {
  font-size: 1.2rem;
}

.is-compact .team-label {
  position: absolute;
  left: -110px;
  top: 50%;
  transform: translateY(-50%);
  width: 100px;
  font-size: 0.65rem;
  margin-bottom: 0;
  text-align: right;
  padding-right: 8px;
}

/* Themes */
.theme-cyan { --accent-color: #00e5ff; --accent-glow: rgba(0, 229, 255, 0.5); --gradient: linear-gradient(90deg, #00e5ff, #00b0ff, #7c4dff); }
.theme-green { --accent-color: #00ff88; --accent-glow: rgba(0, 255, 136, 0.5); --gradient: linear-gradient(90deg, #00ff88, #00e676, #00c853); }
.theme-red { --accent-color: #ff5252; --accent-glow: rgba(255, 82, 82, 0.5); --gradient: linear-gradient(90deg, #ff5252, #ff1744, #d50000); }
.theme-amber { --accent-color: #ffab40; --accent-glow: rgba(255, 171, 64, 0.5); --gradient: linear-gradient(90deg, #ffab40, #ff9100, #ff6d00); }
.theme-purple { --accent-color: #e040fb; --accent-glow: rgba(224, 64, 251, 0.5); --gradient: linear-gradient(90deg, #e040fb, #d500f9, #aa00ff); }

.active-star-icon { color: var(--accent-color) !important; filter: drop-shadow(0 0 8px var(--accent-glow)); }
.dimmed-star-icon { color: rgba(255,255,255,0.1) !important; }

.rating-great { color: #00e5ff; text-shadow: 0 0 10px rgba(0, 229, 255, 0.5); }
.rating-superstar { color: #ffab40; text-shadow: 0 0 15px rgba(255, 171, 64, 0.6); }
.rating-galactic { 
  color: #e040fb; 
  text-shadow: 0 0 20px rgba(224, 64, 251, 0.8);
  animation: rainbow-text 2s infinite linear;
}

@keyframes rainbow-text {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

.score-pop-enter-active {
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
