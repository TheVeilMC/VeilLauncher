<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-6xl mx-auto">
        <!-- Welcome Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">
            Welcome back,
            <span class="text-gradient-blue">{{
              authStore.activeAccount?.username || 'Player'
            }}</span>
          </h1>
          <p class="text-primary-300">Ready to face your fears in The Veil?</p>
        </div>

        <!-- Main Launch Hero -->
        <div class="mb-8">
          <LaunchHero />
        </div>

        <!-- Latest Update Section -->
        <div class="mb-8">
          <LatestUpdate />
        </div>

        <!-- Quick Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Server Status -->
          <div class="glass-card p-6">
            <h3
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <Server class="w-5 h-5 text-accent-blue" />
              Server Status
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Status</span>
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 bg-status-success rounded-full animate-pulse"
                  ></div>
                  <span class="text-status-success text-sm font-medium"
                    >Online</span
                  >
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Players</span>
                <span class="text-white">24/100</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Ping</span>
                <span class="text-white">42ms</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="glass-card p-6">
            <h3
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <BarChart3 class="w-5 h-5 text-accent-cyan" />
              Your Stats
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Play Time</span>
                <span class="text-white">127h 32m</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Sessions</span>
                <span class="text-white">89</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Last Played</span>
                <span class="text-white">2 hours ago</span>
              </div>
            </div>
          </div>

          <!-- System Health -->
          <div class="glass-card p-6">
            <h3
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <Activity class="w-5 h-5 text-accent-teal" />
              System Health
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-primary-300">Memory</span>
                  <span class="text-white">68%</span>
                </div>
                <div class="progress-bar h-1.5">
                  <div class="progress-fill" style="width: 68%"></div>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Java</span>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-status-success rounded-full"></div>
                  <span class="text-status-success text-sm">Ready</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary-300">Storage</span>
                <span class="text-white">2.4GB free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Server, BarChart3, Activity } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import Sidebar from '@/components/layout/Sidebar.vue';
import LaunchHero from '@/components/home/LaunchHero.vue';
import LatestUpdate from '@/components/home/LatestUpdate.vue';

const authStore = useAuthStore();
</script>
