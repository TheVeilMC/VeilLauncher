<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <Monitor class="w-5 h-5 text-accent-blue" />
      System Status
    </h3>

    <div class="space-y-4">
      <!-- Memory Usage -->
      <div>
        <div class="flex justify-between text-sm mb-2">
          <span class="text-primary-300">Memory Usage</span>
          <span class="text-white">{{ memoryUsagePercent }}%</span>
        </div>
        <div class="progress-bar h-2">
          <div
            class="progress-fill"
            :style="{ width: `${memoryUsagePercent}%` }"
          ></div>
        </div>
        <div class="text-xs text-primary-400 mt-1">
          {{ formatBytes(usedMemory) }} / {{ formatBytes(totalMemory) }}
        </div>
      </div>

      <!-- Java Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Coffee class="w-4 h-4 text-primary-400" />
          <span class="text-sm text-primary-300">Java</span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-status-success': javaStatus.length > 0,
              'bg-status-error': javaStatus.length === 0,
            }"
          ></div>
          <span class="text-sm text-white"
            >{{ javaStatus.length > 0 ? 'Available' : 'Not Available' }},
            {{ javaStatus }}</span
          >
        </div>
      </div>

      <!-- Network Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Wifi class="w-4 h-4 text-primary-400" />
          <span class="text-sm text-primary-300">Network</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-status-success rounded-full"></div>
          <span class="text-sm text-white">Connected</span>
        </div>
      </div>

      <!-- System Info -->
      <div class="pt-2 border-t border-primary-700/50">
        <div class="text-xs text-primary-400 space-y-1">
          <div>
            {{ appStore.systemInfo?.os }} {{ appStore.systemInfo?.arch }}
          </div>
          <div>{{ appStore.systemInfo?.cpuCount }} CPU cores</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Monitor, Coffee, Wifi } from 'lucide-vue-next';
import { useAppStore } from '@/stores/app';
import { ipcService } from '@/services/ipc';

const appStore = useAppStore();
const memoryInfo = ref<any>(null);
const isLoading = ref(false);
const javaStatus = ref<string>('');
const minecraftPath = ref('');

const totalMemory = computed(() => {
  if (memoryInfo.value) return memoryInfo.value.total;
  return appStore.systemInfo?.totalMemory || 8 * 1024 * 1024 * 1024;
});

const availableMemory = computed(() => {
  if (memoryInfo.value) return memoryInfo.value.free;
  return appStore.systemInfo?.availableMemory || 4 * 1024 * 1024 * 1024;
});

const usedMemory = computed(() => totalMemory.value - availableMemory.value);
const memoryUsagePercent = computed(() =>
  Math.round((usedMemory.value / totalMemory.value) * 100)
);

onMounted(async () => {
  await loadMemoryInfo();
  await loadJavaStatus();
  await loadMinecraftPath();
  // Refresh memory info every 30 seconds
  setInterval(loadMemoryInfo, 30000);
});

async function loadMinecraftPath() {
  try {
    const path = await ipcService.getMinecraftPath();
    console.log('Minecraft Path:', path);
    minecraftPath.value = path;
  } catch (error) {
    console.warn('Failed to load Minecraft path:', error);
  }
}

async function loadJavaStatus() {
  try {
    const response = await ipcService.getJavaVersion();
    javaStatus.value = response;
  } catch (error) {
    console.warn('Failed to load Java status:', error);
  }
}

async function loadMemoryInfo() {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    const response = await ipcService.getMemoryInfo();
    memoryInfo.value = response;
  } catch (error) {
    console.warn('Failed to load memory info:', error);
  } finally {
    isLoading.value = false;
  }
}

function formatBytes(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}
</script>
