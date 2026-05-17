<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Eye, MessageCircle, ThumbsDown, ThumbsUp } from '@lucide/vue'
import PostArtwork from '@/components/PostArtwork.vue'
import TagPill from '@/components/TagPill.vue'
import type { PostListItemResponse, TagResponse } from '@/types/api'
import { formatShortDate } from '@/utils/dates'

type CountValue = number | null | undefined

const countFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const props = defineProps<{
  post: PostListItemResponse
}>()

const emit = defineEmits<{
  selectTag: [tag: TagResponse]
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
  <article class="group relative grid h-full gap-3 rounded-xl bg-transparent p-3 transition duration-200 hover:bg-[#252525] hover:shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:gap-4 sm:p-4 lg:p-5">
    <RouterLink
      :to="postUrl"
      class="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-200"
      :aria-label="`Read ${post.title}`"
    />

    <div class="pointer-events-none relative z-10 grid gap-3 sm:gap-4">
      <PostArtwork
        :image-id="coverImageId"
        :title="post.title"
        compact
        class="rounded-xl"
      />

      <div class="grid gap-3 px-1 pb-1 sm:px-2 lg:px-3">
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

        <h2 class="max-w-3xl text-balance font-display text-2xl font-bold leading-none text-mist-50 transition group-hover:text-brass-100 sm:text-3xl lg:text-4xl">
          {{ post.title }}
        </h2>

        <p v-if="post.subtitle" class="max-w-3xl text-pretty text-sm leading-6 text-mist-200 sm:text-base sm:leading-7">
          {{ post.subtitle }}
        </p>

        <div v-if="visibleTags.length > 0" class="pointer-events-auto flex flex-wrap gap-2">
          <button
            v-for="tag in visibleTags"
            :key="tag.id"
            type="button"
            class="rounded-lg border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-200"
            :title="`Filter by #${tag.name}`"
            @click.stop="emit('selectTag', tag)"
          >
            <TagPill :name="tag.name" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs font-bold text-mist-100">
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-mist-50/10 bg-mist-50/[0.035] px-2.5 py-1.5 transition group-hover:bg-[#303030]">
            <ThumbsUp class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
            {{ formatCount(post.likeCount) }}
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-mist-50/10 bg-mist-50/[0.035] px-2.5 py-1.5 transition group-hover:bg-[#303030]">
            <ThumbsDown class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
            {{ formatCount(post.dislikeCount) }}
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-mist-50/10 bg-mist-50/[0.035] px-2.5 py-1.5 transition group-hover:bg-[#303030]">
            <MessageCircle class="h-3.5 w-3.5 text-mist-300" :stroke-width="1.8" />
            {{ formatCount(post.commentCount) }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
