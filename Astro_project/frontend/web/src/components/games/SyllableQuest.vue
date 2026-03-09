<template>
  <v-container class="text-center d-flex justify-center align-center fill-height">
    <v-card class="pa-6 bg-slate-900 border-amber game-shell" rounded="xl" width="100%" max-width="560">
      <div class="hud-row mb-6">
        <div class="text-subtitle-1 text-amber-accent-2 font-weight-bold">Punts: {{ score }}</div>
        <div class="text-subtitle-1 font-weight-bold d-flex align-center" :class="timeLeft <= 10 ? 'text-red-accent-2' : 'text-cyan-accent-2'">
          Temps: {{ timeLeft }}s
          <v-icon v-if="isSlowTimeActive" size="small" color="blue-accent-2" class="ml-1">mdi-timer-sand-empty</v-icon>
          <v-icon v-if="isShieldActive" size="small" color="teal-accent-4" class="ml-2">mdi-shield-check</v-icon>
        </div>
      </div>

      <template v-if="!gameFinished">
        <div class="text-h4 mb-2">{{ currentWord.text }}</div>
        <div class="text-caption text-grey-lighten-1 mb-6">Paraula {{ currentWordIndex + 1 }} / {{ words.length }}</div>

        <div class="d-flex justify-center gap-4 mb-8">
          <v-avatar v-for="n in currentWord.syllables" :key="n" :color="userSyllables >= n ? 'amber-accent-3' : 'grey-darken-3'" size="60" class="elevation-4">
            <v-icon v-if="userSyllables >= n">mdi-music-note</v-icon>
          </v-avatar>
        </div>

        <v-btn @click="addSyllable" size="x-large" color="amber-accent-3" icon="mdi-hand-clap" class="mb-4"></v-btn>
        <p class="text-subtitle-1 mb-4">Fes un "clic" per cada síl·laba!</p>
        <v-btn @click="checkSyllables" color="success" block rounded="lg" class="font-weight-bold">Comprovar</v-btn>

        <v-alert v-if="message" :type="messageType" class="mt-4" variant="tonal">
          {{ message }}
        </v-alert>
      </template>

    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAstroStore } from '@/stores/astroStore';

const multiplayerStore = useMultiplayerStore();
const astroStore = useAstroStore();

const emit = defineEmits(['game-over']);
const props = defineProps({ isMultiplayer: { type: Boolean, default: false } });

// BOOSTERS
const isSlowTimeActive = computed(() => (astroStore.activeBoosters?.slowTimeGamesLeft || 0) > 0);
const isShieldActive = ref(false);

const words = [
  { text: 'OR-DI-NA-DOR', syllables: 4 },
  { text: 'GA-LÀ-XI-A', syllables: 4 },
  { text: 'COET', syllables: 2 },
  { text: 'TE-LES-CO-PI', syllables: 4 }
];

const currentWordIndex = ref(0);
const currentWord = computed(() => words[currentWordIndex.value]);
const userSyllables = ref(0);
const score = ref(0);
const timeLeft = ref(60);
const gameFinished = ref(false);
const message = ref('');
const messageType = ref('info');
let timerInterval = null;

const addSyllable = () => { if (gameFinished.value) return; if (userSyllables.value < 8) userSyllables.value++; };

const finishGame = (silent = false) => {
  if (gameFinished.value) return;
  if (props.isMultiplayer && !silent) {
    gameFinished.value = true;
    if (timerInterval) clearInterval(timerInterval);
    multiplayerStore.submitRoundResult();
    return;
  }
  gameFinished.value = true;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  emit('game-over', score.value);
};

const checkSyllables = () => {
  if (gameFinished.value) return;

  if (userSyllables.value === currentWord.value.syllables) {
    score.value += 60;
    message.value = 'Correcte!';
    messageType.value = 'success';

    if (currentWordIndex.value >= words.length - 1) {
      finishGame();
      return;
    }

    currentWordIndex.value++;
    userSyllables.value = 0;
  } else {
    // ESCUDO
    if (isShieldActive.value) {
      isShieldActive.value = false;
      message.value = '¡Escudo sónico activado! Inténtalo de nuevo sin penalización.';
      messageType.value = 'warning';
      userSyllables.value = 0;
      return;
    }

    score.value = Math.max(0, score.value - 10);
    message.value = 'Incorrecte, torna a provar.';
    messageType.value = 'error';
    userSyllables.value = 0;
  }
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  const tickTime = isSlowTimeActive.value ? 1250 : 1000;
  timerInterval = setInterval(() => {
    if (gameFinished.value) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value === 0) finishGame();
  }, tickTime);
};

onMounted(() => {
    isShieldActive.value = (astroStore.activeBoosters?.shieldGamesLeft || 0) > 0;
    startTimer();
});

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;
  if (msg.type === 'ROUND_ENDED_BY_WINNER') { gameFinished.value = true; emit('game-over', score.value); }
});

watch(score, (newScore) => { if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore }); });

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval); });
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
