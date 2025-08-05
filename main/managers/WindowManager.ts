import { BrowserWindow, screen, nativeTheme } from 'electron';
import path from 'path';
import { logger } from '../core/logger';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  public async createMainWindow(): Promise<BrowserWindow> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: Math.min(1200, width - 100),
      height: Math.min(800, height - 100),
      minWidth: 1000,
      minHeight: 700,
      show: true,
      frame: false,
      resizable: true,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f172a' : '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', '..', 'preload', 'index.js'),
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        devTools: process.env.NODE_ENV === 'development',
      },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:3000');
    } else {
      await this.mainWindow.loadFile(
        path.join(__dirname, '..', '..', 'renderer', 'index.html')
      );
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window events
    this.setupWindowEvents();

    logger.info('Main window created');
    return this.mainWindow;
  }

  private setupWindowEvents(): void {
    if (!this.mainWindow) return;

    // Handle window controls
    this.mainWindow.on('minimize', () => {
      logger.debug('Window minimized');
    });

    this.mainWindow.on('maximize', () => {
      logger.debug('Window maximized');
    });

    this.mainWindow.on('unmaximize', () => {
      logger.debug('Window unmaximized');
    });

    // Handle focus events
    this.mainWindow.on('focus', () => {
      this.sendToRenderer('window-focus');
    });

    this.mainWindow.on('blur', () => {
      this.sendToRenderer('window-blur');
    });

    // Handle resize events
    this.mainWindow.on('resize', () => {
      const [width, height] = this.mainWindow!.getSize();
      this.sendToRenderer('window-resize', { width, height });
    });
  }

  public sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public closeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  public minimizeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.minimize();
    }
  }

  public maximizeMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  public isMaximized(): boolean {
    return this.mainWindow?.isMaximized() || false;
  }
}
