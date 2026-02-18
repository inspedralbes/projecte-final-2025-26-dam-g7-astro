<template>
    <v-container fluid class="fill-height bg-deep-purple-darken-4 pa-0">
        <v-row no-gutters class="fill-height">
            
            <v-col cols="12" md="5" class="d-flex flex-column align-center justify-center bg-surface-variant">
                <h2 class="text-h4 font-weight-bold mb-6 text-uppercase text-cyan-accent-3">
                    Suerte Diaria
                </h2>
                <LuckyWheel @win="handleWin" @update-balance="updateCoins" />
                
                <p class="mt-4 text-caption text-grey-lighten-1" style="max-width: 300px; text-align: center;">
                    *Los premios pueden incluir pines exclusivos o ventajas de accesibilidad.
                </p>
            </v-col>

            <v-col cols="12" md="7" class="pa-8">
                <div class="d-flex justify-space-between align-center mb-8">
                    <h1 class="text-h3 font-weight-bold">Bazar Espacial</h1>
                    <v-chip color="amber" variant="elevated" size="large">
                        <v-icon start>mdi-currency-usd</v-icon>
                        {{ userCoins }} Monedas
                    </v-chip>
                </div>

                <v-row>
                    <v-col v-for="item in shopItems" :key="item.id" cols="12" sm="6" lg="4">
                        <v-card color="grey-darken-3" elevation="4" class="h-100 item-card">
                            <div class="d-flex justify-center pa-4 bg-grey-darken-4">
                                <v-icon size="64" :color="item.color">{{ item.icon }}</v-icon>
                            </div>
                            <v-card-title class="text-h6">{{ item.name }}</v-card-title>
                            <v-card-text class="text-body-2 text-grey-lighten-1">
                                {{ item.desc }}
                            </v-card-text>
                            <v-card-actions>
                                <v-btn block color="cyan-accent-3" variant="tonal">
                                    Comprar ({{ item.price }})
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-dialog v-model="showWinDialog" max-width="400">
            <v-card class="text-center pa-6">
                <v-icon size="80" color="success" class="mb-4">{{ lastPrize?.icon }}</v-icon>
                <h3 class="text-h4 font-weight-bold mb-2">¡Conseguido!</h3>
                <p class="text-h6">{{ lastPrize?.label }}</p>
                <v-card-actions class="justify-center mt-4">
                    <v-btn color="primary" variant="flat" @click="showWinDialog = false">Genial</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref } from 'vue';
import LuckyWheel from '@/components/shop/LuckyWheel.vue';

const userCoins = ref(1250); // Valor temporal (debería cargar del perfil real)
const showWinDialog = ref(false);
const lastPrize = ref(null);

const shopItems = [
    { id: 1, name: 'Pack de Vidas', price: 200, icon: 'mdi-heart-multiple', color: 'red', desc: 'Recupera 5 vidas inmediatamente.' },
    { id: 2, name: 'Congelar Racha', price: 500, icon: 'mdi-snowflake', color: 'cyan', desc: 'Protege tu racha un día si no juegas.' },
    { id: 3, name: 'Modo Oscuro Pro', price: 1000, icon: 'mdi-theme-light-dark', color: 'purple', desc: 'Desbloquea temas de alto contraste.' },
];

const handleWin = (prize) => {
    lastPrize.value = prize;
    showWinDialog.value = true;
};

// Actualiza las monedas visualmente tras el giro
const updateCoins = (newBalance) => {
    userCoins.value = newBalance;
};
</script>

<style scoped>
.item-card {
    transition: transform 0.2s;
}
.item-card:hover {
    transform: translateY(-5px);
    border: 1px solid #00e5ff;
}
</style>