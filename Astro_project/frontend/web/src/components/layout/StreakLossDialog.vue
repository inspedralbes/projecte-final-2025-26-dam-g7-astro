<template>
  <v-dialog v-model="visible" max-width="450" persistent z-index="3000">
    <v-card class="streak-loss-card pa-6 rounded-xl text-center overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="glow-bg"></div>
      
      <div class="content-wrapper position-relative">
        <div class="icon-stack mb-4">
          <v-icon icon="mdi-fire-off" color="grey-lighten-1" size="80" class="base-icon"></v-icon>
          <v-icon icon="mdi-snowflake" color="cyan-accent-2" size="40" class="overlay-icon"></v-icon>
        </div>

        <h2 class="text-h4 font-weight-black text-white mb-2 uppercase">
          {{ $t('streak.loss_title') }}
        </h2>
        
        <p class="text-body-1 text-blue-grey-lighten-3 mb-6 px-4">
          {{ $t('streak.loss_desc', { streak: progressStore.previousStreak }) }}
        </p>

        <div v-if="progressStore.streakFreezes > 0" class="recovery-box pa-4 rounded-lg mb-6">
          <div class="text-overline text-cyan-accent-2 mb-1">{{ $t('streak.available_freezes') }}</div>
          <div class="d-flex align-center justify-center">
            <v-icon icon="mdi-snowflake" color="cyan-accent-2" class="mr-2"></v-icon>
            <span class="text-h5 font-weight-bold text-white">{{ progressStore.streakFreezes }}</span>
          </div>
        </div>

        <div v-else class="warning-box pa-4 rounded-lg mb-6">
          <p class="text-caption text-amber-accent-2 mb-0">
            {{ $t('streak.no_freezes') }}
          </p>
        </div>

        <div class="actions-stack d-flex flex-column gap-3">
          <v-btn
            v-if="progressStore.streakFreezes > 0"
            color="cyan-accent-2"
            size="x-large"
            block
            rounded="pill"
            class="font-weight-black text-black shadow-cyan"
            @click="handleRecover"
            :loading="loading"
          >
            <v-icon icon="mdi-auto-fix" start></v-icon>
            {{ $t('streak.recover_btn') }}
          </v-btn>

          <v-btn
            v-else
            color="amber-accent-2"
            variant="tonal"
            size="large"
            block
            rounded="pill"
            class="font-weight-bold"
            to="/shop"
            @click="visible = false"
          >
            <v-icon icon="mdi-cart" start></v-icon>
            {{ $t('streak.go_to_shop') }}
          </v-btn>

          <v-btn
            variant="text"
            color="grey-lighten-1"
            class="text-none"
            @click="handleClose"
          >
            {{ $t('streak.continue_anyway') }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useProgressStore } from '@/stores/progressStore';

const astroStore = useAstroStore();
const progressStore = useProgressStore();

const visible = ref(false);
const loading = ref(false);

// Observar si el store detecta que necesitamos un freeze
watch(() => progressStore.needsFreeze, (newValue) => {
  if (newValue === true) {
    visible.value = true;
  }
}, { immediate: true });

const handleRecover = async () => {
  loading.value = true;
  try {
    const result = await astroStore.useStreakFreeze();
    if (result.success) {
      visible.value = false;
      // El store ya actualiza needsFreeze a false
    }
  } catch (error) {
    console.error("Error al recuperar racha:", error);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  progressStore.setNeedsFreeze(false);
  // Al cerrar sin usar, la racha se perderá al jugar la siguiente partida según la lógica del backend
};
</script>

<style scoped>
.streak-loss-card {
  background: #05070a !important;
  border: 2px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.15);
  position: relative;
}

.glow-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(0, 229, 255, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.icon-stack {
  position: relative;
  display: inline-block;
}

.overlay-icon {
  position: absolute;
  bottom: -5px;
  right: -5px;
  filter: drop-shadow(0 0 10px #00e5ff);
  animation: pulse 2s infinite;
}

.base-icon {
  opacity: 0.6;
}

.recovery-box {
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
}

.warning-box {
  background: rgba(255, 213, 79, 0.05);
  border: 1px solid rgba(255, 213, 79, 0.2);
}

.shadow-cyan {
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
}

.uppercase {
  text-transform: uppercase;
  letter-spacing: 2px;
}

.gap-3 {
  gap: 12px;
}

@keyframes pulse {
  0% { transform: scale(1); filter: drop-shadow(0 0 5px #00e5ff); }
  50% { transform: scale(1.1); filter: drop-shadow(0 0 15px #00e5ff); }
  100% { transform: scale(1); filter: drop-shadow(0 0 5px #00e5ff); }
}
</style>
