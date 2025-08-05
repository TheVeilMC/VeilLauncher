import path from 'path';
import fs from 'fs';
import { Manifest } from '../services/LaunchService';
import { ClientManager } from '../managers/ClientManager';
import { LibraryManager } from '../managers/LibraryManager';
import { findJava } from '../services/JavaService';
import os from 'os';
import axios from 'axios';

interface LaunchArguments {
  javaPath: string;
  jvmArgs: string[];
  mainClass: string;
  gameArgs: string[];
  classpath: string;
  workingDirectory: string;
}

export interface UserProfile {
  uuid: string;
  username: string;
  accessToken: string;
  token: string;
}

export class LaunchArgumentsBuilder {
  private instanceDir: string;
  private manifest: Manifest;
  private clientManager: ClientManager;
  private libraryManager: LibraryManager;

  constructor(instanceDir: string, manifest: Manifest) {
    this.instanceDir = instanceDir;
    this.manifest = manifest;
    this.clientManager = new ClientManager(instanceDir, null as any);
    this.libraryManager = new LibraryManager(instanceDir, null as any);
  }

  // NEW: Setup proper LWJGL natives directory structure
  private async setupNativesDirectory(): Promise<string> {
    const nativesPath = path.join(this.instanceDir, '.minecraft', 'natives');

    // CRITICAL: Detect actual architecture mismatch
    const nodeArch = process.arch; // Node.js architecture
    const javaArch = await this.detectJavaArchitecture(); // Detect Java architecture

    console.log(`Node.js architecture: ${nodeArch}`);
    console.log(`Java architecture: ${javaArch}`);

    // Use Java architecture, not Node.js architecture
    const platform = this.getCurrentOS();
    const arch = javaArch === '64' ? 'x64' : 'x32';

    console.log(`Using platform: ${platform}, arch: ${arch}`);

    // Create the LWJGL expected directory structure
    const lwjglNativesPath = path.join(
      nativesPath,
      platform,
      arch,
      'org',
      'lwjgl'
    );

    // Ensure the directory structure exists
    if (!fs.existsSync(lwjglNativesPath)) {
      fs.mkdirSync(lwjglNativesPath, { recursive: true });
    }

    // Verify we have the right architecture natives
    const sampleDllPath = path.join(nativesPath, 'lwjgl.dll');
    if (fs.existsSync(sampleDllPath)) {
      const is64BitDll = await this.checkDllArchitecture(sampleDllPath);
      const expected64Bit = javaArch === '64';

      // if (is64BitDll !== expected64Bit) {
      //   throw new Error(
      //     `Architecture mismatch: Java is ${javaArch}-bit but natives are ${is64BitDll ? '64' : '32'}-bit. ` +
      //     `You need to download the correct ${javaArch}-bit natives for your Minecraft version.`
      //   );
      // }
    }

    // Map of files to copy based on platform
    const nativeFiles: { [key: string]: string[] } = {
      windows: [
        'lwjgl.dll',
        'lwjgl_opengl.dll',
        'lwjgl_stb.dll',
        'lwjgl_tinyfd.dll',
        'glfw.dll',
        'OpenAL.dll',
        'jemalloc.dll',
      ],
      linux: [
        'liblwjgl.so',
        'liblwjgl_opengl.so',
        'liblwjgl_stb.so',
        'liblwjgl_tinyfd.so',
        'libglfw.so',
        'libopenal.so',
        'libjemalloc.so',
      ],
      osx: [
        'liblwjgl.dylib',
        'liblwjgl_opengl.dylib',
        'liblwjgl_stb.dylib',
        'liblwjgl_tinyfd.dylib',
        'libglfw.dylib',
        'libopenal.dylib',
        'libjemalloc.dylib',
        'libglfw_async.dylib',
      ],
    };

    const filesToCopy = nativeFiles[platform] || [];

    // Copy native files to the proper LWJGL structure
    for (const filename of filesToCopy) {
      const sourcePath = path.join(nativesPath, filename);
      const destPath = path.join(lwjglNativesPath, filename);

      if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
        try {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Copied ${filename} to LWJGL structure`);
        } catch (error) {
          console.warn(`Failed to copy ${filename}:`, error);
        }
      }
    }

    console.log(`LWJGL natives path: ${lwjglNativesPath}`);
    console.log(`LWJGL natives contents:`, fs.readdirSync(lwjglNativesPath));

    return nativesPath; // Return the root natives path for java.library.path
  }

  // Detect Java architecture by checking system properties
  private async detectJavaArchitecture(): Promise<string> {
    const javaData = await findJava();
    if (!javaData) {
      throw new Error('Java installation not found');
    }

    try {
      const { spawn } = require('child_process');
      return new Promise<string>((resolve) => {
        const javaProcess = spawn(
          javaData.path,
          ['-XshowSettings:properties', '-version'],
          {
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );

        let output = '';
        javaProcess.stderr.on('data', (data: Buffer) => {
          output += data.toString();
        });

        javaProcess.on('close', () => {
          // Look for os.arch property
          const archMatch = output.match(/os\.arch = (.+)/);
          if (archMatch) {
            const arch = archMatch[1].trim();
            // Convert various arch strings to 32/64
            if (arch.includes('64') || arch === 'amd64' || arch === 'x86_64') {
              resolve('64');
            } else {
              resolve('32');
            }
          } else {
            // Fallback: assume 64-bit for modern systems
            console.warn('Could not detect Java architecture, assuming 64-bit');
            resolve('64');
          }
        });
      });
    } catch (error) {
      console.warn('Error detecting Java architecture:', error);
      // Fallback: assume 64-bit for modern systems
      return '64';
    }
  }

  // Check if a DLL is 64-bit or 32-bit
  private async checkDllArchitecture(dllPath: string): Promise<boolean> {
    try {
      const buffer = fs.readFileSync(dllPath);

      // PE header signature check
      const dosHeader = buffer.readUInt16LE(0);
      if (dosHeader !== 0x5a4d) {
        // 'MZ'
        throw new Error('Invalid DOS header');
      }

      const peHeaderOffset = buffer.readUInt32LE(0x3c);
      const peSignature = buffer.readUInt32LE(peHeaderOffset);
      if (peSignature !== 0x00004550) {
        // 'PE\0\0'
        throw new Error('Invalid PE header');
      }

      // Machine type is at offset 4 from PE header
      const machineType = buffer.readUInt16LE(peHeaderOffset + 4);

      // 0x014c = IMAGE_FILE_MACHINE_I386 (32-bit)
      // 0x8664 = IMAGE_FILE_MACHINE_AMD64 (64-bit)
      return machineType === 0x8664;
    } catch (error) {
      console.warn('Could not determine DLL architecture:', error);
      // Fallback: assume it matches the expected architecture
      return true;
    }
  }

  private getCurrentOS() {
    switch (os.platform()) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'macos'; // Note: LWJGL uses 'macos', not 'osx'
      case 'linux':
        return 'linux';
      default:
        return os.platform();
    }
  }

  public async buildLaunchArguments(
    userProfile: UserProfile
  ): Promise<LaunchArguments> {
    // Find Java installation
    const javaData = await findJava();
    if (!javaData) {
      throw new Error('Java installation not found');
    }

    // Setup natives directory structure FIRST
    const nativesPath = await this.setupNativesDirectory();

    // Get version data
    const versionData = await this.clientManager.getVersionData(this.manifest);

    // Build classpath
    const classpath = await this.buildClasspath();

    // Verify classpath is not empty
    if (!classpath || classpath.trim() === '') {
      throw new Error('Classpath is empty - cannot launch game');
    }

    await fs.rm(
      path.join(this.instanceDir, '.minecraft', 'classpath.txt'),
      { force: true },
      async () => {
        await fs.writeFile(
          path.join(this.instanceDir, '.minecraft', 'classpath.txt'),
          classpath,
          { encoding: 'utf8' },
          () => {
            console.log('Classpath written to classpath.txt');
          }
        );
      }
    );

    // Build JVM arguments with proper natives path
    const jvmArgs = await this.buildJvmArguments(
      userProfile,
      nativesPath,
      classpath
    );

    // Build game arguments
    const gameArgs = await this.buildGameArguments(userProfile);

    // Working directory
    const workingDirectory = path.join(this.instanceDir, '.minecraft');

    return {
      javaPath: javaData.path,
      jvmArgs,
      mainClass: versionData.mainClass,
      gameArgs,
      classpath,
      workingDirectory,
    };
  }

  private async buildJvmArguments(
    userProfile: UserProfile,
    nativesPath: string,
    classpath: string
  ): Promise<string[]> {
    const jvmArgs: string[] = [];

    // Default JVM arguments
    jvmArgs.push(
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+UseG1GC',
      '-XX:G1NewSizePercent=20',
      '-XX:G1ReservePercent=20',
      '-XX:MaxGCPauseMillis=50',
      '-XX:G1HeapRegionSize=32M'
    );

    // Memory allocation
    const memoryMB = this.manifest.clientSettings.allocatedMemory || 4096;
    jvmArgs.push(`-Xmx${memoryMB}M`, `-Xms${memoryMB}M`);

    // Heap dump path
    jvmArgs.push(
      '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump'
    );

    // Working directory
    const workingDir = path.join(this.instanceDir, '.minecraft');
    jvmArgs.push(`-Duser.dir=${workingDir}`);

    // Native library paths - CRITICAL: Use the root natives path
    console.log(`Setting java.library.path to: ${nativesPath}`);

    // Essential native library arguments
    jvmArgs.push(`-Djava.library.path=${nativesPath}`);
    jvmArgs.push(`-Djna.tmpdir=${nativesPath}`);
    jvmArgs.push(`-Dorg.lwjgl.system.SharedLibraryExtractPath=${nativesPath}`);
    jvmArgs.push(`-Dio.netty.native.workdir=${nativesPath}`);

    // LWJGL debugging (remove these in production)
    jvmArgs.push('-Dorg.lwjgl.util.Debug=true');
    jvmArgs.push('-Dorg.lwjgl.util.DebugLoader=true');

    // Launcher branding
    jvmArgs.push('-Dminecraft.launcher.brand=the-veil-launcher');
    jvmArgs.push('-Dminecraft.launcher.version=1.0.0');

    const res = await axios.get(
      `${process.env.NODE_ENV ? 'http://localhost:3001' : 'https://veilapi.ogmatrix.net'}/api/user/certificate`,
      { headers: { Authorization: `Bearer ${userProfile.token}` } }
    );

    jvmArgs.push('-Dminecraft.player.privateKey=' + res.data.privateKey);
    jvmArgs.push('-Dminecraft.player.publicKey=' + res.data.publicKey);
    jvmArgs.push(
      '-Dminecraft.player.keySignature=' + res.data.publicKeySignature
    );

    // Version-specific JVM arguments
    const versionData = await this.clientManager.getVersionData(this.manifest);
    if (versionData.arguments && versionData.arguments.jvm) {
      for (const arg of versionData.arguments.jvm) {
        if (typeof arg === 'string') {
          const processedArg = this.replaceArgumentVariables(arg, userProfile);
          if (!this.isDuplicateNativeArg(processedArg, jvmArgs)) {
            jvmArgs.push(processedArg);
          }
        } else if (arg.rules && this.evaluateRules(arg.rules)) {
          if (Array.isArray(arg.value)) {
            arg.value.forEach((v) => {
              const processedArg = this.replaceArgumentVariables(
                v,
                userProfile
              );
              if (!this.isDuplicateNativeArg(processedArg, jvmArgs)) {
                jvmArgs.push(processedArg);
              }
            });
          } else {
            const processedArg = this.replaceArgumentVariables(
              arg.value,
              userProfile
            );
            if (!this.isDuplicateNativeArg(processedArg, jvmArgs)) {
              jvmArgs.push(processedArg);
            }
          }
        }
      }
    }

    console.log('Final JVM Args:', jvmArgs);
    return jvmArgs;
  }

  // Helper method to prevent duplicate native library arguments
  private isDuplicateNativeArg(arg: string, existingArgs: string[]): boolean {
    const nativeArgPrefixes = [
      '-Djava.library.path=',
      '-Djna.tmpdir=',
      '-Dorg.lwjgl.system.SharedLibraryExtractPath=',
      '-Dio.netty.native.workdir=',
      '-Dminecraft.launcher.brand=',
      '-Dminecraft.launcher.version=',
      '-DFabricMcEmu=',
    ];

    const isNativeArg = nativeArgPrefixes.some((prefix) =>
      arg.startsWith(prefix)
    );
    if (!isNativeArg) return false;

    const argPrefix = nativeArgPrefixes.find((prefix) =>
      arg.startsWith(prefix)
    );
    return existingArgs.some((existing) => existing.startsWith(argPrefix!));
  }

  private async buildClasspath(): Promise<string> {
    const classpathEntries: string[] = [];

    // Add libraries to classpath
    const versionData = await this.clientManager.getVersionData(this.manifest);

    for (const library of versionData.libraries) {
      if (this.shouldIncludeLibrary(library)) {
        const libraryPath = this.libraryManager.publicLibraryPath(library.name);
        classpathEntries.push(libraryPath);
      }
    }

    // Add client JAR to classpath
    const clientPath = await this.clientManager.getClientPath(this.manifest);
    classpathEntries.push(clientPath);

    // Join classpath entries with platform-specific separator
    return classpathEntries.join(path.delimiter);
  }

  private shouldIncludeLibrary(library: any): boolean {
    // Check library rules
    if (library.rules) {
      for (const rule of library.rules) {
        if (rule.action === 'disallow' && this.matchesRule(rule)) {
          return false;
        }
        if (rule.action === 'allow' && !this.matchesRule(rule)) {
          return false;
        }
      }
    }
    return true;
  }

  private matchesRule(rule: any): boolean {
    if (rule.os) {
      const currentOS = this.getCurrentOS();
      if (rule.os.name && rule.os.name !== currentOS) {
        return false;
      }
      if (rule.os.version && !new RegExp(rule.os.version).test(os.release())) {
        return false;
      }
      if (rule.os.arch && rule.os.arch !== os.arch()) {
        return false;
      }
    }
    return true;
  }

  private async buildGameArguments(
    userProfile: UserProfile
  ): Promise<string[]> {
    let gameArgs: string[] = [];

    const versionData = await this.clientManager.getVersionData(this.manifest);

    // Handle legacy minecraftArguments format
    if (versionData.minecraftArguments) {
      const legacyArgs = versionData.minecraftArguments.split(' ');
      legacyArgs.forEach((arg) => {
        gameArgs.push(this.replaceArgumentVariables(arg, userProfile));
      });
    }
    // Handle modern arguments format
    else if (versionData.arguments && versionData.arguments.game) {
      for (const arg of versionData.arguments.game) {
        if (typeof arg === 'string') {
          gameArgs.push(this.replaceArgumentVariables(arg, userProfile));
        } else if (arg.rules && this.evaluateRules(arg.rules)) {
          if (Array.isArray(arg.value)) {
            arg.value.forEach((v) =>
              gameArgs.push(this.replaceArgumentVariables(v, userProfile))
            );
          } else {
            gameArgs.push(
              this.replaceArgumentVariables(arg.value, userProfile)
            );
          }
        }
      }
    }

    gameArgs = gameArgs.filter((arg: string) => arg !== '--demo');

    console.log('Game Args:', gameArgs);
    return gameArgs;
  }

  private evaluateRules(rules: any[]): boolean {
    for (const rule of rules) {
      const matches = this.matchesRule(rule);
      if (rule.action === 'allow' && !matches) {
        return false;
      }
      if (rule.action === 'disallow' && matches) {
        return false;
      }
    }
    return true;
  }

  private replaceArgumentVariables(
    arg: string,
    userProfile: UserProfile
  ): string {
    const workingDir = path.join(this.instanceDir, '.minecraft');
    const assetsPath = path.join(this.instanceDir, '.minecraft', 'assets');
    const nativesPath = path.join(this.instanceDir, '.minecraft', 'natives');

    const replacements: { [key: string]: string } = {
      '${auth_player_name}': userProfile.username,
      '${version_name}': this.manifest.mcVersion,
      '${game_directory}': workingDir,
      '${assets_root}': assetsPath,
      '${assets_index_name}': this.manifest.assets.index,
      '${auth_uuid}': userProfile.uuid,
      '${auth_access_token}': userProfile.accessToken,
      '${user_type}': 'msa',
      '${version_type}': 'release',
      '${natives_directory}': nativesPath,
      '${launcher_name}': 'the-veil-launcher',
      '${launcher_version}': '1.0.0',
      '${user_properties}': '{}',
      '${clientid}': '458e8dc0-b487-4167-96af-bc5bc991274c',
      '${classpath}':
        '@' + path.join(this.instanceDir, '.minecraft', 'classpath.txt') || '',
      '${auth_xuid}': '',
      '${resolution_width}': '854',
      '${resolution_height}': '480',
      '${quickPlayPath}': '',
      '${quickPlaySingleplayer}': '',
      '${quickPlayMultiplayer}': '',
      '${quickPlayRealms}': '',
    };

    let result = arg;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value
      );
    }

    return result;
  }

  public async getAssetsIndex(): Promise<string> {
    const versionData = await this.clientManager.getVersionData(this.manifest);
    return versionData.assets || this.manifest.mcVersion;
  }

  public async getNativesPath(): Promise<string> {
    return path.join(this.instanceDir, '.minecraft', 'natives');
  }

  public async getGameDirectory(): Promise<string> {
    return path.join(this.instanceDir, '.minecraft');
  }
}
