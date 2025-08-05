<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Hero Section with Banner -->
      <div class="relative">
        <!-- <BannerCarousel /> -->

        <!-- Welcome Overlay -->
        <div class="inset-0 from-primary-900/90 flex items-end">
          <div class="p-8 w-full">
            <div class="max-w-4xl">
              <h1 class="text-4xl font-bold text-white mb-3">
                Welcome back,
                <span class="text-gradient">{{
                  authStore.activeAccount?.username || 'Player'
                }}</span>
              </h1>
              <p class="text-xl text-primary-200 mb-6">
                Ready to face your fears in The Veil?
              </p>

              <!-- Quick Stats -->
              <div class="flex items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 bg-status-success rounded-full animate-pulse"
                  ></div>
                  <span class="text-primary-200">Online</span>
                </div>
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-primary-300" />
                  <span class="text-primary-200"
                    >Last played {{ getLastPlayedTime() }}</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <Users class="w-4 h-4 text-primary-300" />
                  <span class="text-primary-200"
                    >{{ onlinePlayersCount }} players online</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="p-8">
        <div class="max-w-7xl mx-auto">
          <!-- Launch Section -->
          <div class="mb-8">
            <LaunchButton />
          </div>

          <!-- Insights Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Game Status Card -->
            <div class="lg:col-span-2">
              <GameStatusCard />
            </div>

            <!-- Quick Actions -->
            <div>
              <QuickActionsCard />
            </div>
          </div>

          <!-- Information Grid vertical -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="flex flex-col gap-6">
              <ModStatusCard />
              <ServerStatusCard />
            </div>
            <div class="flex flex-col gap-6">
              <NewsCard />
              <RecentActivityCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Clock, Users } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useBannerStore } from '@/stores/banners';
import { useModStore } from '@/stores/mods';
import Sidebar from '@/components/layout/Sidebar.vue';
import LaunchButton from '@/components/home/LaunchButton.vue';
import GameStatusCard from '@/components/home/GameStatusCard.vue';
import QuickActionsCard from '@/components/home/QuickActionsCard.vue';
import ModStatusCard from '@/components/home/ModStatusCard.vue';
import ServerStatusCard from '@/components/home/ServerStatusCard.vue';
import NewsCard from '@/components/home/NewsCard.vue';
import RecentActivityCard from '@/components/home/RecentActivityCard.vue';

const authStore = useAuthStore();
const bannerStore = useBannerStore();
const modStore = useModStore();

const onlinePlayersCount = ref(127); // This would come from an API

onMounted(async () => {
  await bannerStore.loadActiveBanners();
  await modStore.getCurrentVersion();
});

function getLastPlayedTime() {
  if (new Date()) {
    const date = new Date();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
  return 'never';
}
</script>
