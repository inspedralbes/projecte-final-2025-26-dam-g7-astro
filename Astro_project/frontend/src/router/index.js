import { createRouter, createWebHistory } from 'vue-router'

// Importaciones de las vistas principales
import RegisterView from '@/pages/RegisterView.vue'
import LoginView from '@/pages/LoginView.vue'
import Plans from '@/pages/plans.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: () => import('@/pages/index.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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
      component: () => import('@/pages/SinglePlayer.vue'),
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/profile.vue')
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