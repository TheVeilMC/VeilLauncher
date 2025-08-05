<template>
  <div class="h-full flex items-center justify-center p-6">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div
          class="w-20 h-20 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-3xl mx-auto mb-6 flex items-center justify-center"
        >
          <Shield class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">The Veil Launcher</h1>
        <p class="text-primary-300">Enter the darkness. Face your fears.</p>
      </div>

      <div class="glass-card p-8">
        <h2 class="text-xl font-semibold text-white mb-6 text-center">
          Get Started
        </h2>

        <div class="space-y-4">
          <button
            @click="authStore.startAuthentication"
            :disabled="authStore.authState === 'waiting'"
            class="w-full glass-button py-3 px-4 text-white font-medium hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <div
              v-if="authStore.authState === 'waiting'"
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
            <User v-else class="w-5 h-5" />
            {{
              authStore.authState === 'waiting'
                ? 'Authenticating...'
                : 'Login with Microsoft'
            }}
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-primary-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-primary-900 text-primary-400">or</span>
            </div>
          </div>

          <button
            @click="startOfflineMode"
            class="w-full glass-button py-3 px-4 text-white font-medium hover:bg-primary-600/20 flex items-center justify-center gap-3"
          >
            <WifiOff class="w-5 h-5" />
            Continue Offline
          </button>
        </div>

        <div class="mt-6 text-center">
          <p class="text-xs text-primary-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <div class="mt-8 text-center">
        <div
          class="flex items-center justify-center gap-4 text-sm text-primary-400"
        >
          <a href="#" class="hover:text-white transition-colors">Help</a>
          <span>•</span>
          <a href="#" class="hover:text-white transition-colors">About</a>
          <span>•</span>
          <a href="#" class="hover:text-white transition-colors">Discord</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Shield, User, WifiOff } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

const authStore = useAuthStore();
const router = useRouter();

function startOfflineMode() {
  // Create a temporary offline account
  // This would be implemented in the auth store
  console.log('Starting offline mode...');
}

// Watch for successful authentication
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      router.push('/');
    }
  }
);
</script>
