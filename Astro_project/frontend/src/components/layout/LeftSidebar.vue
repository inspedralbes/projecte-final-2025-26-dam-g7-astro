<template>
    <v-navigation-drawer permanent width="300" class="sidebar left-sidebar" elevation="0">
        <div class="menu-header d-flex justify-center align-center py-10">
            <h1 class="text-h3 font-weight-bold text-white tracking-wide">ASTRO</h1>
        </div>

        <v-list class="pa-0 bg-transparent">
            <v-list-item v-for="(item, index) in menuItems" :key="index" :to="item.to" link
                class="menu-item py-6 px-8 mb-2">
                <template v-slot:prepend>
                    <v-icon :icon="item.icon" color="cyan-accent-2" class="mr-4"></v-icon>
                </template>
                <v-list-item-title class="text-h6 text-white font-weight-medium">
                    {{ item.title }}
                </v-list-item-title>
            </v-list-item>
        </v-list>

        <template v-slot:append>
            <div class="pa-6 border-t border-color-white-alpha">
                <v-btn block color="cyan-accent-3" variant="outlined" rounded="xl" size="large">
                    Cerrar Sesión
                </v-btn>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'

const menuItems = ref([
    { title: 'Un Jugador', icon: 'mdi-account', to: '/singleplayer' },
    { title: 'Multijugador', icon: 'mdi-account-group', to: '/multiplayer' },
    { title: 'Tienda', icon: 'mdi-store', to: '/shop' },
    { title: 'Perfil', icon: 'mdi-card-account-details', to: '/profile' },
])
</script>

<style scoped>
.sidebar {
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.menu-item {
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
}

.menu-item:hover {
    background: linear-gradient(90deg, rgba(0, 229, 255, 0.1) 0%, transparent 100%);
    border-left: 3px solid #00e5ff;
}

.border-color-white-alpha {
    border-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
