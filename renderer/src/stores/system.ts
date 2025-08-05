import { defineStore } from 'pinia';
import { ipcService } from '../services/ipc';

export const useSystemStore = defineStore('system', {
  state: () => ({
    systemInfo: null,
    javaVersions: [],
    javaPaths: [],
    minecraftPath: '',
    memoryInfo: null,
    diskInfo: null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchSystemInfo() {
      this.loading = true;
      this.error = null;
      try {
        this.systemInfo = await ipcService.getSystemInfo();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchJavaVersions() {
      this.loading = true;
      this.error = null;
      try {
        this.javaVersions = await ipcService.getJavaVersions();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchMemoryInfo() {
      this.loading = true;
      this.error = null;
      try {
        this.memoryInfo = await ipcService.getMemoryInfo();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchDiskInfo() {
      this.loading = true;
      this.error = null;
      try {
        this.diskInfo = await ipcService.getDiskInfo();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchMinecraftPath() {
      this.loading = true;
      this.error = null;
      ipcService
        .getMinecraftPath()
        .then((path: string) => {
          this.minecraftPath = path;
        })
        .catch((err: any) => {
          this.error = err.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    async fetchCommonJavaPaths() {
      this.loading = true;
      this.error = null;
      try {
        this.javaPaths = await ipcService.getCommonJavaPaths();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
