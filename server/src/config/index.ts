/**
 * Application configuration
 * Loads environment variables and provides typed access to configuration values
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Server configuration
 */
const config = {
  /** Server port - fixed to 8765 for consistency unless explicitly overridden */
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8765,
  
  /** Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',
  
  /** Whether to run in development mode */
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  /** Database configuration */
  db: {
    /** Path to SQLite database file */
    path: process.env.DB_PATH || (() => {
      // Check if we're already in the server directory
      const cwd = process.cwd();
      const isInServerDir = cwd.endsWith('/server') || cwd.endsWith('\\server');
      
      if (isInServerDir) {
        return path.join(cwd, 'db', 'liminal-chat.db');
      } else {
        return path.join(cwd, 'server', 'db', 'liminal-chat.db');
      }
    })(),
  },
  
  /** Client mode configuration */
  inProcessMode: process.env.IN_PROCESS_MODE !== 'false', // Default to true (direct mode) unless explicitly set to false
  
  /** API base URL for HTTP client mode */
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  
  /** Logging level */
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export default config;
