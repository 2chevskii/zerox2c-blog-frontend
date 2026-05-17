import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'
import AuthView from '@/views/AuthView.vue'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PostView from '@/views/PostView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

export const routeTransitionName = ref('page-forward')

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
      path: '/signin',
      name: 'signin',
      component: AuthView,
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: AuthView,
      meta: { guestOnly: true },
    },
    {
      path: '/posts/:slug',
      name: 'post',
      component: PostView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
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

router.beforeEach((to, from) => {
  const auth = useAuthStore()
  const historyState = window.history.state as { forward?: unknown } | null
  routeTransitionName.value = historyState?.forward === from.fullPath
    ? 'page-back'
    : 'page-forward'

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'signin', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
    return redirect
  }

  return true
})
