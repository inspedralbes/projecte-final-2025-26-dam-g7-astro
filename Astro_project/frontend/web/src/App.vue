<template>
  <v-app class="app-container">
    <LeftSidebar v-if="showLayoutElements" />
    <RightSidebar v-if="showLayoutElements" />

    <v-main class="main-content">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import RightSidebar from '@/components/layout/RightSidebar.vue'

const route = useRoute()

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
/* En App.vue */
.app-container {
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%) !important;
  color: white !important;
  height: 100vh;
  overflow: hidden; /* Cambia auto por hidden para que el scroll sea interno */
}

.main-content {
  background: transparent !important;
}

/* Global scrollbar styling for a cleaner look */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
