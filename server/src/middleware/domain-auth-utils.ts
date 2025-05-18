/**
 * Domain authentication utilities
 * Helper functions for working with domain authentication in route handlers
 */
import { Response, NextFunction } from 'express';
import { DomainAuthenticatedRequest } from './domain-auth-middleware';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthErrorCode } from '../utils/error-codes';

/**
 * Extracts user ID from authenticated domain request
 * @param req - Express request object with domain user information
 * @param res - Express response object
 * @param next - Express next function
 * @returns User ID
 */
export function requireDomainUserId(
  req: DomainAuthenticatedRequest, 
  _res: Response, 
  next: NextFunction
): string {
  if (!req.user || !req.user.userId) {
    next(new UnauthorizedError(
      'Domain user ID required', 
      'User ID not found in domain authenticated request'
    ));
    return '';
  }
  
  return req.user.userId;
}

/**
 * Checks if the authenticated domain user has the specified domain scope
 * @param req - Express request object with domain user information
 * @param scope - Domain permission scope to check
 * @param next - Express next function
 * @returns true if user has the scope, false otherwise
 */
export function hasDomainScope(
  req: DomainAuthenticatedRequest, 
  scope: string,
  next: NextFunction
): boolean {
  if (!req.user || !req.user.domainScopes) {
    next(new UnauthorizedError(
      'Domain authentication required', 
      'Domain scopes not found in authenticated request'
    ));
    return false;
  }
  
  const hasRequiredScope = req.user.domainScopes.includes(scope);
  
  if (!hasRequiredScope) {
    next(new UnauthorizedError(
      'Insufficient domain permissions',
      `This operation requires the ${scope} domain scope`,
      AuthErrorCode.INSUFFICIENT_PERMISSIONS
    ));
    return false;
  }
  
  return true;
}

/**
 * Checks if the authenticated user owns the specified resource
 * @param req - Express request object with domain user information
 * @param resourceOwnerId - ID of the resource owner to check against
 * @param adminScope - Optional admin scope that bypasses ownership check
 * @param next - Express next function
 * @returns true if user owns the resource or has admin scope, false otherwise
 */
export function isResourceOwner(
  req: DomainAuthenticatedRequest,
  resourceOwnerId: string,
  adminScope = 'domain:admin',
  next: NextFunction
): boolean {
  if (!req.user || !req.user.userId) {
    next(new UnauthorizedError(
      'Domain authentication required', 
      'User information not found in domain authenticated request'
    ));
    return false;
  }
  
  // Admin users can access any resource
  if (req.user.domainScopes && req.user.domainScopes.includes(adminScope)) {
    return true;
  }
  
  // Check if the user ID matches the resource owner ID
  const isOwner = req.user.userId === resourceOwnerId;
  
  if (!isOwner) {
    next(new ForbiddenError(
      'Resource access forbidden',
      'You do not have permission to access this resource'
    ));
    return false;
  }
  
  return true;
}

/**
 * Creates an authenticated domain route handler that requires a user ID
 */
export function withDomainAuthenticatedUser<T>(
  handler: (
    userId: string, 
    req: DomainAuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ) => Promise<T>
) {
  return async (
    req: DomainAuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void | undefined> => {
    try {
      const userId = requireDomainUserId(req, res, next);
      
      // If userId is empty, an error was already passed to next()
      if (!userId) return undefined;
      
      await handler(userId, req, res, next);
      return undefined;
    } catch (error) {
      next(error);
      return undefined;
    }
  };
}