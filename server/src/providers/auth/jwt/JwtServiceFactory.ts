/**
 * Factory for creating JWT services
 */
import { IJwtService } from './IJwtService';
import { JwtService } from './JwtService';

/**
 * Factory responsible for creating and configuring JWT service instances
 */
export class JwtServiceFactory {
  /**
   * Create a JWT service instance
   * @returns A configured JWT service
   */
  static createJwtService(): IJwtService {
    return new JwtService();
  }
}