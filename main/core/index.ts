import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { WindowManager } from '../managers/WindowManager';
import { IPCHandler } from '../ipc/ipc';
import { SecurityManager } from '../managers/SecurityManager';
import { TrayManager } from '../managers/TrayManager';
import { logger } from './logger';
import { InstanceManager } from '../managers/InstanceManager';

class VeilLauncher {
  private windowManager: WindowManager;
  private ipcHandler!: IPCHandler; // Initialized later
  private securityManager: SecurityManager;
  private trayManager: TrayManager;
  private instanceManager: InstanceManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.securityManager = new SecurityManager();
    this.trayManager = new TrayManager();
    this.instanceManager = new InstanceManager();
  }

  public async initialize(): Promise<void> {
    try {
      // Set app user model ID for Windows
      if (process.platform === 'win32') {
        app.setAppUserModelId('net.theveil.launcher');
      }

      // Setup IPC handlers
      this.ipcHandler = new IPCHandler();
      this.ipcHandler.setup();

      if (process.env.NODE_ENV === 'development') {
        app.commandLine.appendSwitch('remote-debugging-port', '9222');
      }

      this.instanceManager.checkForInstances();

      // Configure security
      this.securityManager.configure();

      // Handle app events
      this.setupAppEvents();

      // Setup auto-updater
      this.setupAutoUpdater();

      // Wait for app to be ready
      await app.whenReady();

      // Create main window
      await this.windowManager.createMainWindow();
      const mainWindow = this.windowManager.getMainWindow();

      if (mainWindow) {
        this.ipcHandler.initializeLaunchService(
          mainWindow,
          this.instanceManager
        );
        // Create system tray
        this.trayManager.create(mainWindow);

        // Setup IPC handlers for window management
        this.setupWindowIPC(mainWindow);

        mainWindow.on('resize', () => {
          const [width, height] = mainWindow!.getSize();
          this.sendToRenderer(mainWindow, 'window-resize', { width, height });
        });
      } else {
        throw new Error('Main window could not be created');
      }

      logger.info('The Veil Launcher initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize launcher:', error);
      throw error;
    }
  }

  private setupWindowIPC(mainWindow: BrowserWindow): void {
    ipcMain.handle(
      'window-move-by',
      (_event: any, deltaX: number, deltaY: number) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        const [x, y] = mainWindow.getPosition();
        mainWindow.setPosition(x + deltaX, y + deltaY);
      }
    );

    ipcMain.handle('update-launcher', () => {
      if (process.env.NODE_ENV !== 'development') {
        autoUpdater.downloadUpdate();
      }
    });

    ipcMain.handle('window-get-position', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return [0, 0];
      return mainWindow.getPosition();
    });

    ipcMain.handle(
      'window-set-position',
      (_event: any, x: number, y: number) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.setPosition(x, y);
      }
    );
  }

  public sendToRenderer(
    mainWindow: BrowserWindow,
    channel: string,
    data?: any
  ): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
    }
  }

  private setupAppEvents(): void {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.windowManager.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.cleanup();
    });

    app.on('web-contents-created', (_, contents) => {
      // Security: Prevent new window creation
      contents.on('frame-created', (event, _navigationUrl) => {
        event.preventDefault();
      });

      // Security: Prevent navigation to external URLs
      contents.on('will-navigate', (event, navigationUrl) => {
        try {
          const parsedUrl = new URL(navigationUrl);
          if (
            parsedUrl.origin !== 'http://localhost:3000' &&
            !navigationUrl.startsWith('file://')
          ) {
            event.preventDefault();
          }
        } catch (error) {
          logger.error('Error parsing navigation URL:', error);
          event.preventDefault();
        }
      });
    });
  }

  private setupAutoUpdater(): void {
    if (process.env.NODE_ENV === 'development') {
      logger.info('Auto-updater disabled in development mode');
      return;
    }

    try {
      autoUpdater.allowDowngrade = false;
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.logger = logger;
      autoUpdater.autoRunAppAfterInstall = true;

      autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on('update-available', () => {
        logger.info('Update available');
        this.windowManager.sendToRenderer('update-available');
      });

      autoUpdater.on('update-downloaded', () => {
        logger.info('Update downloaded');
        this.windowManager.sendToRenderer('update-downloaded');
        setTimeout(() => {
          autoUpdater.quitAndInstall();
        }, 2000);
      });

      autoUpdater.on('download-progress', (progressObj) => {
        const progress = Math.round(progressObj.percent);
        logger.info(`Update download progress: ${progress}%`);
        this.windowManager.sendToRenderer('update-progress', { progress });
      });

      autoUpdater.on('update-not-available', () => {
        logger.info('No updates available');
      });

      autoUpdater.on('error', (error) => {
        logger.error('Auto-updater error:', error);
      });

      // Check for updates every hour
      setInterval(
        () => {
          autoUpdater.checkForUpdatesAndNotify();
        },
        60 * 60 * 1000
      );
    } catch (error) {
      logger.error('Error setting up auto-updater:', error);
    }
  }

  private cleanup(): void {
    logger.info('Cleaning up application');

    try {
      // Destroy tray
      this.trayManager.destroy();

      // Remove all IPC listeners
      ipcMain.removeAllListeners('window-move-by');
      ipcMain.removeAllListeners('update-launcher');
      ipcMain.removeAllListeners('window-get-position');
      ipcMain.removeAllListeners('window-set-position');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

// Handle unhandled errors with detailed logging
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Name:', error.name);
  console.error('Message:', error.message);
  console.error('========================');

  logger.error('Uncaught exception:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Show error dialog in production
  if (app.isReady()) {
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Application Error',
      `An unexpected error occurred:\n\n${error.name}: ${error.message}\n\nStack: ${error.stack}`
    );
  }

  // Don't exit immediately in production, log and try to continue
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('===========================');

  logger.error('Unhandled rejection:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString(),
  });
});

// Initialize and start the launcher
const launcher = new VeilLauncher();
launcher.initialize().catch((error) => {
  logger.error('Failed to initialize launcher:', error);
  app.quit();
});
