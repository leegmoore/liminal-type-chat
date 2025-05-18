/**
 * Domain-specific authentication middleware
 * Validates JWT tokens for domain tier access and sets domain user information in the request
 */
import { Request, Response, NextFunction } from 'express';
import { 
  IAuthBridgeService, 
  TokenValidationOptions 
} from '../providers/auth/bridge/IAuthBridgeService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthErrorCode } from '../utils/error-codes';
import { environmentService } from '../services/core/EnvironmentService';
import { logger } from '../utils/logger';

/**
 * Domain authenticated request with domain-specific user information
 */
export interface DomainAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    scopes: string[];
    tier: string;
    tokenId?: string;
    domainScopes?: string[];
    sourceTokenId?: string;
  };
}

/**
 * Domain authentication middleware options
 */
export interface DomainAuthOptions {
  /** Whether authentication is required (default: true) */
  required?: boolean;
  /** Specific domain scopes required to access the resource */
  requiredDomainScopes?: string[];
  /** Path parameter name for resource ownership validation */
  resourceOwnershipParam?: string;
  /** Admin scope that bypasses resource ownership validation */
  adminScope?: string;
}

/**
 * Create domain-specific authentication middleware
 * @param authBridgeService - Auth bridge service for token validation
 * @param options - Domain authentication options
 * @returns Express middleware function
 */
export function createDomainAuthMiddleware(
  authBridgeService: IAuthBridgeService, 
  options: DomainAuthOptions = {}
) {
  const { 
    required = true, 
    requiredDomainScopes = [], 
    resourceOwnershipParam,
    adminScope = 'domain:admin'
  } = options;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');
    
    // If auth is not required and no token provided, proceed without authentication
    if (!required && !authHeader) {
      return next();
    }
    
    // Local environment only - Allow auth bypass if configured
    if (environmentService.isLocalEnvironment() && !environmentService.isAuthRequired()) {
      logger.warn('⚠️ WARNING: Domain authentication bypass enabled. For local development only!');
      
      // Add development user header for UI to display warning
      res.setHeader('X-Dev-Auth-Bypass', 'true');
      
      // Add domain-specific user information for testing
      const mockUser = {
        userId: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        scopes: ['all'],
        tier: 'domain' as const,
        tokenId: 'dev-domain-token-123',
        domainScopes: [
          'domain:admin', 
          'domain:read:profile', 
          'domain:write:messages'
        ],
        sourceTokenId: 'dev-edge-token-123'
      };
      
      (req as DomainAuthenticatedRequest).user = mockUser;
      return next();
    }
    
    // Check if Authorization header is present
    if (!authHeader) {
      return next(new UnauthorizedError(
        'Domain authentication required', 
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
      // Set validation options
      const validationOptions: TokenValidationOptions = {
        ignoreExpiration: false
      };
      
      // Verify the domain token
      const domainContext = await authBridgeService.validateDomainToken(token, validationOptions);
      
      // Check if the token has the required domain scopes
      if (requiredDomainScopes.length > 0) {
        const hasRequiredScopes = requiredDomainScopes.every(
          scope => domainContext.domainScopes.includes(scope)
        );
        
        if (!hasRequiredScopes) {
          const scopesStr = requiredDomainScopes.join(', ');
          return next(new UnauthorizedError(
            'Insufficient domain permissions',
            `This operation requires the following domain scopes: ${scopesStr}`,
            AuthErrorCode.INSUFFICIENT_PERMISSIONS
          ));
        }
      }
      
      // Check resource ownership if parameter is specified
      if (resourceOwnershipParam && 
          req.params[resourceOwnershipParam] && 
          !domainContext.domainScopes.includes(adminScope)) {
        
        const resourceOwnerId = req.params[resourceOwnershipParam];
        
        // If resource owner ID doesn't match authenticated user ID
        if (resourceOwnerId !== domainContext.userId) {
          return next(new ForbiddenError(
            'Resource access forbidden',
            'You do not have permission to access this resource'
          ));
        }
      }
      
      // Attach domain user information to the request
      (req as DomainAuthenticatedRequest).user = {
        userId: domainContext.userId,
        email: domainContext.email,
        name: domainContext.name || '',
        scopes: domainContext.scopes,
        tier: domainContext.tier,
        tokenId: domainContext.tokenId,
        domainScopes: domainContext.domainScopes,
        sourceTokenId: domainContext.sourceTokenId
      };
      
      // Apply extended token lifetime if configured
      if (environmentService.useExtendedTokenLifetime()) {
        // Add header for frontend to know token lifetime is extended
        res.setHeader('X-Token-Extended-Lifetime', 'true');
        
        // Log extended token usage in non-local environments
        if (!environmentService.isLocalEnvironment()) {
          logger.warn('Using extended token lifetime in non-local environment', {
            userId: domainContext.userId, 
            environment: environmentService.getEnvironment() 
          });
        }
      }
      
      next();
    } catch (error) {
      // Pass through auth errors
      next(error);
    }
  };
}