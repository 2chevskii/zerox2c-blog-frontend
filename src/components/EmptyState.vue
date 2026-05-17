<script setup lang="ts">
import { SearchX } from '@lucide/vue'

defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <div class="loft-panel grid place-items-center rounded-sm px-6 py-14 text-center sm:py-16">
    <div class="grid max-w-md place-items-center gap-4">
      <SearchX class="h-9 w-9 text-concrete-300" :stroke-width="1.5" />
      <div>
        <h2 class="text-xl font-black uppercase tracking-normal text-[#fff8ee]">{{ title }}</h2>
        <p class="mt-2 text-sm leading-6 text-concrete-300">{{ message }}</p>
      </div>
    </div>
  </div>
</template>
