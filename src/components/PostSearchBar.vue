<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Hash, Search, X } from '@lucide/vue'
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
const isTagMenuOpen = ref(false)
const isSearchFocused = ref(false)

const tagNeedle = computed(() => {
  const hashMatch = props.modelValue.match(/(?:^|\s)#([a-z0-9-]*)$/i)
  if (hashMatch) {
    return hashMatch[1].toLowerCase()
  }

  const trimmedSearch = props.modelValue.trim().toLowerCase()
  return trimmedSearch.includes(' ') ? '' : trimmedSearch
})

const tagSuggestions = computed(() => {
  const selectedNames = new Set(props.selectedTags.map((tag) => tag.name))
  const needle = tagNeedle.value

  return props.availableTags
    .filter((tag) => !selectedNames.has(tag.name))
    .filter((tag) => needle.length === 0 || tag.name.includes(needle))
    .slice(0, 6)
})

const showTagSuggestions = computed(
  () => isTagMenuOpen.value && tagSuggestions.value.length > 0,
)

function updateSearch(value: string) {
  emit('update:modelValue', value)
  isTagMenuOpen.value = true
  emit('search')
}

function onSearchInput(event: Event) {
  updateSearch((event.target as HTMLInputElement).value)
}

function selectTag(tag: TagResponse) {
  emit('update:modelValue', withoutCompletedTagToken(tag.name))
  emit('select-tag', tag)
  isTagMenuOpen.value = false
  void nextTick(() => searchInput.value?.focus())
}

function removeTag(name: string) {
  emit('remove-tag', name)
  void nextTick(() => searchInput.value?.focus())
}

function onSearchKeydown(event: KeyboardEvent) {
  const firstSuggestion = tagSuggestions.value[0]

  if (event.key === 'Enter' && firstSuggestion) {
    event.preventDefault()
    selectTag(firstSuggestion)
    return
  }

  if (event.key === 'Backspace' && props.modelValue.length === 0 && props.selectedTags.length > 0) {
    removeTag(props.selectedTags[props.selectedTags.length - 1].name)
    return
  }

  if (event.key === 'Escape') {
    isTagMenuOpen.value = false
  }
}

function withoutCompletedTagToken(tagName: string) {
  const hashToken = /(?:^|\s)#[a-z0-9-]*$/i

  if (hashToken.test(props.modelValue)) {
    return props.modelValue.replace(hashToken, '').trimEnd()
  }

  if (props.modelValue.trim().toLowerCase() === tagName) {
    return ''
  }

  return props.modelValue
}
</script>

<template>
  <div class="relative mx-auto w-full max-w-3xl">
    <label class="sr-only" for="post-search">Search posts</label>
    <div
      class="glass-panel relative flex min-h-13 w-full flex-wrap items-center gap-2 rounded-xl py-2.5 pl-12 pr-3 transition duration-200 focus-within:border-brass-200/45 focus-within:bg-ink-900/90"
      :class="isSearchFocused ? 'shadow-[0_14px_38px_rgba(0,0,0,0.35)]' : ''"
    >
      <Search class="pointer-events-none absolute left-4 top-4 h-5 w-5 text-brass-100/80" />

      <button
        v-for="tag in selectedTags"
        :key="tag.id"
        type="button"
        class="inline-flex min-h-8 max-w-full items-center gap-2 rounded-lg border border-brass-200/32 bg-brass-200/12 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brass-100 transition hover:border-brass-200/55 hover:bg-brass-200/15"
        :title="`Remove ${tag.name}`"
        @click="removeTag(tag.name)"
      >
        <span class="truncate">{{ tag.name }}</span>
        <X class="h-3.5 w-3.5" />
      </button>

      <input
        id="post-search"
        ref="searchInput"
        :value="modelValue"
        type="search"
        :placeholder="selectedTags.length > 0 ? 'Search selected notes' : 'Search notes or type #tag'"
        class="min-h-8 min-w-40 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-mist-50 outline-none placeholder:text-mist-300/75"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="showTagSuggestions"
        aria-controls="tag-suggestions"
        @focus="isTagMenuOpen = true; isSearchFocused = true"
        @blur="isTagMenuOpen = false; isSearchFocused = false"
        @input="onSearchInput"
        @keydown="onSearchKeydown"
      />

      <span v-if="isLoading" class="hidden rounded-lg border border-mist-50/10 bg-mist-50/6 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-mist-300 sm:inline-flex">
        Syncing
      </span>
    </div>

    <div
      v-if="showTagSuggestions"
      id="tag-suggestions"
      role="listbox"
      class="glass-panel absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl p-1"
    >
      <button
        v-for="tag in tagSuggestions"
        :key="tag.id"
        type="button"
        role="option"
        class="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-mist-100 transition hover:bg-mist-50/8 hover:text-brass-100"
        @mousedown.prevent="selectTag(tag)"
      >
        <span class="inline-flex items-center gap-2">
          <Hash class="h-4 w-4 text-brass-200" />
          {{ tag.name }}
        </span>
        <span class="text-[0.65rem] uppercase tracking-[0.22em] text-mist-300">Tag</span>
      </button>
    </div>
  </div>
</template>
