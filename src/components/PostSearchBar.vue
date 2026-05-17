<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Calendar, Hash, Search, X } from '@lucide/vue'
import { onKeyStroke } from '@vueuse/core'
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
const autocompleteSuggestions = ref<AutocompleteSuggestion[]>([])
const activeSuggestionIndex = ref(0)
const caretIndex = ref(0)
const selectedDateFilters = ref<DateFilter[]>([])
const draftPills = ref<SemanticPill[]>([])
const semanticTokenOrder = ref<SemanticTokenOrderItem[]>([])
const activePillId = ref<string | null>(null)
let nextPillId = 1

type AutocompleteMode = 'tag' | 'keyword'
type DateOperator = 'from' | 'to'
type CaretPlacement = 'start' | 'end'

interface PillCompletionOptions {
  keepFocus?: boolean
}

interface ActiveToken {
  start: number
  end: number
  text: string
}

interface DateFilter {
  operator: DateOperator
  dateValue: string
}

interface SemanticPill {
  id: string
  type: 'tag' | 'date'
  operator?: DateOperator
  value: string
  isEditing: boolean
  isInvalid: boolean
}

type SemanticTokenOrderItem =
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

type RenderSemanticItem =
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

type AutocompleteSuggestion =
  | SearchSuggestionResponse
  | {
      id: string
      label: string
      value: string
      type: 'semantic'
      operator: DateOperator
    }

const activeToken = computed(() => getActiveToken(props.modelValue, caretIndex.value))
const activePill = computed(() => draftPills.value.find((pill) => pill.id === activePillId.value) ?? null)

const orderedSemanticItems = computed<RenderSemanticItem[]>(() => {
  const items: RenderSemanticItem[] = []
  const seenTags = new Set<string>()
  const seenDateOperators = new Set<DateOperator>()
  const seenDraftPills = new Set<string>()

  semanticTokenOrder.value.forEach((orderItem, orderIndex) => {
    if (orderItem.kind === 'tag') {
      const tag = props.selectedTags.find((selectedTag) => selectedTag.name === orderItem.tagName)

      if (tag) {
        seenTags.add(tag.name)
        items.push({ key: orderItem.id, kind: 'tag', orderIndex, tag })
      }

      return
    }

    if (orderItem.kind === 'date') {
      const dateFilter = selectedDateFilters.value.find((filter) => filter.operator === orderItem.operator)

      if (dateFilter) {
        seenDateOperators.add(dateFilter.operator)
        items.push({ key: orderItem.id, kind: 'date', orderIndex, dateFilter })
      }

      return
    }

    const pill = draftPills.value.find((draftPill) => draftPill.id === orderItem.draftId)

    if (pill) {
      seenDraftPills.add(pill.id)
      items.push({ key: orderItem.id, kind: 'draft', orderIndex, pill })
    }
  })

  props.selectedTags
    .filter((tag) => !seenTags.has(tag.name))
    .forEach((tag) => items.push({ key: `unordered-tag-${tag.id}`, kind: 'tag', orderIndex: -1, tag }))

  selectedDateFilters.value
    .filter((dateFilter) => !seenDateOperators.has(dateFilter.operator))
    .forEach((dateFilter) =>
      items.push({
        key: `unordered-date-${dateFilter.operator}`,
        kind: 'date',
        orderIndex: -1,
        dateFilter,
      }),
    )

  draftPills.value
    .filter((pill) => !seenDraftPills.has(pill.id))
    .forEach((pill) => items.push({ key: `unordered-draft-${pill.id}`, kind: 'draft', orderIndex: -1, pill }))

  return items
})

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

const showDatePicker = computed(
  () => isSearchFocused.value && activePill.value?.type === 'date' && activePill.value.isEditing,
)

const dateInputValue = computed(() => {
  const dateValue = activePill.value?.type === 'date' ? activePill.value.value : ''
  return isValidDate(dateValue) ? dateValue : ''
})

const activeDescendantId = computed(() => {
  if (!showAutocomplete.value) {
    return undefined
  }

  return `search-suggestion-${autocompleteSuggestions.value[activeSuggestionIndex.value]?.id}`
})

watch(
  () =>
    [
      props.modelValue,
      props.availableTags,
      props.selectedTags,
      caretIndex.value,
      activePill.value?.id,
      activePill.value?.value,
      activePill.value?.type,
    ] as const,
  () => {
    void refreshAutocomplete()
  },
  { immediate: true },
)

onKeyStroke('k', onGlobalSearchShortcut)

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
  const value = input.value
  const cursor = input.selectionStart ?? value.length
  const token = getActiveToken(value, cursor)
  const semanticPill = getSemanticPillFromToken(token.text)

  caretIndex.value = cursor

  if (semanticPill) {
    createDraftPill(semanticPill, value, token)
    return
  }

  updateSearch(value)
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    blurSearch()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    submitSearch()
    return
  }

  if (showAutocomplete.value && event.key === 'Tab') {
    event.preventDefault()
    selectSuggestion(autocompleteSuggestions.value[activeSuggestionIndex.value])
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
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

  if (event.key === 'Backspace' && isMainInputAtStart()) {
    removeLastPillBeforeSearch()
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowLeft' && isMainInputAtStart()) {
    editLastPillBeforeSearch()
    event.preventDefault()
  }
}

function onPillKeydown(pill: SemanticPill, event: KeyboardEvent) {
  const input = event.target as HTMLInputElement
  const selectionStart = input.selectionStart ?? 0
  const selectionEnd = input.selectionEnd ?? selectionStart
  const valueEnd = input.value.length

  if (event.key === 'ArrowLeft' && selectionStart === 0 && selectionEnd === 0) {
    event.preventDefault()
    focusAdjacentPill(pill, 'previous')
    return
  }

  if (event.key === 'ArrowRight' && selectionStart === valueEnd && selectionEnd === valueEnd) {
    event.preventDefault()
    focusAdjacentPill(pill, 'next')
    return
  }

  if (event.key === 'Backspace' && selectionStart === 0 && selectionEnd === 0) {
    event.preventDefault()
    removeDraftPill(pill.id)
    focusSearchAtStart()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    submitSearch(pill)
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()

    if (pill.type === 'tag' && autocompleteSuggestions.value.length > 0) {
      selectSuggestion(autocompleteSuggestions.value[activeSuggestionIndex.value])
      return
    }

    confirmOrEscapePill(pill)
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    confirmOrEscapePill(pill)
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    blurSearch()
  }
}

function onPillInput(pill: SemanticPill, event: Event) {
  pill.value = (event.target as HTMLInputElement).value
  pill.isInvalid = false
  pill.isEditing = true
  activePillId.value = pill.id
  isAutocompleteDismissed.value = false
}

function activatePill(pill: SemanticPill) {
  pill.isEditing = true
  activePillId.value = pill.id
  isAutocompleteDismissed.value = false
}

function editPill(pill: SemanticPill, caretPlacement: CaretPlacement = 'end') {
  activatePill(pill)
  void nextTick(() => focusPillInput(pill.id, caretPlacement))
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

function onGlobalSearchShortcut(event: KeyboardEvent) {
  if (!event.ctrlKey) {
    return
  }

  event.preventDefault()
  isSearchFocused.value = true
  isAutocompleteDismissed.value = false
  focusSearchAtEnd()
}

function blurSearch() {
  const activeElement = document.activeElement

  if (activeElement instanceof HTMLElement && rootElement.value?.contains(activeElement)) {
    activeElement.blur()
  }

  searchInput.value?.blur()
  isSearchFocused.value = false
  isAutocompleteDismissed.value = true
}

function updateCaret(event: Event) {
  const input = event.target as HTMLInputElement
  caretIndex.value = input.selectionStart ?? input.value.length
  activePillId.value = null

  if (event instanceof KeyboardEvent && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(event.key)) {
    return
  }

  isAutocompleteDismissed.value = false
}

function selectSuggestion(suggestion: AutocompleteSuggestion | undefined) {
  if (!suggestion) {
    return
  }

  if (suggestion.type === 'semantic') {
    createDraftPill(
      { type: 'date', operator: suggestion.operator, value: '' },
      props.modelValue,
      activeToken.value,
    )
    return
  }

  if (suggestion.type === 'tag') {
    if (activePill.value?.type === 'tag' && suggestion.tag) {
      confirmTagPill(activePill.value, suggestion.tag)
      return
    }

    if (suggestion.tag) {
      selectTag(suggestion.tag)
    }

    return
  }

  replaceCompletedToken(suggestion.value)
  isAutocompleteDismissed.value = true
  emit('search')
  focusSearch()
}

function selectDate(event: Event) {
  const pill = activePill.value
  const value = (event.target as HTMLInputElement).value

  if (!value || pill?.type !== 'date') {
    return
  }

  pill.value = value
  confirmDatePill(pill)
}

function selectTag(tag: TagResponse) {
  appendTagOrder(tag.name)
  emit('update:modelValue', withoutCompletedToken())
  emit('select-tag', tag)
  isAutocompleteDismissed.value = true
  focusSearch()
}

function removeTag(name: string) {
  removeOrderItems((item) => item.kind === 'tag' && item.tagName === name)
  emit('remove-tag', name)
  focusSearch()
}

function removeDateFilter(operator: DateFilter['operator']) {
  selectedDateFilters.value = selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== operator)
  removeOrderItems((item) => item.kind === 'date' && item.operator === operator)
  emit('search')
  focusSearch()
}

function removeDraftPill(id: string, removeFromOrder = true) {
  draftPills.value = draftPills.value.filter((pill) => pill.id !== id)

  if (removeFromOrder) {
    removeOrderItems((item) => item.kind === 'draft' && item.draftId === id)
  }

  if (activePillId.value === id) {
    activePillId.value = null
  }
}

function removeLastPillBeforeSearch() {
  const lastItem = orderedSemanticItems.value[orderedSemanticItems.value.length - 1]

  if (!lastItem) {
    return
  }

  removeSemanticItem(lastItem)
}

function submitSearch(pill = activePill.value) {
  if (pill) {
    confirmOrEscapePill(pill, { keepFocus: false })
  }

  emit('search')
  blurSearch()
}

function editLastPillBeforeSearch() {
  const lastItem = orderedSemanticItems.value[orderedSemanticItems.value.length - 1]

  if (lastItem) {
    editSemanticItem(lastItem)
  }
}

function focusAdjacentPill(pill: SemanticPill, direction: 'previous' | 'next') {
  const currentIndex = orderedSemanticItems.value.findIndex(
    (item) => item.kind === 'draft' && item.pill.id === pill.id,
  )
  const targetIndex = direction === 'previous' ? currentIndex - 1 : currentIndex + 1
  const targetItem = orderedSemanticItems.value[targetIndex]

  if (currentIndex === -1) {
    return
  }

  if (!targetItem) {
    if (direction === 'next') {
      deactivatePill(pill)
      focusSearchAtStart()
    }

    return
  }

  deactivatePill(pill)
  editSemanticItem(targetItem, direction === 'previous' ? 'end' : 'start')
}

async function refreshAutocomplete() {
  const mode = activeAutocompleteMode.value

  if (!mode) {
    autocompleteSuggestions.value = []
    return
  }

  if (mode === 'tag') {
    const query = activePill.value?.type === 'tag' ? activePill.value.value : activeToken.value.text.slice(1)
    autocompleteSuggestions.value = await getSearchTagSuggestions(query, props.availableTags, props.selectedTags)
    return
  }

  const semanticSuggestions = getSemanticSuggestions(activeToken.value.text)
  const keywordSuggestions = await getSearchKeywordSuggestions(activeToken.value.text)
  autocompleteSuggestions.value = [...semanticSuggestions, ...keywordSuggestions]
}

function getSemanticSuggestions(query: string): AutocompleteSuggestion[] {
  const needle = query.trim().toLowerCase()

  if (!needle || needle.startsWith('#') || needle.includes(':')) {
    return []
  }

  return (['from', 'to'] as const)
    .filter((operator) => operator.startsWith(needle))
    .map((operator) => ({
      id: `semantic-${operator}`,
      label: `${operator}:`,
      value: `${operator}:`,
      type: 'semantic',
      operator,
    }))
}

function getSemanticPillFromToken(token: string) {
  if (token.startsWith('#')) {
    return {
      type: 'tag' as const,
      value: token.slice(1),
    }
  }

  const dateMatch = token.match(/^(from|to):(.*)$/i)

  if (dateMatch) {
    return {
      type: 'date' as const,
      operator: dateMatch[1].toLowerCase() as DateOperator,
      value: dateMatch[2],
    }
  }

  return null
}

function createDraftPill(
  draft: { type: 'tag'; value: string } | { type: 'date'; operator: DateOperator; value: string },
  value: string,
  token: ActiveToken,
) {
  const pill = createPill(draft)

  if (pill.type === 'date') {
    const replacedDateDraftIds = draftPills.value
      .filter((existingPill) => existingPill.type === 'date' && existingPill.operator === pill.operator)
      .map((existingPill) => existingPill.id)

    draftPills.value = draftPills.value.filter(
      (existingPill) => existingPill.type !== 'date' || existingPill.operator !== pill.operator,
    )
    removeOrderItems(
      (item) =>
        (item.kind === 'date' && item.operator === pill.operator) ||
        (item.kind === 'draft' && replacedDateDraftIds.includes(item.draftId)),
    )
    selectedDateFilters.value = selectedDateFilters.value.filter(
      (dateFilter) => dateFilter.operator !== pill.operator,
    )
  }

  draftPills.value = [...draftPills.value, pill]
  appendOrderItem({ id: `order-${pill.id}`, kind: 'draft', draftId: pill.id })
  activePillId.value = pill.id
  emit('update:modelValue', withoutToken(value, token))
  isAutocompleteDismissed.value = false
  emit('search')
  void nextTick(() => focusPillInput(pill.id))
}

function createPill(
  draft: { type: 'tag'; value: string } | { type: 'date'; operator: DateOperator; value: string },
): SemanticPill {
  return {
    id: `semantic-pill-${nextPillId++}`,
    type: draft.type,
    operator: draft.type === 'date' ? draft.operator : undefined,
    value: draft.value,
    isEditing: true,
    isInvalid: false,
  }
}

function confirmOrEscapePill(pill: SemanticPill, options: PillCompletionOptions = {}) {
  if (pill.type === 'tag') {
    const tag = findExactTag(pill.value)

    if (tag) {
      confirmTagPill(pill, tag, options)
      return
    }

    escapePill(pill, options)
    return
  }

  if (pill.type === 'date' && isValidDate(pill.value)) {
    confirmDatePill(pill, options)
    return
  }

  escapePill(pill, options)
}

function escapePill(pill: SemanticPill, options: PillCompletionOptions = {}) {
  deactivatePill(pill)

  if (options.keepFocus !== false) {
    focusSearchAtStart()
  }
}

function deactivatePill(pill: SemanticPill) {
  pill.isEditing = false
  pill.isInvalid = !isPillValid(pill)
  activePillId.value = null
}

function confirmTagPill(pill: SemanticPill, tag: TagResponse, options: PillCompletionOptions = {}) {
  replaceDraftOrderItem(pill.id, {
    id: `order-tag-${tag.name}`,
    kind: 'tag',
    tagName: tag.name,
  })
  removeDraftPill(pill.id, false)
  emit('select-tag', tag)
  isAutocompleteDismissed.value = true

  if (options.keepFocus !== false) {
    focusSearchAtStart()
  }
}

function confirmDatePill(pill: SemanticPill, options: PillCompletionOptions = {}) {
  if (pill.type !== 'date' || !pill.operator) {
    return
  }

  setDateFilter(pill.operator, pill.value)
  replaceDraftOrderItem(pill.id, {
    id: `order-date-${pill.operator}`,
    kind: 'date',
    operator: pill.operator,
  })
  removeDraftPill(pill.id, false)
  isAutocompleteDismissed.value = true

  if (options.keepFocus !== false) {
    emit('search')
    focusSearchAtStart()
  }
}

function findExactTag(value: string) {
  const normalizedValue = value.trim().toLowerCase()

  if (!normalizedValue || props.selectedTags.some((tag) => tag.name.toLowerCase() === normalizedValue)) {
    return undefined
  }

  return props.availableTags.find((tag) => tag.name.toLowerCase() === normalizedValue)
}

function isPillValid(pill: SemanticPill) {
  return pill.type === 'tag' ? Boolean(findExactTag(pill.value)) : isValidDate(pill.value)
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function setDateFilter(operator: DateFilter['operator'], dateValue: string) {
  selectedDateFilters.value = [
    ...selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== operator),
    { operator, dateValue },
  ]
}

function appendTagOrder(tagName: string) {
  removeOrderItems((item) => item.kind === 'tag' && item.tagName === tagName)
  appendOrderItem({ id: `order-tag-${tagName}`, kind: 'tag', tagName })
}

function appendOrderItem(item: SemanticTokenOrderItem) {
  semanticTokenOrder.value = [...semanticTokenOrder.value, item]
}

function removeOrderItems(predicate: (item: SemanticTokenOrderItem) => boolean) {
  semanticTokenOrder.value = semanticTokenOrder.value.filter((item) => !predicate(item))
}

function replaceDraftOrderItem(draftId: string, replacement: SemanticTokenOrderItem) {
  const orderIndex = semanticTokenOrder.value.findIndex(
    (item) => item.kind === 'draft' && item.draftId === draftId,
  )

  if (orderIndex === -1) {
    appendOrderItem(replacement)
    return
  }

  semanticTokenOrder.value = semanticTokenOrder.value.map((item, index) =>
    index === orderIndex ? replacement : item,
  )
}

function removeSemanticItem(item: RenderSemanticItem) {
  if (item.kind === 'draft') {
    removeDraftPill(item.pill.id)
    emit('search')
    return
  }

  if (item.kind === 'date') {
    removeDateFilter(item.dateFilter.operator)
    return
  }

  removeTag(item.tag.name)
}

function editSemanticItem(item: RenderSemanticItem, caretPlacement: CaretPlacement = 'end') {
  if (item.kind === 'draft') {
    editPill(item.pill, caretPlacement)
    return
  }

  if (item.kind === 'date') {
    convertDateFilterToDraft(item, caretPlacement)
    return
  }

  convertTagToDraft(item, caretPlacement)
}

function convertTagToDraft(
  item: Extract<RenderSemanticItem, { kind: 'tag' }>,
  caretPlacement: CaretPlacement = 'end',
) {
  const pill = createPill({ type: 'tag', value: item.tag.name })

  replaceOrderAtIndex(item.orderIndex, { id: `order-${pill.id}`, kind: 'draft', draftId: pill.id })
  draftPills.value = [...draftPills.value, pill]
  activePillId.value = pill.id
  emit('remove-tag', item.tag.name)
  isAutocompleteDismissed.value = false
  void nextTick(() => focusPillInput(pill.id, caretPlacement))
}

function convertDateFilterToDraft(
  item: Extract<RenderSemanticItem, { kind: 'date' }>,
  caretPlacement: CaretPlacement = 'end',
) {
  const pill = createPill({
    type: 'date',
    operator: item.dateFilter.operator,
    value: item.dateFilter.dateValue,
  })

  replaceOrderAtIndex(item.orderIndex, { id: `order-${pill.id}`, kind: 'draft', draftId: pill.id })
  selectedDateFilters.value = selectedDateFilters.value.filter(
    (dateFilter) => dateFilter.operator !== item.dateFilter.operator,
  )
  draftPills.value = [...draftPills.value, pill]
  activePillId.value = pill.id
  emit('search')
  isAutocompleteDismissed.value = false
  void nextTick(() => focusPillInput(pill.id, caretPlacement))
}

function replaceOrderAtIndex(index: number, replacement: SemanticTokenOrderItem) {
  if (index < 0) {
    appendOrderItem(replacement)
    return
  }

  semanticTokenOrder.value = semanticTokenOrder.value.map((item, itemIndex) =>
    itemIndex === index ? replacement : item,
  )
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
  return withoutToken(props.modelValue, activeToken.value)
}

function withoutToken(value: string, token: ActiveToken) {
  return `${value.slice(0, token.start)}${value.slice(token.end)}`.replace(/\s{2,}/g, ' ').trim()
}

function replaceCompletedToken(replacement: string) {
  const token = activeToken.value
  const prefix = props.modelValue.slice(0, token.start)
  const suffix = props.modelValue.slice(token.end)
  const nextValue = `${prefix}${replacement}${suffix}`

  emit('update:modelValue', nextValue)
  caretIndex.value = token.start + replacement.length
}

function isMainInputAtStart() {
  if (!searchInput.value) {
    return props.modelValue.length === 0
  }

  return searchInput.value.selectionStart === 0 && searchInput.value.selectionEnd === 0
}

function focusSearch() {
  void nextTick(() => searchInput.value?.focus())
}

function focusSearchAtStart() {
  void nextTick(() => {
    searchInput.value?.focus()
    searchInput.value?.setSelectionRange(0, 0)
  })
}

function focusSearchAtEnd() {
  void nextTick(() => {
    searchInput.value?.focus()
    searchInput.value?.setSelectionRange(props.modelValue.length, props.modelValue.length)
  })
}

function focusPillInput(id: string, caretPlacement: CaretPlacement = 'end') {
  const pillInput = rootElement.value?.querySelector<HTMLInputElement>(`[data-pill-input="${id}"]`)
  const caretPosition = caretPlacement === 'start' ? 0 : (pillInput?.value.length ?? 0)

  pillInput?.focus()
  pillInput?.setSelectionRange(caretPosition, caretPosition)
}

function pillPrefix(pill: SemanticPill) {
  return pill.type === 'tag' ? '#' : `${pill.operator}:`
}

function pillTitle(pill: SemanticPill) {
  return pill.type === 'tag' ? `Remove #${pill.value}` : `Remove ${pill.operator}:${pill.value}`
}

function semanticItemText(item: RenderSemanticItem) {
  if (item.kind === 'tag') {
    return item.tag.name
  }

  if (item.kind === 'date') {
    return `${item.dateFilter.operator}:${item.dateFilter.dateValue}`
  }

  return `${pillPrefix(item.pill)}${item.pill.value}`
}

function semanticItemTitle(item: RenderSemanticItem) {
  return `Edit ${semanticItemText(item)}`
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

      <template v-for="item in orderedSemanticItems" :key="item.key">
        <div
          v-if="item.kind === 'draft' && item.pill.isEditing"
          class="inline-flex min-h-6 max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-[0.68rem] font-semibold transition"
          :class="
            item.pill.isInvalid
              ? 'border-ember-300/45 bg-ember-500/12 text-ember-100'
              : 'border-mist-50/10 bg-mist-50/7 text-mist-200'
          "
        >
          <span>{{ pillPrefix(item.pill) }}</span>
          <input
            :data-pill-input="item.pill.id"
            :value="item.pill.value"
            :placeholder="item.pill.type === 'tag' ? 'tag' : 'yyyy-mm-dd'"
            role="combobox"
            class="min-h-5 min-w-12 max-w-36 border-0 bg-transparent p-0 text-[0.68rem] font-semibold text-inherit outline-none placeholder:text-mist-300/65 focus-visible:outline-none"
            :style="{ width: `${Math.max(item.pill.value.length, item.pill.type === 'tag' ? 4 : 10)}ch` }"
            autocomplete="off"
            @focus="activatePill(item.pill)"
            @input="onPillInput(item.pill, $event)"
            @keydown="onPillKeydown(item.pill, $event)"
          />
          <button
            type="button"
            class="inline-flex text-inherit opacity-80 transition hover:opacity-100 focus-visible:outline-none"
            :title="pillTitle(item.pill)"
            @mousedown.prevent="removeDraftPill(item.pill.id); focusSearchAtStart()"
          >
            <X class="h-3 w-3" />
          </button>
        </div>

        <div
          v-else
          class="inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.68rem] font-semibold transition"
          :class="
            item.kind === 'draft' && item.pill.isInvalid
              ? 'border-ember-300/45 bg-ember-500/12 text-ember-100 hover:bg-ember-500/16'
              : 'border-mist-50/10 bg-mist-50/7 text-mist-200 hover:border-mist-50/18 hover:bg-mist-50/10 hover:text-mist-50'
          "
        >
          <button
            type="button"
            class="min-w-0 truncate text-left focus-visible:outline-none"
            :title="semanticItemTitle(item)"
            @click="editSemanticItem(item)"
          >
            {{ semanticItemText(item) }}
          </button>
          <button
            type="button"
            class="shrink-0 text-inherit opacity-80 transition hover:opacity-100 focus-visible:outline-none"
            :title="semanticItemTitle(item)"
            @click="removeSemanticItem(item); focusSearchAtStart()"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      </template>

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

      <span
        class="hidden min-h-6 items-center rounded-md bg-mist-50/10 px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-mist-300/80 sm:inline-flex"
        aria-hidden="true"
      >
        {{ isSearchFocused ? 'ESC' : 'CTRL+K' }}
      </span>

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
          <Calendar v-else-if="suggestion.type === 'semantic'" class="h-4 w-4 text-brass-200" />
          <Search v-else class="h-4 w-4 text-brass-200" />
          {{ suggestion.label }}
        </span>
        <span class="text-[0.65rem] uppercase tracking-[0.22em] text-mist-300">
          {{ suggestion.type === 'tag' ? 'Tag' : suggestion.type === 'semantic' ? 'Date' : 'Keyword' }}
        </span>
      </button>
    </div>

    <div
      v-if="showDatePicker"
      class="glass-panel absolute left-0 right-0 z-50 mt-2 grid gap-3 rounded-xl p-4 sm:left-auto sm:w-80"
    >
      <label class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-mist-300">
        <Calendar class="h-4 w-4 text-brass-200" />
        {{ activePill?.operator === 'from' ? 'From date' : 'To date' }}
      </label>
      <input
        type="date"
        :value="dateInputValue"
        class="min-h-11 rounded-lg border border-mist-50/10 bg-ink-950/60 px-3 text-sm font-semibold text-mist-50 outline-none focus-visible:outline-none"
        @input="selectDate"
        @keydown.enter.prevent="submitSearch()"
        @keydown.tab.prevent
        @keydown.escape.prevent="blurSearch"
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
