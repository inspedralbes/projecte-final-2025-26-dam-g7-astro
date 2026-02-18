<template>
  <v-container fluid class="fill-height register-container d-flex align-center justify-center">
    <div class="stars-overlay"></div>
    
    <v-card
      elevation="24"
      max-width="500"
      width="100%"
      class="pa-8 register-card glass-panel"
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
          <span class="text-caption font-weight-bold">ABORTAR / VOLVER A BASE</span>
        </v-btn>
      </div>

      <div class="text-center mb-8 header-section">
        <div class="hologram-effect mb-4">
          <v-icon color="cyan-accent-3" size="64" class="pulse-icon">mdi-shield-account-outline</v-icon>
        </div>
        <h1 class="text-h3 font-weight-black text-white tracking-widest neon-text mb-2">
          ALISTAMIENTO
        </h1>
        <div class="text-overline text-cyan-lighten-3 tracking-wide border-bottom-pulse">
          NUEVO TRIPULANTE ASTRO
        </div>
      </div>

      <v-form ref="registerForm" @submit.prevent="handleRegister">
        <v-row dense>
          <v-col cols="12">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">IDENTIFICACIÓN</div>
            <v-text-field
              v-model="formData.username"
              placeholder="NOMBRE DE USUARIO (TU ID)"
              variant="solo-filled"
              bg-color="rgba(0, 20, 40, 0.6)"
              prepend-inner-icon="mdi-account-box-outline"
              color="cyan-accent-3"
              class="future-input"
              :rules="[v => !!v || 'ID Requerido']"
              hide-details="auto"
            ></v-text-field>
            <div class="text-caption text-grey-lighten-1 mt-1 ml-1 font-italic">
              *Este será tu nombre visible en la misión
            </div>
          </v-col>

          <v-col cols="12" sm="6" class="mt-4">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">CREDENCIALES</div>
            <v-text-field
              v-model="formData.password"
              placeholder="CONTRASEÑA"
              type="password"
              variant="solo-filled"
              bg-color="rgba(0, 20, 40, 0.6)"
              prepend-inner-icon="mdi-lock-outline"
              color="cyan-accent-3"
              class="future-input"
              :rules="[v => !!v || 'Código Requerido']"
              hide-details="auto"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" class="mt-4">
            <div class="text-caption text-cyan-lighten-4 mb-1 ml-1 font-weight-bold">VERIFICACIÓN</div>
            <v-text-field
              v-model="formData.confirmPassword"
              placeholder="CONFIRMAR CONTRASEÑA"
              type="password"
              variant="solo-filled"
              bg-color="rgba(0, 20, 40, 0.6)"
              prepend-inner-icon="mdi-lock-check-outline"
              color="cyan-accent-3"
              class="future-input"
              :error-messages="passwordMatchError"
              hide-details="auto"
            ></v-text-field>
          </v-col>
        </v-row>

        <div v-if="errorMessage" class="error-display mt-6 pa-3 d-flex align-center">
          <v-icon color="red-accent-2" class="mr-3">mdi-alert-octagon</v-icon>
          <span class="text-red-lighten-1 font-weight-bold">{{ errorMessage }}</span>
        </div>

        <v-btn
          block
          height="64"
          color="cyan-accent-3"
          type="submit"
          class="register-btn font-weight-black mt-8 text-h6"
          :loading="loading"
          :disabled="!!passwordMatchError"
        >
          <v-icon start class="mr-2">mdi-rocket-launch</v-icon>
          INICIAR PROTOCOLO DE ALTA
          <div class="btn-glow"></div>
        </v-btn>
      </v-form>

      <div class="d-flex justify-space-between align-center mt-8 pt-4 border-top-tech">
        <div class="text-caption text-grey-lighten-1 cursor-pointer hover-bright" @click="router.push('/login')">
          <v-icon size="small" class="mr-1">mdi-login</v-icon> 
          ¿YA TIENES ID? ACCEDER
        </div>
        <div class="coordinate-display text-body-2 font-weight-bold text-cyan-lighten-4 font-weight-mono">
          COORDENADAS: <span class="text-cyan-accent-2 glow-text">SECTOR-7G</span>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAstroStore } from '@/stores/astroStore';

const router = useRouter();
const astroStore = useAstroStore();

const loading = ref(false);
const errorMessage = ref('');

const formData = ref({
  username: '',
  password: '',
  confirmPassword: ''
});

const passwordMatchError = computed(() => {
  if (!formData.value.confirmPassword) return '';
  return formData.value.password !== formData.value.confirmPassword 
    ? 'Los códigos no coinciden' 
    : '';
});

const handleRegister = async () => {
    if (passwordMatchError.value) return;
    if (!formData.value.username || !formData.value.password) {
        errorMessage.value = "Todos los campos son obligatorios.";
        return;
    }
    
    loading.value = true;
    errorMessage.value = '';

    try {
        const tripulanteData = {
            username: formData.value.username,
            password: formData.value.password,
        };

        const result = await astroStore.registerTripulante(tripulanteData);
        
        if (result.success) {
            router.push('/login'); 
        } else {
            errorMessage.value = result.message || "Error al procesar el alta.";
        }
        
    } catch (err) {
        errorMessage.value = "Error crítico: No se ha podido contactar con la base.";
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* Container & Background */
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

/* Glass Card */
.glass-panel {
  background: rgba(10, 25, 41, 0.75) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 242, 255, 0.15);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

/* Header Elements */
.neon-text {
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.5), 0 0 20px rgba(0, 242, 255, 0.3);
  font-family: 'Roboto Mono', monospace;
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

/* Inputs */
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
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 1px;
  color: white !important;
}

/* Button */
.register-btn {
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  letter-spacing: 2px;
  background: linear-gradient(90deg, rgba(0,242,255,0.8) 0%, rgba(0,180,255,0.8) 100%) !important;
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

/* Error Display */
.error-display {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-left: 4px solid #ff4081;
}

/* Footer Tech Details */
.border-top-tech {
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.font-weight-mono {
  font-family: 'Roboto Mono', monospace;
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

:deep(.v-field__input) {
    color: white !important;
}
</style>