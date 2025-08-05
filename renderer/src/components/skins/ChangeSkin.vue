<template>
  <div class="glass-card p-6">
    <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
      <Upload class="w-5 h-5 text-accent-blue" />
      Change Skin (Legacy)
    </h2>
    <div class="flex flex-col items-center space-y-4">
      <input
        type="file"
        @change="onFileChange"
        accept="image/png"
        class="glass-input p-3 text-white w-full"
      />
      <button
        @click="uploadSkin"
        :disabled="!selectedFile || isLoading"
        class="glass-button py-3 px-6 text-white font-medium hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2"
      >
        <div
          v-if="isLoading"
          class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        ></div>
        <Upload v-else class="w-4 h-4" />
        <span v-if="isLoading">Uploading...</span>
        <span v-else>Upload</span>
      </button>
      <p
        v-if="message"
        class="text-sm text-center"
        :class="{
          'text-status-success': isSuccess,
          'text-status-error': !isSuccess,
        }"
      >
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Upload } from 'lucide-vue-next';
import { useSkinStore } from '../../stores/skin';

const skinStore = useSkinStore();
const selectedFile = ref<File | null>(null);
const isLoading = ref(false);
const message = ref('');
const isSuccess = ref(false);

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const uploadSkin = async () => {
  if (!selectedFile.value) return;
  isLoading.value = true;
  message.value = '';
  try {
    await skinStore.changeSkin(selectedFile.value);
    isSuccess.value = true;
    message.value = 'Skin uploaded successfully!';
  } catch (error) {
    isSuccess.value = false;
    message.value = 'Failed to upload skin.';
    console.error(error);
  } finally {
    isLoading.value = false;
    selectedFile.value = null;
  }
};
</script>
