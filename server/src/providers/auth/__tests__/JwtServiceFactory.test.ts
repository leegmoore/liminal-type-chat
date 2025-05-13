/**
 * Tests for JwtServiceFactory
 */
import { JwtServiceFactory } from '../jwt/JwtServiceFactory';
import { JwtService } from '../jwt/JwtService';

describe('JwtServiceFactory', () => {
  // Save original environment
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Setup environment variables needed for JWT service
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '15m';
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });
  
  describe('createJwtService', () => {
    it('should create a JwtService instance', () => {
      // Act
      const jwtService = JwtServiceFactory.createJwtService();
      
      // Assert
      expect(jwtService).toBeInstanceOf(JwtService);
    });
    
    it('should throw error if JWT_SECRET is not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      
      // Act & Assert
      expect(() => JwtServiceFactory.createJwtService())
        .toThrow('JWT_SECRET environment variable is required');
    });
  });
});