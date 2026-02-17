<template>
    <v-app theme="dark">
        <v-main class="d-flex align-center justify-center" style="background-color: #0a0a0c;">

            <v-container v-if="step === 'select-plan'" class="text-center">
                <h1 class="text-h4 mb-2 text-primary">ASTRO LOGO</h1>
                <p class="mb-8 text-grey">ESCOGE EL PLAN QUE MÁS TE ENCAJE</p>

                <v-row justify="center">
                    <v-col cols="12" md="5" v-for="plan in plans" :key="plan.id">
                        <v-card 
                            variant="outlined" 
                            :class="['pa-6', plan.id === 'INDIVIDUAL' ? 'border-primary' : 'border-secondary']"
                            @click="selectPlan(plan.id)"
                        >
                            <v-icon size="48" :color="plan.color">{{ plan.icon }}</v-icon>
                            <h2 class="text-h5 mt-4">{{ plan.id }}</h2>
                            <p class="text-caption mt-2" style="min-height: 40px;">
                                {{ plan.desc }}
                            </p>
                            <v-btn block :color="plan.color" variant="flat" class="mt-4">
                                SELECCIONAR
                            </v-btn>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

            <v-container v-else-if="step === 'login'" max-width="400">
                <v-card variant="flat" class="pa-8 bg-transparent text-center border">
                    <h2 class="text-h4 mb-6">{{ selectedPlan }} LOGIN</h2>

                    <v-text-field 
                        label="Usuario" 
                        variant="outlined" 
                        density="comfortable" 
                        color="primary"
                        v-model="user"
                        @keyup.enter="login"
                    ></v-text-field>

                    <v-text-field 
                        label="Contraseña" 
                        type="password" 
                        variant="outlined" 
                        density="comfortable"
                        color="primary" 
                        v-model="password"
                        @keyup.enter="login"
                    ></v-text-field>

                    <v-btn 
                        block 
                        size="large" 
                        color="primary" 
                        @click="login" 
                        class="mt-4"
                        :disabled="!user || !password"
                    >
                        INICIAR SESIÓN
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
import { useAstroStore } from '@/stores/astroStore' // Importamos el store
import { useRouter } from 'vue-router'

const astroStore = useAstroStore()
const router = useRouter()

const step = ref('select-plan')
const selectedPlan = ref('')
const user = ref('')
const password = ref('')

// Centralizar los datos de los planes hace el código más limpio
const plans = [
    { id: 'INDIVIDUAL', icon: 'mdi-rocket-launch', color: 'primary', desc: 'Incluye modo un jugador y multijugador. Acceso a misiones básicas.' },
    { id: 'GRUPAL', icon: 'mdi-domain', color: 'secondary', desc: 'Modo un jugador, multijugador, seguimiento y panel de telemetría.' }
]

const selectPlan = (plan) => {
    if (plan === 'INDIVIDUAL') {
        router.push('/profile')
        return
    }
    selectedPlan.value = plan
    user.value = ''     // Limpiamos datos por seguridad
    password.value = ''
    step.value = 'login'
}

const login = async () => {
    if (!user.value || !password.value) return
    
    // Llamamos a la sincronización real con el servidor
    const result = await astroStore.loginTripulante({
        user: user.value,
        password: password.value
    })

    if (result.success) {
        // Redirigimos al Menú Principal si la trayectoria es correcta
        router.push('/menu')
    } else {
        alert(result.message) // "Trayectoria fallida: Credenciales no reconocidas" [cite: 15]
    }
}
</script>

<style scoped>
.v-card {
    transition: all 0.3s ease;
    cursor: pointer;
    background: rgba(22, 27, 34, 0.8) !important;
    backdrop-filter: blur(10px);
}

.v-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

/* Forzar que el borde brille un poco más en hover */
.border-primary:hover {
    border-color: #00f2ff !important;
}
</style>