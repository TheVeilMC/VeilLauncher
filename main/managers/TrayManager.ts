import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import path from 'path';
import { logger } from '../core/logger';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;

  public create(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;

    try {
      // Create tray icon
      const iconPath = this.getTrayIconPath();
      const trayIcon = nativeImage.createFromPath(iconPath);

      // Resize icon for tray
      const resizedIcon = trayIcon.resize({ width: 16, height: 16 });

      this.tray = new Tray(resizedIcon);
      this.tray.setToolTip('The Veil Launcher');

      // Create context menu
      this.updateContextMenu();

      // Handle tray click events
      this.setupEventHandlers();

      logger.info('System tray created successfully');
    } catch (error) {
      logger.error('Failed to create system tray:', error);
    }
  }

  private getTrayIconPath(): string {
    const platform = process.platform;
    console.log(__dirname);
    if (platform === 'win32') {
      return 'https://cdn.discordapp.com/attachments/1371547401470349323/1398751909489147976/logo-win.png?ex=688680ba&is=68852f3a&hm=8dbdf923cd09275cce68438461876a586eca523af405194320ee856b986c8651&';
    } else if (platform === 'darwin') {
      return 'https://cdn.discordapp.com/attachments/1371547401470349323/1398751909489147976/logo-win.png?ex=688680ba&is=68852f3a&hm=8dbdf923cd09275cce68438461876a586eca523af405194320ee856b986c8651&';
    } else {
      return 'https://cdn.discordapp.com/attachments/1371547401470349323/1398751909489147976/logo-win.png?ex=688680ba&is=68852f3a&hm=8dbdf923cd09275cce68438461876a586eca523af405194320ee856b986c8651&';
    }
  }

  private updateContextMenu(): void {
    if (!this.tray || !this.mainWindow) return;

    const isVisible = this.mainWindow.isVisible();
    const isGameRunning = false; // This would be updated from game state

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'The Veil Launcher',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: isVisible ? 'Hide Launcher' : 'Show Launcher',
        click: () => this.toggleWindow(),
      },
      {
        label: 'Launch The Veil',
        enabled: !isGameRunning,
        click: () => this.launchGame(),
      },
      {
        label: 'Stop Game',
        enabled: isGameRunning,
        click: () => this.stopGame(),
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => this.openSettings(),
      },
      {
        label: 'Check for Updates',
        click: () => this.checkForUpdates(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => this.quitApplication(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupEventHandlers(): void {
    if (!this.tray || !this.mainWindow) return;

    // Handle tray icon click
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    // Handle double click
    this.tray.on('double-click', () => {
      this.showWindow();
    });

    // Update context menu when window visibility changes
    this.mainWindow.on('show', () => {
      this.updateContextMenu();
    });

    this.mainWindow.on('hide', () => {
      this.updateContextMenu();
    });
  }

  private toggleWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  private showWindow(): void {
    if (!this.mainWindow) return;

    this.mainWindow.show();
    this.mainWindow.focus();

    // On Windows, bring to front
    if (process.platform === 'win32') {
      this.mainWindow.setAlwaysOnTop(true);
      this.mainWindow.setAlwaysOnTop(false);
    }
  }

  private launchGame(): void {
    if (!this.mainWindow) return;

    // Send IPC message to renderer to launch game
    this.mainWindow.webContents.send('tray-launch-game');
    this.showWindow();
  }

  private stopGame(): void {
    if (!this.mainWindow) return;

    // Send IPC message to renderer to stop game
    this.mainWindow.webContents.send('tray-stop-game');
  }

  private openSettings(): void {
    if (!this.mainWindow) return;

    // Send IPC message to renderer to open settings
    this.mainWindow.webContents.send('tray-open-settings');
    this.showWindow();
  }

  private checkForUpdates(): void {
    if (!this.mainWindow) return;

    // Send IPC message to renderer to check for updates
    this.mainWindow.webContents.send('tray-check-updates');
  }

  private quitApplication(): void {
    app.quit();
  }

  public updateGameStatus(isRunning: boolean): void {
    // Update the context menu based on game status
    this.updateContextMenu();

    // Update tray icon if needed
    if (isRunning) {
      this.tray?.setToolTip('The Veil Launcher - Game Running');
    } else {
      this.tray?.setToolTip('The Veil Launcher');
    }
  }

  public showNotification(title: string, body: string): void {
    if (!this.tray) return;

    this.tray.displayBalloon({
      title,
      content: body,
      icon: nativeImage.createFromPath(this.getTrayIconPath()),
    });
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      logger.info('System tray destroyed');
    }
  }
}
