<template>
    <v-container fluid class="space-map pa-0">

        <div v-if="!activeGameComponent" class="map-scroll-container">

            <div class="start-spacer"></div>

            <div class="path-container">
                <div v-for="(level, index) in levelSequence" :key="index" class="path-row">
                    <div class="node-wrapper" :class="{
                        'pos-left': index % 2 === 0,
                        'pos-right': index % 2 !== 0
                    }">

                        <div v-if="index < levelSequence.length - 1" class="path-connector"
                            :class="{ 'connector-flip': index % 2 !== 0 }">
                            <svg viewBox="0 0 140 140">
                                <path d="M 0 0 Q 20 70 140 140" class="connector-line"
                                    :class="{ 'line-active': index + 1 < progressStore.level }" />
                            </svg>
                        </div>

                        <div v-if="index + 1 <= progressStore.level" class="floating-label"
                            :class="getLevelState(index)">
                            {{ level.name }}
                        </div>

                        <div v-if="getLevelState(index) === 'current'" class="target-score-label" style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); 
                                   background: rgba(0,0,0,0.6); color: #00E5FF; padding: 2px 6px; 
                                   border-radius: 4px; font-size: 10px; white-space: nowrap;">
                            Meta: {{ level.minScore }} pts
                        </div>

                        <button class="node-btn" :class="[
                            `state-${getLevelState(index)}`,
                            { 'is-interactive': index + 1 <= progressStore.level }
                        ]" @click="handleLevelClick(index)" v-ripple>
                            <div class="icon-layer">
                                <v-icon v-if="getLevelState(index) === 'completed'" icon="mdi-check-bold" size="32"
                                    class="icon-completed" />

                                <v-icon v-else-if="getLevelState(index) === 'current'" icon="mdi-rocket-launch"
                                    size="34" class="icon-current" />

                                <v-icon v-else icon="mdi-lock" size="28" class="icon-locked" />
                            </div>

                            <div class="shine-effect"></div>

                            <div v-if="getLevelState(index) === 'current'" class="stars-particles">
                                <span>✦</span><span>✦</span>
                            </div>
                        </button>

                    </div>
                </div>
            </div>

            <div class="end-spacer"></div>
        </div>

        <transition name="fade-zoom">
            <div v-if="activeGameComponent" class="game-overlay">
                <v-btn icon="mdi-close" variant="tonal" color="white" class="close-game-btn"
                    @click="activeGameComponent = null" />
                <component :is="activeGameComponent" @game-over="handleGameOver" />
            </div>
        </transition>

        <v-dialog v-model="showLevelUpDialog" max-width="400" persistent z-index="200">
            <v-card class="text-center pa-8 rounded-xl bg-slate-900 elevation-24" style="border: 2px solid #00e5ff;">
                <v-icon icon="mdi-chevron-double-up" color="cyan-accent-3" size="80"
                    class="mb-2 animate-bounce"></v-icon>
                <h2 class="text-h3 font-weight-black text-white mb-2">¡NIVELL {{ newLevelData.level }}!</h2>

                <div v-if="newLevelData.rankChanged" class="my-4 pa-3 rounded-lg"
                    style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3);">
                    <div class="text-caption text-grey-lighten-1 text-uppercase">Nou Rang Assolit</div>
                    <div class="text-h6 font-weight-bold text-amber-accent-3">{{ newLevelData.rank }}</div>
                </div>

                <p class="text-body-1 text-grey-lighten-1 mb-6 mt-2">
                    Has guanyat més experiència i ets un pas més a prop de dominar la galàxia.
                </p>
                <v-btn color="cyan-accent-3" variant="flat" block rounded="xl" size="x-large"
                    class="font-weight-bold text-black" @click="showLevelUpDialog = false">
                    CONTINUAR
                </v-btn>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showFailDialog" max-width="400" persistent z-index="200">
            <v-card class="text-center pa-8 rounded-xl bg-slate-900 elevation-24" style="border: 2px solid #ff5252;">
                <v-icon icon="mdi-close-circle-outline" color="red-accent-2" size="80" class="mb-4"></v-icon>

                <h2 class="text-h4 font-weight-black text-white mb-2">¡Casi lo logras!</h2>

                <div class="py-4">
                    <p class="text-body-1 text-grey-lighten-1">Has obtenido:</p>
                    <div class="text-h3 font-weight-bold text-white mb-4">{{ lastScore }} pts</div>

                    <v-divider class="mb-4"></v-divider>

                    <p class="text-body-2 text-grey-lighten-1">
                        Necesitas <span class="text-red-accent-2 font-weight-bold">{{ requiredScore }} puntos</span><br>
                        para desbloquear la siguiente misión.
                    </p>
                </div>

                <v-btn color="red-accent-2" variant="flat" block rounded="xl" size="large"
                    class="font-weight-bold text-black mt-4" @click="showFailDialog = false">
                    INTENTAR DE NUEVO
                </v-btn>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
// Importamos el store correcto según el archivo progressStore.js que me pasaste
import { useProgressStore } from '@/stores/progressStore';

import WordConstruction from '@/components/games/WordConstruction.vue';
import SpelledRosco from '@/components/games/SpelledRosco.vue';
import RadarScan from '@/components/games/RadarScan.vue';
import RadioSignal from '@/components/games/RadioSignal.vue';
import RhymeSquad from '@/components/games/RhymeSquad.vue';

const progressStore = useProgressStore();
const activeGameComponent = shallowRef(null);

// Estados de los diálogos
const showLevelUpDialog = ref(false);
const showFailDialog = ref(false);

// Datos temporales para la lógica de puntuación
const lastScore = ref(0);
const requiredScore = ref(0);

const newLevelData = ref({
    level: 1,
    rank: '',
    rankChanged: false
});


// DEFINICIÓN DE NIVELES Y PUNTUACIONES MÍNIMAS
// Ajusta 'minScore' a la dificultad real de tus juegos
const levelSequence = [
    { name: 'Despegue', component: WordConstruction, minScore: 100 },
    { name: 'Navegación', component: RadarScan, minScore: 300 },
    { name: 'Comunicaciones', component: RadioSignal, minScore: 500 },
    { name: 'Sistemas', component: SpelledRosco, minScore: 800 },
    { name: 'Agujero Negro', component: RadarScan, minScore: 1000 },
    { name: 'Exoplaneta', component: RadioSignal, minScore: 1500 },
];

// Determina el estado visual del nodo (bloqueado, actual, completado)
const getLevelState = (index) => {
    const levelNum = index + 1;
    if (levelNum === progressStore.level) return 'current';
    if (levelNum < progressStore.level) return 'completed';
    return 'locked';
};

// Maneja el click en el mapa
const handleLevelClick = (index) => {
    const state = getLevelState(index);
    if (state !== 'locked') {
        // Asignamos el componente del juego para que se abra
        activeGameComponent.value = levelSequence[index].component;
    }
};

// LÓGICA PRINCIPAL AL TERMINAR UN MINIJUEGO
const handleGameOver = async (finalScore) => {
    // 1. Cerramos visualmente el juego
    activeGameComponent.value = null;
    lastScore.value = finalScore;

    // 2. Verificamos si hay usuario activo
    const user = progressStore.resolveUser();

    if (user) {
        try {
            // -- LÓGICA DE VALIDACIÓN DE PUNTOS --

            // Calculamos qué nivel acaba de jugar el usuario.
            // Si el usuario está en nivel 1, el índice es 0.
            // NOTA: Si permites re-jugar niveles anteriores, aquí deberías saber
            // exactamente cuál de los botones pulsó. 
            // Asumimos que juega el nivel actual (progressStore.level).
            const currentLevelIndex = progressStore.level - 1;

            // Obtenemos la configuración de ese nivel
            const levelConfig = levelSequence[currentLevelIndex];

            // Si existe configuración y NO supera la puntuación mínima:
            if (levelConfig && finalScore < levelConfig.minScore) {
                requiredScore.value = levelConfig.minScore;
                showFailDialog.value = true;

                console.log(`❌ Puntos insuficientes: ${finalScore} / ${levelConfig.minScore}`);
                return; // IMPORTANTE: Detenemos aquí. No llamamos al servidor.
            }

            // -- SI SUPERA LA PUNTUACIÓN, GUARDAMOS PROGRESO --

            const previousLevel = progressStore.level;

            // Llamada al store (que llama al backend)
            const result = await progressStore.registerCompletedGame(
                activeGameComponent.value?.__name || 'Minijuego', // Nombre del componente como fallback
                finalScore
            );

            // Manejo de errores del servidor
            if (!result.success) throw new Error(result.message);

            // Verificamos si el servidor nos ha subido de nivel
            if (result.data.newLevel > previousLevel) {
                newLevelData.value = {
                    level: result.data.newLevel,
                    rank: result.data.newRank || 'Explorador', // Fallback si no viene rango
                    rankChanged: false // Aquí podrías comparar con el rango anterior si lo tuvieras
                };
                showLevelUpDialog.value = true;
            }

        } catch (error) {
            console.error("❌ Error al registrar la partida:", error);
        }
    } else {
        console.warn("⚠️ Modo invitado: No se ha guardado la puntuación.");
        // Opcional: Mostrar diálogo de registro para guardar progreso
    }
};
</script>

<style scoped>
/* 1. FONDO (Igual) */
.space-map {
    height: 100%;
    width: 100%;
    background: radial-gradient(circle at 50% 10%, #1a233a 0%, #05070d 100%);
    position: relative;
    overflow: hidden;
    color: white;
    font-family: 'Nunito', sans-serif;
}

.map-scroll-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    padding-top: 20px;
}

.start-spacer {
    height: 80px;
}

.end-spacer {
    height: 150px;
}

/* 2. GRID Y POSICIONAMIENTO (Ajustado) */
.path-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 400px;
    /* Reducido un poco para centrar mejor en móviles */
    margin: 0 auto;
}

.path-row {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 140px;
    /* Altura fija entre niveles */
    position: relative;
    /* Borde para depuración (quitar en prod) */
    /* border: 1px dashed rgba(255,255,255,0.1); */
}

.node-wrapper {
    position: relative;
    width: 80px;
    /* Igual al ancho del botón */
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

/* ZIG-ZAG:
   La distancia horizontal debe coincidir con el ancho del SVG 
   para que la línea conecte bien.
   70px izquierda + 70px derecha = 140px de separación total.
*/
.pos-left {
    transform: translateX(-70px);
}

.pos-right {
    transform: translateX(70px);
}

/* 3. CONECTORES (REPARADO) */
.path-connector {
    position: absolute;
    /* Nace del centro absoluto del botón */
    top: 50%;
    left: 50%;

    /* Dimensiones: 
       Ancho = Distancia horizontal al siguiente nodo (140px)
       Alto = Altura de la fila (140px)
    */
    width: 140px;
    height: 140px;

    z-index: -1;
    pointer-events: none;
    transform-origin: top left;
    /* Importante para el flip */
}

/* Si estamos a la derecha (impar), el siguiente está a la izquierda.
   Volteamos el SVG horizontalmente para que la curva vaya hacia el otro lado.
*/
.connector-flip {
    transform: scaleX(-1);
}

svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    /* Permite que el trazo grueso no se corte */
}

.connector-line {
    fill: none;
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 8;
    /* Un poco más fino para elegancia */
    stroke-dasharray: 12 10;
    stroke-linecap: round;
}

.line-active {
    stroke: #FFD54F;
    opacity: 0.6;
    animation: dash-flow 30s linear infinite;
}

/* 4. BOTONES (Estabilizados) */
.node-btn {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: none;
    position: relative;
    outline: none;
    cursor: default;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    /* Efecto rebote suave */
    -webkit-tap-highlight-color: transparent;
}

.node-btn.is-interactive {
    cursor: pointer;
}

.node-btn:active {
    transform: scale(0.92);
}

/* ESTADOS */
.state-locked {
    background-color: #2b3040;
    box-shadow: 0 6px 0 #181b24, 0 10px 10px rgba(0, 0, 0, 0.3);
}

.state-completed {
    background-color: #FFD54F;
    box-shadow: 0 6px 0 #C49000, 0 10px 15px rgba(255, 213, 79, 0.3);
}

.state-completed:active {
    box-shadow: 0 2px 0 #C49000;
    transform: translateY(4px);
}

.state-current {
    background-color: #00E5FF;
    box-shadow: 0 8px 0 #0097A7, 0 0 30px rgba(0, 229, 255, 0.4);
    animation: floating 3s ease-in-out infinite;
}

/* 5. OTROS DETALLES */
.floating-label {
    position: absolute;
    top: -45px;
    /* Un poco más arriba para que no tape el botón */
    left: 50%;
    transform: translateX(-50%);
    /* Centrado perfecto respecto al botón */
    background: rgba(11, 15, 25, 0.8);
    backdrop-filter: blur(4px);
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 20;
}

.state-current.floating-label {
    color: #00E5FF;
    border-color: rgba(0, 229, 255, 0.5);
}

.state-completed.floating-label {
    color: #FFD54F;
}

.shine-effect {
    position: absolute;
    top: 10px;
    left: 14px;
    width: 25px;
    height: 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    transform: rotate(-35deg);
    pointer-events: none;
}

@keyframes dash-flow {
    to {
        stroke-dashoffset: -500;
    }
}

@keyframes floating {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-8px);
    }
}

.game-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0b0f19;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
}

.close-game-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 101;
}

.fade-zoom-enter-active,
.fade-zoom-leave-active {
    transition: all 0.3s ease;
}

.fade-zoom-enter-from,
.fade-zoom-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>