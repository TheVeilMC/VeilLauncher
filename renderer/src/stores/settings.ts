import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api';
import { useNotificationStore } from './notifications';

export interface LauncherSettings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  autoLaunch: boolean;
  autoUpdate: boolean;
  javaPath: string;
  defaultMemory: number;
  gameDirectory: string;
  keepLauncherOpen: boolean;
  developerMode: boolean;
  debugLogging: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  showNotifications: boolean;
  autoCheckUpdates: boolean;
  updateChannel: 'stable' | 'beta';
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<LauncherSettings>({
    theme: 'dark',
    language: 'en',
    autoLaunch: false,
    autoUpdate: true,
    javaPath: '',
    defaultMemory: 4096,
    gameDirectory: '',
    keepLauncherOpen: true,
    developerMode: false,
    debugLogging: false,
    minimizeToTray: true,
    closeToTray: false,
    showNotifications: true,
    autoCheckUpdates: true,
    updateChannel: 'stable',
  });

  const isLoading = ref(false);
  const hasUnsavedChanges = ref(false);

  const notificationStore = useNotificationStore();

  async function loadSettings() {
    try {
      isLoading.value = true;

      // Load from Electron store first
      const electronSettings = await (window as any).electronAPI.storeGet(
        'launcher_settings'
      );
      if (electronSettings.success && electronSettings.value) {
        settings.value = {
          ...settings.value,
          ...JSON.parse(electronSettings.value),
        };
      }

      // Then sync with backend
      const response = await apiService.getSettings();
      if (response.success) {
        settings.value = { ...settings.value, ...response.data };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function saveSettings() {
    try {
      isLoading.value = true;

      // Save to backend
      const response = await apiService.saveSettings(settings.value);
      if (!response.success) {
        throw new Error(response.error || 'Failed to save settings');
      }

      // Save to Electron store
      await (window as any).electronAPI.storeSet(
        'launcher_settings',
        JSON.stringify(settings.value)
      );

      hasUnsavedChanges.value = false;

      notificationStore.addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your settings have been saved successfully',
      });
    } catch (error: any) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save settings',
      });
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  function updateSetting<K extends keyof LauncherSettings>(
    key: K,
    value: LauncherSettings[K]
  ) {
    settings.value[key] = value;
    hasUnsavedChanges.value = true;
  }

  async function resetSettings() {
    const defaultSettings: LauncherSettings = {
      theme: 'dark',
      language: 'en',
      autoLaunch: false,
      autoUpdate: true,
      javaPath: '',
      defaultMemory: 4096,
      gameDirectory: '',
      keepLauncherOpen: true,
      developerMode: false,
      debugLogging: false,
      minimizeToTray: true,
      closeToTray: false,
      showNotifications: true,
      autoCheckUpdates: true,
      updateChannel: 'stable',
    };

    settings.value = defaultSettings;
    hasUnsavedChanges.value = true;

    notificationStore.addNotification({
      type: 'info',
      title: 'Settings Reset',
      message: 'Settings have been reset to defaults',
    });
  }

  async function selectJavaPath() {
    try {
      const result = await (window as any).electronAPI.selectFile({
        title: 'Select Java Executable',
        filters: [
          { name: 'Java Executable', extensions: ['exe'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.success && result.path) {
        updateSetting('javaPath', result.path);
        return result.path;
      }
    } catch (error) {
      console.error('Failed to select Java path:', error);
    }
    return null;
  }

  async function selectGameDirectory() {
    try {
      const result = await (window as any).electronAPI.selectFolder();

      if (result.success && result.path) {
        updateSetting('gameDirectory', result.path);
        return result.path;
      }
    } catch (error) {
      console.error('Failed to select game directory:', error);
    }
    return null;
  }

  async function openGameDirectory() {
    if (settings.value.gameDirectory) {
      await (window as any).electronAPI.showFolder(
        settings.value.gameDirectory
      );
    }
  }

  async function clearCache() {
    try {
      const response = await apiService.clearCache();
      if (response.success) {
        notificationStore.addNotification({
          type: 'success',
          title: 'Cache Cleared',
          message: 'Application cache has been cleared',
        });
      }
    } catch (error) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Clear Failed',
        message: 'Failed to clear cache',
      });
    }
  }

  async function exportLogs() {
    try {
      const response = await apiService.exportLogs();
      if (response.success) {
        notificationStore.addNotification({
          type: 'success',
          title: 'Logs Exported',
          message: 'Logs have been exported successfully',
        });
      }
    } catch (error) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export logs',
      });
    }
  }

  return {
    settings,
    isLoading,
    hasUnsavedChanges,
    loadSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    selectJavaPath,
    selectGameDirectory,
    openGameDirectory,
    clearCache,
    exportLogs,
  };
});
