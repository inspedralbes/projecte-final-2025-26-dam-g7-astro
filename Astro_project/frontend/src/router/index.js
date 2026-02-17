import { createRouter, createWebHistory } from 'vue-router'

// Importaciones de las fases de acceso
import RegisterView from '@/pages/RegisterView.vue'
import LoginView from '@/pages/LoginView.vue'
import Plans from '@/pages/Plans.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'register',
      // Fase 1: Alistamiento de nuevos tripulantes
      component: RegisterView,
    },
    {
      path: '/login',
      name: 'login',
      // Fase 2: Sincronización de credenciales
      component: LoginView,
      props: true,
    },
    {
      path: '/plans',
      name: 'Plans',
      // Fase 3: Selección de modalidad de misión
      component: Plans,
    },
    // Aquí puedes añadir más rutas como /menu o /perfil según tu esquema
  ],
})

// Lógica de gestión de errores para módulos dinámicos
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Error crítico en salto hiperespacial (módulo dinámico)', err)
    } else {
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error('Error de trayectoria:', err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router