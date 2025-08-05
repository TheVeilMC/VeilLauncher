import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

interface JavaInstallation {
  /** Full path to java executable */
  path: string;
  /** Java version (e.g., "17.0.2") */
  version: string;
  /** Major version number (e.g., 17) */
  majorVersion: number;
  /** Vendor (e.g., "Oracle Corporation", "Eclipse Adoptium") */
  vendor: string;
  /** Architecture (e.g., "x64", "aarch64") */
  architecture: string;
  /** Installation type (e.g., "system", "bundled", "portable") */
  type: 'system' | 'bundled' | 'portable' | 'registry';
  /** Whether this is the default Java on PATH */
  isDefault: boolean;
  /** Full installation directory */
  javaHome: string;
}

interface JavaFinderOptions {
  /** Minimum Java version required (default: 17) */
  minVersion?: number;
  /** Maximum Java version allowed (default: 21) */
  maxVersion?: number;
  /** Preferred vendors in order of preference */
  preferredVendors?: string[];
  /** Whether to include 32-bit Java installations (default: false) */
  include32Bit?: boolean;
  /** Custom search paths to include */
  customPaths?: string[];
  /** Timeout for Java execution tests in ms (default: 10000) */
  timeout?: number;
}

class SecureJavaFinder {
  private static readonly DEFAULT_MIN_VERSION = 17;
  private static readonly DEFAULT_MAX_VERSION = 21;
  private static readonly DEFAULT_TIMEOUT = 10000;

  // Common Java executable names
  private static readonly JAVA_EXECUTABLES =
    process.platform === 'win32' ? ['java.exe', 'javaw.exe'] : ['java'];

  /**
   * Find the best available Java installation on the system
   */
  static async findJava(
    options: JavaFinderOptions = {}
  ): Promise<JavaInstallation | null> {
    const {
      minVersion = this.DEFAULT_MIN_VERSION,
      maxVersion = this.DEFAULT_MAX_VERSION,
      preferredVendors = [
        'Eclipse Adoptium',
        'Oracle Corporation',
        'Amazon.com Inc.',
      ],
      include32Bit = false,
      customPaths = [],
      timeout = this.DEFAULT_TIMEOUT,
    } = options;

    try {
      // Find all Java installations
      const installations = await this.findAllJavaInstallations(
        customPaths,
        timeout
      );

      if (installations.length === 0) {
        return null;
      }

      // Filter by version requirements
      const validInstallations = installations.filter((java) => {
        return (
          java.majorVersion >= minVersion &&
          java.majorVersion <= maxVersion &&
          (include32Bit || !java.architecture.includes('32'))
        );
      });

      if (validInstallations.length === 0) {
        return null;
      }

      // Sort by preference: default > preferred vendors > higher version
      validInstallations.sort((a, b) => {
        // Prefer default Java
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;

        // Prefer preferred vendors
        const aVendorIndex = preferredVendors.indexOf(a.vendor);
        const bVendorIndex = preferredVendors.indexOf(b.vendor);

        if (aVendorIndex !== -1 && bVendorIndex === -1) return -1;
        if (aVendorIndex === -1 && bVendorIndex !== -1) return 1;
        if (aVendorIndex !== -1 && bVendorIndex !== -1) {
          if (aVendorIndex !== bVendorIndex) return aVendorIndex - bVendorIndex;
        }

        // Prefer higher version
        return b.majorVersion - a.majorVersion;
      });

      return validInstallations[0];
    } catch (error) {
      console.error('Error finding Java installation:', error);
      return null;
    }
  }

  /**
   * Find all Java installations on the system
   */
  static async findAllJavaInstallations(
    customPaths: string[] = [],
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<JavaInstallation[]> {
    const installations: JavaInstallation[] = [];
    const foundPaths = new Set<string>();

    // 1. Check default Java on PATH
    try {
      const defaultJava = await this.checkDefaultJava(timeout);
      if (defaultJava && !foundPaths.has(defaultJava.path)) {
        installations.push(defaultJava);
        foundPaths.add(defaultJava.path);
      }
    } catch (error) {
      console.warn('No default Java found on PATH');
    }

    // 2. Platform-specific searches
    const platformPaths = await this.getPlatformSpecificPaths();
    const allPaths = [...platformPaths, ...customPaths];

    // 3. Search in common installation directories
    for (const searchPath of allPaths) {
      try {
        const javas = await this.searchJavaInDirectory(searchPath, timeout);
        for (const java of javas) {
          if (!foundPaths.has(java.path)) {
            installations.push(java);
            foundPaths.add(java.path);
          }
        }
      } catch (error) {
        // Continue searching even if one directory fails
      }
    }

    // 4. Windows Registry search
    if (process.platform === 'win32') {
      try {
        const registryJavas = await this.searchWindowsRegistry(timeout);
        for (const java of registryJavas) {
          if (!foundPaths.has(java.path)) {
            installations.push(java);
            foundPaths.add(java.path);
          }
        }
      } catch (error: any) {
        console.warn('Registry search failed:', error.message);
      }
    }

    return installations;
  }

  /**
   * Check the default Java installation on PATH
   */
  private static async checkDefaultJava(
    timeout: number
  ): Promise<JavaInstallation | null> {
    try {
      const javaPath = await this.findJavaExecutable('java');
      if (!javaPath) return null;

      const javaInfo = await this.getJavaInfo(javaPath, timeout);
      if (!javaInfo) return null;

      return {
        ...javaInfo,
        path: javaPath,
        type: 'system',
        isDefault: true,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get platform-specific search paths
   */
  private static async getPlatformSpecificPaths(): Promise<string[]> {
    const paths: string[] = [];

    switch (process.platform) {
      case 'win32':
        paths.push(
          'C:\\Program Files\\Java',
          'C:\\Program Files (x86)\\Java',
          'C:\\Program Files\\Eclipse Adoptium',
          'C:\\Program Files (x86)\\Eclipse Adoptium',
          'C:\\Program Files\\Amazon Corretto',
          'C:\\Program Files (x86)\\Amazon Corretto',
          'C:\\Users\\' + os.userInfo().username + '\\scoop\\apps',
          process.env.LOCALAPPDATA + '\\Programs\\Java' || ''
        );
        break;

      case 'darwin':
        paths.push(
          '/Library/Java/JavaVirtualMachines',
          '/System/Library/Java/JavaVirtualMachines',
          '/usr/libexec/java_home',
          '/opt/homebrew/opt',
          '/usr/local/opt',
          os.homedir() + '/Library/Java/JavaVirtualMachines'
        );
        break;

      case 'linux':
        paths.push(
          '/usr/lib/jvm',
          '/usr/java',
          '/opt/java',
          '/opt/jdk',
          '/opt/openjdk',
          '/snap/openjdk',
          os.homedir() + '/.sdkman/candidates/java',
          os.homedir() + '/.jdks'
        );
        break;
    }

    // Filter out non-existent paths
    const existingPaths: string[] = [];
    for (const dirPath of paths) {
      if (dirPath && (await fs.pathExists(dirPath))) {
        existingPaths.push(dirPath);
      }
    }

    return existingPaths;
  }

  /**
   * Search for Java installations in a directory
   */
  private static async searchJavaInDirectory(
    directory: string,
    timeout: number
  ): Promise<JavaInstallation[]> {
    const installations: JavaInstallation[] = [];

    try {
      if (!(await fs.pathExists(directory))) {
        return installations;
      }

      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const jdkPath = path.join(directory, entry.name);
        const javaPaths = await this.findJavaExecutablesInJDK(jdkPath);

        for (const javaPath of javaPaths) {
          try {
            const javaInfo = await this.getJavaInfo(javaPath, timeout);
            if (javaInfo) {
              installations.push({
                ...javaInfo,
                path: javaPath,
                type: 'bundled',
                isDefault: false,
              });
            }
          } catch (error) {
            // Continue with next Java executable
          }
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }

    return installations;
  }

  /**
   * Find Java executables within a JDK installation
   */
  private static async findJavaExecutablesInJDK(
    jdkPath: string
  ): Promise<string[]> {
    const javaPaths: string[] = [];
    const possibleBinPaths = [
      path.join(jdkPath, 'bin'),
      path.join(jdkPath, 'Contents', 'Home', 'bin'), // macOS
      jdkPath, // Direct executable path
    ];

    for (const binPath of possibleBinPaths) {
      for (const executable of this.JAVA_EXECUTABLES) {
        const javaPath = path.join(binPath, executable);
        if (await fs.pathExists(javaPath)) {
          try {
            await fs.access(javaPath, fs.constants.F_OK | fs.constants.X_OK);
            javaPaths.push(javaPath);
            break; // Found working executable in this bin directory
          } catch (error) {
            // Executable not accessible, try next
          }
        }
      }
    }

    return javaPaths;
  }

  /**
   * Search Windows Registry for Java installations
   */
  private static async searchWindowsRegistry(
    timeout: number
  ): Promise<JavaInstallation[]> {
    if (process.platform !== 'win32') return [];

    const installations: JavaInstallation[] = [];
    const registryPaths = [
      'HKLM\\SOFTWARE\\JavaSoft\\Java Runtime Environment',
      'HKLM\\SOFTWARE\\JavaSoft\\Java Development Kit',
      'HKLM\\SOFTWARE\\WOW6432Node\\JavaSoft\\Java Runtime Environment',
      'HKLM\\SOFTWARE\\WOW6432Node\\JavaSoft\\Java Development Kit',
      'HKLM\\SOFTWARE\\Eclipse Adoptium',
      'HKLM\\SOFTWARE\\WOW6432Node\\Eclipse Adoptium',
    ];

    for (const registryPath of registryPaths) {
      try {
        const { stdout } = await execAsync(`reg query "${registryPath}" /s`, {
          timeout,
        });
        const matches = stdout.match(/JavaHome\s+REG_SZ\s+(.+)/g);

        if (matches) {
          for (const match of matches) {
            const javaHome = match.replace(/JavaHome\s+REG_SZ\s+/, '').trim();
            const javaPaths = await this.findJavaExecutablesInJDK(javaHome);

            for (const javaPath of javaPaths) {
              try {
                const javaInfo = await this.getJavaInfo(javaPath, timeout);
                if (javaInfo) {
                  installations.push({
                    ...javaInfo,
                    path: javaPath,
                    type: 'registry',
                    isDefault: false,
                  });
                }
              } catch (error) {
                // Continue with next installation
              }
            }
          }
        }
      } catch (error) {
        // Registry key might not exist
      }
    }

    return installations;
  }

  /**
   * Get Java information by executing java -version
   */
  private static async getJavaInfo(
    javaPath: string,
    timeout: number
  ): Promise<Omit<JavaInstallation, 'path' | 'type' | 'isDefault'> | null> {
    try {
      // Security check: ensure the path is safe
      if (!this.isSecurePath(javaPath)) {
        throw new Error('Unsafe Java path detected');
      }

      const { stdout, stderr } = await execAsync(`"${javaPath}" -version`, {
        timeout,
      });
      const versionOutput = stderr || stdout; // Java outputs version to stderr

      // Parse version information
      const versionMatch = versionOutput.match(/version "([^"]+)"/);
      const vendorMatch = versionOutput.match(
        /(?:OpenJDK|Java\(TM\) SE) Runtime Environment[^\n]*\n[^\n]*\(build[^)]*\)(?:\n(.*))?/
      );

      if (!versionMatch) {
        throw new Error('Could not parse Java version');
      }

      const fullVersion = versionMatch[1];
      const majorVersion = this.parseMajorVersion(fullVersion);
      const vendor = this.parseVendor(versionOutput);
      const architecture = this.parseArchitecture(versionOutput);
      const javaHome = await this.getJavaHome(javaPath);

      return {
        version: fullVersion,
        majorVersion,
        vendor,
        architecture,
        javaHome,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse major version from full version string
   */
  private static parseMajorVersion(versionString: string): number {
    // Handle both old format (1.8.0_xxx) and new format (17.0.x)
    if (versionString.startsWith('1.')) {
      const match = versionString.match(/1\.(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } else {
      const match = versionString.match(/^(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
  }

  /**
   * Parse vendor information from version output
   */
  private static parseVendor(versionOutput: string): string {
    if (versionOutput.includes('Eclipse Adoptium')) return 'Eclipse Adoptium';
    if (versionOutput.includes('Amazon')) return 'Amazon.com Inc.';
    if (versionOutput.includes('Oracle')) return 'Oracle Corporation';
    if (versionOutput.includes('OpenJDK')) return 'OpenJDK';
    if (versionOutput.includes('Microsoft')) return 'Microsoft';
    if (versionOutput.includes('Azul')) return 'Azul Systems, Inc.';
    return 'Unknown';
  }

  /**
   * Parse architecture from version output
   */
  private static parseArchitecture(versionOutput: string): string {
    if (
      versionOutput.includes('64-Bit') ||
      versionOutput.includes('x86_64') ||
      versionOutput.includes('amd64')
    ) {
      return 'x64';
    }
    if (versionOutput.includes('aarch64') || versionOutput.includes('arm64')) {
      return 'aarch64';
    }
    if (versionOutput.includes('x86') || versionOutput.includes('i386')) {
      return 'x86';
    }
    return 'unknown';
  }

  /**
   * Get JAVA_HOME for a given Java executable
   */
  private static async getJavaHome(javaPath: string): Promise<string> {
    try {
      // Go up from bin/java to find JAVA_HOME
      let currentPath = path.dirname(javaPath);

      // Handle different directory structures
      if (path.basename(currentPath) === 'bin') {
        currentPath = path.dirname(currentPath);
      }

      // macOS specific: handle Contents/Home structure
      if (currentPath.includes('Contents/Home')) {
        currentPath = currentPath.replace(/\/Contents\/Home.*/, '');
      }

      return currentPath;
    } catch (error) {
      return path.dirname(path.dirname(javaPath));
    }
  }

  /**
   * Find Java executable on PATH
   */
  private static async findJavaExecutable(
    executable: string
  ): Promise<string | null> {
    const pathEnv = process.env.PATH || '';
    const pathSeparator = process.platform === 'win32' ? ';' : ':';
    const paths = pathEnv.split(pathSeparator);

    for (const dirPath of paths) {
      if (!dirPath) continue;

      for (const javaExe of this.JAVA_EXECUTABLES) {
        if (javaExe.startsWith(executable)) {
          const fullPath = path.join(dirPath, javaExe);
          try {
            await fs.access(fullPath, fs.constants.F_OK | fs.constants.X_OK);
            return fullPath;
          } catch (error) {
            // Continue searching
          }
        }
      }
    }

    return null;
  }

  /**
   * Security check for Java path
   */
  private static isSecurePath(javaPath: string): boolean {
    const normalizedPath = path.normalize(javaPath);

    // Prevent path traversal
    if (normalizedPath.includes('..')) {
      return false;
    }

    // Ensure it's an actual Java executable
    const basename = path.basename(normalizedPath).toLowerCase();
    const validNames = this.JAVA_EXECUTABLES.map((name) => name.toLowerCase());

    return validNames.includes(basename);
  }
}

// Export main functions
export const findJava = SecureJavaFinder.findJava.bind(SecureJavaFinder);
export const findAllJavaInstallations =
  SecureJavaFinder.findAllJavaInstallations.bind(SecureJavaFinder);

// Export types
export type { JavaInstallation, JavaFinderOptions };
