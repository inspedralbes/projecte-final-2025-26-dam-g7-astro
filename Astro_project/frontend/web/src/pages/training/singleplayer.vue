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
                                    :class="{ 'line-active': index + 1 < astroStore.level }" />
                            </svg>
                        </div>

                        <div v-if="index + 1 <= astroStore.level" class="floating-label" :class="getLevelState(index)">
                            {{ level.name }}
                        </div>

                        <button class="node-btn" :class="[
                            `state-${getLevelState(index)}`,
                            { 'is-interactive': index + 1 <= astroStore.level }
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
                <v-icon icon="mdi-chevron-double-up" color="cyan-accent-3" size="80" class="mb-2 animate-bounce"></v-icon>
                <h2 class="text-h3 font-weight-black text-white mb-2">¡NIVELL {{ newLevelData.level }}!</h2>
                
                <div v-if="newLevelData.rankChanged" class="my-4 pa-3 rounded-lg" style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3);">
                    <div class="text-caption text-grey-lighten-1 text-uppercase">Nou Rang Assolit</div>
                    <div class="text-h6 font-weight-bold text-amber-accent-3">{{ newLevelData.rank }}</div>
                </div>
                
                <p class="text-body-1 text-grey-lighten-1 mb-6 mt-2">
                    Has guanyat més experiència i ets un pas més a prop de dominar la galàxia.
                </p>
                <v-btn color="cyan-accent-3" variant="flat" block rounded="xl" size="x-large" class="font-weight-bold text-black" @click="showLevelUpDialog = false">
                    CONTINUAR
                </v-btn>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script setup>
import { shallowRef, ref } from 'vue'; // Importamos 'ref' también
import { useAstroStore } from '@/stores/astroStore';

import WordConstruction from '@/components/games/WordConstruction.vue';
import SpelledRosco from '@/components/games/SpelledRosco.vue';
import RadarScan from '@/components/games/RadarScan.vue';

const astroStore = useAstroStore();
const activeGameComponent = shallowRef(null);

// Variables restauradas para el diálogo
const showLevelUpDialog = ref(false);
const newLevelData = ref({
    level: 0,
    rank: '',
    rankChanged: false
});

const levelSequence = [
    { name: 'Despegue', component: WordConstruction },
    { name: 'Navegación', component: RadarScan },
    { name: 'Comunicaciones', component: SpelledRosco },
    { name: 'Sistemas', component: WordConstruction },
    { name: 'Agujero Negro', component: RadarScan },
    { name: 'Exoplaneta', component: SpelledRosco },
];

const getLevelState = (index) => {
    const levelNum = index + 1;
    if (levelNum === astroStore.level) return 'current';
    if (levelNum < astroStore.level) return 'completed';
    return 'locked';
};

const handleLevelClick = (index) => {
    const state = getLevelState(index);
    if (state !== 'locked') {
        activeGameComponent.value = levelSequence[index].component;
    }
};

// Lógica restaurada de V1 con manejo de errores y respuesta del store
const handleGameOver = async (finalScore) => {
    if (astroStore.user) {
        try {
            // 1. Guardamos el rango anterior
            const previousRank = astroStore.rank; 

            // 2. Llamada al Store
            const result = await astroStore.registerCompletedGame(
                activeGameComponent.value.__name || 'Minijuego', // Fallback name
                finalScore
            );

            // 3. Manejo de errores explícito
            if (!result.success) throw new Error(result.message);

            // 4. Comprobamos si hubo subida de nivel (respuesta del backend)
            if (result.data.leveledUp) {
                newLevelData.value = {
                    level: result.data.newLevel,
                    rank: result.data.newRank,
                    rankChanged: previousRank !== result.data.newRank
                };
                showLevelUpDialog.value = true;
            }

        } catch (error) {
            console.error("❌ Error al registrar la partida:", error);
        }
    } else {
        console.warn("⚠️ Mode convidat: No s'ha guardat la puntuació.");
    }
    
    // Cerramos el juego para volver al mapa
    activeGameComponent.value = null;
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