<template>
    <div class="scroll-container space-background">
        <v-container fluid class="pa-4 pa-md-8 content-wrapper">
            <v-row>
                <!-- Cabecera -->
                <v-col cols="12" class="text-center mb-8">
                    <div class="d-flex align-center justify-center mb-2">
                        <v-icon color="cyan-accent-3" size="40" class="mr-3">mdi-archive-outline</v-icon>
                        <h1 class="text-h2 font-weight-bold tracking-wide text-white">MI INVENTARIO</h1>
                    </div>
                    <p class="text-h6 text-cyan-accent-1 opacity-75">Gestiona tu equipo y personaliza tu presencia
                        estelar</p>
                </v-col>

                <!-- Categorías -->
                <v-col cols="12" md="3">
                    <v-list class="glass-sidebar pa-2 rounded-xl" bg-color="transparent">
                        <v-list-item v-for="cat in categories" :key="cat.id" :prepend-icon="cat.icon" :title="cat.name"
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
                                <v-avatar size="90" :color="item.bgColor || 'rgba(0, 229, 255, 0.1)'"
                                    class="mb-4 medal-glow">
                                    <v-icon size="45" :color="item.color">{{ item.icon }}</v-icon>
                                </v-avatar>
                                <h3 class="text-h6 font-weight-bold text-white mb-1">{{ item.name }}</h3>
                                <p class="text-caption text-grey-lighten-1 text-center mb-4">{{ item.desc }}</p>
                                <v-spacer></v-spacer>
                                <v-btn block :color="item.equipped ? 'success' : 'cyan-accent-3'"
                                    :variant="item.equipped ? 'tonal' : 'flat'" rounded="pill"
                                    class="font-weight-bold text-black" @click="toggleEquip(item)">
                                    {{ item.equipped ? 'EQUIPADO' : 'EQUIPAR' }}
                                </v-btn>
                            </v-card>
                        </v-col>
                    </v-row>
                    <v-row v-else justify="center" align="center" style="min-height: 300px;">
                        <v-col cols="12" class="text-center">
                            <v-icon size="80" color="grey-darken-2" class="mb-4">mdi-package-variant</v-icon>
                            <h3 class="text-h5 text-grey">Aún no tienes equipo en esta categoría</h3>
                            <v-btn color="cyan-accent-3" variant="text" class="mt-4" to="/shop">
                                Visitar la Tienda
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const activeCategory = ref('all');

const categories = [
    { id: 'all', name: 'Todo', icon: 'mdi-apps' },
    { id: 'skins', name: 'Skins', icon: 'mdi-palette' },
    { id: 'pets', name: 'Compañeros', icon: 'mdi-robot' },
    { id: 'trails', name: 'Rastros', icon: 'mdi-creation' }
];

// Datos de ejemplo: lo ideal sería traerlos del Backend/Store
const inventoryItems = ref([
    { id: 102, name: 'Skin Cyberpunk', cat: 'skins', icon: 'mdi-robot', color: 'purple-accent-3', equipped: false, desc: 'Aspecto robótico.', bgColor: 'rgba(224, 64, 251, 0.15)' },
    { id: 103, name: 'Mascota Dron', cat: 'pets', icon: 'mdi-quadcopter', color: 'green-accent-3', equipped: false, desc: 'Un compañero fiel.', bgColor: 'rgba(0, 230, 118, 0.15)' }
]);

const filteredItems = computed(() => {
    if (activeCategory.value === 'all') return inventoryItems.value;
    return inventoryItems.value.filter(item => item.cat === activeCategory.value);
});

function toggleEquip(item) {
    // Lógica simple para demo
    item.equipped = !item.equipped;
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
