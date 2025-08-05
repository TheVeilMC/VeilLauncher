import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocket';
import type { ModInfo } from '@the-veil/shared/src/types';
import { useNotificationStore } from './notifications';

export const useModStore = defineStore('mods', () => {
  const mods = ref<ModInfo[]>([]);
  const isLoading = ref(false);
  const isUpdating = ref(false);
  const updateProgress = ref(0);
  const updateStatus = ref<string>('');
  const currentVersion = ref<string>('');

  const notificationStore = useNotificationStore();

  async function loadMods() {
    try {
      isLoading.value = true;
      const response = await apiService.getMods();

      if (response.success) {
        mods.value = response.data;
      } else {
        throw new Error(response.error || 'Failed to load mods');
      }
    } catch (error: any) {
      console.error('Failed to load mods:', error);
      notificationStore.addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load mod information',
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function checkForUpdates() {
    try {
      const response = await apiService.checkModUpdates();

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to check for updates');
      }
    } catch (error: any) {
      console.error('Failed to check for mod updates:', error);
      notificationStore.addNotification({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Failed to check for mod updates',
      });
      return { hasUpdates: false, availableUpdates: [] };
    }
  }

  async function updateMods() {
    try {
      isUpdating.value = true;
      updateProgress.value = 0;
      updateStatus.value = 'Starting update...';

      const response = await apiService.updateMods();

      if (response.success) {
        // Reload mods after update
        await loadMods();

        notificationStore.addNotification({
          type: 'success',
          title: 'Mods Updated',
          message: `Successfully updated ${response.data.updatedMods.length} mod(s)`,
        });

        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update mods');
      }
    } catch (error: any) {
      console.error('Failed to update mods:', error);
      notificationStore.addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update mods',
      });
      throw error;
    } finally {
      isUpdating.value = false;
      updateProgress.value = 0;
      updateStatus.value = '';
    }
  }

  async function getCurrentVersion() {
    try {
      const response = await apiService.getCurrentModVersion();

      if (response.success) {
        currentVersion.value = response.data.version;
        return response.data.version;
      }
    } catch (error) {
      console.error('Failed to get current mod version:', error);
    }

    return '1.0.0';
  }

  function setupWebSocketListeners() {
    websocketService.onModUpdate((data: any) => {
      updateStatus.value = data.message;
      if (data.progress !== undefined) {
        updateProgress.value = data.progress;
      }

      if (data.status === 'completed') {
        isUpdating.value = false;
        loadMods(); // Reload mods after successful update
      } else if (data.status === 'error') {
        isUpdating.value = false;
        updateProgress.value = 0;
      }
    });

    websocketService.onDownloadProgress((data: any) => {
      if (isUpdating.value) {
        updateStatus.value = `Downloading ${data.id}... ${data.progress}%`;
        updateProgress.value = data.progress;
      }
    });
  }

  return {
    mods,
    isLoading,
    isUpdating,
    updateProgress,
    updateStatus,
    currentVersion,
    loadMods,
    checkForUpdates,
    updateMods,
    getCurrentVersion,
    setupWebSocketListeners,
  };
});
