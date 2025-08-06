import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { 
  StoredNotification, 
  NotificationSettings, 
  NotificationPriority,
  NotificationAction 
} from '@the-veil/shared/src/types/notifications';


export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<StoredNotification[]>([]);
  const unreadCount = ref(0);
  const settings = ref<NotificationSettings | null>(null);
  const isLoading = ref(false);

  async function initialize() {
    try {
      await loadNotifications();
      await loadSettings();
      await updateUnreadCount();
      setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize notification store:', error);
    }
  }

  async function loadNotifications() {
    try {
      const response = await (window as any).electronAPI.notificationGetAll();
      if (response.success) {
        notifications.value = response.data || [];
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  async function loadSettings() {
    try {
      const response = await (window as any).electronAPI.notificationGetSettings();
      if (response.success) {
        settings.value = response.data;
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  async function updateUnreadCount() {
    try {
      const count = await (window as any).electronAPI.notificationGetUnreadCount();
      unreadCount.value = count;
    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  }

  async function addNotification(
    notification: Omit<StoredNotification, 'id' | 'createdAt'> & {
      priority?: NotificationPriority;
      actions?: NotificationAction[];
    }
  ) {
    try {
      isLoading.value = true;
      
      const notificationData: Omit<StoredNotification, 'id' | 'createdAt'> = {
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        priority: notification.priority || { level: 'normal' },
        actions: notification.actions,
        metadata: notification.metadata,
        category: notification.category || 'system',
        source: notification.source || 'app',
        persistent: notification.persistent || false,
        groupId: notification.groupId,
      };

      const response = await (window as any).electronAPI.notificationCreate(notificationData);
      
      if (response.success) {
        await loadNotifications();
        await updateUnreadCount();
      } else {
        console.error('Failed to create notification:', response.error);
      }
    } catch (error) {
      console.error('Failed to add notification:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function markAsRead(id: string) {
    try {
      const response = await (window as any).electronAPI.notificationMarkRead(id);
      if (response.success) {
        const notification = notifications.value.find(n => n.id === id);
        if (notification) {
          notification.readAt = new Date().toISOString();
        }
        await updateUnreadCount();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await (window as any).electronAPI.notificationMarkAllRead();
      if (response.success) {
        notifications.value.forEach(notification => {
          if (!notification.readAt) {
            notification.readAt = new Date().toISOString();
          }
        });
        await updateUnreadCount();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async function dismissNotification(id: string) {
    try {
      const response = await (window as any).electronAPI.notificationDismiss(id);
      if (response.success) {
        const notification = notifications.value.find(n => n.id === id);
        if (notification) {
          notification.dismissedAt = new Date().toISOString();
        }
        await updateUnreadCount();
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  async function clearAllNotifications() {
    try {
      const response = await (window as any).electronAPI.notificationClearAll();
      if (response.success) {
        notifications.value = [];
        unreadCount.value = 0;
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  async function updateSettings(newSettings: Partial<NotificationSettings>) {
    try {
      const response = await (window as any).electronAPI.notificationUpdateSettings(newSettings);
      if (response.success) {
        settings.value = { ...settings.value!, ...newSettings };
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  function setupEventListeners() {
    // Listen for new notifications from main process
    (window as any).electronAPI.onNotificationCreated((notification: StoredNotification) => {
      notifications.value.unshift(notification);
      updateUnreadCount();
    });

    (window as any).electronAPI.onNotificationRead((notification: StoredNotification) => {
      const index = notifications.value.findIndex(n => n.id === notification.id);
      if (index !== -1) {
        notifications.value[index] = notification;
      }
      updateUnreadCount();
    });

    (window as any).electronAPI.onNotificationDismissed((notification: StoredNotification) => {
      const index = notifications.value.findIndex(n => n.id === notification.id);
      if (index !== -1) {
        notifications.value[index] = notification;
      }
      updateUnreadCount();
    });

    (window as any).electronAPI.onNotificationsCleared(() => {
      notifications.value = [];
      unreadCount.value = 0;
    });

    (window as any).electronAPI.onNotificationClicked((notification: StoredNotification) => {
      // Handle notification click actions
      if (notification.actions) {
        // Execute default action or show action menu
        console.log('Notification clicked:', notification);
      }
    });
  }

  // Computed getters
  function getUnreadNotifications() {
    return notifications.value.filter(n => !n.readAt && !n.dismissedAt);
  }

  function getNotificationsByCategory(category: string) {
    return notifications.value.filter(n => n.category === category);
  }

  function getNotificationsByPriority(priority: string) {
    return notifications.value.filter(n => n.priority.level === priority);
  }

  // Legacy compatibility method
  function removeNotification(id: string) {
    dismissNotification(id);
  }

  function clearAll() {
    clearAllNotifications();
  }

  return {
    notifications,
    unreadCount,
    settings,
    isLoading,
    initialize,
    loadNotifications,
    loadSettings,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    updateSettings,
    getUnreadNotifications,
    getNotificationsByCategory,
    getNotificationsByPriority,
    // Legacy compatibility
    removeNotification,
    clearAll,
  };
});
