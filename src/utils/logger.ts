import { createWriteStream } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logStream: NodeJS.WritableStream | null = null;

  private constructor() {
    this.initializeLogStream();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private initializeLogStream(): void {
    try {
      const logDir = join(process.cwd(), 'logs');
      const logFile = join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      
      // Create logs directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      this.logStream = createWriteStream(logFile, { flags: 'a' });
    } catch (error) {
      console.warn('Failed to initialize log file stream:', error);
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    return JSON.stringify(logEntry) + '\n';
  }

  private writeLog(level: string, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output
    const consoleMessage = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
    if (data) {
      console.log(consoleMessage, data);
    } else {
      console.log(consoleMessage);
    }
    
    // File output
    if (this.logStream) {
      this.logStream.write(formattedMessage);
    }
  }

  public info(message: string, data?: any): void {
    this.writeLog('info', message, data);
  }

  public warn(message: string, data?: any): void {
    this.writeLog('warn', message, data);
  }

  public error(message: string, error?: any): void {
    this.writeLog('error', message, error);
  }

  public debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, data);
    }
  }

  public close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

export const logger = Logger.getInstance();
export default logger;
