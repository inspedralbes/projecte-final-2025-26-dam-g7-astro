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

    </v-container>
</template>

<script setup>
import { shallowRef } from 'vue';
import { useAstroStore } from '@/stores/astroStore'; // Importamos el store

import WordConstruction from '@/components/games/WordConstruction.vue';
import SpelledRosco from '@/components/games/SpelledRosco.vue';
import RadarScan from '@/components/games/RadarScan.vue';
import SyllableQuest from '@/components/games/SyllableQuest.vue'; 

const astroStore = useAstroStore(); // Instanciamos la única fuente de verdad

const gamesList = [
    WordConstruction,
    SpelledRosco,
    RadarScan,
    SyllableQuest
];

const activeGameComponent = shallowRef(null);

const startRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * gamesList.length);
    activeGameComponent.value = gamesList[randomIndex];
};

const handleGameOver = async (finalScore) => {
    console.log(`Missió finalitzada. Puntuació: ${finalScore}`);
    
    // Si hay un usuario logueado, enviamos la puntuación al servidor
    if (astroStore.user) {
        try {
            const response = await fetch('http://localhost:3000/api/games/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user: astroStore.user, 
                    game: activeGameComponent.value.__name || 'Minijuego',
                    score: finalScore 
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Error al registrar la partida");
            }

            // ACTUALIZAMOS LA FUENTE DE VERDAD: Esto hará que tu RightSidebar 
            // y tu Tienda se actualicen visualmente al instante gracias a la reactividad.
            astroStore.coins = data.newBalance;
            
            console.log(`Has ganado ${data.coinsEarned} monedas. Nuevo saldo: ${data.newBalance}`);

        } catch (error) {
            console.error("❌ Error de comunicación con la base de datos:", error);
        }
    } else {
        console.warn("No hay usuario logueado. La puntuación no se ha guardado.");
    }

    // Cerramos el juego y volvemos al menú
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