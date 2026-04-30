<template>
  <div :class="['medal-container', { 'locked': locked }]" :style="{ transform: `scale(${scale})` }">
    <!-- Ribbon -->
    <div :class="['ribbon-system', type]">
      <div class="ribbon-main">
        <div class="ribbon-texture"></div>
      </div>
      <div class="ribbon-connector"></div>
    </div>

    <!-- Medal Body -->
    <div :class="['medal-body', type]">
      <!-- Metallic Shine Layer -->
      <div class="medal-shine"></div>
      
      <!-- Internal Border -->
      <div class="medal-inner-ring"></div>

      <!-- Icon Content -->
      <div class="medal-content d-flex flex-column align-center justify-center">
        <v-icon 
          :icon="locked ? 'mdi-lock' : icon" 
          :size="iconSize"
          :color="locked ? 'grey-darken-1' : 'white'"
          :class="['medal-icon', { 'icon-unlocked': !locked }]"
        ></v-icon>
      </div>

      <!-- Rank Accents (Stars) -->
      <div class="medal-rank-accents">
        <v-icon v-for="n in rankStars" :key="n" icon="mdi-star" size="14" class="rank-star"></v-icon>
      </div>

      <!-- Outer Rim -->
      <div class="medal-rim"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'bronze'
  },
  icon: {
    type: String,
    default: 'mdi-star'
  },
  locked: {
    type: Boolean,
    default: false
  },
  scale: {
    type: Number,
    default: 1
  },
  iconSize: {
    type: Number,
    default: 42
  }
})

const rankStars = computed(() => {
  switch (props.type) {
    case 'bronze': return 1
    case 'silver': return 2
    case 'gold': return 3
    case 'platinum': return 4
    default: return 0
  }
})
</script>

<style scoped>
.medal-container {
  width: 160px;
  height: 200px;
  padding-top: 50px;
  cursor: default;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transform-origin: center center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.medal-container:hover:not(.locked) {
  transform: scale(1.05) translateY(-5px);
  filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.6));
}

.medal-container.locked {
  filter: grayscale(0.8) brightness(0.6);
  opacity: 0.7;
}

/* Ribbon System */
.ribbon-system {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ribbon-main {
  width: 64px;
  height: 90px;
  position: relative;
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%);
  box-shadow: inset 0 -10px 10px rgba(0,0,0,0.2);
}

.ribbon-texture {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0px,
    rgba(255, 255, 255, 0.05) 2px,
    rgba(255, 255, 255, 0) 4px
  );
}

.ribbon-connector {
  width: 24px;
  height: 12px;
  background: #333;
  margin-top: -5px;
  border-radius: 4px;
  z-index: 2;
  border: 2px solid rgba(255,255,255,0.1);
}

/* Ribbon Colors */
.ribbon-system.bronze .ribbon-main { background: linear-gradient(to right, #4e342e, #795548, #4e342e); }
.ribbon-system.silver .ribbon-main { background: linear-gradient(to right, #37474f, #607d8b, #37474f); }
.ribbon-system.gold .ribbon-main { background: linear-gradient(to right, #bf360c, #f4511e, #bf360c); }
.ribbon-system.platinum .ribbon-main { background: linear-gradient(to right, #1a237e, #3f51b5, #1a237e); }

/* Medal Body */
.medal-body {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  box-shadow: 
    0 10px 20px rgba(0, 0, 0, 0.5),
    inset 0 4px 8px rgba(255, 255, 255, 0.3),
    inset 0 -4px 8px rgba(0, 0, 0, 0.3);
}

/* Metallic Bases */
.bronze {
  background: radial-gradient(circle at 35% 35%, #cd7f32 0%, #a0522d 50%, #5d2906 100%);
  border: 4px solid #8b4513;
}

.silver {
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #bdc3c7 50%, #7f8c8d 100%);
  border: 4px solid #95a5a6;
}

.gold {
  background: radial-gradient(circle at 35% 35%, #fff176 0%, #fbc02d 50%, #f57f17 100%);
  border: 4px solid #ffa000;
}

.platinum {
  background: radial-gradient(circle at 35% 35%, #e0f7fa 0%, #b2ebf2 50%, #4dd0e1 100%);
  border: 4px solid #00acc1;
}

/* Inner Elements */
.medal-inner-ring {
  position: absolute;
  top: 10%;
  left: 10%;
  right: 10%;
  bottom: 10%;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.medal-rim {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.medal-content {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  z-index: 5;
}

.medal-icon {
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.icon-unlocked {
  color: white !important;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

/* Shine effect */
.medal-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.6) 0%, 
    rgba(255, 255, 255, 0) 40%, 
    rgba(0, 0, 0, 0) 60%, 
    rgba(255, 255, 255, 0.2) 100%);
  z-index: 4;
  pointer-events: none;
}

/* Rank Accents */
.medal-rank-accents {
  position: absolute;
  bottom: 15px;
  display: flex;
  gap: 2px;
  z-index: 6;
}

.rank-star {
  color: rgba(255, 255, 255, 0.8);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}

/* Special Rank Textures */
.gold .medal-inner-ring {
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.platinum .medal-inner-ring {
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 15px rgba(224, 247, 250, 0.5);
}

/* Hover Animations */
@keyframes pulse-shine {
  0% { transform: scale(1) rotate(0deg); opacity: 0.5; }
  50% { transform: scale(1.1) rotate(5deg); opacity: 0.8; }
  100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
}

.medal-container:hover:not(.locked) .medal-shine {
  animation: pulse-shine 2s infinite ease-in-out;
}
</style>
