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
    // --- RUTAS PROTEGIDAS (Requieren Login) ---
    {
      path: '/plans',
      name: 'Plans',
      component: Plans,
      meta: { requiresAuth: true }
    },
    {
      path: '/singleplayer',
      name: 'SinglePlayer',
      component: () => import('@/pages/training/singleplayer.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/multiplayer',
      name: 'MultiPlayer',
      component: () => import('@/pages/training/multiplayer.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/shop',
      name: 'Shop',
      component: () => import('@/pages/shop/shop.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/profile/profile.vue'),
      meta: { requiresAuth: true }
    },
    // --- REDIRECCIONES ---
    {
      path: '/planes',
      redirect: '/plans'
    },
    {
      path: '/menu',
      redirect: '/singleplayer'
    },
  ],
})

/**
 * GUARD DE NAVEGACIÓN
 * Se ejecuta antes de cada cambio de ruta
 */
router.beforeEach((to, from, next) => {
  // Comprobamos si la ruta a la que va requiere autenticación
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // Verificamos si existe una sesión en el localStorage
  // IMPORTANTE: Asegúrate de que en tu Login.vue hagas localStorage.setItem('user-session', 'true')
  const isAuthenticated = !!localStorage.getItem('user-session');

  if (requiresAuth && !isAuthenticated) {
    // Si intenta entrar a zona privada sin estar logueado -> Al Login
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // Si ya está logueado e intenta ir a login/registro -> Al Menú principal
    next('/singleplayer');
  } else {
    // En cualquier otro caso, permitimos el paso
    next();
  }
});

// Lógica de error para imports dinámicos
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