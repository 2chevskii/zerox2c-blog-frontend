<script setup lang="ts">
import { AlertTriangle } from '@lucide/vue'

defineProps<{
  message: string
}>()
</script>

<template>
  <div class="grid w-full max-w-full grid-cols-[auto_1fr] items-start gap-3 rounded-sm border border-burgundy-300/30 bg-burgundy-900/45 p-4 text-sm text-burgundy-50">
    <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-burgundy-200" />
    <p class="min-w-0 leading-6">{{ message }}</p>
  </div>
</template>
