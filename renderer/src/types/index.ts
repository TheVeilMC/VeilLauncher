export interface MinecraftAccount {
  id: string;
  username: string;
  uuid: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  profile_picture?: string;
  is_active: boolean;
}

export interface MicrosoftAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface LauncherProfile {
  id: string;
  name: string;
  minecraft_version: string;
  mod_loader: string;
  mod_loader_version: string;
  mods: ModInfo[];
  java_args: string[];
  game_args: string[];
  allocated_memory: number;
  java_path?: string;
  created_at: string;
  last_played?: string;
  resolution?: Resolution;
  icon?: string;
  custom_args?: string;
  environment_variables: Record<string, string>;
}

export interface ModInfo {
  id: string;
  name: string;
  version: string;
  file_name: string;
  file_path: string;
  enabled: boolean;
  required: boolean;
  author?: string;
  description?: string;
  url?: string;
  dependencies: string[];
  side: string;
  size: number;
  checksum: string;
  installed_at: string;
}

export interface Resolution {
  width: number;
  height: number;
  fullscreen: boolean;
}

export interface MinecraftVersion {
  id: string;
  version_type: string;
  url: string;
  time: string;
  release_time: string;
  sha1: string;
  compliance_level: number;
}

export interface ModLoader {
  id: string;
  name: string;
  version: string;
  minecraft_version: string;
  loader_type: string;
  stable: boolean;
  url: string;
  sha1: string;
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

export interface SkinData {
  id: string;
  name: string;
  texture_data: number[];
  is_slim: boolean;
  created_at: string;
  file_path: string;
}

export interface SystemInfo {
  os: string;
  arch: string;
  total_memory: number;
  available_memory: number;
  cpu_count: number;
  java_versions: string[];
}

export interface GameInstance {
  id: string;
  profile_id: string;
  account_id: string;
  process_id?: number;
  started_at: string;
  log_path: string;
  crash_reports: CrashReport[];
}

export interface CrashReport {
  id: string;
  timestamp: string;
  error_message: string;
  stack_trace: string;
  mod_list: string[];
  system_info: string;
}

export interface LaunchOptions {
  profile_id: string;
  account_id: string;
  server_ip?: string;
  server_port?: number;
  demo_mode: boolean;
  offline_mode: boolean;
}

export interface DownloadProgress {
  id: string;
  url: string;
  file_path: string;
  total_size: number;
  downloaded_size: number;
  speed: number;
  eta: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
}

export interface BuildStatus {
  id: string;
  project_path: string;
  status: 'building' | 'success' | 'failed';
  progress: number;
  logs: string[];
  output_path?: string;
  error?: string;
}
