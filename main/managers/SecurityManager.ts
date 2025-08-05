import { app, session } from 'electron';
import { logger } from '../core/logger';

export class SecurityManager {
  public configure(): void {
    // Set Content Security Policy
    this.setupCSP();

    // Configure session security
    this.setupSessionSecurity();

    // Setup secure defaults
    this.setupSecureDefaults();

    logger.info('Security configuration applied');
  }

  private setupCSP(): void {
    app.on('web-contents-created', (_, contents) => {
      contents.on('dom-ready', () => {
        contents.insertCSS(`
          * {
            -webkit-user-select: none;
            -webkit-app-region: no-drag;
          }
          
          input, textarea, [contenteditable] {
            -webkit-user-select: text;
          }
          
          [data-tauri-drag-region] {
            -webkit-app-region: drag;
          }
        `);
      });
    });
  }

  private setupSessionSecurity(): void {
    app.whenReady().then(() => {
      const ses = session.defaultSession;

      // Configure request filtering
      this.setupRequestFiltering(ses);

      // Set secure headers with proper CSP
      this.setupSecureHeaders(ses);

      // Clear cache on startup in production
      if (process.env.NODE_ENV !== 'development') {
        ses.clearCache();
      }
    });
  }

  private setupRequestFiltering(ses: Electron.Session): void {
    if (process.env.NODE_ENV !== 'development') {
      ses.webRequest.onBeforeRequest((details, callback) => {
        const url = new URL(details.url);

        // Define allowed domains
        const allowedDomains = [
          'localhost',
          '127.0.0.1',
          'fonts.googleapis.com',
          'fonts.gstatic.com',
          'mineskin.eu',
          'veilapi.ogmatrix.net',
        ];

        // Allow file protocol and allowed domains
        if (
          url.protocol === 'file:' ||
          allowedDomains.some((domain) => url.hostname.includes(domain))
        ) {
          callback({});
          return;
        }

        // Log blocked requests for debugging
        logger.warn(`Blocked external request: ${details.url}`);
        callback({ cancel: true });
      });
    }
  }

  private setupSecureHeaders(ses: Electron.Session): void {
    ses.webRequest.onHeadersReceived((details, callback) => {
      try {
        // Build CSP based on environment
        const csp = this.buildContentSecurityPolicy();

        // Only apply CSP to main content, not to file:// protocol in some cases
        const url = new URL(details.url);
        const shouldApplyCSP =
          url.protocol !== 'file:' || process.env.NODE_ENV === 'production';

        const headers: Record<string, string[]> = {
          ...details.responseHeaders,
          'X-Content-Type-Options': ['nosniff'],
          'X-Frame-Options': ['DENY'],
          'X-XSS-Protection': ['1; mode=block'],
          'Referrer-Policy': ['strict-origin-when-cross-origin'],
        };

        if (shouldApplyCSP) {
          headers['Content-Security-Policy'] = [csp];
        }

        // Only add Permissions-Policy in production
        if (process.env.NODE_ENV === 'production') {
          headers['Permissions-Policy'] = [
            'geolocation=(), microphone=(), camera=()',
          ];
        }

        callback({ responseHeaders: headers });
      } catch (error) {
        logger.error('Error in setupSecureHeaders:', error);
        callback({});
      }
    });
  }

  private buildContentSecurityPolicy(): string {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // More permissive CSP for development
    if (isDevelopment) {
      return (
        [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https:",
          "media-src 'self' data: blob:",
          "connect-src 'self' ws://localhost:* http://localhost:* https://localhost:* https://veilapi.gomatrix.net",
          "object-src 'none'",
        ].join('; ') + ';'
      );
    }

    // Production CSP - more restrictive
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return directives.join('; ') + ';';
  }

  private setupSecureDefaults(): void {
    app.on('web-contents-created', (_, contents) => {
      // Only apply navigation restrictions in production
      if (process.env.NODE_ENV === 'production') {
        contents.on('will-navigate', (event, navigationUrl) => {
          const parsedUrl = new URL(navigationUrl);

          if (parsedUrl.protocol !== 'file:') {
            logger.warn(`Blocked navigation to: ${navigationUrl}`);
            event.preventDefault();
          }
        });

        // Prevent new window creation in production
        contents.setWindowOpenHandler(({ url }) => {
          logger.warn(`Blocked window.open to: ${url}`);
          return { action: 'deny' };
        });

        // Block webview attachment in production
        contents.on('will-attach-webview', (event) => {
          logger.warn('Blocked webview attachment');
          event.preventDefault();
        });

        // Disable remote and node modules in renderer (production only)
        contents.on('dom-ready', () => {
          contents
            .executeJavaScript(
              `
            delete window.require;
            delete window.exports;
            delete window.module;
          `
            )
            .catch((err) =>
              logger.error('Failed to remove Node globals:', err)
            );
        });
      }
    });

    // Certificate error handling
    app.on(
      'certificate-error',
      (event, _webContents, _url, _error, _certificate, callback) => {
        if (process.env.NODE_ENV === 'development') {
          // Allow self-signed certificates in development
          event.preventDefault();
          callback(true);
        } else {
          callback(false);
        }
      }
    );
  }

  // Method to temporarily allow additional domains (useful for dynamic content)
  public allowDomain(domain: string): void {
    logger.info(`Temporarily allowing domain: ${domain}`);
    // Implementation would depend on your specific needs
  }

  // Method to get current CSP for debugging
  public getCurrentCSP(): string {
    return this.buildContentSecurityPolicy();
  }

  // Debug method to temporarily disable security for testing
  public disableSecurityForDebug(): void {
    logger.warn('SECURITY DISABLED FOR DEBUGGING - DO NOT USE IN PRODUCTION');

    app.removeAllListeners('web-contents-created');

    // Minimal security setup
    app.on('web-contents-created', (_, contents) => {
      contents.on('dom-ready', () => {
        contents.insertCSS(`
          * {
            -webkit-user-select: none;
            -webkit-app-region: no-drag;
          }
          
          input, textarea, [contenteditable] {
            -webkit-user-select: text;
          }
        `);
      });
    });
  }
}
