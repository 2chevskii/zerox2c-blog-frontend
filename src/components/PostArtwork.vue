<script setup lang="ts">
import { computed } from 'vue'
import { Code2 } from '@lucide/vue'
import { imageUrl } from '@/utils/images'

const props = withDefaults(defineProps<{
  imageId: string | null
  title: string
  large?: boolean
  square?: boolean
  priority?: boolean
}>(), {
  large: false,
  square: false,
  priority: false,
})

const src = computed(() => imageUrl(props.imageId))
const aspectClass = computed(() => {
  if (props.square) {
    return 'aspect-square'
  }

  return props.large ? 'aspect-[16/9]' : 'aspect-[5/3]'
})
const loadingMode = computed(() => props.priority ? 'eager' : 'lazy')
</script>

<template>
  <div class="relative overflow-hidden bg-ink-900" :class="aspectClass">
    <img
      v-if="src"
      :src="src"
      :alt="title"
      class="h-full w-full object-cover saturate-[0.88] contrast-110 transition duration-500 group-hover:scale-[1.035]"
      :loading="loadingMode"
    />
    <div
      v-else
      class="grid h-full w-full place-items-center border border-mist-50/10 bg-[linear-gradient(135deg,#11181c,#0b0f12)]"
    >
      <Code2 class="h-10 w-10 text-brass-100/80" :stroke-width="1.5" />
    </div>
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/68 via-ink-950/5 to-transparent" />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-mist-50/18" />
  </div>
</template>
