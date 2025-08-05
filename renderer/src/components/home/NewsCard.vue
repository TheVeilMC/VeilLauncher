<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <Newspaper class="w-5 h-5 text-accent-blue" />
      Latest News
    </h3>

    <div class="space-y-4">
      <div
        v-for="article in news"
        :key="article.id"
        class="border-l-2 border-accent-blue/30 pl-4 hover:border-accent-blue/60 transition-colors cursor-pointer"
        @click="openArticle(article.url)"
      >
        <h4 class="text-sm font-medium text-white mb-1">{{ article.title }}</h4>
        <p class="text-xs text-primary-300 mb-2">{{ article.summary }}</p>
        <div class="flex items-center gap-2 text-xs text-primary-400">
          <Calendar class="w-3 h-3" />
          <span>{{ formatDate(article.date) }}</span>
          <span class="w-1 h-1 bg-primary-500 rounded-full"></span>
          <span>{{ article.category }}</span>
        </div>
      </div>

      <div v-if="news.length === 0" class="text-center py-8">
        <div
          class="w-12 h-12 bg-primary-700/50 rounded-full mx-auto mb-3 flex items-center justify-center"
        >
          <Newspaper class="w-6 h-6 text-primary-400" />
        </div>
        <p class="text-sm text-primary-400">No news available</p>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-primary-700/50">
      <button
        @click="refreshNews"
        :disabled="isLoading"
        class="w-full glass-button py-2 text-sm text-white hover:bg-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <RefreshCw :class="['w-4 h-4', { 'animate-spin': isLoading }]" />
        Refresh
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Newspaper, Calendar, RefreshCw } from 'lucide-vue-next';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  url: string;
}

const news = ref<NewsArticle[]>([
  {
    id: '1',
    title: 'The Veil Launcher v1.0 Released',
    summary:
      'The official launcher for The Veil horror gamemode is now available.',
    date: new Date().toISOString(),
    category: 'Release',
    url: '#',
  },
  {
    id: '2',
    title: 'New Horror Features Added',
    summary:
      'Experience enhanced atmospheric effects and improved gameplay mechanics.',
    date: new Date(Date.now() - 86400000).toISOString(),
    category: 'Update',
    url: '#',
  },
  {
    id: '3',
    title: 'Community Mod Support',
    summary: 'The launcher now supports community-created mods and content.',
    date: new Date(Date.now() - 172800000).toISOString(),
    category: 'Feature',
    url: '#',
  },
]);

const isLoading = ref(false);

onMounted(() => {
  // In a real implementation, this would fetch news from an API
});

async function refreshNews() {
  isLoading.value = true;

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  isLoading.value = false;
}

function openArticle(url: string) {
  if (url !== '#') {
    window.open(url, '_blank');
  }
}

function formatDate(dateString: string) {
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
  } else {
    return date.toLocaleDateString();
  }
}
</script>
