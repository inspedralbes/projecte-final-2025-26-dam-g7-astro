<template>
  <v-dialog v-model="showLevelUpDialog" max-width="450" persistent z-index="200">
    <v-card
      class="text-center pa-8 rounded-xl elevation-24"
      style="background: #020617; border: 2px solid #00e5ff; box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);"
    >
      <div class="mb-4">
        <v-icon icon="mdi-chevron-double-up" color="cyan-accent-3" size="90" class="animate-bounce"></v-icon>
      </div>

      <h2 class="text-h3 font-weight-black text-cyan-accent-3 mb-2 tracking-tighter">
        ¡NIVELL {{ newLevelData.level }}!
      </h2>

      <div
        v-if="newLevelData.rankChanged"
        class="my-5 pa-4 rounded-lg"
        style="background: rgba(0, 229, 255, 0.05); border: 1px dashed #00e5ff;"
      >
        <div class="text-overline text-grey-lighten-1">Nou Rang Assolit</div>
        <div class="text-h5 font-weight-bold text-white">{{ newLevelData.rank }}</div>
      </div>

      <p class="text-body-1 text-blue-grey-lighten-3 mb-8">
        Has acumulat <span class="text-white font-weight-bold">{{ astroStore.xp }} XP</span>
        <br>i ets un pas més a prop de dominar la galàxia.
      </p>

      <v-btn
        color="cyan-accent-3"
        variant="elevated"
        block
        rounded="xl"
        size="x-large"
        class="font-weight-black text-black"
        @click="showLevelUpDialog = false"
      >
        CONTINUAR EXPLORACIÓ
      </v-btn>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showFailDialog" max-width="400" persistent z-index="200">
    <v-card
      class="text-center pa-8 rounded-xl elevation-24"
      style="background: #0f0505; border: 2px solid #ff5252; box-shadow: 0 0 30px rgba(255, 82, 82, 0.2);"
    >
      <v-icon icon="mdi-alert-octagon" color="red-accent-2" size="80" class="mb-4 pulse-red"></v-icon>

      <h2 class="text-h4 font-weight-black text-white mb-2 uppercase">Misión Fallida</h2>

      <div class="py-4">
        <div class="text-overline text-red-accent-1">Puntuación Obtenida</div>
        <div class="text-h2 font-weight-black text-white mb-4">{{ lastScore }}</div>

        <v-divider class="border-red-accent-2 opacity-30 mb-6"></v-divider>

        <p class="text-body-1 text-blue-grey-lighten-2">
          Necesitas alcanzar los <span class="text-white font-weight-bold">{{ requiredScore }} pts</span><br>
          para desbloquear este sector.
        </p>
      </div>

      <v-btn
        color="red-accent-2"
        variant="flat"
        block
        rounded="xl"
        size="x-large"
        class="font-weight-bold text-white mt-4"
        style="background: linear-gradient(45deg, #ff5252, #b71c1c) !important;"
        @click="showFailDialog = false"
      >
        REINTENTAR MISIÓN
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useAstroStore } from '@/stores/astroStore';

const astroStore = useAstroStore();

const showLevelUpDialog = ref(false);
const showFailDialog = ref(false);

const lastScore = ref(0);
const requiredScore = ref(0);

const newLevelData = ref({
  level: 1,
  rank: '',
  rankChanged: false
});

const closeDialogs = () => {
  showLevelUpDialog.value = false;
  showFailDialog.value = false;
};

const processGameResult = async ({ finalScore = 0, levelIndex = null, levelConfig = null, gameName = 'Minijuego' }) => {
  const normalizedScore = Number(finalScore) || 0;
  lastScore.value = normalizedScore;

  if (!astroStore.user || levelIndex === null || !levelConfig) {
    return { success: false, reason: 'missing-context' };
  }

  const minScore = Number(levelConfig.minScore ?? 0);
  if (normalizedScore < minScore) {
    requiredScore.value = minScore;
    showFailDialog.value = true;
    return { success: false, reason: 'min-score', requiredScore: minScore };
  }

  try {
    const previousAccountLevel = astroStore.level;
    const currentMap = astroStore.mapLevel || 1;
    const nodeToComplete = levelIndex + 1 === currentMap ? currentMap : null;
    const result = await astroStore.registerCompletedGame(gameName, normalizedScore, nodeToComplete);

    if (!result.success) {
      return {
        success: false,
        reason: 'register-error',
        message: result.message || 'No s\'ha pogut registrar la partida.'
      };
    }

    const levelUp = astroStore.level > previousAccountLevel;
    if (levelUp) {
      newLevelData.value = {
        level: astroStore.level,
        rank: result.data?.newRank || 'Explorador',
        rankChanged: Boolean(result.data?.newRank)
      };
      showLevelUpDialog.value = true;
    }

    return {
      success: true,
      score: normalizedScore,
      levelUp,
      newLevel: astroStore.level
    };
  } catch (error) {
    return {
      success: false,
      reason: 'exception',
      message: error instanceof Error ? error.message : 'Error desconegut'
    };
  }
};

defineExpose({
  processGameResult,
  closeDialogs
});
</script>

<style scoped>
.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
}

.pulse-red {
  animation: pulse-red-effect 2s infinite;
}

@keyframes pulse-red-effect {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.tracking-tighter {
  letter-spacing: -1px !important;
}

.uppercase {
  text-transform: uppercase;
}
</style>
