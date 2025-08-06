<template>
  <div
    id="app"
    class="h-screen w-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900"
  >
    <!-- Custom Title Bar -->
    <TitleBar />

    <div class="flex h-full pt-8">
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>

    <!-- Global Modals -->
    <AuthModal v-if="authStore.showAuthModal" />
    <LoadingOverlay v-if="appStore.isLoading" />
    <NotificationContainer />
    <UpdateOverlay v-if="updateAvailable" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { useNotificationStore } from '@/stores/notifications';
import TitleBar from '@/components/layout/TitleBar.vue';
import AuthModal from '@/components/auth/AuthModal.vue';
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue';
import NotificationContainer from '@/components/ui/NotificationContainer.vue';
import UpdateOverlay from '@/components/ui/UpdateOverlay.vue';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

const { updateAvailable } = storeToRefs(appStore);

onMounted(async () => {
  // Initialize auth from storage first
  await authStore.initializeFromStorage();

  // Initialize notifications
  await notificationStore.initialize();

  // Then initialize the app
  await appStore.initialize();

  // Hide loading screen
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
});
</script>
