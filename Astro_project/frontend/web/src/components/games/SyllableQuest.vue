<template>
  <v-container class="text-center d-flex justify-center align-center fill-height">
    <v-card class="pa-6 bg-slate-900 border-amber game-shell" max-width="560" rounded="xl" width="100%">
      <div class="hud-row mb-6">
        <div class="text-subtitle-1 text-amber-accent-2 font-weight-bold">Punts: {{ score }}</div>
        <div class="text-subtitle-1 font-weight-bold" :class="timeLeft <= 10 ? 'text-red-accent-2' : 'text-cyan-accent-2'">
          Temps: {{ timeLeft }}s
        </div>
      </div>

      <template v-if="!gameFinished">
        <div class="text-h4 mb-2">{{ currentWord.text }}</div>
        <div class="text-caption text-grey-lighten-1 mb-6">Paraula {{ currentWordIndex + 1 }} / {{ words.length }}</div>

        <div class="d-flex justify-center gap-4 mb-8">
          <v-avatar
            v-for="n in currentWord.syllables"
            :key="n"
            class="elevation-4"
            :color="userSyllables >= n ? 'amber-accent-3' : 'grey-darken-3'"
            size="60"
          >
            <v-icon v-if="userSyllables >= n">mdi-music-note</v-icon>
          </v-avatar>
        </div>

        <v-btn
          class="mb-4"
          color="amber-accent-3"
          icon="mdi-hand-clap"
          size="x-large"
          @click="addSyllable"
        />

        <p class="text-subtitle-1 mb-4">Fes un "clic" per cada síl·laba!</p>

        <v-btn
          block
          class="font-weight-bold"
          color="success"
          rounded="lg"
          @click="checkSyllables"
        >
          Comprovar
        </v-btn>

        <v-alert v-if="message" class="mt-4" :type="messageType" variant="tonal">
          {{ message }}
        </v-alert>
      </template>

      <template v-else>
        <v-icon class="mb-4" color="amber-accent-3" icon="mdi-trophy" size="70" />
        <h2 class="text-h4 mb-3">Missió completada</h2>
        <p class="text-h6 mb-1">Punts: {{ score }}</p>
        <p class="text-subtitle-1 text-grey-lighten-1 mb-1">Temps restant: {{ timeLeft }}s</p>
        <p class="text-h6 text-cyan-accent-2 mb-6">Recompensa: {{ finalReward }}</p>

        <v-btn
          class="text-black font-weight-bold"
          color="amber-accent-3"
          rounded="pill"
          size="large"
          @click="emitExit"
        >
          Obtenir Recompensa
        </v-btn>
      </template>
    </v-card>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const emit = defineEmits(['game-over'])
  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
  })

  const words = [
    { text: 'OR-DI-NA-DOR', syllables: 4 },
    { text: 'GA-LÀ-XI-A', syllables: 4 },
    { text: 'COET', syllables: 2 },
    { text: 'TE-LES-CO-PI', syllables: 4 },
  ]

  const currentWordIndex = ref(0)
  const currentWord = computed(() => words[currentWordIndex.value])
  const userSyllables = ref(0)
  const score = ref(0)
  const timeLeft = ref(60)
  const gameFinished = ref(false)
  const message = ref('')
  const messageType = ref('info')
  const finalReward = computed(() => score.value + timeLeft.value)
  let timerInterval = null

  function addSyllable () {
    if (gameFinished.value) return
    if (userSyllables.value < 8) userSyllables.value++
  }

  function finishGame (silent = false) {
    if (gameFinished.value) return

    if (props.isMultiplayer && !silent) {
      gameFinished.value = true
      if (timerInterval) clearInterval(timerInterval)
      multiplayerStore.submitRoundResult()
      return
    }

    gameFinished.value = true
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function checkSyllables () {
    if (gameFinished.value) return

    if (userSyllables.value === currentWord.value.syllables) {
      score.value += 60
      message.value = 'Correcte!'
      messageType.value = 'success'

      if (currentWordIndex.value >= words.length - 1) {
        finishGame()
        if (props.isMultiplayer) emitExit()
        return
      }

      currentWordIndex.value++
      userSyllables.value = 0
    } else {
      score.value = Math.max(0, score.value - 10)
      message.value = 'Incorrecte, torna a provar.'
      messageType.value = 'error'
      userSyllables.value = 0
    }
  }

  function startTimer () {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    timerInterval = setInterval(() => {
      if (gameFinished.value) return
      timeLeft.value = Math.max(0, timeLeft.value - 1)
      if (timeLeft.value === 0) {
        finishGame()
      }
    }, 1000)
  }

  function emitExit () {
    emit('game-over', finalReward.value)
  }

  onMounted(() => {
    startTimer()
    if (props.isMultiplayer) {
    // En multijugador no necesitamos botón de "Obtener Recompensa"
    // Pero este juego ya empieza el timer al montar,
    // así que solo lo dejamos así.
    }
  })

  // Listener para eventos multijugador
  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      // El servidor ha cerrado la ronda, emitimos game-over para que el Lobby lo gestione
      gameFinished.value = true
      emitExit()
    }
  })

  // Notificar puntuación al servidor en modo multijugador
  watch(score, newScore => {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'SCORE_UPDATE',
        score: newScore,
      })
    }
  })

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })
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
