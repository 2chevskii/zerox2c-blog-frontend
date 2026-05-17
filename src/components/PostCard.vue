<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Eye, MessageCircle, ThumbsDown, ThumbsUp } from '@lucide/vue'
import PostArtwork from '@/components/PostArtwork.vue'
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
const coverImageId = computed(() => props.post.coverImageId ?? props.post.bannerImageId)
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
    <article class="grid h-full gap-5 rounded-xl bg-transparent p-3 transition duration-200 group-hover:bg-[#252525] group-hover:shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:gap-6 sm:p-5 lg:gap-7 lg:p-6">
      <PostArtwork
        :image-id="coverImageId"
        :title="post.title"
        class="rounded-xl border border-mist-50/10"
      />

      <div class="grid gap-4 px-1 pb-1 sm:gap-5 sm:px-2 lg:px-3 lg:pb-2">
        <div class="flex flex-wrap items-center gap-3 text-xs font-semibold text-mist-300 sm:text-sm">
          <span class="inline-flex items-center gap-1.5">
            <CalendarDays class="h-3.5 w-3.5 text-mist-300 sm:h-4 sm:w-4" :stroke-width="1.8" />
            {{ publishedDate }}
          </span>
          <span class="inline-flex items-center gap-1.5 text-mist-200">
            <Eye class="h-3.5 w-3.5 text-brass-100 sm:h-4 sm:w-4" :stroke-width="1.8" />
            {{ formatCount(post.viewCount) }}
          </span>
        </div>

        <h2 class="max-w-4xl text-balance font-display text-3xl font-bold leading-none text-mist-50 transition group-hover:text-brass-100 sm:text-4xl lg:text-5xl">
          {{ post.title }}
        </h2>

        <p v-if="post.subtitle" class="max-w-3xl text-pretty text-base leading-7 text-mist-200 sm:text-lg sm:leading-8">
          {{ post.subtitle }}
        </p>

        <div v-if="visibleTags.length > 0" class="flex flex-wrap gap-2">
          <TagPill v-for="tag in visibleTags" :key="tag.id" :name="tag.name" />
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs font-bold text-mist-100 sm:text-sm">
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-mist-50/10 bg-mist-50/[0.035] px-2.5 py-1.5 transition group-hover:bg-[#303030]">
            <ThumbsUp class="h-3.5 w-3.5 text-mist-300 sm:h-4 sm:w-4" :stroke-width="1.8" />
            {{ formatCount(post.likeCount) }}
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-mist-50/10 bg-mist-50/[0.035] px-2.5 py-1.5 transition group-hover:bg-[#303030]">
            <ThumbsDown class="h-3.5 w-3.5 text-mist-300 sm:h-4 sm:w-4" :stroke-width="1.8" />
            {{ formatCount(post.dislikeCount) }}
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-mist-50/10 bg-mist-50/[0.035] px-2.5 py-1.5 transition group-hover:bg-[#303030]">
            <MessageCircle class="h-3.5 w-3.5 text-mist-300 sm:h-4 sm:w-4" :stroke-width="1.8" />
            {{ formatCount(post.commentCount) }}
          </span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>
