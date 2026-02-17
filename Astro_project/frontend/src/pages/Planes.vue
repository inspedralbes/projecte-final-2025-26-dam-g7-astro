<template>
    <v-app theme="dark">
        <v-main class="d-flex align-center justify-center" style="background-color: #0a0a0c;">

            <v-container v-if="step === 'select-plan'" class="text-center">
                <h1 class="text-h4 mb-2 text-primary">ASTRO LOGO</h1> [cite: 37]
                <p class="mb-8 text-grey">ESCOGE EL PLAN QUE MÁS TE ENCAJE</ [cite: 52, 53] <v-row justify="center">
                    <v-col cols="12" md="5">
                        <v-card variant="outlined" border="primary" class="pa-6" @click="selectPlan('INDIVIDUAL')">
                            <v-icon size="48" color="primary">mdi-rocket-launch</v-icon>
                            <h2 class="text-h5 mt-4">INDIVIDUAL</h2> [cite: 54]
                            <p class="text-caption mt-2">
                                Incluye modo un jugador y multijugador. [cite: 55]
                                Acceso a misiones básicas de entrenamiento. [cite: 24]
                            </p>
                            <v-btn block color="primary" variant="flat" class="mt-4">SELECCIONAR</v-btn>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="5">
                        <v-card variant="outlined" border="secondary" class="pa-6" @click="selectPlan('GRUPAL')">
                            <v-icon size="48" color="secondary">mdi-domain</v-icon>
                            <h2 class="text-h5 mt-4">GRUPAL</h2> [cite: 56]
                            <p class="text-caption mt-2">
                                Modo un jugador, multijugador y seguimiento de alumnos. [cite: 57]
                                Panel de Administrador y Telemetría Avanzada. [cite: 28, 29]
                            </p>
                            <v-btn block color="secondary" variant="flat" class="mt-4">SELECCIONAR</v-btn>
                        </v-card>
                    </v-col>
                    </v-row>
            </v-container>

            <v-container v-else-if="step === 'login'" max-width="400">
                <v-card variant="flat" class="pa-8 bg-transparent text-center border">
                    <h2 class="text-h4 mb-6">{{ selectedPlan }} LOGIN</h2>

                    <v-text-field label="Usuario" [cite: 58] variant="outlined" density="comfortable" color="primary"
                        v-model="user"></v-text-field>

                    <v-text-field label="Contraseña" [cite: 59] type="password" variant="outlined" density="comfortable"
                        color="primary" v-model="password"></v-text-field>

                    <v-btn block size="large" color="primary" @click="login" class="mt-4">
                        INICIAR SESIÓN [cite: 47]
                    </v-btn>

                    <v-btn variant="text" class="mt-4 text-caption" @click="step = 'select-plan'">
                        VOLVER A PLANES
                    </v-btn>
                </v-card>
            </v-container>

        </v-main>
    </v-app>
</template>

<script setup>
import { ref } from 'vue'

const step = ref('select-plan')
const selectedPlan = ref('')
const user = ref('')
const password = ref('')

const selectPlan = (plan) => {
    selectedPlan.value = plan
    step.value = 'login'
}

const login = () => {
    // Aquí es donde luego conectarás con el WebSocket o API
    console.log(`Iniciando sesión en plan ${selectedPlan.value} como ${user.value}`)
    alert(`Bienvenido Tripulante: ${user.value}. Sincronización completada.`)[cite: 15]
}
</script>

<style scoped>
.v-card {
    transition: transform 0.3s ease;
    cursor: pointer;
    background: rgba(22, 27, 34, 0.8) !important;
    backdrop-filter: blur(10px);
}

.v-card:hover {
    transform: translateY(-5px);
    border-color: #00f2ff !important;
}
</style>