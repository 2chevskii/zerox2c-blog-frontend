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
  <header class="sticky top-0 z-50">
    <div class="mx-auto flex w-full max-w-7xl justify-end px-4 py-3 sm:px-6 lg:px-8">
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
