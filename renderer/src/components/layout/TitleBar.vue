<template>
  <div
    ref="titlebarRef"
    class="fixed top-0 left-0 right-0 h-8 bg-primary-900/80 backdrop-blur-md border-b border-primary-700/50 flex items-center justify-between px-4 z-50 select-none titlebar"
    @mousedown="startDrag"
  >
    <!-- Left side - App info -->
    <div class="flex items-center gap-3">
      <!-- <div class="w-4 h-4 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-sm"></div> -->
      <div class="flex items-center gap-1">
        <img
          src="@/assets/logo.svg"
          alt="Veil Launcher Logo"
          class="w-6 h-6 rounded-sm"
        />
        <span class="text-xs font-medium text-primary-200"
          >The Veil Launcher</span
        >
      </div>
      <span class="text-xs text-primary-400">v{{ appStore.appVersion }}</span>
    </div>

    <!-- Center - Current user -->
    <div v-if="authStore.activeAccount" class="flex items-center gap-2">
      <img
        v-if="authStore.activeAccount.profilePicture"
        :src="authStore.activeAccount.profilePicture"
        :alt="authStore.activeAccount.username"
        class="w-5 h-5 rounded-sm"
      />
      <div
        v-else
        class="w-5 h-5 bg-primary-600 rounded-sm flex items-center justify-center"
      >
        <img
          :src="
            'https://mineskin.eu/helm/' +
            authStore.activeAccount.uuid +
            '/100.png'
          "
          :alt="authStore.activeAccount.username + ' Minecraft Skin'"
          class="w-5 h-5 rounded-sm"
        />
      </div>
      <span class="text-xs text-primary-200">{{
        authStore.activeAccount.username
      }}</span>
    </div>

    <!-- Notification Bell -->
    <div class="relative" @mousedown.stop>
      <button
        @click="showNotificationDropdown = !showNotificationDropdown"
        @mouseenter="showNotificationDropdown = true"
        :class="[
          'w-8 h-8 flex items-center justify-center hover:bg-primary-700/50 transition-all duration-300 rounded-sm relative',
          {
            'animate-pulse': notificationStore.unreadCount > 0,
            'bg-accent-blue/20': showNotificationDropdown,
          }
        ]"
      >
        <Bell 
          :class="[
            'w-4 h-4 transition-all duration-300',
            notificationStore.unreadCount > 0 ? 'text-accent-blue animate-bounce' : 'text-primary-300'
          ]" 
        />
        
        <!-- Unread Count Badge -->
        <div
          v-if="notificationStore.unreadCount > 0"
          :class="[
            'absolute -top-1 -right-1 min-w-[16px] h-4 bg-status-error rounded-full flex items-center justify-center text-[10px] font-bold text-white',
            'animate-pulse shadow-lg',
            notificationStore.unreadCount > 9 ? 'px-1' : ''
          ]"
        >
          {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
        </div>
      </button>

      <!-- Notification Dropdown -->
      <NotificationDropdown 
        v-if="showNotificationDropdown"
        @close="showNotificationDropdown = false"
        @mouseleave="showNotificationDropdown = false"
        class="absolute top-full right-0 mt-2 z-50"
      />
    </div>

    <!-- Right side - Window controls -->
    <div class="flex items-center" @mousedown.stop>
      <button
        @click="minimizeWindow"
        class="w-8 h-8 flex items-center justify-center hover:bg-primary-700/50 transition-colors rounded-sm"
      >
        <Minus class="w-3 h-3 text-primary-300" />
      </button>
      <button
        @click="toggleMaximize"
        class="w-8 h-8 flex items-center justify-center hover:bg-primary-700/50 transition-colors rounded-sm"
      >
        <Square class="w-3 h-3 text-primary-300" />
      </button>
      <button
        @click="closeWindow"
        class="w-8 h-8 flex items-center justify-center hover:bg-red-600/50 transition-colors rounded-sm"
      >
        <X class="w-3 h-3 text-primary-300" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Minus, Square, X, User, Bell } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { useNotificationStore } from '@/stores/notifications';
import NotificationDropdown from '../notifications/NotificationDropdown.vue';
import { useNotificationStore } from '@/stores/notifications';
import NotificationDropdown from '../notifications/NotificationDropdown.vue';

const authStore = useAuthStore();
const appStore = useAppStore();
const notificationStore = useNotificationStore();
const notificationStore = useNotificationStore();
const titlebarRef = ref<HTMLElement>();
const showNotificationDropdown = ref(false);

onMounted(async () => {
  await notificationStore.initialize();
});
const showNotificationDropdown = ref(false);

// JavaScript-based window dragging
function startDrag(e: MouseEvent) {
  if (!(window as any).electronAPI) return;

  e.preventDefault();

  let startX = e.screenX;
  let startY = e.screenY;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;

    (window as any).electronAPI.windowMoveBy(deltaX, deltaY);

    startX = e.screenX;
    startY = e.screenY;
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

async function minimizeWindow() {
  await (window as any).electronAPI.windowMinimize();
}

async function toggleMaximize() {
  await (window as any).electronAPI.windowMaximize();
}

async function closeWindow() {
  await (window as any).electronAPI.windowClose();
}
</script>

<style scoped>
.titlebar {
  -webkit-user-select: none;
  user-select: none;
}
</style>
