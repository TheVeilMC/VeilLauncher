import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/services/api';
import type {
  MinecraftAccount,
  MicrosoftAuthResponse,
} from '@the-veil/shared/src/types';
import { useNotificationStore } from './notifications';
import { useAppStore } from './app';

export const useAuthStore = defineStore('auth', () => {
  const activeAccount = ref<MinecraftAccount | null>(null);
  const showAuthModal = ref(false);
  const authState = ref<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const authData = ref<MicrosoftAuthResponse | null>(null);
  const authToken = ref<string | null>(null);

  const notificationStore = useNotificationStore();
  const appStore = useAppStore();

  const isAuthenticated = computed(() => activeAccount.value !== null);

  async function loadAccount() {
    try {
      const response = await apiService.getAuthStatus();
      if (response.success && response.data.isAuthenticated) {
        activeAccount.value = response.data.account;

        // Connect WebSocket if we have a token
        if (authToken.value) {
          appStore.connectWebSocket(authToken.value);
        }
      }
    } catch (error) {
      console.error('Failed to load account:', error);
    }
  }

  async function startAuthentication() {
    try {
      authState.value = 'waiting';
      showAuthModal.value = true;

      const response = await apiService.startDeviceFlow();
      if (response.success) {
        authData.value = response.data;

        // Start polling for token
        pollForToken(response.data.deviceCode);
      } else {
        throw new Error(response.error || 'Failed to start authentication');
      }
    } catch (error: any) {
      authState.value = 'error';
      notificationStore.addNotification({
        type: 'error',
        title: 'Authentication Failed',
        message: error.message || 'Failed to start authentication process',
      });
    }
  }

  async function pollForToken(deviceCode: string) {
    try {
      const response = await apiService.pollToken(deviceCode);

      console.log('Polling response:', response);

      if (response.success) {
        // Authentication successful
        activeAccount.value = response.data.account;
        authToken.value = response.data.token;
        authState.value = 'success';

        // Set token for API service
        apiService.setToken(response.data.token);

        // Connect WebSocket
        appStore.connectWebSocket(response.data.token);

        // Store token in Electron store
        await (window as any).electronAPI.storeSet(
          'auth_token',
          response.data.token
        );

        setTimeout(() => {
          showAuthModal.value = false;
          authState.value = 'idle';
        }, 2000);

        notificationStore.addNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${response.data.account.username}!`,
        });
      } else if (response.error === 'authorization_pending') {
        // Authorization is still pending - continue polling
        console.log('Authorization pending, continuing to poll...');
        setTimeout(() => pollForToken(deviceCode), 5000);
      } else {
        // Other error occurred
        throw new Error(
          response.error || response.message || 'Authentication failed'
        );
      }
    } catch (error: any) {
      console.log('Polling error response:', error);

      // Check if this is a 401 with authorization_pending
      if (
        error.response?.status === 401 &&
        error.response?.data?.error === 'authorization_pending'
      ) {
        console.log(
          'Authorization pending (from 401 response), continuing to poll...'
        );
        setTimeout(() => pollForToken(deviceCode), 5000);
      } else if (error.response?.data?.error === 'authorization_pending') {
        // Handle any other status code with authorization_pending
        console.log(
          'Authorization pending (from error response), continuing to poll...'
        );
        setTimeout(() => pollForToken(deviceCode), 5000);
      } else {
        // Actual error occurred
        authState.value = 'error';
        notificationStore.addNotification({
          type: 'error',
          title: 'Authentication Failed',
          message:
            error.response?.data?.message ||
            error.message ||
            'Failed to authenticate with Microsoft',
        });
      }
    }
  }

  async function refreshToken() {
    if (!activeAccount.value) return;

    try {
      const response = await apiService.refreshToken(
        activeAccount.value.refreshToken
      );

      if (response.success) {
        activeAccount.value = response.data.account;
        authToken.value = response.data.token;

        // Update token for API service
        apiService.setToken(response.data.token);

        // Store new token
        await (window as any).electronAPI.storeSet(
          'auth_token',
          response.data.token
        );
      } else {
        throw new Error(response.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Force re-authentication
      await logout();
    }
  }

  async function logout() {
    try {
      await apiService.logout();

      // Clear local state
      activeAccount.value = null;
      authToken.value = null;

      // Clear API token
      apiService.clearToken();

      // Disconnect WebSocket
      appStore.disconnectWebSocket();

      // Clear stored token
      await (window as any).electronAPI.storeDelete('auth_token');

      notificationStore.addNotification({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been logged out successfully',
      });
    } catch (error) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Logout Failed',
        message: 'Failed to logout properly',
      });
    }
  }

  async function initializeFromStorage() {
    try {
      const tokenResult = await (window as any).electronAPI.storeGet(
        'auth_token'
      );
      if (tokenResult.success && tokenResult.value) {
        authToken.value = tokenResult.value;
        apiService.setToken(tokenResult.value);

        // Try to get current auth status
        await loadAccount();
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
    }
  }

  function closeAuthModal() {
    showAuthModal.value = false;
    authState.value = 'idle';
    authData.value = null;
  }

  return {
    activeAccount,
    showAuthModal,
    authState,
    authData,
    isAuthenticated,
    authToken,
    loadAccount,
    startAuthentication,
    refreshToken,
    logout,
    initializeFromStorage,
    closeAuthModal,
  };
});
