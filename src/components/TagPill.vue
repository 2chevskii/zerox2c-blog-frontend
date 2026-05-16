<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <span
    class="inline-flex h-7 items-center rounded-sm border border-cardboard-200/25 bg-cardboard-400/16 px-2.5 text-xs font-black uppercase tracking-normal text-cardboard-100"
  >
    {{ name }}
  </span>
</template>
