import { getJson } from '@/api/http'
import type { TagListQuery, TagResponse } from '@/types/api'

export function getPublishedTags(query: TagListQuery = {}) {
  return getJson<TagResponse[]>('/api/tags', {
    offset: query.offset,
    limit: query.limit,
    search: query.search,
  })
}
