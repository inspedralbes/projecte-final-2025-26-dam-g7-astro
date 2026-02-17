<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card
      elevation="24"
      width="450"
      class="pa-8 login-card"
      style="border: 1px solid rgba(0, 242, 255, 0.3); background: #0d1117;"
    >
      <div class="text-center mb-6">
        <h1 class="text-h4 font-weight-bold text-primary tracking-widest">ASTRO</h1>
        <div class="text-overline text-secondary">{{ selectedPlan }} MISSION ACCESS</div>
      </div>

      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="username"
          label="ID DE TRIPULANTE"
          placeholder="Ej: JOEL"
          variant="outlined"
          prepend-inner-icon="mdi-account-circle-outline"
          color="primary"
          class="mb-2"
          persistent-placeholder
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="CÓDIGO DE ENCRIPTACIÓN"
          type="password"
          variant="outlined"
          prepend-inner-icon="mdi-lock-outline"
          color="primary"
          class="mb-4"
        ></v-text-field>

        <v-btn
          block
          size="x-large"
          color="primary"
          type="submit"
          class="login-btn font-weight-black"
          :loading="loading"
        >
          INICIAR SINCRONIZACIÓN
        </v-btn>
      </v-form>

      <v-card-actions class="justify-center mt-6">
        <v-btn variant="text" size="small" color="grey-lighten-1" @click="$emit('back')">
          <v-icon start>mdi-arrow-left</v-icon> CAMBIAR PLAN
        </v-btn>
      </v-card-actions>
      
      <v-divider class="my-4" color="primary"></v-divider>
      
      <div class="text-center text-caption text-grey">
        ESTADO DEL SISTEMA: <span class="text-green">OPERATIVO</span>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['selectedPlan']);
const emit = defineEmits(['back', 'login-success']);

const username = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = () => {
  loading.value = true;
  
  // Simulamos la sincronización de la trayectoria
  setTimeout(() => {
    loading.value = false;
    console.log(`Login para plan ${props.selectedPlan} con usuario ${username.value}`);
    
    // Emitimos el éxito para pasar al menú principal
    emit('login-success', { user: username.value, plan: props.selectedPlan });
  }, 1500);
};
</script>

<style scoped>
.login-card {
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.1) !important;
}

.tracking-widest {
  letter-spacing: 0.5rem !important;
}

.login-btn {
  background: linear-gradient(45deg, #00f2ff, #7000ff) !important;
  color: white !important;
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  filter: brightness(1.2);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.5);
}
</style>