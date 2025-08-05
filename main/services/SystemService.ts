import { ipcMain } from 'electron';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path/win32';
import { findJava } from './JavaService';

const execAsync = promisify(exec);

export class SystemManager {
  public initialize(): void {
    ipcMain.handle('get-system-info', this.getSystemInfo.bind(this));
    ipcMain.handle('get-java-versions', this.getJavaVersions.bind(this));
    ipcMain.handle('get-memory-info', this.getMemoryInfo.bind(this));
    ipcMain.handle('get-disk-info', this.getDiskInfo.bind(this));
    ipcMain.handle('get-minecraft-path', this.getMinecraftPath.bind(this));
    ipcMain.handle('get-common-java-paths', this.getCommonJavaPaths.bind(this));
    ipcMain.handle('get-java-path', this.getJavaPath.bind(this));
    ipcMain.handle('get-java-version', this.getJavaVersion.bind(this));
  }

  private async getSystemInfo(): Promise<any> {
    return {
      os: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      availableMemory: os.freemem(),
      cpuCount: os.cpus().length,
      hostname: os.hostname(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      javaVersions: await this.findJavaVersions(),
      platform: process.platform,
    };
  }

  private async getJavaPath(): Promise<string> {
    const javaPath = await findJava();
    if (!javaPath) {
      throw new Error('Java not found');
    }
    return javaPath.path;
  }

  private async getJavaVersion(): Promise<string> {
    const javaPath = await findJava();
    if (!javaPath) {
      throw new Error('Java not found');
    }
    return javaPath.version;
  }

  private async getJavaVersions(): Promise<string[]> {
    const javaVersions: string[] = [];
    try {
      const versions = await this.findJavaVersions();
      javaVersions.push(...versions);
    } catch (error) {
      console.error('Failed to get Java versions:', error);
    }
    return javaVersions;
  }

  private async getMemoryInfo(): Promise<any> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100),
    };
  }

  private async getDiskInfo(): Promise<any> {
    let diskInfo = {};

    if (os.platform() === 'win32') {
      try {
        const { stdout } = await execAsync(
          'wmic logicaldisk get size,freespace,caption'
        );
        // Parse Windows disk info
        diskInfo = { windows: stdout };
      } catch (error) {
        diskInfo = { error: 'Failed to get Windows disk info' };
      }
    } else {
      try {
        const { stdout } = await execAsync('df -h');
        diskInfo = { unix: stdout };
      } catch (error) {
        diskInfo = { error: 'Failed to get Unix disk info' };
      }
    }

    return diskInfo;
  }

  private async findJavaVersions(): Promise<string[]> {
    const javaVersions: string[] = [];

    try {
      // Check system Java
      const { stdout, stderr } = await execAsync('java -version 2>&1');
      const output = stdout || stderr;
      if (output) {
        const versionMatch = output.match(/version "([^"]+)"/);
        if (versionMatch) {
          javaVersions.push(`System Java: ${versionMatch[1]}`);
        }
      }
    } catch (error) {
      // Java not found in PATH
      javaVersions.push('System Java: Not found');
    }

    // Check common Java installation paths
    const commonPaths = this.getCommonJavaPaths();

    for (const javaPath of commonPaths) {
      try {
        const { stdout, stderr } = await execAsync(
          `"${javaPath}" -version 2>&1`
        );
        const output = stdout || stderr;
        if (output) {
          const versionMatch = output.match(/version "([^"]+)"/);
          if (versionMatch) {
            javaVersions.push(`${javaPath}: ${versionMatch[1]}`);
          }
        }
      } catch (error) {
        // Java path not valid
      }
    }

    return javaVersions;
  }

  private getCommonJavaPaths(): string[] {
    const platform = os.platform();

    if (platform === 'win32') {
      return [
        'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
        'C:\\Program Files\\Java\\jdk-11\\bin\\java.exe',
        'C:\\Program Files\\Java\\jdk-8\\bin\\java.exe',
        'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.8.7-hotspot\\bin\\java.exe',
        'C:\\Program Files\\OpenJDK\\openjdk-17\\bin\\java.exe',
      ];
    } else if (platform === 'darwin') {
      return [
        '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home/bin/java',
        '/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home/bin/java',
        '/usr/bin/java',
      ];
    } else {
      return [
        '/usr/lib/jvm/java-17-openjdk/bin/java',
        '/usr/lib/jvm/java-11-openjdk/bin/java',
        '/usr/bin/java',
        '/opt/java/openjdk/bin/java',
      ];
    }
  }

  private getMinecraftPath(): string {
    const platform = os.platform();
    if (platform === 'win32') {
      return process.env.APPDATA
        ? path.join(process.env.APPDATA, '.minecraft')
        : '';
    } else if (platform === 'darwin') {
      return path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'minecraft'
      );
    } else {
      return path.join(os.homedir(), '.minecraft');
    }
  }
}
