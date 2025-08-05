import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@the-veil/shared/src/types';
import router from '@/router';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // In development, connect to local server
    // In production, connect to your deployed API server
    this.baseURL =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : process.env.VITE_API_URL || 'https://veilapi.ogmatrix.net';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        router.push('/auth');
        if (error.response?.status === 401) {
          this.token = null;
          // Trigger re-authentication
          window.dispatchEvent(new CustomEvent('auth-required'));

          router.push('/auth');
        }
        return Promise.reject(error);
      }
    );
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public clearToken(): void {
    this.token = null;
  }

  // Auth endpoints
  public async startDeviceFlow(): Promise<ApiResponse> {
    const response = await this.client.post('/api/auth/start-device-flow');
    return response.data;
  }

  public async pollToken(deviceCode: string): Promise<ApiResponse> {
    const response = await this.client.post('/api/auth/poll-token', {
      deviceCode,
    });
    return response.data;
  }

  public async refreshToken(refreshToken: string): Promise<ApiResponse> {
    const response = await this.client.post('/api/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  public async logout(accountId?: string): Promise<ApiResponse> {
    const response = await this.client.post('/api/auth/logout', { accountId });
    return response.data;
  }

  public async getAuthStatus(): Promise<ApiResponse> {
    const response = await this.client.get('/api/auth/status');
    return response.data;
  }

  public async getChangelog(): Promise<ApiResponse> {
    const response = await this.client.get('/api/changelog');
    return response.data;
  }

  // Profile endpoints
  public async getProfile(): Promise<ApiResponse> {
    const response = await this.client.get('/api/profile');
    return response.data;
  }

  public async initializeProfile(): Promise<ApiResponse> {
    const response = await this.client.post('/api/profile/initialize');
    return response.data;
  }

  public async updateProfile(profileData: any): Promise<ApiResponse> {
    const response = await this.client.put('/api/profile/update', profileData);
    return response.data;
  }

  public async getGameDirectory(): Promise<ApiResponse> {
    const response = await this.client.get('/api/profile/directory');
    return response.data;
  }

  // Mod endpoints
  public async getMods(): Promise<ApiResponse> {
    const response = await this.client.get('/api/mods');
    return response.data;
  }

  public async checkModUpdates(): Promise<ApiResponse> {
    const response = await this.client.post('/api/mods/check-updates');
    return response.data;
  }

  public async updateMods(): Promise<ApiResponse> {
    const response = await this.client.post('/api/mods/update');
    return response.data;
  }

  public async getCurrentModVersion(): Promise<ApiResponse> {
    const response = await this.client.get('/api/mods/version');
    return response.data;
  }

  // Update endpoints
  public async checkForUpdates(): Promise<ApiResponse> {
    const response = await this.client.get('/api/updates/check');
    return response.data;
  }

  public async getLatestUpdate(): Promise<ApiResponse> {
    const response = await this.client.get('/api/updates/latest');
    return response.data;
  }

  public async getCurrentVersion(): Promise<ApiResponse> {
    const response = await this.client.get('/api/updates/current');
    return response.data;
  }

  // Banner endpoints
  public async getBanners(): Promise<ApiResponse> {
    const response = await this.client.get('/api/banners');
    return response.data;
  }

  public async getActiveBanners(): Promise<ApiResponse> {
    const response = await this.client.get('/api/banners/active');
    return response.data;
  }

  // News endpoints
  public async getNews(limit?: number): Promise<ApiResponse> {
    const response = await this.client.get('/api/news', {
      params: limit ? { limit } : {},
    });
    return response.data;
  }

  public async getLatestNews(): Promise<ApiResponse> {
    const response = await this.client.get('/api/news/latest');
    return response.data;
  }

  // Settings endpoints
  public async getSettings(): Promise<ApiResponse> {
    const response = await this.client.get('/api/settings');
    return response.data;
  }

  public async saveSettings(settings: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/settings/save', settings);
    return response.data;
  }

  public async resetSettings(): Promise<ApiResponse> {
    const response = await this.client.post('/api/settings/reset');
    return response.data;
  }

  public async clearCache(): Promise<ApiResponse> {
    const response = await this.client.post('/api/settings/clear-cache');
    return response.data;
  }

  public async exportLogs(): Promise<ApiResponse> {
    const response = await this.client.get('/api/settings/export-logs');
    return response.data;
  }

  // Health check
  public async healthCheck(): Promise<ApiResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }

  public async getCurrentSkin(): Promise<ApiResponse> {
    const response = await this.client.get('/api/skins/current', {
      responseType: 'blob',
    });
    return response.data;
  }

  public async changeSkin(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('skin', file);
    const response = await this.client.post('/api/skins/change', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  public async getSkinHistory(): Promise<ApiResponse> {
    const response = await this.client.get('/api/skins/history');
    return response.data;
  }

  public async getSkinUrl(skinId: number): Promise<ApiResponse> {
    const response = await this.client.get(`/api/skins/${skinId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
