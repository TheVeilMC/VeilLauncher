<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100"
  >
    <div class="glass-card p-8 max-w-md w-full mx-4 animate-scale-in">
      <div v-if="!isDownloading" class="text-center">
        <!-- Show user that there is an update and it should be downloaded -->
        <h2 class="text-lg text-white font-semibold mb-2">Update Available</h2>
        <p class="text-sm text-gray-300">
          A new version of the application is available. Please download the
          latest version to enjoy new features and improvements.
        </p>
        <div class="mt-6">
          <button
            @click="downloadUpdate"
            class="glass-button w-full py-2 text-white font-medium hover:bg-accent-blue/20"
          >
            Download Update
          </button>
        </div>
      </div>
      <div v-else-if="isDownloading" class="text-center">
        <h2 class="text-lg text-white font-semibold mb-2">
          Downloading Update
        </h2>
        <p class="text-sm text-gray-300 mb-4">
          Please wait while we download the latest version.
        </p>
        <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="bg-accent-blue h-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-400 mt-2">{{ progress }}% completed</p>
      </div>
      <div v-else class="text-center">
        <h2 class="text-lg text-white font-semibold mb-2">Update Downloaded</h2>
        <p class="text-sm text-gray-300 mb-4">
          The latest version has been downloaded. Application will be restarted
          to apply the update.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ipcService } from '@/services/ipc';
import { ref } from 'vue';

const isDownloading = ref(false);
const progress = ref(0);
const isDownloaded = ref(false);

const downloadUpdate = async () => {
  // Emit an event to the parent component to handle the update download
  await ipcService.updateLauncher();
  isDownloading.value = true;
};

(window as any).electron.on('update-progress', (_event: any, data: any) => {
  progress.value = data.progress;
});

(window as any).electron.on('update-downloaded', () => {
  isDownloading.value = false;
  isDownloaded.value = true;
});
</script>
