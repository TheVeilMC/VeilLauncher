import { BrowserWindow, Notification, ipcMain, app } from 'electron';
import Store from 'electron-store';
import { logger } from '../core/logger';
import { StoredNotification, NotificationSettings, NotificationPriority } from '@the-veil/shared/src/types/notifications';

interface NotificationStore {
  notifications: StoredNotification[];
  settings: NotificationSettings;
  unreadCount: number;
}

export class NotificationService {
  private store: Store<NotificationStore>;
  private mainWindow: BrowserWindow | null = null;
  private isFlashing = false;
  private flashInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.store = new Store<NotificationStore>({
      name: 'notifications',
      defaults: {
        notifications: [],
        settings: {
          enabled: true,
          showInTaskbar: true,
          playSound: true,
          flashTaskbar: true,
          maxStoredNotifications: 100,
          autoCleanupDays: 30,
          categories: {
            system: { enabled: true, priority: 'normal' },
            game: { enabled: true, priority: 'normal' },
            update: { enabled: true, priority: 'high' },
            error: { enabled: true, priority: 'critical' },
            social: { enabled: true, priority: 'low' },
          },
        },
        unreadCount: 0,
      },
    });

    this.setupIPC();
    this.cleanupOldNotifications();
  }

  public initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.updateTaskbarBadge();
  }

  private setupIPC(): void {
    ipcMain.handle('notification-create', this.createNotification.bind(this));
    ipcMain.handle('notification-get-all', this.getAllNotifications.bind(this));
    ipcMain.handle('notification-mark-read', this.markAsRead.bind(this));
    ipcMain.handle('notification-mark-all-read', this.markAllAsRead.bind(this));
    ipcMain.handle('notification-dismiss', this.dismissNotification.bind(this));
    ipcMain.handle('notification-clear-all', this.clearAllNotifications.bind(this));
    ipcMain.handle('notification-get-unread-count', this.getUnreadCount.bind(this));
    ipcMain.handle('notification-get-settings', this.getSettings.bind(this));
    ipcMain.handle('notification-update-settings', this.updateSettings.bind(this));
    ipcMain.handle('notification-cleanup', this.cleanupOldNotifications.bind(this));
  }

  private async createNotification(
    _event: Electron.IpcMainInvokeEvent,
    notification: Omit<StoredNotification, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const settings = this.getStoredSettings();
      
      if (!settings.enabled) {
        return { success: false, error: 'Notifications are disabled' };
      }

      // Check category settings
      const category = notification.category || 'system';
      const categorySettings = settings.categories[category];
      if (categorySettings && !categorySettings.enabled) {
        return { success: false, error: `Notifications for ${category} are disabled` };
      }

      const id = this.generateId();
      const now = new Date().toISOString();
      
      const storedNotification: StoredNotification = {
        ...notification,
        id,
        createdAt: now,
        expiresAt: notification.persistent 
          ? undefined 
          : new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // 24 hours
      };

      // Store notification
      const notifications = this.getStoredNotifications();
      notifications.unshift(storedNotification);

      // Limit stored notifications
      if (notifications.length > settings.maxStoredNotifications) {
        notifications.splice(settings.maxStoredNotifications);
      }

      this.store.set('notifications', notifications);
      this.updateUnreadCount();

      // Handle priority actions
      await this.handlePriorityActions(storedNotification, settings);

      // Show system notification if supported
      if (Notification.isSupported() && this.mainWindow) {
        this.showSystemNotification(storedNotification);
      }

      // Send to renderer
      this.sendToRenderer('notification-created', storedNotification);

      logger.info(`Notification created: ${id} - ${notification.title}`);

      return { success: true, id };
    } catch (error: any) {
      logger.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }
  }

  private async handlePriorityActions(
    notification: StoredNotification,
    settings: NotificationSettings
  ): Promise<void> {
    const priority = notification.priority.level;

    // Flash taskbar for high/critical priority
    if (
      (priority === 'high' || priority === 'critical') &&
      settings.flashTaskbar &&
      notification.priority.flashTaskbar !== false
    ) {
      this.flashTaskbar();
    }

    // Update taskbar badge
    this.updateTaskbarBadge();

    // Focus window for critical notifications
    if (priority === 'critical' && this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.flashFrame(true);
      
      // Stop flashing after 5 seconds
      setTimeout(() => {
        if (this.mainWindow) {
          this.mainWindow.flashFrame(false);
        }
      }, 5000);
    }
  }

  private flashTaskbar(): void {
    if (this.isFlashing || !this.mainWindow) return;

    this.isFlashing = true;
    let flashCount = 0;
    const maxFlashes = 6;

    this.flashInterval = setInterval(() => {
      if (this.mainWindow) {
        this.mainWindow.flashFrame(flashCount % 2 === 0);
        flashCount++;

        if (flashCount >= maxFlashes) {
          this.stopFlashing();
        }
      }
    }, 500);
  }

  private stopFlashing(): void {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    
    if (this.mainWindow) {
      this.mainWindow.flashFrame(false);
    }
    
    this.isFlashing = false;
  }

  private updateTaskbarBadge(): void {
    const unreadCount = this.getUnreadCount();
    
    if (this.mainWindow) {
      if (unreadCount > 0) {
        this.mainWindow.setBadgeCount(unreadCount);
      } else {
        this.mainWindow.setBadgeCount(0);
      }
    }

    // Update stored unread count
    this.store.set('unreadCount', unreadCount);
  }

  private showSystemNotification(notification: StoredNotification): void {
    try {
      const systemNotification = new Notification({
        title: notification.title,
        body: notification.message,
        icon: this.getNotificationIcon(notification.type),
        urgency: this.getUrgencyLevel(notification.priority.level),
        timeoutType: notification.priority.level === 'critical' ? 'never' : 'default',
      });

      systemNotification.show();

      systemNotification.on('click', () => {
        if (this.mainWindow) {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
        this.sendToRenderer('notification-clicked', notification);
      });
    } catch (error) {
      logger.warn('Failed to show system notification:', error);
    }
  }

  private getNotificationIcon(type: string): string {
    // Return appropriate icon path based on notification type
    const iconMap: Record<string, string> = {
      success: 'success.png',
      error: 'error.png',
      warning: 'warning.png',
      info: 'info.png',
      update: 'update.png',
      system: 'system.png',
    };

    return iconMap[type] || iconMap.info;
  }

  private getUrgencyLevel(priority: string): 'low' | 'normal' | 'critical' {
    switch (priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'normal';
      default:
        return 'low';
    }
  }

  private getAllNotifications(): { success: boolean; data?: StoredNotification[]; error?: string } {
    try {
      const notifications = this.getStoredNotifications();
      return { success: true, data: notifications };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async markAsRead(
    _event: Electron.IpcMainInvokeEvent,
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = this.getStoredNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.readAt) {
        notification.readAt = new Date().toISOString();
        this.store.set('notifications', notifications);
        this.updateTaskbarBadge();
        this.sendToRenderer('notification-read', notification);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async markAllAsRead(): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = this.getStoredNotifications();
      const now = new Date().toISOString();
      
      notifications.forEach(notification => {
        if (!notification.readAt) {
          notification.readAt = now;
        }
      });

      this.store.set('notifications', notifications);
      this.updateTaskbarBadge();
      this.sendToRenderer('notifications-all-read', {});

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async dismissNotification(
    _event: Electron.IpcMainInvokeEvent,
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = this.getStoredNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.dismissedAt = new Date().toISOString();
        this.store.set('notifications', notifications);
        this.updateTaskbarBadge();
        this.sendToRenderer('notification-dismissed', notification);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async clearAllNotifications(): Promise<{ success: boolean; error?: string }> {
    try {
      this.store.set('notifications', []);
      this.store.set('unreadCount', 0);
      this.updateTaskbarBadge();
      this.sendToRenderer('notifications-cleared', {});

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private getUnreadCount(): number {
    const notifications = this.getStoredNotifications();
    return notifications.filter(n => !n.readAt && !n.dismissedAt).length;
  }

  private getSettings(): { success: boolean; data?: NotificationSettings; error?: string } {
    try {
      const settings = this.getStoredSettings();
      return { success: true, data: settings };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async updateSettings(
    _event: Electron.IpcMainInvokeEvent,
    newSettings: Partial<NotificationSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSettings = this.getStoredSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      this.store.set('settings', updatedSettings);
      this.sendToRenderer('notification-settings-updated', updatedSettings);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async cleanupOldNotifications(): Promise<void> {
    try {
      const settings = this.getStoredSettings();
      const notifications = this.getStoredNotifications();
      const cutoffDate = new Date(Date.now() - (settings.autoCleanupDays * 24 * 60 * 60 * 1000));

      const filteredNotifications = notifications.filter(notification => {
        // Keep persistent notifications
        if (notification.persistent) return true;
        
        // Keep unread notifications
        if (!notification.readAt) return true;
        
        // Keep notifications newer than cutoff
        const createdAt = new Date(notification.createdAt);
        return createdAt > cutoffDate;
      });

      if (filteredNotifications.length !== notifications.length) {
        this.store.set('notifications', filteredNotifications);
        logger.info(`Cleaned up ${notifications.length - filteredNotifications.length} old notifications`);
      }
    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
    }
  }

  private getStoredNotifications(): StoredNotification[] {
    return this.store.get('notifications', []);
  }

  private getStoredSettings(): NotificationSettings {
    return this.store.get('settings');
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // Public API for creating notifications from other services
  public async createSystemNotification(
    title: string,
    message: string,
    priority: NotificationPriority['level'] = 'normal',
    category: string = 'system'
  ): Promise<string | null> {
    const result = await this.createNotification(null as any, {
      type: 'system',
      title,
      message,
      priority: {
        level: priority,
        flashTaskbar: priority === 'high' || priority === 'critical',
        persistUntilRead: priority === 'critical',
      },
      category,
      source: 'system',
    });

    return result.success ? result.id || null : null;
  }

  public async createGameNotification(
    title: string,
    message: string,
    priority: NotificationPriority['level'] = 'normal'
  ): Promise<string | null> {
    const result = await this.createNotification(null as any, {
      type: 'info',
      title,
      message,
      priority: {
        level: priority,
        flashTaskbar: priority === 'high' || priority === 'critical',
      },
      category: 'game',
      source: 'game',
    });

    return result.success ? result.id || null : null;
  }

  public async createErrorNotification(
    title: string,
    message: string,
    error?: Error
  ): Promise<string | null> {
    const result = await this.createNotification(null as any, {
      type: 'error',
      title,
      message,
      priority: {
        level: 'critical',
        flashTaskbar: true,
        persistUntilRead: true,
      },
      category: 'error',
      source: 'system',
      metadata: error ? {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      } : undefined,
    });

    return result.success ? result.id || null : null;
  }
}