/**
 * Authentication middleware
 * Validates JWT tokens and sets user information in the request
 */
import { Request, Response, NextFunction } from 'express';
import { IJwtService } from '../providers/auth/jwt/IJwtService';
import { UnauthorizedError } from '../utils/errors';
import { AuthErrorCode } from '../utils/error-codes';
import { IUserRepository } from '../providers/db/users/IUserRepository';
import { CreateUserParams } from '../models/domain/users/User';
import { environmentService } from '../services/core/EnvironmentService';
import { logger } from '../utils/logger';

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
 * @param userRepository - User repository for dev user creation (in bypass mode)
 * @param options - Authentication options
 * @returns Express middleware function
 */
export function createAuthMiddleware(
  jwtService: IJwtService, 
  userRepository: IUserRepository, 
  options: AuthOptions = {}
) {
  const { required = true, requiredScopes = [], requiredTier } = options;
  
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Try to get token from Authorization header first
    const authHeader = req.header('Authorization');
    
    // If no Authorization header, check for token in cookie
    let token: string | undefined;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    } else if (req.cookies && req.cookies.authToken) {
      // Fallback to cookie-based authentication
      token = req.cookies.authToken;
    }
    
    // If auth is not required and no token provided, proceed without authentication
    if (!required && !token) {
      return next();
    }
    
    // Local environment only - Allow auth bypass if configured
    if (environmentService.isLocalEnvironment() && !environmentService.isAuthRequired()) {
      logger.warn('⚠️ WARNING: Authentication bypass enabled. For local development only!');
      
      // Add development user header for UI to display warning
      _res.setHeader('X-Dev-Auth-Bypass', 'true');
      
      // Add minimal user information for testing
      const mockUser = {
        userId: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        scopes: ['all'],
        tier: 'edge' as 'edge' | 'domain',
        tokenId: 'dev-token-123'
      };
      (req as AuthenticatedRequest).user = mockUser;
      
      // Ensure dev user exists in DB for dev mode
      const devUserId = mockUser.userId;
      try {
        const user = await userRepository.findById(devUserId);
        if (!user) {
          logger.info(`Dev User ${devUserId} not found. Creating...`);
          // Use the structure from CreateUserParams for userRepository.create
          const createUserParams: CreateUserParams = {
            id: devUserId, // Explicitly set the ID for dev user
            email: mockUser.email,
            displayName: mockUser.name,
            // provider, providerId, and providerIdentity are now optional if id is provided
            // and are not relevant for a system-generated dev user.
          };
          await userRepository.create(createUserParams);
          logger.info(`Dev User ${devUserId} created successfully.`);
        }
      } catch (dbError) {
        logger.error(`Error ensuring dev user ${devUserId} exists:`, dbError);
      }
      
      return next();
    }
    
    // Check if token is present (from header or cookie)
    if (!token) {
      return next(new UnauthorizedError(
        'Authentication required', 
        'No authentication token provided'
      ));
    }
    
    try {
      // Verify the token
      const verifiedToken = await jwtService.verifyToken(token);
      
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
        name: verifiedToken.name || '',
        scopes: verifiedToken.scopes,
        tier: verifiedToken.tier,
        tokenId: verifiedToken.tokenId
      };
      
      // Apply extended token lifetime if configured
      if (environmentService.useExtendedTokenLifetime()) {
        // Add header for frontend to know token lifetime is extended
        _res.setHeader('X-Token-Extended-Lifetime', 'true');
        
        // Log extended token usage in non-local environments
        if (!environmentService.isLocalEnvironment()) {
          logger.warn('Using extended token lifetime in non-local environment', {
            userId: verifiedToken.userId, 
            environment: environmentService.getEnvironment() 
          });
        }
      }
      
      next();
    } catch (error) {
      // JWT validation errors are already handled in the JwtService
      next(error);
    }
  };
}