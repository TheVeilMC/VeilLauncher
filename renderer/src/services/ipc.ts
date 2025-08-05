export const ipcService = {
  // System endpoints
  getSystemInfo: () => (window as any).electron.invoke('get-system-info'),
  getJavaVersions: () => (window as any).electron.invoke('get-java-versions'),
  getJavaVersion: () => (window as any).electron.invoke('get-java-version'),
  getMemoryInfo: () => (window as any).electron.invoke('get-memory-info'),
  getDiskInfo: () => (window as any).electron.invoke('get-disk-info'),
  getMinecraftPath: () => (window as any).electron.invoke('get-minecraft-path'),
  getCommonJavaPaths: () =>
    (window as any).electron.invoke('get-common-java-paths'),

  // Launch endpoints
  startGame: (options: any) =>
    (window as any).electron.invoke('launch-game', options),
  stopGame: (instanceId: string) =>
    (window as any).electron.invoke('stop-game', { instanceId }),
  getLaunchStatus: () => (window as any).electron.invoke('get-launch-status'),
  getGameLogs: (instanceId: string, gameDirectory: string) =>
    (window as any).electron.invoke('get-game-logs', {
      instanceId,
      gameDirectory,
    }),

  hardVerify: () => (window as any).electron.invoke('hard-verify'),
  updateInstance: () => (window as any).electron.invoke('update-instance'),
  checkUpdates: () => (window as any).electron.invoke('check-updates'),
  updateLauncher: () => (window as any).electron.invoke('update-launcher'),
};
