import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCurrentUser, login as loginRequest, register as registerRequest } from '@/api/auth'
import { sessionStorageKey } from '@/api/http'
import type { AuthResponse, CurrentUserResponse, LoginRequest, RegisterUserRequest } from '@/types/api'

interface StoredSession {
  userId: string
  username: string
  email: string
  accessToken: string
  expiresAt: string
  role: AuthResponse['role']
}

function readSession(): StoredSession | null {
  const rawSession = localStorage.getItem(sessionStorageKey)
  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as StoredSession
    if (isSessionValid(session)) {
      return session
    }
  } catch {
    // Fall through to remove invalid session data.
  }

  localStorage.removeItem(sessionStorageKey)
  return null
}

function isSessionValid(session: StoredSession | null): session is StoredSession {
  return !!session?.accessToken && Date.parse(session.expiresAt) > Date.now()
}

export const useAuthStore = defineStore('auth', () => {
  const storedSession = readSession()
  const userId = ref(storedSession?.userId ?? '')
  const username = ref(storedSession?.username ?? '')
  const email = ref(storedSession?.email ?? '')
  const accessToken = ref(storedSession?.accessToken ?? '')
  const expiresAt = ref(storedSession?.expiresAt ?? '')
  const role = ref<AuthResponse['role'] | ''>(storedSession?.role ?? '')
  const isBlocked = ref(false)

  const isAuthenticated = computed(
    () => !!accessToken.value && Date.parse(expiresAt.value) > Date.now(),
  )
  const displayName = computed(() => username.value || email.value || 'Account')

  async function login(request: LoginRequest): Promise<void> {
    const response = await loginRequest(request)
    setSession(response)
  }

  async function register(request: RegisterUserRequest): Promise<void> {
    const response = await registerRequest(request)
    setSession(response)
  }

  async function refreshCurrentUser(): Promise<void> {
    if (!isAuthenticated.value) {
      clearSession()
      return
    }

    const response = await getCurrentUser()
    applyCurrentUser(response)
  }

  function setSession(response: AuthResponse): void {
    userId.value = response.userId
    username.value = response.username
    email.value = response.email
    accessToken.value = response.accessToken
    expiresAt.value = response.expiresAt
    role.value = response.role
    isBlocked.value = false

    persistSession()
  }

  function applyCurrentUser(response: CurrentUserResponse): void {
    userId.value = response.userId
    username.value = response.username
    email.value = response.email
    role.value = response.role
    isBlocked.value = response.isBlocked

    persistSession()
  }

  function persistSession(): void {
    const session: StoredSession = {
      userId: userId.value,
      username: username.value,
      email: email.value,
      accessToken: accessToken.value,
      expiresAt: expiresAt.value,
      role: role.value || 'User',
    }

    if (isSessionValid(session)) {
      localStorage.setItem(sessionStorageKey, JSON.stringify(session))
    } else {
      localStorage.removeItem(sessionStorageKey)
    }
  }

  function clearSession(): void {
    userId.value = ''
    username.value = ''
    email.value = ''
    accessToken.value = ''
    expiresAt.value = ''
    role.value = ''
    isBlocked.value = false
    localStorage.removeItem(sessionStorageKey)
  }

  return {
    userId,
    username,
    email,
    accessToken,
    expiresAt,
    role,
    isBlocked,
    isAuthenticated,
    displayName,
    login,
    register,
    refreshCurrentUser,
    clearSession,
  }
})
