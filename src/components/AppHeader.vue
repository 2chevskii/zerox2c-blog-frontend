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
  <header class="sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
    <div class="mx-auto flex w-full max-w-7xl justify-end rounded-xl bg-[#252525]/92 px-3 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-[36px] sm:px-4">
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
            class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#303030] px-2.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-mist-200 transition hover:bg-[#353535] hover:text-brass-100 sm:px-3"
            title="Sign in"
            aria-label="Sign in"
          >
            <LogIn class="h-3.5 w-3.5" />
            <span class="hidden text-xs font-bold uppercase tracking-[0.16em] sm:inline">Sign in</span>
          </RouterLink>
          <RouterLink
            to="/signup"
            class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#303030] px-2.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brass-100 transition hover:bg-[#353535] hover:text-mist-50 sm:px-3"
            title="Create account"
            aria-label="Create account"
          >
            <UserPlus class="h-3.5 w-3.5" />
            <span class="hidden text-xs font-bold uppercase tracking-[0.16em] sm:inline">Sign up</span>
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>
