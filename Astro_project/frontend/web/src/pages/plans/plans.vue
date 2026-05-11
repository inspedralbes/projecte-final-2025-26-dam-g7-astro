<template>
  <v-container class="fill-height plans-container d-flex align-center justify-center pa-0" fluid>

    <!-- SECTION 1: SELECT PLAN -->
    <v-container v-if="step === 'select-plan'" class="text-center py-10 fill-height d-flex flex-column justify-center">
      <div class="header-section mb-10">
        <h1 class="text-h2 font-weight-bold text-white mb-2 tracking-wide text-glow">
          ASTRO <span class="text-primary">PROJECT</span>
        </h1>
        <p class="text-h6 text-grey-lighten-1 font-weight-light">
          {{ $t('plans.selectMode') }}
        </p>
      </div>

      <v-row align="stretch" class="plans-row" justify="center">
        <v-col
          v-for="plan in plans"
          :key="plan.id"
          class="d-flex justify-center position-relative"
          cols="12"
          lg="4"
          md="5"
        >

          <!-- DEFAULT / RECOMMENDED BADGE -->
          <div v-if="plan.recommended" class="recommended-badge text-caption font-weight-bold">
            {{ $t('plans.standard') }}
          </div>

          <v-card
            class="plan-card d-flex flex-column align-center justify-space-between w-100 pa-8 ma-2"
            :class="[plan.id === 'INDIVIDUAL' ? 'plan-individual' : 'plan-grupal', { 'recommended-card': plan.recommended }]"
            elevation="10"
            rounded="xl"
          >
            <div class="icon-wrapper mb-6 mt-4">
              <v-icon class="plan-icon" :color="plan.color" size="80">
                {{ plan.icon }}
              </v-icon>
              <div class="icon-glow" :style="`background: ${plan.glowColor}`" />
            </div>

            <h2 class="text-h4 font-weight-bold mb-4 text-uppercase tracking-wider text-white">
              {{ $t('plans.' + plan.id.toLowerCase()) }}
            </h2>

            <v-divider class="mb-6 w-50" :color="plan.color" thickness="2" />

            <p class="text-body-1 text-grey-lighten-2 mb-8 plan-desc">
              {{ plan.desc }}
            </p>

            <v-btn
              class="plan-btn mt-auto font-weight-bold"
              :color="plan.color"
              height="48"
              min-width="200"
              rounded="lg"
              :variant="plan.recommended ? 'flat' : 'outlined'"
              @click="selectPlan(plan.id)"
            >
              {{ (plan.id === 'INDIVIDUAL' && astroStore.plan?.startsWith('INDIVIDUAL')) || (plan.id === 'GRUPAL' && astroStore.plan === 'GRUPAL') ? $t('plans.manage') : $t('plans.select') }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <div class="mt-8">
        <v-btn
          class="hover-bright text-caption"
          color="grey-lighten-1"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="router.push('/profile')"
        >
          {{ $t('plans.backToProfile') }}
        </v-btn>
      </div>
    </v-container>

    <!-- SECTION 2: INDIVIDUAL OPTIONS (Free vs Premium) -->
    <v-container v-else-if="step === 'individual-options'" class="text-center py-10 fill-height d-flex flex-column justify-center">
      <div class="header-section mb-10">
        <v-icon class="mb-4 text-glow" color="cyan-accent-3" size="60">mdi-account-star</v-icon>
        <h2 class="text-h3 font-weight-bold text-white mb-2 tracking-wide text-glow">
          {{ $t('plans.individualTitle') }}
        </h2>
        <p class="text-h6 text-grey-lighten-1 font-weight-light">
          {{ $t('plans.individualSubtitle') }}
        </p>
      </div>

      <v-row align="stretch" class="plans-row" justify="center">
        <!-- Option: Free -->
        <v-col class="d-flex justify-center" cols="12" lg="4" md="5">
          <v-card
            class="plan-card d-flex flex-column align-center justify-center w-100 pa-8 ma-2 plan-individual"
            :class="{ 'recommended-card': astroStore.plan === 'INDIVIDUAL_FREE' }"
            :disabled="astroStore.plan === 'INDIVIDUAL_FREE'"
            elevation="10"
            rounded="xl"
            @click="setIndividualPlan('INDIVIDUAL_FREE')"
          >
            <div class="icon-wrapper mb-6">
              <v-icon class="plan-icon" color="cyan-accent-3" size="70">mdi-robot-outline</v-icon>
              <div class="icon-glow" style="background: #00e5ff" />
            </div>
            <h2 class="text-h4 font-weight-bold text-uppercase tracking-wider text-white">
              {{ $t('plans.freeTitle') || 'FREE' }}
            </h2>
            <v-divider class="my-4 w-25" color="cyan-accent-3" />
            <p class="text-body-1 text-grey-lighten-2 mt-2" v-html="$t('plans.freeDesc')" />
            <v-btn
              class="mt-6"
              color="cyan-accent-3"
              height="48"
              min-width="180"
              rounded="lg"
              variant="outlined"
            >
              {{ astroStore.plan === 'INDIVIDUAL_FREE' ? $t('plans.currentPlan') : $t('plans.select') }}
            </v-btn>
          </v-card>
        </v-col>

        <!-- Option: Premium -->
        <v-col class="d-flex justify-center" cols="12" lg="4" md="5">
          <v-card
            class="plan-card d-flex flex-column align-center justify-center w-100 pa-8 ma-2 plan-grupal premium-card"
            :class="{ 'recommended-card': astroStore.plan === 'INDIVIDUAL_PREMIUM' }"
            :disabled="astroStore.plan === 'INDIVIDUAL_PREMIUM'"
            elevation="10"
            rounded="xl"
            @click="setIndividualPlan('INDIVIDUAL_PREMIUM')"
          >
            <div class="icon-wrapper mb-6">
              <v-icon class="plan-icon" color="orange-accent-3" size="70">mdi-crown</v-icon>
              <div class="icon-glow" style="background: #ffab40" />
            </div>
            <h2 class="text-h4 font-weight-bold text-uppercase tracking-wider text-white">
              {{ $t('plans.premiumTitle') || 'PREMIUM' }}
            </h2>
            <v-divider class="my-4 w-25" color="orange-accent-3" />
            <p class="text-body-1 text-grey-lighten-2 mt-2" v-html="$t('plans.premiumDesc')" />
            <v-btn
              class="mt-6 font-weight-bold"
              color="orange-accent-3"
              height="48"
              min-width="180"
              rounded="lg"
              :variant="astroStore.plan === 'INDIVIDUAL_PREMIUM' ? 'tonal' : 'flat'"
            >
              {{ astroStore.plan === 'INDIVIDUAL_PREMIUM' ? $t('plans.currentPlan') : $t('plans.unlock') }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <div class="mt-8">
        <v-btn
          class="hover-bright"
          color="grey-lighten-1"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="step = 'select-plan'"
        >
          {{ $t('plans.backToSelection') }}
        </v-btn>
      </div>
    </v-container>

    <!-- SECTION 3: GROUP OPTIONS (Create vs Join) -->
    <v-container v-else-if="step === 'group-options'" class="text-center py-10 fill-height d-flex flex-column justify-center">
      <div class="header-section mb-10">
        <v-icon class="mb-4 text-glow" color="purple-accent-2" size="60">mdi-account-group</v-icon>
        <h2 class="text-h3 font-weight-bold text-white mb-2 tracking-wide text-glow">
          {{ $t('plans.squadProtocol') }}
        </h2>
        <p class="text-h6 text-grey-lighten-1 font-weight-light">
          {{ $t('plans.squadStatus') }}
        </p>
      </div>

      <v-row align="stretch" class="plans-row" justify="center">
        <!-- Option: Create Group -->
        <v-col class="d-flex justify-center" cols="12" lg="4" md="5">
          <v-card
            class="plan-card d-flex flex-column align-center justify-center w-100 pa-8 ma-2 plan-grupal"
            elevation="10"
            rounded="xl"
            @click="step = 'create-group'"
          >
            <div class="icon-wrapper mb-6">
              <v-icon class="plan-icon" color="green-accent-3" size="70">mdi-flag-plus</v-icon>
              <div class="icon-glow" style="background: #00e676" />
            </div>
            <h2 class="text-h4 font-weight-bold text-uppercase tracking-wider text-white">
              {{ $t('plans.foundSquadTitle') }}
            </h2>
            <p class="text-body-1 text-grey-lighten-2 mt-4">
              {{ $t('plans.foundSquadDesc') }}
            </p>
          </v-card>
        </v-col>

        <!-- Option: Join Group -->
        <v-col class="d-flex justify-center" cols="12" lg="4" md="5">
          <v-card
            class="plan-card d-flex flex-column align-center justify-center w-100 pa-8 ma-2 plan-grupal"
            elevation="10"
            rounded="xl"
            @click="step = 'login'"
          >
            <div class="icon-wrapper mb-6">
              <v-icon class="plan-icon" color="purple-accent-2" size="70">mdi-account-arrow-right</v-icon>
              <div class="icon-glow" style="background: #e040fb" />
            </div>
            <h2 class="text-h4 font-weight-bold text-uppercase tracking-wider text-white">
              {{ $t('plans.joinSquadTitle') }}
            </h2>
            <p class="text-body-1 text-grey-lighten-2 mt-4">
              {{ $t('plans.joinSquadDesc') }}
            </p>
          </v-card>
        </v-col>
      </v-row>

      <div class="mt-8">
        <v-btn
          class="hover-bright"
          color="grey-lighten-1"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="step = 'select-plan'"
        >
          {{ $t('plans.backToSelection') }}
        </v-btn>
      </div>
    </v-container>

    <!-- SECTION 3A: JOIN GROUP (Login) -->
    <v-container v-else-if="step === 'login'" class="d-flex align-center justify-center fill-height" max-width="600">
      <v-card border class="holo-panel pa-10 text-center w-100" rounded="xl">
        <div class="header-section mb-6">
          <div class="d-flex align-center justify-center mb-4">
            <v-icon class="mr-3 glass-icon" color="purple-accent-2" size="40">mdi-radar</v-icon>
            <div class="text-overline text-purple-accent-1 tracking-widest">{{ $t('plans.linkSystem') }}</div>
          </div>
          <h2 class="text-h4 font-weight-black text-white mb-1 tracking-wide">{{ $t('plans.teamAccess') }}</h2>
          <v-divider class="my-4 border-purple-glow" />
        </div>

        <v-row dense>
          <v-col class="text-left mb-1" cols="12">
            <label class="text-caption text-purple-lighten-4 font-weight-bold ml-1">{{ $t('plans.missionId') }}</label>
          </v-col>
          <v-col class="mb-4" cols="12">
            <v-text-field
              v-model="user"
              bg-color="rgba(20, 10, 40, 0.6)"
              class="tech-input"
              color="purple-accent-2"
              hide-details
              :placeholder="$t('plans.squadNameId')"
              prepend-inner-icon="mdi-account-group"
              variant="solo-filled"
              @keyup.enter="login"
            />
          </v-col>

          <v-col class="text-left mb-1" cols="12">
            <label class="text-caption text-purple-lighten-4 font-weight-bold ml-1">{{ $t('plans.encryptionKey') }}</label>
          </v-col>
          <v-col class="mb-6" cols="12">
            <v-text-field
              v-model="password"
              bg-color="rgba(20, 10, 40, 0.6)"
              class="tech-input"
              color="purple-accent-2"
              hide-details
              :placeholder="$t('plans.accessCode')"
              prepend-inner-icon="mdi-lock-outline"
              type="password"
              variant="solo-filled"
              @keyup.enter="login"
            />
          </v-col>
        </v-row>

        <v-btn
          class="mb-6 font-weight-bold glow-btn-secondary text-h6 mx-auto"
          color="purple-accent-2"
          :disabled="!user || !password"
          height="54"
          min-width="280"
          rounded="lg"
          @click="login"
        >
          <v-icon class="mr-2" start>mdi-connection</v-icon>
          {{ $t('plans.establishConnection') }}
        </v-btn>

        <v-btn
          class="hover-bright text-caption"
          color="grey-lighten-2"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="step = 'group-options'"
        >
          {{ $t('plans.abortAndReturn') }}
        </v-btn>
      </v-card>
    </v-container>

    <!-- SECTION 3B: CREATE GROUP (New Form) -->
    <v-container v-else-if="step === 'create-group'" class="d-flex align-center justify-center fill-height" max-width="600">
      <v-card border class="holo-panel pa-10 text-center w-100" rounded="xl">
        <div class="header-section mb-6">
          <div class="d-flex align-center justify-center mb-4">
            <v-icon class="mr-3 glass-icon" color="green-accent-3" size="40">mdi-domain-plus</v-icon>
            <div class="text-overline text-green-accent-1 tracking-widest">{{ $t('plans.unitRegistration') }}</div>
          </div>
          <h2 class="text-h4 font-weight-black text-white mb-1 tracking-wide">{{ $t('plans.newSquad') }}</h2>
          <v-divider class="my-4 border-green-glow" />
        </div>

        <v-row dense>
          <v-col class="text-left mb-1" cols="12">
            <label class="text-caption text-green-lighten-4 font-weight-bold ml-1">Tipo de grupo</label>
          </v-col>
          <v-col class="mb-4" cols="12">
            <v-select
              v-model="groupType"
              :items="groupTypeOptions"
              bg-color="rgba(10, 30, 20, 0.6)"
              class="tech-input-green"
              color="green-accent-3"
              hide-details
              prepend-inner-icon="mdi-account-group"
              variant="solo-filled"
            />
          </v-col>

          <v-col class="mb-6 text-caption text-green-lighten-4 text-left" cols="12">
            Este cambio actualiza tu cuenta actual a plan grupal y mantiene tu progreso.
          </v-col>
        </v-row>

        <v-btn
          class="mb-6 font-weight-bold glow-btn-success text-h6 text-black mx-auto"
          color="green-accent-3"
          :disabled="!groupType"
          height="54"
          min-width="280"
          rounded="lg"
          @click="createGroup"
        >
          <v-icon class="mr-2" start>mdi-check-decagram</v-icon>
          {{ $t('plans.confirmFoundation') }}
        </v-btn>

        <v-btn
          class="hover-bright text-caption"
          color="grey-lighten-2"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="step = 'group-options'"
        >
          {{ $t('plans.cancelProtocol') }}
        </v-btn>
      </v-card>
    </v-container>

  </v-container>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useAstroStore } from '@/stores/astroStore'

  const { t } = useI18n()
  const astroStore = useAstroStore()
  const router = useRouter()

  const step = ref('select-plan')
  const selectedPlan = ref('')

  // Login Data
  const user = ref('')
  const password = ref('')

  // Registration Data (Group)
  const groupType = ref('CENTER')
  const groupTypeOptions = [
    { title: 'Centro (gestiona profes y alumnos)', value: 'CENTER' },
    { title: 'Profesor (gestiona alumnos)', value: 'TEACHER' },
  ]

  const plans = computed(() => [
    {
      id: 'INDIVIDUAL',
      icon: 'mdi-rocket-launch',
      color: 'cyan-accent-3',
      glowColor: 'cyan',
      desc: t('plans.individualDesc') || 'Despega en solitario. Domina las misiones básicas y explora el cosmos a tu propio ritmo.',
      recommended: true,
    },
    {
      id: 'GRUPAL',
      icon: 'mdi-account-group-outline',
      color: 'purple-accent-2',
      glowColor: 'purple',
      desc: t('plans.grupalDesc') || 'Únete a una escuadra. Coordinación táctica, seguimiento en tiempo real y panel de telemetría conjunto.',
      recommended: false,
    },
  ])

  function selectPlan (planId) {
    selectedPlan.value = planId

    if (planId === 'INDIVIDUAL') {
      step.value = 'individual-options'
      return
    }

    // Si es grupal, vamos al paso intermedio de opciones
    if (planId === 'GRUPAL') {
      step.value = 'group-options'
    }
  }

  async function setIndividualPlan (planType) {
    const result = await astroStore.updatePlan(planType)

    if (result.success) {
      router.push('/profile')
    } else {
      alert(result.message || 'No se pudo cambiar el plan')
    }
  }

  async function login () {
    if (!user.value || !password.value) return

    const result = await astroStore.loginTripulante({
      user: user.value,
      password: password.value,
    })

    if (result.success) {
      router.push('/multiplayer') // Asumimos que si entra por grupo, va al multi
    } else {
      alert(result.message)
    }
  }

  async function createGroup () {
    const result = await astroStore.updatePlan('GRUPAL', { groupType: groupType.value })

    if (result.success) {
      router.push('/profile')
    } else {
      alert(result.message)
    }
  }
</script>

<style scoped>
/* BACKGROUND ANIMATION */
.plans-container {
    background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.plans-container::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px),
        radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
        radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
    background-size: 550px 550px, 350px 350px, 250px 250px;
    background-position: 0 0, 40px 60px, 130px 270px;
    opacity: 0.3;
    animation: stars 120s linear infinite;
    z-index: -1;
}

@keyframes stars {
    from { transform: translateY(0); }
    to { transform: translateY(-1000px); }
}

/* TEXT STYLES */
.text-glow {
    text-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}

.tracking-wide { letter-spacing: 2px; }
.tracking-wider { letter-spacing: 3px; }
.tracking-widest { letter-spacing: 4px; }

/* CARD STYLES */
.plan-card {
    background: rgba(20, 25, 40, 0.7) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08); /* Fallback */
    cursor: default;
    overflow: hidden;
    position: relative;
}

.plan-card::after {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
    pointer-events: none;
}

/* RECOMMENDED / INDIVIDUAL */
.recommended-badge {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #00e5ff;
    color: black;
    padding: 6px 16px;
    border-radius: 20px;
    z-index: 20;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
    border: 2px solid white;
}

.recommended-card {
    border: 2px solid rgba(0, 229, 255, 0.3) !important;
    background: rgba(0, 40, 60, 0.6) !important;
}

.plan-individual .plan-icon {
    filter: drop-shadow(0 0 15px rgba(0, 229, 255, 0.5));
}

/* GRUPAL PLAN SPECIFIC */
.plan-grupal .plan-icon {
    filter: drop-shadow(0 0 15px rgba(224, 64, 251, 0.5));
}

/* ICON GLOW */
.icon-wrapper {
    position: relative;
    display: inline-block;
}

.icon-glow {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 80px; height: 80px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.2;
}

/* BUTTON STYLES */
.plan-btn {
    border-width: 2px;
    text-transform: none;
    letter-spacing: 1px;
}

/* HOLO PANEL STYLES (NEW FORMS) */
.holo-panel {
    background: rgba(10, 15, 25, 0.9) !important;
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.08); /* Fallback */
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}

.border-purple-glow {
    border-color: rgba(224, 64, 251, 0.5) !important;
    opacity: 1;
    box-shadow: 0 0 10px rgba(224, 64, 251, 0.3);
}

.border-green-glow {
    border-color: rgba(0, 230, 118, 0.5) !important;
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 230, 118, 0.3);
}

/* TECH INPUTS */
.tech-input :deep(.v-field) {
    border-radius: 0 16px 0 16px !important; /* Tech shape */
    border: 1px solid rgba(224, 64, 251, 0.3);
    transition: all 0.3s;
}

.tech-input :deep(.v-field:hover), .tech-input :deep(.v-field--focused) {
    border-color: #e040fb;
    box-shadow: 0 0 15px rgba(224, 64, 251, 0.2);
}

.tech-input-green :deep(.v-field) {
    border-radius: 16px 0 16px 0 !important; /* Tech shape alternate */
    border: 1px solid rgba(0, 230, 118, 0.3);
    transition: all 0.3s;
}

.tech-input-green :deep(.v-field:hover), .tech-input-green :deep(.v-field--focused) {
    border-color: #00e676;
    box-shadow: 0 0 15px rgba(0, 230, 118, 0.2);
}

.tech-input :deep(input), .tech-input-green :deep(input) {
    font-family: 'Courier New', monospace; /* Tech vibe */
    letter-spacing: 1px;
    color: white !important;
}

/* BUTTONS GLOW */
.glow-btn-secondary {
    box-shadow: 0 5px 20px rgba(224, 64, 251, 0.3);
    border: 1px solid rgba(255,255,255,0.1);
}

.glow-btn-success {
    box-shadow: 0 5px 20px rgba(0, 230, 118, 0.3);
    border: 1px solid rgba(255,255,255,0.1);
}

.hover-bright {
    transition: color 0.3s;
}
.hover-bright:hover {
    color: white !important;
}

.glass-icon {
    text-shadow: 0 0 15px currentColor;
}

/* --- FORCED NO-ANIMATION OVERRIDES --- */

/* 1. Stop Card scaling/movement */
.plan-card:hover {
    transform: none !important;
    box-shadow: none !important; /* Or keep default shadow but no CHANGE */
}

/* 2. Stop Button overlay (darkening/lightening) */
.plan-btn:hover .v-btn__overlay,
.v-btn:hover > .v-btn__overlay {
    opacity: 0 !important;
}

/* 3. Stop Button color change */
.plan-btn:hover {
    background-color: transparent !important; /* If outlined, transparent. If flat, original color. */
}

/* Better approach for buttons: */
.plan-btn.v-btn--variant-outlined:hover {
    background-color: transparent !important;
    color: inherit !important;
}

.plan-btn.v-btn--variant-flat:hover {
    box-shadow: none !important;
    transform: none !important;
}
.premium-card {
    border: 1px solid rgba(255, 171, 64, 0.2) !important;
}

.premium-card:hover {
    border-color: #ffab40 !important;
}
</style>
