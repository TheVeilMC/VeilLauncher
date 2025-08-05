<template>
  <button
    :class="[
      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
      'hover:bg-primary-700/30',
      {
        'bg-accent-blue/20 text-accent-blue border border-accent-blue/30':
          active,
        'text-primary-300 hover:text-white': !active,
      },
    ]"
    @click="$emit('click')"
  >
    <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-medium">{{ item.label }}</div>
      <div v-if="item.description" class="text-xs opacity-75 truncate">
        {{ item.description }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
interface SidebarItem {
  name: string;
  label: string;
  icon: any;
  description?: string;
}

interface Props {
  item: SidebarItem;
  active?: boolean;
}

defineProps<Props>();
defineEmits<{
  click: [];
}>();
</script>
