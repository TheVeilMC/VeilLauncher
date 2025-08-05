import { BrowserWindow } from 'electron';
import path from 'path';
import { Manifest } from '../services/LaunchService';
import axios from 'axios';
import fs from 'fs-extra';
import { downloadFile } from '../utils/downloader';
import { SHA1 } from 'crypto-js';
import * as CryptoJS from 'crypto-js';
import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import {
  InstallSteps,
  UpdateSteps,
  VerificationSteps,
} from '../services/InstallService';

export class AssetsManager {
  private mainWindow: BrowserWindow;
  private instanceDir: string;
  private assetsPath: string;
  private downloading: string = '';

  constructor(instanceDir: string, mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.instanceDir = instanceDir;
    this.assetsPath = path.join(this.instanceDir, '.minecraft', 'assets');
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  public async installAssets(manifest: Manifest) {
    // Get version manifest
    const versionData = await this.getVersionData(manifest);
    const assetIndex = versionData.assetIndex;

    // Download and parse asset index
    const indexPath = path.join(
      this.assetsPath,
      'indexes',
      `${assetIndex.id}.json`
    );
    this.downloading = `${assetIndex.id}.json`;
    await fs.ensureDir(path.dirname(indexPath));
    await downloadFile(assetIndex.url, indexPath, {
      expectedChecksum: manifest.assets.checksum,
      onProgress: this.progress,
    });

    const assets = await fs.readJson(indexPath);

    // Download all assets
    await this.downloadAssets(
      assets.objects,
      async (
        downloadedCount: number,
        totalAssets: number,
        assetName: string
      ) => {
        this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
          status: 'assets_installing',
          message: `Downloaded ${assetName}`,
          progress: (downloadedCount / totalAssets) * 100,
          step: InstallSteps.INSTALLING_ASSETS,
          steps: InstallSteps.COUNT,
          finished: false,
        });
      }
    );

    return {
      assetIndex: assetIndex.id,
      assetsPath: this.assetsPath,
      totalAssets: Object.keys(assets.objects).length,
    };
  }

  private async progress(
    _downloaded: number,
    _total: number,
    percentage: number
  ) {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'assets_installing',
      message: `Downloading ${this.downloading}`,
      step: InstallSteps.INSTALLING_ASSETS,
      steps: InstallSteps.COUNT,
      progress: percentage,
      finished: false,
    });
  }

  private async downloadAssets(assetObjects: any, onProgress: Function) {
    const objectsPath = path.join(this.assetsPath, 'objects');
    const totalAssets = Object.keys(assetObjects).length;
    let downloadedCount = 0;

    // Download assets in parallel batches
    const assetEntries = Object.entries(assetObjects);
    const batchSize = 10;

    for (let i = 0; i < assetEntries.length; i += batchSize) {
      const batch = assetEntries.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ([assetName, assetData]: any[]) => {
          const hash = assetData.hash;
          const hashPrefix = hash.substring(0, 2);
          const assetPath = path.join(objectsPath, hashPrefix, hash);

          // Skip if asset already exists and is valid
          if (await this.verifyAsset(assetPath, hash, assetData.size)) {
            downloadedCount++;
            onProgress && onProgress(downloadedCount, totalAssets, assetName);
            return;
          }

          // Download asset
          const assetUrl = `https://resources.download.minecraft.net/${hashPrefix}/${hash}`;
          await fs.ensureDir(path.dirname(assetPath));
          await downloadFile(assetUrl, assetPath);

          downloadedCount++;
          onProgress && onProgress(downloadedCount, totalAssets, assetName);
        })
      );
    }
  }

  private async verifyAsset(
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

  private async getVersionData(manifest: Manifest) {
    const manifestResponse = await axios.get(manifest.assets.url);
    const versionInfo = manifestResponse.data.versions.find(
      (v: any) => v.id === manifest.mcVersion
    );

    if (!versionInfo) {
      throw new Error(`Version ${manifest.mcVersion} not found`);
    }

    const versionResponse = await axios.get(versionInfo.url);
    return versionResponse.data;
  }

  public async lightVerifyAssets(manifest: Manifest): Promise<boolean> {
    const versionData = await this.getVersionData(manifest);
    const assetIndex = versionData.assetIndex;

    // Verify asset index
    const assetIndexPath = path.join(
      this.assetsPath,
      'indexes',
      `${assetIndex.id}.json`
    );
    console.log(assetIndexPath);
    if (!(await fs.pathExists(assetIndexPath))) {
      return false;
    }

    return true;
  }

  public async hardVerifyAssets(manifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_assets',
      message: 'Verifying assets...',
      step: VerificationSteps.VERIFYING_ASSETS,
      steps: VerificationSteps.COUNT,
      finished: false,
    });

    const versionData = await this.getVersionData(manifest);
    const assetIndex = versionData.assetIndex;

    // Verify asset index
    const assetIndexPath = path.join(
      this.assetsPath,
      'indexes',
      `${assetIndex.id}.json`
    );
    if (!(await fs.pathExists(assetIndexPath))) {
      // Asset index not found, download it
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_assets',
        message: `Downloading missing asset index ${assetIndex.id}`,
        step: VerificationSteps.VERIFYING_ASSETS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      const indexPath = path.join(
        this.assetsPath,
        'indexes',
        `${assetIndex.id}.json`
      );
      this.downloading = `${assetIndex.id}.json`;
      await fs.ensureDir(path.dirname(indexPath));
      await downloadFile(assetIndex.url, indexPath, {
        expectedChecksum: manifest.assets.checksum,
      });
    }

    // Verify all assets
    const assets = await fs.readJson(assetIndexPath);
    for (const [assetName, assetData] of Object.entries(
      assets.objects
    ) as any) {
      const hash = assetData.hash;
      const hashPrefix = hash.substring(0, 2);
      const assetPath = path.join(this.assetsPath, 'objects', hashPrefix, hash);

      if (!(await this.verifyAsset(assetPath, hash, assetData.size))) {
        // Asset is missing or corrupted
        // Download the asset
        this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
          status: 'verifying_assets',
          message: `Downloading missing asset ${assetName}`,
          step: VerificationSteps.VERIFYING_ASSETS,
          steps: VerificationSteps.COUNT,
          finished: false,
        });
        const assetUrl = `https://resources.download.minecraft.net/${hashPrefix}/${hash}`;
        await fs.ensureDir(path.dirname(assetPath));
        await downloadFile(assetUrl, assetPath, {
          onProgress: (
            _downloaded: number,
            _total: number,
            percentage: number
          ) => {
            this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
              status: 'verifying_assets',
              message: `Downloading ${assetName}`,
              step: VerificationSteps.VERIFYING_ASSETS,
              steps: VerificationSteps.COUNT,
              progress: percentage,
              finished: false,
            });
          },
        });
      }
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_assets',
      message: 'All assets verified successfully',
      step: VerificationSteps.VERIFYING_ASSETS,
      steps: VerificationSteps.COUNT,
      finished: true,
    });
  }

  public async updateAssets(
    oldManifest: Manifest,
    newManifest: Manifest
  ): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'updating_assets',
      message: 'Updating assets...',
      step: UpdateSteps.UPDATING_ASSETS,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // First, verify the old assets
    await this.hardVerifyAssets(oldManifest);

    // Cleanup old assets
    const oldAssetsPath = path.join(
      this.assetsPath,
      'indexes',
      `${oldManifest.assets.index}.json`
    );
    if (await fs.pathExists(oldAssetsPath)) {
      await fs.remove(oldAssetsPath);
    }
    const oldObjectsPath = path.join(this.assetsPath, 'objects');
    if (await fs.pathExists(oldObjectsPath)) {
      await fs.remove(oldObjectsPath);
    }

    // Then, install the new assets
    await this.installAssets(newManifest);

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'updating_assets',
      message: 'Assets updated successfully',
      step: UpdateSteps.UPDATING_ASSETS,
      steps: UpdateSteps.COUNT,
      finished: true,
    });
  }
}
