<template>
  <div class="glass-card p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <Server class="w-5 h-5 text-accent-blue" />
      Server Status
    </h3>

    <div class="space-y-4">
      <!-- Main Server Status -->
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium text-white">The Veil Official</div>
          <div class="text-xs text-primary-400">play.theveil.net</div>
        </div>
        <div class="flex items-center gap-2">
          <div :class="['w-2 h-2 rounded-full', getServerStatusColor()]"></div>
          <span class="text-sm text-white">{{ serverStatus }}</span>
        </div>
      </div>

      <!-- Server Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-lg font-semibold text-white">
            {{ onlinePlayers }}
          </div>
          <div class="text-xs text-primary-400">Players Online</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-white">{{ serverPing }}ms</div>
          <div class="text-xs text-primary-400">Ping</div>
        </div>
      </div>

      <!-- Server Performance -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-primary-300">Server Load</span>
          <span class="text-white">{{ serverLoad }}%</span>
        </div>
        <div class="progress-bar h-2">
          <div
            :class="[
              'h-full transition-all duration-300 rounded-full',
              serverLoad > 80
                ? 'bg-status-error'
                : serverLoad > 60
                  ? 'bg-status-warning'
                  : 'bg-status-success',
            ]"
            :style="{ width: `${serverLoad}%` }"
          ></div>
        </div>
      </div>

      <!-- Recent Players -->
      <div class="pt-4 border-t border-primary-700/50">
        <h4 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Users class="w-4 h-4 text-accent-blue" />
          Recent Players
        </h4>
        <div class="space-y-2">
          <div
            v-for="player in recentPlayers"
            :key="player.username"
            class="flex items-center gap-3 p-2 rounded-lg bg-primary-800/30"
          >
            <img
              :src="player.avatar"
              :alt="player.username"
              class="w-6 h-6 rounded"
              @error="handleAvatarError"
            />
            <div class="flex-1">
              <div class="text-sm font-medium text-white">
                {{ player.username }}
              </div>
              <div class="text-xs text-primary-400">{{ player.status }}</div>
            </div>
            <div
              :class="[
                'w-2 h-2 rounded-full',
                player.online ? 'bg-status-success' : 'bg-primary-500',
              ]"
            ></div>
          </div>
        </div>
      </div>

      <!-- Server Events -->
      <div class="pt-4 border-t border-primary-700/50">
        <h4 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Calendar class="w-4 h-4 text-accent-blue" />
          Upcoming Events
        </h4>
        <div class="space-y-2">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            class="p-2 rounded-lg bg-primary-800/30"
          >
            <div class="text-sm font-medium text-white">{{ event.name }}</div>
            <div class="text-xs text-primary-400">
              {{ formatEventTime(event.startTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Server, Users, Calendar } from 'lucide-vue-next';

const serverStatus = ref('Online');
const onlinePlayers = ref(127);
const serverPing = ref(45);
const serverLoad = ref(34);

const recentPlayers = ref([
  {
    username: 'ShadowHunter92',
    avatar:
      'https://crafatar.com/avatars/069a79f4-44e9-4726-a5be-fca90e38aaf5?size=32',
    status: 'In The Veil',
    online: true,
  },
  {
    username: 'DarkMage',
    avatar:
      'https://crafatar.com/avatars/61699b2e-d327-4a01-9f1e-0ea8c3f06bc6?size=32',
    status: 'Building',
    online: true,
  },
  {
    username: 'VeilWalker',
    avatar:
      'https://crafatar.com/avatars/f7c77d99-9f15-4a66-a87d-c4a51ef30d19?size=32',
    status: 'Last seen 2h ago',
    online: false,
  },
]);

const upcomingEvents = ref([
  {
    id: '1',
    name: 'Horror Night Event',
    startTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
  },
  {
    id: '2',
    name: 'Community Build Contest',
    startTime: new Date(Date.now() + 86400000 * 7), // 1 week from now
  },
]);

function getServerStatusColor() {
  switch (serverStatus.value.toLowerCase()) {
    case 'online':
      return 'bg-status-success animate-pulse';
    case 'maintenance':
      return 'bg-status-warning';
    case 'offline':
      return 'bg-status-error';
    default:
      return 'bg-primary-500';
  }
}

function handleAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMzMzIiByeD0iNCIvPgo8cGF0aCBkPSJNMTYgMTZDMTguMjA5MSAxNiAyMCAxNC4yMDkxIDIwIDEyQzIwIDkuNzkwODYgMTguMjA5MSA4IDE2IDhDMTMuNzkwOSA4IDEyIDkuNzkwODYgMTIgMTJDMTIgMTQuMjA5MSAxMy43OTA5IDE2IDE2IDE2WiIgZmlsbD0iIzk5OSIvPgo8cGF0aCBkPSJNMTYgMThDMTIuNjg2MyAxOCAxMCAyMC42ODYzIDEwIDI0VjI2SDIyVjI0QzIyIDIwLjY4NjMgMTkuMzEzNyAxOCAxNiAxOFoiIGZpbGw9IiM5OTkiLz4KPC9zdmc+';
}

function formatEventTime(date: Date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays > 0) {
    return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    return 'Starting soon';
  }
}

onMounted(() => {
  // Simulate real-time server updates
  setInterval(() => {
    // Slight variations in player count and ping
    onlinePlayers.value = Math.max(
      50,
      Math.min(
        200,
        onlinePlayers.value + Math.floor((Math.random() - 0.5) * 10)
      )
    );
    serverPing.value = Math.max(
      20,
      Math.min(100, serverPing.value + Math.floor((Math.random() - 0.5) * 20))
    );
    serverLoad.value = Math.max(
      10,
      Math.min(90, serverLoad.value + Math.floor((Math.random() - 0.5) * 10))
    );
  }, 30000); // Update every 30 seconds
});
</script>
