<script setup lang="ts">
import { onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

onMounted(() => {
  if (!auth.isAuthenticated) {
    return;
  }

  void auth.refreshCurrentUser().catch(() => {
    auth.clearSession();
  });
});
</script>

<template>
  <div class="relative min-h-screen text-mist-100 scroll-auto">
    <AppHeader />
    <RouterView />
  </div>
</template>
