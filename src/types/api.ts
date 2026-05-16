export interface TagResponse {
  id: string
  name: string
  description: string | null
}

export interface PostListItemResponse {
  id: string
  slug: string | null
  title: string
  subtitle: string | null
  excerpt: string | null
  coverImageId: string | null
  bannerImageId: string | null
  tags: TagResponse[]
  publishedAt: string | null
}

export interface PostDetailsResponse extends PostListItemResponse {
  body: string
}

export interface PostListQuery {
  offset?: number
  limit?: number
  search?: string
}
