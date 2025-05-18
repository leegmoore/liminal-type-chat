/**
 * Factory for creating JWT services
 */
import { IJwtService } from './IJwtService';
import { JwtService } from './JwtService';
import { EnhancedJwtService } from './EnhancedJwtService';
import { JwtKeyManager } from './JwtKeyManager';
import { Environment, environmentService } from '../../../services/core/EnvironmentService';
import { SecureStorage } from '../../security/secure-storage';
import { logger } from '../../../utils/logger';

/**
 * Factory responsible for creating and configuring JWT service instances
 */
export class JwtServiceFactory {
  /**
   * Create a JWT service instance
   * @param useEnhanced Whether to use the enhanced service (asymmetric keys)
   * @returns A configured JWT service
   */
  static async createJwtService(useEnhanced: boolean = true): Promise<IJwtService> {
    // For production, staging, and development, use enhanced service by default
    const environment = environmentService.getEnvironment();
    const shouldUseEnhanced = useEnhanced || 
      environment === Environment.PRODUCTION || 
      environment === Environment.STAGING;
    
    // Log choice of service
    logger.info(`Creating JWT service for ${environment} environment`, {
      enhanced: shouldUseEnhanced
    });
    
    if (shouldUseEnhanced) {
      // Create key manager and enhanced service with asymmetric keys
      const secureStorage = new SecureStorage();
      const keyManager = new JwtKeyManager(environmentService, secureStorage);
      const service = new EnhancedJwtService(keyManager, environmentService);
      
      // Initialize the service
      await service.initialize();
      
      return service;
    } else {
      // Use legacy service with symmetric key
      return new JwtService();
    }
  }
}