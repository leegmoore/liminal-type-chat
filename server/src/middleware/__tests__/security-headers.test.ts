/**
 * Tests for security headers middleware
 */
import { Request, Response } from 'express';
import { createSecurityHeadersMiddleware } from '../security-headers';
import { Environment } from '../../services/core/EnvironmentService';

// Mock the EnvironmentService
jest.mock('../../services/core/EnvironmentService', () => {
  const original = jest.requireActual('../../services/core/EnvironmentService');
  
  // Create a mock environment service
  const mockEnvironmentService = {
    isLocalEnvironment: jest.fn().mockReturnValue(false),
    getEnvironment: jest.fn().mockReturnValue(original.Environment.PRODUCTION)
  };
  
  return {
    __esModule: true,
    Environment: original.Environment,
    EnvironmentService: jest.fn(() => mockEnvironmentService),
    environmentService: mockEnvironmentService
  };
});

describe('Security Headers Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  const { environmentService } = jest.requireMock('../../services/core/EnvironmentService');
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up request, response, and next function
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });
  
  describe('Core security headers', () => {
    it('should set all required security headers in production environment', () => {
      // Arrange
      (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.PRODUCTION);
      const middleware = createSecurityHeadersMiddleware();
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', expect.stringContaining('max-age='));
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', expect.any(String));
      expect(next).toHaveBeenCalled();
    });
    
    it('should set relaxed headers in development environment', () => {
      // Arrange
      (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.DEVELOPMENT);
      (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(true);
      const middleware = createSecurityHeadersMiddleware();
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      
      // Development environment should have more relaxed CSP
      expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', 
        expect.stringContaining('connect-src')
      );
      
      // Should not set HSTS in development
      expect(res.setHeader).not.toHaveBeenCalledWith('Strict-Transport-Security', expect.any(String));
      
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('Content Security Policy', () => {
    it('should set strict CSP in production', () => {
      // Arrange
      (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.PRODUCTION);
      const middleware = createSecurityHeadersMiddleware();
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining('default-src \'self\'')
      );
      
      // Expect strict CSP settings
      const cspHeader = (res.setHeader as jest.Mock).mock.calls.find(
        call => call[0] === 'Content-Security-Policy'
      )[1];
      
      expect(cspHeader).toContain('script-src \'self\'');
      expect(cspHeader).toContain('object-src \'none\'');
      expect(cspHeader).not.toContain('unsafe-eval');
    });
    
    it('should set development-friendly CSP in development', () => {
      // Arrange
      (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.DEVELOPMENT);
      (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(true);
      const middleware = createSecurityHeadersMiddleware();
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      // Check for development-friendly CSP
      const cspHeader = (res.setHeader as jest.Mock).mock.calls.find(
        call => call[0] === 'Content-Security-Policy'
      )[1];
      
      expect(cspHeader).toContain('unsafe-inline');
      expect(cspHeader).toContain('unsafe-eval');
      expect(cspHeader).toContain('ws:');
      expect(cspHeader).toContain('localhost:');
    });
  });
  
  describe('HTTP Strict Transport Security', () => {
    it('should set HSTS with long max-age in production', () => {
      // Arrange
      (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.PRODUCTION);
      const middleware = createSecurityHeadersMiddleware();
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      const hstsCall = (res.setHeader as jest.Mock).mock.calls.find(
        call => call[0] === 'Strict-Transport-Security'
      );
      
      expect(hstsCall).toBeDefined();
      expect(hstsCall[1]).toMatch(/max-age=\d+/);
      expect(hstsCall[1]).toContain('includeSubDomains');
    });
    
    it('should not set HSTS in development environment', () => {
      // Arrange
      (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.DEVELOPMENT);
      (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(true);
      const middleware = createSecurityHeadersMiddleware();
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      const hstsCall = (res.setHeader as jest.Mock).mock.calls.find(
        call => call[0] === 'Strict-Transport-Security'
      );
      
      expect(hstsCall).toBeUndefined();
    });
  });
  
  describe('Custom headers', () => {
    it('should set additional custom headers when provided', () => {
      // Arrange
      const middleware = createSecurityHeadersMiddleware({
        customHeaders: {
          'Custom-Security-Header': 'test-value',
          'X-API-Version': '1.0.0'
        }
      });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('Custom-Security-Header', 'test-value');
      expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', '1.0.0');
      expect(next).toHaveBeenCalled();
    });
    
    it('should override default headers with custom values when provided', () => {
      // Arrange
      const middleware = createSecurityHeadersMiddleware({
        customHeaders: {
          'X-Frame-Options': 'SAMEORIGIN', // Override the default DENY
        }
      });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(next).toHaveBeenCalled();
    });
  });
});