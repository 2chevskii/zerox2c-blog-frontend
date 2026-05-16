<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-[#0b0a0b] text-[#eee7dc]">
    <AppHeader />
    <RouterView />
    <footer class="border-t border-concrete-100/10 bg-black/20 px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs font-black uppercase tracking-normal text-concrete-300/70">
        <span>0x2c.dev</span>
        <span class="text-cardboard-200/80">2026</span>
      </div>
    </footer>
  </div>
</template>
