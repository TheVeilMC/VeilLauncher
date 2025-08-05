import { BrowserWindow } from 'electron';
import { InstanceManager } from '../managers/InstanceManager';
import { Manifest } from './LaunchService';
import { FabricManager } from '../managers/FabricManager';
import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import { AssetsManager } from '../managers/AssetsManager';
import { LibraryManager } from '../managers/LibraryManager';
import { ClientManager } from '../managers/ClientManager';
import { ModManager } from '../managers/ModsManager';
import path from 'path';
import fs from 'fs-extra';

export enum InstallSteps {
  CHECKING_INSTANCE = 1,
  CREATING_CONFIG = 2,
  INSTALLING_FABRIC = 3,
  INSTALLING_CLIENT = 4,
  INSTALLING_LIBRARIES = 5,
  INSTALLING_ASSETS = 6,
  INSTALLING_MODS = 7,

  COUNT = 8,
}

export enum VerificationSteps {
  VERIFYING_INSTANCE = 1,
  VERIFYING_CONFIG = 2,
  VERIFYING_FABRIC = 3,
  VERIFYING_CLIENT = 4,
  VERIFYING_LIBRARIES = 5,
  VERIFYING_ASSETS = 6,
  VERIFYING_MODS = 7,

  COUNT = 8,
}

export enum UpdateSteps {
  CHECKING_INSTANCE = 1,
  CREATING_CONFIG = 2,
  UPDATING_FABRIC = 3,
  UPDATING_CLIENT = 4,
  UPDATING_LIBRARIES = 5,
  UPDATING_ASSETS = 6,
  UPDATING_MODS = 7,

  COUNT = 8,
}

export class InstallManager {
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

  public async cleanInstallInstance(manifest: Manifest): Promise<void> {
    // Check if instance path exists
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'checking_instance',
      message: 'Checking instance path...',
      step: InstallSteps.CHECKING_INSTANCE,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    const instancePathExists =
      await this.instanceManager.checkInstancePathExists(manifest.profileId);
    if (!instancePathExists) {
      await this.instanceManager.createInstanceDirectory(
        manifest.profileId,
        manifest
      );
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'checked_instance',
        message: 'Instance path created',
        step: InstallSteps.CHECKING_INSTANCE,
        steps: InstallSteps.COUNT,
        finished: false,
      });
    } else {
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'checked_instance',
        message: 'Instance path checked',
        step: InstallSteps.CHECKING_INSTANCE,
        steps: InstallSteps.COUNT,
        finished: false,
      });
    }

    // Create instance configuration
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'creating_config',
      message: 'Creating instance configuration...',
      step: InstallSteps.CREATING_CONFIG,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    await this.instanceManager.createInstanceConfig(
      manifest.profileId,
      manifest
    );
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'config_created',
      message: 'Instance configuration created',
      step: InstallSteps.CREATING_CONFIG,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    // Install Fabric Loader
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'installing_fabric',
      message: 'Installing Fabric Loader...',
      step: InstallSteps.INSTALLING_FABRIC,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    const fabricManager = new FabricManager(
      this.instanceManager,
      this.mainWindow
    );
    await fabricManager.installFabric(manifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'fabric_installed',
      message: 'Fabric Loader installed',
      step: InstallSteps.INSTALLING_FABRIC,
      steps: InstallSteps.COUNT,
      progress: 100,
      finished: false,
    });

    // Install minecraft jar
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'installing_client',
      message: 'Installing Minecraft client...',
      step: InstallSteps.INSTALLING_CLIENT,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    const dir = this.instanceManager.getInstanceDirectory(manifest.profileId);
    const clientManager = new ClientManager(dir || '', this.mainWindow);
    await clientManager.installClient(manifest, 'install');
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'client_downloaded',
      message: 'Minecraft client downloaded successfully',
      step: InstallSteps.INSTALLING_CLIENT,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    // Install libraries
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'installing_libraries',
      message: 'Installing libraries...',
      step: InstallSteps.INSTALLING_LIBRARIES,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    const libraryManager = new LibraryManager(dir || '', this.mainWindow);
    await libraryManager.installLibraries(manifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'libraries_installed',
      message: 'All libraries processed successfully',
      step: InstallSteps.INSTALLING_LIBRARIES,
      finished: false,
    });

    // Install assets
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'installing_assets',
      message: 'Installing Minecraft Assets...',
      step: InstallSteps.INSTALLING_ASSETS,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    const assetsManager = new AssetsManager(dir || '', this.mainWindow);
    await assetsManager.installAssets(manifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'assets_installed',
      message: 'Assets installed',
      step: InstallSteps.INSTALLING_ASSETS,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    // Install mods
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'installing_mods',
      message: 'Installing Mods...',
      step: InstallSteps.INSTALLING_MODS,
      steps: InstallSteps.COUNT,
      finished: false,
    });
    const modsManager = new ModManager(dir || '', this.mainWindow);
    await modsManager.installMods(manifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'mods_installed',
      message: 'Mods installed',
      step: InstallSteps.INSTALLING_MODS,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    // Installation finished
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'install_finished',
      message: 'Installation finished. Launching now...',
      finished: false,
    });
  }

  public async lightVerifyInstance(manifest: Manifest): Promise<void> {
    try {
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'verifying_instance',
        message: 'Verifying instance...',
        step: VerificationSteps.VERIFYING_INSTANCE,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify instance directory
      const instanceDir = this.instanceManager.getInstanceDirectory(
        manifest.profileId
      );
      if (!instanceDir) {
        throw new Error(
          `Instance directory not found for profile ID: ${manifest.profileId}`
        );
      }

      // Verify configuration
      const configExists = await this.instanceManager.checkInstanceConfigExists(
        manifest.profileId
      );
      if (!configExists) {
        throw new Error(
          `Configuration not found for profile ID: ${manifest.profileId}`
        );
      }

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'config_verified',
        message: 'Configuration verified',
        step: VerificationSteps.VERIFYING_CONFIG,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify Fabric Loader
      const fabricManager = new FabricManager(
        this.instanceManager,
        this.mainWindow
      );
      const fabricVerified = await fabricManager.lightVerifyFabric(manifest);
      if (!fabricVerified) {
        throw new Error(
          `Fabric Loader verification failed for profile ID: ${manifest.profileId}`
        );
      }

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'fabric_verified',
        message: 'Fabric Loader verified',
        step: VerificationSteps.VERIFYING_FABRIC,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify Minecraft client
      const clientManager = new ClientManager(instanceDir, this.mainWindow);
      const clientVerified = await clientManager.lightVerifyClient(manifest);
      if (!clientVerified) {
        throw new Error(
          `Minecraft client verification failed for profile ID: ${manifest.profileId}`
        );
      }
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'client_verified',
        message: 'Minecraft client verified',
        step: VerificationSteps.VERIFYING_CLIENT,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify libraries
      const libraryManager = new LibraryManager(instanceDir, this.mainWindow);
      const librariesVerified =
        await libraryManager.lightVerifyLibraries(manifest);
      if (!librariesVerified) {
        throw new Error(
          `Library verification failed for profile ID: ${manifest.profileId}`
        );
      }
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'libraries_verified',
        message: 'Libraries verified',
        step: VerificationSteps.VERIFYING_LIBRARIES,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify assets
      const assetsManager = new AssetsManager(instanceDir, this.mainWindow);
      const assetsVerified = await assetsManager.lightVerifyAssets(manifest);
      if (!assetsVerified) {
        throw new Error(
          `Assets verification failed for profile ID: ${manifest.profileId}`
        );
      }

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'assets_verified',
        message: 'Assets verified',
        step: VerificationSteps.VERIFYING_ASSETS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify mods
      const modsManager = new ModManager(instanceDir, this.mainWindow);
      const modsVerified = await modsManager.lightVerifyMods(manifest);
      if (!modsVerified) {
        throw new Error(
          `Mods verification failed for profile ID: ${manifest.profileId}`
        );
      }

      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'mods_verified',
        message: 'Mods verified',
        step: VerificationSteps.VERIFYING_MODS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verification finished
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'verification_finished',
        message: 'Verification finished. Ready to launch.',
        step: VerificationSteps.COUNT,
        steps: VerificationSteps.COUNT,
        finished: true,
      });
    } catch (error: any) {
      console.log(error);
      console.error('Light Verification failed:', error);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_FAILED, {
        status: 'verification_error',
        message: `Verification failed: ${error.message}`,
        step: VerificationSteps.COUNT,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      throw error;
    }
  }

  public async hardVerifyInstance(manifest: Manifest): Promise<void> {
    try {
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_instance',
        message: 'Verifying instance...',
        step: VerificationSteps.VERIFYING_INSTANCE,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify instance directory
      const instanceDir = this.instanceManager.getInstanceDirectory(
        manifest.profileId
      );
      if (!instanceDir) {
        throw new Error(
          `Instance directory not found for profile ID: ${manifest.profileId}`
        );
      }

      // Verify configuration
      const configExists = await this.instanceManager.checkInstanceConfigExists(
        manifest.profileId
      );
      if (!configExists) {
        throw new Error(
          `Configuration not found for profile ID: ${manifest.profileId}`
        );
      }

      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'config_verified',
        message: 'Configuration verified',
        step: VerificationSteps.VERIFYING_CONFIG,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify Fabric Loader
      const fabricManager = new FabricManager(
        this.instanceManager,
        this.mainWindow
      );
      await fabricManager.hardVerifyFabric(manifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'fabric_verified',
        message: 'Fabric Loader verified',
        step: VerificationSteps.VERIFYING_FABRIC,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      // Verify Minecraft client
      const clientManager = new ClientManager(instanceDir, this.mainWindow);
      await clientManager.hardVerifyClient(manifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'client_verified',
        message: 'Minecraft client verified',
        step: VerificationSteps.VERIFYING_CLIENT,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      // Verify libraries
      const libraryManager = new LibraryManager(instanceDir, this.mainWindow);
      await libraryManager.hardVerifyLibraries(manifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'libraries_verified',
        message: 'Libraries verified',
        step: VerificationSteps.VERIFYING_LIBRARIES,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      // Verify assets
      const assetsManager = new AssetsManager(instanceDir, this.mainWindow);
      await assetsManager.hardVerifyAssets(manifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'assets_verified',
        message: 'Assets verified',
        step: VerificationSteps.VERIFYING_ASSETS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verify mods
      const modsManager = new ModManager(instanceDir, this.mainWindow);
      await modsManager.hardVerifyMods(manifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'mods_verified',
        message: 'Mods verified',
        step: VerificationSteps.VERIFYING_MODS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Verification finished
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verification_finished',
        message: 'Verification finished. Ready to launch.',
        step: VerificationSteps.COUNT,
        steps: VerificationSteps.COUNT,
        finished: true,
      });
    } catch (error: any) {
      console.log(error);
      console.error('Hard Verification failed:', error);
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_FAILED, {
        status: 'verification_error',
        message: `Verification failed: ${error.message}`,
        step: VerificationSteps.COUNT,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
      throw error;
    }
  }

  public async updateInstance(newManifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'checking_instance',
      message: 'Checking instance path...',
      step: UpdateSteps.CHECKING_INSTANCE,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    const instancePathExists =
      await this.instanceManager.checkInstancePathExists(newManifest.profileId);
    if (!instancePathExists) {
      throw new Error(
        `Instance path does not exist for profile ID: ${newManifest.profileId}`
      );
    }
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'instance_checked',
      message: 'Instance path checked',
      step: UpdateSteps.CHECKING_INSTANCE,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    const oldManifest = await this.instanceManager.getInstanceConfig(
      newManifest.profileId
    );
    if (!oldManifest) {
      throw new Error(
        `Instance configuration not found for profile ID: ${newManifest.profileId}`
      );
    }
    const instancePathExists2 =
      await this.instanceManager.checkInstancePathExists(oldManifest.profileId);
    if (!instancePathExists2) {
      throw new Error(
        `Instance path does not exist for profile ID: ${oldManifest.profileId}`
      );
    }

    // Create or update instance configuration
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'creating_config',
      message: 'Creating instance configuration...',
      step: UpdateSteps.CREATING_CONFIG,
      steps: UpdateSteps.COUNT,
      finished: false,
    });
    await this.instanceManager.createInstanceConfig(
      newManifest.profileId,
      newManifest
    );

    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'config_created',
      message: 'Instance configuration created',
      step: UpdateSteps.CREATING_CONFIG,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // Update Fabric Loader
    if (oldManifest.fabricVersion !== newManifest.fabricVersion) {
      this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
        status: 'updating_fabric',
        message: 'Updating Fabric Loader...',
        step: UpdateSteps.UPDATING_FABRIC,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
      const fabricManager = new FabricManager(
        this.instanceManager,
        this.mainWindow
      );
      await fabricManager.updateFabricLoader(oldManifest, newManifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
        status: 'fabric_updated',
        message: 'Fabric Loader updated',
        step: UpdateSteps.UPDATING_FABRIC,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
    }

    // Update Minecraft client
    if (oldManifest.mcVersion !== newManifest.mcVersion) {
      this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
        status: 'updating_client',
        message: 'Updating Minecraft client...',
        step: UpdateSteps.UPDATING_CLIENT,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
      const clientManager = new ClientManager(
        this.instanceManager.getInstanceDirectory(newManifest.profileId) || '',
        this.mainWindow
      );
      await clientManager.updateClient(oldManifest, newManifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
        status: 'client_updated',
        message: 'Minecraft client updated successfully',
        step: UpdateSteps.UPDATING_CLIENT,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
    }

    // Update libraries
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'updating_libraries',
      message: 'Updating libraries...',
      step: UpdateSteps.UPDATING_LIBRARIES,
      steps: UpdateSteps.COUNT,
      finished: false,
    });
    const libraryManager = new LibraryManager(
      this.instanceManager.getInstanceDirectory(newManifest.profileId) || '',
      this.mainWindow
    );
    await libraryManager.updateLibraries(oldManifest, newManifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'libraries_updated',
      message: 'All libraries processed successfully',
      step: UpdateSteps.UPDATING_LIBRARIES,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // Cleanup old fabric loader
    const oldFabricLoaderPath = path.join(
      this.instanceManager.getInstanceDirectory(
        oldManifest.profileId
      ) as string,
      '.minecraft',
      'versions',
      `fabric-loader-${oldManifest.fabricVersion}-${oldManifest.mcVersion}`
    );
    if (await fs.pathExists(oldFabricLoaderPath)) {
      await fs.remove(oldFabricLoaderPath);
    }

    // Update assets
    if (
      oldManifest.mcVersion !== newManifest.mcVersion ||
      oldManifest.assets.index !== newManifest.assets.index
    ) {
      this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
        status: 'updating_assets',
        message: 'Updating Minecraft Assets...',
        step: UpdateSteps.UPDATING_ASSETS,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
      const assetsManager = new AssetsManager(
        this.instanceManager.getInstanceDirectory(newManifest.profileId) || '',
        this.mainWindow
      );
      await assetsManager.updateAssets(oldManifest, newManifest);
      this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
        status: 'assets_updated',
        message: 'Assets updated',
        step: UpdateSteps.UPDATING_ASSETS,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
    }
    // Update mods
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'updating_mods',
      message: 'Updating Mods...',
      step: UpdateSteps.UPDATING_MODS,
      steps: UpdateSteps.COUNT,
      finished: false,
    });
    const modsManager = new ModManager(
      this.instanceManager.getInstanceDirectory(newManifest.profileId) || '',
      this.mainWindow
    );
    await modsManager.updateMods(oldManifest, newManifest);
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'mods_updated',
      message: 'Mods updated',
      step: UpdateSteps.UPDATING_MODS,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // Update finished
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'update_finished',
      message: 'Update finished. Ready to launch.',
      step: UpdateSteps.COUNT,
      steps: UpdateSteps.COUNT,
      finished: true,
    });
  }
}
