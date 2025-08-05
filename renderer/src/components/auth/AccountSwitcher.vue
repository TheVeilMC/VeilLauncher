<template>
  <div class="relative">
    <button
      v-if="authStore.activeAccount"
      @click="authStore.logout"
      class="w-full flex items-center gap-3 p-3 rounded-lg bg-primary-800/50 hover:bg-red-600/20 transition-colors group"
    >
      <img
        v-if="authStore.activeAccount.profilePicture"
        :src="authStore.activeAccount.profilePicture"
        :alt="authStore.activeAccount.username"
        class="w-8 h-8 rounded-lg"
      />
      <div
        v-else
        class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"
      >
        <img
          :src="
            'https://mineskin.eu/helm/' +
            authStore.activeAccount.uuid +
            '/800.png'
          "
          :alt="authStore.activeAccount.username + ' Minecraft Skin'"
          class="w-8 h-8 rounded-lg"
        />
      </div>

      <div class="flex-1 text-left">
        <div class="text-sm font-medium text-white">
          {{ authStore.activeAccount.username }}
        </div>
        <div class="text-xs text-primary-400 group-hover:text-red-400">
          Click to logout
        </div>
      </div>

      <X class="w-4 h-4 text-primary-400 group-hover:text-red-400" />
    </button>

    <button
      v-else
      @click="authStore.startAuthentication"
      class="w-full flex items-center gap-3 p-3 rounded-lg bg-accent-blue/20 hover:bg-accent-blue/30 transition-colors border border-accent-blue/30"
    >
      <div
        class="w-8 h-8 bg-accent-blue/30 rounded-lg flex items-center justify-center"
      >
        <User class="w-4 h-4 text-accent-blue" />
      </div>
      <div class="flex-1 text-left">
        <div class="text-sm font-medium text-white">Sign In</div>
        <div class="text-xs text-accent-blue">Add Account</div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { User, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
