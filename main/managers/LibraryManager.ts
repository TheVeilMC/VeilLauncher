import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import { downloadFile } from '../utils/downloader';
import { Manifest } from '../services/LaunchService';
import { WEBSOCKET_EVENTS } from '@the-veil/shared';
import { SHA1 } from 'crypto-js';
import * as CryptoJS from 'crypto-js';
import * as os from 'os';
import {
  InstallSteps,
  UpdateSteps,
  VerificationSteps,
} from '../services/InstallService';

interface Library {
  name: string;
  downloads?: {
    artifact?: {
      path: string;
      url: string;
      sha1: string;
      size: number;
    };
    classifiers?: {
      [key: string]: {
        path: string;
        url: string;
        sha1: string;
        size: number;
      };
    };
  };
  natives?: {
    [key: string]: string;
  };
  rules?: Array<{
    action: string;
    os?: {
      name?: string;
      arch?: string;
      version?: string;
    };
    features?: {
      [key: string]: boolean;
    };
  }>;
  extract?: {
    exclude?: string[];
  };
  // Fabric-specific properties
  url?: string;
  sha1?: string;
  sha256?: string;
  sha512?: string;
  md5?: string;
  size?: number;
}

interface VersionData {
  libraries: Library[];
  mainClass: string;
  minecraftArguments?: string;
  arguments?: {
    game: Array<string | { rules: any[]; value: string | string[] }>;
    jvm: Array<string | { rules: any[]; value: string | string[] }>;
  };
}

export class LibraryManager {
  private mainWindow: BrowserWindow;
  private instanceDir: string;
  private librariesPath: string;
  private nativesPath: string;

  constructor(instanceDir: string, mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.instanceDir = instanceDir;
    this.librariesPath = path.join(this.instanceDir, '.minecraft', 'libraries');
    this.nativesPath = path.join(this.instanceDir, '.minecraft', 'natives');

    this.debugOSDetection();
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  public async installLibraries(manifest: Manifest): Promise<{
    libraries: string[];
    nativesPath: string;
    mainClass: string;
  }> {
    // First get vanilla libraries
    const vanillaVersionData = await this.getVersionData(manifest);

    // Then get Fabric libraries if they exist
    const fabricVersionData = await this.getFabricVersionData(manifest);

    // Combine libraries (Fabric libraries take precedence)
    const allLibraries = [
      ...(vanillaVersionData.libraries || []),
      ...(fabricVersionData?.libraries || []),
    ];

    console.log('Processing libraries:', allLibraries.length);

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'libraries_installing',
      message: 'Processing libraries...',
      step: InstallSteps.INSTALLING_LIBRARIES,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    const libraryPaths: string[] = [];
    const nativeLibraries: Array<{ path: string; extract?: any }> = [];
    let processedCount = 0;
    const totalLibraries = allLibraries.length;

    // Process libraries in parallel batches
    const batchSize = 5;
    for (let i = 0; i < allLibraries.length; i += batchSize) {
      const batch = allLibraries.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (library) => {
          const result = await this.processLibrary(library);
          if (result.jarPath) {
            libraryPaths.push(result.jarPath);
          }
          if (result.nativePath) {
            nativeLibraries.push({
              path: result.nativePath,
              extract: library.extract,
            });
          }

          processedCount++;
          this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
            status: 'libraries_installing',
            message: `Processing library ${library.name}`,
            step: InstallSteps.INSTALLING_LIBRARIES,
            steps: InstallSteps.COUNT,
            progress: (processedCount / totalLibraries) * 100,
            finished: false,
          });
        })
      );
    }

    console.log('Native libraries to extract:', nativeLibraries.length);

    // Extract native libraries
    if (nativeLibraries.length > 0) {
      await this.extractNatives(nativeLibraries);
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.LAUNCH_STATUS, {
      status: 'libraries_installed',
      message: 'All libraries processed successfully',
      step: InstallSteps.INSTALLING_LIBRARIES,
      steps: InstallSteps.COUNT,
      finished: false,
    });

    return {
      libraries: libraryPaths,
      nativesPath: this.nativesPath,
      mainClass: fabricVersionData?.mainClass || vanillaVersionData.mainClass,
    };
  }

  private async processLibrary(library: Library): Promise<{
    jarPath?: string;
    nativePath?: string;
  }> {
    // Check if library should be used
    if (!this.shouldUseLibrary(library)) {
      return {};
    }

    const result: { jarPath?: string; nativePath?: string } = {};

    // Handle main library JAR
    if (library.url && library.name && !library.downloads) {
      // Fabric-style library
      const libraryPath = this.getLibraryPath(library.name);

      if (library.sha1 && library.size) {
        if (await this.verifyLibrary(libraryPath, library.sha1, library.size)) {
          result.jarPath = libraryPath;
          return result;
        }
      }

      await fs.ensureDir(path.dirname(libraryPath));
      const downloadUrl = this.buildFabricLibraryUrl(library);
      await downloadFile(downloadUrl, libraryPath);
      result.jarPath = libraryPath;
      return result;
    }

    // Handle standard Minecraft libraries
    if (library.downloads?.artifact) {
      const artifact = library.downloads.artifact;
      const libraryPath = path.join(this.librariesPath, artifact.path);

      // Check if this is a native library based on the library name
      const isNativeLibrary = this.isNativeLibrary(library.name);

      if (
        !(await this.verifyLibrary(libraryPath, artifact.sha1, artifact.size))
      ) {
        await fs.ensureDir(path.dirname(libraryPath));
        await downloadFile(artifact.url, libraryPath);
      }

      if (isNativeLibrary) {
        console.log(`Found native library: ${library.name} -> ${libraryPath}`);
        result.nativePath = libraryPath;
      } else {
        result.jarPath = libraryPath;
      }
    }

    // Handle legacy native libraries (older format with classifiers)
    if (library.downloads?.classifiers && library.natives) {
      const osName = this.getOSName();
      console.log(`\nProcessing legacy natives for: ${library.name}`);
      console.log(`  Current OS: ${osName}`);
      console.log(`  Available natives: ${JSON.stringify(library.natives)}`);
      console.log(
        `  Available classifiers: ${Object.keys(library.downloads.classifiers)}`
      );

      // Try multiple possible native keys
      const possibleKeys = [
        library.natives[osName], // Direct mapping
        library.natives[osName + '-' + this.getOSArch()], // OS-arch combo
        osName, // Sometimes the key is just the OS name
      ].filter(Boolean);

      console.log(`  Trying native keys: ${possibleKeys}`);

      for (const nativeKey of possibleKeys) {
        if (library.downloads.classifiers[nativeKey]) {
          const classifier = library.downloads.classifiers[nativeKey];
          const nativePath = path.join(this.librariesPath, classifier.path);

          console.log(`  Found classifier: ${nativeKey} -> ${classifier.path}`);

          if (
            !(await this.verifyLibrary(
              nativePath,
              classifier.sha1,
              classifier.size
            ))
          ) {
            await fs.ensureDir(path.dirname(nativePath));
            await downloadFile(classifier.url, nativePath);
            console.log(`  Downloaded: ${nativePath}`);
          } else {
            console.log(`  Already exists: ${nativePath}`);
          }

          result.nativePath = nativePath;
          break;
        }
      }

      if (!result.nativePath) {
        console.warn(`  No native library found for OS: ${osName}`);
      }
    }

    return result;
  }

  /**
   * Check if a library is a native library based on its name
   */
  private isNativeLibrary(libraryName: string): boolean {
    // Modern LWJGL format: org.lwjgl:lwjgl-opengl:3.3.1:natives-windows
    // Legacy format: org.lwjgl:lwjgl-glfw:3.3.1:natives-windows
    const parts = libraryName.split(':');

    // Check for classifier that indicates natives
    if (parts.length >= 4) {
      const classifier = parts[3];
      return classifier.startsWith('natives-');
    }

    // Also check if the library name contains native indicators
    return libraryName.includes('natives-');
  }

  public debugOSDetection(): void {
    console.log('=== OS Detection Debug ===');
    console.log('os.platform():', os.platform());
    console.log('os.arch():', os.arch());
    console.log('os.release():', os.release());
    console.log('getOSName():', this.getOSName());
    console.log('getOSArch():', this.getOSArch());
    console.log('=========================');
  }

  private shouldUseLibrary(library: Library): boolean {
    // First check if this is a native library and filter by architecture
    if (this.isNativeLibrary(library.name)) {
      const architectureMatch = this.checkNativeLibraryArchitecture(
        library.name
      );
      if (!architectureMatch) {
        console.log(
          `Native library ${library.name}: DENIED due to architecture mismatch`
        );
        return false;
      }
    }

    if (!library.rules || library.rules.length === 0) {
      return true;
    }

    // Start with deny by default for libraries with rules, then apply allow rules
    let result = false;

    for (const rule of library.rules) {
      let matches = true;

      // Check OS rules
      if (rule.os) {
        if (rule.os.name) {
          const currentOS = this.getOSName();
          if (rule.os.name !== currentOS) {
            matches = false;
          }
        }

        if (rule.os.arch && matches) {
          const currentArch = this.getOSArch();

          // Handle architecture matching more precisely
          let ruleArch = this.normalizeArchitecture(rule.os.arch);

          console.log(
            `Architecture check: rule=${rule.os.arch} (normalized=${ruleArch}) vs current=${currentArch}`
          );

          if (ruleArch !== currentArch) {
            matches = false;
          }
        }

        // Handle version rules if present
        if (rule.os.version && matches) {
          // For now, we'll assume version rules are satisfied
          // You can add specific version checking logic here if needed
        }
      }

      // Check feature rules
      if (rule.features && matches) {
        for (const [feature, required] of Object.entries(rule.features)) {
          // Assume common features are disabled unless specified
          const featureEnabled = false; // You can make this configurable
          if (required !== featureEnabled) {
            matches = false;
            break;
          }
        }
      }

      // Apply rule if conditions match
      if (matches) {
        if (rule.action === 'allow') {
          result = true;
        } else if (rule.action === 'disallow') {
          result = false;
        }
      }
    }

    // Debug logging with more detail
    const rulesStr = library.rules
      .map(
        (r) => `${r.action}(os:${r.os?.name || 'any'}/${r.os?.arch || 'any'})`
      )
      .join(',');

    console.log(
      `Library ${library.name}: ${result ? 'ALLOWED' : 'DENIED'} ` +
        `(OS: ${this.getOSName()}, Arch: ${this.getOSArch()}, Rules: ${rulesStr})`
    );

    return result;
  }

  /**
   * Check if a native library matches the current system architecture
   * This is crucial because Minecraft's JSON often only specifies OS but not arch in rules,
   * so we need to infer architecture compatibility from the library name itself.
   */
  private checkNativeLibraryArchitecture(libraryName: string): boolean {
    const currentArch = this.getOSArch();
    const currentOS = this.getOSName();

    console.log(`\n=== Architecture Check for ${libraryName} ===`);
    console.log(`Current system: ${currentOS}-${currentArch}`);

    // Extract architecture information from the library name
    const archInfo = this.extractArchitectureFromLibraryName(libraryName);
    console.log(
      `Extracted arch info: OS=${archInfo.os}, Arch=${archInfo.arch}`
    );

    // If no specific architecture is mentioned in the name, it's usually a generic/universal library
    if (!archInfo.arch) {
      console.log(
        `No specific architecture in name - checking if it's a base/universal library`
      );

      // For libraries like "natives-windows" without arch suffix,
      // we need to check if there are more specific variants available
      // If this is the most generic variant for this OS, allow it only if no arch-specific variants exist
      const isGenericVariant = this.isGenericNativeVariant(libraryName);
      console.log(`Is generic variant: ${isGenericVariant}`);

      if (isGenericVariant) {
        // Allow generic variants - they usually work across architectures or are the fallback
        console.log(`Allowing generic native library: ${libraryName}`);
        return true;
      }
    }

    // Check OS compatibility first
    if (archInfo.os && archInfo.os !== currentOS) {
      console.log(
        `OS mismatch: library=${archInfo.os} vs current=${currentOS}`
      );
      return false;
    }

    // Check architecture compatibility
    if (archInfo.arch) {
      const isArchMatch = this.isArchitectureCompatible(
        archInfo.arch,
        currentArch
      );
      console.log(
        `Architecture compatibility: ${archInfo.arch} vs ${currentArch} = ${isArchMatch}`
      );
      return isArchMatch;
    }

    // If we get here, it passed OS check and has no specific arch requirement
    console.log(`No specific architecture requirement - ALLOWED`);
    return true;
  }

  /**
   * Extract OS and architecture information from a native library name
   */
  private extractArchitectureFromLibraryName(libraryName: string): {
    os?: string;
    arch?: string;
  } {
    const parts = libraryName.split(':');

    if (parts.length < 4) {
      return {};
    }

    const classifier = parts[3]; // e.g., "natives-windows-x86" or "natives-linux-arm64"

    if (!classifier.startsWith('natives-')) {
      return {};
    }

    // Remove "natives-" prefix
    const platformInfo = classifier.substring(8); // "windows-x86" or "linux-arm64" or just "windows"

    const platformParts = platformInfo.split('-');
    const os = platformParts[0]; // "windows", "linux", "osx"
    const arch = platformParts[1]; // "x86", "arm64", etc. (undefined if not specified)

    return { os, arch };
  }

  /**
   * Check if this is a generic native variant (no architecture suffix)
   */
  private isGenericNativeVariant(libraryName: string): boolean {
    const archInfo = this.extractArchitectureFromLibraryName(libraryName);

    // It's generic if it specifies an OS but no architecture
    return archInfo.os !== undefined && archInfo.arch === undefined;
  }

  /**
   * Check if a library architecture is compatible with the current system architecture
   */
  private isArchitectureCompatible(
    libraryArch: string,
    systemArch: string
  ): boolean {
    const normalizedLibraryArch = this.normalizeArchitecture(libraryArch);
    const normalizedSystemArch = this.normalizeArchitecture(systemArch);

    // Direct match
    if (normalizedLibraryArch === normalizedSystemArch) {
      return true;
    }

    // Special compatibility rules
    switch (normalizedSystemArch) {
      case 'x86_64':
        // x86_64 systems can potentially run x86 libraries (with compatibility layers)
        // but for natives, we should prefer exact matches to avoid issues
        return normalizedLibraryArch === 'x86_64';

      case 'aarch64':
        // ARM64 systems should only use ARM64 natives
        return normalizedLibraryArch === 'aarch64';

      case 'x86':
        // x86 systems should only use x86 natives
        return normalizedLibraryArch === 'x86';

      default:
        // For unknown architectures, require exact match
        return normalizedLibraryArch === normalizedSystemArch;
    }
  }

  /**
   * Normalize architecture names to a consistent format
   */
  private normalizeArchitecture(arch: string): string {
    const lowerArch = arch.toLowerCase();

    // x86_64 variants
    if (
      lowerArch === 'x86_64' ||
      lowerArch === 'amd64' ||
      lowerArch === 'x64'
    ) {
      return 'x86_64';
    }

    // ARM64 variants
    if (lowerArch === 'aarch64' || lowerArch === 'arm64') {
      return 'aarch64';
    }

    // x86 variants
    if (
      lowerArch === 'x86' ||
      lowerArch === 'i386' ||
      lowerArch === 'i686' ||
      lowerArch === 'ia32'
    ) {
      return 'x86';
    }

    // ARM 32-bit variants
    if (lowerArch === 'arm' || lowerArch === 'armv7' || lowerArch === 'armhf') {
      return 'arm';
    }

    return lowerArch;
  }

  public async extractNatives(
    nativeLibraries: Array<{ path: string; extract?: any }>
  ): Promise<void> {
    console.log(
      `Starting native extraction for ${nativeLibraries.length} libraries`
    );

    // Clear and recreate natives directory
    await fs.remove(this.nativesPath);
    await fs.ensureDir(this.nativesPath);

    const AdmZip = require('adm-zip');
    let totalExtracted = 0;

    for (const native of nativeLibraries) {
      try {
        console.log(`Processing native archive: ${path.basename(native.path)}`);

        if (!(await fs.pathExists(native.path))) {
          console.warn(`Native library not found: ${native.path}`);
          continue;
        }

        const zip = new AdmZip(native.path);
        const entries = zip.getEntries();

        console.log(`Archive contains ${entries.length} entries`);

        for (const entry of entries) {
          if (entry.isDirectory) continue;

          const entryName = entry.entryName;
          const fileName = path.basename(entryName);

          // Check exclusions
          if (native.extract?.exclude) {
            const shouldExclude = native.extract.exclude.some(
              (pattern: string) => {
                if (pattern === 'META-INF/') {
                  return entryName.startsWith('META-INF/');
                }
                // Simple glob to regex conversion
                const regex = new RegExp(
                  '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
                );
                return regex.test(entryName);
              }
            );

            if (shouldExclude) {
              console.log(`  Excluding: ${entryName}`);
              continue;
            }
          }

          // Extract native libraries (.dll, .so, .dylib)
          const isNativeLib = /\.(dll|so|dylib|jnilib)$/i.test(fileName);

          if (isNativeLib) {
            const extractPath = path.join(this.nativesPath, fileName);
            await fs.writeFile(extractPath, entry.getData());
            console.log(`  Extracted: ${fileName}`);
            totalExtracted++;
          }
        }
      } catch (error) {
        console.error(`Failed to extract ${native.path}:`, error);
        // Don't throw - continue with other libraries
      }
    }

    console.log(
      `Extraction complete: ${totalExtracted} native files extracted`
    );

    // Verify extraction results
    const extractedFiles = await fs.readdir(this.nativesPath);
    console.log(`Final native files:`, extractedFiles);

    // Check for critical LWJGL libraries based on OS
    const osName = this.getOSName();
    let requiredLibs: string[] = [];

    switch (osName) {
      case 'windows':
        requiredLibs = ['lwjgl.dll', 'glfw.dll'];
        break;
      case 'linux':
        requiredLibs = ['liblwjgl.so', 'libglfw.so'];
        break;
      case 'osx':
        requiredLibs = ['liblwjgl.dylib', 'libglfw.dylib'];
        break;
    }

    const missingLibs = requiredLibs.filter(
      (lib) =>
        !extractedFiles.some((file) =>
          file.includes(lib.replace(/^lib|\.dll$|\.so$|\.dylib$/g, ''))
        )
    );

    if (missingLibs.length > 0) {
      console.warn(`Missing critical libraries: ${missingLibs.join(', ')}`);
      console.warn(`Available files: ${extractedFiles.join(', ')}`);
    }

    if (extractedFiles.length === 0) {
      throw new Error(
        'No native libraries were extracted! Check library filtering.'
      );
    }
  }

  private async verifyLibrary(
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

  private getOSName(): string {
    const platform = os.platform();
    switch (platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'osx';
      case 'linux':
        return 'linux';
      default:
        return platform;
    }
  }

  private getLibraryPath(libraryName: string): string {
    // Convert Maven coordinates to file path
    // e.g., "net.fabricmc:fabric-loader:0.15.11" -> "net/fabricmc/fabric-loader/0.15.11/fabric-loader-0.15.11.jar"
    const parts = libraryName.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid library name format: ${libraryName}`);
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const fileName = `${artifact}-${version}.jar`;

    return path.join(
      this.librariesPath,
      groupPath,
      artifact,
      version,
      fileName
    );
  }

  public publicLibraryPath(libraryName: string): string {
    // Convert Maven coordinates to file path
    const parts = libraryName.split(':');
    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const fileName = `${artifact}-${version}.jar`;

    return path.join(
      this.librariesPath,
      groupPath,
      artifact,
      version,
      fileName
    );
  }

  private buildFabricLibraryUrl(library: Library): string {
    if (!library.url || !library.name) {
      throw new Error(
        `Missing URL or name for Fabric library: ${JSON.stringify(library)}`
      );
    }

    const parts = library.name.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid Fabric library name format: ${library.name}`);
    }

    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    const fileName = `${artifact}-${version}.jar`;

    const baseUrl = library.url.endsWith('/')
      ? library.url.slice(0, -1)
      : library.url;
    return `${baseUrl}/${groupPath}/${artifact}/${version}/${fileName}`;
  }

  private async getFabricVersionData(
    manifest: Manifest
  ): Promise<VersionData | null> {
    try {
      const fabricVersionId = `fabric-loader-${manifest.fabricVersion}-${manifest.mcVersion}`;
      const fabricVersionDir = path.join(
        this.instanceDir,
        '.minecraft',
        'versions',
        fabricVersionId
      );
      const fabricVersionJson = path.join(
        fabricVersionDir,
        `${fabricVersionId}.json`
      );

      if (await fs.pathExists(fabricVersionJson)) {
        return await fs.readJson(fabricVersionJson);
      }
    } catch (error) {
      console.warn('Failed to load Fabric version data:', error);
    }

    return null;
  }

  private getOSArch(): string {
    const arch = os.arch();
    switch (arch) {
      case 'x64':
        return 'x86_64';
      case 'ia32':
        return 'x86';
      case 'arm64':
        return 'aarch64';
      case 'arm':
        return 'arm';
      default:
        return arch;
    }
  }

  private async getVersionData(manifest: Manifest): Promise<VersionData> {
    const manifestResponse = await axios.get(manifest.assets.url);
    const versionInfo = manifestResponse.data.versions.find(
      (v: any) => v.id === manifest.mcVersion
    );

    if (!versionInfo) {
      throw new Error(`Version ${manifest.mcVersion} not found`);
    }

    const versionResponse = await axios.get(versionInfo.url);
    let versionData: VersionData = versionResponse.data;

    if ((versionData as any).inheritsFrom) {
      const inheritedVersionId = (versionData as any).inheritsFrom;
      const inheritedVersionInfo = manifestResponse.data.versions.find(
        (v: any) => v.id === inheritedVersionId
      );

      if (!inheritedVersionInfo) {
        throw new Error(`Inherited version ${inheritedVersionId} not found`);
      }

      const inheritedResponse = await axios.get(inheritedVersionInfo.url);
      const inheritedData: VersionData = inheritedResponse.data;

      const mergedLibraries = [
        ...(inheritedData.libraries || []),
        ...(versionData.libraries || []),
      ];

      versionData = {
        ...inheritedData,
        ...versionData,
        libraries: mergedLibraries,
      };
    }

    return versionData;
  }

  public getLibrariesPath(): string {
    return this.librariesPath;
  }

  public getNativesPath(): string {
    return this.nativesPath;
  }

  public async lightVerifyLibraries(manifest: Manifest): Promise<boolean> {
    try {
      // First get vanilla libraries
      const vanillaVersionData = await this.getVersionData(manifest);

      // Then get Fabric libraries if they exist
      const fabricVersionData = await this.getFabricVersionData(manifest);

      // Combine libraries (Fabric libraries take precedence)
      const allLibraries = [
        ...(vanillaVersionData.libraries || []),
        ...(fabricVersionData?.libraries || []),
      ];

      for (const library of allLibraries) {
        if (this.shouldUseLibrary(library) && library.downloads?.artifact) {
          const artifact = library.downloads.artifact;
          const libraryPath = path.join(this.librariesPath, artifact.path);

          if (
            !(await this.verifyLibrary(
              libraryPath,
              manifest.libraries[library.name]?.sha1 || artifact.sha1,
              manifest.libraries[library.name]?.size || artifact.size
            ))
          ) {
            return false; // Verification failed
          }
        }
      }

      return true; // All libraries verified successfully
    } catch (error) {
      console.error('Error during light verification:', error);
      return false; // Verification failed due to error
    }
  }

  public async hardVerifyLibraries(manifest: Manifest): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_libraries',
      message: 'Verifying libraries...',
      step: VerificationSteps.VERIFYING_LIBRARIES,
      steps: VerificationSteps.COUNT,
      finished: false,
    });

    const allLibraries = await this.getAllLibraries(manifest);

    // Track natives to extract after verification
    const nativesToExtract: Array<{ path: string; extract?: any }> = [];

    for (const library of allLibraries) {
      const libraryPath = this.publicLibraryPath(library.name);
      // Check and install missing library
      if (!(await fs.pathExists(libraryPath))) {
        console.error(`Library not found at: ${libraryPath}`);
        await this.installLibrary(library);
        this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
          status: 'verifying_libraries',
          message: `Library ${library.name} installed successfully`,
          step: VerificationSteps.VERIFYING_LIBRARIES,
          steps: VerificationSteps.COUNT,
          finished: false,
        });
      }

      // Native detection using isNativeLibrary and processLibrary logic
      if (this.isNativeLibrary(library.name)) {
        // Standard natives (artifact)
        if (library.downloads?.artifact) {
          const artifact = library.downloads.artifact;
          const nativePath = path.join(this.librariesPath, artifact.path);
          if (!(await fs.pathExists(nativePath))) {
            await downloadFile(artifact.url, nativePath);
            this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
              status: 'verifying_libraries',
              message: `Native ${library.name} (artifact) downloaded successfully`,
              step: VerificationSteps.VERIFYING_LIBRARIES,
              steps: VerificationSteps.COUNT,
              finished: false,
            });
          }
          nativesToExtract.push({ path: nativePath, extract: library.extract });
        }
        // Legacy natives (classifiers)
        if (library.downloads?.classifiers && library.natives) {
          const osName = this.getOSName();
          const arch = this.getOSArch();
          const possibleNativeKeys = [
            library.natives[osName],
            library.natives[osName + '-' + arch],
            osName,
          ].filter(Boolean);
          for (const nativeKey of possibleNativeKeys) {
            if (library.downloads.classifiers[nativeKey]) {
              const classifier = library.downloads.classifiers[nativeKey];
              const nativePath = path.join(this.librariesPath, classifier.path);
              if (!(await fs.pathExists(nativePath))) {
                await downloadFile(classifier.url, nativePath);
                this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
                  status: 'verifying_libraries',
                  message: `Native ${library.name} (${nativeKey}) downloaded successfully`,
                  step: VerificationSteps.VERIFYING_LIBRARIES,
                  steps: VerificationSteps.COUNT,
                  finished: false,
                });
              }
              nativesToExtract.push({
                path: nativePath,
                extract: library.extract,
              });
              break;
            }
          }
        }
      }
    }

    // Extract natives after verification
    if (nativesToExtract.length > 0) {
      await this.extractNatives(nativesToExtract);
    } else {
      const nativeFiles = await fs.readdir(this.nativesPath);
      console.log(
        `Found ${nativeFiles.length} native files in ${this.nativesPath}`
      );
      for (const file of nativeFiles) {
        const filePath = path.join(this.nativesPath, file);
        const stats = await fs.stat(filePath);
        if (stats.size === 0 && !stats.isDirectory()) {
          console.warn(`Empty native file found: ${filePath}`);
          await fs.remove(filePath); // Remove empty files
        }
      }
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.VERIFICATION_STATUS, {
      status: 'verifying_libraries',
      message: 'Libraries verified successfully',
      step: VerificationSteps.VERIFYING_LIBRARIES,
      steps: VerificationSteps.COUNT,
      finished: true,
    });
  }

  private async getAllLibraries(manifest: Manifest): Promise<Library[]> {
    // First get vanilla libraries
    const vanillaVersionData = await this.getVersionData(manifest);

    // Then get Fabric libraries if they exist
    const fabricVersionData = await this.getFabricVersionData(manifest);

    // Combine libraries (Fabric libraries take precedence)
    const allLibraries = [
      ...(vanillaVersionData.libraries || []),
      ...(fabricVersionData?.libraries || []),
    ];

    return allLibraries.filter((lib) => this.shouldUseLibrary(lib));
  }

  private async installLibrary(library: Library): Promise<void> {
    const libraryPath = this.getLibraryPath(library.name);

    if (library.url && library.name && !library.downloads) {
      // Fabric-style library
      if (library.sha1 && library.size) {
        if (await this.verifyLibrary(libraryPath, library.sha1, library.size)) {
          console.log(`Library already installed: ${library.name}`);
          return;
        }
      }

      await fs.ensureDir(path.dirname(libraryPath));
      const downloadUrl = this.buildFabricLibraryUrl(library);
      await downloadFile(downloadUrl, libraryPath);
      console.log(`Installed Fabric library: ${library.name}`);
    } else if (library.downloads?.artifact) {
      const artifact = library.downloads.artifact;
      await fs.ensureDir(path.dirname(libraryPath));
      await downloadFile(artifact.url, libraryPath);
      console.log(`Installed standard library: ${library.name}`);
    } else {
      console.warn(`No valid download info for library: ${library.name}`);
    }
  }

  private getVersion = (path: string): string =>
    path.split('/').slice(-2, -1)[0];

  public async updateLibraries(
    oldManifest: Manifest,
    newManifest: Manifest
  ): Promise<void> {
    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'updating_libraries',
      message: 'Updating libraries...',
      step: UpdateSteps.UPDATING_LIBRARIES,
      steps: UpdateSteps.COUNT,
      finished: false,
    });

    // Get all libraries from the old manifest
    const oldLibraries = await this.getAllLibraries(oldManifest);
    const newLibraries = await this.getAllLibraries(newManifest);

    // Compare libraries and update as necessary
    for (const newLibrary of newLibraries) {
      const oldLibrary = oldLibraries.find(
        (lib) => lib.name === newLibrary.name
      );
      const oldLibraryArtifactPath = oldLibrary?.downloads?.artifact?.path;
      const newLibraryArtifactPath = newLibrary.downloads?.artifact?.path;
      if (
        !oldLibraryArtifactPath ||
        !newLibraryArtifactPath ||
        this.getVersion(oldLibraryArtifactPath) !==
          this.getVersion(newLibraryArtifactPath)
      ) {
        await this.installLibrary(newLibrary);
      }
    }

    // Remove libraries that are no longer in the new manifest
    for (const oldLibrary of oldLibraries) {
      const newLibrary = newLibraries.find(
        (lib) => lib.name === oldLibrary.name
      );
      if (!newLibrary) {
        await fs.remove(this.getLibraryPath(oldLibrary.name));
        console.log(`Removed old library: ${oldLibrary.name}`);
      }
    }

    // Verify all libraries after update
    const allLibraries = await this.getAllLibraries(newManifest);
    for (const library of allLibraries) {
      const libraryPath = this.publicLibraryPath(library.name);
      if (!(await fs.pathExists(libraryPath))) {
        console.error(`Library not found after update: ${library.name}`);
        await this.installLibrary(library);
      }
    }

    this.sendToRenderer(WEBSOCKET_EVENTS.UPDATE_STATUS, {
      status: 'updating_libraries',
      message: 'Libraries updated successfully',
      step: UpdateSteps.UPDATING_LIBRARIES,
      steps: UpdateSteps.COUNT,
      finished: true,
    });
  }
}
