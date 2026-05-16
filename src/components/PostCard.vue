<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, CalendarDays } from '@lucide/vue'
import PostArtwork from '@/components/PostArtwork.vue'
import TagPill from '@/components/TagPill.vue'
import type { PostListItemResponse } from '@/types/api'
import { formatShortDate } from '@/utils/dates'

const props = defineProps<{
  post: PostListItemResponse
  featured?: boolean
}>()

const postUrl = computed(() => `/posts/${props.post.slug ?? props.post.id}`)
const imageId = computed(() => props.post.bannerImageId ?? props.post.coverImageId)
</script>

<template>
  <RouterLink
    :to="postUrl"
    class="group loft-panel worn-edge grid overflow-hidden rounded-sm transition duration-200 hover:-translate-y-0.5 hover:border-burgundy-300/60"
    :class="featured ? 'lg:grid-cols-[1.16fr_0.84fr]' : ''"
  >
    <PostArtwork :image-id="imageId" :title="post.title" :large="featured" />

    <article class="grid content-between gap-7 p-5 sm:p-6" :class="featured ? 'lg:p-8' : ''">
      <div class="grid gap-4">
        <div class="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-normal text-concrete-300">
          <span class="inline-flex items-center gap-2">
            <CalendarDays class="h-4 w-4" :stroke-width="1.8" />
            {{ formatShortDate(post.publishedAt) }}
          </span>
          <span v-if="post.tags.length > 0" class="h-1 w-5 bg-cardboard-300/70" />
          <TagPill v-for="tag in post.tags.slice(0, 2)" :key="tag.id" :name="tag.name" />
        </div>

        <div class="grid gap-3">
          <h2
            class="text-balance font-black uppercase leading-[0.96] tracking-normal text-[#fff8ee] transition group-hover:text-burgundy-100"
            :class="featured ? 'text-3xl sm:text-5xl xl:text-6xl' : 'text-2xl sm:text-3xl'"
          >
            {{ post.title }}
          </h2>
          <p v-if="post.subtitle" class="text-pretty text-base font-semibold leading-7 text-concrete-100">
            {{ post.subtitle }}
          </p>
          <p v-if="post.excerpt" class="line-clamp-3 text-sm leading-6 text-concrete-300">
            {{ post.excerpt }}
          </p>
        </div>
      </div>

      <div class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-normal text-burgundy-200">
        Read post
        <ArrowUpRight class="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </article>
  </RouterLink>
</template>
