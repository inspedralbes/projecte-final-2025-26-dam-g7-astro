<template>
    <div class="scroll-container space-background">
        <v-container fluid class="pa-4 pa-md-6 content-wrapper">
            <v-row justify="center">

                <v-col cols="12" class="text-center mt-2 mb-6">
                    <h1 class="text-h3 font-weight-bold text-uppercase text-cyan-accent-3 glow-text">
                        Bazar Espacial
                    </h1>
                    <p class="text-subtitle-1 text-grey-lighten-1 mt-2">
                        Mejora tu equipamiento para la misión
                    </p>
                </v-col>

                <v-col cols="12" md="6" class="mb-10 mx-auto">
                    <div class="px-8 py-6 rounded-xl balance-pill d-flex align-center justify-center text-center w-100 elevation-10" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(0, 229, 255, 0.2);">
                        <div class="flex-grow-1">
                            <span class="text-subtitle-1 text-grey-lighten-1 block text-uppercase mb-2">Saldo de la cuenta</span>
                            <div class="d-flex align-center justify-center">
                                <span class="text-h2 font-weight-black text-amber-accent-3 mr-3" style="text-shadow: 0 0 25px rgba(255, 193, 7, 0.6);">{{ userCoins }}</span>
                                <v-icon color="amber-accent-3" size="70">mdi-currency-usd</v-icon>
                            </div>
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" max-width="1200">
                    <div class="d-flex align-center mb-6 px-2">
                        <v-icon color="cyan-accent-3" class="mr-3">mdi-cube-outline</v-icon>
                        <h3 class="text-h5 font-weight-bold text-white">Suministros Básicos</h3>
                        <v-divider class="ml-4 border-cyan opacity-50"></v-divider>
                    </div>

                    <v-row class="px-2 mb-10">
                        <v-col v-for="item in basicItems" :key="item.id" cols="12" md="6">
                            <v-card class="mx-auto item-card rounded-xl pa-4 d-flex align-center" color="#1e293b">
                                <div class="d-flex align-center flex-grow-1 mr-4" style="min-width: 0;">
                                    <v-avatar size="50" :color="item.bgColor || 'rgba(0, 229, 255, 0.1)'"
                                        class="mr-3 flex-shrink-0">
                                        <v-icon size="24" :color="item.color">{{ item.icon }}</v-icon>
                                    </v-avatar>

                                    <div class="text-truncate">
                                        <div class="text-subtitle-1 font-weight-bold text-white text-truncate">{{
                                            item.name }}</div>
                                        <div class="text-caption text-grey-lighten-2 text-truncate"
                                            style="line-height: 1.2;">
                                            {{ item.desc }}
                                        </div>
                                        <div v-if="item.limitacio" class="text-cyan-accent-1 font-weight-bold"
                                            style="font-size: 0.65rem !important;">
                                            {{ item.limitacio }}
                                        </div>
                                        <div class="text-caption text-grey mt-1">
                                            Unidades: <strong>x{{ getItemQuantity(item.id) }}</strong> / 99
                                        </div>
                                    </div>
                                </div>

                                <div style="min-width: 120px;">
                                    <v-btn block height="44"
                                        :color="hasReachedMax(item.id) ? 'grey-darken-2' : (userCoins >= item.price ? 'amber-accent-3' : 'grey-darken-3')"
                                        :variant="hasReachedMax(item.id) ? 'outlined' : 'flat'"
                                        class="font-weight-bold rounded-lg text-black"
                                        :disabled="userCoins < item.price || hasReachedMax(item.id)"
                                        @click="buyProduct(item)">
                                        <template v-if="hasReachedMax(item.id)">
                                            MAX 99
                                        </template>
                                        <template v-else>
                                            {{ item.price }} <v-icon end size="x-small">mdi-currency-usd</v-icon>
                                        </template>
                                    </v-btn>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-col>

                <v-col cols="12" max-width="1200" class="pb-16">
                    <div class="d-flex align-center mb-8 px-2">
                        <v-icon color="amber-accent-3" class="mr-3">mdi-crown-outline</v-icon>
                        <h3 class="text-h5 font-weight-bold text-white">Colección de Élite</h3>
                        <v-divider class="ml-4 border-amber opacity-50"></v-divider>
                    </div>

                    <v-row class="px-2">
                        <v-col v-for="item in premiumItems" :key="item.id" cols="12" sm="6" md="3">
                            <v-card class="mx-auto item-card premium-card rounded-xl pt-6 pb-4" color="#1e293b"
                                elevation="6">
                                <div class="text-center mb-4">
                                    <v-avatar size="80" :color="item.bgColor || 'rgba(255, 193, 7, 0.15)'"
                                        class="elevation-4">
                                        <v-icon size="40" :color="item.color">{{ item.icon }}</v-icon>
                                    </v-avatar>
                                </div>
                                <v-card-title class="text-subtitle-1 font-weight-bold text-center text-white pt-0">
                                    {{ item.name }}
                                </v-card-title>
                                <div class="text-center text-caption text-grey mb-2">
                                    Unidades: <strong>x{{ getItemQuantity(item.id) }}</strong>
                                </div>
                                <v-card-actions class="justify-center px-4 pb-2">
                                    <v-btn block height="40"
                                        :color="isOwned(item.id) ? 'success' : (userCoins >= item.price ? 'amber-accent-3' : 'grey')"
                                        :variant="isOwned(item.id) ? 'tonal' : (userCoins >= item.price ? 'flat' : 'outlined')"
                                        class="font-weight-bold rounded-lg text-black"
                                        :disabled="(userCoins < item.price && !isOwned(item.id)) || isOwned(item.id)"
                                        @click="buyProduct(item)">
                                        <template v-if="isOwned(item.id)">
                                            ADQUIRIDO <v-icon end>mdi-check</v-icon>
                                        </template>
                                        <template v-else>
                                            {{ item.price }} <v-icon end size="small">mdi-currency-usd</v-icon>
                                        </template>
                                    </v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-col>

            </v-row>


        </v-container>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAstroStore } from '@/stores/astroStore';

const astroStore = useAstroStore();
const userCoins = computed(() => astroStore.coins);
const userGames = computed(() => astroStore.partides);
const userStreak = computed(() => astroStore.streak);
const isStreakActiveToday = computed(() => astroStore.isStreakActiveToday);

const updateStats = (data) => {
    astroStore.setCoins(data.coins);
};

const getItemQuantity = (itemId) => {
    const targetId = Number(itemId);
    const found = astroStore.inventory?.find((item) => Number(item.id) === targetId);
    return Number(found?.quantity) || 0;
};

const isOwned = (itemId) => {
    return getItemQuantity(itemId) > 0;
};

const hasReachedMax = (itemId) => {
    return getItemQuantity(itemId) >= 99;
};

const buyProduct = async (item) => {
    const quantity = getItemQuantity(item.id);
    if (item.cat !== 'items' && quantity > 0) {
        alert(`¡Ya tienes ${item.name} en tu inventario!`);
        return;
    }

    if (item.cat === 'items' && quantity >= 99) {
        alert(`Has alcanzado el máximo de 99 unidades para ${item.name}.`);
        return;
    }

    if (!confirm(`¿Quieres comprar ${item.name} por ${item.price} créditos?`)) return;

    try {
        const result = await astroStore.buyItem(item);
        if (result.success) {
            console.log("Compra exitosa");
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error en la tienda:", error);
    }
};

const basicItems = ref([
    { id: 1, name: 'Pack de Vidas', cat: 'items', price: 200, icon: 'mdi-heart-multiple', color: 'red-accent-2', desc: 'Recupera 5 vidas inmediatamente.', bgColor: 'rgba(255, 82, 82, 0.1)' },
    { id: 2, name: 'Congelar Racha', cat: 'items', price: 500, icon: 'mdi-snowflake', color: 'cyan-accent-2', desc: 'Protege tu racha un día.', bgColor: 'rgba(24, 255, 255, 0.1)' },
    { id: 3, name: 'Doble de Monedas', cat: 'items', price: 300, icon: 'mdi-piggy-bank', color: 'yellow-accent-3', desc: 'Multiplica x2 las monedas ganadas.', limitacio: '* Solo válido durante 3 partidas', bgColor: 'rgba(255, 213, 79, 0.1)' },
    { id: 4, name: 'Doble Puntuación', cat: 'items', price: 300, icon: 'mdi-star-shooting', color: 'orange-accent-3', desc: 'Multiplica x2 los puntos obtenidos.', limitacio: '* Solo válido durante 3 partidas', bgColor: 'rgba(255, 152, 0, 0.1)' }
]);

const premiumItems = ref([
    { id: 101, name: 'Pin Comandante', cat: 'skin', price: 2500, icon: 'mdi-medal', color: 'amber-accent-3', desc: 'Insignia dorada.', bgColor: 'rgba(255, 193, 7, 0.15)' },
    { id: 102, name: 'Skin Cyberpunk', cat: 'skin', price: 5000, icon: 'mdi-robot', color: 'purple-accent-3', desc: 'Aspecto robótico.', bgColor: 'rgba(224, 64, 251, 0.15)' },
    { id: 103, name: 'Mascota Dron', cat: 'pets', price: 3500, icon: 'mdi-quadcopter', color: 'green-accent-3', desc: 'Un compañero fiel.', bgColor: 'rgba(0, 230, 118, 0.15)' },
    { id: 104, name: 'Rastro de Neón', cat: 'trails', price: 1500, icon: 'mdi-creation', color: 'pink-accent-3', desc: 'Efectos visuales.', bgColor: 'rgba(255, 64, 129, 0.15)' }
]);

onMounted(async () => {
    if (astroStore.user) {
        await Promise.all([astroStore.fetchUserBalance(), astroStore.fetchUserInventory()]);
    }
});


</script>

<style scoped>

.animate-bounce-slow { animation: bounce 3s infinite ease-in-out; }

.shadow-glow { box-shadow: 0 0 20px rgba(0, 230, 118, 0.4) !important; }

.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background-color: #0b1120 !important;
}

.item-card {
    background-color: #1e293b !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;
}

.item-card:hover {
    transform: translateY(-5px);
    border-color: #00e5ff;
    box-shadow: 0 10px 30px rgba(0, 229, 255, 0.15) !important;
}

.premium-card:hover {
    border-color: #ffc107;
    box-shadow: 0 10px 30px rgba(255, 193, 7, 0.2) !important;
}

.glow-text {
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
}

.balance-pill {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.border-cyan {
    border-color: #00e5ff !important;
}

.border-amber {
    border-color: #ffc107 !important;
}

.bg-slate-900 {
    background-color: #0f172a !important;
}

@keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.animate-bounce {
    animation: bounce 2s infinite ease-in-out;
}

.drop-shadow {
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
}
</style>
