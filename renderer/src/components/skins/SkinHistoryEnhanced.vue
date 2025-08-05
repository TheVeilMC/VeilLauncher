<template>
  <div class="glass-card p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-white flex items-center gap-2">
        <History class="w-5 h-5 text-accent-blue" />
        Skin History
      </h2>
      <div class="flex items-center gap-2">
        <button
          @click="viewMode = 'grid'"
          :class="[
            'glass-button p-2 transition-all duration-300',
            viewMode === 'grid'
              ? 'text-accent-blue border-accent-blue/50'
              : 'text-primary-300',
          ]"
        >
          <Grid class="w-4 h-4" />
        </button>
        <button
          @click="viewMode = 'list'"
          :class="[
            'glass-button p-2 transition-all duration-300',
            viewMode === 'list'
              ? 'text-accent-blue border-accent-blue/50'
              : 'text-primary-300',
          ]"
        >
          <List class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Grid View -->
    <div
      v-if="viewMode === 'grid'"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
    >
      <div
        v-for="(item, index) in paginatedHistory"
        :key="item.id"
        class="group relative"
      >
        <div
          class="glass-card p-3 hover:bg-primary-600/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
          @click="selectSkin()"
        >
          <!-- Skin Preview -->
          <div class="relative mb-3">
            <div
              class="w-full aspect-square bg-primary-800/50 rounded-lg overflow-hidden border border-primary-600/30"
            >
              <img
                :src="getSkinUrl()"
                :alt="`Skin from ${item.createdAt}`"
                class="w-full h-full object-cover pixelated"
                @error="handleImageError"
              />
            </div>

            <!-- Hover Overlay -->
            <div
              class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center"
            >
              <div class="text-white text-xs font-medium">Click to Apply</div>
            </div>

            <!-- Current Indicator -->
            <div
              v-if="index === 0"
              class="absolute -top-2 -right-2 w-6 h-6 bg-status-success rounded-full flex items-center justify-center"
            >
              <Check class="w-3 h-3 text-white" />
            </div>
          </div>

          <!-- Date -->
          <div class="text-xs text-center text-primary-400">
            {{ formatDate(item.createdAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-3">
      <div
        v-for="(item, index) in paginatedHistory"
        :key="item.id"
        class="glass-card p-4 hover:bg-primary-600/20 transition-all duration-300 cursor-pointer group"
        @click="selectSkin()"
      >
        <div class="flex items-center gap-4">
          <!-- Skin Preview -->
          <div class="relative">
            <div
              class="w-12 h-12 bg-primary-800/50 rounded-lg overflow-hidden border border-primary-600/30"
            >
              <img
                :src="getSkinUrl()"
                :alt="`Skin from ${item.createdAt}`"
                class="w-full h-full object-cover pixelated"
                @error="handleImageError"
              />
            </div>
            <div
              v-if="index === 0"
              class="absolute -top-1 -right-1 w-4 h-4 bg-status-success rounded-full flex items-center justify-center"
            >
              <Check class="w-2 h-2 text-white" />
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-white">
                  {{
                    index === 0
                      ? 'Current Skin'
                      : `Skin #${history.length - index}`
                  }}
                </div>
                <div class="text-xs text-primary-400">
                  {{ formatDate(item.createdAt) }}
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  @click.stop="previewSkin(item)"
                  class="glass-button p-2 text-primary-300 hover:text-white"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  @click.stop="downloadSkin(item)"
                  class="glass-button p-2 text-primary-300 hover:text-white"
                >
                  <Download class="w-4 h-4" />
                </button>
                <button
                  v-if="index !== 0"
                  @click.stop="deleteSkin()"
                  class="glass-button p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="history.length === 0" class="text-center py-12">
      <div
        class="w-16 h-16 bg-primary-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center"
      >
        <History class="w-8 h-8 text-primary-400" />
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">No Skin History</h3>
      <p class="text-primary-400 text-sm">
        Upload your first skin to start building your collection
      </p>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-center gap-2 mt-6"
    >
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="glass-button p-2 text-primary-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="currentPage = page"
          :class="[
            'w-8 h-8 rounded text-sm transition-all duration-300',
            page === currentPage
              ? 'bg-accent-blue text-white'
              : 'text-primary-300 hover:text-white hover:bg-primary-600/20',
          ]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="glass-button p-2 text-primary-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="previewSkinData"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="glass-card p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Skin Preview</h3>
          <button
            @click="previewSkinData = null"
            class="text-primary-400 hover:text-white"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="text-center">
          <img
            :src="getSkinUrl()"
            alt="Skin preview"
            class="w-32 h-32 mx-auto rounded-lg border border-primary-600 pixelated mb-4"
          />
          <div class="text-sm text-primary-300 mb-4">
            {{ formatDate(previewSkinData.createdAt) }}
          </div>

          <div class="flex gap-3">
            <button
              @click="selectSkin()"
              class="flex-1 glass-button py-2 text-white hover:bg-accent-blue/20"
            >
              Apply Skin
            </button>
            <button
              @click="downloadSkin(previewSkinData)"
              class="glass-button py-2 px-4 text-primary-300 hover:text-white"
            >
              <Download class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  History,
  Grid,
  List,
  Check,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-vue-next';
import { useSkinStore } from '@/stores/skin';
import { useNotificationStore } from '@/stores/notifications';

const skinStore = useSkinStore();
const notificationStore = useNotificationStore();

const viewMode = ref<'grid' | 'list'>('grid');
const currentPage = ref(1);
const itemsPerPage = 24;
const previewSkinData = ref<any>(null);

const history = computed(() => skinStore.skinHistory);

const totalPages = computed(() =>
  Math.ceil(history.value.length / itemsPerPage)
);

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return history.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

function getSkinUrl(): string {
  // This would return the actual skin URL from your API
  return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2tpbiAke2lkfTwvdGV4dD4KPC9zdmc+`;
}

function selectSkin() {
  // Apply the selected skin
  notificationStore.addNotification({
    type: 'info',
    title: 'Skin Applied',
    message: 'The selected skin has been applied to your character',
  });

  previewSkinData.value = null;
}

function previewSkin(item: any) {
  previewSkinData.value = item;
}

function downloadSkin(item: any) {
  // Download the skin
  const link = document.createElement('a');
  link.href = getSkinUrl();
  link.download = `minecraft-skin-${item.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  notificationStore.addNotification({
    type: 'success',
    title: 'Download Started',
    message: 'Skin download has started',
  });
}

function deleteSkin() {
  // Delete the skin from history
  notificationStore.addNotification({
    type: 'info',
    title: 'Skin Deleted',
    message: 'Skin has been removed from your history',
  });
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMUUyOTNCIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTQ5M0I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPHN2Zz4=';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
</script>

<style scoped>
.pixelated {
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
