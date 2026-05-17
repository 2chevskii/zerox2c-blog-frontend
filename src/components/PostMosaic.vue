<script setup lang="ts">
import PostCard from '@/components/PostCard.vue'
import type { PostListItemResponse } from '@/types/api'

defineProps<{
  posts: PostListItemResponse[]
}>()
</script>

<template>
  <div class="grid gap-8">
    <PostCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
    />
  </div>
</template>
