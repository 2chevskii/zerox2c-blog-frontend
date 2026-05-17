import type {
  AutocompleteSuggestion,
  DateOperator,
  SemanticAutocompleteSuggestion,
  SemanticPillDraft,
} from './types'

const DATE_TOKEN_PATTERN = /^(from|to):(.*)$/i
const DATE_OPERATORS = ['from', 'to'] as const satisfies readonly DateOperator[]

export function getSemanticSuggestions(query: string): AutocompleteSuggestion[] {
  const needle = query.trim().toLowerCase()

  if (!needle || needle.startsWith('#') || needle.includes(':')) {
    return []
  }

  return DATE_OPERATORS.filter((operator) => operator.startsWith(needle)).map<SemanticAutocompleteSuggestion>(
    (operator) => ({
      id: `semantic-${operator}`,
      label: `${operator}:`,
      value: `${operator}:`,
      type: 'semantic',
      operator,
    }),
  )
}

export function getSemanticPillFromToken(token: string): SemanticPillDraft | null {
  if (token.startsWith('#')) {
    return {
      type: 'tag',
      value: token.slice(1),
    }
  }

  const dateMatch = token.match(DATE_TOKEN_PATTERN)

  if (dateMatch) {
    return {
      type: 'date',
      operator: dateMatch[1].toLowerCase() as DateOperator,
      value: dateMatch[2],
    }
  }

  return null
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
