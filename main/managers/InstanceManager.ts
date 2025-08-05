import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { Manifest } from '../services/LaunchService';

export class InstanceManager {
  private instancePath: string;
  private instances: Map<string, any> = new Map();

  constructor() {
    this.instancePath = path.join(app.getPath('userData'), 'instances');

    console.log(
      `InstanceManager initialized. Instance path: ${this.instancePath}`
    );
    this.ensureInstancePath();
  }

  private ensureInstancePath(): void {
    if (!fs.existsSync(this.instancePath)) {
      fs.mkdirSync(this.instancePath, { recursive: true });
      console.log(`Instance path created: ${this.instancePath}`);
    } else {
      console.log(`Instance path already exists: ${this.instancePath}`);
    }
  }

  public async checkInstancePathExists(instanceId: string): Promise<boolean> {
    if (!this.instancePath) {
      console.error('Instance path is not set.');
      return false;
    }
    if (!(await fs.pathExists(path.join(this.instancePath, instanceId)))) {
      console.error(
        `Instance path does not exist: ${path.join(this.instancePath, instanceId)}`
      );
      return false;
    }
    console.log(
      `Instance path exists: ${path.join(this.instancePath, instanceId)}`
    );
    return true;
  }

  public async createInstanceDirectory(
    instanceId: string,
    manifest: Manifest
  ): Promise<void> {
    const instanceDir = path.join(this.instancePath, instanceId);
    await fs.ensureDir(instanceDir);
    this.instances.set(instanceId, instanceDir);
    await this.createInstanceDirectories(
      instanceId,
      manifest.directories || []
    );
    console.log(`Instance directory created: ${instanceDir}`);
  }

  public getInstancePath(): string {
    return this.instancePath;
  }

  public getInstanceDirectory(instanceId: string): string | undefined {
    return this.instances.get(instanceId);
  }

  public async removeInstanceDirectory(instanceId: string): Promise<void> {
    const instanceDir = this.getInstanceDirectory(instanceId);
    if (instanceDir) {
      await fs.remove(instanceDir);
      this.instances.delete(instanceId);
      console.log(`Instance directory removed: ${instanceDir}`);
    } else {
      console.warn(`Instance directory not found for ID: ${instanceId}`);
    }
  }

  public getAllInstances(): Map<string, any> {
    return this.instances;
  }

  public async checkForInstances(): Promise<boolean> {
    await this.ensureInstancePath();
    const files = await fs.readdir(this.instancePath);
    if (files.length === 0) {
      console.log('No instances found.');
      return false;
    }
    for (const file of files) {
      const filePath = path.join(this.instancePath, file);
      this.instances.set(file, filePath);
    }
    console.log(`Found ${files.length} instances in ${this.instancePath}.`);
    return true;
  }

  public async createInstanceConfig(
    instanceId: string,
    config: Manifest
  ): Promise<void> {
    const instanceDir = this.getInstanceDirectory(instanceId);
    if (!instanceDir) {
      throw new Error(`Instance directory not found for ID: ${instanceId}`);
    }
    const configPath = path.join(instanceDir, 'config.json');
    await fs.writeJson(configPath, config, { spaces: 2 });
    console.log(`Instance configuration created at: ${configPath}`);
  }

  public async getInstanceConfig(instanceId: string): Promise<Manifest | null> {
    const instanceDir = this.getInstanceDirectory(instanceId);
    if (!instanceDir) {
      console.warn(`Instance directory not found for ID: ${instanceId}`);
      return null;
    }
    const configPath = path.join(instanceDir, 'config.json');
    if (await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
    console.warn(`Configuration file not found for instance ID: ${instanceId}`);
    return null;
  }

  public async createInstanceDirectories(
    instanceId: string,
    directories: string[]
  ): Promise<void> {
    const instanceDir = this.getInstanceDirectory(instanceId);
    if (!instanceDir) {
      throw new Error(`Instance directory not found for ID: ${instanceId}`);
    }
    for (const dir of directories) {
      const dirPath = path.join(instanceDir, dir);
      await fs.ensureDir(dirPath);
      console.log(`Directory created: ${dirPath}`);
    }
  }

  public async checkInstanceConfigExists(instanceId: string): Promise<boolean> {
    const instanceDir = this.getInstanceDirectory(instanceId);
    if (!instanceDir) {
      console.warn(`Instance directory not found for ID: ${instanceId}`);
      return false;
    }
    const configPath = path.join(instanceDir, 'config.json');
    const exists = await fs.pathExists(configPath);
    if (!exists) {
      console.warn(
        `Configuration file does not exist for instance ID: ${instanceId}`
      );
    }
    return exists;
  }
}
