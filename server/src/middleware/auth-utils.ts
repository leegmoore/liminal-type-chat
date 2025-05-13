/**
 * Authentication utilities
 * Helper functions for working with authentication in route handlers
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth-middleware';
import { UnauthorizedError } from '../utils/errors';
import { AuthErrorCode } from '../utils/error-codes';

/**
 * Extracts user ID from authenticated request
 * @param req - Express request object with user information
 * @param res - Express response object
 * @param next - Express next function
 * @returns User ID
 */
export function requireUserId(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): string {
  if (!req.user || !req.user.userId) {
    next(new UnauthorizedError('User ID required', 'User ID not found in authenticated request'));
    return '';
  }
  
  return req.user.userId;
}

/**
 * Checks if the authenticated user has the specified scope
 * @param req - Express request object with user information
 * @param scope - Permission scope to check
 * @param next - Express next function
 * @returns true if user has the scope, false otherwise
 */
export function hasScope(
  req: AuthenticatedRequest, 
  scope: string,
  next: NextFunction
): boolean {
  if (!req.user || !req.user.scopes) {
    next(new UnauthorizedError(
      'Authentication required', 
      'User scopes not found in authenticated request'
    ));
    return false;
  }
  
  const hasRequiredScope = req.user.scopes.includes(scope);
  
  if (!hasRequiredScope) {
    next(new UnauthorizedError(
      'Insufficient permissions',
      `This operation requires the ${scope} scope`,
      AuthErrorCode.INSUFFICIENT_PERMISSIONS
    ));
    return false;
  }
  
  return true;
}

/**
 * Checks if the authenticated user is operating at the specified tier
 * @param req - Express request object with user information
 * @param tier - Security tier to check ('edge' or 'domain')
 * @param next - Express next function
 * @returns true if user is at the specified tier, false otherwise
 */
export function isTier(
  req: AuthenticatedRequest, 
  tier: 'edge' | 'domain',
  next: NextFunction
): boolean {
  if (!req.user || !req.user.tier) {
    next(new UnauthorizedError(
      'Authentication required', 
      'User tier not found in authenticated request'
    ));
    return false;
  }
  
  const isRequiredTier = req.user.tier === tier;
  
  if (!isRequiredTier) {
    next(new UnauthorizedError(
      'Insufficient permissions',
      `This operation requires ${tier} tier access`,
      AuthErrorCode.INSUFFICIENT_PERMISSIONS
    ));
    return false;
  }
  
  return true;
}

/**
 * Creates an authenticated route handler that requires a user ID
 * @param handler - Route handler function that requires user ID
 * @returns Express middleware function
 */
export function withAuthenticatedUser<T>(
  handler: (
    userId: string, 
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ) => Promise<T>
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = requireUserId(req, res, next);
      
      // If userId is empty, an error was already passed to next()
      if (!userId) return;
      
      return await handler(userId, req, res, next);
    } catch (error) {
      next(error);
    }
  };
}