/**
 * Health Service
 * Provides health check functionality for the application
 */

/**
 * Health status response type
 */
export interface HealthStatus {
  status: string;
  timestamp: string;
}

/**
 * Health service for application health checks
 */
export class HealthService {
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
}
