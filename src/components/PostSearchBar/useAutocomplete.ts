import { computed, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import {
  getSearchKeywordSuggestions,
  getSearchTagSuggestions,
} from '@/api/search'
import { getSemanticSuggestions } from './semanticFilters'
import type {
  ActiveToken,
  AutocompleteMode,
  AutocompleteSuggestion,
  PostSearchBarProps,
  SemanticPill,
} from './types'

const AUTOCOMPLETE_DEBOUNCE_MS = 80
const AUTOCOMPLETE_MAX_WAIT_MS = 200

export interface PostSearchAutocompleteOptions {
  activePill: ComputedRef<SemanticPill | null>
  activeToken: ComputedRef<ActiveToken>
  isAutocompleteDismissed: Ref<boolean>
  isSearchFocused: ComputedRef<boolean>
  props: PostSearchBarProps
}

export function usePostSearchAutocomplete({
  activePill,
  activeToken,
  isAutocompleteDismissed,
  isSearchFocused,
  props,
}: PostSearchAutocompleteOptions) {
  const autocompleteSuggestions = refAutocompleteSuggestions()
  const activeSuggestionIndex = refActiveSuggestionIndex()
  let autocompleteRequestId = 0

  const activeAutocompleteMode = computed<AutocompleteMode | null>(() => {
    if (activePill.value?.type === 'tag' && activePill.value.isEditing) {
      return 'tag'
    }

    if (activePill.value) {
      return null
    }

    const token = activeToken.value.text

    if (token.startsWith('#')) {
      return 'tag'
    }

    if (token.trim().length > 0 && !token.includes(':')) {
      return 'keyword'
    }

    return null
  })

  const showAutocomplete = computed(
    () =>
      isSearchFocused.value &&
      !isAutocompleteDismissed.value &&
      activeAutocompleteMode.value !== null &&
      autocompleteSuggestions.value.length > 0,
  )

  const activeDescendantId = computed(() => {
    if (!showAutocomplete.value) {
      return undefined
    }

    return `search-suggestion-${autocompleteSuggestions.value[activeSuggestionIndex.value]?.id}`
  })

  watchDebounced(
    () =>
      [
        props.modelValue,
        props.availableTags,
        props.selectedTags,
        activeToken.value.start,
        activeToken.value.end,
        activeToken.value.text,
        activePill.value?.id,
        activePill.value?.value,
        activePill.value?.type,
      ] as const,
    () => {
      void refreshAutocomplete()
    },
    {
      debounce: AUTOCOMPLETE_DEBOUNCE_MS,
      immediate: true,
      maxWait: AUTOCOMPLETE_MAX_WAIT_MS,
    },
  )

  watch(autocompleteSuggestions, () => {
    activeSuggestionIndex.value = 0
  })

  async function refreshAutocomplete() {
    const requestId = ++autocompleteRequestId
    const mode = activeAutocompleteMode.value

    if (!mode) {
      autocompleteSuggestions.value = []
      return
    }

    if (mode === 'tag') {
      const query = activePill.value?.type === 'tag' ? activePill.value.value : activeToken.value.text.slice(1)
      const suggestions = await getSearchTagSuggestions(query, props.availableTags, props.selectedTags)

      if (requestId === autocompleteRequestId) {
        autocompleteSuggestions.value = suggestions
      }

      return
    }

    const semanticSuggestions = getSemanticSuggestions(activeToken.value.text)
    const keywordSuggestions = await getSearchKeywordSuggestions(activeToken.value.text)

    if (requestId === autocompleteRequestId) {
      autocompleteSuggestions.value = [...semanticSuggestions, ...keywordSuggestions]
    }
  }

  return {
    activeAutocompleteMode,
    activeDescendantId,
    activeSuggestionIndex,
    autocompleteSuggestions,
    showAutocomplete,
  }
}

function refAutocompleteSuggestions() {
  return shallowRef<AutocompleteSuggestion[]>([])
}

function refActiveSuggestionIndex() {
  return shallowRef(0)
}
