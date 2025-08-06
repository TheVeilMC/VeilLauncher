import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ipcService } from '@/services/ipc';
import type { Status } from '@the-veil/shared/src/types';
import { useNotificationStore } from './notifications';
import { useAuthStore } from './auth';
import { WEBSOCKET_EVENTS } from '@the-veil/shared/src/constants';

export const useLaunchStore = defineStore('launch', () => {
  const isLaunching = ref(false);
  const isRunning = ref(false);
  const currentInstanceId = ref<string | null>(null);
  const status = ref<Status | null>(null);
  const logs = ref<string[]>(['']);
  const verificationError = ref<string | null>(null);
  const showVerificationDialog = ref(false);
  const processMemory = ref<{
    allocatedMemory: number; // Memory allocated to JVM (from -Xmx)
    usedMemory: number; // Currently used memory by the process
    percentageUsed: number; // Percentage of allocated memory being used
    timestamp: number;
  }>({
    allocatedMemory: 0,
    usedMemory: 0,
    percentageUsed: 0,
    timestamp: Date.now(),
  });

  const update = ref<boolean>(false);
  const updateData = ref<{ newVersion?: string; oldVersion?: string } | null>(
    null
  );
  const isUpdating = ref<boolean>(false);

  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();

  const showLogs = ref(false);

  const canLaunch = computed(() => !isLaunching.value && !isRunning.value);

  async function start() {
    if (!canLaunch.value) return;

    if (update.value) {
      notificationStore.addNotification({
        type: 'info',
        title: 'Update Required',
        message: 'Updating The Veil... Please wait.',
      });
      isUpdating.value = true;
      await ipcService.updateInstance();
      isUpdating.value = false;
      notificationStore.addNotification({
        type: 'success',
        title: 'Update Complete',
        message: 'The Veil has been updated successfully.',
        priority: { level: 'normal' },
        category: 'game',
      });
      update.value = false; // Reset update flag after updating
    }

    try {
      isLaunching.value = true;
      status.value = {
        status: 'preparing',
        message: 'Preparing to launch The Veil...',
        progress: 0,
      };

      const accountData = authStore.activeAccount
        ? {
            username: authStore.activeAccount.username,
            uuid: authStore.activeAccount.uuid,
            accessToken: authStore.activeAccount.accessToken,
            token: authStore.authToken,
          }
        : null;

      const response = await ipcService.startGame({
        account: accountData,
      });

      if (response.success) {
        currentInstanceId.value = response.data.instanceId;
        isRunning.value = true;

        notificationStore.addNotification({
          type: 'success',
          title: 'Game Launched',
          message: 'The Veil is starting up...',
        });
      } else {
        throw new Error(response.error || 'Failed to start game');
      }
    } catch (error: any) {
      console.log(error);
      notificationStore.addNotification({
        type: 'error',
        title: 'Launch Failed',
        message: error.message || 'Failed to launch The Veil',
        priority: { level: 'high', flashTaskbar: true },
        category: 'game',
      });

      status.value = {
        status: 'error',
        message: 'Launch failed',
        details: error.message,
      };
    } finally {
      isLaunching.value = false;
    }
  }

  async function stopGame() {
    if (!currentInstanceId.value) return;

    try {
      await ipcService.stopGame(currentInstanceId.value);
      isRunning.value = false;
      currentInstanceId.value = null;
      status.value = {
        status: 'stopped',
        message: 'Game stopped',
      };

      notificationStore.addNotification({
        type: 'info',
        title: 'Game Stopped',
        message: 'The Veil has been stopped',
        priority: { level: 'low' },
        category: 'game',
      });
    } catch (error: any) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Stop Failed',
        message: 'Failed to stop the game',
        priority: { level: 'normal' },
        category: 'game',
      });
    }
  }

  async function checkStatus() {
    try {
      const response = await ipcService.getLaunchStatus();
      isRunning.value = response.isRunning;
    } catch (error) {
      console.error('Failed to check launch status:', error);
    }
  }

  function setupIPCListeners() {
    setTimeout(() => {
      checkForUpdates();
    }, 1000); // Check for updates every 5 minutes

    (window as any).electron.on(
      WEBSOCKET_EVENTS.LAUNCH_STATUS,
      (_event: any, data: Status) => {
        status.value = data;

        if (data.status === 'running') {
          isRunning.value = true;
          isLaunching.value = false;
        } else if (data.status === 'stopped') {
          isRunning.value = false;
          currentInstanceId.value = null;
        } else if (data.status === 'error') {
          isRunning.value = false;
          isLaunching.value = false;
        }
      }
    );

    (window as any).electron.on(
      WEBSOCKET_EVENTS.VERIFICATION_STATUS,
      (_event: any, data: Status) => {
        status.value = data;
      }
    );

    (window as any).electron.on(
      WEBSOCKET_EVENTS.UPDATE_STATUS,
      (_event: any, data: Status) => {
        status.value = data;
      }
    );

    (window as any).electron.on(
      WEBSOCKET_EVENTS.PROCESS_MEMORY_UPDATE,
      (_event: any, data: { allocatedMemory: number; usedMemory: number }) => {
        processMemory.value.allocatedMemory = data.allocatedMemory;
        processMemory.value.usedMemory = data.usedMemory;
        processMemory.value.percentageUsed =
          (data.usedMemory / data.allocatedMemory) * 100;
        processMemory.value.timestamp = Date.now();
      }
    );

    (window as any).electron.on(
      WEBSOCKET_EVENTS.MINECRAFT_CLOSED,
      (_event: any, _data: any) => {
        isRunning.value = false;
        isLaunching.value = false;
        currentInstanceId.value = null;
        status.value = null;
      }
    );

    (window as any).electron.on(
      WEBSOCKET_EVENTS.MINECRAFT_OUTPUT,
      (_event: any, data: any) => {
        logs.value.push(data.data);
      }
    );
    (window as any).electron.on(
      WEBSOCKET_EVENTS.VERIFICATION_FAILED,
      (_event: any, data: any) => {
        verificationError.value =
          data?.error || 'Game file verification failed.';
        showVerificationDialog.value = true;
        status.value = {
          status: 'error',
          message: 'Game file verification failed',
          details: verificationError.value ?? undefined,
        };
        isLaunching.value = false;
        isRunning.value = false;
      }
    );
  }

  function checkForUpdates() {
    return ipcService
      .checkUpdates()
      .then(
        (data: {
          update: boolean;
          newVersion?: string;
          oldVersion?: string;
        }) => {
          console.log('Update check result:', data);
          update.value = data.update;
          if (data.update) {
            notificationStore.addNotification({
              type: 'info',
              title: 'Update Available',
              message:
                'A new update for The Veil is available. Please update to continue.',
            priority: { level: 'high', flashTaskbar: true },
            category: 'update',
            actions: [
              {
                id: 'update-now',
                label: 'Update Now',
                action: 'custom',
                style: 'primary',
              },
              {
                id: 'dismiss',
                label: 'Later',
                action: 'dismiss',
                style: 'secondary',
              },
            ],
            });
          }
          updateData.value = {
            newVersion: data.newVersion,
            oldVersion: data.oldVersion,
          };
          setTimeout(
            () => {
              checkForUpdates();
            },
            1000 * 60 * 5
          ); // Check for updates every 5 minutes
          return { update: data.update };
        }
      )
      .catch((error: any) => {
        console.error('Failed to check for updates:', error);
        return { update: false };
      });
  }

  return {
    isLaunching,
    isRunning,
    currentInstanceId,
    status,
    logs,
    canLaunch,
    update,
    updateData,
    isUpdating,
    showLogs,
    processMemory,
    start,
    stopGame,
    checkStatus,
    setupIPCListeners,
    verificationError,
    showVerificationDialog,
  };
});
