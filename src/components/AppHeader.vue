<script setup lang="ts">
import { GitBranch } from '@lucide/vue'
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-mist-50/10 bg-ink-950/78 backdrop-blur-2xl backdrop-saturate-150">
    <div class="mx-auto flex w-full max-w-7xl min-w-0 items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <RouterLink to="/" class="group inline-flex min-w-0 items-center gap-3" aria-label="0x2c.dev home">
        <span class="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-mist-50/14 bg-mist-50/8 font-display text-sm font-bold text-mist-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(240,201,120,0.28),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]" />
          <span class="relative">2C</span>
        </span>
        <span class="grid min-w-0 leading-none">
          <span class="font-display text-base font-bold tracking-[-0.04em] text-mist-50">0x2c.dev</span>
          <span class="mt-1 hidden truncate text-[0.68rem] font-bold uppercase tracking-[0.24em] text-mist-300/70 transition group-hover:text-brass-100 sm:block">
            engineering notes
          </span>
        </span>
      </RouterLink>

      <nav class="ml-auto flex shrink-0 items-center gap-2" aria-label="Primary navigation">
        <RouterLink
          to="/"
          class="min-h-11 rounded-full border border-mist-50/10 bg-mist-50/6 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-mist-100 transition hover:border-brass-200/45 hover:bg-brass-200/10 hover:text-brass-100"
        >
          Notes
        </RouterLink>
        <a
          href="https://github.com/2chevskii"
          target="_blank"
          rel="noreferrer"
          class="grid h-11 w-11 place-items-center rounded-full border border-mist-50/10 bg-mist-50/6 text-mist-300 transition hover:border-brass-200/45 hover:bg-brass-200/10 hover:text-brass-100"
          title="GitHub"
          aria-label="GitHub"
        >
          <GitBranch class="h-4 w-4" />
        </a>
      </nav>
    </div>
  </header>
</template>
