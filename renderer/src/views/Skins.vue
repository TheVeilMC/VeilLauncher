<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1
            class="text-3xl font-bold text-white mb-2 flex items-center gap-3"
          >
            <div
              class="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl flex items-center justify-center"
            >
              <Palette class="w-6 h-6 text-white" />
            </div>
            Skin Management
          </h1>
          <p class="text-primary-300">
            Customize your Minecraft character appearance
          </p>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <!-- Current Skin & 3D Preview -->
          <div class="xl:col-span-2">
            <CurrentSkin3D />
          </div>

          <!-- Skin Upload & Actions -->
          <div class="space-y-6">
            <ChangeSkinWithPreview />
            <SkinQuickActions />
          </div>
        </div>

        <!-- Skin History -->
        <div class="mt-8">
          <SkinHistoryEnhanced />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Palette } from 'lucide-vue-next';
import Sidebar from '@/components/layout/Sidebar.vue';
import CurrentSkin3D from '@/components/skins/CurrentSkin3D.vue';
import ChangeSkinWithPreview from '@/components/skins/ChangeSkinWithPreview.vue';
import SkinQuickActions from '@/components/skins/SkinQuickActions.vue';
import SkinHistoryEnhanced from '@/components/skins/SkinHistoryEnhanced.vue';
import { useSkinStore } from '@/stores/skin';

const skinStore = useSkinStore();

onMounted(async () => {
  await skinStore.fetchCurrentSkin();
  await skinStore.fetchSkinHistory();
});
</script>
