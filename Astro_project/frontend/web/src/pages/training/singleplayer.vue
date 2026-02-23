<template>
    <v-container fluid class="fill-height bg-deep-purple-darken-4 py-10">
        <div v-if="!activeGameComponent" class="w-100 text-center mb-10">
            <h1 class="text-h2 font-weight-black tracking-wide text-white">MAPA ESTEL·LAR</h1>
            <p class="text-grey-lighten-1">Supera missions per desbloquejar nous sectors</p>
        </div>

        <div v-if="!activeGameComponent" class="levels-container">
            <div v-for="(game, index) in levelSequence" :key="index" class="level-wrapper">
                
                <div 
                    class="level-node"
                    :class="{ 
                        'locked': index + 1 > astroStore.level, 
                        'current': index + 1 === astroStore.level,
                        'completed': index + 1 < astroStore.level,
                        'zig': index % 2 === 0,
                        'zag': index % 2 !== 0
                    }"
                    @click="startSpecificLevel(index)"
                >
                    <v-icon v-if="index + 1 < astroStore.level" icon="mdi-check-bold" color="white"></v-icon>
                    <v-icon v-else-if="index + 1 > astroStore.level" icon="mdi-lock" color="grey-darken-1"></v-icon>
                    <span v-else class="text-h5 font-weight-bold">{{ index + 1 }}</span>
                    
                    <div class="level-label">{{ game.name }}</div>
                </div>

                <div v-if="index < levelSequence.length - 1" class="path-connector" :class="index % 2 === 0 ? 'to-left' : 'to-right'"></div>
            </div>
            
            <v-btn to="/" color="white" variant="text" class="mt-10">Tornar a la Base</v-btn>
        </div>

        <div v-else class="w-100 h-100 d-flex justify-center align-center">
            <component :is="activeGameComponent" @game-over="handleGameOver" />
        </div>

        </v-container>
</template>

<script setup>
import { shallowRef, computed } from 'vue';
import { useAstroStore } from '@/stores/astroStore';

// Importación de juegos
import WordConstruction from '@/components/games/WordConstruction.vue';
import SpelledRosco from '@/components/games/SpelledRosco.vue';
import RadarScan from '@/components/games/RadarScan.vue';

const astroStore = useAstroStore();
const activeGameComponent = shallowRef(null);

// Definición de la ruta: Cada índice es un nivel
const levelSequence = [
    { name: 'Construcció', component: WordConstruction }, // Nivel 1
    { name: 'Radar', component: RadarScan },             // Nivel 2
    { name: 'Rosco', component: SpelledRosco },           // Nivel 3
    { name: 'Missió 4', component: WordConstruction },    // Nivel 4
    { name: 'Missió Final', component: RadarScan },       // Nivel 5
];

const startSpecificLevel = (index) => {
    const levelNum = index + 1;
    
    // Solo permitimos jugar si es su nivel actual o uno ya superado
    if (levelNum <= astroStore.level) {
        activeGameComponent.value = levelSequence[index].component;
    } else {
        alert("🔒 Aquest sector encara està bloquejat!");
    }
};

const handleGameOver = async (finalScore) => {
    if (astroStore.user) {
        // Usamos tu acción existente del Store
        // El servidor ya debería encargarse de subir el nivel si la puntuación es suficiente
        await astroStore.registerCompletedGame(
            activeGameComponent.value.__name, 
            finalScore
        );
    }
    activeGameComponent.value = null;
};
</script>

<style scoped>
/* Fondo espacial más profundo y estático para evitar distracciones */
.bg-deep-purple-darken-4 {
    background: radial-gradient(circle at 50% 30%, #1a1f3c 0%, #0a0c1a 100%) !important;
}

.levels-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
    padding: 60px 0;
    gap: 25px; 
}

.level-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 120px;
    z-index: 10;
}

/* --- PLATAFORMAS HEXAGONALES (Más orgánicas y sólidas) --- */
.level-node {
    position: relative;
    width: 90px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 10;
    /* Efecto 3D simplificado: una sola sombra sólida para dar volumen */
    filter: drop-shadow(0 8px 0 rgba(0,0,0,0.2));
    transition: transform 0.2s ease;
}

/* Zig-Zag con distancias más amigables para el rastreo visual */
.level-node.zig { transform: translateX(-60px); }
.level-node.zag { transform: translateX(60px); }

/* Forma hexagonal con bordes ligeramente más definidos */
.level-node::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #e0e0e0;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    z-index: -1;
    border: 2px solid rgba(255,255,255,0.1);
}

/* Tipografía: Aumentamos el tracking y grosor para legibilidad */
.level-node .v-icon, .level-node span {
    z-index: 5;
    color: #2c3e50;
    font-size: 28px !important;
    font-weight: 700;
    font-family: 'Segoe UI', Roboto, sans-serif; /* Fuentes claras */
}

/* Etiquetas de texto (Sin reflejos y con fondo sutil para leer mejor) */
.level-label {
    position: absolute;
    bottom: -35px;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    text-align: center;
    letter-spacing: 0.5px;
    /* Eliminamos el efecto espejo y añadimos sombra suave de texto */
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    pointer-events: none;
}

/* --- ESTADOS --- */

/* 1. Completado (Azul sólido, no neón) */
.level-node.completed::before { 
    background: #3498db; 
    border-bottom: 6px solid #2980b9; /* Simula profundidad */
}
.level-node.completed .v-icon { color: white !important; }

/* 2. Actual (Resaltado con un borde, no con brillo excesivo) */
.level-node.current {
    filter: drop-shadow(0 0 12px rgba(132, 255, 255, 0.3));
}
.level-node.current::before { 
    background: #84ffff;
    border: 3px solid #00b0ff;
}
.level-node.current .v-icon, .level-node.current span { 
    color: #006064 !important; 
}

/* Animación muy lenta (4s) para evitar mareos */
.level-node.current.zig { animation: float-slow-zig 4s ease-in-out infinite; }
.level-node.current.zag { animation: float-slow-zag 4s ease-in-out infinite; }

/* 3. Bloqueado */
.level-node.locked {
    opacity: 0.8;
}
.level-node.locked::before { 
    background: #455a64; 
    border-bottom: 4px solid #263238;
}
.level-node.locked .v-icon { color: #90a4ae !important; }

/* --- CONECTORES (Caminos más gruesos y claros) --- */
.path-connector {
    position: absolute;
    width: 18px; /* Más ancho para que sea fácil de seguir */
    height: 100px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    z-index: 1;
    top: 40px;
}

/* Inclinaciones para los caminos */
.to-left { 
    left: calc(50% - 35px);
    transform: rotate(-35deg);
}
.to-right { 
    left: calc(50% + 35px);
    transform: rotate(35deg);
}

/* Camino bloqueado: guiones más grandes para evitar confusión visual */
.level-wrapper:has(.level-node.locked) .path-connector {
    background: transparent;
    border-left: 6px dashed rgba(255, 255, 255, 0.2);
    width: 0;
}

/* --- ANIMACIONES SUAVES --- */
@keyframes float-slow-zig {
    0%, 100% { transform: translate(-60px, 0px); }
    50% { transform: translate(-60px, -6px); }
}
@keyframes float-slow-zag {
    0%, 100% { transform: translate(60px, 0px); }
    50% { transform: translate(60px, -6px); }
}

/* Títulos con mejor espaciado entre letras */
.tracking-wide {
    letter-spacing: 2px; /* Reducido de 4px para que no se "rompa" la palabra */
    font-weight: 800;
    text-transform: uppercase;
}
</style>