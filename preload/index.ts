import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),
  on: (
    channel: string,
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => {
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppName: () => ipcRenderer.invoke('app-name'),

  // System operations
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  showFolder: (path: string) => ipcRenderer.invoke('show-folder', path),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: (options?: any) => ipcRenderer.invoke('select-file', options),

  // Store operations
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: any) =>
    ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store-delete', key),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Notifications
  showNotification: (options: any) =>
    ipcRenderer.invoke('show-notification', options),

  // Event listeners
  onWindowFocus: (callback: () => void) => {
    ipcRenderer.on('window-focus', callback);
    return () => ipcRenderer.removeListener('window-focus', callback);
  },

  onWindowBlur: (callback: () => void) => {
    ipcRenderer.on('window-blur', callback);
    return () => ipcRenderer.removeListener('window-blur', callback);
  },

  onWindowResize: (
    callback: (data: { width: number; height: number }) => void
  ) => {
    ipcRenderer.on('window-resize', callback as any);
    return () => ipcRenderer.removeListener('window-resize', callback as any);
  },

  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },

  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  },

  windowMoveBy: (deltaX: number, deltaY: number) =>
    ipcRenderer.invoke('window-move-by', deltaX, deltaY),

  // Alternative: Get current position and set new position
  windowGetPosition: () => ipcRenderer.invoke('window-get-position'),
  windowSetPosition: (x: number, y: number) =>
    ipcRenderer.invoke('window-set-position', x, y),

  // Development tools
  ...(process.env.NODE_ENV === 'development' && {
    openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  }),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (
        channel: string,
        listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
      ) => () => void;
    };
    electronAPI: {
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      getAppName: () => Promise<string>;
      openExternal: (
        url: string
      ) => Promise<{ success: boolean; error?: string }>;
      showFolder: (
        path: string
      ) => Promise<{ success: boolean; error?: string }>;
      selectFolder: () => Promise<{
        success: boolean;
        path?: string;
        canceled?: boolean;
        error?: string;
      }>;
      selectFile: (options?: any) => Promise<{
        success: boolean;
        path?: string;
        canceled?: boolean;
        error?: string;
      }>;
      storeGet: (
        key: string
      ) => Promise<{ success: boolean; value?: any; error?: string }>;
      storeSet: (
        key: string,
        value: any
      ) => Promise<{ success: boolean; error?: string }>;
      storeDelete: (
        key: string
      ) => Promise<{ success: boolean; error?: string }>;
      checkForUpdates: () => Promise<{
        success: boolean;
        updateInfo?: any;
        error?: string;
      }>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => Promise<{ success: boolean; error?: string }>;
      showNotification: (
        options: any
      ) => Promise<{ success: boolean; error?: string }>;
      onWindowFocus: (callback: () => void) => () => void;
      onWindowBlur: (callback: () => void) => () => void;
      onWindowResize: (
        callback: (data: { width: number; height: number }) => void
      ) => () => void;
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      openDevTools?: () => Promise<void>;
    };
  }
}
