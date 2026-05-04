<template>
  <v-app class="app-container">
    <LeftSidebar v-if="showLayoutElements" />
    <RightSidebar v-if="showLayoutElements" />

    <v-main class="main-content">
      <router-view />
    </v-main>

    <!-- Chat drawer global: persiste entre rutas -->
    <ChatDrawer />

    <!-- Popup de desafíos globales -->
    <ChallengePopup />
  </v-app>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import RightSidebar from '@/components/layout/RightSidebar.vue'
import ChatDrawer from '@/components/layout/ChatDrawer.vue'
import ChallengePopup from '@/components/multiplayer/ChallengePopup.vue'
import { useMultiplayerStore } from '@/stores/multiplayerStore'
import { useSessionStore } from '@/stores/sessionStore'

const route = useRoute()
const sessionStore = useSessionStore()
const multiplayerStore = useMultiplayerStore()

// Reconectar WS si el usuario ya tiene sesión activa o acaba de iniciarla
watch(() => sessionStore.user, (newUser) => {
  if (newUser && (!multiplayerStore.socket || multiplayerStore.socket.readyState !== WebSocket.OPEN)) {
    console.log(`🔌 Detectada sesión para ${newUser}, conectando WS...`);
    multiplayerStore.connect();
  }
}, { immediate: true });

// Control de inactividad
const handleActivity = () => {
  if (sessionStore.token) {
    sessionStore.updateLastActivity();
  }
}

onMounted(() => {
  // Comprobar si la sesión ha expirado al cargar
  const expired = sessionStore.checkSessionExpiration();
  if (expired) {
    window.location.href = '/login';
    return;
  }

  // Escuchar eventos de usuario para mantener la sesión viva
  window.addEventListener('mousemove', handleActivity);
  window.addEventListener('keydown', handleActivity);
  window.addEventListener('click', handleActivity);
  window.addEventListener('scroll', handleActivity);

  // Comprobación periódica cada minuto
  const interval = setInterval(() => {
    if (sessionStore.checkSessionExpiration()) {
      window.location.href = '/login';
    }
  }, 60000);

  return () => {
    window.removeEventListener('mousemove', handleActivity);
    window.removeEventListener('keydown', handleActivity);
    window.removeEventListener('click', handleActivity);
    window.removeEventListener('scroll', handleActivity);
    clearInterval(interval);
  }
})

// Define routes where sidebars should be hidden
const showLayoutElements = computed(() => {
  const hiddenPaths = ['/', '/login', '/register', '/plans', '/planes']
  const hiddenNames = ['index', 'register', 'login', 'Plans']

  const isHidden = hiddenPaths.includes(route.path) ||
    (route.name && hiddenNames.includes(route.name))

  return !isHidden
})
</script>

<style>
/* Global Styles */
:root {
  --astro-bg: #05050a;
  --astro-glass: rgba(255, 255, 255, 0.03);
  --astro-border: rgba(255, 255, 255, 0.08);
  --astro-glow: rgba(0, 242, 255, 0.3);
}

body {
  font-family: 'Inter', sans-serif !important;
  background-color: var(--astro-bg) !important;
  margin: 0;
  overflow-x: hidden;
}

h1, h2, h3, .text-h1, .text-h2, .text-h3 {
  font-family: 'Orbitron', sans-serif !important;
  letter-spacing: 2px !important;
}

h4, h5, h6, .text-h4, .text-h5, .text-h6, .text-subtitle-1, .v-btn {
  font-family: 'Rajdhani', sans-serif !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.app-container {
  background: radial-gradient(circle at 50% -20%, #1a1a3a 0%, #05050a 70%) !important;
  color: white !important;
  min-height: 100vh;
}

.main-content {
  background: transparent !important;
}

/* Glassmorphism Helper Classes */
.glass-panel {
  background: var(--astro-glass) !important;
  backdrop-filter: blur(20px);
  border: 1px solid var(--astro-border) !important;
  border-radius: 16px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.02) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  border-color: rgba(0, 242, 255, 0.2) !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--astro-glow);
}
</style>
