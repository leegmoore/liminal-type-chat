/**
 * Tests for EnvironmentService
 */
import { Environment, EnvironmentService } from '../EnvironmentService';
import os from 'os';

// Mock the os module
jest.mock('os', () => ({
  hostname: jest.fn()
}));

// Mock the console methods used by the logger
const originalConsole = { ...console };
beforeAll(() => {
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('EnvironmentService', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };
  
  // Reset environment before each test
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    (os.hostname as jest.Mock).mockReturnValue('localhost');
  });
  
  // Restore original environment after each test
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('environment detection', () => {
    it('should detect local environment from APP_ENV', () => {
      // Arrange
      process.env.APP_ENV = 'local';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.LOCAL);
      expect(service.isLocalEnvironment()).toBe(true);
    });
    
    it('should detect development environment from APP_ENV', () => {
      // Arrange
      process.env.APP_ENV = 'development';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.DEVELOPMENT);
      expect(service.isLocalEnvironment()).toBe(false);
    });
    
    it('should detect staging environment from APP_ENV', () => {
      // Arrange
      process.env.APP_ENV = 'staging';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.STAGING);
      expect(service.isLocalEnvironment()).toBe(false);
    });
    
    it('should detect production environment from APP_ENV', () => {
      // Arrange
      process.env.APP_ENV = 'production';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.PRODUCTION);
      expect(service.isLocalEnvironment()).toBe(false);
    });
    
    it('should detect production environment from NODE_ENV', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.PRODUCTION);
    });
    
    it('should detect development environment from NODE_ENV=test', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.DEVELOPMENT);
    });
    
    it('should detect production from hostname when it contains "prod"', () => {
      // Arrange
      process.env.NODE_ENV = undefined; // Clear NODE_ENV to force hostname check
      process.env.APP_ENV = undefined; // Clear APP_ENV to force hostname check
      (os.hostname as jest.Mock).mockReturnValue('prod-server-01');
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.PRODUCTION);
    });
    
    it('should detect production from ENFORCE_PRODUCTION_SECURITY', () => {
      // Arrange
      process.env.NODE_ENV = undefined; // Clear NODE_ENV to force flag check
      process.env.APP_ENV = undefined; // Clear APP_ENV to force flag check
      process.env.ENFORCE_PRODUCTION_SECURITY = 'true';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.PRODUCTION);
    });
    
    it('should default to LOCAL when NODE_ENV is development', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.LOCAL);
    });
    
    it('should default to PRODUCTION for unknown environments', () => {
      // Arrange
      process.env.NODE_ENV = 'unknown';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.getEnvironment()).toBe(Environment.PRODUCTION);
    });
  });
  
  describe('security profile features', () => {
    it('should require auth in all environments except local', () => {
      // Test all environments
      [
        { env: 'local', expected: false },
        { env: 'development', expected: true },
        { env: 'staging', expected: true },
        { env: 'production', expected: true }
      ].forEach(({ env, expected }) => {
        // Arrange
        process.env.APP_ENV = env;
        
        // Act
        const service = new EnvironmentService();
        
        // Assert
        expect(service.isAuthRequired()).toBe(expected);
      });
    });
    
    it('should enable auth in local if DEV_REQUIRE_AUTH is true', () => {
      // Arrange
      process.env.APP_ENV = 'local';
      process.env.DEV_REQUIRE_AUTH = 'true';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.isAuthRequired()).toBe(true);
    });
    
    it('should enforce strict security headers in non-local environments', () => {
      // Arrange
      process.env.APP_ENV = 'production';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert
      expect(service.useStrictSecurityHeaders()).toBe(true);
    });
    
    it('should allow mock services in local and development only', () => {
      // Test production (should not allow mocks)
      process.env.APP_ENV = 'production';
      let service = new EnvironmentService();
      expect(service.allowMockServices()).toBe(false);
      
      // Test development (should allow mocks)
      process.env.APP_ENV = 'development';
      service = new EnvironmentService();
      expect(service.allowMockServices()).toBe(true);
      
      // Test local (should allow mocks)
      process.env.APP_ENV = 'local';
      service = new EnvironmentService();
      expect(service.allowMockServices()).toBe(true);
    });
    
    it('should enforce strict security with ENFORCE_SECURITY=true', () => {
      // Arrange
      process.env.APP_ENV = 'local';
      process.env.ENFORCE_SECURITY = 'true';
      
      // Act
      const service = new EnvironmentService();
      
      // Assert - Should use production security profile
      expect(service.allowMockServices()).toBe(false);
      expect(service.useStrictSecurityHeaders()).toBe(true);
      expect(service.useStrictCors()).toBe(true);
      expect(service.enforceRateLimits()).toBe(true);
    });
  });
  
  describe('security bypass detection', () => {
    it('should warn about security bypasses in non-local environments', () => {
      // Arrange
      process.env.APP_ENV = 'development';
      process.env.BYPASS_AUTH = 'true';
      
      // Act
      new EnvironmentService();
      
      // Assert
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('SECURITY ALERT');
    });
    
    it('should not warn about security bypasses in local environment', () => {
      // Arrange
      process.env.APP_ENV = 'local';
      process.env.BYPASS_AUTH = 'true';
      
      // Act
      new EnvironmentService();
      
      // Assert
      expect(console.error).not.toHaveBeenCalled();
    });
    
    it('should exit process in production with security bypasses', () => {
      // Arrange
      process.env.APP_ENV = 'production';
      process.env.BYPASS_AUTH = 'true';
      const originalExit = process.exit;
      process.exit = jest.fn() as never;
      
      try {
        // Act
        new EnvironmentService();
        
        // Assert
        expect(process.exit).toHaveBeenCalledWith(1);
      } finally {
        process.exit = originalExit;
      }
    });
  });
  
  describe('extended token lifetime', () => {
    it('should use extended token lifetime in local and development', () => {
      // Arrange
      process.env.APP_ENV = 'local';
      let service = new EnvironmentService();
      
      // Assert
      expect(service.useExtendedTokenLifetime()).toBe(true);
      
      // Arrange - Development
      process.env.APP_ENV = 'development';
      service = new EnvironmentService();
      
      // Assert
      expect(service.useExtendedTokenLifetime()).toBe(true);
    });
    
    it('should not use extended token lifetime in production', () => {
      // Arrange
      process.env.APP_ENV = 'production';
      const service = new EnvironmentService();
      
      // Assert
      expect(service.useExtendedTokenLifetime()).toBe(false);
    });
  });
});