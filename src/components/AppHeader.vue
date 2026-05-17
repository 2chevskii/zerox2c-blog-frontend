<script setup lang="ts">
import { GitBranch } from '@lucide/vue'
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-concrete-100/10 bg-[#171717]/95">
    <div class="mx-auto flex w-full max-w-7xl min-w-0 items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
      <RouterLink to="/" class="group inline-flex min-w-0 items-center gap-3">
        <span class="grid h-9 w-9 place-items-center rounded-sm border border-concrete-100/20 bg-concrete-100/10 text-sm font-black text-concrete-100">
          2C
        </span>
        <span class="grid leading-none">
          <span class="text-sm font-black uppercase tracking-normal text-[#fff8ee]">0x2c.dev</span>
          <span class="mt-1 hidden text-xs font-bold uppercase tracking-normal text-concrete-300 group-hover:text-concrete-100 sm:block">
            engineering notes
          </span>
        </span>
      </RouterLink>

      <nav class="ml-auto flex shrink-0 items-center gap-2">
        <RouterLink
          to="/"
          class="rounded-sm border border-concrete-100/10 bg-concrete-900/70 px-3 py-2 text-xs font-black uppercase tracking-normal text-concrete-100 transition hover:border-concrete-100/30 hover:bg-concrete-100/10"
        >
          News
        </RouterLink>
        <a
          href="https://github.com/2chevskii"
          target="_blank"
          rel="noreferrer"
          class="grid h-9 w-9 place-items-center rounded-sm border border-concrete-100/10 bg-concrete-900/70 text-concrete-300 transition hover:border-concrete-100/30 hover:text-concrete-100"
          title="GitHub"
          aria-label="GitHub"
        >
          <GitBranch class="h-4 w-4" />
        </a>
      </nav>
    </div>
  </header>
</template>
