<template>
    <v-navigation-drawer app permanent width="280" class="sidebar left-sidebar" elevation="0" mobile-breakpoint="md">
        <div class="menu-header d-flex flex-column justify-center align-center py-12">
            <h1 class="text-h3 font-weight-bold text-white tracking-tighter mb-1">ASTRO</h1>
            <span class="text-caption text-primary font-weight-black letter-spacing-2">SYSTEM OS v2.0</span>
        </div>

        <v-list class="pa-2 bg-transparent" nav>
            <v-list-item v-for="(item, index) in menuItems" :key="index" :to="item.to" link
                class="menu-item mb-2 rounded-lg px-4" active-class="active-menu-item" min-height="56">
                <template v-slot:prepend>
                    <v-icon :icon="item.icon" size="22" class="mr-4 item-icon"></v-icon>
                </template>
                <v-list-item-title class="text-subtitle-1 font-weight-bold">
                    {{ item.title }}
                </v-list-item-title>
            </v-list-item>
        </v-list>

        <template v-slot:append>
            <div class="pa-4">
                <v-btn block variant="text" color="grey-lighten-1" @click="showLogoutDialog = true" prepend-icon="mdi-logout" class="logout-btn">
                    Desconectarse
                </v-btn>
            </div>
        </template>

        <!-- Logout Confirmation Dialog -->
        <v-dialog v-model="showLogoutDialog" max-width="400">
            <v-card class="glass-panel pa-6 text-center shadow-xl">
                <v-icon icon="mdi-alert-circle-outline" color="error" size="64" class="mb-4 pulse-error"></v-icon>
                <h2 class="text-h5 font-weight-bold text-white mb-2 tracking-tighter">¿CERRAR SESIÓN?</h2>
                <p class="text-body-2 text-grey-lighten-1 mb-8">
                    Estás a punto de desconectarte del sistema central de ASTRO. ¿Deseas continuar?
                </p>
                <div class="d-flex justify-center mt-4">
                    <v-btn variant="outlined" color="grey-lighten-1" @click="showLogoutDialog = false" class="rounded-lg flex-grow-1 mr-2" height="48">
                        CANCELAR
                    </v-btn>
                    <v-btn variant="flat" color="error" @click="handleLogout" class="rounded-lg flex-grow-1 ml-2" height="48">
                        DESCONECTAR
                    </v-btn>
                </div>
            </v-card>
        </v-dialog>
    </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAstroStore } from '@/stores/astroStore'

const router = useRouter()
const store = useAstroStore()

const showLogoutDialog = ref(false)

const handleLogout = () => {
    showLogoutDialog.value = false
    store.logout()
    router.push('/')
}

const menuItems = ref([
    { title: 'Un Jugador', icon: 'mdi-account', to: '/singleplayer' },
    { title: 'Multijugador', icon: 'mdi-sword-cross', to: '/multiplayer' },
    { title: 'Tienda', icon: 'mdi-store', to: '/shop' },
    { title: 'Logros', icon: 'mdi-trophy-variant', to: '/achievements' },
    { title: 'Amigos', icon: 'mdi-account-group', to: '/friends' },
    { title: 'Perfil', icon: 'mdi-card-account-details', to: '/profile' },
])
</script>

<style scoped>
.sidebar {
    background: linear-gradient(180deg, rgba(13, 25, 48, 0.7) 0%, rgba(5, 10, 20, 0.8) 100%) !important;
    backdrop-filter: blur(25px);
    border-right: 1px solid rgba(0, 242, 255, 0.1) !important;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.3);
}

.letter-spacing-2 {
    letter-spacing: 4px;
    font-size: 0.65rem !important;
    opacity: 0.7;
}

.menu-item {
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.6) !important;
}

.item-icon {
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.2s ease;
}

.menu-item:hover {
    background: rgba(255, 255, 255, 0.05) !important;
    color: white !important;
}

.menu-item:hover .item-icon {
    color: #00f2ff;
}

.active-menu-item {
    background: linear-gradient(90deg, rgba(0, 242, 255, 0.1) 0%, transparent 100%) !important;
    color: #00f2ff !important;
    border-left: 3px solid #00f2ff !important;
}

.active-menu-item .item-icon {
    color: #00f2ff !important;
}

.logout-btn {
    font-size: 0.8rem;
    letter-spacing: 1px;
    transition: all 0.3s ease;
}

.logout-btn:hover {
    color: #ff5252 !important;
    background: rgba(255, 82, 82, 0.05) !important;
}

.pulse-error {
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% { filter: drop-shadow(0 0 0px rgba(255, 82, 82, 0)); }
    50% { filter: drop-shadow(0 0 15px rgba(255, 82, 82, 0.5)); }
    100% { filter: drop-shadow(0 0 0px rgba(255, 82, 82, 0)); }
}

.tracking-tighter {
    letter-spacing: -2px;
}

.glass-panel {
    background: rgba(15, 15, 25, 0.9) !important;
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
}
</style>