<script setup lang="ts">
import { LogIn, LogOut, User, UserPlus } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  auth.clearSession()
  await router.push({ name: 'home' })
}
</script>

<template>
  <header class="site-header sticky top-0 z-50">
    <div class="header-backdrop" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>

    <div class="relative z-10 mx-auto flex w-full max-w-7xl justify-end px-4 py-3 sm:px-6 lg:px-8">
      <nav class="flex shrink-0 items-center gap-2" aria-label="Account navigation">
        <template v-if="auth.isAuthenticated">
          <div class="hidden min-w-0 items-center gap-2 rounded-full border border-mist-50/10 bg-mist-50/6 px-3 py-2 sm:flex">
            <User class="h-4 w-4 shrink-0 text-brass-100" />
            <span class="max-w-32 truncate text-sm font-bold text-mist-50">{{ auth.displayName }}</span>
            <span
              v-if="auth.isBlocked"
              class="rounded-full bg-ember-500/16 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ember-100"
            >
              Blocked
            </span>
          </div>
          <button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-full border border-mist-50/10 bg-mist-50/6 text-mist-300 transition hover:border-ember-300/45 hover:bg-ember-300/10 hover:text-ember-100"
            title="Sign out"
            aria-label="Sign out"
            @click="logout"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </template>
        <template v-else>
          <RouterLink
            to="/login"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-mist-50/10 bg-mist-50/6 text-mist-300 transition hover:border-brass-200/45 hover:bg-brass-200/10 hover:text-brass-100 sm:w-auto sm:px-4"
            title="Sign in"
            aria-label="Sign in"
          >
            <LogIn class="h-4 w-4 sm:mr-2" />
            <span class="hidden text-xs font-bold uppercase tracking-[0.16em] sm:inline">Sign in</span>
          </RouterLink>
          <RouterLink
            to="/signup"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brass-200/35 bg-brass-200/12 text-brass-100 transition hover:border-brass-200/60 hover:bg-brass-200/18 sm:w-auto sm:px-4"
            title="Create account"
            aria-label="Create account"
          >
            <UserPlus class="h-4 w-4 sm:mr-2" />
            <span class="hidden text-xs font-bold uppercase tracking-[0.16em] sm:inline">Sign up</span>
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
}

.header-backdrop,
.header-backdrop > span {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.header-backdrop {
  z-index: 0;
  overflow: hidden;
}

.header-backdrop > span:nth-child(1) {
  -webkit-backdrop-filter: blur(2px) saturate(1.04);
  backdrop-filter: blur(2px) saturate(1.04);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.8) 48%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.8) 48%, transparent 100%);
}

.header-backdrop > span:nth-child(2) {
  -webkit-backdrop-filter: blur(6px) saturate(1.08);
  backdrop-filter: blur(6px) saturate(1.08);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.75) 34%, transparent 78%);
  mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.75) 34%, transparent 78%);
}

.header-backdrop > span:nth-child(3) {
  -webkit-backdrop-filter: blur(12px) saturate(1.12);
  backdrop-filter: blur(12px) saturate(1.12);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.72) 20%, transparent 58%);
  mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.72) 20%, transparent 58%);
}

.header-backdrop > span:nth-child(4) {
  -webkit-backdrop-filter: blur(22px) saturate(1.16);
  backdrop-filter: blur(22px) saturate(1.16);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 34%);
  mask-image: linear-gradient(to bottom, #000 0%, transparent 34%);
}
</style>
