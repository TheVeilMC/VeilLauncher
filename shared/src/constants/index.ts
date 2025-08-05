export const MINECRAFT_VERSION = '1.20.1';
export const GAMEMODE_NAME = 'The Veil';
export const LAUNCHER_VERSION = '1.0.0';

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  PROFILE: '/api/profile',
  LAUNCH: '/api/launch',
  MODS: '/api/mods',
  UPDATES: '/api/updates',
  BANNERS: '/api/banners',
  NEWS: '/api/news',
  SYSTEM: '/api/system',
} as const;

export const WEBSOCKET_EVENTS = {
  LAUNCH_STATUS: 'launch_status',
  DOWNLOAD_PROGRESS: 'download_progress',
  MOD_UPDATE: 'mod_update',
  SYSTEM_STATUS: 'system_status',
  MINECRAFT_OUTPUT: 'minecraft_output',
  MINECRAFT_CLOSED: 'minecraft_closed',
  MINECRAFT_ERROR: 'minecraft_error',
  VERIFICATION_FAILED: 'verification_failed',
  VERIFICATION_STATUS: 'verification_status',
  UPDATE_STATUS: 'update_status',
  PROCESS_MEMORY_UPDATE: 'process_memory_update',
  PROCESS_PERFORMANCE_UPDATE: 'process_performance_update',
} as const;

export const MICROSOFT_AUTH = {
  CLIENT_ID: '458e8dc0-b487-4167-96af-bc5bc991274c', // Replace with actual client ID
  SCOPE: 'XboxLive.signin offline_access',
  REDIRECT_URI: 'http://localhost:3000/auth/callback',
} as const;

export const GAME_DIRECTORIES = {
  PROFILES: 'profiles',
  MODS: 'mods',
  MINECRAFT: 'minecraft',
  JAVA: 'java',
  LOGS: 'logs',
  CACHE: 'cache',
  TEMP: 'temp',
} as const;

export const DEFAULT_JAVA_ARGS = [
  '-Xmx4G',
  '-Xms2G',
  '-XX:+UseG1GC',
  '-XX:+ParallelRefProcEnabled',
  '-XX:MaxGCPauseMillis=200',
  '-XX:+UnlockExperimentalVMOptions',
  '-XX:+DisableExplicitGC',
  '-XX:+AlwaysPreTouch',
  '-XX:G1NewSizePercent=30',
  '-XX:G1MaxNewSizePercent=40',
  '-XX:G1HeapRegionSize=8M',
  '-XX:G1ReservePercent=20',
  '-XX:G1HeapWastePercent=5',
  '-XX:G1MixedGCCountTarget=4',
  '-XX:InitiatingHeapOccupancyPercent=15',
  '-XX:G1MixedGCLiveThresholdPercent=90',
  '-XX:G1RSetUpdatingPauseTimePercent=5',
  '-XX:SurvivorRatio=32',
  '-XX:+PerfDisableSharedMem',
  '-XX:MaxTenuringThreshold=1',
  '-Dusing.aikars.flags=https://mcflags.emc.gs',
  '-Daikars.new.flags=true',
] as const;

export const FILE_EXTENSIONS = {
  JAR: '.jar',
  JSON: '.json',
  LOG: '.log',
  ZIP: '.zip',
} as const;

export const URLS = {
  MINECRAFT_VERSIONS:
    'https://launchermeta.mojang.com/mc/game/version_manifest.json',
  FABRIC_META: 'https://meta.fabricmc.net/v2/versions',
  FORGE_META: 'https://files.minecraftforge.net/net/minecraftforge/forge',
  MOJANG_API: 'https://api.mojang.com',
  MINECRAFT_SERVICES: 'https://api.minecraftservices.com',
  XBOX_AUTH: 'https://user.auth.xboxlive.com',
  XSTS_AUTH: 'https://xsts.auth.xboxlive.com',
  MICROSOFT_AUTH: 'https://login.microsoftonline.com',
} as const;

export const TIMEOUTS = {
  HTTP_REQUEST: 30000,
  DOWNLOAD: 300000,
  LAUNCH: 60000,
  AUTH: 120000,
} as const;

export const RETRY_ATTEMPTS = {
  DOWNLOAD: 3,
  HTTP_REQUEST: 2,
  AUTH: 2,
} as const;
