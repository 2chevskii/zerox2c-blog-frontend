<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays } from '@lucide/vue'
import PostArtwork from '@/components/PostArtwork.vue'
import TagPill from '@/components/TagPill.vue'
import type { PostListItemResponse } from '@/types/api'
import { formatShortDate } from '@/utils/dates'

const props = defineProps<{
  post: PostListItemResponse
  featured?: boolean
  compact?: boolean
}>()

const postUrl = computed(() => `/posts/${props.post.slug ?? props.post.id}`)
const imageId = computed(() => props.post.bannerImageId ?? props.post.coverImageId)
const isCompactCard = computed(() => props.compact || props.featured)
</script>

<template>
  <RouterLink
    :to="postUrl"
    class="group loft-panel relative overflow-hidden rounded-xl transition-colors duration-200 hover:border-concrete-100/30 !shadow-none"
    :class="isCompactCard ? '' : 'min-h-80'"
  >
    <PostArtwork
      v-if="isCompactCard"
      :image-id="imageId"
      :title="post.title"
      :large="!isCompactCard"
      :square="isCompactCard"
    />

    <template v-if="!isCompactCard">
      <div class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[62%] overflow-hidden">
        <PostArtwork :image-id="imageId" :title="post.title" :large="true" class="h-full w-full !aspect-auto" />
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#151515]/18 to-[#151515]/85" />
      </div>
      <article class="relative z-10 grid h-full gap-4 p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-normal text-concrete-300">
          <span class="inline-flex items-center gap-2">
            <CalendarDays class="h-3 w-3" :stroke-width="1.8" />
            {{ formatShortDate(post.publishedAt) }}
          </span>
          <span v-if="post.tags.length > 0" class="h-px w-4 bg-concrete-100/25" />
          <TagPill v-for="tag in post.tags.slice(0, 2)" :key="tag.id" :name="tag.name" />
        </div>

        <div class="grid gap-3 mt-auto">
          <h2 class="text-balance text-sm sm:text-base font-black uppercase leading-[1.1] tracking-normal text-[#f4f4f4] transition group-hover:text-white">
            {{ post.title }}
          </h2>
          <p v-if="post.subtitle" class="text-pretty text-xs font-semibold leading-5 text-concrete-100">
            {{ post.subtitle }}
          </p>
          <div
            v-if="post.excerpt"
            class="grid overflow-hidden opacity-0 translate-y-1 transition-[max-height,opacity,margin-top,transform] duration-350 ease-in-out max-h-0 mt-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:translate-y-0 group-hover:mt-1"
          >
            <p class="line-clamp-3 text-[11px] leading-4 text-concrete-300">
              {{ post.excerpt }}
            </p>
          </div>
        </div>
      </article>
    </template>
  </RouterLink>
</template>
