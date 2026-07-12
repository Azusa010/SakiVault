import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'

const isElectronDesktop = window.electronAPI?.isDesktop===true
const appHistory = isElectronDesktop ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history: appHistory,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
    },
    {
      path: '/anime/:id',
      name: 'anime-detail',
      component: () => import('@/views/DetailView.vue'),
      redirect: (to) => `/anime/${to.params.id}/overview`,
      children: [
        {
          name: 'overview',
          path: 'overview',
          component: () => import('@/views/tabs/OverviewTab.vue'),
        },
        {
          name: 'comments',
          path: 'comments',
          component: () => import('@/views/tabs/CommentsTab.vue'),
        },
        {
          name: 'characters',
          path: 'characters',
          component: () => import('@/views/tabs/CharactersTab.vue'),
        },
        {
          name: 'reviews',
          path: 'reviews',
          component: () => import('@/views/tabs/ReviewsTab.vue'),
        },
        {
          name: 'staff',
          path: 'staff',
          component: () => import('@/views/tabs/StaffTab.vue'),
        },
      ],
    },
    {
      path: '/favorite',
      name: 'favorite',
      component: () => import('@/views/FavoritesView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/anime/:id/watch',
      name: 'watch',
      component: () => import('@/views/watchView.vue'),
    },
  ],
})

export default router
