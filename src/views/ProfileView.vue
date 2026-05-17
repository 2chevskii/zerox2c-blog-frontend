<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Camera, Check, Eye, Heart, MessageCircle, Send, Upload } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { getProfile, markReplySeen, uploadAvatar } from '@/api/profile'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useAuthStore } from '@/stores/auth'
import type { PostListItemResponse, ProfileCommentReplyResponse, ProfileResponse } from '@/types/api'
import { formatShortDate } from '@/utils/dates'
import { imageUrl } from '@/utils/images'

const CROP_SIZE = 256
const OUTPUT_SIZE = 512

const auth = useAuthStore()
const profile = ref<ProfileResponse | null>(null)
const isLoading = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const avatarError = ref('')
const selectedImageUrl = ref('')
const selectedImage = ref<HTMLImageElement | null>(null)
const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const dragStart = ref<{ pointerId: number, x: number, y: number, offsetX: number, offsetY: number } | null>(null)

const avatarUrl = computed(() => imageUrl(profile.value?.avatarImageId))
const initials = computed(() => profile.value?.username.slice(0, 2).toUpperCase() ?? 'ME')
const avatarPreviewStyle = computed(() => {
  if (!selectedImageUrl.value || !selectedImage.value) {
    return {}
  }

  const display = getDisplayedImageSize()
  return {
    width: `${display.width}px`,
    height: `${display.height}px`,
    transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`,
  }
})

useTitle('Profile | 0x2c.dev')

onMounted(() => {
  void loadProfile()
})

onBeforeUnmount(() => {
  revokeSelectedImageUrl()
})

async function loadProfile() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    profile.value = await getProfile()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load profile.'
  } finally {
    isLoading.value = false
  }
}

function onAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  avatarError.value = ''
  revokeSelectedImageUrl()

  if (!file.type.startsWith('image/')) {
    avatarError.value = 'Select an image file.'
    return
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => {
    selectedImageUrl.value = objectUrl
    selectedImage.value = image
    zoom.value = 1
    offsetX.value = 0
    offsetY.value = 0
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    avatarError.value = 'Could not read this image.'
  }
  image.src = objectUrl
}

function revokeSelectedImageUrl() {
  if (selectedImageUrl.value) {
    URL.revokeObjectURL(selectedImageUrl.value)
  }

  selectedImageUrl.value = ''
  selectedImage.value = null
}

function onCropPointerDown(event: PointerEvent) {
  if (!selectedImage.value) {
    return
  }

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  dragStart.value = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    offsetX: offsetX.value,
    offsetY: offsetY.value,
  }
}

function onCropPointerMove(event: PointerEvent) {
  if (!dragStart.value || dragStart.value.pointerId !== event.pointerId) {
    return
  }

  offsetX.value = dragStart.value.offsetX + event.clientX - dragStart.value.x
  offsetY.value = dragStart.value.offsetY + event.clientY - dragStart.value.y
}

function onCropPointerUp(event: PointerEvent) {
  if (dragStart.value?.pointerId === event.pointerId) {
    dragStart.value = null
  }
}

async function submitAvatar() {
  if (!selectedImage.value || isUploading.value) {
    return
  }

  if (auth.isBlocked) {
    avatarError.value = 'Blocked accounts cannot change avatars.'
    return
  }

  avatarError.value = ''
  isUploading.value = true

  try {
    const blob = await renderAvatarBlob()
    profile.value = await uploadAvatar(blob)
    revokeSelectedImageUrl()
  } catch (error) {
    avatarError.value = error instanceof Error ? error.message : 'Could not upload avatar.'
  } finally {
    isUploading.value = false
  }
}

function renderAvatarBlob() {
  return new Promise<Blob>((resolve, reject) => {
    const image = selectedImage.value
    if (!image) {
      reject(new Error('Select an avatar image first.'))
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('Could not prepare avatar image.'))
      return
    }

    const display = getDisplayedImageSize()
    const scale = display.width / image.naturalWidth
    const sourceX = (display.width / 2 - CROP_SIZE / 2 - offsetX.value) / scale
    const sourceY = (display.height / 2 - CROP_SIZE / 2 - offsetY.value) / scale
    const sourceSize = CROP_SIZE / scale

    context.drawImage(
      image,
      clamp(sourceX, 0, image.naturalWidth - sourceSize),
      clamp(sourceY, 0, image.naturalHeight - sourceSize),
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Could not export avatar image.')),
      'image/png',
    )
  })
}

function getDisplayedImageSize() {
  const image = selectedImage.value
  if (!image) {
    return { width: CROP_SIZE, height: CROP_SIZE }
  }

  const baseScale = Math.max(CROP_SIZE / image.naturalWidth, CROP_SIZE / image.naturalHeight)
  return {
    width: image.naturalWidth * baseScale * zoom.value,
    height: image.naturalHeight * baseScale * zoom.value,
  }
}

async function markSeen(reply: ProfileCommentReplyResponse) {
  if (!profile.value || reply.isSeen) {
    return
  }

  const updated = await markReplySeen(reply.id)
  profile.value = {
    ...profile.value,
    replies: profile.value.replies.map((item) => item.id === updated.id ? updated : item),
  }
}

function postPath(post: PostListItemResponse | { postId: string, postSlug: string | null }) {
  const slugOrId = 'id' in post ? (post.slug ?? post.id) : (post.postSlug ?? post.postId)
  return `/posts/${slugOrId}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
</script>

<template>
  <main class="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
    <LoadingState v-if="isLoading" />
    <ErrorNotice v-else-if="errorMessage" :message="errorMessage" />

    <template v-else-if="profile">
      <section class="grid gap-6 rounded-xl bg-[#252525] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)] sm:grid-cols-[auto_1fr] sm:p-6">
        <div class="grid gap-4">
          <div class="grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-[#303030] text-3xl font-bold text-brass-100">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="`${profile.username} avatar`"
              class="h-full w-full object-cover"
            >
            <span v-else>{{ initials }}</span>
          </div>

          <label class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-bold text-brass-100 transition hover:bg-[#353535] hover:text-mist-50">
            <Camera class="h-4 w-4" />
            Change avatar
            <input class="sr-only" type="file" accept="image/*" :disabled="auth.isBlocked" @change="onAvatarFileChange">
          </label>
        </div>

        <div class="grid gap-4">
          <div>
            <h1 class="font-display text-4xl font-bold leading-none text-mist-50">
              @{{ profile.username }}
            </h1>
            <p class="mt-2 text-sm font-semibold text-mist-300">
              {{ profile.email }}
            </p>
          </div>

          <div v-if="selectedImageUrl" class="grid gap-4 md:grid-cols-[auto_1fr]">
            <div
              class="relative h-64 w-64 touch-none select-none overflow-hidden rounded-full border border-mist-50/12 bg-ink-950"
              @pointerdown="onCropPointerDown"
              @pointermove="onCropPointerMove"
              @pointerup="onCropPointerUp"
              @pointercancel="onCropPointerUp"
            >
              <img
                :src="selectedImageUrl"
                alt=""
                class="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                :style="avatarPreviewStyle"
                draggable="false"
              >
            </div>

            <div class="grid content-center gap-4">
              <label class="grid gap-2 text-sm font-bold text-mist-100">
                Zoom
                <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" class="w-full accent-brass-200">
              </label>
              <p v-if="avatarError" class="text-sm font-semibold text-ember-100">
                {{ avatarError }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#303030] px-4 py-2 text-sm font-bold text-brass-100 transition hover:bg-[#353535] hover:text-mist-50 disabled:opacity-60"
                  :disabled="isUploading || auth.isBlocked"
                  @click="submitAvatar"
                >
                  <Upload class="h-4 w-4" />
                  {{ isUploading ? 'Uploading' : 'Upload avatar' }}
                </button>
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-bold text-mist-300 transition hover:bg-[#303030] hover:text-mist-50"
                  @click="revokeSelectedImageUrl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <p v-else-if="avatarError" class="text-sm font-semibold text-ember-100">
            {{ avatarError }}
          </p>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-2">
        <div class="grid content-start gap-3 rounded-xl bg-[#252525] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <h2 class="inline-flex items-center gap-2 font-display text-2xl font-bold text-mist-50">
            <Eye class="h-5 w-5 text-brass-100" />
            Recently viewed
          </h2>
          <RouterLink
            v-for="post in profile.recentlyViewedPosts"
            :key="post.id"
            :to="postPath(post)"
            class="rounded-lg bg-[#303030] p-3 transition hover:bg-[#353535]"
          >
            <span class="block text-sm font-bold text-mist-50">{{ post.title }}</span>
            <span class="text-xs font-semibold text-mist-300">{{ formatShortDate(post.publishedAt) }}</span>
          </RouterLink>
          <p v-if="profile.recentlyViewedPosts.length === 0" class="text-sm font-semibold text-mist-300">
            No recently viewed posts yet.
          </p>
        </div>

        <div class="grid content-start gap-3 rounded-xl bg-[#252525] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <h2 class="inline-flex items-center gap-2 font-display text-2xl font-bold text-mist-50">
            <Heart class="h-5 w-5 text-brass-100" />
            Liked posts
          </h2>
          <RouterLink
            v-for="post in profile.likedPosts"
            :key="post.id"
            :to="postPath(post)"
            class="rounded-lg bg-[#303030] p-3 transition hover:bg-[#353535]"
          >
            <span class="block text-sm font-bold text-mist-50">{{ post.title }}</span>
            <span class="text-xs font-semibold text-mist-300">{{ formatShortDate(post.publishedAt) }}</span>
          </RouterLink>
          <p v-if="profile.likedPosts.length === 0" class="text-sm font-semibold text-mist-300">
            No liked posts yet.
          </p>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-2">
        <div class="grid content-start gap-3 rounded-xl bg-[#252525] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <h2 class="inline-flex items-center gap-2 font-display text-2xl font-bold text-mist-50">
            <MessageCircle class="h-5 w-5 text-brass-100" />
            Your comments
          </h2>
          <article
            v-for="comment in profile.comments"
            :key="comment.id"
            class="grid gap-2 rounded-lg bg-[#303030] p-3"
          >
            <RouterLink :to="postPath(comment)" class="text-sm font-bold text-brass-100 hover:text-mist-50">
              {{ comment.postTitle }}
            </RouterLink>
            <p class="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-mist-200">
              {{ comment.body }}
            </p>
            <span class="text-xs font-semibold text-mist-300">{{ formatShortDate(comment.createdAt) }}</span>
          </article>
          <p v-if="profile.comments.length === 0" class="text-sm font-semibold text-mist-300">
            No comments yet.
          </p>
        </div>

        <div class="grid content-start gap-3 rounded-xl bg-[#252525] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <h2 class="inline-flex items-center gap-2 font-display text-2xl font-bold text-mist-50">
            <Send class="h-5 w-5 text-brass-100" />
            Replies
          </h2>
          <article
            v-for="reply in profile.replies"
            :key="reply.id"
            class="grid gap-2 rounded-lg bg-[#303030] p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <RouterLink :to="postPath(reply)" class="text-sm font-bold text-brass-100 hover:text-mist-50">
                {{ reply.postTitle }}
              </RouterLink>
              <button
                type="button"
                class="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition"
                :class="reply.isSeen ? 'bg-mist-50/6 text-mist-300' : 'bg-brass-200/16 text-brass-100 hover:bg-brass-200/22'"
                :disabled="reply.isSeen"
                @click="markSeen(reply)"
              >
                <Check class="h-3.5 w-3.5" />
                {{ reply.isSeen ? 'Seen' : 'Mark seen' }}
              </button>
            </div>
            <p class="text-xs font-semibold text-mist-300">
              <span class="text-mist-300/55">@</span>{{ reply.authorUsername }} replied
            </p>
            <p class="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-mist-200">
              {{ reply.body }}
            </p>
            <span class="text-xs font-semibold text-mist-300">{{ formatShortDate(reply.createdAt) }}</span>
          </article>
          <p v-if="profile.replies.length === 0" class="text-sm font-semibold text-mist-300">
            No replies yet.
          </p>
        </div>
      </section>
    </template>
  </main>
</template>
