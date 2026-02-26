<template>
    <v-container fluid class="space-map pa-0">

        <div v-if="!activeGameComponent" class="map-scroll-container">

            <div class="start-spacer"></div>

            <div class="path-container">
                <template v-for="(level, index) in levelSequence" :key="index">
                    
                    <div v-if="level.phaseTitle" class="phase-divider-wrapper mt-2 mb-4 w-100">
                        <div class="d-flex align-center w-100" :class="level.phaseAlign === 'right' ? 'flex-row-reverse' : 'flex-row'">
                            
                            <div class="phase-text-box" :class="level.phaseAlign === 'right' ? 'text-right' : 'text-left'">
                                <div class="text-overline text-cyan-accent-3 font-weight-bold tracking-widest">{{ level.phaseSubtitle }}</div>
                                <h2 class="text-h4 font-weight-black text-white text-uppercase glow-text">
                                    {{ level.phaseTitle }}
                                </h2>
                            </div>

                            <div class="flex-grow-1 px-4 px-md-8 d-flex align-center">
                                <v-divider class="border-cyan opacity-40"></v-divider>
                                <div class="phase-center-node mx-2"></div>
                                <v-divider class="border-cyan opacity-40"></v-divider>
                            </div>

                            <div class="phase-icon-box text-center">
                                <v-icon :icon="level.phaseIcon" size="90" class="phase-watermark"></v-icon>
                            </div>

                        </div>
                    </div>

                    <div class="path-row">
                        <div class="node-wrapper" :class="{
                            'pos-left': index % 2 === 0,
                            'pos-right': index % 2 !== 0
                        }">

                            <div v-if="index < levelSequence.length - 1 && !levelSequence[index + 1].phaseTitle" class="path-connector"
                                :class="{ 'connector-flip': index % 2 !== 0 }">
                                <svg viewBox="0 0 140 140">
                                    <path d="M 0 0 Q 20 70 140 140" class="connector-line"
                                        :class="{ 'line-active': index + 1 < astroStore.mapLevel }" />
                                </svg>
                            </div>

                            <div v-if="index + 1 <= astroStore.mapLevel" class="floating-label"
                                :class="getLevelState(index)">
                                {{ level.name }}
                            </div>

                            <div v-if="getLevelState(index) === 'current'" class="target-score-label">
                                Meta: {{ level.minScore }} pts
                            </div>

                            <button class="node-btn" :class="[
                                `state-${getLevelState(index)}`,
                                { 'is-interactive': index + 1 <= astroStore.mapLevel }
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
                </template>
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
                    Has acumulat un total de <span class="text-cyan-accent-3 font-weight-bold">{{ astroStore.xp }} XP</span>
                    i ets un pas més a prop de dominar la galàxia.
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
import { useAstroStore } from '@/stores/astroStore'; 

import WordConstruction from '@/components/games/WordConstruction.vue';
import SpelledRosco from '@/components/games/SpelledRosco.vue';
import RadarScan from '@/components/games/RadarScan.vue';
import RadioSignal from '@/components/games/RadioSignal.vue';
import RhymeSquad from '@/components/games/RhymeSquad.vue';
import SymmetryBreaker from '@/components/games/SymmetryBreaker.vue';

const astroStore = useAstroStore();
const activeGameComponent = shallowRef(null);
const currentPlayingIndex = ref(null); 

const showLevelUpDialog = ref(false);
const showFailDialog = ref(false);

const lastScore = ref(0);
const requiredScore = ref(0);

const newLevelData = ref({
    level: 1,
    rank: '',
    rankChanged: false
});

const levelSequence = [
    { name: 'Preparativos', component: WordConstruction, minScore: 100, phaseTitle: 'Entrenamiento', phaseSubtitle: 'Fase 1: La Tierra', phaseAlign: 'left', phaseIcon: 'mdi-earth' },
    { name: '¡Despegue!', component: RadarScan, minScore: 200 },
    { name: 'Rompiendo la Gravedad', component: RadioSignal, minScore: 350 },
    { name: 'Desacoplamiento Orbital', component: SpelledRosco, minScore: 500 },
    { name: 'Ruta Estelar', component: RhymeSquad, minScore: 750, phaseTitle: 'El Viaje Comienza', phaseSubtitle: 'Fase 2: Espacio Cercano', phaseAlign: 'right', phaseIcon: 'mdi-solar-system' },
    { name: 'Llamando a la Base', component: RadioSignal, minScore: 1000 },
    { name: 'Recarga Solar', component: SymmetryBreaker, minScore: 1250 },
    { name: 'Reparación Express', component: RadarScan, minScore: 1500 },
];

const getLevelState = (index) => {
    const levelNum = index + 1;
    const currentMap = astroStore.mapLevel || 1; 
    if (levelNum === currentMap) return 'current';
    if (levelNum < currentMap) return 'completed';
    return 'locked';
};

const handleLevelClick = (index) => {
    const state = getLevelState(index);
    if (state !== 'locked') {
        currentPlayingIndex.value = index;
        activeGameComponent.value = levelSequence[index].component;
    }
};

const handleGameOver = async (finalScore) => {
    const levelIndex = currentPlayingIndex.value;
    const gameName = levelSequence[levelIndex]?.name || 'Minijuego';

    activeGameComponent.value = null;
    lastScore.value = finalScore;

    if (astroStore.user && levelIndex !== null) {
        try {
            const levelConfig = levelSequence[levelIndex];

            if (levelConfig && finalScore < levelConfig.minScore) {
                requiredScore.value = levelConfig.minScore;
                showFailDialog.value = true;
                return;
            }

            const previousAccountLevel = astroStore.level;
            const currentMap = astroStore.mapLevel || 1;
            
            const nodeToComplete = (levelIndex + 1 === currentMap) ? currentMap : null;

            const result = await astroStore.registerCompletedGame(gameName, finalScore, nodeToComplete);

            if (!result.success) throw new Error(result.message);

            if (astroStore.level > previousAccountLevel) {
                newLevelData.value = {
                    level: astroStore.level,
                    rank: result.data.newRank || 'Explorador',
                    rankChanged: !!result.data.newRank
                };
                showLevelUpDialog.value = true;
            }

        } catch (error) {
            console.error("❌ Error al registrar la partida:", error);
        } finally {
            currentPlayingIndex.value = null;
        }
    }
};
</script>

<style scoped>
.space-map {
    height: 100vh;
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

.start-spacer { height: 80px; }
.end-spacer { height: 150px; }

.phase-divider-wrapper {
    position: relative;
    z-index: 10;
}

.phase-text-box {
    min-width: 280px;
    max-width: 350px;
}

.phase-icon-box {
    width: 120px;
}

.phase-watermark {
    color: #455a64;
    opacity: 0.3;
    filter: drop-shadow(0 0 15px rgba(0, 229, 255, 0.1));
    transition: all 0.5s ease;
}

.phase-divider-wrapper:hover .phase-watermark {
    opacity: 0.6;
    color: #00e5ff;
    transform: scale(1.1);
}

.phase-center-node {
    width: 12px;
    height: 12px;
    background: #00e5ff;
    border-radius: 50%;
    box-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff;
}

.tracking-widest { letter-spacing: 3px; }
.glow-text { text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
.border-cyan { border-color: #00e5ff !important; border-width: 1px; border-style: solid; }

.path-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
}

.path-row {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 140px;
    position: relative;
}

.node-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.pos-left { transform: translateX(-70px); }
.pos-right { transform: translateX(70px); }

.path-connector {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 140px;
    height: 140px;
    z-index: -1;
    pointer-events: none;
    transform-origin: top left;
}

.connector-flip { transform: scaleX(-1); }

svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}

.connector-line {
    fill: none;
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 8;
    stroke-dasharray: 12 10;
    stroke-linecap: round;
}

.line-active {
    stroke: #FFD54F;
    opacity: 0.6;
    animation: dash-flow 30s linear infinite;
}

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
    -webkit-tap-highlight-color: transparent;
}

.node-btn.is-interactive { cursor: pointer; }
.node-btn:active { transform: scale(0.92); }

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

.target-score-label {
    position: absolute; 
    bottom: -25px; 
    left: 50%; 
    transform: translateX(-50%); 
    background: rgba(0,0,0,0.6); 
    color: #00E5FF; 
    padding: 2px 6px; 
    border-radius: 4px; 
    font-size: 10px; 
    white-space: nowrap;
}

.floating-label {
    position: absolute;
    top: -45px;
    left: 50%;
    transform: translateX(-50%);
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

.state-current.floating-label { color: #00E5FF; border-color: rgba(0, 229, 255, 0.5); }
.state-completed.floating-label { color: #FFD54F; }

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

@keyframes dash-flow { to { stroke-dashoffset: -500; } }

@keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

.game-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
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

.fade-zoom-enter-active, .fade-zoom-leave-active { transition: all 0.3s ease; }
.fade-zoom-enter-from, .fade-zoom-leave-to { opacity: 0; transform: scale(0.95); }
</style>