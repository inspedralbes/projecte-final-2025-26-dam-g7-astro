<template>
  <div class="hero-hearts-container d-flex align-center">
    <div v-for="i in 3" :key="i" class="heart-wrapper">
      <v-icon
        :color="getHeartColor(i)"
        class="heart-icon"
        :size="size"
      >
        {{ getHeartIcon(i) }}
      </v-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  health: { type: Number, default: 12 }, // 0 a 12 (4 por corazón)
  size: { type: Number, default: 24 }
})

function getHeartIcon(heartIndex) {
  const heartHealth = Math.max(0, Math.min(4, props.health - (heartIndex - 1) * 4))
  
  if (heartHealth >= 4) return 'mdi-heart'
  if (heartHealth === 3) return 'mdi-heart-half-full' // Usamos half-full para 3/4 (aproximación visual)
  if (heartHealth === 2) return 'mdi-heart-half'
  if (heartHealth === 1) return 'mdi-heart-outline' // Usamos outline para 1/4 (aproximación visual) o podrías usar una capa
  return 'mdi-heart-broken' // Vacío
}

function getHeartColor(heartIndex) {
  const heartHealth = Math.max(0, Math.min(4, props.health - (heartIndex - 1) * 4))
  if (heartHealth <= 0) return 'grey-darken-2'
  return 'red-accent-3'
}
</script>

<style scoped>
.heart-wrapper {
  margin: 0 1px;
  display: flex;
  align-center: center;
}

.heart-icon {
  filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
  transition: all 0.3s ease;
}
</style>
