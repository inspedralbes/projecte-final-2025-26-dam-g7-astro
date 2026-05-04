<template>
    <div class="scroll-container space-background">
        <v-container fluid class="pa-4 pa-md-8 content-wrapper">
            <v-row>
                <!-- Cabecera -->
                <v-col cols="12" class="text-center mb-8">
                    <div class="d-flex align-center justify-center mb-2">
                        <v-icon color="cyan-accent-3" size="40" class="mr-3">mdi-archive-outline</v-icon>
                        <h1 class="text-h2 font-weight-bold tracking-wide text-white">{{ $t('inventory.title') }}</h1>
                    </div>
                    <p class="text-h6 text-cyan-accent-1 opacity-75">
                        {{ $t('inventory.subtitle') }}
                    </p>
                </v-col>

                <!-- Categorías -->
                <v-col cols="12" md="3">
                    <v-list class="glass-sidebar pa-2 rounded-xl" bg-color="transparent">
                        <v-list-item v-for="cat in categories" :key="cat.id" :prepend-icon="cat.icon" :title="$t(`inventory.categories.${cat.id}`)"
                            v-model="activeCategory" :value="cat.id" class="mb-2 rounded-lg category-item"
                            :class="{ 'active-cat': activeCategory === cat.id }"
                            @click="activeCategory = cat.id"></v-list-item>
                    </v-list>
                </v-col>

                <!-- Malla de Items -->
                <v-col cols="12" md="9">
                    <v-row v-if="filteredItems.length">
                        <v-col v-for="item in filteredItems" :key="item.id" cols="12" sm="6" lg="4">
                            <v-card class="item-card glass-card h-100 pa-4 d-flex flex-column align-center"
                                rounded="xl">
                                <v-avatar size="90" :style="{ backgroundColor: item.color + '20' }"
                                    class="mb-4 medal-glow">
                                    <v-icon size="45" :color="item.color">{{ item.icon }}</v-icon>
                                </v-avatar>
                                <h3 class="text-h6 font-weight-bold text-white mb-1">{{ item.name }}</h3>
                                <v-chip size="small" color="cyan-accent-3" variant="tonal" class="mb-2">
                                    x{{ item.quantity }} / {{ item.maxQuantity || 99 }}
                                </v-chip>
                                <p class="text-caption text-grey-lighten-1 text-center mb-4">{{ item.desc }}</p>
                                <v-chip
                                    v-if="isUsableBooster(item) && getBoosterGamesLeft(item) > 0"
                                    size="x-small"
                                    color="green-accent-3"
                                    variant="tonal"
                                    class="mb-2"
                                >
                                    {{ $t('inventory.active', { games: getBoosterGamesLeft(item) }) }}
                                </v-chip>
                                <v-spacer></v-spacer>
                                <v-btn
                                    block
                                    :color="getItemActionColor(item)"
                                    :variant="getItemActionVariant(item)"
                                    rounded="pill"
                                    class="font-weight-bold text-black"
                                    :disabled="isItemActionDisabled(item)"
                                    @click="handleItemAction(item)"
                                >
                                    {{ getItemActionLabel(item) }}
                                </v-btn>
                            </v-card>
                        </v-col>
                    </v-row>
                    <v-row v-else justify="center" align="center" style="min-height: 300px;">
                        <v-col cols="12" class="text-center">
                            <v-icon size="80" color="grey-darken-2" class="mb-4">mdi-package-variant</v-icon>
                            <h3 class="text-h5 text-grey">{{ $t('inventory.empty') }}</h3>
                            <v-btn color="cyan-accent-3" variant="text" class="mt-4" to="/shop">
                                {{ $t('inventory.goToShop') }}
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const astroStore = useAstroStore();
const activeCategory = ref('all');
const USABLE_BOOSTER_ITEM_IDS = Object.freeze([3, 4]);

const categories = [
    { id: 'all', name: 'Todo', icon: 'mdi-apps' },
    { id: 'skin', name: 'Skins', icon: 'mdi-palette' },
    { id: 'pets', name: 'Compañeros', icon: 'mdi-robot' },
    { id: 'collectible', name: 'Coleccionables', icon: 'mdi-trophy' },
    { id: 'trails', name: 'Rastros', icon: 'mdi-creation' },
    { id: 'items', name: 'Objetos', icon: 'mdi-flask-outline' }
];

// Usamos SIEMPRE el estado global de Pinia
const inventoryItems = computed(() => astroStore.inventory || []);

const filteredItems = computed(() => {
    if (activeCategory.value === 'all') return inventoryItems.value;
    return inventoryItems.value.filter(item => item.cat === activeCategory.value);
});

// Solo un onMounted para traer los datos al cargar la vista
onMounted(async () => {
    if (astroStore.user) {
        await astroStore.fetchUserInventory();
    }
});

async function toggleEquip(item) {
    if (!isEquipable(item)) return;

    // 1. Usamos la variable de entorno. Si no existe, usa localhost como backup.
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    try {
        // 2. Reemplazamos la URL fija por el Template Literal
        const response = await fetch(`${API_BASE}/api/inventory/toggle-equip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: astroStore.user,
                itemId: Number(item.id)
            })
        });

        const data = await response.json();
        if (data.success) {
            // Actualizamos el estado global con el inventario devuelto por el servidor
            astroStore.setInventory(data.inventory || []);
        }
    } catch (error) {
        console.error("Error al equipar item:", error);
    }
}

function isEquipable(item) {
    return item?.cat !== 'items';
}

function isUsableBooster(item) {
    return USABLE_BOOSTER_ITEM_IDS.includes(Number(item?.id));
}

function getBoosterGamesLeft(item) {
    const itemId = Number(item?.id);
    if (itemId === 3) return Number(astroStore.activeBoosters?.doubleCoinsGamesLeft) || 0;
    if (itemId === 4) return Number(astroStore.activeBoosters?.doubleScoreGamesLeft) || 0;
    return 0;
}

function getItemActionLabel(item) {
    if (isUsableBooster(item)) return t('inventory.use');
    if (!isEquipable(item)) return t('inventory.unequipable');
    return item.equipped ? t('inventory.equipped') : t('inventory.equip');
}

function getItemActionColor(item) {
    if (isUsableBooster(item)) return 'amber-accent-3';
    if (!isEquipable(item)) return 'grey-darken-2';
    return item.equipped ? 'success' : 'cyan-accent-3';
}

function getItemActionVariant(item) {
    if (isUsableBooster(item)) return 'flat';
    if (!isEquipable(item)) return 'outlined';
    return item.equipped ? 'tonal' : 'flat';
}

function isItemActionDisabled(item) {
    if (isUsableBooster(item)) return Number(item?.quantity) <= 0;
    return !isEquipable(item);
}

async function handleItemAction(item) {
    if (isUsableBooster(item)) {
        const result = await astroStore.useInventoryItem(item.id);
        if (!result.success) {
            alert(result.message || 'No se pudo usar el objeto.');
        }
        return;
    }

    await toggleEquip(item);
}
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background-color: #0b1120 !important;
}

.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.glass-sidebar {
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.category-item {
    transition: all 0.2s;
    color: #94a3b8;
}

.active-cat {
    background: rgba(0, 229, 255, 0.15) !important;
    color: #00e5ff !important;
}

.glass-card {
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s;
}

.item-card:hover {
    transform: translateY(-5px);
    border-color: rgba(0, 229, 255, 0.4);
}

.medal-glow {
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
}
</style>
