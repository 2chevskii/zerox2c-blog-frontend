<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import EmptyState from '@/components/EmptyState.vue'

useTitle('Not found | 0x2c.dev')
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
    <EmptyState title="Not found" message="The page you requested does not exist. Return to the notes index to continue reading." />
  </main>
</template>
