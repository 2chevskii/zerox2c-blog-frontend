export class ApiError extends Error {
  public readonly details: unknown

  constructor(
    message: string,
    public readonly status: number,
    details: unknown = null,
  ) {
    super(message)
    this.details = details
  }
}

export const sessionStorageKey = 'zero-x2c-reader-session'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function getStoredAccessToken(): string | null {
  const rawSession = localStorage.getItem(sessionStorageKey)
  if (!rawSession) {
    return null
  }

  try {
    const parsed = JSON.parse(rawSession) as { accessToken?: unknown }
    return typeof parsed.accessToken === 'string' ? parsed.accessToken : null
  } catch {
    localStorage.removeItem(sessionStorageKey)
    return null
  }
}

export async function getJson<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const url = `${apiBaseUrl}${path}${query.size > 0 ? `?${query}` : ''}`
  return apiRequest<T>(url)
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getStoredAccessToken()

  headers.set('Accept', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path.startsWith('/api') ? `${apiBaseUrl}${path}` : path, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(body, response.status), response.status, body)
  }

  return body as T
}

export function jsonRequest<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function extractErrorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null) {
    const data = body as {
      error?: unknown
      title?: unknown
      detail?: unknown
      errors?: unknown
    }

    if (typeof data.error === 'string') {
      return data.error
    }

    if (typeof data.detail === 'string') {
      return data.detail
    }

    const validationMessage = extractValidationError(data.errors)
    if (validationMessage) {
      return validationMessage
    }

    if (typeof data.title === 'string') {
      return data.title
    }
  }

  if (typeof body === 'string' && body.length > 0) {
    return body
  }

  if (status === 401) {
    return 'Invalid username, email, or password.'
  }

  if (status === 403) {
    return 'This account cannot complete the requested action.'
  }

  return `Request failed with status ${status}.`
}

function extractValidationError(errors: unknown): string | null {
  if (typeof errors !== 'object' || errors === null) {
    return null
  }

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0]
    }
  }

  return 'Validation failed.'
}
