<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div class="glass-card p-8 flex flex-col items-center gap-4">
      <div class="relative">
        <div
          class="w-12 h-12 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"
        ></div>
        <div
          class="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-accent-cyan rounded-full animate-spin"
          style="animation-direction: reverse; animation-duration: 0.8s"
        ></div>
      </div>

      <div class="text-center">
        <h3 class="text-lg font-semibold text-white mb-1">{{ title }}</h3>
        <p class="text-sm text-primary-300">{{ message }}</p>
      </div>

      <div v-if="progress !== undefined" class="w-64">
        <div class="flex justify-between text-xs text-primary-300 mb-1">
          <span>Progress</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <div class="progress-bar h-2">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  message?: string;
  progress?: number;
}

withDefaults(defineProps<Props>(), {
  title: 'Loading',
  message: 'Please wait...',
});
</script>
