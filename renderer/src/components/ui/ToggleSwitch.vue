<template>
  <label class="relative inline-flex items-center cursor-pointer">
    <input
      :checked="value"
      @change="$emit('update:value', ($event.target as any)?.checked)"
      type="checkbox"
      class="sr-only peer"
    />
    <div
      :class="[
        'w-11 h-6 rounded-full peer transition-all duration-300',
        'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-blue/50',
        'after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px]',
        'after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all',
        'peer-checked:after:translate-x-full peer-checked:after:border-white',
        value 
          ? 'bg-accent-blue shadow-lg shadow-accent-blue/25' 
          : 'bg-primary-700 shadow-inner'
      ]"
    />
  </label>
</template>

<script setup lang="ts">
interface Props {
  value: boolean;
}

defineProps<Props>();

defineEmits<{
  'update:value': [value: boolean];
}>();
</script>