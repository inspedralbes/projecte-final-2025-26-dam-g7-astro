<template>
    <v-navigation-drawer permanent width="300" class="sidebar left-sidebar" elevation="0">
        <div class="menu-header d-flex justify-center align-center py-10">
            <h1 class="text-h3 font-weight-bold text-white tracking-wide">ASTRO</h1>
        </div>

        <v-divider class="mx-6 border-opacity-25 mb-4" color="white"></v-divider>

        <v-list class="pa-0 bg-transparent">
            <v-list-item v-for="(item, index) in menuItems" :key="index" :to="item.to" link
                class="menu-item py-6 px-8 mb-2 mx-4 rounded-xl" active-class="active-menu-item">
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
                <v-btn block color="cyan-accent-3" variant="outlined" rounded="xl" size="large" @click="handleLogout">
                    Cerrar Sesión
                </v-btn>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAstroStore } from '@/stores/astroStore'

const router = useRouter()
const store = useAstroStore()

const handleLogout = () => {
    store.logout()
    router.push('/')
}

const menuItems = ref([
    { title: 'Un Jugador', icon: 'mdi-account', to: '/singleplayer' },
    { title: 'Tienda', icon: 'mdi-store', to: '/shop' },
    { title: 'Logros', icon: 'mdi-trophy-variant', to: '/achievements' },
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
    border: 1px solid transparent;
}

.menu-item:hover {
    background: rgba(0, 229, 255, 0.05) !important;
    border: 1px solid rgba(0, 229, 255, 0.2);
}

.active-menu-item {
    background: linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(41, 121, 255, 0.1) 100%) !important;
    border: 1px solid rgba(0, 229, 255, 0.4) !important;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
}

.border-color-white-alpha {
    border-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
