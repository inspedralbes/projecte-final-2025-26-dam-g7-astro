<template>
    <v-container fluid class="fill-height bg-deep-purple-darken-4 pa-6 align-start">
        <v-row>
            
            <v-col cols="12" class="text-center mb-6">
                <h1 class="text-h3 font-weight-bold text-uppercase text-cyan-accent-3 mb-2">
                    Bazar Espacial
                </h1>
                <p class="text-body-1 text-grey-lighten-1">
                    Canjea tus créditos por mejoras y equipamiento
                </p>
            </v-col>

            <v-col cols="12" class="d-flex flex-column align-center justify-center mb-10">
                <v-card color="transparent" elevation="0" class="d-flex flex-column align-center">
                    <h2 class="text-h5 font-weight-bold mb-4 text-amber-accent-3">
                        <v-icon start icon="mdi-star-four-points" />
                        Suerte Diaria
                        <v-icon end icon="mdi-star-four-points" />
                    </h2>
                    
                    <LuckyWheel @win="handleWin" @update-balance="updateCoins" />

                    <div class="mt-4 px-4 py-2 rounded-pill bg-surface-variant d-flex align-center">
                        <span class="text-caption text-grey-lighten-1">
                            Coste de giro: <strong>50</strong>
                        </span>
                        <v-icon size="small" color="amber" class="ml-1">mdi-currency-usd</v-icon>
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12">
                <div class="d-flex justify-space-between align-center mb-6 px-4">
                    <h3 class="text-h4 font-weight-bold">Mejoras Disponibles</h3>
                    
                    <v-chip color="amber" variant="flat" size="x-large" class="font-weight-bold">
                        <v-icon start size="large">mdi-currency-usd</v-icon>
                        {{ userCoins }}
                    </v-chip>
                </div>

                <v-row>
                    <v-col v-for="item in shopItems" :key="item.id" cols="12" sm="6" md="4">
                        <v-card 
                            class="mx-auto item-card rounded-xl" 
                            color="grey-darken-4" 
                            elevation="6"
                            max-width="400"
                        >
                            <div class="pt-6 text-center">
                                <v-avatar size="100" :color="item.bgColor || 'grey-darken-3'">
                                    <v-icon size="60" :color="item.color">{{ item.icon }}</v-icon>
                                </v-avatar>
                            </div>

                            <v-card-title class="text-center text-h5 font-weight-bold mt-2">
                                {{ item.name }}
                            </v-card-title>

                            <v-card-text class="text-center text-grey-lighten-1 pb-0" style="min-height: 60px;">
                                {{ item.desc }}
                            </v-card-text>

                            <v-card-actions class="justify-center pa-6">
                                <v-btn 
                                    block 
                                    size="large" 
                                    :color="userCoins >= item.price ? 'cyan-accent-3' : 'grey'" 
                                    variant="elevated"
                                    class="font-weight-bold text-black"
                                    :disabled="userCoins < item.price"
                                >
                                    {{ item.price }} 
                                    <v-icon end>mdi-currency-usd</v-icon>
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-dialog v-model="showWinDialog" max-width="400" persistent>
            <v-card class="text-center pa-8 rounded-xl bg-grey-darken-4 border-cyan">
                <div class="mb-4">
                    <v-icon size="100" :color="lastPrize?.color || 'white'" class="animate-bounce">
                        {{ lastPrize?.icon }}
                    </v-icon>
                </div>
                <h3 class="text-h4 font-weight-bold mb-2 text-white">¡CONSEGUIDO!</h3>
                <p class="text-h5 text-cyan-accent-3 mb-6">{{ lastPrize?.label }}</p>
                
                <v-btn 
                    color="cyan-accent-3" 
                    size="x-large" 
                    block 
                    rounded="xl"
                    class="font-weight-bold text-black"
                    @click="showWinDialog = false"
                >
                    Recoger Recompensa
                </v-btn>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LuckyWheel from '../../components/shop/LuckyWheel.vue';

// ESTADO
const userCoins = ref(0); // Empezamos en 0 para no engañar visualmente
const showWinDialog = ref(false);
const lastPrize = ref(null);
const currentUser = "JOEL"; // Esto debería venir de tu sistema de auth (Pinia/LocalStorage)

// ITEMS DE TIENDA (Configuración visual)
const shopItems = [
    { 
        id: 1, 
        name: 'Pack de Vidas', 
        price: 200, 
        icon: 'mdi-heart-multiple', 
        color: 'red-accent-2',
        bgColor: 'red-darken-4',
        desc: 'Recupera 5 vidas inmediatamente para seguir la misión.' 
    },
    { 
        id: 2, 
        name: 'Congelar Racha', 
        price: 500, 
        icon: 'mdi-snowflake', 
        color: 'cyan-accent-2', 
        bgColor: 'cyan-darken-4',
        desc: 'Protege tu racha de aprendizaje un día si no juegas.' 
    },
    { 
        id: 3, 
        name: 'Modo Oscuro Pro', 
        price: 1000, 
        icon: 'mdi-theme-light-dark', 
        color: 'purple-accent-2', 
        bgColor: 'purple-darken-4',
        desc: 'Desbloquea temas de alto contraste exclusivos.' 
    },
];

// LÓGICA DE CARGA INICIAL
onMounted(async () => {
    await fetchUserBalance();
});

async function fetchUserBalance() {
    try {
        // Consultamos al puerto 3000 (Backend)
        const res = await fetch(`http://localhost:3000/api/shop/balance/${currentUser}`);
        if (res.ok) {
            const data = await res.json();
            userCoins.value = data.coins;
        }
    } catch (e) {
        console.error("Error conectando con el banco espacial:", e);
    }
}

// EVENTOS DE LA RULETA
const handleWin = (prize) => {
    lastPrize.value = prize;
    showWinDialog.value = true;
};

const updateCoins = (newBalance) => {
    // Actualizamos con el dato real que viene del servidor tras el giro
    userCoins.value = newBalance;
};
</script>

<style scoped>
.item-card {
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s;
    border: 1px solid rgba(255,255,255,0.05);
}

.item-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 30px rgba(0, 229, 255, 0.15) !important; /* Brillo cyan */
    border-color: #00e5ff;
}

.border-cyan {
    border: 2px solid #00e5ff;
}

/* Animación simple de rebote para el icono de victoria */
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}
.animate-bounce {
    animation: bounce 2s infinite;
}
</style>