/**
 * Factory for creating PKCE storage implementations
 * 
 * This factory chooses the appropriate PKCE storage implementation
 * based on the current environment:
 * - Production/Staging: Database-backed storage for scalability
 * - Development/Local: In-memory storage for simplicity
 */
import { IPkceStorage, InMemoryPkceStorage } from './PkceStorage';
import { DatabasePkceStorage } from './DatabasePkceStorage';
import { Environment } from '../../../services/core/EnvironmentService';
import { logger } from '../../../utils/logger';

/**
 * Factory class for creating environment-appropriate PKCE storage
 */
export class PkceStorageFactory {
  /**
   * Create an appropriate PKCE storage implementation for the given environment
   * 
   * @param environment The current environment
   * @returns An IPkceStorage implementation suitable for the environment
   */
  static create(environment: Environment): IPkceStorage {
    // In production/staging, use database-backed storage for scalability
    if (environment === Environment.PRODUCTION || 
        environment === Environment.STAGING) {
      logger.info(`Creating database-backed PKCE storage for ${environment} environment`);
      return new DatabasePkceStorage(environment);
    }
    
    // In local/development environments, use in-memory storage for simplicity
    logger.info(`Creating in-memory PKCE storage for ${environment} environment`);
    return new InMemoryPkceStorage();
  }
}

/**
 * Create and export a singleton instance based on current environment
 */
import { environmentService } from '../../../services/core/EnvironmentService';
export const pkceStorage = PkceStorageFactory.create(
  environmentService.getEnvironment()
);