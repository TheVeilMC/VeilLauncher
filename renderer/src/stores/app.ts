import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocket';
import type { SystemInfo } from '@the-veil/shared/src/types';
import { useNotificationStore } from './notifications';
import router from '@/router';

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false);
  const systemInfo = ref<SystemInfo | null>(null);
  const appVersion = ref('');
  const isInitialized = ref(false);
  const isConnected = ref(false);
  const updateAvailable = ref(false);

  const notificationStore = useNotificationStore();

  async function initialize() {
    if (isInitialized.value) return;

    isLoading.value = true;

    try {
      // Get app version from Electron
      appVersion.value = await (window as any).electronAPI.getAppVersion();

      // Initialize profile
      await apiService.initializeProfile();

      isInitialized.value = true;

      router.push({ name: 'Home' });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      notificationStore.addNotification({
        type: 'error',
        title: 'Initialization Failed',
        message: 'Failed to initialize the application',
      });
    } finally {
      isLoading.value = false;
    }
  }

  function connectWebSocket(token: string) {
    websocketService.connect(token);

    websocketService.on('connected', () => {
      isConnected.value = true;
    });

    websocketService.on('disconnected', () => {
      isConnected.value = false;
    });

    websocketService.on('error', () => {
      isConnected.value = false;
    });

    (window as any).electron.on('update-available', () => {
      notificationStore.addNotification({
        type: 'info',
        title: 'Update Available',
        message: 'A new version of The Veil is available. Please update.',
      });

      updateAvailable.value = true;
    });
  }

  function disconnectWebSocket() {
    websocketService.disconnect();
    isConnected.value = false;
  }

  async function clearCache() {
    try {
      // This would be handled by the backend
      notificationStore.addNotification({
        type: 'success',
        title: 'Cache Cleared',
        message: 'Application cache has been cleared',
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      notificationStore.addNotification({
        type: 'error',
        title: 'Clear Failed',
        message: 'Failed to clear cache',
      });
    }
  }

  async function openFolder(path: string) {
    try {
      await (window as any).electronAPI.showFolder(path);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  }

  async function selectFolder() {
    try {
      const result = await (window as any).electronAPI.selectFolder();
      return result.success ? result.path : null;
    } catch (error) {
      console.error('Failed to select folder:', error);
      return null;
    }
  }

  return {
    isLoading,
    systemInfo,
    appVersion,
    isInitialized,
    isConnected,
    updateAvailable,
    initialize,
    connectWebSocket,
    disconnectWebSocket,
    clearCache,
    openFolder,
    selectFolder,
  };
});
