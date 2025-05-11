/**
 * Direct Health Service Client
 * Implements the health service client interface for direct (in-process) communication
 * with the domain health service
 */
import { HealthServiceClient } from './health-service-client';
import { 
  DatabaseHealthStatus, 
  HealthService, 
  HealthStatus 
} from '../../services/core/health-service';

/**
 * Client for accessing health service functionality directly (in-process)
 */
export class DirectHealthServiceClient implements HealthServiceClient {
  private healthService: HealthService;
  
  /**
   * Create a new DirectHealthServiceClient
   * @param healthService - The domain health service instance to use
   */
  constructor(healthService: HealthService) {
    this.healthService = healthService;
  }
  
  /**
   * Get the current system health status by directly calling the domain service
   * @returns Promise with health status information
   */
  async getSystemStatus(): Promise<HealthStatus> {
    return this.healthService.getSystemStatus();
  }
  
  /**
   * Check database connection health by directly calling the domain service
   * @returns Promise with database health status information
   */
  async checkDbConnection(): Promise<DatabaseHealthStatus> {
    return this.healthService.checkDbConnection();
  }
}
