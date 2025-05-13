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
    // Use environment variable DB_PATH if defined, otherwise compute default path
    path: process.env.DB_PATH || (() => {
      // Check if we're already in the server directory
      const cwd = process.cwd();
      // Check if path ends with 'server' on either Unix or Windows
      const isInServerDir = cwd.endsWith('/server') || 
        cwd.endsWith('\\server');
      
      if (isInServerDir) {
        return path.join(cwd, 'db', 'liminal-chat.db');
      } else {
        return path.join(cwd, 'server', 'db', 'liminal-chat.db');
      }
    })(),
  },
  
  /** Client mode configuration */
  // Default to true (direct mode) unless explicitly set to false
  inProcessMode: process.env.IN_PROCESS_MODE !== 'false',
  
  /** Domain client mode ('direct' or 'http') */
  domainClientMode: process.env.DOMAIN_CLIENT_MODE || 'direct',
  
  /** API base URL for HTTP client mode */
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8765',
  
  /** Domain API base URL (alias for apiBaseUrl for backward compatibility) */
  domainApiBaseUrl: process.env.DOMAIN_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:8765',
  
  /** Logging level */
  logLevel: process.env.LOG_LEVEL || 'debug',
  
  /** Domain API documentation settings */
  domainApiDocs: {
    /** Username for basic auth protection of Domain API docs */
    username: process.env.DOMAIN_DOCS_USERNAME || 'admin',
    /** Password for basic auth protection of Domain API docs */
    password: process.env.DOMAIN_DOCS_PASSWORD || 'password',
    /** Whether to enable basic auth for Domain API docs in non-dev environments */
    enableAuth: process.env.NODE_ENV !== 'development',
  },
};

export default config;
