<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <Zap class="w-5 h-5 text-accent-blue" />
      Quick Actions
    </h3>

    <div class="space-y-3">
      <button
        @click="randomizeSkin"
        :disabled="isLoading"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 disabled:opacity-50 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          >
            <Shuffle
              :class="[
                'w-5 h-5 text-purple-400',
                { 'animate-spin': isLoading },
              ]"
            />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Random Skin</div>
            <div class="text-xs text-primary-400">
              Get a random community skin
            </div>
          </div>
        </div>
      </button>

      <button
        @click="resetToDefault"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          >
            <RotateCcw class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Reset to Default</div>
            <div class="text-xs text-primary-400">
              Use default Steve/Alex skin
            </div>
          </div>
        </div>
      </button>

      <button
        @click="downloadCurrent"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          >
            <Download class="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Download Current</div>
            <div class="text-xs text-primary-400">
              Save current skin to file
            </div>
          </div>
        </div>
      </button>

      <button
        @click="openSkinEditor"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          >
            <Edit class="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Skin Editor</div>
            <div class="text-xs text-primary-400">Edit skin in browser</div>
          </div>
        </div>
      </button>
    </div>

    <!-- Skin Statistics -->
    <div class="mt-6 pt-4 border-t border-primary-700/50">
      <h4 class="text-sm font-medium text-white mb-3">Statistics</h4>
      <div class="grid grid-cols-2 gap-3">
        <div class="text-center">
          <div class="text-lg font-bold text-accent-blue">
            {{ skinStats.totalUploads }}
          </div>
          <div class="text-xs text-primary-400">Total Uploads</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-accent-cyan">
            {{ skinStats.lastChanged }}
          </div>
          <div class="text-xs text-primary-400">Days Since Last</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Zap, Shuffle, RotateCcw, Download, Edit } from 'lucide-vue-next';
import { useSkinStore } from '@/stores/skin';
import { useNotificationStore } from '@/stores/notifications';

const skinStore = useSkinStore();
const notificationStore = useNotificationStore();

const isLoading = ref(false);

const skinStats = computed(() => ({
  totalUploads: skinStore.skinHistory.length,
  lastChanged: Math.floor(
    (Date.now() -
      new Date(skinStore.skinHistory[0]?.createdAt || Date.now()).getTime()) /
      (1000 * 60 * 60 * 24)
  ),
}));

async function randomizeSkin() {
  isLoading.value = true;

  try {
    // Simulate getting a random skin
    await new Promise((resolve) => setTimeout(resolve, 1500));

    notificationStore.addNotification({
      type: 'info',
      title: 'Random Skin',
      message:
        'Feature coming soon! Random community skins will be available in the next update.',
    });
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to get random skin',
    });
  } finally {
    isLoading.value = false;
  }
}

async function resetToDefault() {
  try {
    notificationStore.addNotification({
      type: 'info',
      title: 'Reset Skin',
      message:
        'Feature coming soon! Default skin reset will be available in the next update.',
    });
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to reset skin',
    });
  }
}

async function downloadCurrent() {
  try {
    if (skinStore.currentSkinUrl) {
      // Create download link
      const link = document.createElement('a');
      link.href = skinStore.currentSkinUrl;
      link.download = 'minecraft-skin.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notificationStore.addNotification({
        type: 'success',
        title: 'Download Started',
        message: 'Your current skin is being downloaded',
      });
    } else {
      throw new Error('No skin available to download');
    }
  } catch (error: any) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Download Failed',
      message: error.message || 'Failed to download skin',
    });
  }
}

function openSkinEditor() {
  // Open external skin editor
  (window as any).electronAPI.openExternal(
    'https://www.minecraftskins.com/skin-editor/'
  );

  notificationStore.addNotification({
    type: 'info',
    title: 'Skin Editor',
    message: 'Opening external skin editor in your browser',
  });
}
</script>
