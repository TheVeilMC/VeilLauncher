<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl flex items-center justify-center">
          <Bell class="w-6 h-6 text-white" />
        </div>
        Notification Center
      </h1>
      <p class="text-primary-300">Manage your notifications and preferences</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="glass-card p-4 text-center">
        <div class="text-2xl font-bold text-accent-blue mb-1">{{ stats.total }}</div>
        <div class="text-sm text-primary-400">Total</div>
      </div>
      
      <div class="glass-card p-4 text-center">
        <div class="text-2xl font-bold text-status-warning mb-1">{{ stats.unread }}</div>
        <div class="text-sm text-primary-400">Unread</div>
      </div>
      
      <div class="glass-card p-4 text-center">
        <div class="text-2xl font-bold text-status-error mb-1">{{ stats.critical }}</div>
        <div class="text-sm text-primary-400">Critical</div>
      </div>
      
      <div class="glass-card p-4 text-center">
        <div class="text-2xl font-bold text-primary-300 mb-1">{{ stats.today }}</div>
        <div class="text-sm text-primary-400">Today</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="glass-card p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-white">Manage Notifications</h2>
        
        <div class="flex items-center gap-3">
          <button
            v-if="notificationStore.unreadCount > 0"
            @click="markAllAsRead"
            class="glass-button px-4 py-2 text-accent-blue hover:bg-accent-blue/20"
          >
            Mark All Read
          </button>
          
          <button
            @click="clearAllNotifications"
            class="glass-button px-4 py-2 text-red-400 hover:bg-red-500/20"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Filter and Search -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-primary-400" />
          <span class="text-sm text-primary-300">Filter:</span>
        </div>

        <div class="flex gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300',
              activeFilter === filter.value
                ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                : 'bg-primary-700/50 text-primary-300 hover:bg-primary-600/50'
            ]"
          >
            <component :is="filter.icon" class="w-3 h-3 mr-1 inline" />
            {{ filter.label }}
            <span v-if="filter.count > 0" class="ml-1 px-1 bg-primary-600/50 rounded text-[10px]">
              {{ filter.count }}
            </span>
          </button>
        </div>

        <div class="ml-auto">
          <div class="relative">
            <Search class="w-4 h-4 text-primary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search notifications..."
              class="glass-input pl-10 pr-4 py-2 text-sm w-64"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="space-y-4">
      <div
        v-for="notification in paginatedNotifications"
        :key="notification.id"
        class="glass-card overflow-hidden"
      >
        <NotificationItem
          :notification="notification"
          @read="markAsRead"
          @dismiss="dismissNotification"
          @action="handleNotificationAction"
        />
      </div>

      <!-- Empty State -->
      <div v-if="filteredNotifications.length === 0" class="text-center py-12">
        <div class="w-16 h-16 bg-primary-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Bell class="w-8 h-8 text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">No Notifications</h3>
        <p class="text-primary-400">You're all caught up!</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="glass-button p-2 text-primary-300 hover:text-white disabled:opacity-50"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="currentPage = page"
          :class="[
            'w-8 h-8 rounded text-sm transition-all duration-300',
            page === currentPage
              ? 'bg-accent-blue text-white'
              : 'text-primary-300 hover:text-white hover:bg-primary-600/20'
          ]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="glass-button p-2 text-primary-300 hover:text-white disabled:opacity-50"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Bell, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Download,
  Settings,
  Gamepad2
} from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notifications';
import { useRouter } from 'vue-router';
import NotificationItem from './NotificationItem.vue';
import type { StoredNotification, NotificationAction } from '@the-veil/shared/src/types/notifications';

const notificationStore = useNotificationStore();
const router = useRouter();

const activeFilter = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

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
    value: 'critical',
    label: 'Critical',
    icon: AlertTriangle,
    count: notifications.value.filter(n => n.priority.level === 'critical').length,
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

const stats = computed(() => ({
  total: notifications.value.length,
  unread: notificationStore.unreadCount,
  critical: notifications.value.filter(n => n.priority.level === 'critical').length,
  today: notifications.value.filter(n => {
    const today = new Date();
    const notifDate = new Date(n.createdAt);
    return notifDate.toDateString() === today.toDateString();
  }).length,
}));

const filteredNotifications = computed(() => {
  let filtered = notifications.value.filter(n => !n.dismissedAt);

  // Apply filter
  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.readAt);
      break;
    case 'critical':
      filtered = filtered.filter(n => n.priority.level === 'critical');
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
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(query) ||
      n.message.toLowerCase().includes(query) ||
      n.category?.toLowerCase().includes(query)
    );
  }

  // Sort by priority and date
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

const totalPages = computed(() => Math.ceil(filteredNotifications.value.length / itemsPerPage));

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredNotifications.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
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
      console.log('Custom action:', action, notification);
      break;
  }
}

onMounted(async () => {
  await notificationStore.loadNotifications();
});
</script>