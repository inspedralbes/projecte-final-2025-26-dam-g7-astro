<template>
  <v-navigation-drawer
    app
    class="sidebar left-sidebar"
    elevation="0"
    mobile-breakpoint="md"
    permanent
    width="280"
  >
    <div class="menu-header d-flex flex-column justify-center align-center py-8">
      <h1 class="text-h3 font-weight-bold text-white tracking-tighter mb-1">ASTRO</h1>
      <v-img
        class="my-2 logo-sidebar-img"
        contain
        height="50"
        src="/logo/logo astro final.png"
        width="50"
      />
      <span class="text-caption text-primary font-weight-black letter-spacing-2">SYSTEM OS v2.0</span>
    </div>

    <v-list class="pa-2 bg-transparent" nav>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="index"
        active-class="active-menu-item"
        class="menu-item mb-2 rounded-lg px-4"
        link
        min-height="56"
        :to="item.to"
      >
        <template #prepend>
          <v-icon class="mr-4 item-icon" :icon="item.icon" size="22" />
        </template>
        <v-list-item-title class="text-subtitle-1 font-weight-bold">
          {{ $t(item.titleKey) }}
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <template #append>
      <div class="pa-4">
        <div class="d-flex justify-center mb-6">
          <LanguageSelector />
        </div>
        <v-btn
          block
          class="logout-btn"
          color="grey-lighten-1"
          prepend-icon="mdi-logout"
          variant="text"
          @click="showLogoutDialog = true"
        >
          {{ $t('profile.logoutBtn') }}
        </v-btn>
      </div>
    </template>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card class="glass-panel pa-6 text-center shadow-xl">
        <v-icon class="mb-4 pulse-error" color="error" icon="mdi-alert-circle-outline" size="64" />
        <h2 class="text-h5 font-weight-bold text-white mb-2 tracking-tighter">{{ $t('profile.logoutBtn').toUpperCase() }}?</h2>
        <p class="text-body-2 text-grey-lighten-1 mb-8">
          {{ $t('profile.logoutConfirm') }}
        </p>
        <div class="d-flex justify-center mt-4">
          <v-btn
            class="rounded-lg flex-grow-1 mr-2"
            color="grey-lighten-1"
            height="48"
            variant="outlined"
            @click="showLogoutDialog = false"
          >
            {{ $t('general.cancel').toUpperCase() }}
          </v-btn>
          <v-btn
            class="rounded-lg flex-grow-1 ml-2"
            color="error"
            height="48"
            variant="flat"
            @click="handleLogout"
          >
            {{ $t('profile.logoutBtn').split(' ')[0].toUpperCase() }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import LanguageSelector from '@/components/layout/LanguageSelector.vue'
  import { useAstroStore } from '@/stores/astroStore'

  const router = useRouter()
  const store = useAstroStore()

  const showLogoutDialog = ref(false)

  function handleLogout () {
    showLogoutDialog.value = false
    store.logout()
    router.push('/')
  }

  const menuItems = computed(() => {
    const items = [
      { titleKey: 'sidebar.training', icon: 'mdi-account', to: '/singleplayer' },
      { titleKey: 'sidebar.multiplayer', icon: 'mdi-sword-cross', to: '/multiplayer' },
      { titleKey: 'sidebar.shop', icon: 'mdi-store', to: '/shop' },
      { titleKey: 'sidebar.achievements', icon: 'mdi-trophy-variant', to: '/achievements' },
      { titleKey: 'sidebar.friends', icon: 'mdi-account-group', to: '/friends' },
      { titleKey: 'sidebar.profile', icon: 'mdi-card-account-details', to: '/profile' },
    ]

    if ((store.plan === 'GRUPAL' && (store.role === 'TEACHER' || store.role === 'CENTER')) || store.plan === 'INDIVIDUAL_PREMIUM') {
      items.push({ titleKey: 'sidebar.educational', icon: 'mdi-school', to: '/educational' })
    }

    return items
  })
</script>

<style scoped>
.sidebar {
    background: linear-gradient(180deg, rgba(13, 25, 48, 0.7) 0%, rgba(5, 10, 20, 0.8) 100%) !important;
    backdrop-filter: blur(25px);
    border-right: 1px solid rgba(0, 242, 255, 0.1) !important;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.3);
}

.logo-sidebar-img {
    filter: brightness(0) invert(1);
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
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
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
