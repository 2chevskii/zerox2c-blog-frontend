import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import { getPublishedPost, getPublishedPosts } from '@/api/posts'
import { getPublishedTags } from '@/api/tags'
import type {
  PostDetailsResponse,
  PostListItemResponse,
  PostSearchDateFilter,
  TagResponse,
} from '@/types/api'

const PAGE_SIZE = 9

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<PostListItemResponse[]>([])
  const selectedPost = ref<PostDetailsResponse | null>(null)
  const search = ref('')
  const selectedTags = ref<TagResponse[]>([])
  const publishedFrom = ref<string | undefined>()
  const publishedTo = ref<string | undefined>()
  const availableTags = ref<TagResponse[]>([])
  const offset = ref(0)
  const hasMore = ref(true)
  const listError = ref<string | null>(null)
  const postError = ref<string | null>(null)
  const isLoadingList = ref(false)
  const isLoadingMore = ref(false)
  const isLoadingPost = ref(false)
  let listRequestId = 0

  const selectedTagNames = computed(() => selectedTags.value.map((tag) => tag.name))

  async function fetchPosts(reset = false) {
    const requestId = ++listRequestId

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
        limit: PAGE_SIZE,
        search: search.value.trim() || undefined,
        tags: selectedTagNames.value,
        from: publishedFrom.value,
        to: publishedTo.value,
      })

      if (requestId !== listRequestId) {
        return
      }

      appendUniquePosts(page)
      offset.value += page.length
      hasMore.value = page.length === PAGE_SIZE
    } catch {
      if (requestId !== listRequestId) {
        return
      }

      listError.value = 'Could not load posts. Check that the backend API is running.'
    } finally {
      if (requestId === listRequestId) {
        isLoadingList.value = false
        isLoadingMore.value = false
      }
    }
  }

  async function fetchPost(slugOrId: string) {
    selectedPost.value = null
    postError.value = null
    isLoadingPost.value = true

    try {
      selectedPost.value = await getPublishedPost(slugOrId)
    } catch (error) {
      postError.value = getPostErrorMessage(error)
    } finally {
      isLoadingPost.value = false
    }
  }

  async function fetchTags() {
    try {
      availableTags.value = await getPublishedTags({ limit: 100 })
    } catch {
      availableTags.value = []
    }
  }

  function setSearch(value: string) {
    search.value = value
  }

  function addTag(tag: TagResponse) {
    if (!selectedTags.value.some((selectedTag) => selectedTag.name === tag.name)) {
      selectedTags.value = [...selectedTags.value, tag]
    }
  }

  function removeTag(name: string) {
    selectedTags.value = selectedTags.value.filter((tag) => tag.name !== name)
  }

  function setDateFilters(dateFilters: PostSearchDateFilter[]) {
    publishedFrom.value = dateFilters.find((dateFilter) => dateFilter.operator === 'from')?.dateValue
    publishedTo.value = dateFilters.find((dateFilter) => dateFilter.operator === 'to')?.dateValue
  }

  function appendUniquePosts(page: PostListItemResponse[]) {
    const seenIds = new Set(posts.value.map((post) => post.id))
    posts.value = [...posts.value, ...page.filter((post) => !seenIds.has(post.id))]
  }

  return {
    posts,
    selectedPost,
    search,
    selectedTags,
    availableTags,
    hasMore,
    listError,
    postError,
    isLoadingList,
    isLoadingMore,
    isLoadingPost,
    fetchPosts,
    fetchPost,
    fetchTags,
    setSearch,
    addTag,
    removeTag,
    setDateFilters,
  }
})

function getPostErrorMessage(error: unknown) {
  return error instanceof ApiError && error.status === 404
    ? 'Post not found.'
    : 'Could not load this post. Check that the backend API is running.'
}
