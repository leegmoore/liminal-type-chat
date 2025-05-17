/**
 * Tests for authentication middleware
 */
import { Request, Response } from 'express';
import { createAuthMiddleware, AuthenticatedRequest } from '../auth-middleware';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { VerifiedToken } from '../../providers/auth/jwt/IJwtService';
import { UnauthorizedError } from '../../utils/errors';
import { AuthErrorCode } from '../../utils/error-codes';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
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

// Mock JWT service
const mockJwtService: jest.Mocked<IJwtService> = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn()
};

// Mock User Repository
const mockUserRepository: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByProviderInfo: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('Auth Middleware', () => {
  // Create mock request, response, and next function
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  const { environmentService } = jest.requireMock('../../services/core/EnvironmentService');
  
  // Sample verified token data
  const verifiedToken: VerifiedToken = {
    userId: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    scopes: ['read:profile', 'read:messages'],
    tier: 'edge',
    tokenId: 'token-id-123',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 900000) // 15 minutes in the future
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up request, response, and next function
    req = {
      header: jest.fn()
    };
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
    
    // Set up JWT service mock
    mockJwtService.verifyToken.mockReturnValue(verifiedToken);

    // Reset environment service mock defaults
    (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(false);
    (environmentService.isAuthRequired as jest.Mock).mockReturnValue(true);
    (environmentService.useExtendedTokenLifetime as jest.Mock).mockReturnValue(false);
    (environmentService.getEnvironment as jest.Mock).mockReturnValue(Environment.PRODUCTION);
  });
  
  describe('Token validation', () => {
    it('should proceed without authentication when not required and no token provided', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue(undefined);
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository, { required: false });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
    });
    
    it('should throw UnauthorizedError when auth is required but no token provided', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue(undefined);
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
    });
    
    it('should throw UnauthorizedError when Authorization header format is invalid', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('InvalidFormat');
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INVALID_CREDENTIALS
        })
      );
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
    });
    
    it('should attach user to request when token is valid', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(next).toHaveBeenCalledWith();
      expect((req as AuthenticatedRequest).user).toEqual({
        userId: verifiedToken.userId,
        email: verifiedToken.email,
        name: verifiedToken.name,
        scopes: verifiedToken.scopes,
        tier: verifiedToken.tier,
        tokenId: verifiedToken.tokenId
      });
    });
    
    it('should pass through JWT validation errors', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer invalid-token');
      const jwtError = new UnauthorizedError('Token expired', 'JWT expired', AuthErrorCode.EXPIRED_TOKEN);
      mockJwtService.verifyToken.mockImplementation(() => {
        throw jwtError;
      });
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(next).toHaveBeenCalledWith(jwtError);
    });
  });
  
  describe('Scope and tier validation', () => {
    it('should throw UnauthorizedError when required scopes are not present', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository, {
        requiredScopes: ['write:messages']
      });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INSUFFICIENT_PERMISSIONS
        })
      );
    });
    
    it('should proceed when all required scopes are present', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository, {
        requiredScopes: ['read:profile']
      });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should throw UnauthorizedError when required tier is not matched', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository, {
        requiredTier: 'domain'
      });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INSUFFICIENT_PERMISSIONS
        })
      );
    });
    
    it('should proceed when required tier matches', () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository, {
        requiredTier: 'edge'
      });
      
      // Act
      middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(next).toHaveBeenCalledWith();
    });
  });
  
  describe('Environment awareness', () => {
    it('should create a dev user when in local environment with auth bypass', async () => {
      // Arrange
      (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(true);
      (environmentService.isAuthRequired as jest.Mock).mockReturnValue(false);
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'dev-user-123',
        email: 'dev@example.com',
        displayName: 'Development User',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        authProviders: {},
        apiKeys: {}
      });
      
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('dev-user-123');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
      expect(res.setHeader).toHaveBeenCalledWith('X-Dev-Auth-Bypass', 'true');
      expect((req as AuthenticatedRequest).user).toBeDefined();
    });
    
    it('should set extended token lifetime header when configured', async () => {
      // Arrange
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      (environmentService.useExtendedTokenLifetime as jest.Mock).mockReturnValue(true);
      
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Extended-Lifetime', 'true');
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should not create a dev user in non-local environments', async () => {
      // Arrange
      (environmentService.isLocalEnvironment as jest.Mock).mockReturnValue(false);
      (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
      
      const middleware = createAuthMiddleware(mockJwtService, mockUserRepository);
      
      // Act
      await middleware(req as Request, res as Response, next);
      
      // Assert
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });
});