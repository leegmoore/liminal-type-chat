/**
 * Tests for domain-specific authentication middleware
 */
import { Request, Response } from 'express';
import { createDomainAuthMiddleware, DomainAuthenticatedRequest } from '../domain-auth-middleware';
import { IAuthBridgeService } from '../../providers/auth/bridge/IAuthBridgeService';
import { UnauthorizedError } from '../../utils/errors';
import { AuthErrorCode } from '../../utils/error-codes';
import { Environment } from '../../services/core/EnvironmentService';

// Mock the EnvironmentService
jest.mock('../../services/core/EnvironmentService', () => {
  const original = jest.requireActual('../../services/core/EnvironmentService');
  
  // Create a mock environment service
  const mockEnvironmentService = {
    isLocalEnvironment: jest.fn().mockReturnValue(false),
    isAuthRequired: jest.fn().mockReturnValue(true),
    useExtendedTokenLifetime: jest.fn().mockReturnValue(false),
    getEnvironment: jest.fn().mockReturnValue(original.Environment.PRODUCTION)
  };
  
  return {
    __esModule: true,
    Environment: original.Environment,
    EnvironmentService: jest.fn(() => mockEnvironmentService),
    environmentService: mockEnvironmentService
  };
});

// Mock AuthBridgeService
const mockAuthBridgeService: jest.Mocked<IAuthBridgeService> = {
  validateEdgeToken: jest.fn(),
  generateDomainToken: jest.fn(),
  validateDomainToken: jest.fn()
};

describe('Domain Auth Middleware', () => {
  // Create mock request, response, and next function
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  const { environmentService } = jest.requireMock('../../services/core/EnvironmentService');
  
  // Sample domain context
  const domainContext = {
    userId: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    scopes: ['read:profile', 'read:messages'],
    tier: 'domain' as const,
    tokenId: 'domain-token-id-123',
    issuedAt: Date.now() / 1000,
    expiresAt: (Date.now() + 900000) / 1000, // 15 minutes in the future
    domainScopes: ['domain:read:profile', 'domain:read:messages'],
    sourceTokenId: 'edge-token-id-123'
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up request, response, and next function
    req = {
      header: jest.fn(),
      params: {}
    };
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
    
    // Set up AuthBridgeService mock to return the domain context
    mockAuthBridgeService.validateDomainToken.mockResolvedValue(domainContext);

    // Reset environment service mock defaults
    (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(false);
    (environmentService.isAuthRequired as jest.Mock).mockReturnValue(true);
    (environmentService.useExtendedTokenLifetime as jest.Mock).mockReturnValue(false);
    (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.PRODUCTION);
  });
  
  describe('Token validation', () => {
    it('should proceed without authentication when not required and no token provided', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue(undefined);
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService, { required: false });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(mockAuthBridgeService.validateDomainToken).not.toHaveBeenCalled();
    });
    
    it('should throw UnauthorizedError when auth is required but no token provided', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue(undefined);
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockAuthBridgeService.validateDomainToken).not.toHaveBeenCalled();
    });
    
    it('should throw UnauthorizedError when Authorization header format is invalid', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('InvalidFormat');
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INVALID_CREDENTIALS
        })
      );
      expect(mockAuthBridgeService.validateDomainToken).not.toHaveBeenCalled();
    });
    
    it('should attach domain user to request when token is valid', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-domain-token');
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'valid-domain-token', 
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith();
      expect((req as DomainAuthenticatedRequest).user).toEqual({
        userId: domainContext.userId,
        email: domainContext.email,
        name: domainContext.name,
        scopes: domainContext.scopes,
        tier: domainContext.tier,
        tokenId: domainContext.tokenId,
        domainScopes: domainContext.domainScopes,
        sourceTokenId: domainContext.sourceTokenId
      });
    });
    
    it('should pass through validation errors from AuthBridgeService', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer invalid-token');
      const authError = new UnauthorizedError(
        'Token expired', 
        'JWT expired', 
        AuthErrorCode.EXPIRED_TOKEN
      );
      mockAuthBridgeService.validateDomainToken.mockRejectedValue(authError);
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'invalid-token',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(authError);
    });
  });
  
  describe('Domain scope and resource validation', () => {
    it('should throw UnauthorizedError when required domain scopes are not present', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService, {
        requiredDomainScopes: ['domain:write:messages']
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INSUFFICIENT_PERMISSIONS
        })
      );
    });
    
    it('should proceed when all required domain scopes are present', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService, {
        requiredDomainScopes: ['domain:read:profile']
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should throw ForbiddenError when resource ownership validation fails', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      req.params = { userId: 'other-user-456' };
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService, {
        resourceOwnershipParam: 'userId'
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Resource access forbidden',
          details: 'You do not have permission to access this resource'
        })
      );
    });
    
    it('should proceed when resource ownership validation passes', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      req.params = { userId: 'user-123' }; // Same as in domain context
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService, {
        resourceOwnershipParam: 'userId'
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should skip resource ownership validation if user has admin scope', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      req.params = { userId: 'other-user-456' };
      
      // Update domain context to include admin scope
      const adminContext = {
        ...domainContext,
        domainScopes: [...domainContext.domainScopes, 'domain:admin']
      };
      mockAuthBridgeService.validateDomainToken.mockResolvedValue(adminContext);
      
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService, {
        resourceOwnershipParam: 'userId',
        adminScope: 'domain:admin'
      });
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith();
    });
  });
  
  describe('Environment awareness', () => {
    it('should create a dev user with domain tier when in local environment with auth bypass', async () => {
      // Arrange
      (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (environmentService.isAuthRequired as jest.Mock).mockReturnValue(false);
      
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(res.setHeader).toHaveBeenCalledWith('X-Dev-Auth-Bypass', 'true');
      expect((req as DomainAuthenticatedRequest).user).toBeDefined();
      expect((req as DomainAuthenticatedRequest).user?.tier).toBe('domain');
      expect((req as DomainAuthenticatedRequest).user?.domainScopes).toContain('domain:admin');
    });
    
    it('should set extended token lifetime header when configured', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      (environmentService.useExtendedTokenLifetime as jest.Mock).mockReturnValue(true);
      
      const middleware = createDomainAuthMiddleware(mockAuthBridgeService);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Extended-Lifetime', 'true');
      expect(next).toHaveBeenCalledWith();
    });
  });
});