<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, CalendarDays, Clock, ThumbsDown, ThumbsUp } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import PostArtwork from '@/components/PostArtwork.vue'
import TagPill from '@/components/TagPill.vue'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import type { PostReactionType } from '@/types/api'
import { formatLongDate } from '@/utils/dates'

const route = useRoute()
const auth = useAuthStore()
const postsStore = usePostsStore()
const {
  selectedPost,
  postError,
  reactionError,
  isLoadingPost,
  isLoadingReaction,
  isUpdatingReaction,
  selectedPostReaction,
} = storeToRefs(postsStore)

const countFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

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

watch(
  [() => selectedPost.value?.id, () => auth.isAuthenticated],
  ([postId, isAuthenticated]) => {
    if (postId && isAuthenticated) {
      void postsStore.fetchPostReaction(postId)
      return
    }

    postsStore.clearSelectedPostReaction()
  },
)

function formatCount(value: number | null | undefined) {
  return countFormatter.format(value ?? 0)
}

function isSelectedReaction(reaction: PostReactionType) {
  return selectedPostReaction.value === reaction
}

function reactionButtonClass(reaction: PostReactionType) {
  return [
    'inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
    isSelectedReaction(reaction)
      ? 'border-brass-200/70 bg-brass-200/16 text-brass-100'
      : 'border-mist-50/10 bg-mist-50/6 text-mist-100 hover:border-brass-200/45 hover:bg-brass-200/10 hover:text-brass-100',
  ]
}

function updateReaction(reaction: PostReactionType) {
  if (!selectedPost.value || !auth.isAuthenticated || isUpdatingReaction.value) {
    return
  }

  void postsStore.updatePostReaction(selectedPost.value.id, reaction)
}
</script>

<template>
  <main class="relative mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
    <RouterLink
      to="/"
      class="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-mist-50/10 bg-mist-50/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-mist-100 transition hover:border-brass-200/45 hover:bg-brass-200/10 hover:text-brass-100"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to notes
    </RouterLink>

    <LoadingState v-if="isLoadingPost" />
    <ErrorNotice v-else-if="postError" :message="postError" />

    <article v-else-if="selectedPost" class="grid gap-8">
      <header class="grid gap-6 pt-2">
        <div class="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-mist-300">
          <span class="inline-flex items-center gap-2">
            <CalendarDays class="h-4 w-4 text-brass-200" :stroke-width="1.8" />
            {{ formatLongDate(selectedPost.publishedAt) }}
          </span>
          <span class="h-px w-8 bg-brass-300/70" />
          <span class="inline-flex items-center gap-2">
            <Clock class="h-4 w-4 text-brass-200" :stroke-width="1.8" />
            {{ readingMinutes }} min read
          </span>
        </div>

        <div class="grid gap-5">
          <h1 class="max-w-5xl text-balance font-display text-5xl font-bold leading-[0.9] tracking-[-0.075em] text-mist-50 sm:text-7xl lg:text-8xl">
            {{ selectedPost.title }}
          </h1>
          <p v-if="selectedPost.subtitle" class="max-w-3xl border-l border-brass-200/35 pl-5 text-pretty text-lg leading-8 text-mist-200 sm:text-xl">
            {{ selectedPost.subtitle }}
          </p>
          <div v-if="selectedPost.tags.length > 0" class="flex flex-wrap gap-2">
            <TagPill v-for="tag in selectedPost.tags" :key="tag.id" :name="tag.name" accent />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <template v-if="auth.isAuthenticated">
            <button
              type="button"
              :class="reactionButtonClass('Like')"
              :aria-pressed="isSelectedReaction('Like')"
              :disabled="isLoadingReaction || isUpdatingReaction"
              @click="updateReaction('Like')"
            >
              <ThumbsUp class="h-4 w-4" :stroke-width="1.9" />
              {{ formatCount(selectedPost.likeCount) }}
            </button>
            <button
              type="button"
              :class="reactionButtonClass('Dislike')"
              :aria-pressed="isSelectedReaction('Dislike')"
              :disabled="isLoadingReaction || isUpdatingReaction"
              @click="updateReaction('Dislike')"
            >
              <ThumbsDown class="h-4 w-4" :stroke-width="1.9" />
              {{ formatCount(selectedPost.dislikeCount) }}
            </button>
          </template>
          <template v-else>
            <span class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist-50/10 bg-mist-50/6 px-4 py-2 text-sm font-bold text-mist-100">
              <ThumbsUp class="h-4 w-4 text-mist-300" :stroke-width="1.9" />
              {{ formatCount(selectedPost.likeCount) }}
            </span>
            <span class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist-50/10 bg-mist-50/6 px-4 py-2 text-sm font-bold text-mist-100">
              <ThumbsDown class="h-4 w-4 text-mist-300" :stroke-width="1.9" />
              {{ formatCount(selectedPost.dislikeCount) }}
            </span>
            <RouterLink
              to="/auth"
              class="inline-flex min-h-11 items-center rounded-xl border border-brass-200/35 bg-brass-200/10 px-4 py-2 text-sm font-bold text-brass-100 transition hover:border-brass-200/60 hover:bg-brass-200/16"
            >
              Sign in to react
            </RouterLink>
          </template>
          <p v-if="reactionError" class="text-sm font-semibold text-red-200">
            {{ reactionError }}
          </p>
        </div>
      </header>

      <PostArtwork :image-id="imageId" :title="selectedPost.title" large priority class="rounded-xl border border-mist-50/10" />

      <section class="article-shell px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div class="article-body mx-auto" v-html="articleHtml" />
      </section>
    </article>
  </main>
</template>
