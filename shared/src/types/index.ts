export interface MinecraftAccount {
  id: string;
  username: string;
  uuid: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  profilePicture?: string;
  isActive: boolean;
}

export interface MicrosoftAuthResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface GameProfile {
  id: string;
  name: string;
  minecraftVersion: string;
  modVersion: string;
  lastPlayed?: string;
  gameDirectory: string;
  javaPath?: string;
  allocatedMemory: number;
  javaArgs: string[];
  gameArgs: string[];
}

export interface ModInfo {
  id: string;
  name: string;
  version: string;
  fileName: string;
  filePath: string;
  size: number;
  checksum: string;
  downloadUrl: string;
  isRequired: boolean;
  lastUpdated: string;
}

export interface Status {
  status:
    | 'preparing'
    | 'downloading'
    | 'installing'
    | 'launching'
    | 'running'
    | 'error'
    | 'stopped';
  message: string;
  progress?: number;
  step?: number;
  steps?: number;
  details?: string;
}

export interface SystemInfo {
  os: string;
  arch: string;
  totalMemory: number;
  availableMemory: number;
  cpuCount: number;
  javaVersions: string[];
}

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  size: number;
  checksum: string;
  isRequired: boolean;
  releaseDate: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  actionUrl?: string;
  actionText?: string;
  isActive: boolean;
  priority: number;
  startDate: string;
  endDate?: string;
}

export interface GameInstance {
  id: string;
  profileId: string;
  accountId: string;
  processId?: number;
  startedAt: string;
  status: Status['status'];
  logPath: string;
}

export interface DownloadProgress {
  id: string;
  url: string;
  filePath: string;
  totalSize: number;
  downloadedSize: number;
  speed: number;
  eta: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LaunchOptions {
  accountId: string;
  serverIp?: string;
  serverPort?: number;
  offlineMode?: boolean;
}

export interface MinecraftInstallation {
  version: string;
  path: string;
  libraries: LibraryInfo[];
  assets: AssetInfo[];
  mainClass: string;
  arguments: string[];
  javaVersion?: string;
  installedAt: string;
}

export interface LibraryInfo {
  name: string;
  url: string;
  path: string;
  sha1: string;
  size: number;
  natives?: string;
}

export interface AssetInfo {
  name: string;
  hash: string;
  size: number;
  url: string;
}

export interface JavaVersion {
  id: string;
  name: string;
  version: string;
  architecture: string;
  os: string;
  url: string;
  sha1: string;
  size: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  category: string;
  tags: string[];
}

export interface ServerStatus {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  motd: string;
  version: string;
  ping: number;
}

export * from './index';
export * from './constants';
export * from './utils';
export * from './notifications';