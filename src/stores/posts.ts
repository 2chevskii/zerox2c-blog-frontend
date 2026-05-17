import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import {
  clearPostReaction,
  createPostComment,
  getPostComments,
  getPostReaction,
  getPublishedPost,
  getPublishedPosts,
  resolvePostSlug,
  setPostReaction,
  updatePostComment,
} from '@/api/posts'
import { getPublishedTags } from '@/api/tags'
import type {
  PostCommentResponse,
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
  const commentsError = ref<string | null>(null)
  const isLoadingList = ref(false)
  const isLoadingMore = ref(false)
  const isLoadingPost = ref(false)
  const isLoadingReaction = ref(false)
  const isUpdatingReaction = ref(false)
  const isLoadingComments = ref(false)
  const isSubmittingComment = ref(false)
  const selectedPostReaction = ref<PostReactionType | null>(null)
  const selectedPostComments = ref<PostCommentResponse[]>([])
  let listRequestId = 0

  const selectedTagNames = computed(() => selectedTags.value.map((tag) => tag.name))
  const hasActiveListFilters = computed(() =>
    Boolean(
      search.value.trim() ||
      selectedTags.value.length > 0 ||
      publishedFrom.value ||
      publishedTo.value,
    ),
  )

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
    selectedPostComments.value = []
    postError.value = null
    reactionError.value = null
    commentsError.value = null
    isLoadingPost.value = true

    try {
      const postId = isGuid(slugOrId) ? slugOrId : (await resolvePostSlug(slugOrId)).id
      selectedPost.value = await getPublishedPost(postId)
    } catch (error) {
      postError.value = getPostErrorMessage(error)
    } finally {
      isLoadingPost.value = false
    }
  }

  async function fetchPostComments(postId: string) {
    commentsError.value = null
    isLoadingComments.value = true

    try {
      selectedPostComments.value = await getPostComments(postId)
    } catch (error) {
      commentsError.value = getCommentsErrorMessage(error)
      selectedPostComments.value = []
    } finally {
      isLoadingComments.value = false
    }
  }

  async function createComment(postId: string, body: string, parentCommentId: string | null = null) {
    commentsError.value = null
    isSubmittingComment.value = true

    try {
      const comment = await createPostComment(postId, {
        body,
        parentCommentId,
      })
      upsertComment(comment)
      incrementSelectedPostCommentCount(postId)
      return comment
    } catch (error) {
      commentsError.value = getCommentsErrorMessage(error)
      return null
    } finally {
      isSubmittingComment.value = false
    }
  }

  async function editComment(postId: string, commentId: string, body: string) {
    commentsError.value = null
    isSubmittingComment.value = true

    try {
      const comment = await updatePostComment(postId, commentId, { body })
      upsertComment(comment)
      return comment
    } catch (error) {
      commentsError.value = getCommentsErrorMessage(error)
      return null
    } finally {
      isSubmittingComment.value = false
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

  function clearSelectedPostComments() {
    selectedPostComments.value = []
    commentsError.value = null
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

  function upsertComment(comment: PostCommentResponse) {
    const existingIndex = selectedPostComments.value.findIndex((value) => value.id === comment.id)

    if (existingIndex === -1) {
      selectedPostComments.value = [...selectedPostComments.value, comment].sort(compareComments)
      return
    }

    selectedPostComments.value = selectedPostComments.value.map((value) =>
      value.id === comment.id ? comment : value,
    )
  }

  function incrementSelectedPostCommentCount(postId: string) {
    if (selectedPost.value?.id === postId) {
      selectedPost.value = {
        ...selectedPost.value,
        commentCount: selectedPost.value.commentCount + 1,
      }
    }

    posts.value = posts.value.map((post) =>
      post.id === postId
        ? {
            ...post,
            commentCount: post.commentCount + 1,
          }
        : post,
    )
  }

  return {
    posts,
    selectedPost,
    search,
    selectedTags,
    hasActiveListFilters,
    availableTags,
    hasMore,
    listError,
    postError,
    reactionError,
    commentsError,
    isLoadingList,
    isLoadingMore,
    isLoadingPost,
    isLoadingReaction,
    isUpdatingReaction,
    isLoadingComments,
    isSubmittingComment,
    selectedPostReaction,
    selectedPostComments,
    fetchPosts,
    fetchPost,
    fetchPostComments,
    createComment,
    editComment,
    fetchPostReaction,
    updatePostReaction,
    fetchTags,
    setSearch,
    addTag,
    removeTag,
    setDateFilters,
    clearSelectedPostReaction,
    clearSelectedPostComments,
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

function getCommentsErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sign in to comment.'
    }

    if (error.status === 403) {
      return 'This account cannot change that comment.'
    }

    if (error.status === 404) {
      return 'Comments were not found for this post.'
    }

    return error.message
  }

  return 'Could not update comments.'
}

function compareComments(left: PostCommentResponse, right: PostCommentResponse) {
  const leftTime = Date.parse(left.createdAt)
  const rightTime = Date.parse(right.createdAt)
  return leftTime === rightTime ? left.id.localeCompare(right.id) : leftTime - rightTime
}

function isGuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value)
}
