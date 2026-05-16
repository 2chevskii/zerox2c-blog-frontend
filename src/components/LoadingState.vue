<template>
  <div class="grid gap-4">
    <div
      v-for="index in 3"
      :key="index"
      class="h-48 animate-pulse rounded-sm border border-concrete-100/10 bg-[linear-gradient(90deg,rgba(165,22,82,0.12),rgba(238,231,220,0.035),rgba(196,122,55,0.08))]"
    />
  </div>
</template>
