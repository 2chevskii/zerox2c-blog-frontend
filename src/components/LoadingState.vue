<script setup lang="ts">
const skeletons = [0, 1, 2]
</script>

<template>
  <div class="grid gap-4 md:grid-cols-3">
    <div
      v-for="index in skeletons"
      :key="index"
      class="h-72 animate-pulse rounded-xl border border-mist-50/10 bg-[linear-gradient(115deg,rgba(255,249,238,0.07),rgba(255,249,238,0.025),rgba(255,249,238,0.055))]"
    />
  </div>
</template>
