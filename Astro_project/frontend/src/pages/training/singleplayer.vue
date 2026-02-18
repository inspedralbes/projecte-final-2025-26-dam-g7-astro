<template>
    <v-container fluid class="fill-height d-flex flex-column justify-center align-center">
        
        <!-- PANTALLA DE MENÚ (Si no hi ha joc actiu) -->
        <div v-if="!activeGameComponent" class="text-center w-100 d-flex flex-column align-center">
            <h1 class="text-h2 mb-6 font-weight-bold tracking-wide">Entrenament Individual</h1>
            <p class="text-h5 mb-10 text-grey-lighten-1">Prepara't per posar a prova les teves habilitats cognitives.</p>
            
            <div class="d-flex flex-column gap-4">
                <v-btn 
                    @click="startRandomGame" 
                    color="cyan-accent-3" 
                    size="x-large" 
                    rounded="xl" 
                    class="mb-4 px-10 elevation-10 font-weight-black"
                >
                    <v-icon start icon="mdi-play-circle-outline"></v-icon>
                    Iniciar Missió Aleatòria
                </v-btn>

                <v-btn to="/" color="grey-lighten-1" variant="text" rounded="xl">
                    Tornar al Pont de Comandament
                </v-btn>
            </div>
        </div>

        <!-- ÀREA DE JOC (Es carrega dinàmicament) -->
        <div v-else class="w-100 h-100 d-flex justify-center align-center">
            <!-- Component dinàmic: Aquí es carregarà el joc -->
            <component :is="activeGameComponent" @game-over="handleGameOver" />
        </div>

    </v-container>
</template>

<script setup>
import { ref, shallowRef } from 'vue';

// 1. Importem els jocs disponibles
// Nota: Fem servir shallowRef per components per rendiment
import WordConstruction from '@/components/games/WordConstruction.vue';

// 2. Llista de jocs (ara només un, però preparat per més)
const gamesList = [
    WordConstruction
];

const activeGameComponent = shallowRef(null);

// 3. Funció per triar un joc aleatori
const startRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * gamesList.length);
    activeGameComponent.value = gamesList[randomIndex];
};

// 4. Gestionar el final del joc
const handleGameOver = (finalScore) => {
    console.log(`Missió finalitzada. Puntuació: ${finalScore}`);
    
    // Aquí podries cridar a l'store per guardar la puntuació al backend via WebSocket
    // const astroStore = useAstroStore();
    // astroStore.sendScore(finalScore);

    activeGameComponent.value = null; // Tanca el joc i torna al menú
};

</script>

<style scoped>
.tracking-wide {
    letter-spacing: 2px;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>