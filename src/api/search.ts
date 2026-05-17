import type { TagResponse } from '@/types/api'

export interface SearchSuggestionResponse {
  id: string
  label: string
  value: string
  type: 'keyword' | 'tag'
  tag?: TagResponse
}

const MOCK_TAGS: TagResponse[] = [
  { id: 'mock-tag-vue', name: 'vue', description: null },
  { id: 'mock-tag-typescript', name: 'typescript', description: null },
  { id: 'mock-tag-dotnet', name: 'dotnet', description: null },
  { id: 'mock-tag-architecture', name: 'architecture', description: null },
  { id: 'mock-tag-docker', name: 'docker', description: null },
  { id: 'mock-tag-postgresql', name: 'postgresql', description: null },
]

const MOCK_KEYWORDS = [
  'architecture',
  'aspnet',
  'backend',
  'csharp',
  'database',
  'deployment',
  'docker',
  'frontend',
  'javascript',
  'performance',
  'pinia',
  'postgresql',
  'typescript',
  'vite',
  'vue',
]

export async function getSearchTagSuggestions(
  query: string,
  availableTags: TagResponse[],
  selectedTags: TagResponse[],
) {
  const selectedNames = new Set(selectedTags.map((tag) => tag.name))
  const needle = query.trim().toLowerCase()
  const tagSource = availableTags.length > 0 ? availableTags : MOCK_TAGS

  return tagSource
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
  const needle = query.trim().toLowerCase()

  return MOCK_KEYWORDS.filter((keyword) => keyword.includes(needle) && keyword !== needle)
    .slice(0, 6)
    .map<SearchSuggestionResponse>((keyword) => ({
      id: `keyword-${keyword}`,
      label: keyword,
      value: keyword,
      type: 'keyword',
    }))
}
