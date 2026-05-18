import { getJson } from '@/api/http'
import type { TagResponse } from '@/types/api'

export interface SearchSuggestionResponse {
  id: string
  label: string
  value: string
  type: 'keyword' | 'tag'
  tag?: TagResponse
}

export async function getSearchTagSuggestions(
  query: string,
  availableTags: TagResponse[],
  selectedTags: TagResponse[],
) {
  const selectedNames = new Set(selectedTags.map((tag) => tag.name))
  const needle = query.trim().toLowerCase()

  return availableTags
    .filter((tag) => !selectedNames.has(tag.name))
    .filter((tag) => needle.length === 0 || tag.name.toLowerCase().includes(needle))
    .slice(0, 6)
    .map<SearchSuggestionResponse>((tag) => ({
      id: `tag-${tag.id}`,
      label: tag.name,
      value: tag.name,
      type: 'tag',
      tag,
    }))
}

export async function getSearchKeywordSuggestions(query: string) {
  const keywords = await getJson<string[]>('/api/posts/keywords', {
    search: query.trim(),
    limit: 6,
  })

  return keywords.map<SearchSuggestionResponse>((keyword) => ({
    id: `keyword-${keyword}`,
    label: keyword,
    value: keyword,
    type: 'keyword',
  }))
}
