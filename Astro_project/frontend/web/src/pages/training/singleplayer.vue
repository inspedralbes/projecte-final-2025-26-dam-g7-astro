<template>
    <v-container fluid class="space-map pa-0">

        <div v-if="!activeGameComponent" class="map-scroll-container" @click="activePreviewIndex = null">

            <div class="start-spacer"></div>

            <div class="path-container">
                <template v-for="(level, index) in levelSequence" :key="index">
                    
                    <div v-if="level.phaseTitleKey" class="phase-divider-wrapper mt-2 mb-4 w-100">
                        <div class="d-flex align-center w-100" :class="level.phaseAlign === 'right' ? 'flex-row-reverse' : 'flex-row'">
                            
                            <div class="phase-text-box" :class="level.phaseAlign === 'right' ? 'text-right' : 'text-left'">
                                <div class="text-overline text-cyan-accent-3 font-weight-bold tracking-widest">{{ $t(level.phaseSubtitleKey) }}</div>
                                <h2 class="text-h4 font-weight-black text-white text-uppercase glow-text">
                                    {{ $t(level.phaseTitleKey) }}
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

                            <div v-if="index < levelSequence.length - 1 && !levelSequence[index + 1].phaseTitleKey" class="path-connector"
                                :class="{ 'connector-flip': index % 2 !== 0 }">
                                <svg viewBox="0 0 140 140">
                                    <path d="M 0 0 Q 20 70 140 140" class="connector-line"
                                        :class="{ 'line-active': index + 1 < astroStore.mapLevel }" />
                                </svg>
                            </div>

                            <div v-if="index + 1 <= astroStore.mapLevel" class="floating-label"
                                :class="getLevelState(index)">
                                {{ $t(level.nameKey) }}
                            </div>

                            <div v-if="getLevelState(index) === 'current'" class="target-score-label">
                                {{ $t('singleplayer.goal', { score: level.minScore }) }}
                            </div>

                            <button class="node-btn" :class="[
                                `state-${getLevelState(index)}`,
                                { 'is-interactive': index + 1 <= astroStore.mapLevel }
                            ]" @click.stop="handleLevelClick(index)" v-ripple>
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

                            <!-- Viñeta de Previsualización -->
                            <transition name="pop-in">
                                <div v-if="activePreviewIndex === index" 
                                    class="level-preview-card" 
                                    :class="index % 2 === 0 ? 'preview-left' : 'preview-right'"
                                    @click.stop>
                                    <div class="preview-gif-container">
                                        <img :src="level.previewGif || '/previews/placeholder.gif'" alt="Preview" class="preview-gif">
                                        <div class="preview-overlay">
                                            <div class="preview-badge">{{ level.minScore }} pts</div>
                                        </div>
                                    </div>
                                    <div class="preview-content">
                                        <h3 class="preview-title">{{ $t(level.nameKey) }}</h3>
                                        <v-btn
                                            color="cyan-accent-3"
                                            class="play-btn-preview font-weight-black"
                                            block
                                            rounded="lg"
                                            elevation="8"
                                            @click.stop="startGame(index)"
                                        >
                                            <v-icon icon="mdi-play" start></v-icon>
                                            {{ $t('singleplayer.start_simple') }}
                                        </v-btn>
                                    </div>
                                    <div class="preview-arrow"></div>
                                </div>
                            </transition>

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

        <v-dialog v-model="showLevelUpDialog" max-width="450" persistent z-index="200">
            <v-card class="text-center pa-8 rounded-xl elevation-24" 
                style="background: #020617; border: 2px solid #00e5ff; box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);">
                
                <div class="glow-icon-wrapper mb-4">
                    <v-icon icon="mdi-chevron-double-up" color="cyan-accent-3" size="90" class="animate-bounce"></v-icon>
                </div>

                <h2 class="text-h3 font-weight-black text-cyan-accent-3 mb-2 tracking-tighter">
                    {{ $t('singleplayer.level_up', { level: newLevelData.level }) }}
                </h2>

                <div v-if="newLevelData.rankChanged" class="my-5 pa-4 rounded-lg"
                    style="background: rgba(0, 229, 255, 0.05); border: 1px dashed #00e5ff;">
                    <div class="text-overline text-grey-lighten-1">{{ $t('singleplayer.new_rank') }}</div>
                    <div class="text-h5 font-weight-bold text-white">{{ newLevelData.rank }}</div>
                </div>

                <p class="text-body-1 text-blue-grey-lighten-3 mb-8">
                    {{ $t('singleplayer.accumulated_xp', { xp: astroStore.xp }) }}
                </p>
                
                <v-btn color="cyan-accent-3" variant="elevated" block rounded="xl" size="x-large"
                    class="font-weight-black text-black" @click="showLevelUpDialog = false">
                    {{ $t('singleplayer.continue') }}
                </v-btn>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showFailDialog" max-width="400" persistent z-index="200">
            <v-card class="text-center pa-8 rounded-xl elevation-24" 
                style="background: #0f0505; border: 2px solid #ff5252; box-shadow: 0 0 30px rgba(255, 82, 82, 0.2);">
                
                <v-icon icon="mdi-alert-octagon" color="red-accent-2" size="80" class="mb-4 pulse-red"></v-icon>

                <h2 class="text-h4 font-weight-black text-white mb-2 uppercase">{{ $t('singleplayer.almost_there') }}</h2>

                <div class="py-4">
                    <div class="text-overline text-red-accent-1">{{ $t('singleplayer.obtained') }}</div>
                    <div class="text-h2 font-weight-black text-white mb-4">{{ lastScore }}</div>

                    <v-divider class="border-red-accent-2 opacity-30 mb-6"></v-divider>

                    <p class="text-body-1 text-blue-grey-lighten-2">
                        {{ $t('singleplayer.need', { score: requiredScore }) }}
                    </p>
                </div>

                <v-btn color="red-accent-2" variant="flat" block rounded="xl" size="x-large"
                    class="font-weight-bold text-white mt-4" @click="showFailDialog = false" 
                    style="background: linear-gradient(45deg, #ff5252, #b71c1c) !important;">
                    {{ $t('singleplayer.retry') }}
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
const activePreviewIndex = ref(null);

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
    { id: 'word-construction', nameKey: 'singleplayerLevels.preparativos', component: WordConstruction, minScore: 100, phaseTitleKey: 'singleplayerLevels.fase1Title', phaseSubtitleKey: 'singleplayerLevels.fase1Subtitle', phaseAlign: 'left', phaseIcon: 'mdi-earth', previewGif: '/previews/word-construction.gif' },
    { id: 'radar-scan', nameKey: 'singleplayerLevels.despegue', component: RadarScan, minScore: 200, previewGif: '/previews/radar-scan.gif' },
    { id: 'radio-signal', nameKey: 'singleplayerLevels.gravedad', component: RadioSignal, minScore: 350, previewGif: '/previews/radio-signal.gif' },
    { id: 'spelled-rosco', nameKey: 'singleplayerLevels.desacoplamiento', component: SpelledRosco, minScore: 500, previewGif: '/previews/spelled-rosco.gif' },
    { id: 'rhyme-squad', nameKey: 'singleplayerLevels.ruta', component: RhymeSquad, minScore: 750, phaseTitleKey: 'singleplayerLevels.fase2Title', phaseSubtitleKey: 'singleplayerLevels.fase2Subtitle', phaseAlign: 'right', phaseIcon: 'mdi-solar-system', previewGif: '/previews/rhyme-squad.gif' },
    { id: 'radio-signal', nameKey: 'singleplayerLevels.base', component: RadioSignal, minScore: 1000, previewGif: '/previews/radio-signal-2.gif' },
    { id: 'symmetry-breaker', nameKey: 'singleplayerLevels.recarga', component: SymmetryBreaker, minScore: 1250, previewGif: '/previews/symmetry-breaker.gif' },
    { id: 'radar-scan', nameKey: 'singleplayerLevels.reparacion', component: RadarScan, minScore: 1500, previewGif: '/previews/radar-scan-2.gif' },
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
        if (activePreviewIndex.value === index) {
            activePreviewIndex.value = null;
        } else {
            activePreviewIndex.value = index;
        }
    }
};

const startGame = (index) => {
    activePreviewIndex.value = null;
    currentPlayingIndex.value = index;
    activeGameComponent.value = levelSequence[index].component;
};

const handleGameOver = async (finalScore) => {
    const levelIndex = currentPlayingIndex.value;
    const gameName = levelSequence[levelIndex]?.id || 'Minijuego';

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

/* --- NUEVAS ANIMACIONES PARA LOS DIÁLOGOS --- */

.animate-bounce {
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
    40% {transform: translateY(-20px);}
    60% {transform: translateY(-10px);}
}

.pulse-red {
    animation: pulse-red-effect 2s infinite;
}

@keyframes pulse-red-effect {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
}

.tracking-tighter {
    letter-spacing: -1px !important;
}

.uppercase {
    text-transform: uppercase;
}

.v-divider {
    opacity: 0.2 !important;
}

/* --- ESTILOS DE LA VIÑETA DE PREVISUALIZACIÓN --- */

.level-preview-card {
    position: absolute;
    top: 50%;
    width: 240px;
    background: linear-gradient(165deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 20px;
    box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.7),
        0 0 20px rgba(0, 229, 255, 0.1),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
    z-index: 100;
    overflow: visible;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
}

.level-preview-card:hover {
    border-color: rgba(0, 229, 255, 0.5);
    box-shadow: 
        0 30px 60px -12px rgba(0, 0, 0, 0.8),
        0 0 30px rgba(0, 229, 255, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.15);
}

.preview-left {
    right: 100px;
    transform: translateY(-50%);
}

.preview-right {
    left: 100px;
    transform: translateY(-50%);
}

.preview-gif-container {
    width: 100%;
    height: 120px;
    position: relative;
    border-radius: 14px 14px 0 0;
    overflow: hidden;
    background: #000;
}

.preview-gif {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.level-preview-card:hover .preview-gif {
    transform: scale(1.05);
}

.preview-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent);
}

.preview-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 229, 255, 0.15);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 229, 255, 0.4);
    color: #00e5ff;
    padding: 3px 10px;
    border-radius: 30px;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
}

.preview-content {
    padding: 16px;
    text-align: center;
}

.preview-title {
    font-size: 1rem;
    font-weight: 900;
    color: white;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    line-height: 1.2;
}

.play-btn-preview {
    text-transform: none;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(90deg, #00e5ff 0%, #00b8d4 100%) !important;
}

.play-btn-preview:hover {
    transform: scale(1.02) translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 229, 255, 0.3);
    filter: brightness(1.1);
}

.preview-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
}

.preview-left .preview-arrow {
    right: -10px;
    border-left: 10px solid rgba(15, 23, 42, 0.85);
}

.preview-right .preview-arrow {
    left: -10px;
    border-right: 10px solid rgba(15, 23, 42, 0.85);
}

/* ANIMACIÓN POP-IN */
.pop-in-enter-active {
    animation: pop-in-kf 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop-in-leave-active {
    animation: pop-in-kf 0.2s reverse ease-in;
}

@keyframes pop-in-kf {
    0% {
        opacity: 0;
        transform: translateY(-50%) scale(0.5);
    }
    100% {
        opacity: 1;
        transform: translateY(-50%) scale(1);
    }
}
</style>