<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Eye, MessageCircle, ThumbsDown, ThumbsUp } from '@lucide/vue'
import TagPill from '@/components/TagPill.vue'
import type { PostListItemResponse } from '@/types/api'
import { formatShortDate } from '@/utils/dates'

type CountValue = number | null | undefined

const countFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const props = defineProps<{
  post: PostListItemResponse
}>()

const postUrl = computed(() => `/posts/${props.post.slug ?? props.post.id}`)
const visibleTags = computed(() => props.post.tags.slice(0, 4))
const publishedDate = computed(() => formatShortDate(props.post.publishedAt))

function formatCount(value: CountValue) {
  return countFormatter.format(value ?? 0)
}
</script>

<template>
  <RouterLink
    :to="postUrl"
    class="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-200"
    :aria-label="`Read ${post.title}`"
  >
    <article class="grid h-full min-h-64 gap-4 rounded-xl bg-[#252525] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)] transition duration-200 group-hover:bg-[#282828]">
      <h2 class="text-balance font-display text-2xl font-bold leading-none tracking-[-0.045em] text-mist-50 transition group-hover:text-brass-100">
        {{ post.title }}
      </h2>

      <div class="flex flex-wrap items-center gap-3 text-xs font-semibold text-mist-300">
        <span class="inline-flex items-center gap-1.5">
          <CalendarDays class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
          {{ publishedDate }}
        </span>
        <span class="inline-flex items-center gap-1.5 text-mist-200">
          <Eye class="h-3.5 w-3.5 text-brass-100" :stroke-width="1.8" />
          {{ formatCount(post.viewCount) }}
        </span>
      </div>

      <div v-if="visibleTags.length > 0" class="flex flex-wrap gap-2">
        <TagPill v-for="tag in visibleTags" :key="tag.id" :name="tag.name" />
      </div>

      <p v-if="post.subtitle" class="text-pretty text-sm leading-6 text-mist-200">
        {{ post.subtitle }}
      </p>

      <div class="mt-auto flex flex-wrap items-center gap-2 text-xs font-bold text-mist-100">
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-[#303030] px-2.5 py-1.5">
          <ThumbsUp class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
          {{ formatCount(post.likeCount) }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-[#303030] px-2.5 py-1.5">
          <ThumbsDown class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
          {{ formatCount(post.dislikeCount) }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-[#303030] px-2.5 py-1.5">
          <MessageCircle class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
          {{ formatCount(post.commentCount) }}
        </span>
      </div>
    </article>
  </RouterLink>
</template>
