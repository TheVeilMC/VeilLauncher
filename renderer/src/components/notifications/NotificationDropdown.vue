<template>
  <div 
    class="w-96 max-h-[500px] glass-card border border-primary-600/50 shadow-2xl animate-slide-down"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <!-- Header -->
    <div class="p-4 border-b border-primary-700/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Bell class="w-5 h-5 text-accent-blue" />
          <h3 class="text-lg font-semibold text-white">Notifications</h3>
          <div 
            v-if="notificationStore.unreadCount > 0"
            class="px-2 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-xs font-medium"
          >
            {{ notificationStore.unreadCount }} new
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            v-if="notificationStore.unreadCount > 0"
            @click="markAllAsRead"
            class="text-xs text-accent-blue hover:text-accent-cyan transition-colors"
          >
            Mark all read
          </button>
          <button
            @click="$emit('close')"
            class="text-primary-400 hover:text-white transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1 mt-3">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="activeFilter = filter.value"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300',
            activeFilter === filter.value
              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
              : 'text-primary-300 hover:text-white hover:bg-primary-600/20'
          ]"
        >
          <component :is="filter.icon" class="w-3 h-3 mr-1 inline" />
          {{ filter.label }}
          <span 
            v-if="filter.count > 0" 
            class="ml-1 px-1 bg-primary-600/50 rounded text-[10px]"
          >
            {{ filter.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="max-h-80 overflow-y-auto">
      <div v-if="filteredNotifications.length === 0" class="p-8 text-center">
        <div class="w-12 h-12 bg-primary-700/50 rounded-2xl mx-auto mb-3 flex items-center justify-center">
          <Bell class="w-6 h-6 text-primary-400" />
        </div>
        <h4 class="text-sm font-medium text-white mb-1">No notifications</h4>
        <p class="text-xs text-primary-400">You're all caught up!</p>
      </div>

      <div v-else class="divide-y divide-primary-700/30">
        <NotificationItem
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :notification="notification"
          @read="markAsRead"
          @dismiss="dismissNotification"
          @action="handleNotificationAction"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-primary-700/50 bg-primary-800/30">
      <div class="flex items-center justify-between">
        <button
          @click="openNotificationSettings"
          class="text-xs text-primary-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <Settings class="w-3 h-3" />
          Settings
        </button>
        
        <button
          v-if="notifications.length > 0"
          @click="clearAllNotifications"
          class="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
        >
          <Trash2 class="w-3 h-3" />
          Clear all
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Bell, 
  X, 
  Settings, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Download,
  Gamepad2
} from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notifications';
import { useRouter } from 'vue-router';
import NotificationItem from './NotificationItem.vue';
import type { StoredNotification, NotificationAction } from '@the-veil/shared/src/types/notifications';

const notificationStore = useNotificationStore();
const router = useRouter();

const activeFilter = ref('all');

defineEmits<{
  close: [];
  mouseenter: [];
  mouseleave: [];
}>();

const filters = computed(() => [
  {
    value: 'all',
    label: 'All',
    icon: Bell,
    count: notifications.value.length,
  },
  {
    value: 'unread',
    label: 'Unread',
    icon: AlertCircle,
    count: notificationStore.unreadCount,
  },
  {
    value: 'system',
    label: 'System',
    icon: Settings,
    count: notifications.value.filter(n => n.category === 'system').length,
  },
  {
    value: 'game',
    label: 'Game',
    icon: Gamepad2,
    count: notifications.value.filter(n => n.category === 'game').length,
  },
  {
    value: 'update',
    label: 'Updates',
    icon: Download,
    count: notifications.value.filter(n => n.category === 'update').length,
  },
]);

const notifications = computed(() => notificationStore.notifications);

const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.readAt && !n.dismissedAt);
      break;
    case 'system':
      filtered = filtered.filter(n => n.category === 'system');
      break;
    case 'game':
      filtered = filtered.filter(n => n.category === 'game');
      break;
    case 'update':
      filtered = filtered.filter(n => n.category === 'update');
      break;
    default:
      // Show all non-dismissed notifications
      filtered = filtered.filter(n => !n.dismissedAt);
  }

  // Sort by priority and creation date
  return filtered.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    const aPriority = priorityOrder[a.priority.level];
    const bPriority = priorityOrder[b.priority.level];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

async function markAsRead(id: string) {
  await notificationStore.markAsRead(id);
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead();
}

async function dismissNotification(id: string) {
  await notificationStore.dismissNotification(id);
}

async function clearAllNotifications() {
  await notificationStore.clearAllNotifications();
}

function openNotificationSettings() {
  router.push({ name: 'Settings', hash: '#notifications' });
  // Close dropdown after navigation
  setTimeout(() => {
    document.dispatchEvent(new Event('click'));
  }, 100);
}

function handleNotificationAction(notification: StoredNotification, action: NotificationAction) {
  switch (action.action) {
    case 'dismiss':
      dismissNotification(notification.id);
      break;
    case 'navigate':
      if (action.target) {
        router.push(action.target);
      }
      break;
    case 'external':
      if (action.target) {
        (window as any).electronAPI.openExternal(action.target);
      }
      break;
    case 'custom':
      // Handle custom actions based on notification metadata
      console.log('Custom action:', action, notification);
      break;
  }
}

onMounted(async () => {
  await notificationStore.loadNotifications();
});
</script>