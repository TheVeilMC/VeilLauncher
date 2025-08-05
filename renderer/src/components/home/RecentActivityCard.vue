<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <Activity class="w-5 h-5 text-accent-blue" />
      Recent Activity
    </h3>

    <div class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-3 p-3 rounded-lg bg-primary-800/30 hover:bg-primary-700/30 transition-colors"
      >
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            getActivityColor(activity.type),
          ]"
        >
          <component
            :is="getActivityIcon(activity.type)"
            class="w-4 h-4 text-white"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white">{{ activity.title }}</div>
          <div class="text-xs text-primary-300 mt-1">
            {{ activity.description }}
          </div>
          <div class="flex items-center gap-2 mt-2 text-xs text-primary-400">
            <Clock class="w-3 h-3" />
            <span>{{ formatTime(activity.timestamp) }}</span>
            <span v-if="activity.location" class="flex items-center gap-1">
              <MapPin class="w-3 h-3" />
              {{ activity.location }}
            </span>
          </div>
        </div>

        <div v-if="activity.value" class="text-right">
          <div class="text-sm font-medium text-white">{{ activity.value }}</div>
          <div
            v-if="activity.change"
            :class="[
              'text-xs',
              activity.change > 0 ? 'text-status-success' : 'text-status-error',
            ]"
          >
            {{ activity.change > 0 ? '+' : '' }}{{ activity.change }}
          </div>
        </div>
      </div>

      <div v-if="activities.length === 0" class="text-center py-8">
        <div
          class="w-12 h-12 bg-primary-700/50 rounded-full mx-auto mb-3 flex items-center justify-center"
        >
          <Activity class="w-6 h-6 text-primary-400" />
        </div>
        <p class="text-sm text-primary-400">No recent activity</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Activity,
  Clock,
  MapPin,
  Play,
  Trophy,
  Package,
  Users,
  Settings,
  Download,
} from 'lucide-vue-next';

interface ActivityItem {
  id: string;
  type: 'launch' | 'achievement' | 'mod' | 'social' | 'system' | 'download';
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  value?: string;
  change?: number;
}

const activities = ref<ActivityItem[]>([
  {
    id: '1',
    type: 'launch',
    title: 'Game Session Started',
    description: 'Launched The Veil and played for 2 hours',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    location: 'The Veil',
    value: '2h 15m',
  },
  {
    id: '2',
    type: 'achievement',
    title: 'Achievement Unlocked',
    description: 'Earned "First Steps" achievement',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    value: '+50 XP',
    change: 50,
  },
  {
    id: '3',
    type: 'mod',
    title: 'Mods Updated',
    description: 'Updated 3 mods to latest versions',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    value: '3 mods',
  },
  {
    id: '4',
    type: 'social',
    title: 'Friend Joined',
    description: 'ShadowHunter92 joined your server',
    timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    location: 'The Veil Official',
  },
  {
    id: '5',
    type: 'system',
    title: 'Settings Updated',
    description: 'Changed memory allocation to 4GB',
    timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
  },
]);

function getActivityIcon(type: string) {
  const icons: Record<string, any> = {
    launch: Play,
    achievement: Trophy,
    mod: Package,
    social: Users,
    system: Settings,
    download: Download,
  };
  return icons[type] || Activity;
}

function getActivityColor(type: string) {
  const colors: Record<string, string> = {
    launch: 'bg-accent-blue/20',
    achievement: 'bg-yellow-500/20',
    mod: 'bg-accent-cyan/20',
    social: 'bg-green-500/20',
    system: 'bg-primary-600/20',
    download: 'bg-purple-500/20',
  };
  return colors[type] || 'bg-primary-600/20';
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}
</script>
