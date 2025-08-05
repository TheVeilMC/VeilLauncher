<template>
  <div class="fixed top-12 right-4 z-50 space-y-2">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="[
          'glass-card p-4 max-w-sm shadow-lg',
          'border-l-4',
          {
            'border-l-status-success': notification.type === 'success',
            'border-l-status-error': notification.type === 'error',
            'border-l-status-warning': notification.type === 'warning',
            'border-l-status-info': notification.type === 'info',
          },
        ]"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <CheckCircle
              v-if="notification.type === 'success'"
              class="w-5 h-5 text-status-success"
            />
            <XCircle
              v-else-if="notification.type === 'error'"
              class="w-5 h-5 text-status-error"
            />
            <AlertTriangle
              v-else-if="notification.type === 'warning'"
              class="w-5 h-5 text-status-warning"
            />
            <Info v-else class="w-5 h-5 text-status-info" />
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-white">
              {{ notification.title }}
            </h4>
            <p class="text-sm text-primary-300 mt-1">
              {{ notification.message }}
            </p>
          </div>

          <button
            @click="notificationStore.removeNotification(notification.id)"
            class="flex-shrink-0 text-primary-400 hover:text-white transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notifications';

const notificationStore = useNotificationStore();
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
