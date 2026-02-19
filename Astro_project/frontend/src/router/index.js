import { createRouter, createWebHistory } from 'vue-router'
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
    },
    // RUTAS PROTEGIDAS
    {
      path: '/singleplayer',
      name: 'SinglePlayer',
      component: () => import('@/pages/training/singleplayer.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/profile/profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/shop',
      name: 'Shop',
      component: () => import('@/pages/shop/shop.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plans',
      name: 'Plans',
      component: Plans,
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: () => import('@/pages/inventory/inventory.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/achievements',
      name: 'Achievements',
      component: () => import('@/pages/achievements/achievements.vue')
    },
  ],
})

// GUARD DE NAVEGACIÓN
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // IMPORTANTE: Usamos 'astro_token' para coincidir con tu Store
  const isAuthenticated = !!localStorage.getItem('astro_token');

  if (requiresAuth && !isAuthenticated) {
    // Si la ruta es privada y no hay token, al login
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // Si ya está logueado y va a login/register, al simulador
    next('/singleplayer');
  } else {
    next();
  }
});

export default router;