<template>
  <v-container fluid class="fill-height login-container d-flex align-center justify-center">
    <div class="stars-overlay"></div>
    
    <v-card
      elevation="24"
      max-width="450"
      width="100%"
      class="pa-8 glass-panel"
    >
      <div class="d-flex justify-start mb-4">
        <v-btn
          variant="text"
          density="compact"
          color="cyan-lighten-3"
          class="back-btn-tech"
          @click="router.push('/')"
        >
          <v-icon start size="small">mdi-chevron-left</v-icon>
          <span class="text-caption font-weight-bold">{{ $t('auth.abortCmd') }}</span>
        </v-btn>
      </div>

      <div class="text-center mb-8 header-section">
        <div class="hologram-effect mb-4">
          <v-icon color="cyan-accent-3" size="64" class="pulse-icon">mdi-planet</v-icon>
        </div>
        <h1 class="text-h3 font-weight-black text-white tracking-widest neon-text mb-2">
          ASTRO
        </h1>
        <div class="text-overline text-cyan-lighten-3 tracking-wide border-bottom-pulse">
          {{ $t('auth.systemAccessTitle') }}
        </div>
      </div>

      <v-form @submit.prevent="handleLogin">
        <v-row dense>
          <v-col cols="12">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">{{ $t('auth.identification') }}</div>
            <v-text-field
              v-model="username"
              :placeholder="$t('auth.usernameIdMarker')"
              variant="solo-filled"
              bg-color="rgba(0, 20, 40, 0.6)"
              prepend-inner-icon="mdi-account-circle-outline"
              color="cyan-accent-3"
              class="future-input"
              hide-details="auto"
              :rules="[v => !!v || $t('auth.usernameReq')]"
            ></v-text-field>
          </v-col>

          <v-col cols="12" class="mt-4">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">{{ $t('auth.flightCredentials') }}</div>
            <v-text-field
              v-model="password"
              :placeholder="$t('auth.passcode')"
              type="password"
              variant="solo-filled"
              bg-color="rgba(0, 20, 40, 0.6)"
              prepend-inner-icon="mdi-lock-outline"
              color="cyan-accent-3"
              class="future-input"
              hide-details="auto"
              :rules="[v => !!v || $t('auth.passcodeReq')]"
            ></v-text-field>
          </v-col>
        </v-row>

        <div v-if="errorMessage" class="error-display mt-6 pa-3 d-flex align-center">
          <v-icon color="red-accent-2" class="mr-3">mdi-alert-octagon</v-icon>
          <span class="text-red-lighten-1 font-weight-bold uppercase">{{ errorMessage }}</span>
        </div>

        <v-btn
          block
          height="64"
          color="cyan-accent-3"
          type="submit"
          class="login-btn font-weight-black mt-8 text-h6"
          :loading="loading"
        >
          <v-icon start class="mr-2">mdi-radar</v-icon>
          {{ $t('auth.syncInit') }}
          <div class="btn-glow"></div>
        </v-btn>
      </v-form>

      <div class="d-flex justify-space-between align-center mt-8 pt-4 border-top-tech">
        <div v-if="props.selectedPlan" class="text-caption text-grey-lighten-1 cursor-pointer hover-bright" @click="$emit('back')">
           <v-icon start size="small">mdi-arrow-left</v-icon> {{ $t('auth.changePlan') }}
        </div>
        <div v-else class="text-caption text-grey-lighten-1 cursor-pointer hover-bright" @click="router.push('/register')">
           <v-icon start size="small">mdi-account-plus</v-icon> {{ $t('auth.enlist') }}
        </div>

        <div class="status-display text-body-2 font-weight-bold text-cyan-lighten-4 font-weight-mono d-flex align-center">
          {{ $t('auth.status') }} <span class="text-green-accent-3 glow-text ml-1">{{ $t('auth.statusOperative') }}</span>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const props = defineProps(['selectedPlan']);
const emit = defineEmits(['back']);

const { t } = useI18n();
const astroStore = useAstroStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value) {
      errorMessage.value = t('auth.idAndCodeReq');
      return;
  }

  loading.value = true;
  errorMessage.value = '';

  const result = await astroStore.loginTripulante({
    user: username.value,
    password: password.value
  });

  if (result.success) {
    setTimeout(() => {
      loading.value = false;
      router.push('/singleplayer');
    }, 1000);
  } else {
    loading.value = false;
    errorMessage.value = result.message || t('auth.unrecognizedCreds');
  }
};
</script>

<style scoped>
.login-container {
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
  animation: starMove 120s linear infinite;
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

.login-btn {
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  letter-spacing: 2px;
  background: linear-gradient(90deg, rgba(0,242,255,0.8) 0%, rgba(0,180,255,0.8) 100%) !important;
  font-family: 'Rajdhani', sans-serif !important;
}

.login-btn:hover {
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