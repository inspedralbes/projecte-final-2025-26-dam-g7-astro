import { createRouter, createWebHistory } from 'vue-router'

import Planes from '@/pages/Planes.vue'
import LoginView from '@/pages/LoginView.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    {
      path: '/',
      redirect: '/singleplayer'
    },
    {
      path: '/planes',
      name: 'Planes',
      component: Planes,
    },
    {
      path: '/singleplayer',
      name: 'SinglePlayer',
      component: () => import('@/pages/SinglePlayer.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,

      props: true, // Permite pasar props desde la ruta al componente
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/Profile.vue')
    },
  ],
})

// Mantenemos tu lógica de error para imports dinámicos
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