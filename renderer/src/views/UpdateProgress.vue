<template>
  <div
    class="h-full flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900"
  >
    <div class="max-w-2xl w-full mx-6">
      <!-- Header -->
      <div class="text-center mb-12">
        <div
          class="w-24 h-24 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-3xl mx-auto mb-6 flex items-center justify-center"
        >
          <Download class="w-12 h-12 text-white" />
        </div>
        <h1 class="text-4xl font-bold text-white mb-4">
          Updating The Veil Launcher
        </h1>
        <p class="text-xl text-primary-300">
          Please wait while we install the latest version
        </p>
      </div>

      <!-- Progress Section -->
      <div class="glass-card p-8 mb-8">
        <!-- Main Progress Bar -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-white">
              {{ updateStatus.title }}
            </h3>
            <span class="text-sm text-primary-300"
              >{{ updateStatus.progress }}%</span
            >
          </div>

          <div class="progress-bar h-3 mb-2">
            <div
              class="progress-fill transition-all duration-500 ease-out"
              :style="{ width: `${updateStatus.progress}%` }"
            />
          </div>

          <div class="flex justify-between text-sm text-primary-400">
            <span>{{ updateStatus.message }}</span>
            <span v-if="updateStatus.speed">{{
              formatSpeed(updateStatus.speed)
            }}</span>
          </div>
        </div>

        <!-- Detailed Progress -->
        <div class="space-y-4">
          <div
            v-for="step in updateSteps"
            :key="step.id"
            class="flex items-center gap-4 p-4 rounded-lg bg-primary-800/30"
          >
            <div class="flex-shrink-0">
              <CheckCircle
                v-if="step.status === 'completed'"
                class="w-6 h-6 text-status-success"
              />
              <div
                v-else-if="step.status === 'active'"
                class="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"
              />
              <Circle v-else class="w-6 h-6 text-primary-500" />
            </div>

            <div class="flex-1">
              <h4 class="text-white font-medium">{{ step.title }}</h4>
              <p class="text-sm text-primary-400">{{ step.description }}</p>
            </div>

            <div
              v-if="step.status === 'active' && step.progress !== undefined"
              class="text-right"
            >
              <div class="text-sm text-white font-medium">
                {{ step.progress }}%
              </div>
              <div class="w-16 progress-bar h-1 mt-1">
                <div
                  class="progress-fill"
                  :style="{ width: `${step.progress}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="glass-card p-4 text-center">
          <Package class="w-8 h-8 text-accent-blue mx-auto mb-2" />
          <div class="text-sm text-primary-300">Version</div>
          <div class="text-white font-semibold">
            {{ updateInfo.newVersion }}
          </div>
        </div>

        <div class="glass-card p-4 text-center">
          <HardDrive class="w-8 h-8 text-accent-cyan mx-auto mb-2" />
          <div class="text-sm text-primary-300">Size</div>
          <div class="text-white font-semibold">
            {{ formatBytes(updateInfo.size) }}
          </div>
        </div>

        <div class="glass-card p-4 text-center">
          <Clock class="w-8 h-8 text-accent-teal mx-auto mb-2" />
          <div class="text-sm text-primary-300">ETA</div>
          <div class="text-white font-semibold">
            {{ formatETA(updateStatus.eta) }}
          </div>
        </div>
      </div>

      <!-- Release Notes -->
      <div class="glass-card p-6">
        <h3
          class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
        >
          <FileText class="w-5 h-5 text-accent-blue" />
          What's New
        </h3>
        <div class="prose prose-invert max-w-none">
          <div class="text-primary-200 whitespace-pre-line">
            {{ updateInfo.releaseNotes }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-sm text-primary-400">
          The launcher will restart automatically when the update is complete
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Download,
  CheckCircle,
  Circle,
  Package,
  HardDrive,
  Clock,
  FileText,
} from 'lucide-vue-next';

interface UpdateStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  progress?: number;
}

const updateStatus = ref({
  title: 'Downloading Update',
  message: 'Preparing download...',
  progress: 0,
  speed: 0,
  eta: 0,
});

const updateInfo = ref({
  newVersion: '2.0.0',
  size: 45 * 1024 * 1024, // 45MB
  releaseNotes: `• Enhanced security and performance
• New banner system with dynamic content
• Improved mod auto-update system
• Better launch status tracking
• Fixed various bugs and stability issues
• Updated UI with better animations
• Enhanced WebSocket connectivity`,
});

const updateSteps = ref<UpdateStep[]>([
  {
    id: 'download',
    title: 'Downloading Update',
    description: 'Downloading the latest launcher version',
    status: 'active',
    progress: 0,
  },
  {
    id: 'verify',
    title: 'Verifying Files',
    description: 'Checking file integrity and signatures',
    status: 'pending',
  },
  {
    id: 'backup',
    title: 'Creating Backup',
    description: 'Backing up current installation',
    status: 'pending',
  },
  {
    id: 'install',
    title: 'Installing Update',
    description: 'Applying the new version',
    status: 'pending',
  },
  {
    id: 'cleanup',
    title: 'Finalizing',
    description: 'Cleaning up temporary files',
    status: 'pending',
  },
]);

let progressInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  // Simulate update progress
  simulateUpdateProgress();
});

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
});

function simulateUpdateProgress() {
  let currentStep = 0;
  let stepProgress = 0;

  progressInterval = setInterval(() => {
    const step = updateSteps.value[currentStep];
    if (!step) return;

    // Update step progress
    stepProgress += Math.random() * 15 + 5;
    step.progress = Math.min(stepProgress, 100);

    // Update overall progress
    const baseProgress = (currentStep / updateSteps.value.length) * 100;
    const stepContribution =
      (step.progress / 100) * (100 / updateSteps.value.length);
    updateStatus.value.progress = Math.min(
      baseProgress + stepContribution,
      100
    );

    // Update status message
    updateStatus.value.message = step.description;
    updateStatus.value.speed = Math.random() * 2000000 + 500000; // Random speed
    updateStatus.value.eta = Math.max(
      0,
      (100 - updateStatus.value.progress) * 2
    ); // Rough ETA

    // Complete current step and move to next
    if (step.progress >= 100) {
      step.status = 'completed';
      currentStep++;
      stepProgress = 0;

      if (currentStep < updateSteps.value.length) {
        updateSteps.value[currentStep].status = 'active';
        updateStatus.value.title = updateSteps.value[currentStep].title;
      } else {
        // Update complete
        updateStatus.value.title = 'Update Complete';
        updateStatus.value.message = 'Restarting launcher...';
        updateStatus.value.progress = 100;

        setTimeout(() => {
          // In real implementation, this would restart the app
          console.log('Update complete - restarting...');
        }, 2000);

        if (progressInterval) {
          clearInterval(progressInterval);
        }
      }
    }
  }, 200);
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
</script>
