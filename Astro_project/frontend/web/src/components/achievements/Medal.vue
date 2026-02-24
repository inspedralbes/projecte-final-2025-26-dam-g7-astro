<template>
  <div :class="['medal-container', { 'locked': locked }]" :style="{ transform: `scale(${scale})` }">
    <!-- Ribbon -->
    <div :class="['ribbon', type]"></div>

    <!-- Medal Body -->
    <div :class="['medal-body', type]">
      <div class="medal-shine"></div>
      <div class="medal-content d-flex flex-column align-center justify-center">
        <v-icon :icon="locked ? 'mdi-lock' : icon" :size="iconSize"
          :color="locked ? 'grey-lighten-2' : 'white'"></v-icon>
      </div>
      <div class="medal-border"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
    default: 48
  }
})
</script>

<style scoped>
.medal-container {
  width: 140px;
  height: 180px;
  /* Aumentado para contener la cinta */
  padding-top: 40px;
  /* Espacio para la cinta */
  cursor: default;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transform-origin: center center;
}

.medal-container.locked {
  filter: grayscale(1) brightness(0.7);
  opacity: 0.6;
}

/* Medal Body */
.medal-body {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2);
  z-index: 2;
}

.medal-content {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  z-index: 3;
}

.medal-border {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

/* Metallic Gradients */
.gold {
  background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b 80%);
  border: 1px solid #ffec8b;
}

.silver {
  background: radial-gradient(circle at 30% 30%, #e0e0e0, #757575 80%);
  border: 1px solid #ffffff;
}

.bronze {
  background: radial-gradient(circle at 30% 30%, #cd7f32, #8b4513 80%);
  border: 1px solid #ffa07a;
}

.platinum {
  background: radial-gradient(circle at 30% 30%, #eef7ff, #8fa8c3 80%);
  border: 1px solid #d7e9ff;
}

/* Ribbon */
.ribbon {
  position: absolute;
  top: 0;
  /* Cambio: Empieza en el borde superior del contenedor */
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 100px;
  z-index: 1;
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);
}

.ribbon.gold {
  background: linear-gradient(to bottom, #d32f2f, #b71c1c);
  border-top: 5px solid #ffeb3b;
}

.ribbon.silver {
  background: linear-gradient(to bottom, #1976d2, #0d47a1);
  border-top: 5px solid #90caf9;
}

.ribbon.bronze {
  background: linear-gradient(to bottom, #388e3c, #1b5e20);
  border-top: 5px solid #a5d6a7;
}

.ribbon.platinum {
  background: linear-gradient(to bottom, #455a64, #263238);
  border-top: 5px solid #b0bec5;
}

/* Shine Effect */
.medal-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
  z-index: 4;
}
</style>
