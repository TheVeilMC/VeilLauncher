import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api';
import type { Banner } from '@the-veil/shared/src/types';

export const useBannerStore = defineStore('banners', () => {
  const banners = ref<Banner[]>([]);
  const activeBanners = ref<Banner[]>([]);
  const isLoading = ref(false);
  const currentBannerIndex = ref(0);

  async function loadBanners() {
    try {
      isLoading.value = true;
      const response = await apiService.getBanners();

      if (response.success) {
        banners.value = response.data;
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadActiveBanners() {
    try {
      const response = await apiService.getActiveBanners();

      if (response.success) {
        activeBanners.value = response.data;
      }
    } catch (error) {
      console.error('Failed to load active banners:', error);
    }
  }

  function nextBanner() {
    if (activeBanners.value.length > 0) {
      currentBannerIndex.value =
        (currentBannerIndex.value + 1) % activeBanners.value.length;
    }
  }

  function previousBanner() {
    if (activeBanners.value.length > 0) {
      currentBannerIndex.value =
        currentBannerIndex.value === 0
          ? activeBanners.value.length - 1
          : currentBannerIndex.value - 1;
    }
  }

  function setBannerIndex(index: number) {
    if (index >= 0 && index < activeBanners.value.length) {
      currentBannerIndex.value = index;
    }
  }

  return {
    banners,
    activeBanners,
    isLoading,
    currentBannerIndex,
    loadBanners,
    loadActiveBanners,
    nextBanner,
    previousBanner,
    setBannerIndex,
  };
});
