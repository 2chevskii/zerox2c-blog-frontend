import { apiRequest, jsonRequest } from '@/api/http'
import type { AuthResponse, CurrentUserResponse, LoginRequest, RegisterUserRequest } from '@/types/api'

export function login(request: LoginRequest): Promise<AuthResponse> {
  return jsonRequest<AuthResponse>('/api/auth/login', 'POST', request)
}

export function register(request: RegisterUserRequest): Promise<AuthResponse> {
  return jsonRequest<AuthResponse>('/api/auth/register', 'POST', request)
}

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>('/api/me')
}
