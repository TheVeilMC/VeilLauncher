import path from 'path';
import { InstanceManager } from './InstanceManager';
import { Manifest } from '../services/LaunchService';
import fs from 'fs-extra';
import { downloadFile } from '../utils/downloader';
import { findJava } from '../services/JavaService';
import { BrowserWindow } from 'electron';
import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import {
  InstallSteps,
  UpdateSteps,
  VerificationSteps,
} from '../services/InstallService';

export class FabricManager {
  private instanceManager: InstanceManager;
  private mainWindow: BrowserWindow;

  constructor(instanceManager: InstanceManager, mainWindow: BrowserWindow) {
    this.instanceManager = instanceManager;
    this.mainWindow = mainWindow;
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  public async installFabric(manifest: Manifest): Promise<void> {
    // Check if instance path exists
    const instancePathExists =
      await this.instanceManager.checkInstancePathExists(manifest.profileId);
    if (!instancePathExists) {
      await this.instanceManager.createInstanceDirectory(
        manifest.profileId,
        manifest
      );
    }

    // Install Fabric Loader
    const fabricLoader = await this.installFabricLoader(manifest, 'install');
    if (!fabricLoader) {
      throw new Error(
        `Failed to install Fabric Loader for profile ${manifest.profileId}`
      );
    }
  }

  private async installFabricLoader(
    manifest: Manifest,
    action: 'install' | 'verify' | 'update'
  ): Promise<string> {
    const instanceDir = this.instanceManager.getInstanceDirectory(
      manifest.profileId
    );
    if (!instanceDir) {
      throw new Error(
        `Instance directory not found for profile ID: ${manifest.profileId}`
      );
    }

    const installerUrl = manifest.loader.url;
    const installerPath = path.join(instanceDir, 'fabric-installer.jar');

    await downloadFile(installerUrl, installerPath, {
      expectedChecksum: manifest.loader.checksum,
    });

    // Run the installer programmatically
    const { spawn } = require('child_process');
    const javaData = await findJava();
    if (!javaData) {
      throw new Error('Java not found');
    }
    const javaPath = javaData.path;

    return new Promise((resolve, reject) => {
      const installer = spawn(javaPath, [
        '-jar',
        installerPath,
        'client',
        '-mcversion',
        manifest.mcVersion,
        '-loader',
        manifest.fabricVersion,
        '-dir',
        path.join(instanceDir, '.minecraft'),
        '-noprofile', // Don't create launcher profile
      ]);

      installer.stdout.on('data', (data: any) => {
        this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
          status:
            action === 'install'
              ? 'fabric_installing'
              : action === 'update'
                ? 'updating_fabric'
                : 'verifying_fabric',
          message: data.toString(),
          step:
            action === 'install'
              ? InstallSteps.INSTALLING_FABRIC
              : action === 'update'
                ? UpdateSteps.UPDATING_FABRIC
                : VerificationSteps.VERIFYING_FABRIC,
          steps:
            action === 'install'
              ? InstallSteps.COUNT
              : action === 'update'
                ? UpdateSteps.COUNT
                : VerificationSteps.COUNT,
          progress: 0,
          finished: false,
        });
      });

      installer.stderr.on('data', (data: any) => {
        this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
          status:
            action === 'install'
              ? 'fabric_installing'
              : action === 'update'
                ? 'updating_fabric'
                : 'verifying_fabric',
          message: data.toString(),
          step:
            action === 'install'
              ? InstallSteps.INSTALLING_FABRIC
              : action === 'update'
                ? UpdateSteps.UPDATING_FABRIC
                : VerificationSteps.VERIFYING_FABRIC,
          steps:
            action === 'install'
              ? InstallSteps.COUNT
              : action === 'update'
                ? UpdateSteps.COUNT
                : VerificationSteps.COUNT,
          finished: false,
        });
      });

      installer.on('close', (code: any) => {
        if (code === 0) {
          console.log('Fabric installed successfully');
          // Clean up installer
          fs.unlink(installerPath).catch(() => {});
          resolve(
            `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`
          );
        } else {
          reject(new Error(`Fabric installer failed with code ${code}`));
        }
      });
    });
  }

  public async lightVerifyFabric(manifest: Manifest): Promise<boolean> {
    const instanceDir = this.instanceManager.getInstanceDirectory(
      manifest.profileId
    );
    if (!instanceDir) {
      console.error(
        `Instance directory not found for profile ID: ${manifest.profileId}`
      );
      return false;
    }
    const fabricLoaderPath = path.join(
      instanceDir,
      '.minecraft',
      'versions',
      `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`
      // `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}.jar`
    );

    if (!(await fs.pathExists(fabricLoaderPath))) {
      console.error(`Fabric loader not found at: ${fabricLoaderPath}`);
      return false;
    }

    // Verify that only one fabric loader version exists in libraries
    const librariesPath = path.join(
      instanceDir,
      '.minecraft',
      'libraries',
      'net/fabricmc/fabric-loader/'
    );
    const files = await fs.readdir(librariesPath);
    const fabricLoaderFiles = files.filter((dir) => dir.includes(`.`));

    return (
      fabricLoaderFiles.length === 1 &&
      fabricLoaderFiles[0] === `${manifest.fabricVersion}`
    );
  }

  public async hardVerifyFabric(manifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_fabric',
      message: 'Verifying Fabric Loader...',
      step: VerificationSteps.VERIFYING_FABRIC,
      steps: VerificationSteps.COUNT,
      finished: false,
    });

    const instanceDir = this.instanceManager.getInstanceDirectory(
      manifest.profileId
    );
    if (!instanceDir) {
      throw new Error(
        `Instance directory not found for profile ID: ${manifest.profileId}`
      );
    }

    const fabricLoaderPath = path.join(
      instanceDir,
      '.minecraft',
      'versions',
      `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`
    );

    if (!(await fs.pathExists(fabricLoaderPath))) {
      // if the fabric loader is not found, install it
      await this.installFabricLoader(manifest, 'verify');
    }

    // Verify that only one fabric loader version exists in libraries
    const librariesPath = path.join(
      instanceDir,
      '.minecraft',
      'libraries',
      'net/fabricmc/fabric-loader/'
    );
    if (await fs.pathExists(librariesPath)) {
      const files = await fs.readdir(librariesPath);
      const fabricLoaderFiles = files.filter((dir) => dir.includes(`.`));
      if (fabricLoaderFiles.length !== 1) {
        const deletePath = path.join(
          librariesPath,
          fabricLoaderFiles.filter(
            (file) => file !== `${manifest.fabricVersion}`
          )[0]
        );
        await fs.remove(deletePath);
        this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
          status: 'verifying_fabric',
          message: `Removed old Fabric Loader version: ${
            fabricLoaderFiles.filter(
              (file) => file !== `${manifest.fabricVersion}`
            )[0]
          }`,
          step: VerificationSteps.VERIFYING_FABRIC,
          steps: VerificationSteps.COUNT,
          finished: false,
        });
      }

      await this.lightVerifyFabric(manifest);
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_fabric',
      message: 'Fabric Loader verified successfully',
      step: VerificationSteps.VERIFYING_FABRIC,
      steps: VerificationSteps.COUNT,
      finished: true,
    });
  }

  public async updateFabricLoader(
    _oldManifest: Manifest,
    newManifest: Manifest
  ): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'updating_fabric',
      message: 'Updating Fabric Loader...',
      step: UpdateSteps.UPDATING_FABRIC,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // Then, install the new fabric loader
    await this.installFabricLoader(newManifest, 'update');

    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'updating_fabric',
      message: 'Fabric Loader updated successfully',
      step: UpdateSteps.UPDATING_FABRIC,
      steps: UpdateSteps.COUNT,
      finished: true,
    });
  }
}
