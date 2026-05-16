const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function imageUrl(imageId: string | null | undefined) {
  return imageId ? `${apiBaseUrl}/api/images/${encodeURIComponent(imageId)}` : null
}
