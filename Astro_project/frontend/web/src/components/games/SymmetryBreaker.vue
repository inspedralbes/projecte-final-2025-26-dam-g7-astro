<template>
  <div
    ref="gameArea"
    class="game-container"
    :class="{ 'hide-cursor': isPlaying, 'game-paused': props.isPaused }"
    @mousedown.left.prevent="beginFiring"
    @mouseleave="stopFiring"
    @mousemove="handlePointerMove"
    @mouseup.left="stopFiring"
  >
    <div class="hud pa-2 w-100 position-absolute" style="top: 0; z-index: 12;">
      <div class="d-flex justify-center align-center">
        <div class="hud-pill d-flex align-center ga-6">
          <div class="text-h5 font-weight-bold text-amber-accent-3">{{ $t('symmetryBreaker.points', { score }) }}</div>
          <div class="text-h6 text-cyan-accent-2">{{ $t('symmetryBreaker.target', { target: currentChallenge?.target || '-' }) }}</div>
          <div
            class="text-h5 font-weight-bold d-flex align-center"
            :class="isPenaltyActive || timeLeft <= 10 ? 'text-red-accent-2' : 'text-white'"
          >
            {{ $t('symmetryBreaker.time', { time: Math.ceil(timeLeft) }) }}
            <v-icon v-if="isSlowTimeActive" class="ml-2" color="blue-accent-2" size="small">mdi-timer-sand-empty</v-icon>
          </div>
          <div v-if="isShieldActive || shieldImmunityLeft > 0" class="text-h5">
            <v-icon :class="{'pulse-shield': shieldImmunityLeft > 0}" :color="shieldImmunityLeft > 0 ? 'warning' : 'teal-accent-4'">mdi-shield-check</v-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="lock-meter-wrapper">
      <div class="text-caption text-grey-lighten-1 mb-1">{{ $t('symmetryBreaker.lockMeter', { round }) }}</div>
      <v-progress-linear
        color="lime-accent-3"
        height="10"
        :model-value="holdProgressPct"
        rounded
        striped
      />
    </div>

    <canvas ref="gameCanvas" />

    <div v-if="roundHintVisible" :key="roundHintToken" class="round-target-hint">{{ roundHintText }}</div>

    <v-overlay v-if="!isMultiplayer" v-model="showStartOverlay" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl" max-width="400">
        <h2 class="text-h4 font-weight-bold text-white mb-4">{{ $t('symmetryBreaker.title') }}</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          {{ $t('symmetryBreaker.desc') }}
        </p>
        <v-btn
          class="font-weight-black text-black"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="startGame"
        >
          {{ $t('symmetryBreaker.startMission') }}
        </v-btn>
      </v-card>
    </v-overlay>

    <v-overlay
      v-if="!isMultiplayer"
      v-model="showGameOverOverlay"
      class="align-center justify-center"
      persistent
      z-index="120"
    >
      <v-card class="pa-8 text-center bg-slate-900 border-cyan rounded-xl elevation-24" max-width="400">
        <v-icon class="mb-4" color="cyan-accent-3" icon="mdi-target-variant" size="70" />
        <h2 class="text-h4 font-weight-bold text-white mb-2">{{ $t('symmetryBreaker.endMission') }}</h2>
        <p class="text-h5 text-amber-accent-2 mb-6">{{ $t('symmetryBreaker.points', { score }) }}</p>
        <v-btn
          class="font-weight-black text-black px-8"
          color="cyan-accent-3"
          rounded="xl"
          size="x-large"
          @click="returnToMenu"
        >
          {{ $t('symmetryBreaker.returnMenu') }}
        </v-btn>
      </v-card>
    </v-overlay>

    <v-snackbar v-model="showShieldFeedback" color="teal-accent-4" location="top" timeout="2000">
      <v-icon start>mdi-shield-star</v-icon> {{ $t('symmetryBreaker.shieldActive') || '¡INMUNIDAD TÁCTICA ACTIVADA!' }}
    </v-snackbar>

    <!-- Feedback Visual Overlay -->
    <v-overlay
      v-model="showFeedback"
      contained
      class="align-center justify-center pointer-events-none"
      persistent
      no-click-animation
      scrim="transparent"
      style="z-index: 1000;"
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

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { symmetryBreakerData } from '@/data/symmetryBreakerData'
  import { useAstroStore } from '@/stores/astroStore'
  import { useGroupStore } from '@/stores/groupStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t, locale } = useI18n()
  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()
  const groupStore = useGroupStore()

  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
    isRace: {
      type: Boolean,
      default: false,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['game-over'])

  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)

  // BOOSTERS
  const isSlowTimeActive = computed(() => (astroStore.activeBoosters?.slowTimeGamesLeft || 0) > 0)
  const isShieldActive = ref(false)
  const shieldImmunityLeft = ref(0)
  const showShieldFeedback = ref(false)

  function normalizeConfusionSet (entry = {}) {
    return {
      target: String(entry.target || ''),
      decoys: Array.isArray(entry.decoys) ? entry.decoys.map(decoy => String(decoy)) : [],
    }
  }

  const gameData = computed(() => {
    if (!props.isMultiplayer && groupStore.trainingActiveSupplySet?.gameId === 'SymmetryBreaker' && groupStore.trainingActiveSupplySet?.content?.length > 0) {
      return groupStore.trainingActiveSupplySet.content
    }
    if (
      astroStore.plan === 'GRUPAL'
      && astroStore.role === 'STUDENT'
      && groupStore.activeSupplySet?.gameId === 'SymmetryBreaker'
      && groupStore.activeSupplySet?.content?.length > 0
    ) {
      return groupStore.activeSupplySet.content
    }
    return symmetryBreakerData[locale.value] || symmetryBreakerData['es']
  })

  const confusionSetsDynamic = computed(() => {
    const normalized = gameData.value
      .map(normalizeConfusionSet)
      .filter(item => item.target && item.decoys.length > 0)
    return normalized.length > 0 ? normalized : (symmetryBreakerData[locale.value] || symmetryBreakerData['es']).map(normalizeConfusionSet)
  })

  const wordSets = computed(() => confusionSetsDynamic.value.filter(s => s.target.length > 1))
  const letterSets = computed(() => confusionSetsDynamic.value.filter(s => s.target.length === 1))

  const gameArea = ref(null)
  const gameCanvas = ref(null)
  let ctx = null

  const showStartOverlay = ref(true)
  const showGameOverOverlay = ref(false)
  const isPlaying = ref(false)
  const score = ref(0)
  const timeLeft = ref(60)
  const round = ref(1)
  const isPenaltyActive = ref(false)
  const roundHintText = ref('')
  const roundHintVisible = ref(false)
  const roundHintToken = ref(0)
  const successfulLocks = ref(0)

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
    audio.volume = 0.4
    audio.play().catch(e => console.warn('Audio play blocked:', e))
    setTimeout(() => { showFeedback.value = false }, 800)
  }

  const currentChallenge = ref(null)
  const targets = ref([])
  const mouseX = ref(0)
  const mouseY = ref(0)
  const isFiring = ref(false)
  const holdProgressMs = ref(0)
  const holdRequiredMs = ref(1000)

  const HUD_SAFE_TOP = 170
  const EDGE_PADDING = 100
  const BASE_DECOYS = 4
  const MAX_DECOYS = 10
  const BASE_ENTITY_SIZE = 110
  const UNIFORM_COLORS_FROM_ROUND = 15
  const CLASSIC_TARGET_RING = '#00e5ff'
  const CLASSIC_TARGET_FILL = 'rgba(0, 229, 255, 0.14)'
  const CLASSIC_DECOY_RING = 'rgba(255, 255, 255, 0.25)'
  const CLASSIC_DECOY_FILL = 'rgba(255, 255, 255, 0.06)'
  const PROGRESS_DECAY_OUTSIDE = 950
  const PROGRESS_DECAY_ON_DECOY = 700

  let animationFrame = null
  let lastFrameTs = 0
  let roundHintTimeout = null
  let posSyncCounter = 0
  let timeSyncCounter = 0

  const holdProgressPct = computed(() => Math.min(100, (holdProgressMs.value / holdRequiredMs.value) * 100))

  function randomBetween (min, max) {
    return max <= min ? min : Math.random() * (max - min) + min
  }
  function clamp (value, min, max) {
    return Math.min(max, Math.max(min, value))
  }
  function randomVelocity (speed) {
    const angle = Math.random() * Math.PI * 2; return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
  }

  function resolveEntityColors ({ isTarget, isUniformMode }) {
    if (isUniformMode) return { ringColor: CLASSIC_DECOY_RING, fillColor: CLASSIC_DECOY_FILL }
    return { ringColor: isTarget ? CLASSIC_TARGET_RING : CLASSIC_DECOY_RING, fillColor: isTarget ? CLASSIC_TARGET_FILL : CLASSIC_DECOY_FILL }
  }

  function getPlayBounds (size) {
    const rawMinX = size / 2 + EDGE_PADDING
    const rawMaxX = gameCanvas.value.width - size / 2 - EDGE_PADDING
    const rawMinY = Math.max(HUD_SAFE_TOP, size / 2 + EDGE_PADDING)
    const rawMaxY = gameCanvas.value.height - size / 2 - EDGE_PADDING
    return { minX: Math.min(rawMinX, rawMaxX), maxX: Math.max(rawMinX, rawMaxX), minY: Math.min(rawMinY, rawMaxY), maxY: Math.max(rawMinY, rawMaxY) }
  }

  function resizeCanvas () {
    if (gameCanvas.value && gameArea.value) {
      const rect = gameArea.value.getBoundingClientRect()
      gameCanvas.value.width = rect.width; gameCanvas.value.height = rect.height
    }
  }

  function triggerRoundHint (text) {
    roundHintText.value = String(text || ''); roundHintVisible.value = false; roundHintToken.value += 1
    if (roundHintTimeout) clearTimeout(roundHintTimeout)
    requestAnimationFrame(() => roundHintVisible.value = true)
    roundHintTimeout = setTimeout(() => {
      roundHintVisible.value = false; roundHintTimeout = null
    }, 1000)
  }

  function generateTargets () {
    if (!gameCanvas.value) return

    if (props.isMultiplayer && !isHost.value) {
      targets.value = []
      return
    }

    const currentSets = confusionSetsDynamic.value
    const sourceSet = round.value <= 6
      ? currentSets.filter(s => s.target.length > 1)
      : currentSets.filter(s => s.target.length === 1)

    if (sourceSet.length === 0) return

    const challenge = sourceSet[Math.floor(Math.random() * sourceSet.length)]
    currentChallenge.value = challenge
    triggerRoundHint(challenge.target)

    const decoyCount = Math.min(MAX_DECOYS, BASE_DECOYS + Math.floor((round.value - 1) / 2))
    const entitySize = BASE_ENTITY_SIZE
    const currentSpeed = 80 + (round.value - 1) * 18
    const bounds = getPlayBounds(entitySize)
    const isUniformMode = round.value >= UNIFORM_COLORS_FROM_ROUND

    const newTargets = []
    for (let i = 0; i < 1 + decoyCount; i++) {
      const isTarget = i === 0
      const text = isTarget ? challenge.target : challenge.decoys[Math.floor(Math.random() * challenge.decoys.length)]
      const velocity = randomVelocity(currentSpeed * randomBetween(0.92, 1.08))
      const { ringColor, fillColor } = resolveEntityColors({ isTarget, isUniformMode })

      newTargets.push({ text, isTarget, size: entitySize, x: randomBetween(bounds.minX, bounds.maxX), y: randomBetween(bounds.minY, bounds.maxY), vx: velocity.vx, vy: velocity.vy, bounds, ringColor, fillColor })
    }
    targets.value = newTargets
    holdProgressMs.value = 0

    if (props.isMultiplayer && isHost.value) {
      multiplayerStore.sendGameAction({
        type: 'SYMMETRY_SYNC_TARGETS',
        targets: newTargets,
        challenge: challenge,
        round: round.value,
      })
    }
  }

  function update (dt) {
    if (!isPlaying.value) return

    let hoveredTarget = null
    for (const t of targets.value) {
      if (Math.hypot(mouseX.value - t.x, mouseY.value - t.y) < t.size / 2) {
        hoveredTarget = t; break
      }
    }

    const hasPenaltyShotRaw = isFiring.value && (!hoveredTarget || !hoveredTarget.isTarget)

    if (hasPenaltyShotRaw && isShieldActive.value) {
      isShieldActive.value = false
      shieldImmunityLeft.value = 2
      showShieldFeedback.value = true
    }

    if (shieldImmunityLeft.value > 0) {
      shieldImmunityLeft.value -= dt
    }

    const hasPenaltyShot = hasPenaltyShotRaw && shieldImmunityLeft.value <= 0
    const timePenalty = hasPenaltyShot ? 2 : 1
    isPenaltyActive.value = timePenalty > 1

    const timeMultiplier = isSlowTimeActive.value ? 0.8 : 1

    if (!props.isMultiplayer || isHost.value) {
      timeLeft.value -= dt * timePenalty * timeMultiplier
      if (props.isMultiplayer && isHost.value) {
        timeSyncCounter++
        if (timeSyncCounter >= 60) {
          multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          timeSyncCounter = 0
        }
      }
    }

    if (timeLeft.value <= 0) {
      if (props.isMultiplayer && isHost.value) {
        multiplayerStore.sendGameAction({ type: 'SYMMETRY_TIME_UP' })
      }
      endGame(); return
    }

    for (const t of targets.value) {
      t.x += t.vx * dt; t.y += t.vy * dt

      // Solo el host calcula rebotes de forma autoritativa
      if (!props.isMultiplayer || isHost.value) {
        if (t.x < t.bounds.minX || t.x > t.bounds.maxX) {
          t.vx *= -1; t.x = clamp(t.x, t.bounds.minX, t.bounds.maxX)
        }
        if (t.y < t.bounds.minY || t.y > t.bounds.maxY) {
          t.vy *= -1; t.y = clamp(t.y, t.bounds.minY, t.bounds.maxY)
        }
      }
    }

    const target = targets.value.find(t => t.isTarget)
    const localIsPointing = isFiring.value && hoveredTarget && hoveredTarget.isTarget

    let bothPointing = localIsPointing
    if (props.isMultiplayer) {
      const partner = Object.entries(multiplayerStore.remoteCursors).find(([uid]) => uid !== astroStore.user)?.[1]
      if (partner && partner.isFiring && target) {
        const rx = (partner.x / 1000) * gameCanvas.value.width
        const ry = (partner.y / 1000) * gameCanvas.value.height
        const partnerIsOnTarget = Math.hypot(rx - target.x, ry - target.y) < target.size / 2
        bothPointing = localIsPointing && partnerIsOnTarget
      } else {
        bothPointing = false
      }
    }

    if (bothPointing) {
      holdProgressMs.value = Math.min(holdRequiredMs.value, holdProgressMs.value + dt * 1000)
      if (holdProgressMs.value >= holdRequiredMs.value) {
        holdProgressMs.value = holdRequiredMs.value; lockTarget(); return
      }
    } else if (isFiring.value && !hoveredTarget && shieldImmunityLeft.value <= 0) {
      holdProgressMs.value = Math.max(0, holdProgressMs.value - (dt * PROGRESS_DECAY_OUTSIDE))
    } else if (isFiring.value && hoveredTarget && !hoveredTarget.isTarget && shieldImmunityLeft.value <= 0) {
      holdProgressMs.value = Math.max(0, holdProgressMs.value - (dt * PROGRESS_DECAY_ON_DECOY))
    }

    if (props.isMultiplayer && isHost.value && isPlaying.value) {
      posSyncCounter++
      if (posSyncCounter >= 3) {
        multiplayerStore.sendGameAction({
          type: 'SYMMETRY_POS_SYNC',
          targets: targets.value.map(t => ({
            x: Math.round((t.x / gameCanvas.value.width) * 1000),
            y: Math.round((t.y / gameCanvas.value.height) * 1000),
            vx: Math.round((t.vx / gameCanvas.value.width) * 1000),
            vy: Math.round((t.vy / gameCanvas.value.height) * 1000),
          })),
        })
        posSyncCounter = 0
      }
    }
  }

  function lockTarget () {
    if (props.isMultiplayer) {
      if (isHost.value) {
        score.value += 50 + (round.value * 10) + (successfulLocks.value * 5)
        successfulLocks.value += 1
        timeLeft.value = Math.min(99, timeLeft.value + 3)
        round.value++
        generateTargets()
        triggerFeedback('success')

        const isSaboteurActive = (astroStore.activeBoosters?.sabotageGamesLeft || 0) > 0
        multiplayerStore.sendGameAction({
          type: 'SABOTAGE',
          subtype: 'REDUCE_TIME',
          amount: isSaboteurActive ? 4 : 2,
        })
        multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
      } else {
        multiplayerStore.sendGameAction({ type: 'SYMMETRY_LOCK' })
      }
      return
    }

    score.value += 100 + (round.value * 22) + (successfulLocks.value * 18)
    successfulLocks.value += 1
    timeLeft.value = Math.min(99, timeLeft.value + 3)
    round.value++
    
    if (props.isRace) {
      multiplayerStore.rechargeFuel(15) // Recarga 15% por cada bloqueo exitoso
    }
    
    generateTargets()
    triggerFeedback('success')
  }

  function draw () {
    if (!ctx) return
    ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height)

    if (isFiring.value) {
      ctx.beginPath(); ctx.moveTo(gameCanvas.value.width / 2, gameCanvas.value.height); ctx.lineTo(mouseX.value, mouseY.value)

      let laserColor = '#00e5ff'
      if (isPenaltyActive.value) laserColor = '#ff5252'
      else if (shieldImmunityLeft.value > 0 && isFiring.value && (!targets.value.some(t => Math.hypot(mouseX.value - t.x, mouseY.value - t.y) < t.size / 2 && t.isTarget))) laserColor = '#00bfa5'

      const target = targets.value.find(t => t.isTarget)
      const partner = props.isMultiplayer ? Object.entries(multiplayerStore.remoteCursors).find(([uid]) => uid !== astroStore.user)?.[1] : null
      let bothOnTarget = false
      if (props.isMultiplayer && partner && partner.isFiring && target) {
        const rx = (partner.x / 1000) * gameCanvas.value.width
        const ry = (partner.y / 1000) * gameCanvas.value.height
        const partnerOn = Math.hypot(rx - target.x, ry - target.y) < target.size / 2
        const localOn = isFiring.value && Math.hypot(mouseX.value - target.x, mouseY.value - target.y) < target.size / 2
        bothOnTarget = localOn && partnerOn
      }

      if (bothOnTarget) {
        ctx.strokeStyle = '#ffff00'
        ctx.lineWidth = 5
        ctx.shadowBlur = 25
      } else {
        ctx.strokeStyle = laserColor
        ctx.lineWidth = 3
        ctx.shadowBlur = 15
      }

      ctx.shadowColor = ctx.strokeStyle; ctx.stroke(); ctx.shadowBlur = 0
    }

    const drawEntity = t => {
      ctx.save(); ctx.translate(t.x, t.y); ctx.beginPath(); ctx.arc(0, 0, t.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = t.fillColor || 'rgba(10, 20, 40, 0.85)'; ctx.fill()
      ctx.lineWidth = t.isTarget ? 3 : 2; ctx.strokeStyle = t.ringColor || (t.isTarget ? '#00e5ff' : 'rgba(255, 255, 255, 0.25)')

      if (t.isTarget && props.isMultiplayer) {
        const partner = Object.entries(multiplayerStore.remoteCursors).find(([uid]) => uid !== astroStore.user)?.[1]
        if (partner && partner.isFiring) {
          const rx = (partner.x / 1000) * gameCanvas.value.width
          const ry = (partner.y / 1000) * gameCanvas.value.height
          const partnerOn = Math.hypot(rx - t.x, ry - t.y) < t.size / 2
          const localOn = isFiring.value && Math.hypot(mouseX.value - t.x, mouseY.value - t.y) < t.size / 2
          if (partnerOn && localOn) {
            ctx.strokeStyle = '#ffff00'
            ctx.lineWidth = 6
            ctx.shadowBlur = 20
            ctx.shadowColor = '#ffff00'
          }
        }
      }

      ctx.stroke()
      const textLength = String(t.text || '').length; const fontScale = textLength <= 1 ? 0.36 : (textLength <= 4 ? 0.3 : 0.25)
      ctx.fillStyle = '#fff'; ctx.font = `bold ${t.size * fontScale}px 'Roboto Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t.text, 0, 0); ctx.restore()
    }

    targets.value.filter(t => !t.isTarget).forEach(drawEntity)
    const mainTarget = targets.value.find(t => t.isTarget)
    if (mainTarget) drawEntity(mainTarget)

    ctx.beginPath(); ctx.arc(mouseX.value, mouseY.value, 18, 0, Math.PI * 2)
    ctx.strokeStyle = isFiring.value ? '#00e5ff' : '#ffffff'; ctx.lineWidth = 2; ctx.stroke()

    if (props.isMultiplayer) {
      for (const [uid, cursor] of Object.entries(multiplayerStore.remoteCursors)) {
        if (uid !== astroStore.user && gameArea.value) {
          const rx = (cursor.x / 1000) * gameCanvas.value.width
          const ry = (cursor.y / 1000) * gameCanvas.value.height

          // Laser del compañero (si está disparando)
          if (cursor.isFiring) {
            ctx.beginPath()
            ctx.moveTo(gameCanvas.value.width / 2, gameCanvas.value.height)
            ctx.lineTo(rx, ry)
            ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5]) // Línea discontinua para el compañero
            ctx.stroke()
            ctx.setLineDash([])
          }

          // Cursor neón del compañero
          ctx.beginPath()
          ctx.arc(rx, ry, 18, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffeb3b'
          ctx.lineWidth = 3
          ctx.shadowBlur = 15
          ctx.shadowColor = '#ffeb3b'
          ctx.stroke()
          ctx.shadowBlur = 0

          // Etiqueta de nombre
          ctx.fillStyle = '#ffeb3b'
          ctx.font = 'bold 14px Roboto Mono'
          ctx.textAlign = 'center'
          ctx.fillText(uid.toUpperCase(), rx, ry - 30)
        }
      }
    }
  }

  function gameLoop (ts) {
    if (props.isPaused) {
      animationFrame = requestAnimationFrame(gameLoop)
      return
    }
    if (!isPlaying.value) return
    const dt = Math.min(0.1, (ts - lastFrameTs) / 1000)
    lastFrameTs = ts; update(dt); draw()
    animationFrame = requestAnimationFrame(gameLoop)
  }

  function handlePointerMove (e) {
    if (!gameArea.value) return
    const rect = gameArea.value.getBoundingClientRect()
    mouseX.value = e.clientX - rect.left
    mouseY.value = e.clientY - rect.top

    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'MOUSE_MOVE',
        x: Math.round((mouseX.value / gameCanvas.value.width) * 1000),
        y: Math.round((mouseY.value / gameCanvas.value.height) * 1000),
        isFiring: isFiring.value,
      })
    }
  }

  function beginFiring () {
    if (isPlaying.value) {
      isFiring.value = true
      if (props.isMultiplayer) {
        multiplayerStore.sendGameAction({
          type: 'MOUSE_MOVE',
          x: Math.round((mouseX.value / gameCanvas.value.width) * 1000),
          y: Math.round((mouseY.value / gameCanvas.value.height) * 1000),
          isFiring: true,
        })
      }
    }
  }
  function stopFiring () {
    isFiring.value = false
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({
        type: 'MOUSE_MOVE',
        x: Math.round((mouseX.value / gameCanvas.value.width) * 1000),
        y: Math.round((mouseY.value / gameCanvas.value.height) * 1000),
        isFiring: false,
      })
    }
  }

  function startGame () {
    showStartOverlay.value = false
    showGameOverOverlay.value = false
    score.value = 0; timeLeft.value = 60; round.value = 1; successfulLocks.value = 0
    isFiring.value = false; isPenaltyActive.value = false; holdProgressMs.value = 0; isPlaying.value = true

    isShieldActive.value = (astroStore.activeBoosters?.shieldGamesLeft || 0) > 0
    shieldImmunityLeft.value = 0

    resizeCanvas()
    mouseX.value = gameCanvas.value.width / 2
    mouseY.value = gameCanvas.value.height * 0.75

    generateTargets()

    if (props.isMultiplayer && !isHost.value && targets.value.length === 0) {
      multiplayerStore.sendGameAction({ type: 'SYMMETRY_REQUEST_SYNC' })
    }

    lastFrameTs = performance.now()
    animationFrame = requestAnimationFrame(gameLoop)
  }

  function returnToMenu () {
    showGameOverOverlay.value = false
    emit('game-over', score.value)
  }

  function endGame (silent = false) {
    if (props.isMultiplayer && !silent) {
      isPlaying.value = false
      isFiring.value = false
      cancelAnimationFrame(animationFrame)
      multiplayerStore.submitRoundResult()
      return
    }
    isPlaying.value = false
    isFiring.value = false
    roundHintVisible.value = false
    cancelAnimationFrame(animationFrame)

    if (props.isMultiplayer) {
      emit('game-over', score.value)
    } else {
      showGameOverOverlay.value = true
    }
  }

  onMounted(() => {
    ctx = gameCanvas.value.getContext('2d')
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    if (props.isMultiplayer) {
      // Delay para el briefing (Reducido a 3s)
      setTimeout(() => {
        startGame()
      }, 3000)
    } else {
      startGame()
    }
  })

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return
    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      if (isPlaying.value) {
        isPlaying.value = false; isFiring.value = false; cancelAnimationFrame(animationFrame); showGameOverOverlay.value = true
      }
      return
    }
    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'SYMMETRY_SYNC_TARGETS' && !isHost.value) {
        targets.value = msg.action.targets
        currentChallenge.value = msg.action.challenge
        round.value = msg.action.round
        triggerRoundHint(currentChallenge.value.target)
        holdProgressMs.value = 0
      }
      if (msg.action?.type === 'SYMMETRY_LOCK' && isHost.value) {
        lockTarget()
      }
      if (msg.action?.type === 'SYMMETRY_REQUEST_SYNC' && isHost.value) {
        multiplayerStore.sendGameAction({
          type: 'SYMMETRY_SYNC_TARGETS',
          targets: targets.value,
          challenge: currentChallenge.value,
          round: round.value,
        })
      }
      if (msg.action?.type === 'SYMMETRY_POS_SYNC' && !isHost.value) {
        for (const [idx, st] of msg.action.targets.entries()) {
          if (targets.value[idx]) {
            const targetX = (st.x / 1000) * gameCanvas.value.width
            const targetY = (st.y / 1000) * gameCanvas.value.height

            // Suavizado Lerp para eliminar tirones (micro-correcciones)
            const dist = Math.hypot(targets.value[idx].x - targetX, targets.value[idx].y - targetY)
            if (dist > 200) {
              targets.value[idx].x = targetX
              targets.value[idx].y = targetY
            } else {
              // Interpolación suave del 15% hacia el objetivo por frame de red
              targets.value[idx].x += (targetX - targets.value[idx].x) * 0.15
              targets.value[idx].y += (targetY - targets.value[idx].y) * 0.15
            }

            targets.value[idx].vx = (st.vx / 1000) * gameCanvas.value.width
            targets.value[idx].vy = (st.vy / 1000) * gameCanvas.value.height
          }
        }
      }
      if (msg.action?.type === 'SABOTAGE' && msg.action?.subtype === 'REDUCE_TIME') {
        timeLeft.value = Math.max(0, timeLeft.value - (msg.action.amount || 2))
        if (timeLeft.value <= 0 && isPlaying.value) endGame()
      }
      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0 && isPlaying.value) endGame()
      }
      if (msg.action?.type === 'SYMMETRY_TIME_UP') {
        endGame()
      }
    }
  }, { immediate: true })

  watch(score, newScore => {
    if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore })
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeCanvas); cancelAnimationFrame(animationFrame); if (roundHintTimeout) clearTimeout(roundHintTimeout)
  })
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: #0f172a;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 80px;
  overflow: hidden;
  user-select: none;
}

.game-paused {
  pointer-events: none !important;
  filter: blur(4px) grayscale(0.5);
  transition: all 0.3s ease;
}

canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.hide-cursor { cursor: none; }

.hud-pill {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 50px;
  padding: 10px 30px;
  backdrop-filter: blur(10px);
}

.lock-meter-wrapper {
  position: absolute;
  top: 95px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  z-index: 10;
  text-align: center;
}

.round-target-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 11;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.94);
  font-size: clamp(80px, 18vw, 180px);
  font-weight: 900;
  letter-spacing: 0.06em;
  text-shadow: 0 0 24px rgba(0, 229, 255, 0.45);
  animation: hint-fade-out 1s ease-out forwards;
}

@keyframes hint-fade-out {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

.bg-slate-900 { background-color: #0f172a; }
.border-cyan { border: 1px solid #00e5ff; }

.pulse-shield {
    animation: shield-pulse 1s infinite alternate;
}

@keyframes shield-pulse {
    from { filter: drop-shadow(0 0 2px #00bfa5); transform: scale(1); }
    to { filter: drop-shadow(0 0 8px #00bfa5); transform: scale(1.1); }
}

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

.feedback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pointer-events-none {
  pointer-events: none !important;
}
</style>
