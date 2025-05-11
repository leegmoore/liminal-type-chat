/**
 * Health Service
 * Provides health check functionality for the application
 */
import { DatabaseProvider } from '../../providers/db/database-provider';

/**
 * Basic health status response type
 */
export interface HealthStatus {
  status: string;
  timestamp: string;
}

/**
 * Database health status response type
 */
export interface DatabaseHealthStatus extends HealthStatus {
  database: {
    connected: boolean;
    error?: string;
  };
}

/**
 * Health service for application health checks
 */
export class HealthService {
  private dbProvider?: DatabaseProvider;
  
  /**
   * Create a new HealthService
   * @param dbProvider - Optional database provider for database health checks
   */
  constructor(dbProvider?: DatabaseProvider) {
    this.dbProvider = dbProvider;
  }
  
  /**
   * Get the current system status
   * @returns Object containing status and timestamp
   */
  async getSystemStatus(): Promise<HealthStatus> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Check database connection health
   * @returns Object containing status, timestamp, and database connection info
   */
  async checkDbConnection(): Promise<DatabaseHealthStatus> {
    const timestamp = new Date().toISOString();
    
    // If no database provider was injected, return error status
    if (!this.dbProvider) {
      return {
        status: 'error',
        timestamp,
        database: {
          connected: false,
          error: 'No database provider configured'
        }
      };
    }
    
    try {
      // Check database connection
      const isConnected = await this.dbProvider.healthCheck();
      
      // Build response based on connection status
      const status = isConnected ? 'ok' : 'error';
      const result: DatabaseHealthStatus = {
        status,
        timestamp,
        database: {
          connected: isConnected
        }
      };
      
      // If connection is healthy, record the health check
      if (isConnected) {
        try {
          await this.dbProvider.exec(
            'INSERT INTO health_checks (check_type, status, timestamp) VALUES (?, ?, ?)',
            ['database', status, timestamp]
          );
        } catch (insertError) {
          // Log error but don't fail the health check if recording fails
          console.error('Failed to record health check:', insertError);
        }
      }
      
      return result;
    } catch (error) {
      // Handle database connection errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return {
        status: 'error',
        timestamp,
        database: {
          connected: false,
          error: errorMessage
        }
      };
    }
  }
}
