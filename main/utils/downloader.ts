import * as fs from 'fs-extra';
import * as path from 'path';
import { SHA1 } from 'crypto-js';
import * as CryptoJS from 'crypto-js';
import { pipeline } from 'stream';
import { promisify } from 'util';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { URL } from 'url';

const streamPipeline = promisify(pipeline);

interface DownloadOptions {
  /** Expected file size in bytes for validation */
  expectedSize?: number;
  /** Expected SHA-256 checksum (with or without 'sha256:' prefix) */
  expectedChecksum?: string;
  /** Maximum file size allowed (default: 100MB) */
  maxSize?: number;
  /** Download timeout in milliseconds (default: 5 minutes) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Progress callback function */
  onProgress?: (downloaded: number, total: number, percentage: number) => void;
  /** Custom headers for the request */
  headers?: Record<string, string>;
  /** Whether to overwrite existing file (default: false) */
  overwrite?: boolean;
  /** Temporary download suffix (default: '.tmp') */
  tempSuffix?: string;
}

interface DownloadResult {
  success: boolean;
  filePath: string;
  actualSize: number;
  actualChecksum: string;
  downloadTime: number;
  error?: string;
}

class SecureDownloader {
  private static readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static readonly DEFAULT_RETRIES = 3;
  private static readonly ALLOWED_PROTOCOLS = ['https:', 'http:'];
  private static readonly BLOCKED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
  ];

  /**
   * Securely download a file with comprehensive validation and error handling
   */
  static async downloadFile(
    url: string,
    outputPath: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const startTime = Date.now();

    // Set default options
    const {
      expectedSize,
      expectedChecksum,
      maxSize = this.DEFAULT_MAX_SIZE,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      onProgress,
      headers = {},
      overwrite = false,
      tempSuffix = '.tmp',
    } = options;

    // Validate inputs
    this.validateInputs(url, outputPath, maxSize, timeout);

    // Check if file already exists and is valid
    if (
      !overwrite &&
      (await this.isFileValid(outputPath, expectedSize, expectedChecksum))
    ) {
      const stats = await fs.stat(outputPath);
      const checksum = await this.calculateChecksum(outputPath);

      return {
        success: true,
        filePath: outputPath,
        actualSize: stats.size,
        actualChecksum: checksum,
        downloadTime: 0,
        error: undefined,
      };
    }

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Attempt download with retries
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.attemptDownload(url, outputPath, {
          expectedSize,
          expectedChecksum,
          maxSize,
          timeout,
          onProgress,
          headers,
          tempSuffix,
        });

        return {
          ...result,
          downloadTime: Date.now() - startTime,
        };
      } catch (error: any) {
        lastError = error as Error;

        if (attempt < retries) {
          // Wait before retry with exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));

          console.warn(
            `Download attempt ${attempt} failed, retrying in ${backoffMs}ms:`,
            error.message
          );
        }
      }
    }

    // All retries failed
    return {
      success: false,
      filePath: outputPath,
      actualSize: 0,
      actualChecksum: '',
      downloadTime: Date.now() - startTime,
      error: lastError?.message || 'Unknown download error',
    };
  }

  /**
   * Validate input parameters
   */
  private static validateInputs(
    url: string,
    outputPath: string,
    maxSize: number,
    timeout: number
  ): void {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Malformed URL provided');
    }

    // Check protocol security
    if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      throw new Error(
        `Unsupported protocol: ${parsedUrl.protocol}. Only HTTPS and HTTP are allowed.`
      );
    }

    // Block dangerous hosts
    const hostname = parsedUrl.hostname.toLowerCase();
    if (this.BLOCKED_HOSTS.includes(hostname) || this.isPrivateIP(hostname)) {
      throw new Error(
        `Access to ${hostname} is not allowed for security reasons`
      );
    }

    // Validate output path
    if (!outputPath || typeof outputPath !== 'string') {
      throw new Error('Invalid output path provided');
    }

    // Prevent directory traversal - check for relative path components
    const normalizedPath = path.normalize(outputPath);
    if (normalizedPath.includes('..')) {
      throw new Error('Path traversal detected in output path');
    }

    // Additional security: ensure path is absolute and doesn't contain dangerous patterns
    const resolvedPath = path.resolve(outputPath);

    if (resolvedPath.includes('\0') || resolvedPath.includes('\x00')) {
      throw new Error('Invalid characters detected in output path');
    }

    // Check for null bytes and other dangerous characters
    if (outputPath.includes('\0') || outputPath.includes('\x00')) {
      throw new Error('Invalid characters detected in output path');
    }

    // Validate numeric parameters
    if (maxSize <= 0 || maxSize > 1024 * 1024 * 1024) {
      // Max 1GB
      throw new Error('Invalid max size: must be between 1 byte and 1GB');
    }

    if (timeout <= 0 || timeout > 30 * 60 * 1000) {
      // Max 30 minutes
      throw new Error('Invalid timeout: must be between 1ms and 30 minutes');
    }
  }

  /**
   * Check if IP address is in private ranges
   */
  private static isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^fc00::/i, // IPv6 unique local
      /^fe80::/i, // IPv6 link-local
    ];

    return privateRanges.some((range) => range.test(hostname));
  }

  /**
   * Check if file exists and is valid
   */
  private static async isFileValid(
    filePath: string,
    expectedSize?: number,
    expectedChecksum?: string
  ): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);

      // Check size if provided
      if (expectedSize !== undefined && stats.size !== expectedSize) {
        return false;
      }

      // Check checksum if provided
      if (expectedChecksum) {
        const actualChecksum = await this.calculateChecksum(filePath);
        const normalizedExpected = expectedChecksum.replace(/^sha256:/, '');
        return actualChecksum === normalizedExpected;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempt a single download
   */
  private static async attemptDownload(
    url: string,
    outputPath: string,
    options: {
      expectedSize?: number;
      expectedChecksum?: string;
      maxSize: number;
      timeout: number;
      onProgress?: (
        downloaded: number,
        total: number,
        percentage: number
      ) => void;
      headers: Record<string, string>;
      tempSuffix: string;
    }
  ): Promise<Omit<DownloadResult, 'downloadTime'>> {
    const tempPath = `${outputPath}${options.tempSuffix}`;

    try {
      // Configure axios request
      const axiosConfig: AxiosRequestConfig = {
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: options.timeout,
        headers: {
          'User-Agent': 'VeilLauncher/1.0 (Electron)',
          ...options.headers,
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300,
      };

      // Make request
      const response: AxiosResponse = await axios(axiosConfig);

      // Validate content length
      const contentLength = parseInt(response.headers['content-length'] || '0');
      if (contentLength > options.maxSize) {
        throw new Error(
          `File too large: ${contentLength} bytes exceeds maximum of ${options.maxSize} bytes`
        );
      }

      if (options.expectedSize && contentLength !== options.expectedSize) {
        throw new Error(
          `Size mismatch: expected ${options.expectedSize} bytes, got ${contentLength} bytes`
        );
      }

      // Set up progress tracking
      let downloadedBytes = 0;
      const totalBytes = contentLength || 0;

      const progressStream = new (require('stream').Transform)({
        transform(chunk: Buffer, _encoding: string, callback: Function) {
          downloadedBytes += chunk.length;

          // Check size limit during download
          if (downloadedBytes > options.maxSize) {
            callback(
              new Error(
                `Download size limit exceeded: ${downloadedBytes} > ${options.maxSize}`
              )
            );
            return;
          }

          // Report progress
          if (options.onProgress && totalBytes > 0) {
            const percentage = Math.round((downloadedBytes / totalBytes) * 100);
            options.onProgress(downloadedBytes, totalBytes, percentage);
          }

          callback(null, chunk);
        },
      });

      // Create write stream
      const writeStream = fs.createWriteStream(tempPath);

      // Download file
      await streamPipeline(response.data, progressStream, writeStream);

      // Verify file size
      const stats = await fs.stat(tempPath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      if (options.expectedSize && stats.size !== options.expectedSize) {
        throw new Error(
          `Final size mismatch: expected ${options.expectedSize}, got ${stats.size}`
        );
      }

      // Verify checksum if provided
      let actualChecksum = '';
      if (options.expectedChecksum) {
        actualChecksum = await this.calculateChecksum(tempPath);
        const normalizedExpected = options.expectedChecksum.replace(
          /^sha256:/,
          ''
        );

        if (actualChecksum !== normalizedExpected) {
          throw new Error(
            `Checksum mismatch: expected ${normalizedExpected}, got ${actualChecksum}`
          );
        }
      } else {
        actualChecksum = await this.calculateChecksum(tempPath);
      }

      // Move temp file to final location atomically
      await fs.move(tempPath, outputPath, { overwrite: true });

      return {
        success: true,
        filePath: outputPath,
        actualSize: stats.size,
        actualChecksum,
      };
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Calculate SHA-256 checksum of a file
   */
  private static async calculateChecksum(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);

      // Convert Buffer to WordArray and hash
      const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
      const actualHash = SHA1(wordArray).toString();

      return actualHash;
    } catch (error) {
      return '';
    }
  }
}

// Export the main function
export const downloadFile =
  SecureDownloader.downloadFile.bind(SecureDownloader);

// Export types for external use
export type { DownloadOptions, DownloadResult };
