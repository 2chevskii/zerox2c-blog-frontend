<script setup lang="ts">
import { Calendar, Hash, Search, X } from '@lucide/vue'
import { ref } from 'vue'
import { usePostSearchBar } from './usePostSearchBar'
import type { PostSearchBarEmits, PostSearchBarProps } from './types'

const props = defineProps<PostSearchBarProps>()
const emit = defineEmits<PostSearchBarEmits>()
const rootElement = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const {
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
} = usePostSearchBar(props, emit, { rootElement, searchInput })
</script>

<template>
  <Teleport to="body">
    <button
      v-if="isSearchFocused"
      type="button"
      class="fixed inset-0 z-30 cursor-default border-0 bg-transparent p-0 focus-visible:outline-none"
      aria-label="Close search"
      @mousedown.prevent="blurSearch"
    />
  </Teleport>

  <div
    ref="rootElement"
    class="relative mx-auto w-full"
    :class="[compact ? 'max-w-[34rem]' : 'max-w-3xl', isSearchFocused ? 'z-50' : '']"
  >
    <label class="sr-only" for="post-search">Search posts</label>
    <div
      class="relative z-50 flex w-full flex-wrap items-center gap-1.5 rounded-xl border bg-[#252525]/92 pl-12 pr-3 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-[18px] transition duration-200"
      :class="[
        compact ? 'min-h-11 py-1.5' : 'min-h-13 py-2.5',
        isSearchFocused ? 'border-brass-200/40' : 'border-mist-50/0',
      ]"
    >
      <Search
        class="pointer-events-none absolute left-4 h-5 w-5 text-brass-100/80"
        :class="compact ? 'top-3' : 'top-4'"
      />

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

      <span
        v-if="isLoading"
        class="hidden rounded-lg border border-mist-50/10 bg-mist-50/6 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-mist-300 sm:inline-flex"
      >
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
