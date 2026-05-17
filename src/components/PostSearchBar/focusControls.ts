import { nextTick, watch, type Ref } from 'vue'
import { onClickOutside, useActiveElement, useFocusWithin } from '@vueuse/core'
import type { CaretPlacement } from './types'

const CARET_PRESERVING_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab']

export interface SearchFocusControlsOptions {
  activePillId: Ref<string | null>
  caretIndex: Ref<number>
  isAutocompleteDismissed: Ref<boolean>
  modelValue: () => string
  rootElement: Ref<HTMLElement | null>
  searchInput: Ref<HTMLInputElement | null>
}

export function useSearchFocusControls({
  activePillId,
  caretIndex,
  isAutocompleteDismissed,
  modelValue,
  rootElement,
  searchInput,
}: SearchFocusControlsOptions) {
  const { focused: isSearchFocused } = useFocusWithin(rootElement)
  const activeElement = useActiveElement()

  watch(isSearchFocused, (focused) => {
    if (!focused) {
      isAutocompleteDismissed.value = true
    }
  })

  function blurSearch() {
    const element = activeElement.value

    if (element instanceof HTMLElement && rootElement.value?.contains(element)) {
      element.blur()
    }

    searchInput.value?.blur()
    isAutocompleteDismissed.value = true
  }

  onClickOutside(rootElement, () => {
    if (isSearchFocused.value) {
      blurSearch()
    }
  })

  function updateCaret(event: Event) {
    const input = event.target as HTMLInputElement
    caretIndex.value = input.selectionStart ?? input.value.length
    activePillId.value = null

    if (event instanceof KeyboardEvent && CARET_PRESERVING_KEYS.includes(event.key)) {
      return
    }

    isAutocompleteDismissed.value = false
  }

  function isMainInputAtStart() {
    if (!searchInput.value) {
      return modelValue().length === 0
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
      const value = modelValue()

      searchInput.value?.focus()
      searchInput.value?.setSelectionRange(value.length, value.length)
    })
  }

  function focusPillInput(id: string, caretPlacement: CaretPlacement = 'end') {
    const pillInput = rootElement.value?.querySelector<HTMLInputElement>(`[data-pill-input="${id}"]`)
    const caretPosition = caretPlacement === 'start' ? 0 : (pillInput?.value.length ?? 0)

    pillInput?.focus()
    pillInput?.setSelectionRange(caretPosition, caretPosition)
  }

  return {
    blurSearch,
    focusPillInput,
    focusSearch,
    focusSearchAtEnd,
    focusSearchAtStart,
    isMainInputAtStart,
    isSearchFocused,
    updateCaret,
  }
}
