<template>
  <div class="bg-gray-800 rounded-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Skin History</h2>
    <div
      v-if="history.length > 0"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <div
        v-for="item in history"
        :key="item.id"
        class="cursor-pointer"
        @click="selectSkin(item.id)"
      >
        <img
          :src="getSkinUrl(item.id) as any"
          :alt="`Skin from ${item.createdAt}`"
          class="w-full h-auto rounded-lg"
        />
        <p class="text-xs text-center mt-1">
          {{ new Date(item.createdAt).toLocaleString() }}
        </p>
      </div>
    </div>
    <div v-else class="text-gray-400">No skin history found.</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useSkinStore } from '../../stores/skin';
import { apiService } from '@/services/api';

const skinStore = useSkinStore();
const history = computed(() => skinStore.skinHistory);

skinStore.fetchSkinHistory();

const getSkinUrl = (id: number) => {
  return apiService.getSkinUrl(id);
};

const selectSkin = (id: number) => {
  // This could be implemented to allow reverting to an old skin
  console.log(`Selected skin ${id}`);
};
</script>
