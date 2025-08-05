import { ipcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../core/logger';
import { InstanceManager } from '../managers/InstanceManager';
import { PROFILE_MANIFEST } from '../mocks/mock';
import {
  InstallManager,
  UpdateSteps,
  VerificationSteps,
} from './InstallService';
import { LaunchArgumentsBuilder, UserProfile } from '../utils/arguments';

/**
 * LaunchManager handles the launching and management of game instances.
 * It communicates with the renderer process via IPC and manages game processes.
 */

export interface Manifest {
  profileId: string;
  name: string;
  version: string;
  mcVersion: string;
  fabricVersion: string;
  mods: Record<
    string,
    {
      fileName: string;
      version: string;
      required: boolean;
      checksum: string;
      downloadUrl: string;
    }
  >;
  clientSettings: {
    [key: string]: any;
  };
  lastPlayed?: string;
  totalPlaytime?: number;
  serverInfo?: {
    address: string;
    port: number;
    autoConnect: boolean;
  };
  loader: {
    url: string;
    version: string;
    checksum: string;
  };
  assets: {
    url: string;
    checksum: string;
    index: string;
  };
  client: {
    checksum: string;
  };
  libraries: Record<
    string,
    {
      sha1: string;
      size: number;
    }
  >;
  directories?: string[];
}

export interface ProcessMemoryInfo {
  allocatedMemory: number; // Memory allocated to JVM (from -Xmx)
  usedMemory: number; // Currently used memory by the process
  percentageUsed: number; // Percentage of allocated memory being used
  timestamp: number;
}

export class LaunchService {
  private mainWindow: BrowserWindow | null = null;
  private instanceManager: InstanceManager | null = null;
  private installManager: InstallManager | null = null;
  private runningProcess: ChildProcess | null = null;
  private memoryMonitoringInterval: NodeJS.Timeout | null = null;
  private allocatedMemory: number = 0; // Store allocated memory from manifest

  public initialize(
    mainWindow: BrowserWindow,
    instanceManager: InstanceManager
  ): void {
    this.mainWindow = mainWindow;
    this.instanceManager = instanceManager;
    this.installManager = new InstallManager(instanceManager, mainWindow);
    ipcMain.handle('launch-game', this.startGame.bind(this));
    ipcMain.handle('stop-game', this.stopGame.bind(this));
    ipcMain.handle('get-launch-status', this.isMinecraftRunning.bind(this));
    ipcMain.handle('get-game-logs', this.getLogs.bind(this));
    ipcMain.handle('hard-verify', this.hardVerify.bind(this));
    ipcMain.handle('check-updates', this.checkForUpdates.bind(this));
    ipcMain.handle('update-instance', this.update.bind(this));
    ipcMain.handle('get-process-memory', this.getProcessMemory.bind(this));
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private async update(): Promise<void> {
    if (!this.instanceManager) {
      throw new Error('InstanceManager is not initialized');
    }
    // Fetch the manifest from the server or local storage
    const manifest: Manifest = PROFILE_MANIFEST; // Replace with actual fetch logic
    if (!manifest) {
      throw new Error('Failed to fetch profile manifest');
    }
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'updating',
      message: 'Checking for updates...',
      step: 0,
      steps: UpdateSteps.COUNT,
      finished: false,
    });
    await this.installManager?.updateInstance(manifest);
    await this.installManager?.lightVerifyInstance(manifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'updated',
      message: 'Update finished',
      finished: true,
    });
  }

  private async checkForUpdates(): Promise<{
    update: boolean;
    oldVersion?: string;
    newVersion?: string;
  }> {
    if (!this.instanceManager) {
      throw new Error('InstanceManager is not initialized');
    }

    // Fetch the manifest from the server or local storage
    const manifest: Manifest = PROFILE_MANIFEST; // Replace with actual fetch logic

    // Ensure instance path exists
    const instancePathExists =
      await this.instanceManager.checkInstancePathExists(manifest.profileId);
    if (!instancePathExists) {
      return { update: false };
    }

    const currentManifest: Manifest | null =
      await this.instanceManager.getInstanceConfig(manifest.profileId);
    if (!currentManifest) {
      throw new Error(
        `Instance directory not found for profile ID: ${manifest.profileId}`
      );
    }

    // Compare versions
    if (
      currentManifest.version !== manifest.version ||
      currentManifest.mcVersion !== manifest.mcVersion ||
      currentManifest.fabricVersion !== manifest.fabricVersion
    ) {
      return {
        update: true,
        oldVersion: currentManifest.version,
        newVersion: manifest.version,
      };
    }
    if (
      currentManifest.loader.version !== manifest.loader.version ||
      currentManifest.loader.checksum !== manifest.loader.checksum
    ) {
      return {
        update: true,
        oldVersion: currentManifest.loader.version,
        newVersion: manifest.loader.version,
      };
    }
    if (
      currentManifest.assets.checksum !== manifest.assets.checksum ||
      currentManifest.assets.index !== manifest.assets.index
    ) {
      return {
        update: true,
        oldVersion: currentManifest.assets.checksum,
        newVersion: manifest.assets.checksum,
      };
    }
    if (
      currentManifest.client.checksum !== manifest.client.checksum ||
      currentManifest.clientSettings.allocatedMemory !==
        manifest.clientSettings.allocatedMemory
    ) {
      return {
        update: true,
        oldVersion: currentManifest.client.checksum,
        newVersion: manifest.client.checksum,
      };
    }
    if (
      JSON.stringify(currentManifest.mods) !== JSON.stringify(manifest.mods) ||
      JSON.stringify(currentManifest.libraries) !==
        JSON.stringify(manifest.libraries)
    ) {
      return {
        update: true,
        oldVersion: currentManifest.version,
        newVersion: manifest.version,
      };
    }

    return { update: false };
  }

  private async hardVerify() {
    if (!this.instanceManager) {
      throw new Error('InstanceManager is not initialized');
    }
    if (!this.installManager) {
      throw new Error('InstallManager is not initialized');
    }

    // Fetch the manifest from the server or local storage
    const manifest: Manifest = PROFILE_MANIFEST; // Replace with actual fetch logic
    if (!manifest) {
      throw new Error('Failed to fetch profile manifest');
    }
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying',
      message: 'Verifying game files...',
      step: 0,
      steps: VerificationSteps.COUNT,
      finished: false,
    });

    await this.installManager.hardVerifyInstance(manifest);

    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verified',
      message: 'Verification finished',
      finished: true,
    });
  }

  private async checkBeforeLaunch(manifest: Manifest): Promise<void> {
    if (!this.instanceManager) {
      throw new Error('InstanceManager is not initialized');
    }
    // Ensure instance path exists
    const instancePathExists =
      await this.instanceManager.checkInstancePathExists(manifest.profileId);
    if (!instancePathExists) {
      // If the instance path does not exist, install
      await this.installManager?.cleanInstallInstance(manifest);
    } else {
      const updateRes = await this.checkForUpdates();
      if (updateRes.update) {
        // If an update is available, perform a hard verify
        await this.installManager?.updateInstance(manifest);
      }
      await this.installManager?.lightVerifyInstance(manifest);
    }
  }

  private startMemoryMonitoring(manifest: Manifest): void {
    // Clear any existing monitoring
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
    }

    // Start monitoring every 5 seconds
    this.memoryMonitoringInterval = setInterval(async () => {
      if (this.runningProcess && !this.runningProcess.killed) {
        try {
          const memoryInfo = await this.getProcessMemoryInfo();
          if (memoryInfo) {
            this.sendToRenderer(WEBSOCKET_EVENTS.PROCESS_MEMORY_UPDATE, {
              profileId: manifest.profileId,
              ...memoryInfo,
            });
          }
        } catch (error) {
          console.error('Error monitoring memory:', error);
        }
      }
    }, 5000); // Update every 5 seconds
  }

  private stopMemoryMonitoring(): void {
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
      this.memoryMonitoringInterval = null;
    }
  }

  private async getProcessMemoryInfo(): Promise<ProcessMemoryInfo | null> {
    if (!this.runningProcess || !this.runningProcess.pid) {
      return null;
    }

    try {
      // Use process.memoryUsage() for the current Node.js process memory
      // For external process memory, we need to use platform-specific commands
      const pid = this.runningProcess.pid;

      // Get memory usage using platform-specific command
      let usedMemoryMB = 0;

      if (process.platform === 'win32') {
        // Windows: Use tasklist command
        const { spawn } = require('child_process');
        const tasklist = spawn('tasklist', [
          '/FI',
          `PID eq ${pid}`,
          '/FO',
          'CSV',
        ]);

        return new Promise((resolve) => {
          let output = '';
          tasklist.stdout.on('data', (data: Buffer) => {
            output += data.toString();
          });

          tasklist.on('close', () => {
            try {
              const lines = output.split('\n');
              if (lines.length > 1) {
                const memoryStr = lines[1].split(',')[4]; // Memory column
                usedMemoryMB =
                  parseInt(memoryStr.replace(/[",]/g, '').replace(' K', '')) /
                  1024;
              }

              const percentageUsed =
                this.allocatedMemory > 0
                  ? (usedMemoryMB / this.allocatedMemory) * 100
                  : 0;

              resolve({
                allocatedMemory: this.allocatedMemory,
                usedMemory: Math.round(usedMemoryMB),
                percentageUsed: Math.round(percentageUsed * 100) / 100,
                timestamp: Date.now(),
              });
            } catch (error) {
              resolve(null);
            }
          });
        });
      } else {
        // Linux/macOS: Use ps command
        const { exec } = require('child_process');

        return new Promise((resolve) => {
          exec(`ps -p ${pid} -o rss=`, (error: any, stdout: string) => {
            if (error) {
              resolve(null);
              return;
            }

            try {
              usedMemoryMB = parseInt(stdout.trim()) / 1024; // Convert KB to MB
              const percentageUsed =
                this.allocatedMemory > 0
                  ? (usedMemoryMB / this.allocatedMemory) * 100
                  : 0;

              resolve({
                allocatedMemory: this.allocatedMemory,
                usedMemory: Math.round(usedMemoryMB),
                percentageUsed: Math.round(percentageUsed * 100) / 100,
                timestamp: Date.now(),
              });
            } catch (parseError) {
              resolve(null);
            }
          });
        });
      }
    } catch (error) {
      console.error('Error getting process memory info:', error);
      return null;
    }
  }

  private async getProcessMemory(
    _event: Electron.IpcMainInvokeEvent
  ): Promise<ProcessMemoryInfo | null> {
    return await this.getProcessMemoryInfo();
  }

  private async startGame(
    _event: Electron.IpcMainInvokeEvent,
    { account }: { account: UserProfile }
  ): Promise<any> {
    try {
      if (!account) {
        throw new Error('No active account found');
      }

      if (!this.instanceManager) {
        throw new Error('InstanceManager is not initialized');
      }

      // Fetch manifest from server
      // TODO: Implement server fetch logic
      const manifest: Manifest = PROFILE_MANIFEST;
      if (!manifest) {
        throw new Error('Failed to fetch profile manifest');
      }

      // Store allocated memory from manifest
      this.allocatedMemory = manifest.clientSettings.allocatedMemory || 2048; // Default to 2GB if not specified

      await this.checkBeforeLaunch(manifest);

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'preparing_launch',
        message: 'Preparing to launch Minecraft...',
        finished: false,
      });

      // Get instance directory
      const instanceDir = this.instanceManager.getInstanceDirectory(
        manifest.profileId
      );
      if (!instanceDir) {
        throw new Error(
          `Instance directory not found for profile: ${manifest.profileId}`
        );
      }

      // Build launch arguments
      const argsBuilder = new LaunchArgumentsBuilder(instanceDir, manifest);
      const launchArgs = await argsBuilder.buildLaunchArguments(account);

      // Build final command arguments
      const commandArgs = [
        ...launchArgs.jvmArgs,
        launchArgs.mainClass,
        ...launchArgs.gameArgs,
      ];

      console.log(commandArgs);

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'launching',
        message: 'Starting Minecraft...',
        finished: false,
      });

      // Launch the process
      const minecraftProcess = spawn(launchArgs.javaPath, commandArgs, {
        cwd: launchArgs.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      // Store the process
      this.runningProcess = minecraftProcess;

      // Handle process events
      this.setupProcessHandlers(minecraftProcess, manifest);

      // Start memory monitoring
      this.startMemoryMonitoring(manifest);

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'launched',
        message: 'Minecraft launched successfully!',
        finished: true,
      });

      // Send initial memory info
      setTimeout(async () => {
        const memoryInfo = await this.getProcessMemoryInfo();
        if (memoryInfo) {
          this.sendToRenderer(WEBSOCKET_EVENTS.PROCESS_MEMORY_UPDATE, {
            profileId: manifest.profileId,
            ...memoryInfo,
          });
        }
      }, 2000); // Wait 2 seconds after launch to get initial memory reading

      return {
        success: true,
        data: {
          instanceId: manifest.profileId,
          processId: this.runningProcess.pid,
          status: 'running',
          allocatedMemory: this.allocatedMemory,
        },
        message: 'Game launched successfully',
      };
    } catch (error: any) {
      logger.error('Failed to launch game:', error);

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'error',
        message: `Launch failed: ${error.message}`,
        progress: 0,
      });

      throw error;
    }
  }

  private setupProcessHandlers(
    process: ChildProcess,
    manifest: Manifest
  ): void {
    // Handle stdout
    process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log('Minecraft stdout:', output);

      this.sendToRenderer(WEBSOCKET_EVENTS.MINECRAFT_OUTPUT, {
        type: 'stdout',
        data: output,
        profileId: manifest.profileId,
      });
    });

    // Handle stderr
    process.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      console.error('Minecraft stderr:', error);

      this.sendToRenderer(WEBSOCKET_EVENTS.MINECRAFT_OUTPUT, {
        type: 'stderr',
        data: error,
        profileId: manifest.profileId,
      });
    });

    // Handle process exit
    process.on('close', (code: number | null, signal: string | null) => {
      console.log(
        `Minecraft process closed with code ${code}, signal ${signal}`
      );

      this.runningProcess = null;
      this.stopMemoryMonitoring(); // Stop memory monitoring when process closes

      this.sendToRenderer(WEBSOCKET_EVENTS.MINECRAFT_CLOSED, {
        profileId: manifest.profileId,
        exitCode: code,
        signal: signal,
      });

      // Clean up natives directory
      // this.cleanupNatives(manifest.profileId);
    });

    // Handle process errors
    process.on('error', (error: Error) => {
      console.error('Minecraft process error:', error);

      this.stopMemoryMonitoring(); // Stop memory monitoring on error

      this.sendToRenderer(WEBSOCKET_EVENTS.MINECRAFT_ERROR, {
        profileId: manifest.profileId,
        error: error.message,
      });

      this.runningProcess = null;
    });
  }

  private async stopGame(_event: Electron.IpcMainInvokeEvent): Promise<any> {
    const process = this.runningProcess;
    if (process) {
      try {
        // Stop memory monitoring
        this.stopMemoryMonitoring();

        // Try graceful shutdown first
        process.kill('SIGTERM');

        // Wait a bit, then force kill if still running
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 5000);

        this.runningProcess = null;
        return true;
      } catch (error) {
        console.error('Failed to kill Minecraft process:', error);
        return false;
      }
    }
    return false;
  }

  public isMinecraftRunning(): boolean {
    const process = this.runningProcess;
    return process ? !process.killed : false;
  }

  public getProcessOutput(): NodeJS.ReadableStream | null {
    const process = this.runningProcess;
    return process?.stdout || null;
  }

  private async getLogs(
    _event: Electron.IpcMainInvokeEvent,
    { instanceId, gameDirectory }: { instanceId: string; gameDirectory: string }
  ): Promise<any> {
    const logPath = path.join(gameDirectory, 'logs', `${instanceId}.log`);
    let logs = '';
    try {
      logs = await fs.readFile(logPath, 'utf-8');
    } catch (error) {
      logs = 'No logs available';
    }

    return {
      logs,
      instanceId,
      logPath,
    };
  }
}
