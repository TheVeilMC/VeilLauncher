<template>
  <div class="flex h-full">
    <Sidebar />

    <div class="flex-1 p-6 overflow-y-auto">
      <NotificationCenter />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue';
import NotificationCenter from '@/components/notifications/NotificationCenter.vue';
</script>