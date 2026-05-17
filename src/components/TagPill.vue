<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <span
    class="inline-flex h-7 items-center rounded-sm border border-concrete-100/15 bg-concrete-100/10 px-2.5 text-xs font-black uppercase tracking-normal text-concrete-100"
  >
    {{ name }}
  </span>
</template>
