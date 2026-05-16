<script setup lang="ts">
import { computed } from 'vue'
import { Code2 } from '@lucide/vue'
import { imageUrl } from '@/utils/images'

const props = defineProps<{
  imageId: string | null
  title: string
  large?: boolean
}>()

const src = computed(() => imageUrl(props.imageId))
</script>

<template>
  <div
    class="relative overflow-hidden bg-concrete-900"
    :class="large ? 'aspect-[16/9]' : 'aspect-[5/3]'"
  >
    <img
      v-if="src"
      :src="src"
      :alt="title"
      class="h-full w-full object-cover saturate-[0.82] contrast-110"
      loading="lazy"
    />
    <div
      v-else
      class="grid h-full w-full place-items-center border border-concrete-100/10 bg-[linear-gradient(135deg,#1b1615,#0b0a0b_58%,#330a1d),repeating-linear-gradient(90deg,transparent_0_16px,rgba(247,214,173,0.06)_16px_17px),repeating-linear-gradient(0deg,transparent_0_10px,rgba(165,22,82,0.12)_10px_11px)] bg-blend-overlay"
    >
      <Code2 class="h-10 w-10 text-cardboard-200/70" :stroke-width="1.5" />
    </div>
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-burgundy-900/10 to-black/20" />
    <div class="pointer-events-none absolute inset-0 mix-blend-screen opacity-30 bg-[repeating-linear-gradient(105deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_8px)]" />
    <div class="pointer-events-none absolute bottom-0 left-0 h-1 w-1/2 bg-cardboard-300/80" />
  </div>
</template>
