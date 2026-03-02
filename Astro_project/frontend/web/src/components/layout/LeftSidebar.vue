<template>
    <v-navigation-drawer app permanent width="340" class="sidebar left-sidebar" elevation="0" mobile-breakpoint="md">
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
                    {{ $t(item.titleKey) }}
                </v-list-item-title>
            </v-list-item>
        </v-list>

        <template v-slot:append>
             <div class="pa-4 w-100 d-flex justify-center">
                 <v-btn-toggle
                    v-model="currentLang"
                    mandatory
                    rounded="xl"
                    color="cyan-accent-3"
                    class="bg-grey-darken-4 elevation-5"
                    @update:modelValue="changeLanguage"
                 >
                     <v-btn value="es" class="font-weight-bold">ES</v-btn>
                     <v-btn value="ca" class="font-weight-bold">CA</v-btn>
                 </v-btn-toggle>
             </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAstroStore } from '@/stores/astroStore'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const store = useAstroStore()
const { locale } = useI18n()

const currentLang = ref(locale.value)

const changeLanguage = (newLang) => {
    locale.value = newLang
    localStorage.setItem('astro_language', newLang)
}

const handleLogout = () => {
    store.logout()
    router.push('/')
}

const menuItems = ref([
    { titleKey: 'sidebar.training', icon: 'mdi-account', to: '/singleplayer' },
    { titleKey: 'sidebar.multiplayer', icon: 'mdi-sword-cross', to: '/multiplayer' },
    { titleKey: 'sidebar.shop', icon: 'mdi-store', to: '/shop' },
    { titleKey: 'sidebar.achievements', icon: 'mdi-trophy-variant', to: '/achievements' },
    { titleKey: 'sidebar.friends', icon: 'mdi-account-group', to: '/friends' },
    { titleKey: 'sidebar.profile', icon: 'mdi-card-account-details', to: '/profile' },
])
</script>

<style scoped>
.sidebar {
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
    overflow-y: hidden !important;
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
