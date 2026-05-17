<script setup lang="ts">
import PostCard from '@/components/PostCard.vue'
import type { PostListItemResponse, TagResponse } from '@/types/api'

defineProps<{
  posts: PostListItemResponse[]
}>()

const emit = defineEmits<{
  selectTag: [tag: TagResponse]
}>()
</script>

<template>
  <div class="mx-auto grid w-full max-w-2xl gap-5">
    <PostCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
      @select-tag="emit('selectTag', $event)"
    />
  </div>
</template>
