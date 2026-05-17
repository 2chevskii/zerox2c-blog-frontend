import { apiRequest, getJson, jsonRequest } from '@/api/http'
import type {
  PostDetailsResponse,
  PostCommentRequest,
  PostCommentResponse,
  PostListItemResponse,
  PostListQuery,
  PostReactionRequest,
  PostReactionResponse,
  PostReactionType,
  UpdatePostCommentRequest,
} from '@/types/api'

export function getPublishedPosts(query: PostListQuery = {}) {
  return getJson<PostListItemResponse[]>('/api/posts', {
    offset: query.offset,
    limit: query.limit,
    search: query.search,
    tags: query.tags?.join(','),
    from: query.from,
    to: query.to,
  })
}

export function getPublishedPost(slugOrId: string) {
  return getJson<PostDetailsResponse>(`/api/posts/${encodeURIComponent(slugOrId)}`)
}

export function getPostComments(postId: string) {
  return getJson<PostCommentResponse[]>(`/api/posts/${encodeURIComponent(postId)}/comments`)
}

export function createPostComment(postId: string, request: PostCommentRequest) {
  return jsonRequest<PostCommentResponse>(
    `/api/posts/${encodeURIComponent(postId)}/comments`,
    'POST',
    request,
  )
}

export function updatePostComment(postId: string, commentId: string, request: UpdatePostCommentRequest) {
  return jsonRequest<PostCommentResponse>(
    `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    'PUT',
    request,
  )
}

export function getPostReaction(postId: string) {
  return getJson<PostReactionResponse>(`/api/posts/${encodeURIComponent(postId)}/reaction`)
}

export function setPostReaction(postId: string, reaction: PostReactionType) {
  const request: PostReactionRequest = { reaction }
  return jsonRequest<PostReactionResponse>(
    `/api/posts/${encodeURIComponent(postId)}/reaction`,
    'PUT',
    request,
  )
}

export function clearPostReaction(postId: string) {
  return apiRequest<PostReactionResponse>(`/api/posts/${encodeURIComponent(postId)}/reaction`, {
    method: 'DELETE',
  })
}
