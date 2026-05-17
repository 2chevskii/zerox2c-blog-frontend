import { apiRequest } from '@/api/http'
import type { ProfileCommentReplyResponse, ProfileResponse } from '@/types/api'

export function getProfile() {
  return apiRequest<ProfileResponse>('/api/profile')
}

export function uploadAvatar(file: Blob) {
  const formData = new FormData()
  formData.set('file', file, 'avatar.png')

  return apiRequest<ProfileResponse>('/api/profile/avatar', {
    method: 'POST',
    body: formData,
  })
}

export function markReplySeen(replyCommentId: string) {
  return apiRequest<ProfileCommentReplyResponse>(
    `/api/profile/comment-replies/${encodeURIComponent(replyCommentId)}/seen`,
    { method: 'PUT' },
  )
}
