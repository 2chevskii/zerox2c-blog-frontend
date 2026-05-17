<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { MessageCircle, Send, X } from '@lucide/vue'
import LoadingState from '@/components/LoadingState.vue'
import PostCommentItem from '@/components/PostCommentItem.vue'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import type { PostCommentNode } from '@/types/comments'

const props = defineProps<{
  postId: string
}>()

const auth = useAuthStore()
const postsStore = usePostsStore()
const {
  selectedPostComments,
  commentsError,
  isLoadingComments,
  isSubmittingComment,
} = storeToRefs(postsStore)

const body = ref('')
const replyParentId = ref<string | null>(null)
const replyAuthorUsername = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

const commentTree = computed(() => {
  const nodes = new Map<string, PostCommentNode>()
  const roots: PostCommentNode[] = []

  for (const comment of selectedPostComments.value) {
    nodes.set(comment.id, { ...comment, replies: [] })
  }

  for (const comment of selectedPostComments.value) {
    const node = nodes.get(comment.id)
    if (!node) {
      continue
    }

    const parent = comment.parentCommentId ? nodes.get(comment.parentCommentId) : null
    if (parent) {
      parent.replies.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
})

const placeholder = computed(() =>
  replyParentId.value ? `Reply to @${replyAuthorUsername.value}` : 'Write a comment...',
)

watch(
  () => props.postId,
  (postId) => {
    if (postId) {
      void postsStore.fetchPostComments(postId)
      return
    }

    postsStore.clearSelectedPostComments()
  },
  { immediate: true },
)

function startReply(commentId: string, authorUsername: string) {
  replyParentId.value = commentId
  replyAuthorUsername.value = authorUsername
  void nextTick(() => textarea.value?.focus())
}

function cancelReply() {
  replyParentId.value = null
  replyAuthorUsername.value = ''
}

async function submitComment() {
  const normalizedBody = body.value.trim()
  if (!normalizedBody || !auth.isAuthenticated || isSubmittingComment.value || auth.isBlocked) {
    return
  }

  const created = await postsStore.createComment(props.postId, normalizedBody, replyParentId.value)
  if (created) {
    body.value = ''
    cancelReply()
  }
}

async function editComment(commentId: string, nextBody: string) {
  await postsStore.editComment(props.postId, commentId, nextBody)
}
</script>

<template>
  <section class="grid gap-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="grid gap-1">
        <h2 class="font-display text-3xl font-bold leading-none text-mist-50">
          Comments
        </h2>
        <p class="text-sm font-semibold text-mist-300">
          {{ selectedPostComments.length }} total
        </p>
      </div>
    </header>

    <form
      v-if="auth.isAuthenticated"
      class="grid gap-3 rounded-xl bg-[#252525] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]"
      @submit.prevent="submitComment"
    >
      <div v-if="replyParentId" class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#303030] px-3 py-2 text-sm font-semibold text-mist-200">
        <span>Replying to <span class="text-brass-100">@{{ replyAuthorUsername }}</span></span>
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-md text-mist-300 transition hover:bg-[#353535] hover:text-mist-50"
          title="Cancel reply"
          aria-label="Cancel reply"
          @click="cancelReply"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <textarea
        ref="textarea"
        v-model="body"
        class="min-h-32 w-full resize-y rounded-xl border border-mist-50/12 bg-ink-950/72 p-3 text-sm leading-6 text-mist-50 transition placeholder:text-mist-300/60 focus:border-brass-200/60"
        maxlength="4000"
        :placeholder="placeholder"
        :disabled="auth.isBlocked"
        required
      />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p v-if="auth.isBlocked" class="text-sm font-semibold text-ember-100">
          Blocked accounts cannot comment.
        </p>
        <p v-else-if="commentsError" class="text-sm font-semibold text-ember-100">
          {{ commentsError }}
        </p>
        <span v-else class="text-xs font-semibold text-mist-300">
          {{ body.trim().length }}/4000
        </span>

        <button
          type="submit"
          class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#303030] px-4 py-2 text-sm font-bold text-brass-100 transition hover:bg-[#353535] hover:text-mist-50 disabled:opacity-60"
          :disabled="auth.isBlocked || isSubmittingComment || !body.trim()"
        >
          <Send class="h-4 w-4" />
          {{ isSubmittingComment ? 'Posting' : 'Post comment' }}
        </button>
      </div>
    </form>

    <div v-else class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#252525] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <span class="inline-flex items-center gap-2 text-sm font-semibold text-mist-200">
        <MessageCircle class="h-4 w-4 text-mist-300" />
        Sign in to join the discussion.
      </span>
      <RouterLink
        to="/signin"
        class="inline-flex min-h-10 items-center rounded-lg bg-[#303030] px-3 py-2 text-sm font-bold text-brass-100 transition hover:bg-[#353535] hover:text-mist-50"
      >
        Sign in
      </RouterLink>
    </div>

    <LoadingState v-if="isLoadingComments" />
    <p v-else-if="commentsError && !auth.isAuthenticated" class="text-sm font-semibold text-ember-100">
      {{ commentsError }}
    </p>
    <div v-else-if="commentTree.length > 0" class="grid gap-3">
      <PostCommentItem
        v-for="comment in commentTree"
        :key="comment.id"
        :comment="comment"
        :current-user-id="auth.userId"
        :is-authenticated="auth.isAuthenticated"
        :is-submitting="isSubmittingComment"
        @reply="startReply"
        @edit="editComment"
      />
    </div>
    <p v-else class="rounded-xl bg-[#252525] p-4 text-sm font-semibold text-mist-300 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      No comments yet.
    </p>
  </section>
</template>
