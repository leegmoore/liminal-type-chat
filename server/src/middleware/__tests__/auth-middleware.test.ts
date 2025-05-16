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
    res = {};
    next = jest.fn();
    
    // Set up JWT service mock
    mockJwtService.verifyToken.mockReturnValue(verifiedToken);
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
});