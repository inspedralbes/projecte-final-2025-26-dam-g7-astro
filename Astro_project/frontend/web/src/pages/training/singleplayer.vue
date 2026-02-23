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
                    Tornar al Inici
                </v-btn>
            </div>
        </div>

        <!-- ÀREA DE JOC (Es carrega dinàmicament) -->
        <div v-else class="w-100 h-100 d-flex justify-center align-center">
            <!-- Component dinàmic: Aquí es carregarà el joc -->
            <component :is="activeGameComponent" @game-over="handleGameOver" />
        </div>
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
import { shallowRef } from 'vue';
import { useAstroStore } from '@/stores/astroStore'; // Importamos el store

import WordConstruction from '@/components/games/WordConstruction.vue';
import SpelledRosco from '@/components/games/SpelledRosco.vue';
import RadarScan from '@/components/games/RadarScan.vue';
//import SyllableQuest from '@/components/games/SyllableQuest.vue'; 

const astroStore = useAstroStore(); // Instanciamos la única fuente de verdad

const gamesList = [
    WordConstruction,
    SpelledRosco,
    RadarScan
    //SyllableQuest
];

const activeGameComponent = shallowRef(null);

const startRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * gamesList.length);
    activeGameComponent.value = gamesList[randomIndex];
};

const handleGameOver = async (finalScore) => {
    if (astroStore.user) {
        try {
            // 1. Guardem el rang antic per saber si l'hem de felicitar per l'ascens
            const previousRank = astroStore.rank; 

            // 2. CRIDA ÚNICA: Deleguem tota la feina bruta a l'Store
            const result = await astroStore.registerCompletedGame(
                activeGameComponent.value.__name || 'Minijuego', 
                finalScore
            );

            // 3. Gestionem errors
            if (!result.success) throw new Error(result.message);

            // 4. Llegim la resposta empaquetada que ens retorna l'Store
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
    
    // 5. Tanquem el joc immediatament perquè es vegi el menú (i el popup per sobre)
    activeGameComponent.value = null; 
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