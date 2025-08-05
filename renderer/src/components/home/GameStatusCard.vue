<template>
  <div class="glass-card p-6 h-full">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-semibold text-white flex items-center gap-2">
        <Gamepad2 class="w-6 h-6 text-accent-blue" />
        Game Status
      </h3>
      <div class="flex items-center gap-2">
        <div :class="['w-3 h-3 rounded-full', getStatusColor()]"></div>
        <span class="text-sm font-medium text-white">{{
          getStatusText()
        }}</span>
      </div>
    </div>

    <!-- Game Info -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div>
        <div class="text-sm text-primary-400 mb-1">Current Version</div>
        <div class="text-lg font-semibold text-white">Minecraft 1.20.1</div>
        <div class="text-sm text-accent-blue">
          The Veil {{ modStore.currentVersion }}
        </div>
      </div>

      <div>
        <div class="text-sm text-primary-400 mb-1">Playtime</div>
        <div class="text-lg font-semibold text-white">
          {{ formatPlaytime(totalPlaytime) }}
        </div>
        <div class="text-sm text-primary-300">
          This session: {{ formatPlaytime(sessionPlaytime) }}
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="space-y-4">
      <div>
        <div class="flex justify-between text-sm mb-2">
          <span class="text-primary-300">Memory Usage</span>
          <span class="text-white"
            >{{ memoryUsage }}MB / {{ allocatedMemory }}MB</span
          >
        </div>
        <div class="progress-bar h-2">
          <div
            class="progress-fill"
            :style="{ width: `${(memoryUsage / allocatedMemory) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Recent Achievements -->
    <div
      v-if="recentAchievements.length > 0"
      class="mt-6 pt-6 border-t border-primary-700/50"
    >
      <h4 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Trophy class="w-4 h-4 text-accent-blue" />
        Recent Achievements
      </h4>
      <div class="space-y-2">
        <div
          v-for="achievement in recentAchievements.slice(0, 2)"
          :key="achievement.id"
          class="flex items-center gap-3 p-2 rounded-lg bg-primary-800/30"
        >
          <div
            class="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center"
          >
            <Trophy class="w-4 h-4 text-white" />
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-white">
              {{ achievement.name }}
            </div>
            <div class="text-xs text-primary-400">
              {{ achievement.description }}
            </div>
          </div>
          <div class="text-xs text-primary-400">
            {{ formatDate(achievement.unlockedAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Gamepad2, Trophy } from 'lucide-vue-next';
import { useLaunchStore } from '@/stores/launch';
import { useModStore } from '@/stores/mods';
import { storeToRefs } from 'pinia';

const launchStore = useLaunchStore();
const modStore = useModStore();

// Mock data - in real app this would come from game/API
const totalPlaytime = ref(45 * 60 + 23); // 45 hours 23 minutes in minutes
const sessionPlaytime = ref(127); // 2 hours 7 minutes in minutes
const memoryUsage = ref(0);
const allocatedMemory = ref(0);

const { processMemory } = storeToRefs(launchStore);

const recentAchievements = ref([
  {
    id: '1',
    name: 'First Steps',
    description: 'Enter The Veil for the first time',
    unlockedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Survivor',
    description: 'Survive your first night in The Veil',
    unlockedAt: new Date(Date.now() - 172800000).toISOString(),
  },
]);

function getStatusColor() {
  if (launchStore.isRunning) {
    return 'bg-status-success animate-pulse';
  } else if (launchStore.isLaunching) {
    return 'bg-accent-blue animate-pulse';
  } else {
    return 'bg-primary-500';
  }
}

function getStatusText() {
  if (launchStore.isRunning) {
    return 'Running';
  } else if (launchStore.isLaunching) {
    return 'Starting...';
  } else {
    return 'Ready to Launch';
  }
}

function formatPlaytime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return `${diffDays}d ago`;
  }
}

onMounted(() => {
  // Simulate real-time updates
  setInterval(() => {
    if (launchStore.isRunning) {
      sessionPlaytime.value += 1;
      totalPlaytime.value += 1;

      memoryUsage.value = Math.max(
        1000,
        Math.min(
          processMemory.value.allocatedMemory,
          processMemory.value.usedMemory + (Math.random() - 0.5) * 100
        )
      );
    }
  }, 60000); // Update every minute
});
</script>
