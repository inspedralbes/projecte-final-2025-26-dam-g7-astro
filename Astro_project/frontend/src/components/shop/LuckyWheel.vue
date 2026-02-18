<template>
  <div class="wheel-wrapper">
    <v-icon size="50" color="error" class="wheel-pointer">mdi-map-marker-down</v-icon>
    
    <div class="wheel" :style="wheelStyle">
      <div 
        v-for="(item, index) in items" 
        :key="index"
        class="wheel-segment"
        :style="getSegmentStyle(index)"
      >
        <v-icon color="white" size="32" class="segment-icon">{{ item.icon }}</v-icon>
      </div>
    </div>

    <div class="mt-8 text-center">
      <v-btn 
        color="amber-accent-4" 
        size="x-large" 
        rounded="xl" 
        elevation="6" 
        :loading="isSpinning" 
        :disabled="isSpinning"
        @click="spin"
      >
        <v-icon start>mdi-ticket</v-icon>
        Girar (50 monedas)
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const isSpinning = ref(false);
const currentRotation = ref(0);

// Items visuales (deben coincidir con el backend)
const items = [
    { id: 0, icon: 'mdi-heart', color: '#FF5252' },
    { id: 1, icon: 'mdi-decagram', color: '#9C27B0' },
    { id: 2, icon: 'mdi-ninja', color: '#2196F3' },
    { id: 3, icon: 'mdi-currency-usd', color: '#FFC107' },
    { id: 4, icon: 'mdi-emoticon-sad', color: '#795548' },
    { id: 5, icon: 'mdi-shield', color: '#607D8B' }
];

const emit = defineEmits(['win', 'update-balance']);

const wheelStyle = computed(() => {
  const degrees = 360 / items.length;
  let gradient = items.map((item, i) => 
    `${item.color} ${i * degrees}deg ${(i + 1) * degrees}deg`
  ).join(', ');
  
  return {
    background: `conic-gradient(${gradient})`,
    transform: `rotate(${currentRotation.value}deg)`,
    transition: isSpinning.value ? 'transform 4s cubic-bezier(0.1, 0, 0.2, 1)' : 'none'
  };
});

const getSegmentStyle = (index) => {
  const degreePerItem = 360 / items.length;
  const rotation = index * degreePerItem + (degreePerItem / 2);
  return {
    transform: `rotate(${rotation}deg) translate(0, -110px) rotate(-${rotation}deg)` 
  };
};

async function spin() {
  if (isSpinning.value) return;
  isSpinning.value = true;

  try {
    // PETICIÓN AL PUERTO 3000 (BACKEND)
    const response = await fetch('http://localhost:3000/api/shop/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: "JOEL" }) 
    });
    
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al girar");
    }

    // Animación visual basada en el resultado del servidor
    const winnerIndex = items.findIndex(i => i.id === data.prize.id);
    const degreePerItem = 360 / items.length;
    const extraSpins = 360 * 5; 
    const stopAngle = extraSpins - (winnerIndex * degreePerItem) - (degreePerItem / 2);

    currentRotation.value += stopAngle;

    setTimeout(() => {
      isSpinning.value = false;
      emit('win', data.prize); 
      if (data.newBalance !== undefined) {
          emit('update-balance', data.newBalance);
      }
    }, 4000);

  } catch (e) {
    console.error(e);
    isSpinning.value = false;
    alert(e.message || "Error de conexión con el servidor (Puerto 3000)");
  }
}
</script>

<style scoped>
.wheel-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 0;
}
.wheel {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 8px solid white;
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
  position: relative;
}
.wheel-pointer {
  position: absolute;
  top: -20px;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}
.wheel-segment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  display: flex; 
}
</style>