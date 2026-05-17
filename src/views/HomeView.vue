<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn, useInfiniteScroll, useTitle, useWindowScroll } from '@vueuse/core'
import EmptyState from '@/components/EmptyState.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import PostMosaic from '@/components/PostMosaic.vue'
import PostSearchBar from '@/components/PostSearchBar'
import { usePostsStore } from '@/stores/posts'
import type { PostSearchDateFilter, TagResponse } from '@/types/api'

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

const searchModel = computed({
  get: () => search.value,
  set: (value: string) => postsStore.setSearch(value),
})

const { y: scrollY } = useWindowScroll()
const lastInfiniteLoadY = ref(0)
const debouncedSearch = useDebounceFn(() => fetchPostsFromStart(), 250)

const { reset: resetInfiniteScroll } = useInfiniteScroll(
  window,
  async () => {
    await postsStore.fetchPosts()
    lastInfiniteLoadY.value = scrollY.value
  },
  {
    distance: 600,
    interval: 300,
    canLoadMore: () =>
      scrollY.value > lastInfiniteLoadY.value &&
      posts.value.length > 0 &&
      hasMore.value &&
      !isLoadingList.value &&
      !isLoadingMore.value &&
      !listError.value,
  },
)

onMounted(() => {
  void postsStore.fetchTags()

  if (postsStore.posts.length === 0) {
    void postsStore.fetchPosts(true)
  }
})

async function fetchPostsFromStart() {
  await postsStore.fetchPosts(true)
  lastInfiniteLoadY.value = scrollY.value
  resetInfiniteScroll()
}

function selectTag(tag: TagResponse) {
  postsStore.addTag(tag)
  fetchPostsFromStart()
}

function removeTag(name: string) {
  postsStore.removeTag(name)
  fetchPostsFromStart()
}

function updateDateFilters(dateFilters: PostSearchDateFilter[]) {
  postsStore.setDateFilters(dateFilters)
}
</script>

<template>
  <main class="mx-auto grid w-full max-w-7xl gap-0 px-4 pb-5 pt-0 sm:px-6 sm:pb-7 lg:px-8 lg:pt-4">
    <section class="sticky top-[5.25rem] z-40 py-4 lg:hidden">
      <PostSearchBar
        v-model="searchModel"
        :selected-tags="selectedTags"
        :available-tags="availableTags"
        :is-loading="isLoadingList || isLoadingMore"
        @search="debouncedSearch"
        @select-tag="selectTag"
        @remove-tag="removeTag"
        @date-filters-change="updateDateFilters"
      />
    </section>

    <ErrorNotice v-if="listError" :message="listError" />
    <LoadingState v-else-if="isLoadingList" />
    <EmptyState
      v-else-if="posts.length === 0"
      title="No posts"
      message="There are no published posts matching the current search."
    />
    <template v-else>
      <PostMosaic :posts="posts" />

      <div v-if="isLoadingMore" class="flex justify-center pt-4" aria-live="polite">
        <div
          class="flex min-h-11 items-center gap-3 rounded-full border border-brass-200/25 bg-brass-200/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-brass-100"
          role="status"
        >
          <span class="relative flex size-4" aria-hidden="true">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-brass-200/40" />
            <span class="relative inline-flex size-4 rounded-full border-2 border-brass-100/80 border-t-transparent animate-spin" />
          </span>
          Loading
        </div>
      </div>
    </template>
  </main>
</template>
