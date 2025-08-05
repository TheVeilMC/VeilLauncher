<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <Package class="w-5 h-5 text-accent-blue" />
      Mod Status
    </h3>

    <div class="space-y-4">
      <!-- Mod Version Info -->
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium text-white">The Veil Modpack</div>
          <div class="text-xs text-primary-400">
            Version {{ modStore.currentVersion }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div :class="['w-2 h-2 rounded-full', getModStatusColor()]"></div>
          <span class="text-sm text-white">{{ getModStatusText() }}</span>
        </div>
      </div>

      <!-- Update Progress -->
      <div v-if="modStore.isUpdating" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-primary-300">{{ modStore.updateStatus }}</span>
          <span class="text-white">{{ modStore.updateProgress }}%</span>
        </div>
        <div class="progress-bar h-2">
          <div
            class="progress-fill"
            :style="{ width: `${modStore.updateProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Last Update -->
      <div class="pt-4 border-t border-primary-700/50">
        <div class="flex items-center justify-between text-sm">
          <span class="text-primary-400">Last Updated</span>
          <span class="text-white">{{ formatLastUpdate() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Package } from 'lucide-vue-next';
import { useModStore } from '@/stores/mods';

const modStore = useModStore();

// Mock data - in real app this would come from mod store
const lastUpdateTime = ref(new Date(Date.now() - 3600000)); // 1 hour ago

function getModStatusColor() {
  if (modStore.isUpdating) {
    return 'bg-accent-blue animate-pulse';
  } else {
    return 'bg-status-success';
  }
}

function getModStatusText() {
  if (modStore.isUpdating) {
    return 'Updating...';
  } else {
    return 'Up to Date';
  }
}

function formatLastUpdate() {
  const now = new Date();
  const diffMs = now.getTime() - lastUpdateTime.value.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Just now';
  }
}
</script>
