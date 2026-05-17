<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Calendar, Hash, Search, X } from '@lucide/vue'
import {
  getSearchKeywordSuggestions,
  getSearchTagSuggestions,
  type SearchSuggestionResponse,
} from '@/api/search'
import type { TagResponse } from '@/types/api'

const props = defineProps<{
  modelValue: string
  selectedTags: TagResponse[]
  availableTags: TagResponse[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
  'select-tag': [tag: TagResponse]
  'remove-tag': [name: string]
}>()

const searchInput = ref<HTMLInputElement | null>(null)
const rootElement = ref<HTMLElement | null>(null)
const isSearchFocused = ref(false)
const isAutocompleteDismissed = ref(false)
const autocompleteSuggestions = ref<SearchSuggestionResponse[]>([])
const activeSuggestionIndex = ref(0)
const caretIndex = ref(0)
const selectedDateFilters = ref<DateFilter[]>([])

type AutocompleteMode = 'tag' | 'keyword'

interface ActiveToken {
  start: number
  end: number
  text: string
}

interface DateToken extends ActiveToken {
  operator: 'from' | 'to'
  dateValue: string
}

interface DateFilter {
  operator: 'from' | 'to'
  dateValue: string
}

const activeToken = computed(() => getActiveToken(props.modelValue, caretIndex.value))

const activeDateToken = computed<DateToken | null>(() => {
  const token = activeToken.value
  const match = token.text.match(/^(from|to):(.*)$/i)

  if (!match) {
    return null
  }

  return {
    ...token,
    operator: match[1].toLowerCase() as 'from' | 'to',
    dateValue: match[2],
  }
})

const activeAutocompleteMode = computed<AutocompleteMode | null>(() => {
  const token = activeToken.value.text

  if (activeDateToken.value) {
    return null
  }

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

const showDatePicker = computed(() => isSearchFocused.value && activeDateToken.value !== null)

const dateInputValue = computed(() => {
  const dateValue = activeDateToken.value?.dateValue ?? ''
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : ''
})

const activeDescendantId = computed(() => {
  if (!showAutocomplete.value) {
    return undefined
  }

  return `search-suggestion-${autocompleteSuggestions.value[activeSuggestionIndex.value]?.id}`
})

watch(
  () => [props.modelValue, props.availableTags, props.selectedTags, caretIndex.value] as const,
  () => {
    void refreshAutocomplete()
  },
  { immediate: true },
)

watch(autocompleteSuggestions, () => {
  activeSuggestionIndex.value = 0
})

function updateSearch(value: string) {
  emit('update:modelValue', value)
  isAutocompleteDismissed.value = false
  emit('search')
}

function onSearchInput(event: Event) {
  const input = event.target as HTMLInputElement
  caretIndex.value = input.selectionStart ?? input.value.length
  updateSearch(input.value)
}

function selectTag(tag: TagResponse) {
  emit('update:modelValue', withoutCompletedToken())
  emit('select-tag', tag)
  isAutocompleteDismissed.value = true
  void nextTick(() => searchInput.value?.focus())
}

function removeTag(name: string) {
  emit('remove-tag', name)
  void nextTick(() => searchInput.value?.focus())
}

function removeDateFilter(operator: DateFilter['operator']) {
  selectedDateFilters.value = selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== operator)
  emit('search')
  void nextTick(() => searchInput.value?.focus())
}

function onSearchKeydown(event: KeyboardEvent) {
  if (showDatePicker.value && event.key === 'Enter' && isActiveDateComplete()) {
    event.preventDefault()
    commitActiveDateToken()
    return
  }

  if (showAutocomplete.value && event.key === 'ArrowDown') {
    event.preventDefault()
    activeSuggestionIndex.value = (activeSuggestionIndex.value + 1) % autocompleteSuggestions.value.length
    return
  }

  if (showAutocomplete.value && event.key === 'ArrowUp') {
    event.preventDefault()
    activeSuggestionIndex.value =
      (activeSuggestionIndex.value - 1 + autocompleteSuggestions.value.length) %
      autocompleteSuggestions.value.length
    return
  }

  if (showAutocomplete.value && event.key === 'Enter') {
    event.preventDefault()
    selectSuggestion(autocompleteSuggestions.value[activeSuggestionIndex.value])
    return
  }

  if (event.key === 'Backspace' && props.modelValue.length === 0 && props.selectedTags.length > 0) {
    removeTag(props.selectedTags[props.selectedTags.length - 1].name)
    return
  }

  if (event.key === 'Escape') {
    if (showDatePicker.value) {
      blurSearch()
      return
    }

    isAutocompleteDismissed.value = true
  }
}

function onFocusIn() {
  isSearchFocused.value = true
}

function onFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget

  if (nextTarget instanceof Node && rootElement.value?.contains(nextTarget)) {
    return
  }

  isSearchFocused.value = false
  isAutocompleteDismissed.value = true
}

function blurSearch() {
  searchInput.value?.blur()
  isSearchFocused.value = false
  isAutocompleteDismissed.value = true
}

function updateCaret(event: Event) {
  const input = event.target as HTMLInputElement
  caretIndex.value = input.selectionStart ?? input.value.length

  if (event instanceof KeyboardEvent && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
    return
  }

  isAutocompleteDismissed.value = false
}

function selectSuggestion(suggestion: SearchSuggestionResponse | undefined) {
  if (!suggestion) {
    return
  }

  if (suggestion.type === 'tag') {
    if (suggestion.tag) {
      selectTag(suggestion.tag)
    }

    return
  }

  replaceCompletedToken(suggestion.value)
  isAutocompleteDismissed.value = true
  emit('search')
  void nextTick(() => searchInput.value?.focus())
}

function selectDate(event: Event) {
  const value = (event.target as HTMLInputElement).value

  if (!value || !activeDateToken.value) {
    return
  }

  setDateFilter(activeDateToken.value.operator, value)
  emit('update:modelValue', withoutCompletedToken())
  emit('search')
  void nextTick(() => searchInput.value?.focus())
}

function commitActiveDateToken() {
  if (!activeDateToken.value || !isActiveDateComplete()) {
    return
  }

  setDateFilter(activeDateToken.value.operator, activeDateToken.value.dateValue)
  emit('update:modelValue', withoutCompletedToken())
  emit('search')
  void nextTick(() => searchInput.value?.focus())
}

async function refreshAutocomplete() {
  const mode = activeAutocompleteMode.value

  if (!mode) {
    autocompleteSuggestions.value = []
    return
  }

  autocompleteSuggestions.value =
    mode === 'tag'
      ? await getSearchTagSuggestions(activeToken.value.text.slice(1), props.availableTags, props.selectedTags)
      : await getSearchKeywordSuggestions(activeToken.value.text)
}

function getActiveToken(value: string, cursorPosition: number): ActiveToken {
  const cursor = Math.min(Math.max(cursorPosition, 0), value.length)
  const tokenStart = value.lastIndexOf(' ', Math.max(0, cursor - 1)) + 1
  const nextSpace = value.indexOf(' ', cursor)
  const tokenEnd = nextSpace === -1 ? value.length : nextSpace

  return {
    start: tokenStart,
    end: tokenEnd,
    text: value.slice(tokenStart, tokenEnd),
  }
}

function withoutCompletedToken() {
  const token = activeToken.value
  const nextValue = `${props.modelValue.slice(0, token.start)}${props.modelValue.slice(token.end)}`.replace(
    /\s{2,}/g,
    ' ',
  )

  return nextValue.trim()
}

function replaceCompletedToken(replacement: string) {
  const token = activeToken.value
  const prefix = props.modelValue.slice(0, token.start)
  const suffix = props.modelValue.slice(token.end)
  const nextValue = `${prefix}${replacement}${suffix}`

  emit('update:modelValue', nextValue)
  caretIndex.value = token.start + replacement.length
}

function isActiveDateComplete() {
  return /^\d{4}-\d{2}-\d{2}$/.test(activeDateToken.value?.dateValue ?? '')
}

function setDateFilter(operator: DateFilter['operator'], dateValue: string) {
  const dateFilterOrder: Record<DateFilter['operator'], number> = { from: 0, to: 1 }

  selectedDateFilters.value = [
    ...selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== operator),
    { operator, dateValue },
  ].sort((left, right) => dateFilterOrder[left.operator] - dateFilterOrder[right.operator])
}
</script>

<template>
  <Teleport to="body">
    <button
      v-if="isSearchFocused"
      type="button"
      class="fixed inset-0 z-30 cursor-default border-0 bg-ink-950/5 p-0 backdrop-blur-[4px] focus-visible:outline-none"
      aria-label="Close search"
      @mousedown.prevent="blurSearch"
    />
  </Teleport>

  <div
    ref="rootElement"
    class="relative mx-auto w-full max-w-3xl"
    :class="isSearchFocused ? 'z-50' : ''"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <label class="sr-only" for="post-search">Search posts</label>
    <div
      class="glass-panel relative z-50 flex min-h-13 w-full flex-wrap items-center gap-1.5 rounded-xl py-2.5 pl-12 pr-3 transition duration-200"
    >
      <Search class="pointer-events-none absolute left-4 top-4 h-5 w-5 text-brass-100/80" />

      <button
        v-for="tag in selectedTags"
        :key="tag.id"
        type="button"
        class="inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-md border border-mist-50/10 bg-mist-50/7 px-2 py-0.5 text-[0.68rem] font-semibold text-mist-200 transition hover:border-mist-50/18 hover:bg-mist-50/10 hover:text-mist-50 focus-visible:outline-none"
        :title="`Remove ${tag.name}`"
        @click="removeTag(tag.name)"
      >
        <span class="truncate">{{ tag.name }}</span>
        <X class="h-3 w-3" />
      </button>

      <button
        v-for="dateFilter in selectedDateFilters"
        :key="dateFilter.operator"
        type="button"
        class="inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-md border border-mist-50/10 bg-mist-50/7 px-2 py-0.5 text-[0.68rem] font-semibold text-mist-200 transition hover:border-mist-50/18 hover:bg-mist-50/10 hover:text-mist-50 focus-visible:outline-none"
        :title="`Remove ${dateFilter.operator}:${dateFilter.dateValue}`"
        @click="removeDateFilter(dateFilter.operator)"
      >
        <span class="truncate">{{ dateFilter.operator }}:{{ dateFilter.dateValue }}</span>
        <X class="h-3 w-3" />
      </button>

      <input
        id="post-search"
        ref="searchInput"
        :value="modelValue"
        type="search"
        placeholder="Search posts..."
        role="combobox"
        class="min-h-8 min-w-40 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-mist-50 outline-none placeholder:text-mist-300/75 focus-visible:outline-none"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="showAutocomplete || showDatePicker"
        :aria-activedescendant="activeDescendantId"
        aria-controls="search-autocomplete"
        @focus="updateCaret"
        @input="onSearchInput"
        @click="updateCaret"
        @keyup="updateCaret"
        @keydown="onSearchKeydown"
      />

      <span v-if="isLoading" class="hidden rounded-lg border border-mist-50/10 bg-mist-50/6 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-mist-300 sm:inline-flex">
        Syncing
      </span>
    </div>

    <div
      v-if="showAutocomplete"
      id="search-autocomplete"
      role="listbox"
      class="glass-panel absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl p-1"
    >
      <button
        v-for="(suggestion, index) in autocompleteSuggestions"
        :id="`search-suggestion-${suggestion.id}`"
        :key="suggestion.id"
        type="button"
        role="option"
        :aria-selected="index === activeSuggestionIndex"
        class="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-mist-100 transition hover:bg-mist-50/8 hover:text-brass-100"
        :class="index === activeSuggestionIndex ? 'bg-mist-50/8 text-brass-100' : ''"
        @mousedown.prevent="selectSuggestion(suggestion)"
      >
        <span class="inline-flex items-center gap-2">
          <Hash v-if="suggestion.type === 'tag'" class="h-4 w-4 text-brass-200" />
          <Search v-else class="h-4 w-4 text-brass-200" />
          {{ suggestion.label }}
        </span>
        <span class="text-[0.65rem] uppercase tracking-[0.22em] text-mist-300">
          {{ suggestion.type === 'tag' ? 'Tag' : 'Keyword' }}
        </span>
      </button>
    </div>

    <div
      v-if="showDatePicker"
      class="glass-panel absolute left-0 right-0 z-50 mt-2 grid gap-3 rounded-xl p-4 sm:left-auto sm:w-80"
    >
      <label class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-mist-300">
        <Calendar class="h-4 w-4 text-brass-200" />
        {{ activeDateToken?.operator === 'from' ? 'From date' : 'To date' }}
      </label>
      <input
        type="date"
        :value="dateInputValue"
        class="min-h-11 rounded-lg border border-mist-50/10 bg-ink-950/60 px-3 text-sm font-semibold text-mist-50 outline-none focus-visible:outline-none"
        @input="selectDate"
      />
    </div>
  </div>
</template>

<style scoped>
#post-search:focus,
#post-search:focus-visible {
  outline: none;
}
</style>
