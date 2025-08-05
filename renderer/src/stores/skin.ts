import { defineStore } from 'pinia';
import { apiService } from '../services/api';

interface SkinHistoryItem {
  id: number;
  createdAt: string;
}

interface SkinState {
  currentSkinUrl: string | null;
  skinHistory: SkinHistoryItem[];
}

export const useSkinStore = defineStore('skin', {
  state: (): SkinState => ({
    currentSkinUrl: null,
    skinHistory: [],
  }),
  actions: {
    async fetchCurrentSkin() {
      try {
        const response = await apiService.getCurrentSkin();
        console.log('Current skin response:', response);
        if (response instanceof Blob) {
          this.currentSkinUrl = URL.createObjectURL(response as Blob);
        } else {
          console.error('Not a valid Blob', response);
        }
      } catch (error) {
        console.error('Failed to fetch current skin', error);
        this.currentSkinUrl = null;
      }
    },
    async changeSkin(file: File) {
      try {
        const response = await apiService.changeSkin(file);
        if (!response.success) {
          throw new Error(response.error || 'Failed to change skin');
        }
        await this.fetchCurrentSkin();
        await this.fetchSkinHistory();
      } catch (error) {
        console.error('Failed to change skin', error);
        throw error;
      }
    },
    async fetchSkinHistory() {
      try {
        const response = await apiService.getSkinHistory();
        this.skinHistory = response.data || [];
      } catch (error) {
        console.error('Failed to fetch skin history', error);
        this.skinHistory = [];
      }
    },
  },
});
