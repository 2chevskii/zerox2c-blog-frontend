<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Search } from '@lucide/vue'
import { useDebounceFn, useTitle } from '@vueuse/core'
import EmptyState from '@/components/EmptyState.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import PostCard from '@/components/PostCard.vue'
import { usePostsStore } from '@/stores/posts'

useTitle('0x2c.dev')

const postsStore = usePostsStore()
const {
  search,
  featuredPost,
  remainingPosts,
  hasMore,
  listError,
  isLoadingList,
  isLoadingMore,
} = storeToRefs(postsStore)

const debouncedSearch = useDebounceFn(() => postsStore.fetchPosts(true), 250)

onMounted(() => {
  if (postsStore.posts.length === 0) {
    void postsStore.fetchPosts(true)
  }
})
</script>

<template>
  <main>
    <section class="w-full border-b border-concrete-100/10 bg-[linear-gradient(180deg,rgba(51,10,29,0.34),rgba(11,10,11,0.2)_58%,rgba(11,10,11,0))]">
      <div class="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div class="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div class="grid gap-5">
            <p class="w-fit border-l-4 border-cardboard-300 bg-burgundy-900/55 px-3 py-2 text-xs font-black uppercase tracking-normal text-burgundy-100 sm:text-sm">
              Personal blog
            </p>
            <h1 class="max-w-4xl text-balance text-4xl font-black uppercase leading-[0.9] tracking-normal text-[#fff8ee] sm:text-6xl lg:text-8xl">
              Notes from the engine room
            </h1>
          </div>
          <div class="grid gap-5 lg:justify-self-end">
            <p class="max-w-xl text-pretty border-l border-concrete-100/15 pl-4 text-base font-medium leading-7 text-concrete-100 sm:text-lg sm:leading-8">
              Software engineering, systems design, backend architecture, and experiments from 0x2c.dev.
            </p>
            <label class="relative block max-w-xl">
              <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cardboard-200/80" />
              <input
                v-model="search"
                type="search"
                placeholder="Search posts"
                class="h-12 w-full rounded-sm border border-concrete-100/15 bg-black/35 pl-12 pr-4 text-sm font-bold text-[#fff8ee] outline-none transition placeholder:text-concrete-300/70 focus:border-burgundy-300/70 focus:bg-burgundy-900/30 sm:h-13"
                @input="debouncedSearch"
              />
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto grid w-full max-w-7xl gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <ErrorNotice v-if="listError" :message="listError" />
      <LoadingState v-else-if="isLoadingList" />
      <EmptyState
        v-else-if="!featuredPost"
        title="No posts"
        message="There are no published posts matching the current search."
      />
      <template v-else>
        <PostCard :post="featuredPost" featured />

        <div v-if="remainingPosts.length > 0" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <PostCard v-for="post in remainingPosts" :key="post.id" :post="post" />
        </div>

        <div v-if="hasMore" class="flex justify-center pt-2">
          <button
            type="button"
            class="rounded-sm border border-burgundy-300/35 bg-burgundy-700 px-5 py-3 text-sm font-black uppercase tracking-normal text-burgundy-50 shadow-[4px_4px_0_rgba(196,122,55,0.45)] transition hover:border-burgundy-200 hover:bg-burgundy-600 disabled:cursor-wait disabled:opacity-60"
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
