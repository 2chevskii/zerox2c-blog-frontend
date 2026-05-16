export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

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
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  return (await response.json()) as T
}
