<script setup lang="ts">
import { computed, onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import { routeTransitionName } from "@/router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const routeTransitionMode = computed(() => (
  routeTransitionName.value === "page-forward" ? "out-in" : undefined
));

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
    <RouterView v-slot="{ Component, route }">
      <div class="page-transition-host">
        <Transition :name="routeTransitionName" :mode="routeTransitionMode">
          <component :is="Component" :key="route.fullPath" class="page-transition-view" />
        </Transition>
      </div>
    </RouterView>
  </div>
</template>
