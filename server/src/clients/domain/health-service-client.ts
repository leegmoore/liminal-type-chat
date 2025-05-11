/**
 * Health Service Client Interface
 * Defines the contract for client implementations to access health service functionality
 * across different communication modes (direct or HTTP)
 */
import { DatabaseHealthStatus, HealthStatus } from '../../services/core/health-service';

/**
 * Interface for clients that access health service functionality
 */
export interface HealthServiceClient {
  /**
   * Get the current system health status
   * @returns Promise with health status information
   */
  getSystemStatus(): Promise<HealthStatus>;
  
  /**
   * Check database connection health
   * @returns Promise with database health status information
   */
  checkDbConnection(): Promise<DatabaseHealthStatus>;
}
