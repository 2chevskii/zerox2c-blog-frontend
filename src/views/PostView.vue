<script setup lang="ts">
import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, useRoute } from "vue-router";
import { CalendarDays, Clock, ThumbsDown, ThumbsUp } from "@lucide/vue";
import { useTitle } from "@vueuse/core";
import ErrorNotice from "@/components/ErrorNotice.vue";
import PostComments from "@/components/PostComments.vue";
import PostArtwork from "@/components/PostArtwork.vue";
import TagPill from "@/components/TagPill.vue";
import { useAuthStore } from "@/stores/auth";
import { usePostsStore } from "@/stores/posts";
import type { PostReactionType } from "@/types/api";
import { formatLongDate } from "@/utils/dates";

const route = useRoute();
const auth = useAuthStore();
const postsStore = usePostsStore();
const {
  selectedPost,
  postError,
  reactionError,
  isLoadingPost,
  isLoadingReaction,
  isUpdatingReaction,
  selectedPostReaction,
} = storeToRefs(postsStore);

const countFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const skeletonParagraphLines = [
  "w-full",
  "w-11/12",
  "w-10/12",
  "w-full",
  "w-9/12",
];
const skeletonSecondParagraphLines = ["w-11/12", "w-full", "w-8/12"];
const skeletonCodeLines = ["w-7/12", "w-10/12", "w-9/12", "w-11/12"];
const skeletonCommentLines = ["w-11/12", "w-8/12"];

const slugOrId = computed(() => String(route.params.slug ?? ""));
const articleHtml = computed(() => selectedPost.value?.bodyHtml ?? "");
const readingMinutes = computed(() => selectedPost.value?.readingMinutes ?? 1);
const imageId = computed(
  () =>
    selectedPost.value?.bannerImageId ??
    selectedPost.value?.coverImageId ??
    null,
);
const pageTitle = computed(() =>
  selectedPost.value ? `${selectedPost.value.title} | 0x2c.dev` : "0x2c.dev",
);

useTitle(pageTitle);

watch(
  slugOrId,
  (value) => {
    if (value) {
      void postsStore.fetchPost(value);
    }
  },
  { immediate: true },
);

watch(
  [() => selectedPost.value?.id, () => auth.isAuthenticated],
  ([postId, isAuthenticated]) => {
    if (postId && isAuthenticated) {
      void postsStore.fetchPostReaction(postId);
      return;
    }

    postsStore.clearSelectedPostReaction();
  },
);

function formatCount(value: number | null | undefined) {
  return countFormatter.format(value ?? 0);
}

function isSelectedReaction(reaction: PostReactionType) {
  return selectedPostReaction.value === reaction;
}

function reactionButtonClass(reaction: PostReactionType) {
  return [
    "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
    isSelectedReaction(reaction)
      ? "border-brass-200/70 bg-brass-200/16 text-brass-100"
      : "border-mist-50/10 bg-mist-50/6 text-mist-100 hover:border-brass-200/45 hover:bg-brass-200/10 hover:text-brass-100",
  ];
}

function updateReaction(reaction: PostReactionType) {
  if (
    !selectedPost.value ||
    !auth.isAuthenticated ||
    isUpdatingReaction.value
  ) {
    return;
  }

  void postsStore.updatePostReaction(selectedPost.value.id, reaction);
}
</script>

<template>
  <main
    class="relative mx-auto grid max-w-5xl gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
  >
    <article
      v-if="isLoadingPost"
      class="grid animate-pulse gap-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span class="sr-only">Loading post</span>

      <header class="grid gap-6 pt-2">
        <div class="flex flex-wrap items-center gap-3">
          <div class="h-4 w-32 rounded-full bg-mist-50/10" />
          <span class="h-px w-8 bg-brass-300/35" />
          <div class="h-4 w-24 rounded-full bg-mist-50/10" />
        </div>

        <div class="grid gap-5">
          <div class="grid max-w-5xl gap-3">
            <div class="h-14 rounded-xl bg-mist-50/10 sm:h-20 lg:h-24" />
            <div
              class="h-14 w-10/12 rounded-xl bg-mist-50/10 sm:h-20 lg:h-24"
            />
            <div class="h-14 w-7/12 rounded-xl bg-mist-50/10 sm:h-20 lg:h-24" />
          </div>

          <div class="max-w-3xl border-l border-brass-200/25 pl-5">
            <div class="grid gap-3">
              <div class="h-5 w-full rounded-full bg-mist-50/10 sm:h-6" />
              <div class="h-5 w-8/12 rounded-full bg-mist-50/10 sm:h-6" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <div class="h-8 w-20 rounded-full bg-brass-200/12" />
            <div class="h-8 w-28 rounded-full bg-brass-200/12" />
            <div class="h-8 w-16 rounded-full bg-brass-200/12" />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div
            class="h-11 w-20 rounded-xl border border-mist-50/10 bg-mist-50/6"
          />
          <div
            class="h-11 w-20 rounded-xl border border-mist-50/10 bg-mist-50/6"
          />
          <div
            class="h-11 w-36 rounded-xl border border-brass-200/25 bg-brass-200/10"
          />
        </div>
      </header>

      <div
        class="aspect-[16/9] w-full rounded-xl border border-mist-50/10 bg-[linear-gradient(135deg,rgba(255,249,238,0.08),rgba(255,249,238,0.025)_48%,rgba(240,201,120,0.08))]"
      />

      <section class="article-shell px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div class="article-body mx-auto">
          <div class="grid gap-3">
            <div class="h-10 w-8/12 rounded-xl bg-mist-50/10 sm:h-12" />
            <div class="h-4 w-full rounded-full bg-mist-50/10" />
            <div class="h-4 w-10/12 rounded-full bg-mist-50/10" />
          </div>

          <div class="grid gap-3">
            <div
              v-for="line in skeletonParagraphLines"
              :key="line"
              :class="['h-4 rounded-full bg-mist-50/10', line]"
            />
          </div>

          <div
            class="rounded-xl border-l-4 border-brass-300/55 bg-brass-200/8 px-5 py-4"
          >
            <div class="grid gap-3">
              <div class="h-4 w-11/12 rounded-full bg-brass-100/14" />
              <div class="h-4 w-7/12 rounded-full bg-brass-100/14" />
            </div>
          </div>

          <div class="grid gap-3">
            <div class="h-8 w-5/12 rounded-xl bg-mist-50/10" />
            <div
              v-for="line in skeletonSecondParagraphLines"
              :key="line"
              :class="['h-4 rounded-full bg-mist-50/10', line]"
            />
          </div>

          <div
            class="grid gap-3 rounded-xl border border-mist-50/10 bg-ink-950/80 p-5"
          >
            <div
              v-for="line in skeletonCodeLines"
              :key="line"
              :class="['h-3 rounded-full bg-mist-50/12', line]"
            />
          </div>
        </div>
      </section>

      <section class="grid gap-5">
        <header class="grid gap-2">
          <div class="h-9 w-40 rounded-xl bg-mist-50/10" />
          <div class="h-4 w-16 rounded-full bg-mist-50/10" />
        </header>

        <div
          class="grid gap-3 rounded-xl bg-[#252525] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]"
        >
          <div class="h-4 w-44 rounded-full bg-mist-50/10" />
          <div
            v-for="line in skeletonCommentLines"
            :key="line"
            :class="['h-4 rounded-full bg-mist-50/10', line]"
          />
        </div>
      </section>
    </article>
    <ErrorNotice v-else-if="postError" :message="postError" />

    <article v-else-if="selectedPost" class="grid gap-8">
      <header class="grid gap-6 pt-2">
        <div
          class="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-mist-300"
        >
          <span class="inline-flex items-center gap-2">
            <CalendarDays class="h-4 w-4 text-brass-200" :stroke-width="1.8" />
            {{ formatLongDate(selectedPost.publishedAt) }}
          </span>
          <span class="h-px w-8 bg-brass-300/70" />
          <span class="inline-flex items-center gap-2">
            <Clock class="h-4 w-4 text-brass-200" :stroke-width="1.8" />
            {{ readingMinutes }} min read
          </span>
        </div>

        <div class="grid gap-5">
          <h1
            class="max-w-5xl text-balance font-display text-5xl font-bold leading-[0.9] tracking-[-0.075em] text-mist-50 sm:text-7xl lg:text-8xl"
          >
            {{ selectedPost.title }}
          </h1>
          <p
            v-if="selectedPost.subtitle"
            class="max-w-3xl border-l border-brass-200/35 pl-5 text-pretty text-lg leading-8 text-mist-200 sm:text-xl"
          >
            {{ selectedPost.subtitle }}
          </p>
          <div v-if="selectedPost.tags.length > 0" class="flex flex-wrap gap-2">
            <TagPill
              v-for="tag in selectedPost.tags"
              :key="tag.id"
              :name="tag.name"
              accent
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <template v-if="auth.isAuthenticated">
            <button
              type="button"
              :class="reactionButtonClass('Like')"
              :aria-pressed="isSelectedReaction('Like')"
              :disabled="isLoadingReaction || isUpdatingReaction"
              @click="updateReaction('Like')"
            >
              <ThumbsUp class="h-4 w-4" :stroke-width="1.9" />
              {{ formatCount(selectedPost.likeCount) }}
            </button>
            <button
              type="button"
              :class="reactionButtonClass('Dislike')"
              :aria-pressed="isSelectedReaction('Dislike')"
              :disabled="isLoadingReaction || isUpdatingReaction"
              @click="updateReaction('Dislike')"
            >
              <ThumbsDown class="h-4 w-4" :stroke-width="1.9" />
              {{ formatCount(selectedPost.dislikeCount) }}
            </button>
          </template>
          <template v-else>
            <span
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist-50/10 bg-mist-50/6 px-4 py-2 text-sm font-bold text-mist-100"
            >
              <ThumbsUp class="h-4 w-4 text-mist-300" :stroke-width="1.9" />
              {{ formatCount(selectedPost.likeCount) }}
            </span>
            <span
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist-50/10 bg-mist-50/6 px-4 py-2 text-sm font-bold text-mist-100"
            >
              <ThumbsDown class="h-4 w-4 text-mist-300" :stroke-width="1.9" />
              {{ formatCount(selectedPost.dislikeCount) }}
            </span>
            <RouterLink
              to="/signin"
              class="inline-flex min-h-11 items-center rounded-xl border border-brass-200/35 bg-brass-200/10 px-4 py-2 text-sm font-bold text-brass-100 transition hover:border-brass-200/60 hover:bg-brass-200/16"
            >
              Sign in to react
            </RouterLink>
          </template>
          <p v-if="reactionError" class="text-sm font-semibold text-red-200">
            {{ reactionError }}
          </p>
        </div>
      </header>

      <PostArtwork
        :image-id="imageId"
        :title="selectedPost.title"
        large
        priority
        class="rounded-xl"
      />

      <section class="article-shell px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div class="article-body mx-auto" v-html="articleHtml" />
      </section>

      <PostComments :post-id="selectedPost.id" />
    </article>
  </main>
</template>
