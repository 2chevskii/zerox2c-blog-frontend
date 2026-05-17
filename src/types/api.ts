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

export interface PostSlugResolutionResponse {
  id: string
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

export interface PostCommentResponse {
  id: string
  postId: string
  authorUserId: string
  authorUsername: string
  parentCommentId: string | null
  body: string
  createdAt: string
  updatedAt: string | null
}

export interface PostCommentRequest {
  body: string
  parentCommentId?: string | null
}

export interface UpdatePostCommentRequest {
  body: string
}

export interface ProfileCommentResponse {
  id: string
  postId: string
  postSlug: string | null
  postTitle: string
  parentCommentId: string | null
  body: string
  createdAt: string
  updatedAt: string | null
}

export interface ProfileCommentReplyResponse {
  id: string
  postId: string
  postSlug: string | null
  postTitle: string
  parentCommentId: string
  parentCommentBody: string
  authorUserId: string
  authorUsername: string
  body: string
  createdAt: string
  isSeen: boolean
  seenAt: string | null
}

export interface ProfileResponse {
  userId: string
  username: string
  email: string
  avatarImageId: string | null
  recentlyViewedPosts: PostListItemResponse[]
  likedPosts: PostListItemResponse[]
  comments: ProfileCommentResponse[]
  replies: ProfileCommentReplyResponse[]
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
