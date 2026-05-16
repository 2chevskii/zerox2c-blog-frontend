const longDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('en', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatLongDate(value: string | null | undefined) {
  return value ? longDateFormatter.format(new Date(value)) : 'Unscheduled'
}

export function formatShortDate(value: string | null | undefined) {
  return value ? shortDateFormatter.format(new Date(value)) : 'Draft'
}

export function estimateReadingMinutes(text: string | null | undefined) {
  const words = text?.trim().split(/\s+/).filter(Boolean).length ?? 0
  return Math.max(1, Math.ceil(words / 220))
}
