export interface NotificationPriority {
  level: 'low' | 'normal' | 'high' | 'critical';
  flashTaskbar?: boolean;
  persistUntilRead?: boolean;
  soundAlert?: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'dismiss' | 'navigate' | 'external' | 'custom';
  target?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface StoredNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'update' | 'system';
  title: string;
  message: string;
  priority: NotificationPriority;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
  category?: string;
  source?: string;
  persistent?: boolean;
  groupId?: string;
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: StoredNotification[];
  collapsed: boolean;
  priority: NotificationPriority['level'];
}

export interface NotificationSettings {
  enabled: boolean;
  showInTaskbar: boolean;
  playSound: boolean;
  flashTaskbar: boolean;
  maxStoredNotifications: number;
  autoCleanupDays: number;
  categories: {
    [key: string]: {
      enabled: boolean;
      priority: NotificationPriority['level'];
    };
  };
}