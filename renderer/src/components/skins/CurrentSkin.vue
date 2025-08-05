<template>
  <div class="glass-card p-6">
    <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
      <User class="w-5 h-5 text-accent-blue" />
      Current Skin (Legacy View)
    </h2>
    <div
      class="flex justify-center items-center h-64 bg-primary-800/50 rounded-xl border border-primary-600/30"
    >
      <img
        v-if="skinUrl"
        :src="skinUrl"
        alt="Current Skin"
        class="max-h-full pixelated border border-primary-600 rounded"
      />
      <div v-else class="text-primary-400 text-center">
        <div
          class="w-16 h-16 bg-primary-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        >
          <User class="w-8 h-8 text-primary-400" />
        </div>
        <div>No skin set</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { User } from 'lucide-vue-next';
import { useSkinStore } from '../../stores/skin';
import { watch } from 'vue';

const skinStore = useSkinStore();
const skinUrl = computed(() => skinStore.currentSkinUrl);

watch(
  () => skinStore.currentSkinUrl,
  (newUrl) => {
    if (!newUrl) {
      console.warn('Current skin URL is not set');
    }
  }
);
skinStore.fetchCurrentSkin();
</script>

<style scoped>
.pixelated {
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
