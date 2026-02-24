<template>
  <div class="wheel-wrapper">
    <v-icon size="60" color="amber-accent-4" class="wheel-pointer">mdi-map-marker-down</v-icon>
    
    <div class="wheel" :style="wheelStyle">
      <div 
        v-for="(item, index) in items" 
        :key="index"
        class="wheel-segment"
        :style="getSegmentStyle(index)"
      >
        <v-icon color="white" size="36" class="segment-icon">{{ item.icon }}</v-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const getSegmentStyle = (index) => {
  const degreePerItem = 360 / items.length;
  const rotation = index * degreePerItem + (degreePerItem / 2);
  return {
    // Hem ajustat a -115px perquè quedi exactament al centre òptic del segment
    transform: `rotate(${rotation}deg) translateY(-115px) rotate(-${rotation}deg)` 
  };
};

const props = defineProps({
  user: { type: String, required: true, default: "" }
});

// Afegim esdeveniments d'inici i final per bloquejar els botons al pare
const emit = defineEmits(['win', 'update-balance', 'update-inventory', 'spin-start', 'spin-end']);

const isSpinning = ref(false);
const currentRotation = ref(0);

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


async function spin() {
  if (isSpinning.value || !props.user) return;
  isSpinning.value = true;
  emit('spin-start');

  try {
    const response = await fetch('http://localhost:3000/api/shop/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: props.user }) 
    });
    
    const data = await response.json();

    if (!response.ok || !data.success) throw new Error(data.message || "Error al girar");

    const winnerIndex = items.findIndex(i => i.id === data.prize.id);
    if (winnerIndex === -1) throw new Error("El servidor ha retornat un premi desconegut.");

    const degreePerItem = 360 / items.length;
    const targetAngle = 360 - (winnerIndex * degreePerItem) - (degreePerItem / 2);

    const currentSpins = Math.floor(currentRotation.value / 360);
    const extraSpins = 5;

    currentRotation.value = (currentSpins + extraSpins) * 360 + targetAngle;

    setTimeout(() => {
      isSpinning.value = false;
      emit('spin-end');
      emit('win', {
        ...data.prize,
        color: items[winnerIndex].color,
        rewardMessage: data.rewardMessage || null,
        prizeApplied: !!data.prizeApplied
      });
      if (data.newBalance !== undefined) emit('update-balance', data.newBalance);
      if (Array.isArray(data.inventory)) emit('update-inventory', data.inventory);
    }, 4000);

  } catch (e) {
    console.error("❌ Error en la ruleta:", e);
    isSpinning.value = false;
    emit('spin-end');
    alert(e.message || "Error de comunicació");
  }
}

// Això permet que el pare (shop.vue) pugui executar aquesta funció
defineExpose({ spin });
</script>

<style scoped>
.wheel-segment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  /* Eliminem el display: flex d'aquí per evitar comportaments imprevistos */
}

.segment-icon {
  position: absolute;
  /* Això és la clau matemàtica: centra la icona sobre el punt exacte de la circumferència */
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.wheel-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
  z-index: 2;
}
.wheel {
  width: 350px;
  height: 350px;
  border-radius: 50%;
  border: 10px solid #1e293b;
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.2), inset 0 0 20px rgba(0,0,0,0.5);
  position: relative;
}
.wheel-pointer {
  position: absolute;
  top: -25px;
  z-index: 10;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));
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
