<script setup lang="ts">
const skeletons = [0, 1, 2]
const tagSkeletons = [0, 1, 2]
const statSkeletons = [0, 1, 2]
</script>

<template>
  <div class="mx-auto grid w-full max-w-2xl gap-5" aria-label="Loading posts" aria-live="polite">
    <article
      v-for="index in skeletons"
      :key="index"
      class="grid h-full gap-3 rounded-xl bg-transparent p-3 sm:gap-4 sm:p-4 lg:p-5"
    >
      <div class="grid gap-3 sm:gap-4">
        <div class="aspect-[2/1] animate-pulse rounded-xl bg-[linear-gradient(135deg,rgba(255,249,238,0.08),rgba(255,249,238,0.025))]" />

        <div class="grid gap-3 px-1 pb-1 sm:px-2 lg:px-3">
          <div class="flex flex-wrap items-center gap-3">
            <div class="h-4 w-24 animate-pulse rounded-md bg-mist-50/10" />
            <div class="h-4 w-16 animate-pulse rounded-md bg-brass-100/10" />
          </div>

          <div class="grid gap-2">
            <div class="h-7 w-11/12 animate-pulse rounded-lg bg-mist-50/[0.12] sm:h-8 lg:h-10" />
            <div class="h-7 w-8/12 animate-pulse rounded-lg bg-mist-50/10 sm:h-8 lg:h-10" />
          </div>

          <div class="grid gap-2">
            <div class="h-4 w-full animate-pulse rounded-md bg-mist-50/[0.09] sm:h-5" />
            <div class="h-4 w-9/12 animate-pulse rounded-md bg-mist-50/[0.08] sm:h-5" />
          </div>

          <div class="flex flex-wrap gap-2">
            <div
              v-for="tagIndex in tagSkeletons"
              :key="tagIndex"
              class="h-7 animate-pulse rounded-lg border border-mist-50/[0.08] bg-mist-50/[0.035]"
              :class="tagIndex === 0 ? 'w-16' : tagIndex === 1 ? 'w-20' : 'w-14'"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div
              v-for="statIndex in statSkeletons"
              :key="statIndex"
              class="h-8 w-16 animate-pulse rounded-lg border border-mist-50/10 bg-mist-50/[0.035]"
            />
          </div>
        </div>
      </div>
    </article>
  </div>
</template>
