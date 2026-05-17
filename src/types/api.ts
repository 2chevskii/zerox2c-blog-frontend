export interface TagResponse {
  id: string
  name: string
  description: string | null
}

export type UserRole = 'User' | 'Admin' | 'SuperAdmin'

export interface AuthResponse {
  userId: string
  username: string
  email: string
  accessToken: string
  expiresAt: string
  role: UserRole
}

export interface CurrentUserResponse {
  userId: string
  username: string
  email: string
  isBlocked: boolean
  role: UserRole
}

export interface LoginRequest {
  login: string
  password: string
}

export interface RegisterUserRequest {
  username: string
  email: string
  password: string
}

export interface PostListItemResponse {
  id: string
  slug: string | null
  title: string
  subtitle: string | null
  coverImageId: string | null
  bannerImageId: string | null
  likeCount: number
  dislikeCount: number
  commentCount: number
  viewCount: number
  tags: TagResponse[]
  publishedAt: string | null
}

export interface PostDetailsResponse extends PostListItemResponse {
  bodyHtml: string
  readingMinutes: number
}

export type PostReactionType = 'Like' | 'Dislike'

export interface PostReactionRequest {
  reaction: PostReactionType
}

export interface PostReactionResponse {
  postId: string
  likeCount: number
  dislikeCount: number
  currentUserReaction: PostReactionType | null
}

export type PostSearchDateOperator = 'from' | 'to'

export interface PostSearchDateFilter {
  operator: PostSearchDateOperator
  dateValue: string
}

export interface PostListQuery {
  offset?: number
  limit?: number
  search?: string
  tags?: string[]
  from?: string
  to?: string
}

export interface TagListQuery {
  offset?: number
  limit?: number
  search?: string
}
