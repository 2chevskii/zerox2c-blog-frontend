import type { PostCommentResponse } from '@/types/api'

export interface PostCommentNode extends PostCommentResponse {
  replies: PostCommentNode[]
}
