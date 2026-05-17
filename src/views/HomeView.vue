<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Search, X } from '@lucide/vue'
import { useDebounceFn, useTitle } from '@vueuse/core'
import EmptyState from '@/components/EmptyState.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import PostCard from '@/components/PostCard.vue'
import { usePostsStore } from '@/stores/posts'
import type { PostListItemResponse, TagResponse } from '@/types/api'

useTitle('0x2c.dev')

const postsStore = usePostsStore()
const {
  posts,
  search,
  selectedTags,
  availableTags,
  hasMore,
  listError,
  isLoadingList,
  isLoadingMore,
} = storeToRefs(postsStore)

const searchInput = ref<HTMLInputElement | null>(null)
const isTagMenuOpen = ref(false)
const debouncedSearch = useDebounceFn(() => postsStore.fetchPosts(true), 250)

const tagNeedle = computed(() => {
  const hashMatch = search.value.match(/(?:^|\s)#([a-z0-9-]*)$/i)
  if (hashMatch) {
    return hashMatch[1].toLowerCase()
  }

  const trimmedSearch = search.value.trim().toLowerCase()
  return trimmedSearch.includes(' ') ? '' : trimmedSearch
})

const tagSuggestions = computed(() => {
  const selectedNames = new Set(selectedTags.value.map((tag) => tag.name))
  const needle = tagNeedle.value

  return availableTags.value
    .filter((tag) => !selectedNames.has(tag.name))
    .filter((tag) => needle.length === 0 || tag.name.includes(needle))
    .slice(0, 6)
})

const showTagSuggestions = computed(
  () => isTagMenuOpen.value && tagSuggestions.value.length > 0,
)

const cardGroups = computed(() => {
  const source = posts.value
  const groups: { id: string, leading: PostListItemResponse[], mini: PostListItemResponse[] }[] = []

  for (let i = 0; i < source.length; i += 6) {
    groups.push({
      id: `group-${Math.floor(i / 6)}`,
      leading: source.slice(i, i + 2),
      mini: source.slice(i + 2, i + 6),
    })
  }

  return groups
})

onMounted(() => {
  void postsStore.fetchTags()

  if (postsStore.posts.length === 0) {
    void postsStore.fetchPosts(true)
  }
})

function onSearchInput() {
  isTagMenuOpen.value = true
  debouncedSearch()
}

function selectTag(tag: TagResponse) {
  postsStore.addTag(tag)
  clearCompletedTagToken(tag.name)
  isTagMenuOpen.value = false
  void postsStore.fetchPosts(true)
  void nextTick(() => searchInput.value?.focus())
}

function removeTag(name: string) {
  postsStore.removeTag(name)
  void postsStore.fetchPosts(true)
}

function onSearchKeydown(event: KeyboardEvent) {
  const firstSuggestion = tagSuggestions.value[0]

  if (event.key === 'Enter' && firstSuggestion) {
    event.preventDefault()
    selectTag(firstSuggestion)
    return
  }

  if (event.key === 'Backspace' && search.value.length === 0 && selectedTags.value.length > 0) {
    removeTag(selectedTags.value[selectedTags.value.length - 1].name)
    return
  }

  if (event.key === 'Escape') {
    isTagMenuOpen.value = false
  }
}

function clearCompletedTagToken(tagName: string) {
  const hashToken = /(?:^|\s)#[a-z0-9-]*$/i

  if (hashToken.test(search.value)) {
    search.value = search.value.replace(hashToken, '').trimEnd()
    return
  }

  if (search.value.trim().toLowerCase() === tagName) {
    search.value = ''
  }
}
</script>

<template>
  <main>
    <section class="w-full border-b border-concrete-100/10 bg-concrete-900/45">
      <div class="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div class="relative max-w-3xl">
          <label class="sr-only" for="post-search">Search posts</label>
          <div
            class="relative flex min-h-13 w-full flex-wrap items-center gap-2 rounded-sm border border-concrete-100/15 bg-concrete-900/30 py-2 pl-11 pr-3 transition focus-within:border-concrete-100/40 focus-within:bg-concrete-900/45"
          >
            <Search class="pointer-events-none absolute left-4 top-4 h-5 w-5 text-concrete-300" />

            <button
              v-for="tag in selectedTags"
              :key="tag.id"
              type="button"
              class="inline-flex h-8 max-w-full items-center gap-1.5 rounded-sm border border-concrete-100/15 bg-concrete-100/10 px-2.5 text-xs font-bold uppercase tracking-normal text-concrete-100 transition hover:border-concrete-100/35 hover:bg-concrete-100/15"
              :title="`Remove ${tag.name}`"
              @click="removeTag(tag.name)"
            >
              <span class="truncate">{{ tag.name }}</span>
              <X class="h-3.5 w-3.5" />
            </button>

            <input
              id="post-search"
              ref="searchInput"
              v-model="search"
              type="search"
              :placeholder="selectedTags.length > 0 ? 'Search posts' : 'Search posts or #tag'"
              class="h-8 min-w-36 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-[#f4f4f4] outline-none placeholder:text-concrete-300/75"
              autocomplete="off"
              @focus="isTagMenuOpen = true"
              @blur="isTagMenuOpen = false"
              @input="onSearchInput"
              @keydown="onSearchKeydown"
            />
          </div>

          <div
            v-if="showTagSuggestions"
            class="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-sm border border-concrete-100/15 bg-concrete-900 shadow-2xl"
          >
            <button
              v-for="tag in tagSuggestions"
              :key="tag.id"
              type="button"
              class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-concrete-100 transition hover:bg-concrete-100/10"
              @mousedown.prevent="selectTag(tag)"
            >
              <span>{{ tag.name }}</span>
              <span class="text-xs uppercase tracking-normal text-concrete-300">Tag</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto grid w-full max-w-7xl gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <ErrorNotice v-if="listError" :message="listError" />
      <LoadingState v-else-if="isLoadingList" />
      <EmptyState
        v-else-if="posts.length === 0"
        title="No posts"
        message="There are no published posts matching the current search."
      />
      <template v-else>
        <div class="grid gap-7">
          <div
            v-for="group in cardGroups"
            :key="group.id"
            class="grid gap-5 grid-cols-1 md:grid-cols-3"
          >
            <PostCard
              v-for="post in group.leading"
              :key="post.id"
              :post="post"
              class="md:col-span-1"
            />

            <div
              v-if="group.mini.length > 0"
              class="grid grid-cols-2 gap-3 md:col-span-1"
            >
              <PostCard
                v-for="post in group.mini"
                :key="post.id"
                :post="post"
                compact
                class="h-full"
              />
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="flex justify-center pt-2">
          <button
            type="button"
            class="rounded-sm border border-concrete-100/15 bg-concrete-100/10 px-5 py-3 text-sm font-black uppercase tracking-normal text-concrete-100 transition hover:border-concrete-100/35 hover:bg-concrete-100/15 disabled:cursor-wait disabled:opacity-60"
            :disabled="isLoadingMore"
            @click="postsStore.fetchPosts()"
          >
            {{ isLoadingMore ? 'Loading' : 'Load more' }}
          </button>
        </div>
      </template>
    </section>
  </main>
</template>
