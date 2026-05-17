import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import {
  clearPostReaction,
  getPostReaction,
  getPublishedPost,
  getPublishedPosts,
  setPostReaction,
} from '@/api/posts'
import { getPublishedTags } from '@/api/tags'
import type {
  PostDetailsResponse,
  PostListItemResponse,
  PostReactionResponse,
  PostReactionType,
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
  const reactionError = ref<string | null>(null)
  const isLoadingList = ref(false)
  const isLoadingMore = ref(false)
  const isLoadingPost = ref(false)
  const isLoadingReaction = ref(false)
  const isUpdatingReaction = ref(false)
  const selectedPostReaction = ref<PostReactionType | null>(null)
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
    selectedPostReaction.value = null
    postError.value = null
    reactionError.value = null
    isLoadingPost.value = true

    try {
      selectedPost.value = await getPublishedPost(slugOrId)
    } catch (error) {
      postError.value = getPostErrorMessage(error)
    } finally {
      isLoadingPost.value = false
    }
  }

  async function fetchPostReaction(postId: string) {
    reactionError.value = null
    isLoadingReaction.value = true

    try {
      applyReactionResponse(await getPostReaction(postId))
    } catch (error) {
      reactionError.value = getReactionErrorMessage(error)
    } finally {
      isLoadingReaction.value = false
    }
  }

  async function updatePostReaction(postId: string, reaction: PostReactionType) {
    reactionError.value = null
    isUpdatingReaction.value = true

    try {
      const response = selectedPostReaction.value === reaction
        ? await clearPostReaction(postId)
        : await setPostReaction(postId, reaction)
      applyReactionResponse(response)
    } catch (error) {
      reactionError.value = getReactionErrorMessage(error)
    } finally {
      isUpdatingReaction.value = false
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

  function clearSelectedPostReaction() {
    selectedPostReaction.value = null
    reactionError.value = null
  }

  function appendUniquePosts(page: PostListItemResponse[]) {
    const seenIds = new Set(posts.value.map((post) => post.id))
    posts.value = [...posts.value, ...page.filter((post) => !seenIds.has(post.id))]
  }

  function applyReactionResponse(response: PostReactionResponse) {
    selectedPostReaction.value = response.currentUserReaction

    if (selectedPost.value?.id === response.postId) {
      selectedPost.value = {
        ...selectedPost.value,
        likeCount: response.likeCount,
        dislikeCount: response.dislikeCount,
      }
    }

    posts.value = posts.value.map((post) =>
      post.id === response.postId
        ? {
            ...post,
            likeCount: response.likeCount,
            dislikeCount: response.dislikeCount,
          }
        : post,
    )
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
    reactionError,
    isLoadingList,
    isLoadingMore,
    isLoadingPost,
    isLoadingReaction,
    isUpdatingReaction,
    selectedPostReaction,
    fetchPosts,
    fetchPost,
    fetchPostReaction,
    updatePostReaction,
    fetchTags,
    setSearch,
    addTag,
    removeTag,
    setDateFilters,
    clearSelectedPostReaction,
  }
})

function getPostErrorMessage(error: unknown) {
  return error instanceof ApiError && error.status === 404
    ? 'Post not found.'
    : 'Could not load this post. Check that the backend API is running.'
}

function getReactionErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sign in to react to posts.'
    }

    if (error.status === 403) {
      return 'This account cannot react to posts.'
    }
  }

  return 'Could not update this reaction.'
}
