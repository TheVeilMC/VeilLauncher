<template>
  <div
    class="w-64 bg-primary-900/50 backdrop-blur-md border-r border-primary-700/50 flex flex-col"
  >
    <!-- Logo -->
    <div class="p-6 border-b border-primary-700/50">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-lg flex items-center justify-center"
        >
          <!-- <Shield class="w-5 h-5 text-white" /> -->
          <img
            src="@/assets/logo.svg"
            alt="Veil Launcher Logo"
            class="w-6 h-6 rounded-lg"
          />
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">The Veil</h1>
          <p class="text-xs text-primary-400">Launcher</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4">
      <div class="space-y-2">
        <SidebarItem
          v-for="item in navigationItems"
          :key="item.name"
          :item="item"
          :active="$route.name === item.name"
          @click="$router.push({ name: item.name })"
        />
      </div>

      <!-- Developer Section -->
      <div class="mt-8">
        <h3
          class="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3"
        >
          Developer
        </h3>
        <div class="space-y-2">
          <SidebarItem
            v-for="item in developerItems"
            :key="item.name"
            :item="item"
            :active="$route.name === item.name"
            @click="$router.push({ name: item.name })"
          />
        </div>
      </div>
    </nav>

    <!-- Account Switcher -->
    <div class="p-4 border-t border-primary-700/50">
      <AccountSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Home, Clock, Settings, Palette, Code, Bell } from 'lucide-vue-next';
import SidebarItem from './SidebarItem.vue';
import AccountSwitcher from '../auth/AccountSwitcher.vue';
import { useNotificationStore } from '@/stores/notifications';

const notificationStore = useNotificationStore();

const navigationItems = computed(() => [
  {
    name: 'Home',
    label: 'Home',
    icon: Home,
    description: 'Dashboard and quick actions',
  },
  {
    name: 'Notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'View and manage notifications',
    badge: notificationStore.unreadCount > 0 ? notificationStore.unreadCount : undefined,
  },
  {
    name: 'Changelog',
    label: 'Changelog',
    icon: Clock,
    description: 'View update history',
  },
  {
    name: 'Skins',
    label: 'Skins',
    icon: Palette,
    description: 'Skin management',
  },
  {
    name: 'Settings',
    label: 'Settings',
    icon: Settings,
    description: 'Launcher settings',
  },
]);

const developerItems = computed(() => [
  {
    name: 'Developer',
    label: 'Dev Tools',
    icon: Code,
    description: 'Development tools',
  },
]);
</script>
