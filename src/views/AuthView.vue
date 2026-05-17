<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { AlertCircle, KeyRound, Mail, User } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  email: '',
  login: '',
  password: '',
  confirmPassword: '',
})

const isSignup = computed(() => route.name === 'signup')
const title = computed(() => (isSignup.value ? 'Create account' : 'Sign in'))
const subtitle = computed(() =>
  isSignup.value
    ? 'Register a reader account with username, email, and password.'
    : 'Use your username or email to continue.',
)
const alternateLink = computed(() => (isSignup.value ? '/signin' : '/signup'))
const alternateText = computed(() => (isSignup.value ? 'Already have an account?' : 'Need an account?'))
const alternateAction = computed(() => (isSignup.value ? 'Sign in' : 'Sign up'))

useTitle(computed(() => `${title.value} | 0x2c.dev`))

watch(isSignup, () => {
  errorMessage.value = ''
})

async function submit() {
  errorMessage.value = ''

  if (!isFormValid()) {
    return
  }

  loading.value = true

  try {
    if (isSignup.value) {
      await auth.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    } else {
      await auth.login({
        login: form.login.trim(),
        password: form.password,
      })
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Authentication failed.'
  } finally {
    loading.value = false
  }
}

function isFormValid() {
  const password = form.password.trim()

  if (isSignup.value) {
    if (form.username.trim().length < 3) {
      errorMessage.value = 'Username must be at least 3 characters.'
      return false
    }

    if (!form.email.trim()) {
      errorMessage.value = 'Email is required.'
      return false
    }

    if (password.length < 8) {
      errorMessage.value = 'Password must be at least 8 characters.'
      return false
    }

    if (form.password !== form.confirmPassword) {
      errorMessage.value = 'Passwords do not match.'
      return false
    }

    return true
  }

  if (!form.login.trim()) {
    errorMessage.value = 'Username or email is required.'
    return false
  }

  if (!password) {
    errorMessage.value = 'Password is required.'
    return false
  }

  return true
}
</script>

<template>
  <main class="mx-auto grid min-h-[calc(100svh-5.25rem)] w-full max-w-7xl content-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
    <section class="mx-auto grid w-full max-w-md gap-6 rounded-2xl border border-mist-50/10 bg-[#252525] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-7">
      <div class="grid gap-3">
        <div class="grid gap-2">
          <h1 class="font-display text-3xl font-bold leading-none text-mist-50">{{ title }}</h1>
          <p class="text-sm leading-6 text-mist-300">{{ subtitle }}</p>
        </div>
      </div>

      <p
        v-if="errorMessage"
        class="inline-flex items-start gap-2 rounded-xl border border-ember-300/25 bg-ember-500/12 px-3 py-2 text-sm leading-6 text-ember-100"
        role="alert"
      >
        <AlertCircle class="mt-1 h-4 w-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </p>

      <form class="grid gap-4" @submit.prevent="submit">
        <label v-if="isSignup" class="grid gap-2 text-sm font-bold text-mist-100">
          Username
          <span class="relative">
            <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
            <input
              v-model="form.username"
              class="min-h-12 w-full rounded-xl border border-mist-50/12 bg-ink-950/72 py-3 pl-10 pr-3 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
              autocomplete="username"
              maxlength="64"
              minlength="3"
              required
              type="text"
            >
          </span>
        </label>

        <label v-if="isSignup" class="grid gap-2 text-sm font-bold text-mist-100">
          Email
          <span class="relative">
            <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
            <input
              v-model="form.email"
              class="min-h-12 w-full rounded-xl border border-mist-50/12 bg-ink-950/72 py-3 pl-10 pr-3 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
              autocomplete="email"
              maxlength="256"
              required
              type="email"
            >
          </span>
        </label>

        <label v-else class="grid gap-2 text-sm font-bold text-mist-100">
          Username or email
          <span class="relative">
            <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
            <input
              v-model="form.login"
              class="min-h-12 w-full rounded-xl border border-mist-50/12 bg-ink-950/72 py-3 pl-10 pr-3 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
              autocomplete="username"
              maxlength="256"
              required
              type="text"
            >
          </span>
        </label>

        <label class="grid gap-2 text-sm font-bold text-mist-100">
          Password
          <span class="relative">
            <KeyRound class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
            <input
              v-model="form.password"
              class="min-h-12 w-full rounded-xl border border-mist-50/12 bg-ink-950/72 py-3 pl-10 pr-3 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
              maxlength="256"
              :minlength="isSignup ? 8 : undefined"
              required
              type="password"
            >
          </span>
        </label>

        <label v-if="isSignup" class="grid gap-2 text-sm font-bold text-mist-100">
          Confirm password
          <span class="relative">
            <KeyRound class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
            <input
              v-model="form.confirmPassword"
              class="min-h-12 w-full rounded-xl border border-mist-50/12 bg-ink-950/72 py-3 pl-10 pr-3 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
              autocomplete="new-password"
              maxlength="256"
              minlength="8"
              required
              type="password"
            >
          </span>
        </label>

        <button
          type="submit"
          class="mt-1 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#303030] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-brass-100 transition hover:bg-[#353535] hover:text-mist-50 disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? 'Please wait' : title }}
        </button>
      </form>

      <p class="text-center text-sm text-mist-300">
        {{ alternateText }}
        <RouterLink class="font-bold text-brass-100 hover:text-mist-50" :to="alternateLink">
          {{ alternateAction }}
        </RouterLink>
      </p>
    </section>
  </main>
</template>
