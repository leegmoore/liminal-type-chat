/**
 * Tests for domain authentication utilities
 */
import { Response } from 'express';
import { DomainAuthenticatedRequest } from '../domain-auth-middleware';
import { 
  requireDomainUserId, 
  hasDomainScope, 
  isResourceOwner, 
  withDomainAuthenticatedUser 
} from '../domain-auth-utils';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { AuthErrorCode } from '../../utils/error-codes';

describe('Domain Auth Utilities', () => {
  let req: Partial<DomainAuthenticatedRequest>;
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
  
  describe('requireDomainUserId', () => {
    it('should return userId when present', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: [],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile'],
        sourceTokenId: 'edge-token-123'
      };
      
      // Act
      const result = requireDomainUserId(req as DomainAuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(result).toBe('user-123');
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should call next with UnauthorizedError when userId is missing', () => {
      // Arrange
      req.user = undefined;
      
      // Act
      const result = requireDomainUserId(req as DomainAuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(result).toBe('');
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Domain user ID required'
        })
      );
    });
  });
  
  describe('hasDomainScope', () => {
    it('should return true when user has required domain scope', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile', 'domain:write:messages'],
        sourceTokenId: 'edge-token-123'
      };
      
      // Act
      const result = hasDomainScope(req as DomainAuthenticatedRequest, 'domain:read:profile', next);
      
      // Assert
      expect(result).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return false and call next with UnauthorizedError when domain scope is missing', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile'],
        sourceTokenId: 'edge-token-123'
      };
      
      // Act
      const result = hasDomainScope(req as DomainAuthenticatedRequest, 'domain:write:messages', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          message: 'Insufficient domain permissions'
        })
      );
    });
    
    it('should return false and call next with UnauthorizedError when user is missing', () => {
      // Arrange
      req.user = undefined;
      
      // Act
      const result = hasDomainScope(req as DomainAuthenticatedRequest, 'domain:read:profile', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Domain authentication required'
        })
      );
    });
  });
  
  describe('isResourceOwner', () => {
    it('should return true when user owns the resource', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile'],
        sourceTokenId: 'edge-token-123'
      };
      
      // Act
      const result = isResourceOwner(req as DomainAuthenticatedRequest, 'user-123', 'domain:admin', next);
      
      // Assert
      expect(result).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return true when user has admin scope but does not own the resource', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile', 'domain:admin'],
        sourceTokenId: 'edge-token-123'
      };
      
      // Act
      const result = isResourceOwner(req as DomainAuthenticatedRequest, 'other-user-456', 'domain:admin', next);
      
      // Assert
      expect(result).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return false and call next with ForbiddenError when user does not own the resource', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile'],
        sourceTokenId: 'edge-token-123'
      };
      
      // Act
      const result = isResourceOwner(req as DomainAuthenticatedRequest, 'other-user-456', 'domain:admin', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Resource access forbidden'
        })
      );
    });
    
    it('should return false and call next with UnauthorizedError when user is missing', () => {
      // Arrange
      req.user = undefined;
      
      // Act
      const result = isResourceOwner(req as DomainAuthenticatedRequest, 'user-123', 'domain:admin', next);
      
      // Assert
      expect(result).toBe(false);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Domain authentication required'
        })
      );
    });
  });
  
  describe('withDomainAuthenticatedUser', () => {
    it('should call handler with userId when domain authenticated', async () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile'],
        sourceTokenId: 'edge-token-123'
      };
      
      const mockHandler = jest.fn().mockResolvedValue('handler-result');
      const middleware = withDomainAuthenticatedUser(mockHandler);
      
      // Act
      await middleware(req as DomainAuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(mockHandler).toHaveBeenCalledWith(
        'user-123',
        req,
        res,
        next
      );
    });
    
    it('should not call handler when user is not domain authenticated', async () => {
      // Arrange
      req.user = undefined;
      
      const mockHandler = jest.fn().mockResolvedValue('handler-result');
      const middleware = withDomainAuthenticatedUser(mockHandler);
      
      // Act
      await middleware(req as DomainAuthenticatedRequest, res as Response, next);
      
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
        tier: 'domain',
        tokenId: 'domain-token-123',
        domainScopes: ['domain:read:profile'],
        sourceTokenId: 'edge-token-123'
      };
      
      const testError = new Error('Test error');
      const mockHandler = jest.fn().mockRejectedValue(testError);
      const middleware = withDomainAuthenticatedUser(mockHandler);
      
      // Act
      await middleware(req as DomainAuthenticatedRequest, res as Response, next);
      
      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});