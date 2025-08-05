<template>
  <button
    @click="$emit('click')"
    :disabled="disabled"
    class="glass-card p-6 text-left hover:bg-primary-700/20 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div class="flex items-start gap-4">
      <div
        class="w-12 h-12 bg-gradient-to-br from-accent-blue/20 to-accent-cyan/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
      >
        <component :is="iconComponent" class="w-6 h-6 text-accent-blue" />
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-semibold text-white mb-1">{{ title }}</h3>
        <p class="text-sm text-primary-300">{{ description }}</p>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Play, Plus, Code } from 'lucide-vue-next';

interface Props {
  title: string;
  description: string;
  icon: string;
  disabled?: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  click: [];
}>();

const iconComponent = computed(() => {
  const icons: Record<string, any> = {
    Play,
    Plus,
    Code,
  };
  return icons[props.icon] || Play;
});
</script>
