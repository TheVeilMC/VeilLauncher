<template>
  <div class="relative">
    <button
      @click="handleLaunch"
      :disabled="!authStore.isAuthenticated"
      :class="[
        'relative w-full glass-card p-6 text-left transition-all duration-300 group overflow-hidden',
        'hover:bg-primary-700/20 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'border-accent-blue/50 bg-accent-blue/10': launchStore.isRunning,
          'border-status-success/50 bg-status-success/10':
            launchStore.isRunning && launchStore.status?.status === 'running',
        },
      ]"
    >
      <!-- Background Animation -->
      <div
        v-if="launchStore.isLaunching"
        class="absolute inset-0 bg-gradient-to-r from-accent-blue/20 to-accent-cyan/20 animate-pulse"
      />

      <!-- Content -->
      <div class="relative z-10 flex items-center gap-4">
        <!-- Icon -->
        <div
          class="w-16 h-16 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform relative"
        >
          <!-- Status Indicator (half-overlapping edge) -->
          <div
            :class="['w-3 h-3 rounded-full absolute z-10', getStatusColor()]"
            style="top: -2px; right: -2px"
          />
          <Play
            v-if="
              !launchStore.isRunning &&
              !launchStore.isLaunching &&
              !launchStore.isUpdating &&
              !launchStore.update
            "
            class="w-8 h-8 text-white ml-1"
          />
          <Square
            v-else-if="launchStore.isRunning"
            class="w-8 h-8 text-white"
          />
          <Download
            v-else-if="launchStore.isUpdating || launchStore.update"
            class="w-8 h-8 text-white"
          />
          <div
            v-else
            class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        </div>

        <!-- Text Content -->
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-white mb-1">
            {{ getButtonText() }}
          </h3>
          <p class="text-primary-300 mb-2">
            {{ getButtonDescription() }}
          </p>

          <!-- Status -->
          <!-- <div v-if="launchStore.status" class="flex items-center gap-2">
            <div
              v-if="
                launchStore.status.step !== undefined &&
                launchStore.status.steps !== undefined
              "
              class="flex-1"
            >
              <div class="progress-bar h-2">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${
                      (launchStore.status.step /
                        launchStore.status.steps) *
                      100
                    }%`,
                  }"
                />
              </div>
            </div>
          </div> -->
          <div v-if="launchStore.status" class="flex items-center gap-2">
            <!-- Progress Bar -->
            <div
              v-if="launchStore.status.progress !== undefined"
              class="flex-1 max-w-32 mr-2"
            >
              <div class="progress-bar h-1">
                <div
                  class="progress-fill"
                  :style="{ width: `${launchStore.status.progress}%` }"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 text-sm">
              <span class="text-primary-200">{{
                launchStore.status.message
              }}</span>
            </div>
          </div>
        </div>

        <!-- Version Badge -->
        <div class="text-right">
          <div class="text-xs text-primary-400 mb-1">Minecraft</div>
          <div class="text-sm font-medium text-white">1.20.1</div>
          <!-- TODO: FETCH CURRENT VERSION -->
          <div class="text-xs text-accent-blue">beta</div>
        </div>
      </div>
      <div
        v-if="
          launchStore.status &&
          launchStore.status.step !== undefined &&
          launchStore.status.steps !== undefined
        "
        class="absolute left-0 bottom-0 w-full"
        style="z-index: 20"
      >
        <div
          class="h-1.5 rounded bg-primary-900/60 overflow-hidden shadow-inner"
        >
          <div
            class="h-full rounded bg-accent-blue transition-all duration-300"
            :style="{
              width: `${
                (launchStore.status.step / launchStore.status.steps) * 100
              }%`,
            }"
          />
        </div>
      </div>
    </button>

    <!-- Quick Actions -->
    <!-- <div class="flex gap-2 mt-3">
      <button
        @click="openGameDirectory"
        class="glass-button px-3 py-2 text-sm text-primary-300 hover:text-white hover:bg-primary-600/20 flex items-center gap-2"
      >
        <Folder class="w-4 h-4" />
        Game Folder
      </button>

      <button
        @click="showLogs = true"
        :disabled="!launchStore.currentInstanceId"
        class="glass-button px-3 py-2 text-sm text-primary-300 hover:text-white hover:bg-primary-600/20 disabled:opacity-50 flex items-center gap-2"
      >
        <FileText class="w-4 h-4" />
        Logs
      </button>
    </div> -->

    <!-- Logs Modal -->
    <div
      v-if="showLogs"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        class="glass-card p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-white">Game Logs</h3>
          <button
            @click="showLogs = false"
            class="text-primary-400 hover:text-white"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="flex-1 overflow-scroll overflow-y-scroll code-block">
          <pre class="h-full text-xs">{{
            logs.join('\n') || 'No logs available'
          }}</pre>
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button @click="showLogs = false">
            <div
              v-if="launchStore.showVerificationDialog"
              class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div class="glass-card p-6 max-w-md w-full mx-4 flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-semibold text-white">
                    Verification Failed
                  </h3>
                  <button
                    @click="launchStore.showVerificationDialog = false"
                    class="text-primary-400 hover:text-white"
                  >
                    <X class="w-6 h-6" />
                  </button>
                </div>
                <div class="mb-4 text-primary-200">
                  {{
                    launchStore.verificationError ||
                    'Game file verification failed.'
                  }}
                </div>
                <div class="flex flex-col gap-2">
                  <button
                    @click="verifyGameFiles"
                    class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
                  >
                    Verify Game Files
                  </button>
                  <button
                    @click="retryLaunch"
                    class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
                  >
                    Retry Launch
                  </button>
                </div>
              </div>
            </div>
            class="glass-button px-4 py-2 text-white hover:bg-primary-600/20" >
            Close
          </button>
        </div>
      </div>
    </div>
    <!-- Verification Failed Modal -->
    <div
      v-if="launchStore.showVerificationDialog"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="glass-card p-6 max-w-md w-full mx-4 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-white">Verification Failed</h3>
          <button
            @click="launchStore.showVerificationDialog = false"
            class="text-primary-400 hover:text-white"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        <div class="mb-4 text-primary-200">
          {{
            launchStore.verificationError || 'Game file verification failed.'
          }}
        </div>
        <div class="flex flex-col gap-2">
          <button
            @click="verifyGameFiles"
            class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
          >
            Verify Game Files
          </button>
          <button
            @click="retryLaunch"
            class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
          >
            Retry Launch
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Play, Square, X, Download } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useLaunchStore } from '@/stores/launch';
import { ipcService } from '@/services/ipc';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const launchStore = useLaunchStore();

const { logs, showLogs } = storeToRefs(launchStore);

onMounted(async () => {
  launchStore.setupIPCListeners();
});

async function verifyGameFiles() {
  await ipcService.hardVerify();
  launchStore.showVerificationDialog = false;
}

async function retryLaunch() {
  launchStore.showVerificationDialog = false;
  await handleLaunch();
}

async function handleLaunch() {
  if (launchStore.isRunning) {
    await launchStore.stopGame();
  } else {
    await launchStore.start();
  }
}

function getButtonText(): string {
  if (launchStore.isLaunching) {
    return 'Launching...';
  } else if (launchStore.isRunning) {
    return 'The Veil is Running';
  } else if (launchStore.update) {
    return 'Update The Veil';
  } else {
    return 'Launch The Veil';
  }
}

function getButtonDescription(): string {
  if (launchStore.update) {
    return (
      'Update to ' + launchStore.updateData?.newVersion || 'Latest Version'
    );
  }

  if (launchStore.isUpdating) {
    return 'Updating The Veil... Please wait.';
  }

  if (
    launchStore.status &&
    !launchStore.status.status.includes('update') &&
    (launchStore.status.status.includes('install') ||
      launchStore.status.status.includes('download'))
  ) {
    return 'Setting up your game environment... Please wait.';
  }

  if (launchStore.isLaunching) {
    return 'Starting up the game...';
  } else if (launchStore.isRunning) {
    return 'Click to stop the game';
  } else if (!authStore.isAuthenticated) {
    return 'Running in offline mode';
  } else {
    return 'Start your horror adventure';
  }
}

function getStatusColor(): string {
  if (!launchStore.status) return 'bg-primary-500';

  if (
    launchStore.status.status.includes('install') ||
    launchStore.status.status.includes('download')
  ) {
    return 'bg-accent-yellow animate-pulse';
  }

  if (launchStore.status.status.includes('verifying')) {
    return 'bg-accent-green animate-pulse';
  }

  if (launchStore.status.status.includes('updating')) {
    return 'bg-accent-blue animate-pulse';
  }

  switch (launchStore.status.status) {
    case 'running':
      return 'bg-status-success animate-pulse';
    case 'error':
      return 'bg-status-error';
    case 'preparing':
    case 'launching':
      return 'bg-accent-blue animate-pulse';
    case 'stopped':
      return 'bg-primary-500';
    default:
      return 'bg-primary-500';
  }
}
</script>
