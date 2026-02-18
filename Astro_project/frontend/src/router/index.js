import { createRouter, createWebHistory } from 'vue-router'

// Importaciones de las vistas principales
import register from '@/pages/auth/register.vue'
import login from '@/pages/auth/login.vue'
import Plans from '@/pages/plans/plans.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: () => import('@/pages/home/index.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: register,
    },
    {
      path: '/login',
      name: 'login',
      component: login,
      props: true,
    },
    {
      path: '/plans',
      name: 'Plans',
      component: Plans,
    },
    {
      // Mantenemos /planes por compatibilidad si la usábamos
      path: '/planes',
      redirect: '/plans'
    },
    {
      path: '/singleplayer',
      name: 'SinglePlayer',
      component: () => import('@/pages/training/singleplayer.vue'),
    },
    {
      path: '/multiplayer',
      name: 'MultiPlayer',
      component: () => import('@/pages/training/multiplayer.vue'),
    },
    {
      path: '/shop',
      name: 'Shop',
      component: () => import('@/pages/shop/shop.vue'),
    },
    {
      path: '/menu',
      redirect: '/singleplayer'
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/profile/profile.vue')
    },
    {
      path: '/achievements',
      name: 'Achievements',
      component: () => import('@/pages/achievements/achievements.vue')
    },
  ],
})

// Mantenemos la lógica de error para imports dinámicos
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error', err)
    } else {
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router