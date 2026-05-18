<template>
  <v-container class="space-map pa-0" fluid>

    <div v-if="!activeGameComponent" class="map-scroll-container" @click="activePreviewIndex = null">

      <div class="start-spacer" />

      <div class="path-container">
        <template v-for="(level, index) in levelSequence" :key="index">

          <div v-if="level.phaseTitleKey" class="phase-divider-wrapper mt-2 mb-4 w-100">
            <div class="d-flex align-center w-100" :class="level.phaseAlign === 'right' ? 'flex-row-reverse' : 'flex-row'">

              <div class="phase-text-box" :class="level.phaseAlign === 'right' ? 'text-right' : 'text-left'">
                <div class="text-overline text-cyan-accent-3 font-weight-bold tracking-widest">{{ $t(level.phaseSubtitleKey) }}</div>
                <h2 class="text-h5 font-weight-black text-white text-uppercase glow-text mb-1">
                  {{ $t(level.phaseTitleKey) }}
                </h2>
              </div>

              <div class="flex-grow-1 px-4 px-md-8 d-flex align-center mt-4">
                <v-divider class="border-cyan opacity-40" />
                <div class="phase-center-node mx-2" />
                <v-divider class="border-cyan opacity-40" />
              </div>

              <div class="phase-icon-box text-center">
                <v-icon class="phase-watermark" :icon="level.phaseIcon" size="90" />
              </div>
            </div>
          </div>

          <div class="path-row">
              <div
                v-if="index < levelSequence.length - 1 && !levelSequence[index + 1].phaseTitleKey"
                class="path-connector"
                :class="[
                  isNodeRight(index) ? 'pos-right connector-flip' : 'pos-left'
                ]"
              >
                <svg viewBox="0 0 140 140">
                  <path
                    class="connector-line"
                    :class="{ 'line-active': index + 1 < astroStore.mapLevel }"
                    d="M 0 0 Q 20 70 140 140"
                  />
                </svg>
              </div>

              <div
                class="node-wrapper"
                :class="{
                  'pos-left': !isNodeRight(index),
                  'pos-right': isNodeRight(index),
                  'on-top': activePreviewIndex === index
                }"
              >

              <div
                v-if="index + 1 <= astroStore.mapLevel"
                class="floating-label"
                :class="getLevelState(index)"
              >
                {{ $t(level.nameKey) }}
              </div>

              <div v-if="getLevelState(index) === 'current'" class="target-score-label">
                {{ $t('singleplayer.goal', { score: level.minScore }) }}
              </div>

              <button
                v-ripple
                class="node-btn"
                :class="[
                  `state-${getLevelState(index)}`,
                  { 'is-interactive': index + 1 <= astroStore.mapLevel }
                ]"
                @click.stop="handleLevelClick(index)"
              >
                <div class="icon-layer">
                  <v-icon
                    v-if="getLevelState(index) === 'completed'"
                    class="icon-completed"
                    icon="mdi-check-bold"
                    size="32"
                  />

                  <v-icon
                    v-else-if="getLevelState(index) === 'current'"
                    class="icon-current"
                    icon="mdi-rocket-launch"
                    size="34"
                  />

                  <v-icon v-else class="icon-locked" icon="mdi-lock" size="28" />
                </div>

                <div class="shine-effect" />

                <div v-if="getLevelState(index) === 'current'" class="stars-particles">
                  <span>✦</span><span>✦</span>
                </div>
              </button>

              <!-- Viñeta de Previsualización -->
              <transition name="pop-in">
                <div
                  v-if="activePreviewIndex === index"
                  class="level-preview-card"
                  :class="getPreviewAlignment(index)"
                  @click.stop
                >
                  <div class="preview-gif-container">
                    <img alt="Preview" class="preview-gif" :src="level.previewGif || '/previews/placeholder.gif'">
                    <div class="preview-overlay">
                      <div class="preview-badge">{{ level.minScore }} pts</div>
                    </div>
                  </div>
                  <div class="preview-content">
                    <h3 class="preview-title">{{ $t(level.nameKey) }}</h3>
                    <v-btn
                      block
                      class="play-btn-preview font-weight-black"
                      color="cyan-accent-3"
                      elevation="8"
                      rounded="lg"
                      @click.stop="startGame(index)"
                    >
                      <v-icon icon="mdi-play" start />
                      {{ $t('singleplayer.start_simple') }}
                    </v-btn>

                    <div v-if="level.supplyGameId && canSelectCustomExerciseSource" class="exercise-source mt-2">
                      <div class="exercise-source-label">{{ $t('singleplayer.exerciseSourceLabel') }}</div>
                      <v-tooltip
                        location="bottom"
                        :disabled="!getExerciseSelectorTooltip(level.supplyGameId)"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <div v-bind="tooltipProps">
                            <v-menu :disabled="isExerciseSelectorLocked(level.supplyGameId)">
                              <template #activator="{ props: menuProps }">
                                <v-btn
                                  block
                                  class="exercise-source-btn"
                                  color="blue-grey-darken-3"
                                  density="comfortable"
                                  rounded="lg"
                                  size="small"
                                  variant="tonal"
                                  v-bind="menuProps"
                                >
                                  {{ getSelectedExerciseSourceLabel(level.supplyGameId) }}
                                </v-btn>
                              </template>
                              <v-list density="compact" min-width="220">
                                <v-list-item
                                  v-for="option in getExerciseSourceOptions(level.supplyGameId)"
                                  :key="option.key"
                                  @click="selectExerciseSource(level.supplyGameId, option.key)"
                                >
                                  <v-list-item-title>{{ option.label }}</v-list-item-title>
                                  <v-list-item-subtitle v-if="option.subtitle">{{ option.subtitle }}</v-list-item-subtitle>
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </div>
                        </template>
                        <span>{{ getExerciseSelectorTooltip(level.supplyGameId) }}</span>
                      </v-tooltip>
                    </div>
                  </div>
                  <div class="preview-arrow" />
                </div>
              </transition>

            </div>
          </div>
        </template>
      </div>

      <div class="end-spacer" />
    </div>

    <transition name="fade-zoom">
      <div v-if="activeGameComponent" class="game-overlay">
        <v-btn
          class="close-game-btn"
          color="white"
          icon="mdi-close"
          variant="tonal"
          @click="requestExit"
        />
        <component :is="activeGameComponent" :is-paused="showExitConfirm" @game-over="handleGameOver" />
      </div>
    </transition>

    <!-- Diálogo de Confirmación de Salida -->
    <v-dialog v-model="showExitConfirm" max-width="400" persistent z-index="300">
      <v-card class="text-center pa-6 rounded-xl elevation-24 exit-dialog-card">
        <div class="exit-icon-wrapper mb-4">
          <v-icon color="red-accent-3" icon="mdi-alert-octagon" size="64" />
        </div>
        <h2 class="text-h5 font-weight-black text-white mb-2">{{ $t('singleplayer.exit_confirm.title') }}</h2>
        <p class="text-body-2 text-blue-grey-lighten-2 mb-6">
          {{ $t('singleplayer.exit_confirm.desc') }}
        </p>
        <div class="d-flex ga-3">
          <v-btn
            class="font-weight-bold flex-grow-1"
            color="grey-darken-4"
            height="48"
            rounded="lg"
            variant="flat"
            @click="showExitConfirm = false"
          >
            {{ $t('singleplayer.exit_confirm.cancel') }}
          </v-btn>
          <v-btn
            class="font-weight-bold flex-grow-1"
            color="red-accent-3"
            height="48"
            rounded="lg"
            variant="flat"
            @click="confirmExit"
          >
            {{ $t('singleplayer.exit_confirm.confirm') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showLevelUpDialog" max-width="450" persistent z-index="200">
      <v-card
        class="text-center pa-8 rounded-xl elevation-24"
        style="background: #020617; border: 2px solid #00e5ff; box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);"
      >

        <div class="glow-icon-wrapper mb-4">
          <v-icon class="animate-bounce" color="cyan-accent-3" icon="mdi-chevron-double-up" size="90" />
        </div>

        <h2 class="text-h3 font-weight-black text-cyan-accent-3 mb-2 tracking-tighter">
          {{ $t('singleplayer.level_up', { level: newLevelData.level }) }}
        </h2>

        <div
          v-if="newLevelData.rankChanged"
          class="my-5 pa-4 rounded-lg"
          style="background: rgba(0, 229, 255, 0.05); border: 1px dashed #00e5ff;"
        >
          <div class="text-overline text-grey-lighten-1">{{ $t('singleplayer.new_rank') }}</div>
          <div class="text-h5 font-weight-bold text-white">{{ newLevelData.rank }}</div>
        </div>

        <p class="text-body-1 text-blue-grey-lighten-3 mb-8">
          {{ $t('singleplayer.accumulated_xp', { xp: astroStore.xp }) }}
        </p>

        <v-btn
          block
          class="font-weight-black text-black"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          variant="elevated"
          @click="showLevelUpDialog = false"
        >
          {{ $t('singleplayer.continue') }}
        </v-btn>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showFailDialog" max-width="400" persistent z-index="200">
      <v-card
        class="text-center pa-8 rounded-xl elevation-24"
        style="background: #0f0505; border: 2px solid #ff5252; box-shadow: 0 0 30px rgba(255, 82, 82, 0.2);"
      >

        <v-icon class="mb-4 pulse-red" color="red-accent-2" icon="mdi-alert-octagon" size="80" />

        <h2 class="text-h4 font-weight-black text-white mb-2 uppercase">{{ $t('singleplayer.almost_there') }}</h2>

        <div class="py-4">
          <div class="text-overline text-red-accent-1">{{ $t('singleplayer.obtained') }}</div>
          <div class="text-h2 font-weight-black text-white mb-4">{{ lastScore }}</div>

          <v-divider class="border-red-accent-2 opacity-30 mb-6" />

          <p class="text-body-1 text-blue-grey-lighten-2">
            {{ $t('singleplayer.need', { score: requiredScore }) }}
          </p>
        </div>

        <v-btn
          block
          class="font-weight-bold text-white mt-4"
          color="red-accent-2"
          rounded="xl"
          size="x-large"
          style="background: linear-gradient(45deg, #ff5252, #b71c1c) !important;"
          variant="flat"
          @click="showFailDialog = false"
        >
          {{ $t('singleplayer.retry') }}
        </v-btn>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
  import { onBeforeRouteLeave } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import RadarScan from '@/modes/shared/minigames/RadarScan.vue'
  import RadioSignal from '@/modes/shared/minigames/RadioSignal.vue'
  import RhymeSquad from '@/modes/shared/minigames/RhymeSquad.vue'
  import SpelledRosco from '@/modes/shared/minigames/SpelledRosco.vue'
  import SyllableQuest from '@/modes/shared/minigames/SyllableQuest.vue'
  import SymmetryBreaker from '@/modes/shared/minigames/SymmetryBreaker.vue'
  import WordConstruction from '@/modes/shared/minigames/WordConstruction.vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useGroupStore } from '@/stores/groupStore'

  const { t } = useI18n()
  const astroStore = useAstroStore()
  const groupStore = useGroupStore()
  const activeGameComponent = shallowRef(null)
  const showExitConfirm = ref(false)
  const pendingRoute = ref(null)

  // Guard de navegación para evitar salida accidental
  onBeforeRouteLeave((to, from, next) => {
    if (activeGameComponent.value && !showExitConfirm.value) {
      pendingRoute.value = to
      showExitConfirm.value = true
      next(false)
    } else {
      next()
    }
  })

  function requestExit () {
    showExitConfirm.value = true
  }

  function confirmExit () {
    showExitConfirm.value = false
    activeGameComponent.value = null
    groupStore.setTrainingActiveSupplySet(null)
    if (pendingRoute.value) {
      // Si veníamos de un intento de navegación, completarlo
      const route = pendingRoute.value
      pendingRoute.value = null
      // Usar timeout para evitar conflictos con el cierre del diálogo
      setTimeout(() => {
        window.location.hash = route.fullPath // O usar router.push si es accesible
      }, 100)
    }
  }
  const currentPlayingIndex = ref(null)
  const activePreviewIndex = ref(null)

  const showLevelUpDialog = ref(false)
  const showFailDialog = ref(false)

  const lastScore = ref(0)
  const requiredScore = ref(0)

  const newLevelData = ref({
    level: 1,
    rank: '',
    rankChanged: false,
  })

  const gameStartTime = ref(null)
  const exerciseSourceState = ref({})
  const isPremium = computed(() => astroStore.plan === 'INDIVIDUAL_PREMIUM')
  const isGroupManager = computed(() => astroStore.plan === 'GRUPAL' && (astroStore.role === 'CENTER' || astroStore.role === 'TEACHER'))
  const canSelectCustomExerciseSource = computed(() => isPremium.value || isGroupManager.value)

  const levelSequence = [
    // FASE 1: La Tierra (4)
    { id: 'word-construction', supplyGameId: 'WordConstruction', nameKey: 'singleplayerLevels.preparativos', component: WordConstruction, minScore: 100, phaseTitleKey: 'singleplayerLevels.fase1Title', phaseSubtitleKey: 'singleplayerLevels.fase1Subtitle', phaseAlign: 'left', phaseIcon: 'mdi-earth', previewGif: '/previews/word-construction.gif' },
    { id: 'radar-scan', nameKey: 'singleplayerLevels.despegue', component: RadarScan, minScore: 60, previewGif: '/previews/radar-scan.gif' },
    { id: 'radio-signal', nameKey: 'singleplayerLevels.gravedad', component: RadioSignal, minScore: 150, previewGif: '/previews/radio-signal.gif' },
    { id: 'spelled-rosco', nameKey: 'singleplayerLevels.desacoplamiento', component: SpelledRosco, minScore: 300, previewGif: '/previews/spelled-rosco.gif' },

    // FASE 2: Espacio Cercano (4)
    { id: 'rhyme-squad', nameKey: 'singleplayerLevels.ruta', component: RhymeSquad, minScore: 300, phaseTitleKey: 'singleplayerLevels.fase2Title', phaseSubtitleKey: 'singleplayerLevels.fase2Subtitle', phaseAlign: 'right', phaseIcon: 'mdi-solar-system', previewGif: '/previews/rhyme-squad.gif' },
    { id: 'syllable-quest', nameKey: 'singleplayerLevels.silabas', component: SyllableQuest, minScore: 400, previewGif: '/previews/syllable-quest.gif' },
    { id: 'radio-signal', nameKey: 'singleplayerLevels.base', component: RadioSignal, minScore: 750, previewGif: '/previews/radio-signal-2.gif' },
    { id: 'symmetry-breaker', nameKey: 'singleplayerLevels.recarga', component: SymmetryBreaker, minScore: 1000, previewGif: '/previews/symmetry-breaker.gif' },

    // FASE 3: Espacio Profundo (4)
    { id: 'radar-scan', nameKey: 'singleplayerLevels.reparacion', component: RadarScan, minScore: 400, phaseTitleKey: 'singleplayerLevels.fase3Title', phaseSubtitleKey: 'singleplayerLevels.fase3Subtitle', phaseAlign: 'left', phaseIcon: 'mdi-auto-fix', previewGif: '/previews/radar-scan-2.gif' },
    { id: 'spelled-rosco', nameKey: 'singleplayerLevels.senalperdida', component: SpelledRosco, minScore: 600, previewGif: '/previews/spelled-rosco.gif' },
    { id: 'word-construction', supplyGameId: 'WordConstruction', nameKey: 'singleplayerLevels.horizontes', component: WordConstruction, minScore: 1500, previewGif: '/previews/word-construction.gif' },
    { id: 'syllable-quest', nameKey: 'singleplayerLevels.destino', component: SyllableQuest, minScore: 1000, previewGif: '/previews/syllable-quest.gif' },
  ]

  function isNodeRight (index) {
    // Fase 1: 0-3 -> Paridad estándar (1, 3 son R)
    // Fase 2: 4-7 -> Paridad invertida (4, 6 son R)
    // Fase 3: 8-11 -> Paridad estándar (9, 11 son R)
    if (index >= 4 && index <= 7) {
      return index % 2 === 0
    }
    return index % 2 !== 0
  }

  function getPreviewAlignment (index) {
    const isRight = isNodeRight(index)
    // Siempre hacia fuera (exterior del mapa) en todas las fases
    return isRight ? 'preview-right' : 'preview-left'
  }

  function getLevelState (index) {
    const levelNum = index + 1
    const currentMap = astroStore.mapLevel || 1
    if (levelNum === currentMap) return 'current'
    if (levelNum < currentMap) return 'completed'
    return 'locked'
  }

  function handleLevelClick (index) {
    const state = getLevelState(index)
    if (state !== 'locked') {
      activePreviewIndex.value = activePreviewIndex.value === index ? null : index
      if (activePreviewIndex.value !== null) {
        void prepareExerciseSelector(index)
      }
    }
  }

  function buildDefaultExerciseOption () {
    return {
      key: 'default',
      label: t('singleplayer.exerciseSourceDefault'),
      subtitle: '',
      set: null,
    }
  }

  function buildSetOption (set) {
    return {
      key: set._id,
      label: set.ownerId,
      subtitle: set.name,
      set,
    }
  }

  async function loadExerciseSourceState (gameId) {
    if (!gameId || exerciseSourceState.value[gameId]) return

    exerciseSourceState.value[gameId] = {
      loading: true,
      options: [buildDefaultExerciseOption()],
      selectedKey: 'default',
      locked: true,
      tooltip: '',
    }

    let sets = []
    if (canSelectCustomExerciseSource.value) {
      if (isPremium.value) {
        await groupStore.fetchSupplySets(astroStore.user)
      } else if (astroStore.role === 'CENTER') {
        await groupStore.fetchCenterSupplies(astroStore.user)
      } else if (astroStore.role === 'TEACHER' && astroStore.parentId) {
        await groupStore.fetchCenterSupplies(astroStore.parentId)
      } else {
        await groupStore.fetchSupplySets(astroStore.user)
      }

      sets = (groupStore.supplySets || [])
        .filter(s => s.gameId === gameId && s.active)
        .sort((a, b) => String(a.ownerId || '').localeCompare(String(b.ownerId || '')))
    }

    const ownActiveSet = sets.find(s => s.ownerId === astroStore.user) || null
    const options = [buildDefaultExerciseOption()]

    if (isPremium.value) {
      if (ownActiveSet) {
        options.push(buildSetOption(ownActiveSet))
      }
      exerciseSourceState.value[gameId] = {
        loading: false,
        options,
        selectedKey: ownActiveSet ? ownActiveSet._id : 'default',
        locked: !ownActiveSet,
        tooltip: ownActiveSet ? '' : t('singleplayer.exerciseSourceNoCustomPremium'),
      }
      return
    }

    for (const set of sets) {
      options.push(buildSetOption(set))
    }

    exerciseSourceState.value[gameId] = {
      loading: false,
      options,
      selectedKey: ownActiveSet ? ownActiveSet._id : 'default',
      locked: false,
      tooltip: '',
    }
  }

  async function prepareExerciseSelector (index) {
    const level = levelSequence[index]
    if (!level?.supplyGameId || !canSelectCustomExerciseSource.value) return
    await loadExerciseSourceState(level.supplyGameId)
  }

  function getExerciseSourceOptions (gameId) {
    return exerciseSourceState.value[gameId]?.options || [buildDefaultExerciseOption()]
  }

  function getSelectedExerciseSourceLabel (gameId) {
    const state = exerciseSourceState.value[gameId]
    if (!state) return t('singleplayer.exerciseSourceLoading')
    const selected = state.options.find(option => option.key === state.selectedKey)
    return selected?.label || t('singleplayer.exerciseSourceDefault')
  }

  function selectExerciseSource (gameId, key) {
    const state = exerciseSourceState.value[gameId]
    if (!state || state.locked) return
    state.selectedKey = key
  }

  function isExerciseSelectorLocked (gameId) {
    const state = exerciseSourceState.value[gameId]
    if (!state) return true
    return state.loading || state.locked || state.options.length <= 1
  }

  function getExerciseSelectorTooltip (gameId) {
    const state = exerciseSourceState.value[gameId]
    return state?.tooltip || ''
  }

  async function applyTrainingSourceForLevel (index) {
    const level = levelSequence[index]
    if (!level?.supplyGameId || !canSelectCustomExerciseSource.value) {
      groupStore.setTrainingActiveSupplySet(null)
      return
    }

    await loadExerciseSourceState(level.supplyGameId)
    const state = exerciseSourceState.value[level.supplyGameId]
    const selected = state?.options?.find(option => option.key === state.selectedKey)
    groupStore.setTrainingActiveSupplySet(selected?.set || null)
  }

  async function startGame (index) {
    await applyTrainingSourceForLevel(index)
    activePreviewIndex.value = null
    currentPlayingIndex.value = index
    activeGameComponent.value = levelSequence[index].component
    gameStartTime.value = Date.now()
  }

  async function handleGameOver (finalScore) {
    const levelIndex = currentPlayingIndex.value
    const gameName = levelSequence[levelIndex]?.id || 'Minijuego'

    activeGameComponent.value = null
    lastScore.value = finalScore

    if (astroStore.user && levelIndex !== null) {
      try {
        const levelConfig = levelSequence[levelIndex]

        if (levelConfig && finalScore < levelConfig.minScore) {
          requiredScore.value = levelConfig.minScore
          showFailDialog.value = true
          return
        }

        const previousAccountLevel = astroStore.level
        const currentMap = astroStore.mapLevel || 1

        const nodeToComplete = (levelIndex + 1 === currentMap) ? currentMap : null

        const timeSeconds = gameStartTime.value ? Math.floor((Date.now() - gameStartTime.value) / 1000) : 0
        const result = await astroStore.registerCompletedGame(gameName, finalScore, nodeToComplete, timeSeconds)

        if (!result.success) throw new Error(result.message)

        if (astroStore.level > previousAccountLevel) {
          newLevelData.value = {
            level: astroStore.level,
            rank: result.data.newRank || 'Explorador',
            rankChanged: !!result.data.newRank,
          }
          showLevelUpDialog.value = true
        }
      } catch (error) {
        console.error('❌ Error al registrar la partida:', error)
      } finally {
        currentPlayingIndex.value = null
      }
    }
  }

  onBeforeUnmount(() => {
    groupStore.setTrainingActiveSupplySet(null)
  })
</script>

<style scoped>
.space-map {
    height: 100vh;
    width: 100%;
    background: radial-gradient(circle at 50% 10%, #1a233a 0%, #05070d 100%);
    position: relative;
    overflow: hidden;
    color: white;
    font-family: 'Nunito', sans-serif;
}

.map-scroll-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    padding-top: 20px;
}

.start-spacer { height: 80px; }
.end-spacer { height: 150px; }

.phase-divider-wrapper {
    position: relative;
    z-index: 10;
}

.phase-text-box {
    min-width: 280px;
    max-width: 350px;
}

.phase-icon-box {
    width: 120px;
}

.phase-watermark {
    color: #455a64;
    opacity: 0.3;
    filter: drop-shadow(0 0 15px rgba(0, 229, 255, 0.1));
    transition: all 0.5s ease;
}

.phase-divider-wrapper:hover .phase-watermark {
    opacity: 0.6;
    color: #00e5ff;
    transform: scale(1.1);
}

.phase-center-node {
    width: 12px;
    height: 12px;
    background: #00e5ff;
    border-radius: 50%;
    box-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff;
}

.tracking-widest { letter-spacing: 3px; }
.glow-text { text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
.border-cyan { border-color: #00e5ff !important; border-width: 1px; border-style: solid; }

.path-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
}

.path-row {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 140px;
    position: relative;
}

.node-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.node-wrapper.on-top {
    z-index: 1000 !important;
}

.pos-left { transform: translateX(-70px); }
.pos-right { transform: translateX(70px); }

.path-connector {
    position: absolute;
    top: 40px;
    left: 50%;
    width: 140px;
    height: 140px;
    z-index: 1;
    pointer-events: none;
    transform-origin: top left;
}

.path-connector.pos-left { transform: translateX(-70px); }
.path-connector.pos-right { transform: translateX(70px) scaleX(-1); }

.connector-flip { /* El flip ya se maneja en pos-right para evitar conflictos de transform */ }

svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}

.connector-line {
    fill: none;
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 8;
    stroke-dasharray: 12 10;
    stroke-linecap: round;
}

.line-active {
    stroke: #FFD54F;
    opacity: 0.6;
    animation: dash-flow 30s linear infinite;
}

.node-btn {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: none;
    position: relative;
    outline: none;
    cursor: default;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
}

.node-btn.is-interactive { cursor: pointer; }
.node-btn:active { transform: scale(0.92); }

.state-locked {
    background-color: #2b3040;
    box-shadow: 0 6px 0 #181b24, 0 10px 10px rgba(0, 0, 0, 0.3);
}

.state-completed {
    background-color: #FFD54F;
    box-shadow: 0 6px 0 #C49000, 0 10px 15px rgba(255, 213, 79, 0.3);
}

.state-completed:active {
    box-shadow: 0 2px 0 #C49000;
    transform: translateY(4px);
}

.state-current {
    background-color: #00E5FF;
    box-shadow: 0 8px 0 #0097A7, 0 0 30px rgba(0, 229, 255, 0.4);
    animation: floating 3s ease-in-out infinite;
}

.target-score-label {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.6);
    color: #00E5FF;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
}

.floating-label {
    position: absolute;
    top: -45px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(11, 15, 25, 0.8);
    backdrop-filter: blur(4px);
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 20;
}

.state-current.floating-label { color: #00E5FF; border-color: rgba(0, 229, 255, 0.5); }
.state-completed.floating-label { color: #FFD54F; }

.shine-effect {
    position: absolute;
    top: 10px;
    left: 14px;
    width: 25px;
    height: 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    transform: rotate(-35deg);
    pointer-events: none;
}

@keyframes dash-flow { to { stroke-dashoffset: -500; } }

@keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

.game-overlay {
    position: absolute;
    inset: 0;
    background: #0b0f19;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    padding: 60px 20px;
}

.close-game-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 101;
}

.fade-zoom-enter-active, .fade-zoom-leave-active { transition: all 0.3s ease; }
.fade-zoom-enter-from, .fade-zoom-leave-to { opacity: 0; transform: scale(0.95); }

/* --- NUEVAS ANIMACIONES PARA LOS DIÁLOGOS --- */

.animate-bounce {
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
    40% {transform: translateY(-20px);}
    60% {transform: translateY(-10px);}
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

.v-divider {
    opacity: 0.2 !important;
}

/* --- ESTILOS DE LA VIÑETA DE PREVISUALIZACIÓN --- */

.level-preview-card {
    position: absolute;
    top: 50%;
    width: 240px;
    background: linear-gradient(165deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 20px;
    box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.7),
        0 0 20px rgba(0, 229, 255, 0.1),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
    z-index: 1001;
    overflow: visible;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
}

.level-preview-card:hover {
    border-color: rgba(0, 229, 255, 0.5);
    box-shadow:
        0 30px 60px -12px rgba(0, 0, 0, 0.8),
        0 0 30px rgba(0, 229, 255, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.15);
}

.preview-left {
    right: 100px;
    transform: translateY(-50%);
}

.preview-right {
    left: 100px;
    transform: translateY(-50%);
}

.preview-gif-container {
    width: 100%;
    height: 140px;
    border-radius: 19px 19px 0 0;
    overflow: hidden;
    position: relative;
}

.preview-gif {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%);
}

.preview-badge {
    position: absolute;
    bottom: 10px;
    right: 12px;
    background: rgba(0, 229, 255, 0.2);
    border: 1px solid rgba(0, 229, 255, 0.4);
    padding: 2px 8px;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 11px;
    font-weight: 800;
    backdrop-filter: blur(4px);
}

.preview-content {
    padding: 16px;
}

.preview-title {
    color: white;
    font-size: 0.95rem;
    font-weight: 800;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.play-btn-preview {
    letter-spacing: 1px;
    height: 38px !important;
}

.exercise-source {
    margin-top: 8px;
}

.exercise-source-label {
    font-size: 10px;
    letter-spacing: 0.4px;
    color: rgba(148, 163, 184, 0.95);
    margin-bottom: 4px;
    text-transform: uppercase;
}

.exercise-source-btn {
    justify-content: flex-start !important;
    text-transform: none;
    font-size: 0.75rem;
    height: 30px !important;
}

.preview-arrow {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #1e293b;
    border: 1px solid rgba(0, 229, 255, 0.25);
    transform: translateY(-50%) rotate(45deg);
}

.preview-left .preview-arrow {
    right: -7px;
    border-left: none;
    border-bottom: none;
}

.preview-right .preview-arrow {
    left: -7px;
    border-right: none;
    border-top: none;
}

.pop-in-enter-active { animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-in-leave-active { animation: pop-in 0.2s reverse ease-in; }

@keyframes pop-in {
    0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
    100% { opacity: 1; transform: translateY(-50%) scale(1); }
}

@media (max-width: 600px) {
    .path-row { height: 180px; }
    .node-wrapper { transform: none !important; }
    .level-preview-card {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        top: auto;
        width: auto;
        transform: none !important;
    }
    .preview-arrow { display: none; }
}

.exit-dialog-card {
  background: #0a0c10 !important;
  border: 2px solid rgba(255, 82, 82, 0.4) !important;
  box-shadow: 0 0 30px rgba(255, 82, 82, 0.15) !important;
}

.exit-icon-wrapper {
  background: rgba(255, 82, 82, 0.1);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 1px solid rgba(255, 82, 82, 0.2);
}

.fade-zoom-enter-active, .fade-zoom-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-zoom-enter-from, .fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

