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

                <v-col cols="12" max-width="1200" class="mb-12">
                    <div class="wheel-card pa-6 pa-md-10 rounded-xl elevation-10 w-100 mx-auto">
                        <v-row class="align-center w-100 mx-0">
                            
                            <v-col cols="12" md="6" class="d-flex justify-center position-relative py-8">
                                <div class="nebula-bg"></div>
                                <LuckyWheel 
                                    ref="luckyWheelRef" 
                                    :user="astroStore.user" 
                                    @win="handleWin" 
                                    @update-balance="updateCoins" 
                                    @spin-start="isSpinning = true"
                                    @spin-end="isSpinning = false"
                                />
                            </v-col>

                            <v-col cols="12" md="6" class="d-flex flex-column justify-center pl-md-10 mt-6 mt-md-0">
                                <div class="d-flex align-center mb-4 justify-center justify-md-start">
                                    <v-icon color="purple-accent-3" class="mr-3" size="x-large">mdi-black-hole</v-icon>
                                    <h2 class="text-h3 font-weight-black text-white text-uppercase" style="letter-spacing: 2px;">Vòrtex Quàntic</h2>
                                </div>
                                
                                <p class="text-body-1 text-grey-lighten-1 mb-8 text-center text-md-left">
                                    Gira el vòrtex per obtenir subministraments únics, monedes o aspectes èpics. La sort afavoreix als audaços.
                                </p>

                                <div class="d-flex flex-column gap-4 w-100 px-4 px-md-0">
                                    <v-btn 
                                        color="cyan-accent-3" 
                                        size="x-large" 
                                        rounded="xl" 
                                        class="font-weight-black text-black w-100 mb-4"
                                        elevation="8"
                                        :loading="isSpinning" 
                                        :disabled="isSpinning"
                                        @click="triggerSingleSpin"
                                    >
                                        <v-icon start>mdi-ticket</v-icon>
                                        EXTRAURE (50 <v-icon size="small" class="ml-1">mdi-currency-usd</v-icon>)
                                    </v-btn>

                                    <v-btn 
                                        color="purple-accent-3" 
                                        size="x-large" 
                                        rounded="xl" 
                                        class="font-weight-black text-white w-100"
                                        elevation="8"
                                        :disabled="isSpinning"
                                        @click="triggerMultiSpin"
                                    >
                                        <v-icon start>mdi-ticket-percent</v-icon>
                                        X10 EXTRACCIONS (450 <v-icon size="small" class="ml-1">mdi-currency-usd</v-icon>)
                                    </v-btn>
                                </div>

                                <div class="mt-8 px-8 py-4 rounded-xl balance-pill d-flex align-center justify-space-between w-100 mx-auto mx-md-0">
                                    <div>
                                        <span class="text-caption text-grey-lighten-1 block text-uppercase">Saldo disponible</span>
                                    <div class="text-center">
                                        <div class="d-flex align-center justify-center">
                                            <span class="text-h3 font-weight-black text-amber-accent-3 mr-2" style="text-shadow: 0 0 15px rgba(255, 193, 7, 0.4);">{{ userCoins }}</span>
                                            <v-icon color="amber-accent-3" size="large">mdi-currency-usd</v-icon>
                                        </div>
                                    </div>

                                    </div>
                                
                                </div>
                            </v-col>
                        </v-row>
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
                                    </div>
                                </div>

                                <div style="min-width: 120px;">
                                    <v-btn block height="44"
                                        :color="isOwned(item.id) ? 'success' : (userCoins >= item.price ? 'amber-accent-3' : 'grey-darken-3')"
                                        :variant="isOwned(item.id) ? 'tonal' : 'flat'"
                                        class="font-weight-bold rounded-lg text-black"
                                        :disabled="userCoins < item.price && !isOwned(item.id)"
                                        @click="buyProduct(item)">
                                        <template v-if="isOwned(item.id)">
                                            <v-icon>mdi-check</v-icon>
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
                                <v-card-actions class="justify-center px-4 pb-2">
                                    <v-btn block height="40"
                                        :color="isOwned(item.id) ? 'success' : (userCoins >= item.price ? 'amber-accent-3' : 'grey')"
                                        :variant="isOwned(item.id) ? 'tonal' : (userCoins >= item.price ? 'flat' : 'outlined')"
                                        class="font-weight-bold rounded-lg text-black"
                                        :disabled="userCoins < item.price && !isOwned(item.id)"
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

            <v-dialog v-model="showWinDialog" max-width="360" persistent>
                <v-card class="text-center pa-6 rounded-xl bg-slate-900 border-cyan elevation-20">
                    <div class="mb-4 mt-2">
                        <v-icon size="80" :color="lastPrize?.color || 'white'" class="animate-bounce drop-shadow">
                            {{ lastPrize?.icon }}
                        </v-icon>
                    </div>
                    <h3 class="text-h5 font-weight-bold mb-2 text-white">¡RECOMPENSA!</h3>
                    <p class="text-body-1 text-cyan-accent-3 mb-6">{{ lastPrize?.label }}</p>
                    <v-btn color="cyan-accent-3" variant="flat" block rounded="xl" class="font-weight-bold text-black"
                        @click="showWinDialog = false">
                        Aceptar
                    </v-btn>
                </v-card>
            </v-dialog>
        </v-container>
    </div>
</template>

<script setup>
// Nota: Aquí solo añado los arrays de ejemplo para que veas el renderizado, 
// tú mantén tu lógica de astroStore.
import { ref, onMounted, computed } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import LuckyWheel from '../../components/shop/LuckyWheel.vue';

const astroStore = useAstroStore();
const userCoins = computed(() => astroStore.coins);
const userGames = computed(() => astroStore.partides);
const showWinDialog = ref(false);
const lastPrize = ref(null);
const luckyWheelRef = ref(null);
const isSpinning = ref(false);

const triggerSingleSpin = () => {
    if (luckyWheelRef.value) {
        luckyWheelRef.value.spin();
    }
};

const triggerMultiSpin = () => {
    alert("Bloqueig d'Arquitectura: Necessites crear un endpoint al servidor (/api/shop/spin-multi) que calculi i retorni 10 premis de cop abans de poder fer servir això.");
};

const isOwned = (itemId) => {
    return astroStore.inventory?.some(i => i.id === itemId);
};

const buyProduct = async (item) => {
    // 1. Verificar si el usuario ya tiene el item (evita llamadas innecesarias al server)
    const alreadyOwned = astroStore.inventory?.some(i => i.id === item.id);
    if (alreadyOwned) {
        alert(`¡Ya tienes ${item.name} en tu inventario!`);
        return;
    }

    // 2. Confirmación
    if (!confirm(`¿Quieres comprar ${item.name} por ${item.price} créditos?`)) return;

    // 3. Llamada a la Store
    try {
        const result = await astroStore.buyItem(item);
        if (result.success) {
            // El backend ya nos devolvió el nuevo saldo y el inventario actualizado
            // Si usas Pinia, la UI se actualizará sola
            console.log("Compra exitosa");
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error en la tienda:", error);
    }
};

// Arrays separados para las dos secciones (puedes unirlos y filtrar con computeds)
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
    if (astroStore.user) { await fetchUserBalance(); }
});

async function fetchUserBalance() {
    const result = await astroStore.fetchUserBalance();
    if (!result.success) {
        console.error("Error:", result.message);
    }
}

const handleWin = (prize) => {
    lastPrize.value = prize;
    showWinDialog.value = true;
};

const updateCoins = (newBalance) => {
    astroStore.coins = newBalance;
};
</script>

<style scoped>
/* Estilos unificados del primer diseño */
.wheel-card {
    background: #111827;
    border: 1px solid rgba(0, 229, 255, 0.15);
    position: relative;
    overflow: hidden;
    max-width: 1200px !important;
}

.nebula-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(224, 64, 251, 0.2) 0%, rgba(0, 229, 255, 0.1) 50%, transparent 80%);
    filter: blur(25px);
    z-index: 0;
    border-radius: 50%;
    animation: pulse 4s infinite alternate;
}

@keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background-color: #0b1120 !important;
}

.wheel-card {
    background: #1e293b;
    border: 1px solid rgba(0, 229, 255, 0.1);
    max-width: 500px;
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
    border: 1px solid rgba(255, 193, 7, 0.3);
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

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }
}

.animate-bounce {
    animation: bounce 2s infinite ease-in-out;
}

.drop-shadow {
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
}
</style>
