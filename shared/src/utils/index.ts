import crypto from 'crypto';
import path from 'path';

export function generateId(): string {
  return crypto.randomUUID();
}

export function calculateSHA1(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

export function calculateMD5(data: Buffer): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

export function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[<>:"/\\|?*]/g, '_');
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number = 1000
): Promise<T> {
  return fn().catch(async (error) => {
    if (attempts <= 1) {
      throw error;
    }
    await delay(delayMs);
    return retry(fn, attempts - 1, delayMs);
  });
}

export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }
  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }
  return versionA.patch - versionB.patch;
}

export function isNewerVersion(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}

export function createProgressTracker() {
  let progress = 0;
  let total = 0;

  return {
    setTotal: (newTotal: number) => {
      total = newTotal;
    },
    increment: (amount: number = 1) => {
      progress = Math.min(progress + amount, total);
    },
    getProgress: () => progress,
    getTotal: () => total,
    getPercentage: () => (total > 0 ? Math.round((progress / total) * 100) : 0),
    reset: () => {
      progress = 0;
      total = 0;
    },
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
