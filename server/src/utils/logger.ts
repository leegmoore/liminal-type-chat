/**
 * Application Logger
 * 
 * Centralized logging utility for consistent log formatting and control.
 * Supports different log levels and environments.
 */

/**
 * Log levels in ascending order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

/**
 * Converts string log level to enum
 * @param level - String log level
 * @returns Corresponding LogLevel enum value
 */
function getLogLevelFromString(level?: string): LogLevel {
  if (!level) return LogLevel.INFO;
  
  switch (level.toLowerCase()) {
  case 'debug': return LogLevel.DEBUG;
  case 'info': return LogLevel.INFO;
  case 'warn': return LogLevel.WARN;
  case 'error': return LogLevel.ERROR;
  case 'silent': return LogLevel.SILENT;
  default: return LogLevel.INFO;
  }
}

/**
 * Logger class for application-wide logging
 */
export class Logger {
  private level: LogLevel;
  private isProduction: boolean;
  
  /**
   * Create a new logger
   */
  constructor() {
    // Set log level from environment variable or default
    this.level = getLogLevelFromString(process.env.LOG_LEVEL);
    
    // Check if in production mode
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Announce logger initialization at startup
    this.info(`Logger initialized with level: ${LogLevel[this.level]}`);
  }
  
  /**
   * Check if a log level should be displayed
   * @param msgLevel - Level of the message to check
   * @returns Whether message should be logged
   */
  private shouldLog(msgLevel: LogLevel): boolean {
    return msgLevel >= this.level;
  }
  
  /**
   * Format a log message with metadata
   * @param level - Log level string
   * @param message - Main log message
   * @param meta - Additional metadata
   * @returns Formatted log object
   */
  private formatLog(level: string, message: string, meta?: unknown): unknown {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? this.sanitizeMeta(meta) : undefined;
    
    // In production, return structured logs
    if (this.isProduction) {
      return {
        timestamp,
        level,
        message,
        ...(formattedMeta ? { meta: formattedMeta } : {})
      };
    }
    
    // In development, return the message and meta for better readability
    return formattedMeta ? { message, ...formattedMeta } : message;
  }
  
  /**
   * Sanitize metadata to prevent sensitive information leakage
   * @param meta - Metadata to sanitize
   * @returns Sanitized metadata
   */
  private sanitizeMeta(meta: unknown): unknown {
    if (typeof meta !== 'object' || meta === null) {
      return meta;
    }
    
    const sanitized = { ...meta as Record<string, unknown> };
    
    // Remove sensitive keys
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'apiKey', 'api_key',
      'auth', 'authorization', 'jwt', 'credential'
    ];
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      
      // Mask sensitive values
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        // Keep a small prefix for debugging but mask the rest
        if (typeof sanitized[key] === 'string') {
          const value = sanitized[key] as string;
          const prefix = value.substring(0, 4);
          sanitized[key] = `${prefix}...REDACTED`;
        } else {
          sanitized[key] = 'REDACTED';
        }
      }
      
      // Recursively sanitize nested objects
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeMeta(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Log a debug message
   * @param message - Message to log
   * @param meta - Additional metadata
   */
  debug(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatLog('debug', message, meta));
    }
  }
  
  /**
   * Log an info message
   * @param message - Message to log
   * @param meta - Additional metadata
   */
  info(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatLog('info', message, meta));
    }
  }
  
  /**
   * Log a warning message
   * @param message - Message to log
   * @param meta - Additional metadata
   */
  warn(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLog('warn', message, meta));
    }
  }
  
  /**
   * Log an error message
   * @param message - Message to log
   * @param meta - Additional metadata
   */
  error(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatLog('error', message, meta));
    }
  }
  
  /**
   * Set the log level
   * @param level - New log level
   */
  setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      this.level = getLogLevelFromString(level);
    } else {
      this.level = level;
    }
    this.info(`Log level set to: ${LogLevel[this.level]}`);
  }
}

// Export a singleton instance
export const logger = new Logger();