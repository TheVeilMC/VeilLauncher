<template>
  <div class="relative h-64 rounded-2xl overflow-hidden group">
    <!-- Banner Images -->
    <div
      v-if="bannerStore.activeBanners.length > 0"
      class="relative w-full h-full"
    >
      <TransitionGroup name="banner" tag="div" class="relative w-full h-full">
        <div
          v-for="(banner, index) in bannerStore.activeBanners"
          :key="banner.id"
          v-show="index === bannerStore.currentBannerIndex"
          class="absolute inset-0 w-full h-full"
        >
          <img
            :src="banner.imageUrl"
            :alt="banner.title"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />

          <!-- Overlay -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          ></div>

          <!-- Content -->
          <!-- <div class="absolute bottom-0 left-0 right-0 p-6">
            <h3 class="text-2xl font-bold text-white mb-2">{{ banner.title }}</h3>
            <p class="text-primary-200 mb-4 line-clamp-2">{{ banner.description }}</p>
            
            <button
              v-if="banner.actionUrl && banner.actionText"
              @click="handleBannerAction(banner)"
              class="glass-button px-6 py-2 text-white font-medium hover:bg-accent-blue/20"
            >
              {{ banner.actionText }}
            </button>
          </div> -->
        </div>
      </TransitionGroup>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex items-center justify-center h-full bg-primary-800/50 backdrop-blur-sm"
    >
      <div class="text-center">
        <div
          class="w-16 h-16 bg-primary-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        >
          <Image class="w-8 h-8 text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">
          No Banners Available
        </h3>
        <p class="text-primary-400 text-sm">Check back later for updates</p>
      </div>
    </div>

    <!-- Navigation Dots -->
    <div
      v-if="bannerStore.activeBanners.length > 1"
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2"
    >
      <button
        v-for="(_, index) in bannerStore.activeBanners"
        :key="index"
        @click="bannerStore.setBannerIndex(index)"
        :class="[
          'w-2 h-2 rounded-full transition-all duration-300',
          index === bannerStore.currentBannerIndex
            ? 'bg-white w-6'
            : 'bg-white/50 hover:bg-white/75',
        ]"
      />
    </div>

    <!-- Navigation Arrows -->
    <div
      v-if="bannerStore.activeBanners.length > 1"
      class="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      <button
        @click="bannerStore.previousBanner"
        class="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>

      <button
        @click="bannerStore.nextBanner"
        class="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight, Image } from 'lucide-vue-next';
import { useBannerStore } from '@/stores/banners';

const bannerStore = useBannerStore();

let autoSlideInterval: NodeJS.Timeout | null = null;

onMounted(async () => {
  await bannerStore.loadActiveBanners();

  // Start auto-slide if there are multiple banners
  if (bannerStore.activeBanners.length > 1) {
    startAutoSlide();
  }
});

onUnmounted(() => {
  stopAutoSlide();
});

function startAutoSlide() {
  autoSlideInterval = setInterval(() => {
    bannerStore.nextBanner();
  }, 5000); // Change banner every 5 seconds
}

function stopAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
}
</script>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.5s ease-in-out;
}

.banner-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.banner-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
