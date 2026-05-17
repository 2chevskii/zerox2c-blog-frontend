<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, CalendarDays, Clock } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import PostArtwork from '@/components/PostArtwork.vue'
import TagPill from '@/components/TagPill.vue'
import { usePostsStore } from '@/stores/posts'
import { formatLongDate } from '@/utils/dates'

const route = useRoute()
const postsStore = usePostsStore()
const { selectedPost, postError, isLoadingPost } = storeToRefs(postsStore)

const slugOrId = computed(() => String(route.params.slug ?? ''))
const articleHtml = computed(() => selectedPost.value?.bodyHtml ?? '')
const readingMinutes = computed(() => selectedPost.value?.readingMinutes ?? 1)
const imageId = computed(() => selectedPost.value?.bannerImageId ?? selectedPost.value?.coverImageId ?? null)
const pageTitle = computed(() =>
  selectedPost.value ? `${selectedPost.value.title} | 0x2c.dev` : '0x2c.dev',
)

useTitle(pageTitle)

watch(
  slugOrId,
  (value) => {
    if (value) {
      void postsStore.fetchPost(value)
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="mx-auto grid max-w-5xl gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <RouterLink
      to="/"
      class="inline-flex w-fit items-center gap-2 rounded-sm border border-concrete-100/10 bg-concrete-900/70 px-3 py-2 text-xs font-black uppercase tracking-normal text-concrete-100 transition hover:border-burgundy-300/50 hover:text-burgundy-100"
    >
      <ArrowLeft class="h-4 w-4" />
      Back
    </RouterLink>

    <LoadingState v-if="isLoadingPost" />
    <ErrorNotice v-else-if="postError" :message="postError" />

    <article v-else-if="selectedPost" class="grid gap-8">
      <header class="grid gap-6">
        <div class="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-normal text-concrete-300">
          <span class="inline-flex items-center gap-2">
            <CalendarDays class="h-4 w-4" :stroke-width="1.8" />
            {{ formatLongDate(selectedPost.publishedAt) }}
          </span>
          <span class="h-1 w-5 bg-cardboard-300/70" />
          <span class="inline-flex items-center gap-2">
            <Clock class="h-4 w-4" :stroke-width="1.8" />
            {{ readingMinutes }} min read
          </span>
        </div>

        <div class="grid gap-4">
          <h1 class="text-balance text-4xl font-black uppercase leading-[0.9] tracking-normal text-[#fff8ee] sm:text-6xl lg:text-7xl">
            {{ selectedPost.title }}
          </h1>
          <p v-if="selectedPost.subtitle" class="max-w-3xl border-l border-concrete-100/15 pl-4 text-pretty text-lg leading-8 text-concrete-100 sm:text-xl">
            {{ selectedPost.subtitle }}
          </p>
          <div v-if="selectedPost.tags.length > 0" class="flex flex-wrap gap-2">
            <TagPill v-for="tag in selectedPost.tags" :key="tag.id" :name="tag.name" />
          </div>
        </div>
      </header>

      <PostArtwork :image-id="imageId" :title="selectedPost.title" large class="rounded-sm border border-concrete-100/10" />

      <div class="article-body" v-html="articleHtml" />
    </article>
  </main>
</template>
