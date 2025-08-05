import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import { downloadFile } from '../utils/downloader';
import { Manifest } from '../services/LaunchService';
import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import { SHA1 } from 'crypto-js';
import * as CryptoJS from 'crypto-js';
import {
  InstallSteps,
  UpdateSteps,
  VerificationSteps,
} from '../services/InstallService';

interface ClientDownload {
  sha1: string;
  size: number;
  url: string;
}

interface VersionManifest {
  downloads: {
    client: ClientDownload;
    client_mappings?: ClientDownload;
    server?: ClientDownload;
    server_mappings?: ClientDownload;
  };
  id: string;
  mainClass: string;
  minecraftArguments?: string;
  arguments?: {
    game: Array<string | { rules: any[]; value: string | string[] }>;
    jvm: Array<string | { rules: any[]; value: string | string[] }>;
  };
  assets: string;
  complianceLevel: number;
  libraries: any[];
  logging?: any;
  releaseTime: string;
  time: string;
  type: string;
}

export class ClientManager {
  private mainWindow: BrowserWindow;
  private instanceDir: string;
  private versionsPath: string;

  constructor(instanceDir: string, mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.instanceDir = instanceDir;
    this.versionsPath = path.join(this.instanceDir, '.minecraft', 'versions');
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  public async installClient(
    manifest: Manifest,
    type: 'install' | 'verify'
  ): Promise<{
    clientPath: string;
    versionData: VersionManifest;
    versionDir: string;
  }> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: type === 'install' ? 'client_downloading' : 'verifying_client',
      message: 'Downloading Minecraft client...',
      step:
        type === 'install'
          ? InstallSteps.INSTALLING_CLIENT
          : VerificationSteps.VERIFYING_CLIENT,
      steps: type === 'install' ? InstallSteps.COUNT : VerificationSteps.COUNT,
      finished: false,
    });

    // Get version data
    const versionData = await this.getVersionData(manifest);

    // Create version directory
    const versionDir = path.join(this.versionsPath, manifest.mcVersion);
    await fs.ensureDir(versionDir);

    // Download client JAR
    const clientPath = path.join(versionDir, `${manifest.mcVersion}.jar`);
    const clientDownload = versionData.downloads.client;

    // Check if client already exists and is valid
    if (
      !(await this.verifyClient(
        clientPath,
        manifest.client.checksum,
        clientDownload.size
      ))
    ) {
      await downloadFile(clientDownload.url, clientPath, {
        expectedChecksum: manifest.client.checksum,
        expectedSize: clientDownload.size,
        onProgress: this.createProgressCallback('Minecraft client', type),
      });
    }

    // Save version JSON
    const versionJsonPath = path.join(versionDir, `${manifest.mcVersion}.json`);
    await fs.writeJson(versionJsonPath, versionData, { spaces: 2 });

    // Check for Fabric modifications
    const fabricVersionDir = await this.handleFabricVersion(
      manifest,
      versionData
    );

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: type === 'install' ? 'client_downloading' : 'verifying_client',
      message: 'Minecraft client downloaded successfully',
      step:
        type === 'install'
          ? InstallSteps.INSTALLING_CLIENT
          : VerificationSteps.VERIFYING_CLIENT,
      steps: type === 'install' ? InstallSteps.COUNT : VerificationSteps.COUNT,
      finished: false,
    });

    return {
      clientPath,
      versionData,
      versionDir: fabricVersionDir || versionDir,
    };
  }

  private async handleFabricVersion(
    manifest: Manifest,
    vanillaVersionData: VersionManifest
  ): Promise<string | null> {
    // Look for Fabric loader version JSON
    const fabricVersionId = `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`;
    const fabricVersionDir = path.join(this.versionsPath, fabricVersionId);
    const fabricVersionJson = path.join(
      fabricVersionDir,
      `${fabricVersionId}.json`
    );

    if (await fs.pathExists(fabricVersionJson)) {
      try {
        const fabricVersionData = await fs.readJson(fabricVersionJson);

        // Update the fabric version data with any missing information from vanilla
        const updatedFabricData = {
          ...fabricVersionData,
          assets: fabricVersionData.assets || vanillaVersionData.assets,
          downloads:
            fabricVersionData.downloads || vanillaVersionData.downloads,
        };

        // Save updated version data
        await fs.writeJson(fabricVersionJson, updatedFabricData, { spaces: 2 });

        return fabricVersionDir;
      } catch (error) {
        console.warn('Failed to read Fabric version data:', error);
      }
    }

    return null;
  }

  private createProgressCallback(
    downloadName: string,
    type: 'install' | 'verify'
  ) {
    return async (_downloaded: number, _total: number, percentage: number) => {
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: type === 'install' ? 'client_downloading' : 'verifying_client',
        message: `Downloading ${downloadName}`,
        step:
          type === 'install'
            ? InstallSteps.INSTALLING_CLIENT
            : VerificationSteps.VERIFYING_CLIENT,
        steps:
          type === 'install' ? InstallSteps.COUNT : VerificationSteps.COUNT,
        progress: percentage,
        finished: false,
      });
    };
  }

  private async verifyClient(
    filePath: string,
    expectedHash: string,
    expectedSize: number
  ): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size !== expectedSize) return false;

      const fileBuffer = await fs.readFile(filePath);

      // Convert Buffer to WordArray and hash
      const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
      const actualHash = SHA1(wordArray).toString();

      return actualHash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  public async getClientPath(manifest: Manifest): Promise<string> {
    const versionDir = path.join(this.versionsPath, manifest.mcVersion);
    return path.join(versionDir, `${manifest.mcVersion}.jar`);
  }

  public async getVersionData(manifest: Manifest): Promise<VersionManifest> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'fetching_version_data',
      message: 'Fetching version information...',
      step: InstallSteps.INSTALLING_CLIENT,

      steps: InstallSteps.COUNT,
      finished: false,
    });

    const fabricVersionId = `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`;
    const fabricVersionDir = path.join(this.versionsPath, fabricVersionId);
    const fabricVersionJson = path.join(
      fabricVersionDir,
      `${fabricVersionId}.json`
    );

    // Try to load Fabric version data first
    if (await fs.pathExists(fabricVersionJson)) {
      try {
        const fabricData = await fs.readJson(fabricVersionJson);

        // Fabric version data inherits from vanilla, so we need to merge them
        if (fabricData.inheritsFrom) {
          const vanillaData = await this.getVanillaVersionData(
            fabricData.inheritsFrom
          );

          // Merge the data - Fabric properties override vanilla ones
          const mergedData = {
            ...vanillaData,
            ...fabricData,
            // Combine libraries (vanilla first, then fabric)
            libraries: [
              ...(vanillaData.libraries || []),
              ...(fabricData.libraries || []),
            ],
            // Merge arguments
            arguments: {
              game: [
                ...(vanillaData.arguments?.game || []),
                ...(fabricData.arguments?.game || []),
              ],
              jvm: [
                ...(vanillaData.arguments?.jvm || []),
                ...(fabricData.arguments?.jvm || []),
              ],
            },
          };
          return mergedData;
        }

        return fabricData;
      } catch (error) {
        console.warn(
          'Failed to read Fabric version data, falling back to vanilla:',
          error
        );
        throw new Error(
          `Failed to read Fabric version data for ${fabricVersionId}`
        );
      }
    } else {
      return await this.getVanillaVersionData(manifest.mcVersion);
    }
  }

  private async getVanillaVersionData(
    version: string
  ): Promise<VersionManifest> {
    // If no local version data exists, fetch from remote
    const manifestResponse = await axios.get(
      'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'
    );
    const versionInfo = manifestResponse.data.versions.find(
      (v: any) => v.id === version
    );

    if (!versionInfo) {
      throw new Error(`Version ${version} not found in version manifest`);
    }

    const versionResponse = await axios.get(versionInfo.url);
    return versionResponse.data as VersionManifest;
  }

  public async getFabricVersionPath(
    manifest: Manifest
  ): Promise<string | null> {
    const fabricVersionId = `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`;
    const fabricVersionDir = path.join(this.versionsPath, fabricVersionId);
    const fabricVersionJson = path.join(
      fabricVersionDir,
      `${fabricVersionId}.json`
    );

    if (await fs.pathExists(fabricVersionJson)) {
      return fabricVersionDir;
    }

    return null;
  }

  public getVersionsPath(): string {
    return this.versionsPath;
  }

  public async cleanupOldVersions(keepVersions: string[] = []): Promise<void> {
    try {
      const versionDirs = await fs.readdir(this.versionsPath);

      for (const versionDir of versionDirs) {
        if (!keepVersions.includes(versionDir)) {
          const fullPath = path.join(this.versionsPath, versionDir);
          const stats = await fs.stat(fullPath);

          if (stats.isDirectory()) {
            // Check if it's an old version (older than 30 days)
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            if (stats.mtime.getTime() < thirtyDaysAgo) {
              await fs.remove(fullPath);
              console.log(`Cleaned up old version: ${versionDir}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old versions:', error);
    }
  }

  public async lightVerifyClient(manifest: Manifest): Promise<boolean> {
    const clientPath = await this.getClientPath(manifest);
    if (!(await fs.pathExists(clientPath))) {
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'client_not_found',
        message: 'Minecraft client not found',
        step: InstallSteps.INSTALLING_CLIENT,
        steps: InstallSteps.COUNT,
        finished: false,
      });
      return false;
    }
    return true;
  }

  public async hardVerifyClient(manifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_client',
      message: 'Verifying Minecraft client...',
      step: VerificationSteps.VERIFYING_CLIENT,
      steps: VerificationSteps.COUNT,
      finished: false,
    });

    const clientPath = await this.getClientPath(manifest);
    const clientDownload = await this.getVersionData(manifest);
    if (
      !(await this.verifyClient(
        clientPath,
        manifest.client.checksum,
        clientDownload.downloads.client.size
      ))
    ) {
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_client',
        message: 'Minecraft client verification failed',
        step: VerificationSteps.VERIFYING_CLIENT,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      // Attempt to re-download the client
      await this.installClient(manifest, 'verify');
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_client',
        message: 'Minecraft client reinstalled successfully',
        step: VerificationSteps.VERIFYING_CLIENT,
        steps: VerificationSteps.COUNT,
        finished: true,
      });
    }
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_client',
      message: 'Minecraft client verified successfully',
      step: VerificationSteps.VERIFYING_CLIENT,
      steps: VerificationSteps.COUNT,
      finished: true,
    });
  }

  public async updateClient(
    oldManifest: Manifest,
    newManifest: Manifest
  ): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'updating_client',
      message: 'Updating Minecraft client...',
      step: UpdateSteps.UPDATING_CLIENT,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // First, verify the old client
    await this.hardVerifyClient(oldManifest);

    // Then, install the new client
    await this.installClient(newManifest, 'install');

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'updating_client',
      message: 'Minecraft client updated successfully',
      step: UpdateSteps.UPDATING_CLIENT,
      steps: UpdateSteps.COUNT,
      finished: true,
    });
  }
}
