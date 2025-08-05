<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div class="relative">
        <!-- Main Launch Card -->
        <div
          :class="[
            'relative glass-card p-8 text-center transition-all duration-300 group overflow-hidden',
            'hover:bg-primary-700/20',
            {
              'border-accent-blue/50 bg-accent-blue/10': launchStore.isRunning,
              'border-status-success/50 bg-status-success/10':
                launchStore.isRunning &&
                launchStore.status?.status === 'running',
            },
          ]"
        >
          <!-- Background Animation -->
          <div
            v-if="launchStore.isLaunching"
            class="absolute inset-0 bg-gradient-to-r from-accent-blue/20 to-accent-cyan/20 animate-pulse"
          />

          <!-- Content -->
          <div class="relative z-10">
            <!-- Status Indicator -->
            <div class="flex justify-center mb-6">
              <div :class="['w-4 h-4 rounded-full', getStatusColor()]" />
            </div>

            <!-- Main Icon -->
            <div
              class="w-24 h-24 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-3xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform relative"
            >
              <Play
                v-if="
                  !launchStore.isRunning &&
                  !launchStore.isLaunching &&
                  !launchStore.isUpdating &&
                  !launchStore.update
                "
                class="w-12 h-12 text-white ml-1"
              />
              <Square
                v-else-if="launchStore.isRunning"
                class="w-12 h-12 text-white"
              />
              <Download
                v-else-if="launchStore.isUpdating || launchStore.update"
                class="w-12 h-12 text-white"
              />
              <div
                v-else
                class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"
              />
            </div>

            <!-- Title and Description -->
            <h2 class="text-3xl font-bold text-white mb-3">
              {{ getButtonText() }}
            </h2>
            <p class="text-primary-300 mb-6 max-w-md mx-auto">
              {{ getButtonDescription() }}
            </p>

            <!-- Launch Button -->
            <button
              @click="handleLaunch"
              :disabled="!authStore.isAuthenticated && !launchStore.isRunning"
              class="glass-button px-8 py-4 text-white font-semibold text-lg hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 btn-hover-lift"
            >
              {{ getActionText() }}
            </button>

            <!-- Progress Bar -->
            <div
              v-if="
                launchStore.status &&
                launchStore.status.step !== undefined &&
                launchStore.status.steps !== undefined
              "
              class="mt-6"
            >
              <div class="flex justify-between text-sm text-primary-300 mb-2">
                <span>{{ launchStore.status.message }}</span>
                <span
                  >{{
                    Math.round(
                      (launchStore.status.step / launchStore.status.steps) * 100
                    )
                  }}%</span
                >
              </div>
              <div class="progress-bar h-2">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${
                      (launchStore.status.step / launchStore.status.steps) * 100
                    }%`,
                  }"
                />
              </div>
            </div>

            <!-- Individual Progress -->
            <div
              v-else-if="
                launchStore.status && launchStore.status.progress !== undefined
              "
              class="mt-6"
            >
              <div class="flex justify-between text-sm text-primary-300 mb-2">
                <span>{{ launchStore.status.message }}</span>
                <span>{{ Math.round(launchStore.status.progress) }}%</span>
              </div>
              <div class="progress-bar h-2">
                <div
                  class="progress-fill"
                  :style="{ width: `${launchStore.status.progress}%` }"
                />
              </div>
            </div>

            <!-- Version Info -->
            <div
              class="mt-6 flex items-center justify-center gap-4 text-sm text-primary-400"
            >
              <div class="flex items-center gap-2">
                <Gamepad2 class="w-4 h-4" />
                <span>Minecraft 1.20.1</span>
              </div>
              <div class="w-1 h-1 bg-primary-500 rounded-full"></div>
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4" />
                <span>Fabric 0.16.14</span>
              </div>
              <div class="w-1 h-1 bg-primary-500 rounded-full"></div>
              <div class="flex items-center gap-2">
                <Zap class="w-4 h-4" />
                <span>The Veil v1.0.6</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex gap-3 mt-4">
          <button
            @click="openGameDirectory"
            class="flex-1 glass-button py-3 px-4 text-primary-300 hover:text-white hover:bg-primary-600/20 flex items-center justify-center gap-2"
          >
            <Folder class="w-4 h-4" />
            Game Folder
          </button>

          <button
            @click="showLogs = true"
            :disabled="!launchStore.currentInstanceId"
            class="flex-1 glass-button py-3 px-4 text-primary-300 hover:text-white hover:bg-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText class="w-4 h-4" />
            View Logs
          </button>

          <button
            @click="verifyFiles"
            class="flex-1 glass-button py-3 px-4 text-primary-300 hover:text-white hover:bg-primary-600/20 flex items-center justify-center gap-2"
          >
            <Shield class="w-4 h-4" />
            Verify Files
          </button>
        </div>

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

            <div class="flex-1 overflow-y-auto code-block">
              <pre class="text-xs">{{
                logs.join('\n') || 'No logs available'
              }}</pre>
            </div>

            <div class="flex justify-end gap-3 mt-4">
              <button
                @click="showLogs = false"
                class="glass-button px-4 py-2 text-white hover:bg-primary-600/20"
              >
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
          <div class="glass-card p-6 max-w-md w-full mx-4">
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

            <div class="mb-6 text-primary-200">
              {{
                launchStore.verificationError ||
                'Game file verification failed.'
              }}
            </div>

            <div class="flex flex-col gap-3">
              <button
                @click="verifyGameFiles"
                class="glass-button py-3 px-4 text-white hover:bg-primary-600/20"
              >
                Verify Game Files
              </button>
              <button
                @click="retryLaunch"
                class="glass-button py-3 px-4 text-white hover:bg-accent-blue/20"
              >
                Retry Launch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Play,
  Square,
  Download,
  Folder,
  FileText,
  Shield,
  X,
  Gamepad2,
  Package,
  Zap,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useLaunchStore } from '@/stores/launch';
import { ipcService } from '@/services/ipc';
import { storeToRefs } from 'pinia';
import Sidebar from '@/components/layout/Sidebar.vue';

const authStore = useAuthStore();
const launchStore = useLaunchStore();

const showLogs = ref(false);
const { logs } = storeToRefs(launchStore);

async function handleLaunch() {
  if (launchStore.isRunning) {
    await launchStore.stopGame();
  } else {
    await launchStore.start();
  }
}

function getButtonText(): string {
  if (launchStore.isLaunching) {
    return 'Launching The Veil';
  } else if (launchStore.isRunning) {
    return 'The Veil is Running';
  } else if (launchStore.update) {
    return 'Update Available';
  } else {
    return 'Launch The Veil';
  }
}

function getButtonDescription(): string {
  if (launchStore.update) {
    return `Update to ${
      launchStore.updateData?.newVersion || 'latest version'
    } to continue playing`;
  }

  if (launchStore.isUpdating) {
    return 'Updating The Veil... Please wait while we install the latest version.';
  }

  if (launchStore.isLaunching) {
    return 'Starting up the game environment and loading your world...';
  } else if (launchStore.isRunning) {
    return 'Your horror adventure is currently running. Click to stop the game.';
  } else if (!authStore.isAuthenticated) {
    return 'Sign in with your Microsoft account to start your adventure';
  } else {
    return 'Enter the darkness and face your fears in this immersive horror experience';
  }
}

function getActionText(): string {
  if (launchStore.isRunning) {
    return 'Stop Game';
  } else if (launchStore.update) {
    return 'Update & Launch';
  } else if (launchStore.isLaunching) {
    return 'Launching...';
  } else {
    return 'Launch Game';
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
    return 'bg-accent-teal animate-pulse';
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

async function openGameDirectory() {
  const path = await ipcService.getMinecraftPath();
  if (path) {
    await (window as any).electronAPI.showFolder(path);
  }
}

async function verifyFiles() {
  await ipcService.hardVerify();
}

async function verifyGameFiles() {
  await ipcService.hardVerify();
  launchStore.showVerificationDialog = false;
}

async function retryLaunch() {
  launchStore.showVerificationDialog = false;
  await handleLaunch();
}
</script>
