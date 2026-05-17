import type { SearchSuggestionResponse } from '@/api/search'
import type {
  PostSearchDateFilter,
  PostSearchDateOperator,
  TagResponse,
} from '@/types/api'

export interface PostSearchBarProps {
  modelValue: string
  selectedTags: TagResponse[]
  availableTags: TagResponse[]
  isLoading?: boolean
  compact?: boolean
}

export interface PostSearchBarEmits {
  'update:modelValue': [value: string]
  search: []
  'select-tag': [tag: TagResponse]
  'remove-tag': [name: string]
  'date-filters-change': [dateFilters: PostSearchDateFilter[]]
}

export type PostSearchBarEmit = <Event extends keyof PostSearchBarEmits>(
  event: Event,
  ...args: PostSearchBarEmits[Event]
) => void

export type AutocompleteMode = 'tag' | 'keyword'
export type DateOperator = PostSearchDateOperator
export type CaretPlacement = 'start' | 'end'

export interface PillCompletionOptions {
  keepFocus?: boolean
}

export interface ActiveToken {
  start: number
  end: number
  text: string
}

export type DateFilter = PostSearchDateFilter

export interface SemanticPill {
  id: string
  type: 'tag' | 'date'
  operator?: DateOperator
  value: string
  isEditing: boolean
  isInvalid: boolean
}

export type SemanticPillDraft =
  | {
      type: 'tag'
      value: string
    }
  | {
      type: 'date'
      operator: DateOperator
      value: string
    }

export type SemanticTokenOrderItem =
  | {
      id: string
      kind: 'tag'
      tagName: string
    }
  | {
      id: string
      kind: 'date'
      operator: DateOperator
    }
  | {
      id: string
      kind: 'draft'
      draftId: string
    }

export type RenderSemanticItem =
  | {
      key: string
      kind: 'tag'
      orderIndex: number
      tag: TagResponse
    }
  | {
      key: string
      kind: 'date'
      orderIndex: number
      dateFilter: DateFilter
    }
  | {
      key: string
      kind: 'draft'
      orderIndex: number
      pill: SemanticPill
    }

export interface SemanticAutocompleteSuggestion {
  id: string
  label: string
  value: string
  type: 'semantic'
  operator: DateOperator
}

export type AutocompleteSuggestion = SearchSuggestionResponse | SemanticAutocompleteSuggestion
