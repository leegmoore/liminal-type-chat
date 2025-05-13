/**
 * Tests for authentication utilities
 */
import { Response } from 'express';
import { AuthenticatedRequest } from '../auth-middleware';
import { requireUserId, hasScope, isTier, withAuthenticatedUser } from '../auth-utils';
import { UnauthorizedError } from '../../utils/errors';
import { AuthErrorCode } from '../../utils/error-codes';

describe('Auth Utilities', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up request, response, and next function
    req = {};
    res = {};
    next = jest.fn();
  });
  
  describe('requireUserId', () => {
    it('should return userId when present', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: [],
        tier: 'edge',
        tokenId: 'token-123'
      };
      
      // Act
      const result = requireUserId(req as AuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(result).toBe('user-123');
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with UnauthorizedError when userId is missing', () => {
      // Arrange
      req.user = undefined;
      
      // Act
      const result = requireUserId(req as AuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(result).toBe('');
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
  
  describe('hasScope', () => {
    it('should return true when user has required scope', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile', 'write:messages'],
        tier: 'edge',
        tokenId: 'token-123'
      };
      
      // Act
      const result = hasScope(req as AuthenticatedRequest, 'read:profile', next);
      
      // Assert
      expect(result).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return false and call next with UnauthorizedError when scope is missing', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge',
        tokenId: 'token-123'
      };
      
      // Act
      const result = hasScope(req as AuthenticatedRequest, 'write:messages', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INSUFFICIENT_PERMISSIONS
        })
      );
    });
    
    it('should return false and call next with UnauthorizedError when user is missing', () => {
      // Arrange
      req.user = undefined;
      
      // Act
      const result = hasScope(req as AuthenticatedRequest, 'read:profile', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
  
  describe('isTier', () => {
    it('should return true when user is at required tier', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'token-123'
      };
      
      // Act
      const result = isTier(req as AuthenticatedRequest, 'domain', next);
      
      // Assert
      expect(result).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return false and call next with UnauthorizedError when tier does not match', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge',
        tokenId: 'token-123'
      };
      
      // Act
      const result = isTier(req as AuthenticatedRequest, 'domain', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INSUFFICIENT_PERMISSIONS
        })
      );
    });
    
    it('should return false and call next with UnauthorizedError when user is missing', () => {
      // Arrange
      req.user = undefined;
      
      // Act
      const result = isTier(req as AuthenticatedRequest, 'edge', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
  
  describe('withAuthenticatedUser', () => {
    it('should call handler with userId when authenticated', async () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge',
        tokenId: 'token-123'
      };
      
      const mockHandler = jest.fn().mockResolvedValue('handler-result');
      const middleware = withAuthenticatedUser(mockHandler);
      
      // Act
      await middleware(req as AuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(mockHandler).toHaveBeenCalledWith(
        'user-123',
        req,
        res,
        next
      );
    });
    
    it('should not call handler when user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      
      const mockHandler = jest.fn().mockResolvedValue('handler-result');
      const middleware = withAuthenticatedUser(mockHandler);
      
      // Act
      await middleware(req as AuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(mockHandler).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
    
    it('should call next with error when handler throws', async () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge',
        tokenId: 'token-123'
      };
      
      const testError = new Error('Test error');
      const mockHandler = jest.fn().mockRejectedValue(testError);
      const middleware = withAuthenticatedUser(mockHandler);
      
      // Act
      await middleware(req as AuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});