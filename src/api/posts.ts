import { getJson } from '@/api/http'
import type {
  PostDetailsResponse,
  PostListItemResponse,
  PostListQuery,
} from '@/types/api'

export function getPublishedPosts(query: PostListQuery = {}) {
  return getJson<PostListItemResponse[]>('/api/posts', {
    offset: query.offset,
    limit: query.limit,
    search: query.search,
    tags: query.tags?.join(','),
  })
}

export function getPublishedPost(slugOrId: string) {
  return getJson<PostDetailsResponse>(`/api/posts/${encodeURIComponent(slugOrId)}`)
}
