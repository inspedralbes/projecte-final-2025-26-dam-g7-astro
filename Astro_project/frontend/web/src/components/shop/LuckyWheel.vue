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

const props = defineProps({
  user: {
    type: String,
    required: true,
    default: ""
  }
});

const emit = defineEmits(['win', 'update-balance']);

const isSpinning = ref(false);
const currentRotation = ref(0);

// CORRECCIÓ 1: L'array ha de coincidir exactament amb els 5 ítems del backend.
const items = [
    { id: 0, icon: 'mdi-heart', color: '#FF5252' },
    { id: 1, icon: 'mdi-decagram', color: '#9C27B0' },
    { id: 2, icon: 'mdi-ninja', color: '#2196F3' },
    { id: 3, icon: 'mdi-currency-usd', color: '#FFC107' },
    { id: 4, icon: 'mdi-emoticon-sad', color: '#795548' }
];

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
  if (isSpinning.value || !props.user) return;
  isSpinning.value = true;

  try {
    const response = await fetch('http://localhost:3000/api/shop/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: props.user }) 
    });
    
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al girar");
    }

    const winnerIndex = items.findIndex(i => i.id === data.prize.id);
    if (winnerIndex === -1) {
        throw new Error("El servidor ha retornat un premi no reconegut pel client.");
    }

    const degreePerItem = 360 / items.length;
    
    // CORRECCIÓ 2: Càlcul de l'angle objectiu dins d'una única circumferència (0-360)
    // Utilitzem un valor negatiu equivalent a la rotació necessària per alinear el segment a les 12 en punt.
    const targetAngle = 360 - (winnerIndex * degreePerItem) - (degreePerItem / 2);

    // Comptem quantes voltes completes porta l'estat actual per no retrocedir
    const currentSpins = Math.floor(currentRotation.value / 360);
    const extraSpins = 5;

    // Fixem la nova rotació: voltes actuals + 5 voltes d'inèrcia + angle on ha de caure
    currentRotation.value = (currentSpins + extraSpins) * 360 + targetAngle;

    setTimeout(() => {
      isSpinning.value = false;
      
      emit('win', {
          ...data.prize,
          color: items[winnerIndex].color 
      }); 
      
      if (data.newBalance !== undefined) {
          emit('update-balance', data.newBalance);
      }
    }, 4000);

  } catch (e) {
    console.error("❌ Error en la ruleta:", e);
    isSpinning.value = false;
    alert(e.message || "Error de comunicació amb el centre de comandament");
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