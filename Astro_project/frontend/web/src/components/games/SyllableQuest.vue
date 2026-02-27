<template>
  <v-container class="text-center d-flex justify-center align-center fill-height">
    <v-card class="pa-6 bg-slate-900 border-amber game-shell" rounded="xl" width="100%" max-width="560">
      <div class="hud-row mb-6">
        <div class="text-subtitle-1 text-amber-accent-2 font-weight-bold">{{ $t('syllableQuest.points', { score: score }) }}</div>
        <div class="text-subtitle-1 font-weight-bold" :class="timeLeft <= 10 ? 'text-red-accent-2' : 'text-cyan-accent-2'">
          {{ $t('syllableQuest.time', { time: timeLeft }) }}
        </div>
      </div>

      <template v-if="!gameFinished">
        <div class="text-caption text-grey-lighten-1 mb-6">{{ $t('syllableQuest.missionProgress', { current: currentWordIndex + 1, total: words.length }) }}</div>

        <div class="d-flex justify-center gap-4 mb-8">
          <v-avatar
            v-for="n in currentWord.syllables"
            :key="n"
            :color="userSyllables >= n ? 'amber-accent-3' : 'grey-darken-3'"
            size="60"
            class="elevation-4"
          >
            <v-icon v-if="userSyllables >= n">mdi-music-note</v-icon>
          </v-avatar>
        </div>

        <v-btn
          @click="addSyllable"
          size="x-large"
          color="amber-accent-3"
          icon="mdi-hand-clap"
          class="mb-4"
        ></v-btn>

        <p class="text-subtitle-1 mb-4">{{ $t('syllableQuest.clickInstruction') }}</p>

        <v-btn @click="checkSyllables" color="success" block rounded="lg" class="font-weight-bold">
          {{ $t('syllableQuest.check') }}
        </v-btn>

        <v-alert v-if="message" :type="messageType" class="mt-4" variant="tonal">
          {{ message }}
        </v-alert>
      </template>

      <template v-else>
        <v-icon icon="mdi-trophy" color="amber-accent-3" size="70" class="mb-4"></v-icon>
        <h2 class="text-h4 mb-3">{{ $t('syllableQuest.completedTitle') }}</h2>
        <p class="text-h6 mb-1">{{ $t('syllableQuest.finalScore', { score: score }) }}</p>
        <p class="text-subtitle-1 text-grey-lighten-1 mb-1">{{ $t('syllableQuest.timeRemaining', { time: timeLeft }) }}</p>
        <p class="text-h6 text-cyan-accent-2 mb-6">{{ $t('syllableQuest.reward', { reward: finalReward }) }}</p>

        <v-btn @click="emitExit" color="amber-accent-3" class="text-black font-weight-bold" rounded="pill" size="large">
          {{ $t('syllableQuest.getReward') }}
        </v-btn>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { syllableData } from '@/data/syllableGamesData';

const { locale, t } = useI18n();
const emit = defineEmits(['game-over']);

const words = computed(() => {
    return syllableData[locale.value] || syllableData['es'];
});

const currentWordIndex = ref(0);
const currentWord = computed(() => words.value[currentWordIndex.value]);
const userSyllables = ref(0);
const score = ref(0);
const timeLeft = ref(60);
const gameFinished = ref(false);
const message = ref('');
const messageType = ref('info');
const finalReward = computed(() => score.value + timeLeft.value);
let timerInterval = null;

const addSyllable = () => {
  if (gameFinished.value) return;
  if (userSyllables.value < 8) userSyllables.value++;
};

const finishGame = () => {
  if (gameFinished.value) return;
  gameFinished.value = true;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const checkSyllables = () => {
  if (gameFinished.value) return;

  if (userSyllables.value === currentWord.value.syllables) {
    score.value += 60;
    message.value = t('syllableQuest.msgCorrect');
    messageType.value = 'success';

    if (currentWordIndex.value >= words.value.length - 1) {
      finishGame();
      return;
    }

    currentWordIndex.value++;
    userSyllables.value = 0;
  } else {
    score.value = Math.max(0, score.value - 10);
    message.value = t('syllableQuest.msgIncorrect');
    messageType.value = 'error';
    userSyllables.value = 0;
  }
};

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    if (gameFinished.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value === 0) {
      finishGame();
    }
  }, 1000);
};

const emitExit = () => {
  emit('game-over', finalReward.value);
};

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.game-shell {
  border: 1px solid rgba(255, 193, 7, 0.45);
}

.hud-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bg-slate-900 {
  background-color: #0f172a;
}

.border-amber {
  border: 1px solid rgba(255, 193, 7, 0.35);
}
</style>
