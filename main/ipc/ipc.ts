import { ipcMain, shell, dialog, app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import { logger } from '../core/logger';
import { SystemManager } from '../services/SystemService';
import { LaunchService } from '../services/LaunchService';
import { InstanceManager } from '../managers/InstanceManager';

export class IPCHandler {
  private store: Store;
  private systemManager: SystemManager;
  private launchService: LaunchService;

  constructor() {
    this.store = new Store();
    this.systemManager = new SystemManager();
    this.launchService = new LaunchService();
  }

  public initializeLaunchService(
    mainWindow: BrowserWindow,
    instanceManager: InstanceManager
  ): void {
    this.launchService.initialize(mainWindow, instanceManager);
  }

  public setup(): void {
    this.systemManager.initialize();

    // Window controls
    ipcMain.handle('window-minimize', () => {
      const window = require('electron').BrowserWindow.getFocusedWindow();
      window?.minimize();
    });

    ipcMain.handle('window-maximize', () => {
      const window = require('electron').BrowserWindow.getFocusedWindow();
      if (window?.isMaximized()) {
        window.unmaximize();
      } else {
        window?.maximize();
      }
    });

    ipcMain.handle('window-close', () => {
      const window = require('electron').BrowserWindow.getFocusedWindow();
      window?.close();
    });

    ipcMain.handle('window-is-maximized', () => {
      const window = require('electron').BrowserWindow.getFocusedWindow();
      return window?.isMaximized() || false;
    });

    // App info
    ipcMain.handle('app-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('app-name', () => {
      return app.getName();
    });

    // System operations
    ipcMain.handle('open-external', async (_, url: string) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error: any) {
        logger.error('Failed to open external URL:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('show-folder', async (_, folderPath: string) => {
      try {
        await shell.showItemInFolder(folderPath);
        return { success: true };
      } catch (error: any) {
        logger.error('Failed to show folder:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('select-folder', async () => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Select Folder',
        });

        if (result.canceled) {
          return { success: false, canceled: true };
        }

        return { success: true, path: result.filePaths[0] };
      } catch (error: any) {
        logger.error('Failed to select folder:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('select-file', async (_, options: any = {}) => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          title: options.title || 'Select File',
          filters: options.filters || [],
        });

        if (result.canceled) {
          return { success: false, canceled: true };
        }

        return { success: true, path: result.filePaths[0] };
      } catch (error: any) {
        logger.error('Failed to select file:', error);
        return { success: false, error: error.message };
      }
    });

    // Store operations
    ipcMain.handle('store-get', (_, key: string) => {
      try {
        return { success: true, value: this.store.get(key) };
      } catch (error: any) {
        logger.error('Failed to get store value:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('store-set', (_, key: string, value: any) => {
      try {
        this.store.set(key, value);
        return { success: true };
      } catch (error: any) {
        logger.error('Failed to set store value:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('store-delete', (_, key: string) => {
      try {
        this.store.delete(key);
        return { success: true };
      } catch (error: any) {
        logger.error('Failed to delete store value:', error);
        return { success: false, error: error.message };
      }
    });

    // Auto-updater
    ipcMain.handle('check-for-updates', async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          return {
            success: false,
            error: 'Updates not available in development',
          };
        }

        const result = await autoUpdater.checkForUpdates();
        return { success: true, updateInfo: result?.updateInfo };
      } catch (error: any) {
        logger.error('Failed to check for updates:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('download-update', async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          return {
            success: false,
            error: 'Updates not available in development',
          };
        }

        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error: any) {
        logger.error('Failed to download update:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('install-update', () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          return {
            success: false,
            error: 'Updates not available in development',
          };
        }

        autoUpdater.quitAndInstall();
        return { success: true };
      } catch (error: any) {
        logger.error('Failed to install update:', error);
        return { success: false, error: error.message };
      }
    });

    // Notifications
    ipcMain.handle('show-notification', (_, options: any) => {
      try {
        const { Notification } = require('electron');

        if (Notification.isSupported()) {
          const notification = new Notification({
            title: options.title || 'The Veil Launcher',
            body: options.body || '',
            icon: options.icon,
          });

          notification.show();

          if (options.onClick) {
            notification.on('click', () => {
              // Handle notification click
            });
          }
        }

        return { success: true };
      } catch (error: any) {
        logger.error('Failed to show notification:', error);
        return { success: false, error: error.message };
      }
    });

    // Tray event handlers
    ipcMain.handle('tray-update-game-status', (_) => {
      // This would be handled by TrayManager
      return { success: true };
    });

    ipcMain.handle('tray-show-notification', (_) => {
      // This would be handled by TrayManager
      return { success: true };
    });

    logger.info('IPC handlers setup complete');
  }
}
