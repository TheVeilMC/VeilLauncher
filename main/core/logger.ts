import { app } from 'electron';
import fs from 'fs-extra';
import path from 'path';

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.logFile = path.join(this.logDir, 'main.log');
    console.log(
      `Logger initialized. Log directory: ${this.logDir}, Log file: ${this.logFile}`
    );
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Log to console
    console.log(logMessage, ...args);

    // Log to file
    try {
      const fullMessage =
        args.length > 0
          ? `${logMessage} ${JSON.stringify(args)}\n`
          : `${logMessage}\n`;

      fs.appendFileSync(this.logFile, fullMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  public info(message: string, ...args: any[]): void {
    this.writeLog('info', message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.writeLog('warn', message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    this.writeLog('error', message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, ...args);
    }
  }
}

export const logger = new Logger();
