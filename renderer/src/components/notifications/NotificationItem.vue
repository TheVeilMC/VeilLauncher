<template>
  <div 
    :class="[
      'p-4 hover:bg-primary-700/20 transition-all duration-300 cursor-pointer group relative',
      {
        'bg-primary-700/10': !notification.readAt,
        'border-l-4': true,
        'border-l-status-error': notification.type === 'error',
        'border-l-status-warning': notification.type === 'warning',
        'border-l-status-success': notification.type === 'success',
        'border-l-accent-blue': notification.type === 'info' || notification.type === 'update',
        'border-l-primary-600': notification.type === 'system',
      }
    ]"
    @click="handleClick"
  >
    <!-- Priority Indicator -->
    <div 
      v-if="notification.priority.level === 'critical' || notification.priority.level === 'high'"
      :class="[
        'absolute top-2 right-2 w-2 h-2 rounded-full',
        notification.priority.level === 'critical' ? 'bg-status-error animate-ping' : 'bg-status-warning animate-pulse'
      ]"
    />

    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div class="flex-shrink-0 mt-1">
        <div 
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center',
            getIconBackground(notification.type, notification.priority.level)
          ]"
        >
          <component 
            :is="getNotificationIcon(notification.type)" 
            :class="[
              'w-4 h-4',
              getIconColor(notification.type),
              {
                'animate-bounce': notification.priority.level === 'critical',
                'animate-pulse': notification.priority.level === 'high' && !notification.readAt,
              }
            ]"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 
              :class="[
                'text-sm font-medium mb-1',
                notification.readAt ? 'text-primary-200' : 'text-white'
              ]"
            >
              {{ notification.title }}
              <span 
                v-if="notification.priority.level === 'critical'"
                class="ml-2 px-1 py-0.5 bg-status-error/20 text-status-error rounded text-[10px] font-bold uppercase"
              >
                Critical
              </span>
              <span 
                v-else-if="notification.priority.level === 'high'"
                class="ml-2 px-1 py-0.5 bg-status-warning/20 text-status-warning rounded text-[10px] font-bold uppercase"
              >
                High
              </span>
            </h4>
            
            <p 
              :class="[
                'text-sm mb-2',
                notification.readAt ? 'text-primary-400' : 'text-primary-300'
              ]"
            >
              {{ notification.message }}
            </p>

            <!-- Metadata -->
            <div class="flex items-center gap-2 text-xs text-primary-500">
              <Clock class="w-3 h-3" />
              <span>{{ formatTime(notification.createdAt) }}</span>
              
              <span v-if="notification.category" class="flex items-center gap-1">
                <Tag class="w-3 h-3" />
                {{ notification.category }}
              </span>
              
              <span v-if="notification.source" class="flex items-center gap-1">
                <Code class="w-3 h-3" />
                {{ notification.source }}
              </span>
            </div>

            <!-- Actions -->
            <div 
              v-if="notification.actions && notification.actions.length > 0"
              class="flex items-center gap-2 mt-3"
            >
              <button
                v-for="action in notification.actions"
                :key="action.id"
                @click.stop="$emit('action', notification, action)"
                :class="[
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300',
                  getActionButtonClass(action.style || 'primary')
                ]"
              >
                {{ action.label }}
              </button>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              v-if="!notification.readAt"
              @click.stop="$emit('read', notification.id)"
              class="w-6 h-6 flex items-center justify-center text-primary-400 hover:text-accent-blue transition-colors rounded"
              title="Mark as read"
            >
              <Check class="w-3 h-3" />
            </button>
            
            <button
              @click.stop="$emit('dismiss', notification.id)"
              class="w-6 h-6 flex items-center justify-center text-primary-400 hover:text-red-400 transition-colors rounded"
              title="Dismiss"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- Unread Indicator -->
      <div 
        v-if="!notification.readAt"
        class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-accent-blue rounded-r-full"
      />
    </div>
</template>

<script setup lang="ts">
import { 
  Clock, 
  Tag, 
  Code, 
  Check, 
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Settings,
  Gamepad2,
  Zap
} from 'lucide-vue-next';
import type { StoredNotification, NotificationAction } from '@the-veil/shared/src/types/notifications';

interface Props {
  notification: StoredNotification;
}

defineProps<Props>();

defineEmits<{
  read: [id: string];
  dismiss: [id: string];
  action: [notification: StoredNotification, action: NotificationAction];
}>();

function handleClick() {
  // Mark as read when clicked
  if (!props.notification.readAt) {
    emit('read', props.notification.id);
  }
}

function getNotificationIcon(type: string) {
  const icons: Record<string, any> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    update: Download,
    system: Settings,
    game: Gamepad2,
  };
  return icons[type] || Info;
}

function getIconBackground(type: string, priority: string) {
  const backgrounds: Record<string, string> = {
    success: 'bg-status-success/20',
    error: 'bg-status-error/20',
    warning: 'bg-status-warning/20',
    info: 'bg-accent-blue/20',
    update: 'bg-accent-cyan/20',
    system: 'bg-primary-600/20',
    game: 'bg-accent-teal/20',
  };

  let baseClass = backgrounds[type] || backgrounds.info;
  
  // Enhance for high priority
  if (priority === 'critical') {
    baseClass += ' ring-2 ring-status-error/50 animate-pulse';
  } else if (priority === 'high') {
    baseClass += ' ring-1 ring-status-warning/50';
  }

  return baseClass;
}

function getIconColor(type: string) {
  const colors: Record<string, string> = {
    success: 'text-status-success',
    error: 'text-status-error',
    warning: 'text-status-warning',
    info: 'text-accent-blue',
    update: 'text-accent-cyan',
    system: 'text-primary-300',
    game: 'text-accent-teal',
  };
  return colors[type] || colors.info;
}

function getActionButtonClass(style: string) {
  const classes: Record<string, string> = {
    primary: 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30',
    secondary: 'bg-primary-600/20 text-primary-300 hover:bg-primary-600/30 border border-primary-600/30',
    danger: 'bg-status-error/20 text-status-error hover:bg-status-error/30 border border-status-error/30',
  };
  return classes[style] || classes.primary;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
</script>