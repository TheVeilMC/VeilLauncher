<template>
  <div class="glass-card p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-accent-blue" />
        Latest Update
      </h3>
      <router-link
        to="/changelog"
        class="text-accent-blue hover:text-accent-cyan transition-colors text-sm flex items-center gap-1"
      >
        View All
        <ExternalLink class="w-3 h-3" />
      </router-link>
    </div>

    <div v-if="latestUpdate" class="space-y-4">
      <!-- Update Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-xl font-bold text-white">
              v{{ latestUpdate.version }}
            </h4>
            <span
              :class="[
                'px-2 py-1 rounded-lg text-xs font-medium',
                getTypeBadgeClass(latestUpdate.type),
              ]"
            >
              {{ latestUpdate.type }}
            </span>
          </div>
          <p class="text-primary-300 text-sm">{{ latestUpdate.summary }}</p>
        </div>
        <div class="text-right text-sm text-primary-400">
          {{ formatRelativeTime(latestUpdate.releaseDate) }}
        </div>
      </div>

      <!-- Preview Image -->
      <div v-if="latestUpdate.imageUrl" class="rounded-lg overflow-hidden">
        <img
          :src="latestUpdate.imageUrl"
          :alt="`${latestUpdate.version} preview`"
          class="w-full h-32 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
          @click="$router.push('/changelog')"
          @error="handleImageError"
        />
      </div>

      <!-- Quick Stats -->
      <div class="flex items-center gap-4 text-xs text-primary-400">
        <div class="flex items-center gap-1">
          <Plus class="w-3 h-3 text-status-success" />
          <span>{{ latestUpdate.features.length }} features</span>
        </div>
        <div class="flex items-center gap-1">
          <Wrench class="w-3 h-3 text-accent-blue" />
          <span>{{ latestUpdate.improvements.length }} improvements</span>
        </div>
        <div class="flex items-center gap-1">
          <Bug class="w-3 h-3 text-status-warning" />
          <span>{{ latestUpdate.bugFixes.length }} fixes</span>
        </div>
      </div>

      <!-- Key Features Preview -->
      <div v-if="latestUpdate.features.length > 0">
        <h5 class="text-sm font-medium text-white mb-2">Key Features:</h5>
        <ul class="space-y-1">
          <li
            v-for="feature in latestUpdate.features.slice(0, 2)"
            :key="feature"
            class="flex items-start gap-2 text-sm text-primary-200"
          >
            <Plus class="w-3 h-3 text-status-success mt-0.5 flex-shrink-0" />
            <span>{{ feature }}</span>
          </li>
          <li
            v-if="latestUpdate.features.length > 2"
            class="text-xs text-primary-400 ml-5"
          >
            +{{ latestUpdate.features.length - 2 }} more features
          </li>
        </ul>
      </div>

      <!-- Action Button -->
      <div class="pt-4 border-t border-primary-700/50">
        <button
          @click="$router.push('/changelog')"
          class="w-full glass-button py-3 text-white hover:bg-primary-600/20 flex items-center justify-center gap-2"
        >
          <Clock class="w-4 h-4" />
          Read Full Changelog
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div
        class="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto mb-3"
      ></div>
      <p class="text-sm text-primary-400">Loading latest update...</p>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <div
        class="w-12 h-12 bg-primary-700/50 rounded-2xl mx-auto mb-3 flex items-center justify-center"
      >
        <Sparkles class="w-6 h-6 text-primary-400" />
      </div>
      <p class="text-sm text-primary-400">No updates available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Sparkles,
  ExternalLink,
  Plus,
  Wrench,
  Bug,
  Clock,
} from 'lucide-vue-next';

interface UpdateEntry {
  id: string;
  version: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  summary: string;
  releaseDate: string;
  imageUrl?: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
}

const latestUpdate = ref<UpdateEntry | null>(null);
const isLoading = ref(true);

// Mock data - replace with API call
const mockLatestUpdate: UpdateEntry = {
  id: '1',
  version: '1.0.6',
  type: 'minor',
  summary:
    'Enhanced security, new banner system, and improved mod auto-update functionality',
  releaseDate: '2024-01-15T10:00:00Z',
  imageUrl:
    'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400',
  features: [
    'New dynamic banner system with automatic content rotation',
    'Enhanced WebSocket connectivity for real-time updates',
    'Improved mod auto-update system with better conflict resolution',
    'Advanced launch status tracking with detailed progress indicators',
  ],
  improvements: [
    'Better UI animations and micro-interactions',
    'Optimized memory usage during game launch',
    'Faster mod verification and installation process',
  ],
  bugFixes: [
    'Fixed crash when launching with certain mod combinations',
    'Resolved authentication token refresh issues',
    'Fixed skin preview not updating after upload',
  ],
};

onMounted(async () => {
  // Simulate API call
  setTimeout(() => {
    latestUpdate.value = mockLatestUpdate;
    isLoading.value = false;
  }, 1000);
});

function getTypeBadgeClass(type: string) {
  const classes = {
    major: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    minor: 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30',
    patch: 'bg-green-500/20 text-green-400 border border-green-500/30',
    hotfix: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  return classes[type as keyof typeof classes] || classes.patch;
}

function formatRelativeTime(dateString: string) {
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
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
}
</script>
