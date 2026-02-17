<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card
      elevation="24"
      width="500"
      class="pa-8 register-card"
      style="border: 1px solid rgba(112, 0, 255, 0.3); background: #0d1117;"
    >
      <div class="text-center mb-6">
        <v-icon color="primary" size="large" class="mb-2">mdi-account-plus-outline</v-icon>
        <h1 class="text-h4 font-weight-bold text-primary tracking-widest">ALISTAMIENTO</h1>
        <div class="text-overline text-secondary">NUEVO TRIPULANTE ASTRO</div>
      </div>

      <v-form ref="registerForm" @submit.prevent="handleRegister">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="formData.username"
              label="DEFINIR ID DE TRIPULANTE"
              variant="outlined"
              prepend-inner-icon="mdi-identifier"
              color="primary"
              :rules="[v => !!v || 'Campo requerido']"
              class="mb-2"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-select
              v-model="formData.rank"
              :items="ranks"
              label="ESPECIALIDAD DE VUELO"
              variant="outlined"
              prepend-inner-icon="mdi-star-outline"
              color="secondary"
              class="mb-2"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="formData.password"
              label="CÓDIGO"
              type="password"
              variant="outlined"
              prepend-inner-icon="mdi-lock-outline"
              color="primary"
              :rules="[v => !!v || 'Campo requerido']"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="formData.confirmPassword"
              label="CONFIRMAR"
              type="password"
              variant="outlined"
              prepend-inner-icon="mdi-lock-check-outline"
              color="primary"
              :error-messages="passwordMatchError"
            ></v-text-field>
          </v-col>
        </v-row>

        <!-- ALERTA D'ERROR SI EL SERVER DIU QUE NO -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4 mb-4"
          border="start"
          closable
        >
          {{ errorMessage }}
        </v-alert>

        <v-btn
          block
          size="x-large"
          color="secondary"
          type="submit"
          class="register-btn font-weight-black mt-4"
          :loading="loading"
          :disabled="!!passwordMatchError"
        >
          INICIAR PROTOCOLO DE ALTA
        </v-btn>
      </v-form>

      <v-card-actions class="justify-center mt-6">
        <v-btn variant="text" size="small" color="grey-lighten-1" @click="router.push('/login')">
          ¿YA TIENES ID? INICIAR SESIÓN
        </v-btn>
      </v-card-actions>
      
      <v-divider class="my-4" color="secondary"></v-divider>
      
      <div class="text-center text-caption text-grey">
        COORDENADAS DE REGISTRO: <span class="text-secondary">SECTOR-7G</span>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAstroStore } from '@/stores/astroStore'; // Assegura't que la ruta és correcta

const router = useRouter();
const astroStore = useAstroStore();

const loading = ref(false);
const errorMessage = ref('');
const ranks = ['Cadete de Vuelo', 'Oficial Científico', 'Ingeniero de Sistemas', 'Comandante de Flota'];

const formData = ref({
  username: '',
  rank: 'Cadete de Vuelo',
  password: '',
  confirmPassword: ''
});

// Validació simple de coincidència de contrasenyes
const passwordMatchError = computed(() => {
  if (!formData.value.confirmPassword) return '';
  return formData.value.password !== formData.value.confirmPassword 
    ? 'Los códigos no coinciden' 
    : '';
});

const handleRegister = async () => {
  // 1. Validacions bàsiques abans d'enviar
  if (passwordMatchError.value) return;
  if (!formData.value.username || !formData.value.password) {
      errorMessage.value = "Tots els camps són obligatoris.";
      return;
  }
  
  loading.value = true;
  errorMessage.value = '';

  try {
    // 2. Construïm l'objecte per enviar al Backend
    const tripulanteData = {
        username: formData.value.username,
        password: formData.value.password,
        rank: formData.value.rank
    };

    // 3. Cridem a l'acció del Store (que fa el fetch a MongoDB)
    // Assegura't d'haver afegit l'acció registerTripulante al teu astroStore.js
    const result = await astroStore.registerTripulante(tripulanteData);
    
    if (result.success) {
        console.log("✅ Tripulante registrado en Mongo Atlas:", tripulanteData.username);
        // Redirigim al login perquè l'usuari entri amb les seves credencials
        router.push('/login'); 
    } else {
        // Mostrem l'error que ve del servidor (Ex: "Usuari ja existeix")
        errorMessage.value = result.message || "Error al processar l'alta.";
    }
    
  } catch (err) {
    console.error(err);
    errorMessage.value = "Error crític: No s'ha pogut contactar amb la base.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-card {
  border-radius: 16px;
  box-shadow: 0 0 25px rgba(112, 0, 255, 0.2) !important;
}

.tracking-widest {
  letter-spacing: 0.3rem !important;
}

.register-btn {
  background: linear-gradient(45deg, #7000ff, #00f2ff) !important;
  color: white !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(112, 0, 255, 0.4);
  filter: saturate(1.5);
}
</style>