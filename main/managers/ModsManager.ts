import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import { BrowserWindow } from 'electron';
import { Manifest } from '../services/LaunchService';
import { downloadFile } from '../utils/downloader';
import path from 'path';
import fs from 'fs-extra';
import { SHA1 } from 'crypto-js';
import * as CryptoJS from 'crypto-js';
import { logger } from '../core/logger';
import {
  InstallSteps,
  UpdateSteps,
  VerificationSteps,
} from '../services/InstallService';

export class ModManager {
  private mainWindow: BrowserWindow;
  private instanceDir: string;
  private modsPath: string;

  constructor(instanceDir: string, mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;

    this.instanceDir = instanceDir;
    this.modsPath = path.join(this.instanceDir, '.minecraft', 'mods');
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  public async installMods(manifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'installing_mods',
      message: 'Installing mods...',
      step: InstallSteps.INSTALLING_MODS,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    // Logic to install mods based on the manifest
    for (const modName in manifest.mods) {
      if (Object.prototype.hasOwnProperty.call(manifest.mods, modName)) {
        const mod = manifest.mods[modName];

        await downloadFile(
          mod.downloadUrl,
          path.join(this.modsPath, mod.fileName),
          {
            expectedChecksum: mod.checksum,
            onProgress: (progress: number) => {
              this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
                status: 'mod_installing',
                message: `Installing ${modName}`,
                step: InstallSteps.INSTALLING_MODS,
                steps: InstallSteps.COUNT,
                finished: false,
                progress,
              });
            },
          }
        );

        this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
          status: 'mod_installing',
          message: `Downloaded ${modName}`,
          step: InstallSteps.INSTALLING_MODS,
          steps: InstallSteps.COUNT,
          finished: false,
        });
      }
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'mods_installed',
      message: 'All mods installed successfully',
      step: InstallSteps.INSTALLING_MODS,
      steps: InstallSteps.COUNT,
      finished: true,
    });
  }

  public async lightVerifyMods(manifest: Manifest): Promise<boolean> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'verifying_mods',
      message: 'Verifying mods...',
      step: VerificationSteps.VERIFYING_MODS,
      steps: VerificationSteps.COUNT,
      finished: false,
    });
    const modFiles = await fs.readdir(this.modsPath);
    const modChecksums = manifest.mods;
    for (const modFile of modFiles) {
      const modPath = path.join(this.modsPath, modFile);
      const expectedChecksum = modChecksums[modFile]?.checksum;
      if (expectedChecksum) {
        const fileBuffer = await fs.readFile(modPath);
        const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
        const actualHash = SHA1(wordArray).toString();
        if (actualHash !== expectedChecksum) {
          logger.warn(
            `Mod ${modFile} checksum mismatch: expected ${expectedChecksum}, got ${actualHash}`
          );
          this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
            status: 'mod_verification_failed',
            message: `Mod ${modFile} verification failed`,
            step: VerificationSteps.VERIFYING_MODS,
            steps: VerificationSteps.COUNT,
            finished: false,
          });
          return false;
        } else {
          logger.info(`Mod ${modFile} verified successfully`);
        }
      } else {
        logger.warn(`No checksum found for mod ${modFile}`);
      }
    }

    const missingMods = await this.checkMissingMods(manifest);
    if (missingMods.length > 0) {
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'missing_mods_found',
        message: `Missing mods: ${missingMods.join(', ')}`,
        step: VerificationSteps.VERIFYING_MODS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      return false;
    }
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'mods_verified',
      message: 'All mods verified successfully',
      step: VerificationSteps.VERIFYING_MODS,
      steps: VerificationSteps.COUNT,
      finished: false,
    });
    return true;
  }

  public async hardVerifyMods(manifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_mods',
      message: 'Verifying mods...',
      step: VerificationSteps.VERIFYING_MODS,
      steps: VerificationSteps.COUNT,
      finished: false,
    });
    const modFiles = await fs.readdir(this.modsPath);
    const modChecksums = manifest.mods;
    for (const modFile of modFiles) {
      const modPath = path.join(this.modsPath, modFile);
      const expectedChecksum = modChecksums[modFile]?.checksum;
      if (expectedChecksum) {
        const fileBuffer = await fs.readFile(modPath);
        const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
        const actualHash = SHA1(wordArray).toString();
        if (actualHash !== expectedChecksum) {
          await fs.unlinkSync(modPath);
        } else {
          logger.info(`Mod ${modFile} verified successfully`);
        }
      } else {
        logger.warn(`No checksum found for mod ${modFile}`);
      }
    }
    const missingMods = await this.checkMissingMods(manifest);
    if (missingMods.length > 0) {
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_mods',
        message: `Missing mods: ${missingMods.join(', ')}`,
        step: VerificationSteps.VERIFYING_MODS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });

      // Install missing mods
      for (const modName of missingMods) {
        const mod = manifest.mods[modName];
        if (mod) {
          await downloadFile(
            mod.downloadUrl,
            path.join(this.modsPath, mod.fileName),
            {
              expectedChecksum: mod.checksum,
              onProgress: (progress: number) => {
                this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
                  status: 'verifying_mods',
                  message: 'Verifying: ' + modName,
                  step: VerificationSteps.VERIFYING_MODS,
                  steps: VerificationSteps.COUNT,
                  finished: false,
                  progress,
                });
              },
            }
          );
          this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
            status: 'verifying_mods',
            message: `Installed missing mod ${modName}`,
            step: VerificationSteps.VERIFYING_MODS,
            steps: VerificationSteps.COUNT,
            finished: false,
          });
        }
      }
    }
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_mods',
      message: 'All mods verified successfully',
      step: VerificationSteps.VERIFYING_MODS,
      steps: VerificationSteps.COUNT,
      finished: true,
    });
  }

  private async checkMissingMods(manifest: Manifest): Promise<string[]> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_mods',
      message: 'Checking for missing mods...',
      step: VerificationSteps.VERIFYING_MODS,
      steps: VerificationSteps.COUNT,
      finished: false,
    });
    const modFiles = await fs.readdir(this.modsPath);
    const missingMods: string[] = [];
    for (const modName in manifest.mods) {
      if (Object.prototype.hasOwnProperty.call(manifest.mods, modName)) {
        if (!modFiles.includes(manifest.mods[modName].fileName)) {
          missingMods.push(modName);
        }
      }
    }
    if (missingMods.length > 0) {
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_mods',
        message: `Missing mods: ${missingMods.join(', ')}`,
        step: VerificationSteps.VERIFYING_MODS,
        steps: VerificationSteps.COUNT,
        finished: false,
      });
    } else {
      this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
        status: 'verifying_mods',
        message: 'No missing mods found',
        step: VerificationSteps.VERIFYING_MODS,
        steps: VerificationSteps.COUNT,
        finished: true,
      });
    }
    return missingMods;
  }

  public async updateMods(
    oldManifest: Manifest,
    newManifest: Manifest
  ): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'updating_mods',
      message: 'Updating mods...',
      step: UpdateSteps.UPDATING_MODS,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // Check current mods
    const currentMods = await fs.readdir(this.modsPath);

    // Check if any unnecessary mods exist
    const unnecessaryMods = currentMods.filter((mod) => !newManifest.mods[mod]);
    if (unnecessaryMods.length > 0) {
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'mod_cleanup_update',
        message: `Removing unnecessary mods: ${unnecessaryMods.join(', ')}`,
        step: UpdateSteps.UPDATING_MODS,
        steps: UpdateSteps.COUNT,
        finished: false,
      });

      // Remove unnecessary mods
      for (const mod of unnecessaryMods) {
        await fs.unlink(path.join(this.modsPath, mod));
      }
      this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
        status: 'mod_cleanup_update',
        message: 'Unnecessary mods removed successfully',
        step: UpdateSteps.UPDATING_MODS,
        steps: UpdateSteps.COUNT,
        finished: false,
      });
    }

    // Compare old and new manifests, remove non-existent mods, and update existing ones
    for (const modName in oldManifest.mods) {
      if (!newManifest.mods[modName]) {
        // Remove non-existent mod
        await fs.unlink(
          path.join(this.modsPath, oldManifest.mods[modName].fileName)
        );
      } else if (
        oldManifest.mods[modName].version !== newManifest.mods[modName].version
      ) {
        // Update existing mod
        await fs.unlink(
          path.join(this.modsPath, oldManifest.mods[modName].fileName)
        );
        await downloadFile(
          newManifest.mods[modName].downloadUrl,
          path.join(this.modsPath, newManifest.mods[modName].fileName),
          {
            expectedChecksum: newManifest.mods[modName].checksum,
            onProgress: (progress: number) => {
              this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
                status: 'mod_updating',
                message: `Updating ${modName}`,
                step: UpdateSteps.UPDATING_MODS,
                steps: UpdateSteps.COUNT,
                finished: false,
                progress,
              });
            },
          }
        );
        this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
          status: 'mod_updating',
          message: `Updated ${modName}`,
          step: UpdateSteps.UPDATING_MODS,
          steps: UpdateSteps.COUNT,
          finished: false,
        });
      }
    }

    // Install new mods
    for (const modName in newManifest.mods) {
      if (!oldManifest.mods[modName]) {
        // Install new mod
        await downloadFile(
          newManifest.mods[modName].downloadUrl,
          path.join(this.modsPath, newManifest.mods[modName].fileName),
          {
            expectedChecksum: newManifest.mods[modName].checksum,
            onProgress: (progress: number) => {
              this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
                status: 'mod_update',
                message: `Installing ${modName}`,
                step: UpdateSteps.UPDATING_MODS,
                steps: UpdateSteps.COUNT,
                finished: false,
                progress,
              });
            },
          }
        );
        this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
          status: 'mod_update',
          message: `Installed ${modName}`,
          step: UpdateSteps.UPDATING_MODS,
          steps: UpdateSteps.COUNT,
          finished: false,
        });
      }
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'mods_updated',
      message: 'All mods updated successfully',
      step: UpdateSteps.UPDATING_MODS,
      steps: UpdateSteps.COUNT,
      finished: true,
    });
  }
}
