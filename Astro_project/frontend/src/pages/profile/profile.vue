<template>
    <v-container class="fill-height d-flex justify-center align-center">
        <!-- Usamos un estilo 'glass' (vidrio) para que se vea moderno pero el código es simple -->
        <v-card width="500" class="glass-card text-center pa-8" elevation="0">

            <!-- Avatar brillante -->
            <div class="d-flex justify-center mb-6">
                <v-avatar size="150" class="avatar-border">
                    <v-img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar"></v-img>
                </v-avatar>
            </div>

            <!-- Nombre y Rango -->
            <h1 class="text-h4 font-weight-bold text-white mb-2">Usuario Estudiante</h1>
            <v-chip color="cyan-accent-3" variant="outlined" class="mb-8">
                Desarrollador Junior
            </v-chip>

            <!-- Estadísticas Simples -->
            <v-row class="mb-8">
                <v-col cols="4">
                    <div class="text-h5 font-weight-bold text-cyan-accent-3">2</div>
                    <div class="text-caption text-grey">Nivel</div>
                </v-col>
                <v-col cols="4">
                    <div class="text-h5 font-weight-bold text-white">DAM 2</div>
                    <div class="text-caption text-grey">Clase</div>
                </v-col>
                <v-col cols="4">
                    <v-icon color="green" icon="mdi-circle-small"></v-icon>
                    <div class="text-caption text-grey">Online</div>
                </v-col>
            </v-row>

            <v-divider class="mb-8 border-opacity-25"></v-divider>

            <!-- Botones de Acción -->
            <div class="d-flex flex-column gap-4">
                <v-btn block color="cyan-accent-3" size="large" rounded="xl" variant="flat" @click="goHome"
                    class="font-weight-bold mb-3">
                    VOLVER AL MENÚ
                </v-btn>

                <v-btn block color="white" variant="outlined" size="large" rounded="xl" @click="changePlan"
                    class="font-weight-bold">
                    ACTUALIZAR PLAN
                </v-btn>
            </div>

        </v-card>
    </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// Función simple para volver
function goHome() {
    router.push('/')
}

function changePlan() {
    router.push('/planes')
}
</script>

<style scoped>
/* Estilo efecto vidrio (Glassmorphism) */
.glass-card {
    background: rgba(255, 255, 255, 0.05) !important;
    /* Fondo semi-transparente */
    backdrop-filter: blur(10px);
    /* Desenfoque del fondo */
    border: 1px solid rgba(255, 255, 255, 0.1);
    /* Borde sutil */
    border-radius: 24px;
    /* Bordes redondeados */
}

/* Borde brillante para el avatar */
.avatar-border {
    border: 3px solid #00e5ff;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
    /* Resplandor */
}
</style>
