<template>
  <v-container class="d-flex flex-column align-center justify-start game-container pa-0" fluid style="height: 100vh; overflow: hidden;">

    <v-card
      v-if="!isPlaying && !isGameOver"
      class="pa-10 text-center bg-grey-darken-4 border-cyan"
      max-width="800"
      rounded="xl"
      width="100%"
    >
      <v-icon class="mb-6 animate-bounce" color="cyan-accent-3" icon="mdi-timer-sand" size="100" />
      <h1 class="text-h2 font-weight-black text-white mb-6">{{ $t('rhymeSquad.title') }}</h1>
      <p class="text-h5 text-grey-lighten-1 mb-10" v-html="$t('rhymeSquad.desc')" />

      <!-- AVISOS DE ROLES MULTIJUGADOR -->
      <div v-if="isMultiplayer" class="mb-8">
        <v-row>
          <v-col cols="12" md="6">
            <div
              class="pa-6 rounded-xl border-2 mb-4 h-100 d-flex flex-column align-center justify-center transition-all"
              :class="subRole === 'catcher' ? 'bg-green-darken-4 border-green' : 'bg-grey-darken-3 opacity-50'"
            >
              <v-icon :color="subRole === 'catcher' ? 'green-accent-3' : 'grey'" size="64" class="mb-4">mdi-basket-fill</v-icon>
              <h2 class="text-h4 font-weight-black mb-2" :class="subRole === 'catcher' ? 'text-green-accent-3' : 'text-grey'">{{ $t('rhymeSquad.roleCatcher') || 'RECOL·LECTOR' }}</h2>
              <p class="text-body-1 text-white">{{ $t('rhymeSquad.catcherDesc') || '¡Atrapa només les paraules que rimin amb la pista!' }}</p>
              <v-chip v-if="subRole === 'catcher'" color="green-accent-3" class="mt-4 font-weight-bold">TEU ROL</v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div
              class="pa-6 rounded-xl border-2 mb-4 h-100 d-flex flex-column align-center justify-center transition-all"
              :class="subRole === 'sniper' ? 'bg-red-darken-4 border-red' : 'bg-grey-darken-3 opacity-50'"
            >
              <v-icon :color="subRole === 'sniper' ? 'red-accent-3' : 'grey'" size="64" class="mb-4">mdi-target</v-icon>
              <h2 class="text-h4 font-weight-black mb-2" :class="subRole === 'sniper' ? 'text-red-accent-3' : 'text-grey'">{{ $t('rhymeSquad.roleSniper') || 'DESTRUCTOR' }}</h2>
              <p class="text-body-1 text-white">{{ $t('rhymeSquad.sniperDesc') || '¡Destrueix les paraules que NO rimin per protegir al company!' }}</p>
              <v-chip v-if="subRole === 'sniper'" color="red-accent-3" class="mt-4 font-weight-bold">TEU ROL</v-chip>
            </div>
          </v-col>
        </v-row>

        <div v-if="!isHost" class="mt-4 text-center">
          <v-progress-circular color="cyan-accent-3" indeterminate size="32" />
          <p class="text-h6 text-cyan-accent-3 mt-4">{{ $t('rhymeSquad.waitingForHost') || 'Esperant que el Comandant iniciï la missió...' }}</p>
        </div>
      </div>

      <v-btn
        v-if="!isMultiplayer"
        block
        class="font-weight-black text-black text-h6"
        color="cyan-accent-3"
        height="60"
        rounded="pill"
        size="x-large"
        @click="handleStartClick"
      >
        {{ $t('rhymeSquad.startMission') }}
      </v-btn>
      <div v-else-if="isHost" class="text-h6 text-cyan-accent-2 animate-pulse mt-4">
        {{ $t('multiplayerLobby.autoStarting') || 'LA MISIÓN COMENZARÁ TRAS EL BRIEFING...' }}
      </div>
    </v-card>

    <template v-else-if="isPlaying">
      <!-- Header Arcade Persistente -->
      <div class="arcade-hud w-100 pa-4 d-flex justify-space-between align-center">
        <div class="hud-left d-flex gap-4">
          <div class="arcade-stat score">
            <span class="label">SCORE</span>
            <span class="value">{{ score.toString().padStart(6, '0') }}</span>
          </div>
          <div class="arcade-stat combo" v-if="combo > 0">
            <span class="label">COMBO</span>
            <span class="value text-cyan-accent-2">x{{ combo }}</span>
          </div>
        </div>

        <div class="hud-center">
          <div class="mission-objective pa-4 rounded-xl">
            <div class="objective-label">{{ $t('rhymeSquad.findRhymes') }}</div>
            <div class="objective-word glow-text">{{ currentTarget?.word || '---' }}</div>
          </div>
        </div>

        <div class="hud-right d-flex gap-4 align-center">
          <div class="arcade-stat time" :class="{ 'critical': timeLeft <= 10 }">
            <v-icon icon="mdi-timer-outline" class="mr-2" />
            <span class="value">{{ timeLeft }}s</span>
          </div>
          <div class="lives-display d-flex gap-1">
            <v-icon 
              v-for="i in (props.isMultiplayer ? 10 : 3)" 
              :key="i"
              :icon="i <= lives ? 'mdi-heart' : 'mdi-heart-outline'"
              :color="i <= lives ? 'red-accent-2' : 'grey-darken-2'"
              size="24"
              class="heart-icon"
            />
          </div>
        </div>
      </div>

      <div
        class="play-area position-relative w-100"
        :class="{ 'turbo-mode': isTurbo }"
        style="flex: 1; min-height: 0; background: radial-gradient(circle at center, rgba(13, 2, 33, 0.4) 0%, transparent 100%);"
        @click.self="missClick"
      >
        <div v-if="isTurbo" class="nebula-bg" />

        <transition-group name="fade">
          <div
            v-for="word in activeWords"
            :key="word.id"
            class="falling-word"
            :class="getWordStatusClass(word.status)"
            :style="{ left: word.x + '%', animationDuration: word.speed + 's' }"
            @animationend="removeWord(word.id, false)"
            @mousedown="catchWord(word)"
          >
            {{ word.text }}
          </div>
        </transition-group>

        <transition name="fade-up">
          <div v-if="showTimeBonus" class="time-bonus-feedback text-h2 font-weight-black text-green-accent-3">+1s</div>
        </transition>

        <!-- Feedback Visual Overlay -->
        <v-overlay
          v-model="showFeedback"
          contained
          class="align-center justify-center pointer-events-none"
          persistent
          no-click-animation
          scrim="transparent"
        >
          <div class="feedback-container" :class="feedbackType">
            <v-icon
              v-if="feedbackType === 'success'"
              color="success"
              size="120"
              class="feedback-icon animate-success"
            >
              mdi-check-circle
            </v-icon>
            <v-icon
              v-else
              color="error"
              size="120"
              class="feedback-icon animate-error"
            >
              mdi-close-circle
            </v-icon>
          </div>
        </v-overlay>
      </div>
    </template>

    <v-card
      v-else-if="isGameOver && !isMultiplayer"
      class="pa-10 text-center bg-grey-darken-4 border-cyan"
      max-width="600"
      rounded="xl"
      width="100%"
    >
      <v-icon class="mb-4" :color="lives > 0 ? 'cyan-accent-2' : 'red-accent-2'" :icon="lives > 0 ? 'mdi-flag-checkered' : 'mdi-skull-crossbones'" size="100" />
      <h2 class="text-h3 text-white mb-2">{{ lives > 0 ? $t('rhymeSquad.timeOut') : $t('rhymeSquad.missionFailed') }}</h2>

      <div class="d-flex justify-space-around my-8">
        <div class="text-center">
          <div class="text-h2 text-success font-weight-bold">{{ correctHits }}</div>
          <div class="text-subtitle-1">{{ $t('rhymeSquad.rhymesCaught') }}</div>
        </div>
        <div class="text-center">
          <div class="text-h2 text-error font-weight-bold">{{ incorrectHits }}</div>
          <div class="text-subtitle-1">{{ $t('rhymeSquad.errors') }}</div>
        </div>
      </div>

      <p class="text-h4 text-white mb-2">{{ $t('rhymeSquad.finalScore', { score: score }) }}</p>
      <p class="text-h6 text-grey-lighten-1 mb-8">{{ $t('rhymeSquad.maxCombo', { combo: maxCombo }) }}</p>

      <v-btn
        color="cyan-accent-3"
        height="60"
        size="x-large"
        rounded="pill"
        variant="flat"
        class="text-black font-weight-bold text-h6 block w-100"
        @click="emitExit"
      >
        {{ $t('rhymeSquad.getReward') }}
      </v-btn>
    </v-card>



  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { rhymeData } from '@/data/rhymeGamesData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t, locale } = useI18n()
  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['game-over'])

  const subRole = computed(() => multiplayerStore.subRole)
  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)
  const isWaitingForOthers = ref(false)

  const currentDictionary = computed(() => {
    return rhymeData[locale.value] || rhymeData['es']
  })

  const isPlaying = ref(false)
  const isGameOver = ref(false)
  const score = ref(0)
  const lives = ref(props.isMultiplayer ? 10 : 3)
  const timeLeft = ref(60)
  const combo = ref(0)
  const maxCombo = ref(0)
  const correctHits = ref(0)
  const incorrectHits = ref(0)
  const isTurbo = ref(false)
  const showTimeBonus = ref(false)

  // --- REFORÇ VISUAL I SONOR ---
  const showFeedback = ref(false)
  const feedbackType = ref('success')

  const sounds = {
    success: '/assets/sounds/success.mp3',
    error: '/assets/sounds/error.mp3',
  }

  function triggerFeedback (type) {
    feedbackType.value = type
    showFeedback.value = true

    const audio = new Audio(sounds[type])
    audio.volume = 0.3
    audio.play().catch(e => console.warn('Audio blocked:', e))

    setTimeout(() => {
      showFeedback.value = false
    }, 600)
  }

  const currentTarget = ref(null)
  const activeWords = ref([])

  let gameLoopInterval = null
  let timerInterval = null
  let wordIdCounter = 0
  let currentSpawnRate = 1200
  let currentSpeed = 5
  let bonusTimeout = null

  function handleStartClick () {
    if (props.isMultiplayer && isHost.value) {
      multiplayerStore.sendGameAction({ type: 'RHYME_START' })
    }
    startGame()
  }

  function startGame () {
    score.value = 0
    lives.value = props.isMultiplayer ? 10 : 3
    timeLeft.value = 60
    combo.value = 0
    maxCombo.value = 0
    correctHits.value = 0
    incorrectHits.value = 0
    isTurbo.value = false
    activeWords.value = []

    isPlaying.value = true
    isGameOver.value = false
    currentSpawnRate = 1200
    currentSpeed = 5

    if (!props.isMultiplayer || isHost.value) {
      pickNewTarget()
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({ type: 'RHYME_TARGET_SYNC', target: currentTarget.value })
        multiplayerStore.sendGameAction({ type: 'RHYME_START' })
      }
      gameLoopInterval = setInterval(spawnWord, currentSpawnRate)
    }

    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (!isPlaying.value) return

      if (!props.isMultiplayer || isHost.value) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000

          if (props.isMultiplayer) {
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }

          if (timeLeft.value <= 0) {
            timeLeft.value = 0
            if (props.isMultiplayer && isHost.value) {
              multiplayerStore.sendGameAction({ type: 'RHYME_TIME_UP' })
            }
            endGame()
          }
        }
      }
    }, 500)
  }

  function pickNewTarget () {
    const randomIndex = Math.floor(Math.random() * currentDictionary.value.length)
    currentTarget.value = currentDictionary.value[randomIndex]
  }

  function spawnWord () {
    if (!isPlaying.value) return
    if (props.isMultiplayer && !isHost.value) return

    let wordsToSpawn = 1
    if (combo.value > 3 && Math.random() < 0.35) wordsToSpawn = 2
    if (isTurbo.value && Math.random() < 0.25) wordsToSpawn = 3

    const zones = [{ min: 5, max: 25 }, { min: 35, max: 55 }, { min: 65, max: 85 }]
    zones.sort(() => Math.random() - 0.5)

    for (let i = 0; i < wordsToSpawn; i++) {
      const isRhyme = Math.random() < 0.35
      const wordList = isRhyme ? currentTarget.value.rhymes : currentTarget.value.fakes
      const wordText = wordList[Math.floor(Math.random() * wordList.length)]

      const targetZone = zones[i % zones.length]
      const posX = Math.random() * (targetZone.max - targetZone.min) + targetZone.min

      const newWord = {
        id: wordIdCounter++,
        text: wordText,
        isRhyme: isRhyme,
        status: 'falling',
        x: posX,
        speed: isTurbo.value ? currentSpeed * 0.75 : currentSpeed,
      }
      activeWords.value.push(newWord)

      if (props.isMultiplayer && isHost.value) {
        multiplayerStore.sendGameAction({ type: 'RHYME_SPAWN_WORD', word: newWord })
      }
    }

    if (currentSpawnRate > 500) {
      clearInterval(gameLoopInterval)
      currentSpawnRate -= 20
      currentSpeed -= 0.05
      gameLoopInterval = setInterval(spawnWord, currentSpawnRate)
    }
  }

  function catchWord (word) {
    if (!isPlaying.value || word.status !== 'falling') return

    let isActionCorrect = false

    if (props.isMultiplayer) {
      if (subRole.value === 'catcher') {
        isActionCorrect = word.isRhyme
      } else if (subRole.value === 'sniper') {
        isActionCorrect = !word.isRhyme
      }
    } else {
      isActionCorrect = word.isRhyme
    }

    if (isActionCorrect) {
      word.status = 'correct'
      correctHits.value++
      timeLeft.value += 1
      triggerTimeBonusVisual()
      score.value += isTurbo.value ? 20 : 10
      combo.value++
      if (combo.value > maxCombo.value) maxCombo.value = combo.value
      if (combo.value >= 10) isTurbo.value = true
      if (combo.value % 5 === 0 && (!props.isMultiplayer || isHost.value)) pickNewTarget()
      triggerFeedback('success')
    } else {
      word.status = 'incorrect'
      incorrectHits.value++
      takeDamage()
      triggerFeedback('error')
    }

    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'RHYME_CATCH', id: word.id, status: word.status })
    }

    setTimeout(() => {
      removeWord(word.id, true)
    }, 350)
  }

  function triggerTimeBonusVisual () {
    showTimeBonus.value = true
    if (bonusTimeout) clearTimeout(bonusTimeout)
    bonusTimeout = setTimeout(() => {
      showTimeBonus.value = false
    }, 500)
  }

  function removeWord (id, clicked) {
    const wordIndex = activeWords.value.findIndex(w => w.id === id)
    if (wordIndex !== -1) {
      const word = activeWords.value[wordIndex]
      activeWords.value.splice(wordIndex, 1)

      if (!clicked && word.isRhyme && word.status === 'falling') {
        incorrectHits.value++
        takeDamage()
      }
    }
  }

  function missClick () {
    if (!isPlaying.value) return
    combo.value = 0
    isTurbo.value = false
  }

  function takeDamage () {
    if (props.isMultiplayer) {
      if (isHost.value) {
        lives.value = Math.max(0, lives.value - 1)
        multiplayerStore.sendGameAction({ type: 'LIVES_SYNC', lives: lives.value })
      } else {
        multiplayerStore.sendGameAction({ type: 'TAKE_DAMAGE' })
        return
      }
    } else {
      lives.value = Math.max(0, lives.value - 1)
    }

    combo.value = 0
    isTurbo.value = false

    if (lives.value <= 0) {
      endGame()
    }
  }

  function forceEndGame () {
    endGame()
  }

  function endGame (silent = false) {
    if (props.isMultiplayer && !silent && timeLeft.value > 0 && lives.value > 0) {
      return
    }

    if (props.isMultiplayer && !silent) {
      if (isHost.value) {
        isPlaying.value = false
        isGameOver.value = true
        clearInterval(gameLoopInterval)
        clearInterval(timerInterval)
        activeWords.value = []
        multiplayerStore.submitRoundResult()
      } else if (lives.value <= 0 || timeLeft.value <= 0) {
        isPlaying.value = false
        isGameOver.value = true
        clearInterval(gameLoopInterval)
        clearInterval(timerInterval)
        activeWords.value = []
        multiplayerStore.submitRoundResult()
      }
      return
    }

    isPlaying.value = false
    isGameOver.value = true
    clearInterval(gameLoopInterval)
    clearInterval(timerInterval)
    activeWords.value = []
  }

  function emitExit () {
    emit('game-over', score.value)
  }

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'ROUND_ENDED_BY_WINNER' && !isGameOver.value && isPlaying.value) {
      isPlaying.value = false
      isGameOver.value = true
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) endGame()
      }
      if (msg.action?.type === 'RHYME_TARGET_SYNC' && !isHost.value) {
        currentTarget.value = msg.action.target
        if (!isPlaying.value && !isGameOver.value) startGame()
      }
      if (msg.action?.type === 'RHYME_START' && !isHost.value) startGame()
      if (msg.action?.type === 'RHYME_SPAWN_WORD' && !isHost.value) activeWords.value.push(msg.action.word)
      if (msg.action?.type === 'RHYME_CATCH') {
        const id = msg.action.id
        const index = activeWords.value.findIndex(w => w.id === id)
        if (index !== -1) {
          activeWords.value[index].status = msg.action.status
          if (msg.action.status === 'correct' && isHost.value) {
            score.value += isTurbo.value ? 20 : 10
          }
          setTimeout(() => {
            removeWord(id, true)
          }, 350)
        }
      }
      if (msg.action?.type === 'TAKE_DAMAGE' && isHost.value) takeDamage()
      if (msg.action?.type === 'LIVES_SYNC' && !isHost.value) {
        lives.value = msg.action.lives
        if (lives.value <= 0) endGame()
      }
      if (msg.action?.type === 'RHYME_TIME_UP') {
        endGame()
      }
      if (msg.action?.type === 'REQUEST_RHYME_SYNC' && isHost.value) {
        multiplayerStore.sendGameAction({ type: 'RHYME_TARGET_SYNC', target: currentTarget.value })
        multiplayerStore.sendGameAction({ type: 'LIVES_SYNC', lives: lives.value })
      }
    }
  }, { immediate: true })

  watch(score, newScore => {
    if (props.isMultiplayer && isHost.value) {
      multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
    }
  })

  onUnmounted(() => {
    clearInterval(gameLoopInterval)
    clearInterval(timerInterval)
    if (bonusTimeout) clearTimeout(bonusTimeout)
  })

  onMounted(() => {
    if (props.isMultiplayer) {
      if (!isHost.value) {
        multiplayerStore.sendGameAction({ type: 'REQUEST_RHYME_SYNC' })
      }
      
      // Cargamos el primer target de inmediato
      if (isHost.value) pickNewTarget()

      // Pero no empezamos el spawn de palabras ni el tiempo hasta que pase el briefing (Reducido a 1.5s)
      setTimeout(() => {
        if (!isPlaying.value) {
          if (isHost.value) handleStartClick()
          else startGame()
        }
      }, 1500)
    }
  })

  function getWordStatusClass (status) {
    if (status === 'correct') return 'word-correct'
    if (status === 'incorrect') return 'word-incorrect'
    return 'word-falling'
  }
</script>

<style scoped>
.game-container { 
  background: radial-gradient(circle at center, #0d0221 0%, #020617 100%);
  color: white;
}

.arcade-hud {
  background: rgba(0, 0, 0, 0.6);
  border-bottom: 2px solid rgba(0, 229, 255, 0.3);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.arcade-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-family: 'Orbitron', sans-serif;
}

.arcade-stat .label {
  font-size: 0.7rem;
  color: rgba(0, 229, 255, 0.7);
  letter-spacing: 1px;
}

.arcade-stat .value {
  font-size: 1.8rem;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.mission-objective {
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.4);
  min-width: 300px;
  text-align: center;
  box-shadow: inset 0 0 20px rgba(0, 229, 255, 0.1);
}

.objective-label {
  font-size: 0.8rem;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.objective-word {
  font-size: 2.5rem;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  letter-spacing: 4px;
  line-height: 1;
}

.critical .value {
  color: #ff5252;
  animation: pulse-red 0.5s infinite alternate;
}

.heart-icon {
  filter: drop-shadow(0 0 5px rgba(255, 82, 82, 0.5));
}

.glow-text { text-shadow: 0 0 20px rgba(0, 229, 255, 0.8); }

.play-area { 
  overflow: hidden;
  cursor: crosshair;
}

.falling-word { 
  position: absolute; 
  top: -100px; 
  padding: 12px 24px; 
  border-radius: 12px; 
  font-weight: 900; 
  font-size: 1.2rem; 
  color: white; 
  user-select: none; 
  animation-name: fallAnimation; 
  animation-timing-function: linear; 
  animation-fill-mode: forwards; 
  transition: transform 0.1s ease; 
  z-index: 10; 
  cursor: pointer;
  white-space: nowrap;
}

.word-falling { 
  background: rgba(15, 23, 42, 0.9); 
  border: 1px solid rgba(0, 229, 255, 0.3); 
  box-shadow: 0 4px 15px rgba(0,0,0,0.5); 
}

.word-falling:hover { 
  transform: scale(1.1) rotate(2deg); 
  border-color: #00e5ff; 
  background: rgba(30, 41, 59, 1);
}

.word-correct {
  background: rgba(76, 175, 80, 0.9);
  border-color: #4caf50;
  transform: scale(1.2);
}

.word-incorrect {
  background: rgba(244, 67, 54, 0.9);
  border-color: #f44336;
  transform: scale(0.8);
}

.turbo-mode {
  box-shadow: inset 0 0 100px rgba(224, 64, 251, 0.2);
}

@keyframes pulse-red { 0% { opacity: 1; } 100% { opacity: 0.5; } }
@keyframes fallAnimation { 
  0% { top: -10%; opacity: 0; } 
  10% { opacity: 1; } 
  90% { opacity: 1; } 
  100% { top: 110%; opacity: 0; } 
}

.time-bonus-feedback {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 50;
}

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.5s ease; }
.fade-up-enter-from { opacity: 0; transform: translate(-50%, 20px); }
.fade-up-leave-to { opacity: 0; transform: translate(-50%, -50px); }

/* Feedback Animations */
.animate-success {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.animate-error {
  animation: shake 0.4s ease-in-out forwards;
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.pointer-events-none {
  pointer-events: none !important;
}

.feedback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

</style>
