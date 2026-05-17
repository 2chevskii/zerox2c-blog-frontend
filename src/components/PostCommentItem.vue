<script setup lang="ts">
import { computed, ref } from 'vue'
import { CornerDownRight, Pencil, Send, X } from '@lucide/vue'
import type { PostCommentNode } from '@/types/comments'
import { formatShortDate } from '@/utils/dates'

const props = defineProps<{
  comment: PostCommentNode
  currentUserId: string
  isAuthenticated: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  reply: [commentId: string, authorUsername: string]
  edit: [commentId: string, body: string]
}>()

const isEditing = ref(false)
const editBody = ref('')

const canEdit = computed(() => props.currentUserId === props.comment.authorUserId)
const editedLabel = computed(() => props.comment.updatedAt ? 'Edited' : '')

function startEditing() {
  editBody.value = props.comment.body
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  editBody.value = ''
}

function submitEdit() {
  const body = editBody.value.trim()
  if (!body || props.isSubmitting) {
    return
  }

  emit('edit', props.comment.id, body)
  cancelEditing()
}
</script>

<template>
  <article class="grid gap-3 rounded-xl bg-[#252525] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-mist-50">
          <span class="text-mist-300/55">@</span>{{ comment.authorUsername }}
        </p>
        <p class="text-xs font-semibold text-mist-300">
          {{ formatShortDate(comment.createdAt) }}
          <span v-if="editedLabel" class="text-mist-300/70"> · {{ editedLabel }}</span>
        </p>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="isAuthenticated"
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg text-mist-300 transition hover:bg-[#303030] hover:text-brass-100"
          title="Reply"
          aria-label="Reply"
          @click="emit('reply', comment.id, comment.authorUsername)"
        >
          <CornerDownRight class="h-4 w-4" />
        </button>
        <button
          v-if="canEdit"
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg text-mist-300 transition hover:bg-[#303030] hover:text-brass-100"
          title="Edit"
          aria-label="Edit"
          @click="startEditing"
        >
          <Pencil class="h-4 w-4" />
        </button>
      </div>
    </header>

    <form v-if="isEditing" class="grid gap-2" @submit.prevent="submitEdit">
      <textarea
        v-model="editBody"
        class="min-h-28 w-full resize-y rounded-xl border border-mist-50/12 bg-ink-950/72 p-3 text-sm leading-6 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
        maxlength="4000"
        required
      />
      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-mist-300 transition hover:bg-[#303030] hover:text-mist-50"
          @click="cancelEditing"
        >
          <X class="h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-bold text-brass-100 transition hover:bg-[#353535] hover:text-mist-50 disabled:opacity-60"
          :disabled="isSubmitting || !editBody.trim()"
        >
          <Send class="h-4 w-4" />
          Save
        </button>
      </div>
    </form>
    <p v-else class="whitespace-pre-wrap break-words text-sm leading-6 text-mist-200">
      {{ comment.body }}
    </p>

    <div v-if="comment.replies.length > 0" class="grid gap-3 border-l border-mist-50/10 pl-3 sm:pl-4">
      <PostCommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :current-user-id="currentUserId"
        :is-authenticated="isAuthenticated"
        :is-submitting="isSubmitting"
        @reply="(commentId, authorUsername) => emit('reply', commentId, authorUsername)"
        @edit="(commentId, body) => emit('edit', commentId, body)"
      />
    </div>
  </article>
</template>
