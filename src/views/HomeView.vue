<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn, useTitle } from '@vueuse/core'
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

const debouncedSearch = useDebounceFn(() => fetchPostsFromStart(), 250)

onMounted(() => {
  void postsStore.fetchTags()

  if (postsStore.posts.length === 0) {
    void postsStore.fetchPosts(true)
  }
})

function fetchPostsFromStart() {
  void postsStore.fetchPosts(true)
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
  <main class="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
    <section class="sticky top-[4.25rem] z-40 -mx-4 bg-[#1d1d1d]/92 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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

      <div v-if="hasMore" class="flex justify-center pt-3">
        <button
          type="button"
          class="min-h-11 rounded-xl border border-brass-200/30 bg-brass-200/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-brass-100 transition hover:border-brass-200/55 hover:bg-brass-200/15 disabled:opacity-60"
          :disabled="isLoadingMore"
          @click="postsStore.fetchPosts()"
        >
          {{ isLoadingMore ? 'Loading' : 'Load more' }}
        </button>
      </div>
    </template>
  </main>
</template>
