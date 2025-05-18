import { IAuthBridgeService } from './IAuthBridgeService';
import { AuthBridgeService } from './AuthBridgeService';
import { JwtServiceFactory } from '../jwt/JwtServiceFactory';
import { UserRepository } from '../../db/users/UserRepository';
import { SQLiteProvider } from '../../db/sqlite-provider';
import { EncryptionService } from '../../security/encryption-service';
import { logger } from '../../../utils/logger';
import config from '../../../config';

/**
 * Factory for creating AuthBridgeService instances
 */
export class AuthBridgeServiceFactory {
  private static instance: IAuthBridgeService | null = null;
  
  /**
   * Creates a new AuthBridgeService instance or returns an existing one
   * 
   * @param forceNew Force creation of a new instance
   * @returns An AuthBridgeService instance
   */
  public static async createAuthBridgeService(forceNew = false): Promise<IAuthBridgeService> {
    // Return existing instance if available and not forcing new
    if (!forceNew && AuthBridgeServiceFactory.instance) {
      return AuthBridgeServiceFactory.instance;
    }
    
    try {
      logger.info('Creating new AuthBridgeService instance');
      
      // Get JWT service from factory (use enhanced JWT service)
      const jwtService = await JwtServiceFactory.createJwtService(true);
      
      // Create database provider
      const dbProvider = new SQLiteProvider(config.db.path);
      await dbProvider.initialize();
      
      // Create encryption service
      const encryptionService = new EncryptionService();
      
      // Create user repository with both required dependencies
      const userRepository = new UserRepository(dbProvider, encryptionService);
      
      // Create and store instance
      const instance = new AuthBridgeService(jwtService, userRepository);
      AuthBridgeServiceFactory.instance = instance;
      
      return instance;
    } catch (error) {
      logger.error('Failed to create AuthBridgeService:', error);
      throw error;
    }
  }
}