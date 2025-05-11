/**
 * Health Service Client Factory
 * Creates the appropriate health service client implementation based on configuration
 */
import config from '../../config';
import { HealthService } from '../../services/core/health-service';
import { HealthServiceClient } from './health-service-client';
import { DirectHealthServiceClient } from './direct-health-service-client';
import { HttpHealthServiceClient } from './http-health-service-client';

/**
 * Create a health service client based on configuration
 * @param healthService - The domain health service (used for direct mode)
 * @returns A health service client implementation
 */
export function createHealthServiceClient(healthService?: HealthService): HealthServiceClient {
  // Check if we should use in-process (direct) communication
  if (config.inProcessMode) {
    if (!healthService) {
      throw new Error('Health service instance is required for direct mode');
    }
    return new DirectHealthServiceClient(healthService);
  }
  
  // Use HTTP communication mode
  return new HttpHealthServiceClient(config.apiBaseUrl);
}
