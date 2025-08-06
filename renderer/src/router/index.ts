import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/skins',
      name: 'Skins',
      component: () => import('@/views/Skins.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/developer',
      name: 'Developer',
      component: () => import('@/views/Developer.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('@/views/Notifications.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/changelog',
      name: 'Changelog',
      component: () => import('@/views/Changelog.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/update',
      name: 'UpdateProgress',
      component: () => import('@/views/UpdateProgress.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/Auth.vue'),
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth');
  } else if (to.path === '/auth' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
