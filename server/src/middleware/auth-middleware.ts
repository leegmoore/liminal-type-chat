/**
 * Authentication middleware
 * Validates JWT tokens and sets user information in the request
 */
import { Request, Response, NextFunction } from 'express';
import { IJwtService } from '../providers/auth/jwt/IJwtService';
import { UnauthorizedError } from '../utils/errors';
import { AuthErrorCode } from '../utils/error-codes';

/**
 * Authenticated request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    scopes: string[];
    tier: 'edge' | 'domain';
    tokenId: string;
  };
}

/**
 * Authentication middleware options
 */
export interface AuthOptions {
  /** Whether authentication is required (default: true) */
  required?: boolean;
  /** Specific scopes required to access the resource */
  requiredScopes?: string[];
  /** Security tier required to access the resource */
  requiredTier?: 'edge' | 'domain';
}

/**
 * Create authentication middleware
 * @param jwtService - JWT service for token verification
 * @param options - Authentication options
 * @returns Express middleware function
 */
export function createAuthMiddleware(jwtService: IJwtService, options: AuthOptions = {}) {
  const { required = true, requiredScopes = [], requiredTier } = options;
  
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');
    
    // If auth is not required and no token provided, proceed without authentication
    if (!required && !authHeader) {
      return next();
    }
    
    // Check if Authorization header is present
    if (!authHeader) {
      return next(new UnauthorizedError(
        'Authentication required', 
        'No authorization header provided'
      ));
    }
    
    // Check if the format is correct (Bearer token)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(new UnauthorizedError(
        'Invalid authorization format',
        'Authorization header must be in the format: Bearer [token]',
        AuthErrorCode.INVALID_CREDENTIALS
      ));
    }
    
    const token = parts[1];
    
    try {
      // Verify the token
      const verifiedToken = jwtService.verifyToken(token);
      
      // Check if the token has the required scopes
      if (requiredScopes.length > 0) {
        const hasRequiredScopes = requiredScopes.every(scope => 
          verifiedToken.scopes.includes(scope)
        );
        
        if (!hasRequiredScopes) {
          return next(new UnauthorizedError(
            'Insufficient permissions',
            `This operation requires the following scopes: ${requiredScopes.join(', ')}`,
            AuthErrorCode.INSUFFICIENT_PERMISSIONS
          ));
        }
      }
      
      // Check if the token has the required tier
      if (requiredTier && verifiedToken.tier !== requiredTier) {
        return next(new UnauthorizedError(
          'Insufficient permissions',
          `This operation requires ${requiredTier} tier access`,
          AuthErrorCode.INSUFFICIENT_PERMISSIONS
        ));
      }
      
      // Attach user information to the request
      (req as AuthenticatedRequest).user = {
        userId: verifiedToken.userId,
        email: verifiedToken.email,
        name: verifiedToken.name,
        scopes: verifiedToken.scopes,
        tier: verifiedToken.tier,
        tokenId: verifiedToken.tokenId
      };
      
      next();
    } catch (error) {
      // JWT validation errors are already handled in the JwtService
      next(error);
    }
  };
}