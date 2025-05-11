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
  /** Server port */
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  
  /** Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',
  
  /** Whether to run in development mode */
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  /** Database configuration */
  db: {
    /** Path to SQLite database file */
    path: process.env.DB_PATH || path.join(process.cwd(), 'server', 'db', 'liminal-chat.db'),
  },
  
  /** Client mode configuration */
  inProcessMode: process.env.IN_PROCESS_MODE === 'true',
  
  /** API base URL for HTTP client mode */
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  
  /** Logging level */
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export default config;
