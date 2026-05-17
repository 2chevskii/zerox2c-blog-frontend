import { computed, nextTick, ref, type Ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import type { TagResponse } from '@/types/api'
import { getActiveToken, replaceToken, withoutToken } from './searchTokens'
import {
  getSemanticPillFromToken,
  isValidDate,
} from './semanticFilters'
import {
  buildOrderedSemanticItems,
  pillPrefix,
  pillTitle,
  semanticItemText,
  semanticItemTitle,
} from './semanticItems'
import { usePostSearchAutocomplete } from './useAutocomplete'
import { useSearchFocusControls } from './focusControls'
import { useSemanticTokenOrder } from './semanticOrder'
import type {
  ActiveToken,
  AutocompleteSuggestion,
  CaretPlacement,
  DateFilter,
  PillCompletionOptions,
  PostSearchBarEmit,
  PostSearchBarProps,
  RenderSemanticItem,
  SemanticPill,
  SemanticPillDraft,
  SemanticTokenOrderItem,
} from './types'

export interface PostSearchBarElementRefs {
  rootElement: Ref<HTMLElement | null>
  searchInput: Ref<HTMLInputElement | null>
}

export function usePostSearchBar(
  props: PostSearchBarProps,
  emit: PostSearchBarEmit,
  { rootElement, searchInput }: PostSearchBarElementRefs,
) {
  const isAutocompleteDismissed = ref(false)
  const caretIndex = ref(0)
  const selectedDateFilters = ref<DateFilter[]>([])
  const draftPills = ref<SemanticPill[]>([])
  const semanticTokenOrder = ref<SemanticTokenOrderItem[]>([])
  const activePillId = ref<string | null>(null)
  let nextPillId = 1

  const activeToken = computed(() => getActiveToken(props.modelValue, caretIndex.value))
  const activePill = computed(() => draftPills.value.find((pill) => pill.id === activePillId.value) ?? null)

  const {
    appendOrderItem,
    appendTagOrder,
    removeOrderItems,
    replaceDraftOrderItem,
    replaceOrderAtIndex,
  } = useSemanticTokenOrder(semanticTokenOrder)

  const orderedSemanticItems = computed<RenderSemanticItem[]>(() =>
    buildOrderedSemanticItems({
      orderItems: semanticTokenOrder.value,
      selectedTags: props.selectedTags,
      selectedDateFilters: selectedDateFilters.value,
      draftPills: draftPills.value,
    }),
  )

  const {
    blurSearch,
    focusPillInput,
    focusSearch,
    focusSearchAtEnd,
    focusSearchAtStart,
    isMainInputAtStart,
    isSearchFocused,
    updateCaret,
  } = useSearchFocusControls({
    activePillId,
    caretIndex,
    isAutocompleteDismissed,
    modelValue: () => props.modelValue,
    rootElement,
    searchInput,
  })

  const {
    activeDescendantId,
    activeSuggestionIndex,
    autocompleteSuggestions,
    showAutocomplete,
  } = usePostSearchAutocomplete({
    activePill,
    activeToken,
    isAutocompleteDismissed,
    isSearchFocused,
    props,
  })

  const showDatePicker = computed(
    () => isSearchFocused.value && activePill.value?.type === 'date' && activePill.value.isEditing,
  )

  const dateInputValue = computed(() => {
    const dateValue = activePill.value?.type === 'date' ? activePill.value.value : ''
    return isValidDate(dateValue) ? dateValue : ''
  })

  onKeyStroke(
    (event) => event.key.toLowerCase() === 'k' && event.ctrlKey,
    (event) => {
      event.preventDefault()
      isAutocompleteDismissed.value = false
      focusSearchAtEnd()
    },
  )

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
    setDateFilters(selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== operator))
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

  function createDraftPill(draft: SemanticPillDraft, value: string, token: ActiveToken) {
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
      setDateFilters(selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== pill.operator))
    }

    draftPills.value = [...draftPills.value, pill]
    appendOrderItem({ id: `order-${pill.id}`, kind: 'draft', draftId: pill.id })
    activePillId.value = pill.id
    emit('update:modelValue', withoutToken(value, token))
    isAutocompleteDismissed.value = false
    emit('search')
    void nextTick(() => focusPillInput(pill.id))
  }

  function createPill(draft: SemanticPillDraft): SemanticPill {
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

  function setDateFilter(operator: DateFilter['operator'], dateValue: string) {
    setDateFilters([
      ...selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== operator),
      { operator, dateValue },
    ])
  }

  function setDateFilters(dateFilters: DateFilter[]) {
    selectedDateFilters.value = dateFilters
    emit('date-filters-change', dateFilters.map((dateFilter) => ({ ...dateFilter })))
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
    setDateFilters(
      selectedDateFilters.value.filter((dateFilter) => dateFilter.operator !== item.dateFilter.operator),
    )
    draftPills.value = [...draftPills.value, pill]
    activePillId.value = pill.id
    emit('search')
    isAutocompleteDismissed.value = false
    void nextTick(() => focusPillInput(pill.id, caretPlacement))
  }

  function withoutCompletedToken() {
    return withoutToken(props.modelValue, activeToken.value)
  }

  function replaceCompletedToken(replacement: string) {
    const replacedToken = replaceToken(props.modelValue, activeToken.value, replacement)

    emit('update:modelValue', replacedToken.value)
    caretIndex.value = replacedToken.caretIndex
  }

  return {
    activeDescendantId,
    activePill,
    activeSuggestionIndex,
    autocompleteSuggestions,
    blurSearch,
    dateInputValue,
    isSearchFocused,
    onPillInput,
    onPillKeydown,
    onSearchInput,
    onSearchKeydown,
    orderedSemanticItems,
    pillPrefix,
    pillTitle,
    removeDraftPill,
    removeSemanticItem,
    selectDate,
    selectSuggestion,
    semanticItemText,
    semanticItemTitle,
    showAutocomplete,
    showDatePicker,
    updateCaret,
    activatePill,
    editSemanticItem,
    focusSearchAtStart,
    submitSearch,
  }
}
