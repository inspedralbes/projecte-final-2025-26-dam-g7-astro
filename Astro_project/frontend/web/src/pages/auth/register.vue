<template>
  <v-container class="fill-height register-container d-flex align-center justify-center" fluid>
    <div class="stars-overlay" />

    <v-card
      class="pa-8 register-card glass-panel"
      elevation="24"
      max-width="580"
      width="100%"
    >
      <div class="d-flex justify-start mb-4">
        <v-btn
          class="back-btn-tech"
          color="cyan-lighten-3"
          density="compact"
          variant="text"
          @click="router.push('/')"
        >
          <v-icon size="small" start>mdi-chevron-left</v-icon>
          <span class="text-caption font-weight-bold">{{ $t('auth.abortCmd') }}</span>
        </v-btn>
      </div>

      <div class="text-center mb-8 header-section">
        <div class="hologram-effect mb-4">
          <v-icon class="pulse-icon" color="cyan-accent-3" size="64">mdi-shield-account-outline</v-icon>
        </div>
        <h1 class="text-h3 font-weight-black text-white tracking-widest neon-text mb-2">
          {{ $t('auth.enlistment') }}
        </h1>
        <div class="text-overline text-cyan-lighten-3 tracking-wide border-bottom-pulse">
          {{ $t('auth.newAstroCrew') }}
        </div>
      </div>

      <v-form ref="registerForm" @submit.prevent="handleRegister">
        <v-row dense>
          <v-col cols="12">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">{{ $t('auth.identification') }}</div>
            <v-text-field
              v-model="formData.username"
              bg-color="rgba(0, 20, 40, 0.6)"
              class="future-input"
              color="cyan-accent-3"
              hide-details="auto"
              :placeholder="$t('auth.usernameID')"
              prepend-inner-icon="mdi-account-box-outline"
              :rules="[v => !!v || $t('auth.idReq')]"
              variant="solo-filled"
            />
          </v-col>

          <v-col class="mt-4" cols="12" sm="6">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">{{ $t('auth.credentials') }}</div>
            <v-text-field
              v-model="formData.password"
              bg-color="rgba(0, 20, 40, 0.6)"
              class="future-input"
              color="cyan-accent-3"
              hide-details="auto"
              :placeholder="$t('auth.password')"
              prepend-inner-icon="mdi-lock-outline"
              :rules="[v => !!v || $t('auth.codeReq')]"
              type="password"
              variant="solo-filled"
            />
          </v-col>

          <v-col class="mt-4" cols="12" sm="6">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">{{ $t('auth.verif') }}</div>
            <v-text-field
              v-model="formData.confirmPassword"
              bg-color="rgba(0, 20, 40, 0.6)"
              class="future-input"
              color="cyan-accent-3"
              :error-messages="passwordMatchError"
              hide-details="auto"
              :placeholder="$t('auth.confirmPwd')"
              prepend-inner-icon="mdi-lock-check-outline"
              type="password"
              variant="solo-filled"
            />
          </v-col>
        </v-row>

        <div v-if="errorMessage" class="error-display mt-6 pa-3 d-flex align-center">
          <v-icon class="mr-3" color="red-accent-2">mdi-alert-octagon</v-icon>
          <span class="text-red-lighten-1 font-weight-bold uppercase">{{ errorMessage }}</span>
        </div>

        <v-btn
          block
          class="register-btn font-weight-black mt-8 text-h6"
          color="cyan-accent-3"
          :disabled="!!passwordMatchError"
          height="64"
          :loading="loading"
          type="submit"
        >
          <v-icon class="mr-2" start>mdi-rocket-launch</v-icon>
          {{ $t('auth.initSignUp') }}
          <div class="btn-glow" />
        </v-btn>
      </v-form>

      <div class="d-flex justify-space-between align-center mt-8 pt-4 border-top-tech">
        <div class="text-caption text-grey-lighten-1 cursor-pointer hover-bright" @click="router.push('/login')">
          {{ $t('auth.alreadyHaveId') }}
        </div>
        <div class="coordinate-display text-body-2 font-weight-bold text-cyan-lighten-4 font-weight-mono">
          {{ $t('auth.coordinates') }} <span class="text-cyan-accent-2 glow-text">{{ $t('auth.sector') }}</span>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useAstroStore } from '@/stores/astroStore'

  const { t } = useI18n()
  const router = useRouter()
  const astroStore = useAstroStore()

  const loading = ref(false)
  const errorMessage = ref('')

  const formData = ref({
    username: '',
    password: '',
    confirmPassword: '',
  })

  const passwordMatchError = computed(() => {
    if (!formData.value.confirmPassword) return ''
    return formData.value.password === formData.value.confirmPassword
      ? ''
      : t('auth.codesDontMatch')
  })

  async function handleRegister () {
    if (passwordMatchError.value) return
    if (!formData.value.username || !formData.value.password) {
      errorMessage.value = t('auth.allReqs')
      return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      const result = await astroStore.registerTripulante({
        username: formData.value.username,
        password: formData.value.password,
      })

      if (result.success) {
        router.push('/login')
      } else {
        errorMessage.value = result.message || t('auth.signUpErr')
      }
    } catch {
      errorMessage.value = t('auth.serverConnErr')
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
.register-container {
  background: radial-gradient(circle at center, #0b1021 0%, #000000 100%);
  position: relative;
  overflow: hidden;
}

.stars-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(white 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.5) 2px, transparent 2px);
  background-size: 50px 50px, 150px 150px;
  background-position: 0 0, 40px 60px;
  opacity: 0.2;
  animation: starMove 100s linear infinite;
}

@keyframes starMove {
  from { transform: translateY(0); }
  to { transform: translateY(-1000px); }
}

.glass-panel {
  background: rgba(10, 25, 41, 0.75) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 242, 255, 0.15);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.neon-text {
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.5), 0 0 20px rgba(0, 242, 255, 0.3);
  font-family: 'Orbitron', sans-serif !important;
  letter-spacing: 0.15em !important;
}

.border-bottom-pulse {
  border-bottom: 2px solid rgba(0, 242, 255, 0.3);
  display: inline-block;
  padding-bottom: 4px;
}

.pulse-icon {
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0% { text-shadow: 0 0 0 rgba(0, 242, 255, 0.4); }
  50% { text-shadow: 0 0 20px rgba(0, 242, 255, 0.8); }
  100% { text-shadow: 0 0 0 rgba(0, 242, 255, 0.4); }
}

.future-input :deep(.v-field) {
  border-radius: 0;
  border: 1px solid rgba(0, 242, 255, 0.2);
  transition: all 0.3s ease;
}

.future-input :deep(.v-field--focused) {
  border-color: #00f2ff;
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

.future-input :deep(input) {
  font-family: 'Rajdhani', sans-serif !important;
  font-weight: 600;
  letter-spacing: 1px;
  color: white !important;
}

.register-btn {
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  letter-spacing: 2px;
  background: linear-gradient(90deg, rgba(0,242,255,0.8) 0%, rgba(0,180,255,0.8) 100%) !important;
  font-family: 'Rajdhani', sans-serif !important;
}

.register-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 30px rgba(0, 242, 255, 0.4);
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
  transform: rotate(45deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-150%) rotate(45deg); }
  100% { transform: translateX(150%) rotate(45deg); }
}

.error-display {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-left: 4px solid #ff4081;
}

.border-top-tech {
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.font-weight-mono {
  font-family: 'Rajdhani', sans-serif;
}

.glow-text {
  text-shadow: 0 0 8px rgba(0, 242, 255, 0.8);
}

.hover-bright {
  transition: color 0.3s;
}
.hover-bright:hover {
  color: white !important;
}

.uppercase {
  text-transform: uppercase;
}

:deep(.v-field__input) {
    color: white !important;
}
</style>
