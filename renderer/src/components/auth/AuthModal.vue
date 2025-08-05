<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div class="glass-card p-8 max-w-md w-full mx-4 animate-scale-in">
      <div class="text-center mb-6">
        <div
          class="w-16 h-16 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl mx-auto mb-4 flex items-center justify-center"
        >
          <Shield class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Login to Minecraft</h2>
        <p class="text-primary-300">Authenticate with your Microsoft account</p>
      </div>

      <!-- Waiting State -->
      <div v-if="authStore.authState === 'waiting'" class="text-center">
        <div class="mb-6">
          <!-- <QRCodeVue3 
            :value="authStore.authData?.verificationUri || ''"
            :size="200"
            :margin="2"
            :color-dark="'#1e293b'"
            :color-light="'#f8fafc'"
            class="mx-auto bg-white p-4 rounded-lg"
          /> -->
          <!-- TODO: Implement QR code display -->
        </div>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-primary-300 mb-2">Visit this URL:</p>
            <div class="glass-input p-3 text-center">
              <a
                :href="authStore.authData?.verificationUri"
                target="_blank"
                class="text-accent-blue hover:text-accent-cyan transition-colors"
              >
                {{ authStore.authData?.verificationUri }}
              </a>
            </div>
          </div>

          <div>
            <p class="text-sm text-primary-300 mb-2">Enter this code:</p>
            <div class="glass-input p-3 text-center">
              <span
                class="text-2xl font-mono font-bold text-white tracking-wider"
              >
                {{ authStore.authData?.userCode }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center mt-6 gap-3">
          <div
            class="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"
          ></div>
          <span class="text-sm text-primary-300"
            >Waiting for authentication...</span
          >
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="authStore.authState === 'success'" class="text-center">
        <div
          class="w-16 h-16 bg-status-success/20 rounded-full mx-auto mb-4 flex items-center justify-center"
        >
          <CheckCircle class="w-8 h-8 text-status-success" />
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Welcome back!</h3>
        <p class="text-primary-300">
          Successfully logged in as
          <span class="text-white font-medium">{{
            authStore.activeAccount?.username
          }}</span>
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="authStore.authState === 'error'" class="text-center">
        <div
          class="w-16 h-16 bg-status-error/20 rounded-full mx-auto mb-4 flex items-center justify-center"
        >
          <XCircle class="w-8 h-8 text-status-error" />
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">
          Authentication Failed
        </h3>
        <p class="text-primary-300 mb-6">
          Please try again or check your internet connection.
        </p>

        <div class="flex gap-3">
          <button
            @click="authStore.startAuthentication"
            class="glass-button flex-1 py-2 text-white hover:bg-accent-blue/20"
          >
            Try Again
          </button>
          <button
            @click="authStore.closeAuthModal"
            class="glass-button flex-1 py-2 text-white hover:bg-primary-600/20"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Close button for waiting state -->
      <div v-if="authStore.authState === 'waiting'" class="mt-6 text-center">
        <button
          @click="authStore.closeAuthModal"
          class="text-primary-400 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Shield, CheckCircle, XCircle } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
