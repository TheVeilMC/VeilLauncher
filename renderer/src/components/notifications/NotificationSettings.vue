<template>
  <div class="glass-card p-6">
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
      <Bell class="w-5 h-5 text-accent-blue" />
      Notification Settings
    </h2>

    <div class="space-y-6">
      <!-- General Settings -->
      <div>
        <h3 class="text-lg font-medium text-white mb-4">General</h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-white">Enable Notifications</h4>
              <p class="text-sm text-primary-400">Show notifications in the launcher</p>
            </div>
            <ToggleSwitch 
              :value="localSettings.enabled"
              @update:value="updateSetting('enabled', $event)"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-white">Show in Taskbar</h4>
              <p class="text-sm text-primary-400">Display notification badge in taskbar</p>
            </div>
            <ToggleSwitch 
              :value="localSettings.showInTaskbar"
              @update:value="updateSetting('showInTaskbar', $event)"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-white">Flash Taskbar</h4>
              <p class="text-sm text-primary-400">Flash taskbar for high priority notifications</p>
            </div>
            <ToggleSwitch 
              :value="localSettings.flashTaskbar"
              @update:value="updateSetting('flashTaskbar', $event)"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-white">Play Sound</h4>
              <p class="text-sm text-primary-400">Play sound for new notifications</p>
            </div>
            <ToggleSwitch 
              :value="localSettings.playSound"
              @update:value="updateSetting('playSound', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Storage Settings -->
      <div class="pt-6 border-t border-primary-700/50">
        <h3 class="text-lg font-medium text-white mb-4">Storage</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-300 mb-2">
              Max Stored Notifications
            </label>
            <input
              v-model.number="localSettings.maxStoredNotifications"
              @change="updateSetting('maxStoredNotifications', $event.target.value)"
              type="number"
              min="10"
              max="1000"
              step="10"
              class="w-full glass-input p-3 text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-primary-300 mb-2">
              Auto Cleanup (days)
            </label>
            <input
              v-model.number="localSettings.autoCleanupDays"
              @change="updateSetting('autoCleanupDays', $event.target.value)"
              type="number"
              min="1"
              max="365"
              class="w-full glass-input p-3 text-white"
            />
          </div>
        </div>
      </div>

      <!-- Category Settings -->
      <div class="pt-6 border-t border-primary-700/50">
        <h3 class="text-lg font-medium text-white mb-4">Categories</h3>
        
        <div class="space-y-4">
          <div
            v-for="(categorySettings, category) in localSettings.categories"
            :key="category"
            class="flex items-center justify-between p-4 rounded-lg bg-primary-800/30"
          >
            <div class="flex items-center gap-3">
              <component 
                :is="getCategoryIcon(category)" 
                class="w-5 h-5 text-accent-blue" 
              />
              <div>
                <h4 class="text-sm font-medium text-white capitalize">{{ category }}</h4>
                <p class="text-xs text-primary-400">
                  Priority: {{ categorySettings.priority }}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <select
                :value="categorySettings.priority"
                @change="updateCategorySetting(category, 'priority', $event.target.value)"
                class="glass-input px-3 py-1 text-sm text-white"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              
              <ToggleSwitch 
                :value="categorySettings.enabled"
                @update:value="updateCategorySetting(category, 'enabled', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-6 border-t border-primary-700/50 flex justify-between">
        <button
          @click="cleanupOldNotifications"
          class="glass-button px-4 py-2 text-primary-300 hover:text-white"
        >
          <Trash2 class="w-4 h-4 mr-2 inline" />
          Cleanup Old
        </button>
        
        <div class="flex gap-3">
          <button
            @click="resetToDefaults"
            class="glass-button px-4 py-2 text-red-400 hover:bg-red-500/20"
          >
            Reset to Defaults
          </button>
          
          <button
            @click="saveSettings"
            :disabled="!hasChanges"
            class="glass-button px-6 py-2 text-white font-medium hover:bg-accent-blue/20 disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Bell, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Settings,
  Gamepad2,
  Download,
  AlertTriangle,
  Shield,
  Users
} from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notifications';
import NotificationItem from './NotificationItem.vue';
import ToggleSwitch from '../ui/ToggleSwitch.vue';
import type { NotificationSettings } from '@the-veil/shared/src/types/notifications';

const notificationStore = useNotificationStore();

const localSettings = ref<NotificationSettings>({
  enabled: true,
  showInTaskbar: true,
  playSound: true,
  flashTaskbar: true,
  maxStoredNotifications: 100,
  autoCleanupDays: 30,
  categories: {
    system: { enabled: true, priority: 'normal' },
    game: { enabled: true, priority: 'normal' },
    update: { enabled: true, priority: 'high' },
    error: { enabled: true, priority: 'critical' },
    social: { enabled: true, priority: 'low' },
  },
});

const originalSettings = ref<NotificationSettings | null>(null);
const isSaving = ref(false);

const hasChanges = computed(() => {
  return JSON.stringify(localSettings.value) !== JSON.stringify(originalSettings.value);
});

function getCategoryIcon(category: string) {
  const icons: Record<string, any> = {
    system: Settings,
    game: Gamepad2,
    update: Download,
    error: AlertTriangle,
    social: Users,
  };
  return icons[category] || Shield;
}

function updateSetting(key: keyof NotificationSettings, value: any) {
  (localSettings.value as any)[key] = value;
}

function updateCategorySetting(category: string, key: string, value: any) {
  if (localSettings.value.categories[category]) {
    (localSettings.value.categories[category] as any)[key] = value;
  }
}

async function saveSettings() {
  try {
    isSaving.value = true;
    await notificationStore.updateSettings(localSettings.value);
    originalSettings.value = JSON.parse(JSON.stringify(localSettings.value));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  } finally {
    isSaving.value = false;
  }
}

function resetToDefaults() {
  localSettings.value = {
    enabled: true,
    showInTaskbar: true,
    playSound: true,
    flashTaskbar: true,
    maxStoredNotifications: 100,
    autoCleanupDays: 30,
    categories: {
      system: { enabled: true, priority: 'normal' },
      game: { enabled: true, priority: 'normal' },
      update: { enabled: true, priority: 'high' },
      error: { enabled: true, priority: 'critical' },
      social: { enabled: true, priority: 'low' },
    },
  };
}

async function cleanupOldNotifications() {
  try {
    await (window as any).electronAPI.notificationCleanup();
    await notificationStore.loadNotifications();
  } catch (error) {
    console.error('Failed to cleanup notifications:', error);
  }
}

onMounted(async () => {
  await notificationStore.loadSettings();
  if (notificationStore.settings) {
    localSettings.value = JSON.parse(JSON.stringify(notificationStore.settings));
    originalSettings.value = JSON.parse(JSON.stringify(notificationStore.settings));
  }
});
</script>