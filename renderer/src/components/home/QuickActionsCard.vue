<template>
  <div class="glass-card p-6 h-full">
    <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
      <Zap class="w-5 h-5 text-accent-blue" />
      Quick Actions
    </h3>

    <div class="space-y-3">
      <button
        @click="openGameDirectory"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-accent-blue/20 rounded-lg flex items-center justify-center group-hover:bg-accent-blue/30 transition-colors"
          >
            <Folder class="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Open Game Folder</div>
            <div class="text-xs text-primary-400">Browse game files</div>
          </div>
        </div>
      </button>

      <button
        @click="checkForUpdates"
        :disabled="modStore.isUpdating"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group disabled:opacity-50"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-accent-cyan/20 rounded-lg flex items-center justify-center group-hover:bg-accent-cyan/30 transition-colors"
          >
            <RefreshCw
              :class="[
                'w-5 h-5 text-accent-cyan',
                { 'animate-spin': modStore.isUpdating },
              ]"
            />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Check for Updates</div>
            <div class="text-xs text-primary-400">Update mods and game</div>
          </div>
        </div>
      </button>

      <button
        @click="openSettings"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-accent-teal/20 rounded-lg flex items-center justify-center group-hover:bg-accent-teal/30 transition-colors"
          >
            <Settings class="w-5 h-5 text-accent-teal" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Settings</div>
            <div class="text-xs text-primary-400">Configure launcher</div>
          </div>
        </div>
      </button>

      <button
        @click="viewLogs"
        :disabled="!launchStore.currentInstanceId"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group disabled:opacity-50"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center group-hover:bg-primary-600/30 transition-colors"
          >
            <FileText class="w-5 h-5 text-primary-300" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">View Logs</div>
            <div class="text-xs text-primary-400">Debug information</div>
          </div>
        </div>
      </button>

      <button
        @click="openDiscord"
        class="w-full glass-button p-4 text-left hover:bg-primary-600/20 transition-all duration-300 group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors"
          >
            <MessageCircle class="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-white">Join Discord</div>
            <div class="text-xs text-primary-400">Community support</div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Zap,
  Folder,
  RefreshCw,
  Settings,
  FileText,
  MessageCircle,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useLaunchStore } from '@/stores/launch';
import { useModStore } from '@/stores/mods';
import { useNotificationStore } from '@/stores/notifications';
import { ipcService } from '@/services/ipc';
import { storeToRefs } from 'pinia';

const router = useRouter();
const launchStore = useLaunchStore();
const modStore = useModStore();
const notificationStore = useNotificationStore();

const { showLogs } = storeToRefs(launchStore);

async function openGameDirectory() {
  const path = await ipcService.getMinecraftPath();
  if (path) {
    await (window as any).electronAPI.showFolder(path);
  }
}

async function checkForUpdates() {
  try {
    const updateInfo = await modStore.checkForUpdates();

    if (updateInfo.hasUpdates) {
      notificationStore.addNotification({
        type: 'info',
        title: 'Updates Available',
        message: `${updateInfo.availableUpdates.length} mod update(s) available`,
      });

      // Auto-update mods
      await modStore.updateMods();
    } else {
      notificationStore.addNotification({
        type: 'success',
        title: 'Up to Date',
        message: 'All mods are up to date',
      });
    }
  } catch (error) {
    // Error handling is done in the store
  }
}

function openSettings() {
  router.push({ name: 'Settings' });
}

async function viewLogs() {
  if (launchStore.currentInstanceId) {
    showLogs.value = true;
  }
}

async function openDiscord() {
  await (window as any).electronAPI.openExternal('https://discord.gg/theveil');
}
</script>
