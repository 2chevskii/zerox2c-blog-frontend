import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PostView from '@/views/PostView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'text-brass-100',
  linkExactActiveClass: 'border-brass-300/60',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/posts/:slug',
      name: 'post',
      component: PostView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
