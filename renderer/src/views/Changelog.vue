<template>
  <div class="flex h-full">
    <Sidebar />

    <div class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1
            class="text-3xl font-bold text-white mb-2 flex items-center gap-3"
          >
            <div
              class="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl flex items-center justify-center"
            >
              <Clock class="w-6 h-6 text-white" />
            </div>
            Changelog
          </h1>
          <p class="text-primary-300">
            Stay updated with the latest changes and improvements
          </p>
        </div>

        <!-- Filter Bar -->
        <div class="glass-card p-4 mb-6">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <Filter class="w-4 h-4 text-primary-400" />
              <span class="text-sm text-primary-300">Filter by:</span>
            </div>

            <div class="flex gap-2">
              <button
                v-for="type in changelogTypes"
                :key="type.value"
                @click="
                  selectedType =
                    selectedType === type.value ? 'all' : type.value
                "
                :class="[
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300',
                  selectedType === type.value
                    ? 'bg-accent-blue text-white'
                    : 'bg-primary-700/50 text-primary-300 hover:bg-primary-600/50',
                ]"
              >
                <component :is="type.icon" class="w-3 h-3 mr-1 inline" />
                {{ type.label }}
              </button>
            </div>

            <div class="ml-auto">
              <div class="relative">
                <Search
                  class="w-4 h-4 text-primary-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search updates..."
                  class="glass-input pl-10 pr-4 py-2 text-sm w-64"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Changelog Timeline -->
        <div class="relative">
          <!-- Timeline Line -->
          <div
            class="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-blue via-accent-cyan to-transparent"
          ></div>

          <div class="space-y-8">
            <div
              v-for="(entry, _index) in filteredChangelog"
              :key="entry.id"
              class="relative"
            >
              <!-- Timeline Dot -->
              <div
                class="absolute left-6 w-4 h-4 rounded-full border-2 border-primary-900 z-10"
                :class="getTimelineDotClass(entry.type)"
              ></div>

              <!-- Changelog Card -->
              <div
                class="ml-16 glass-card p-6 hover:bg-primary-700/20 transition-all duration-300 group cursor-pointer"
                @click="toggleExpanded(entry.id)"
              >
                <!-- Header -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h3 class="text-xl font-semibold text-white">
                        {{ entry.version }}
                      </h3>
                      <span
                        :class="[
                          'px-2 py-1 rounded-lg text-xs font-medium',
                          getTypeBadgeClass(entry.type),
                        ]"
                      >
                        <component
                          :is="getTypeIcon(entry.type)"
                          class="w-3 h-3 mr-1 inline"
                        />
                        {{ entry.type }}
                      </span>
                      <span
                        v-if="entry.isLatest"
                        class="px-2 py-1 bg-status-success/20 text-status-success rounded-lg text-xs font-medium"
                      >
                        Latest
                      </span>
                    </div>
                    <p class="text-primary-300 text-sm">{{ entry.summary }}</p>
                  </div>

                  <div class="text-right">
                    <div class="text-sm text-primary-400">
                      {{ formatDate(entry.releaseDate) }}
                    </div>
                    <div class="text-xs text-primary-500">
                      {{ formatRelativeTime(entry.releaseDate) }}
                    </div>
                  </div>
                </div>

                <!-- Preview Image -->
                <div
                  v-if="entry.imageUrl"
                  class="mb-4 rounded-lg overflow-hidden"
                >
                  <img
                    :src="entry.imageUrl"
                    :alt="`${entry.version} preview`"
                    class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    @error="handleImageError"
                  />
                </div>

                <!-- Quick Stats -->
                <div class="flex items-center gap-6 mb-4 text-sm">
                  <div class="flex items-center gap-2 text-primary-400">
                    <Plus class="w-4 h-4 text-status-success" />
                    <span>{{ entry.features.length }} new features</span>
                  </div>
                  <div class="flex items-center gap-2 text-primary-400">
                    <Wrench class="w-4 h-4 text-accent-blue" />
                    <span>{{ entry.improvements.length }} improvements</span>
                  </div>
                  <div class="flex items-center gap-2 text-primary-400">
                    <Bug class="w-4 h-4 text-status-warning" />
                    <span>{{ entry.bugFixes.length }} bug fixes</span>
                  </div>
                </div>

                <!-- Expand/Collapse Indicator -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-primary-400">
                    <Download class="w-4 h-4" />
                    <span class="text-sm">{{
                      formatBytes(entry.downloadSize)
                    }}</span>
                  </div>

                  <button
                    class="flex items-center gap-2 text-accent-blue hover:text-accent-cyan transition-colors"
                  >
                    <span class="text-sm">{{
                      expandedEntries.has(entry.id) ? 'Show less' : 'Read more'
                    }}</span>
                    <ChevronDown
                      :class="[
                        'w-4 h-4 transition-transform duration-300',
                        expandedEntries.has(entry.id) ? 'rotate-180' : '',
                      ]"
                    />
                  </button>
                </div>

                <!-- Expanded Content -->
                <Transition name="expand">
                  <div
                    v-if="expandedEntries.has(entry.id)"
                    class="mt-6 pt-6 border-t border-primary-700/50"
                  >
                    <!-- Features -->
                    <div v-if="entry.features.length > 0" class="mb-6">
                      <h4
                        class="text-lg font-semibold text-white mb-3 flex items-center gap-2"
                      >
                        <Sparkles class="w-5 h-5 text-status-success" />
                        New Features
                      </h4>
                      <ul class="space-y-2">
                        <li
                          v-for="feature in entry.features"
                          :key="feature"
                          class="flex items-start gap-3 text-primary-200"
                        >
                          <Plus
                            class="w-4 h-4 text-status-success mt-0.5 flex-shrink-0"
                          />
                          <span>{{ feature }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- Improvements -->
                    <div v-if="entry.improvements.length > 0" class="mb-6">
                      <h4
                        class="text-lg font-semibold text-white mb-3 flex items-center gap-2"
                      >
                        <Wrench class="w-5 h-5 text-accent-blue" />
                        Improvements
                      </h4>
                      <ul class="space-y-2">
                        <li
                          v-for="improvement in entry.improvements"
                          :key="improvement"
                          class="flex items-start gap-3 text-primary-200"
                        >
                          <ArrowUp
                            class="w-4 h-4 text-accent-blue mt-0.5 flex-shrink-0"
                          />
                          <span>{{ improvement }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- Bug Fixes -->
                    <div v-if="entry.bugFixes.length > 0" class="mb-6">
                      <h4
                        class="text-lg font-semibold text-white mb-3 flex items-center gap-2"
                      >
                        <Bug class="w-5 h-5 text-status-warning" />
                        Bug Fixes
                      </h4>
                      <ul class="space-y-2">
                        <li
                          v-for="fix in entry.bugFixes"
                          :key="fix"
                          class="flex items-start gap-3 text-primary-200"
                        >
                          <Check
                            class="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0"
                          />
                          <span>{{ fix }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- Technical Details -->
                    <div v-if="entry.technicalDetails" class="mb-6">
                      <h4
                        class="text-lg font-semibold text-white mb-3 flex items-center gap-2"
                      >
                        <Code class="w-5 h-5 text-primary-400" />
                        Technical Details
                      </h4>
                      <div class="code-block">
                        <pre class="text-sm">{{ entry.technicalDetails }}</pre>
                      </div>
                    </div>

                    <!-- Download Button -->
                    <div
                      class="flex items-center justify-between pt-4 border-t border-primary-700/50"
                    >
                      <div class="text-sm text-primary-400">
                        Released {{ formatDate(entry.releaseDate) }}
                      </div>
                      <span
                        v-if="entry.isLatest"
                        class="text-sm text-status-success font-medium"
                      >
                        Current Version
                      </span>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Load More -->
          <div v-if="hasMoreEntries" class="text-center mt-8">
            <button
              @click="loadMoreEntries"
              :disabled="isLoading"
              class="glass-button px-6 py-3 text-white hover:bg-primary-600/20 disabled:opacity-50"
            >
              <div
                v-if="isLoading"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"
              ></div>
              {{ isLoading ? 'Loading...' : 'Load More' }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="filteredChangelog.length === 0" class="text-center py-12">
            <div
              class="w-16 h-16 bg-primary-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <Clock class="w-8 h-8 text-primary-400" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              No Updates Found
            </h3>
            <p class="text-primary-400">
              Try adjusting your filters or search terms
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Clock,
  Filter,
  Search,
  Plus,
  Wrench,
  Bug,
  Download,
  ChevronDown,
  Sparkles,
  ArrowUp,
  Check,
  Code,
  Rocket,
  Zap,
} from 'lucide-vue-next';
import Sidebar from '@/components/layout/Sidebar.vue';
import { useNotificationStore } from '@/stores/notifications';
import { apiService } from '@/services/api';

interface ChangelogEntry {
  id: string;
  version: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  summary: string;
  releaseDate: string;
  imageUrl?: string;
  downloadSize: number;
  isLatest: boolean;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  technicalDetails?: string;
}

const notificationStore = useNotificationStore();

const selectedType = ref<string>('all');
const searchQuery = ref('');
const expandedEntries = ref(new Set<string>());
const isLoading = ref(false);
const hasMoreEntries = ref(true);

const changelogTypes = [
  { value: 'all', label: 'All', icon: Clock },
  { value: 'major', label: 'Major', icon: Rocket },
  { value: 'minor', label: 'Minor', icon: Sparkles },
  { value: 'patch', label: 'Patch', icon: Wrench },
  { value: 'hotfix', label: 'Hotfix', icon: Zap },
];

// Mock changelog data - replace with API call
const changelog = ref<ChangelogEntry[]>([]);

const fetchChangelog = async () => {
  isLoading.value = true;
  try {
    const response = await apiService.getChangelog();
    changelog.value = response.data.changelog.map((entry: any) => ({
      ...entry,
      isLatest: entry.version === '1.0.0', // Example condition for latest version
      downloadSize: entry.downloadSize || 0, // Default to 0 if not provided
    }));
    hasMoreEntries.value = response.data.hasMore; // Example condition for more entries
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to load changelog. Please try again later.',
    });
  } finally {
    isLoading.value = false;
  }
};

const filteredChangelog = computed(() => {
  let filtered = changelog.value;

  // Filter by type
  if (selectedType.value !== 'all') {
    filtered = filtered.filter((entry) => entry.type === selectedType.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (entry) =>
        entry.version.toLowerCase().includes(query) ||
        entry.summary.toLowerCase().includes(query) ||
        entry.features.some((f) => f.toLowerCase().includes(query)) ||
        entry.improvements.some((i) => i.toLowerCase().includes(query)) ||
        entry.bugFixes.some((b) => b.toLowerCase().includes(query))
    );
  }

  return filtered;
});

function toggleExpanded(entryId: string) {
  if (expandedEntries.value.has(entryId)) {
    expandedEntries.value.delete(entryId);
  } else {
    expandedEntries.value.add(entryId);
  }
}

function getTimelineDotClass(type: string) {
  const classes = {
    major: 'bg-gradient-to-br from-purple-500 to-pink-500',
    minor: 'bg-gradient-to-br from-accent-blue to-accent-cyan',
    patch: 'bg-gradient-to-br from-green-500 to-emerald-500',
    hotfix: 'bg-gradient-to-br from-red-500 to-orange-500',
  };
  return classes[type as keyof typeof classes] || classes.patch;
}

function getTypeBadgeClass(type: string) {
  const classes = {
    major: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    minor: 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30',
    patch: 'bg-green-500/20 text-green-400 border border-green-500/30',
    hotfix: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  return classes[type as keyof typeof classes] || classes.patch;
}

function getTypeIcon(type: string) {
  const icons = {
    major: Rocket,
    minor: Sparkles,
    patch: Wrench,
    hotfix: Zap,
  };
  return icons[type as keyof typeof icons] || Wrench;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

function formatBytes(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
}

function loadMoreEntries() {
  isLoading.value = true;

  // Simulate loading more entries
  setTimeout(() => {
    fetchChangelog();
    isLoading.value = false;
  }, 1000);
}

onMounted(() => {
  fetchChangelog();
});
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
  transform: translateY(0);
}
</style>
