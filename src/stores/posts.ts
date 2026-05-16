import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import { getPublishedPost, getPublishedPosts } from '@/api/posts'
import type { PostDetailsResponse, PostListItemResponse } from '@/types/api'

const pageSize = 9

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<PostListItemResponse[]>([])
  const selectedPost = ref<PostDetailsResponse | null>(null)
  const search = ref('')
  const offset = ref(0)
  const hasMore = ref(true)
  const listError = ref<string | null>(null)
  const postError = ref<string | null>(null)
  const isLoadingList = ref(false)
  const isLoadingMore = ref(false)
  const isLoadingPost = ref(false)

  const featuredPost = computed(() => posts.value[0] ?? null)
  const remainingPosts = computed(() => posts.value.slice(1))

  async function fetchPosts(reset = false) {
    if (reset) {
      offset.value = 0
      posts.value = []
      hasMore.value = true
    }

    if (!hasMore.value && !reset) {
      return
    }

    const isInitialPage = offset.value === 0
    isLoadingList.value = isInitialPage
    isLoadingMore.value = !isInitialPage
    listError.value = null

    try {
      const page = await getPublishedPosts({
        offset: offset.value,
        limit: pageSize,
        search: search.value.trim() || undefined,
      })

      const seenIds = new Set(posts.value.map((post) => post.id))
      posts.value = [...posts.value, ...page.filter((post) => !seenIds.has(post.id))]
      offset.value += page.length
      hasMore.value = page.length === pageSize
    } catch {
      listError.value = 'Could not load posts. Check that the backend API is running.'
    } finally {
      isLoadingList.value = false
      isLoadingMore.value = false
    }
  }

  async function fetchPost(slugOrId: string) {
    selectedPost.value = null
    postError.value = null
    isLoadingPost.value = true

    try {
      selectedPost.value = await getPublishedPost(slugOrId)
    } catch (error) {
      postError.value =
        error instanceof ApiError && error.status === 404
          ? 'Post not found.'
          : 'Could not load this post. Check that the backend API is running.'
    } finally {
      isLoadingPost.value = false
    }
  }

  function setSearch(value: string) {
    search.value = value
  }

  return {
    posts,
    selectedPost,
    search,
    hasMore,
    listError,
    postError,
    isLoadingList,
    isLoadingMore,
    isLoadingPost,
    featuredPost,
    remainingPosts,
    fetchPosts,
    fetchPost,
    setSearch,
  }
})
