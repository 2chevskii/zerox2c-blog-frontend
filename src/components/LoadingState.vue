<template>
  <div class="grid gap-4">
    <div
      v-for="index in 3"
      :key="index"
      class="h-48 animate-pulse rounded-sm border border-concrete-100/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(238,231,220,0.03),rgba(255,255,255,0.07))]"
    />
  </div>
</template>
