import { createRouter,createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue')
    },
    {
      path:'/anime/:id',
      name:'anime-detail',
      component: () => import('@/views/DetailView.vue')
    },
    {
      path:'/favorite',
      name:'favorite',
      component: () => import('@/views/FavoritesView.vue')
    }
  ]
})

export default router
