<template>
  <div class="flex h-full">
    <Sidebar />

    <div class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
          <p class="text-primary-300">Configure your launcher preferences</p>
        </div>

        <!-- Settings Sections -->
        <div class="space-y-6">
          <!-- General Settings -->
          <div class="glass-card p-6">
            <h2 class="text-xl font-semibold text-white mb-6">General</h2>

            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    class="block text-sm font-medium text-primary-300 mb-2"
                  >
                    Theme
                  </label>
                  <select
                    v-model="settingsStore.settings.theme"
                    @change="
                      settingsStore.updateSetting(
                        'theme',
                        ($event.target as any)?.value as any
                      )
                    "
                    class="w-full glass-input p-3 text-white"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <label
                    class="block text-sm font-medium text-primary-300 mb-2"
                  >
                    Language
                  </label>
                  <select
                    v-model="settingsStore.settings.language"
                    @change="
                      settingsStore.updateSetting(
                        'language',
                        ($event.target as any)?.value as any
                      )
                    "
                    class="w-full glass-input p-3 text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">
                    Auto-launch on startup
                  </h3>
                  <p class="text-sm text-primary-400">
                    Start the launcher when your computer boots
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="settingsStore.settings.autoLaunch"
                    @change="
                      settingsStore.updateSetting(
                        'autoLaunch',
                        ($event.target as any)?.checked
                      )
                    "
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"
                  ></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">
                    Check for updates
                  </h3>
                  <p class="text-sm text-primary-400">
                    Automatically check for launcher updates
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="settingsStore.settings.autoUpdate"
                    @change="
                      settingsStore.updateSetting(
                        'autoUpdate',
                        ($event.target as any)?.checked
                      )
                    "
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"
                  ></div>
                </label>
              </div>
            </div>
          </div>

          <!-- Game Settings -->
          <div class="glass-card p-6">
            <h2 class="text-xl font-semibold text-white mb-6">Game</h2>

            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    class="block text-sm font-medium text-primary-300 mb-2"
                  >
                    Default Java Path
                  </label>
                  <div class="flex gap-2">
                    <input
                      v-model="settingsStore.settings.javaPath"
                      @input="
                        settingsStore.updateSetting(
                          'javaPath',
                          ($event.target as any)?.value as any
                        )
                      "
                      type="text"
                      class="flex-1 glass-input p-3 text-white font-mono text-sm"
                      placeholder="Auto-detect"
                    />
                    <button
                      @click="selectJavaPath"
                      class="glass-button px-4 py-3 text-white hover:bg-primary-600/20"
                    >
                      Browse
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    class="block text-sm font-medium text-primary-300 mb-2"
                  >
                    Default Memory (MB)
                  </label>
                  <input
                    v-model.number="settingsStore.settings.defaultMemory"
                    @input="
                      settingsStore.updateSetting(
                        'defaultMemory',
                        parseInt(($event.target as any)?.value as any)
                      )
                    "
                    type="number"
                    min="1024"
                    max="16384"
                    step="512"
                    class="w-full glass-input p-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary-300 mb-2">
                  Game Directory
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="settingsStore.settings.gameDirectory"
                    type="text"
                    class="flex-1 glass-input p-3 text-white font-mono text-sm"
                    readonly
                  />
                  <button
                    @click="selectGameDirectory"
                    class="glass-button px-4 py-3 text-white hover:bg-primary-600/20"
                  >
                    Change
                  </button>
                  <button
                    @click="openGameDirectory"
                    class="glass-button px-4 py-3 text-white hover:bg-primary-600/20"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">
                    Keep launcher open
                  </h3>
                  <p class="text-sm text-primary-400">
                    Keep launcher running when game starts
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="settingsStore.settings.keepLauncherOpen"
                    @change="
                      settingsStore.updateSetting(
                        'keepLauncherOpen',
                        ($event.target as any)?.checked
                      )
                    "
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"
                  ></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <button
                  @click="verifyGameFiles"
                  class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
                >
                  Verify Game Files
                </button>
              </div>
            </div>
          </div>

          <!-- Advanced Settings -->
          <div class="glass-card p-6">
            <h2 class="text-xl font-semibold text-white mb-6">Advanced</h2>

            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">Developer Mode</h3>
                  <p class="text-sm text-primary-400">
                    Enable advanced developer features
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="settingsStore.settings.developerMode"
                    @change="
                      settingsStore.updateSetting(
                        'developerMode',
                        ($event.target as any)?.checked
                      )
                    "
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"
                  ></div>
                </label>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">Debug Logging</h3>
                  <p class="text-sm text-primary-400">
                    Enable detailed logging for troubleshooting
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="settingsStore.settings.debugLogging"
                    @change="
                      settingsStore.updateSetting(
                        'debugLogging',
                        ($event.target as any)?.checked
                      )
                    "
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-primary-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"
                  ></div>
                </label>
              </div>

              <div class="pt-4 border-t border-primary-700/50">
                <div class="flex gap-3">
                  <button
                    @click="clearCache"
                    class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
                  >
                    Clear Cache
                  </button>
                  <button
                    @click="exportLogs"
                    class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
                  >
                    Export Logs
                  </button>
                  <button
                    @click="resetSettings"
                    class="glass-button px-4 py-2 text-red-400 hover:bg-red-500/20"
                  >
                    Reset Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Notification Settings -->
          <div class="glass-card p-6">
            <NotificationSettings />
          </div>

          <!-- Save Button -->
          <div class="flex justify-end">
            <button
              @click="saveSettings"
              :disabled="
                settingsStore.isLoading || !settingsStore.hasUnsavedChanges
              "
              class="glass-button px-8 py-3 text-white font-medium hover:bg-accent-blue/20"
            >
              {{ settingsStore.isLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ExternalLink } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings';
import Sidebar from '@/components/layout/Sidebar.vue';
import NotificationSettings from '@/components/notifications/NotificationSettings.vue';
import { ipcService } from '@/services/ipc';
import router from '@/router';

const settingsStore = useSettingsStore();

onMounted(async () => {
  await settingsStore.loadSettings();
});

async function selectJavaPath() {
  await settingsStore.selectJavaPath();
}

async function verifyGameFiles() {
  await router.push({ name: 'Home' });
  await ipcService.hardVerify();
}

async function selectGameDirectory() {
  await settingsStore.selectGameDirectory();
}

async function openGameDirectory() {
  await settingsStore.openGameDirectory();
}

async function clearCache() {
  await settingsStore.clearCache();
}

async function exportLogs() {
  await settingsStore.exportLogs();
}

function resetSettings() {
  settingsStore.resetSettings();
}

async function saveSettings() {
  await settingsStore.saveSettings();
}
</script>
