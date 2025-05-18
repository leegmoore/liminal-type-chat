import {
  IAuthBridgeService,
  EdgeAuthContext,
  DomainAuthContext,
  TokenValidationOptions,
  DomainTokenOptions
} from './IAuthBridgeService';
import { IJwtService } from '../jwt/IJwtService';
import { IUserRepository } from '../../db/users/IUserRepository';
import { UnauthorizedError, ForbiddenError } from '../../../utils/errors';
import { AuthErrorCode } from '../../../utils/error-codes';
import { environmentService, Environment } from '../../../services/core/EnvironmentService';
import { logger } from '../../../utils/logger';

/**
 * AuthBridgeService implements authentication bridging between edge and domain tiers
 * This class handles token validation, generation, and security context management
 */
export class AuthBridgeService implements IAuthBridgeService {
  // Token caching maps to improve performance
  private edgeTokenCache: Map<
    string, 
    { context: EdgeAuthContext, expires: number }
  > = new Map();
  private domainTokenCache: Map<
    string, 
    { context: DomainAuthContext, expires: number }
  > = new Map();
  
  // Cache TTL in milliseconds (default: 5 minutes)
  private readonly cacheTtl: number = 5 * 60 * 1000;
  
  // Default token expiration times (in seconds)
  private readonly defaultExpirationTimes = {
    production: {
      edge: 3600, // 1 hour
      domain: 1800 // 30 minutes
    },
    development: {
      edge: 86400, // 24 hours
      domain: 43200 // 12 hours
    }
  };
  
  // Mapping of edge scopes to domain scopes
  private readonly scopeMapping: Record<string, string[]> = {
    'user:read': ['user:read', 'domain:user:read'],
    'conversation:write': ['conversation:write', 'domain:conversation:write'],
    'conversation:read': ['conversation:read', 'domain:conversation:read'],
    'admin': ['domain:admin']
  };
  
  /**
   * Create a new AuthBridgeService instance
   * 
   * @param jwtService Service for JWT token operations
   * @param userRepository Repository for user operations
   */
  constructor(
    private readonly jwtService: IJwtService,
    private readonly userRepository: IUserRepository
  ) {}
  
  /**
   * Validates an edge tier token and returns the auth context
   * 
   * @param token The edge tier JWT token
   * @param options Optional validation options
   * @returns The edge authentication context
   * @throws AuthError if token is invalid
   */
  async validateEdgeToken(
    token: string,
    options: TokenValidationOptions = {}
  ): Promise<EdgeAuthContext> {
    // Check cache first (if not ignoring expiration)
    if (!options.ignoreExpiration && this.edgeTokenCache.has(token)) {
      const cached = this.edgeTokenCache.get(token);
      if (cached && cached.expires > Date.now()) {
        // If requiredScopes are provided, check them against the cached context
        if (options.requiredScopes && options.requiredScopes.length > 0) {
          this.checkRequiredScopes(cached.context.scopes, options.requiredScopes);
        }
        return cached.context;
      }
      // Remove expired entry
      this.edgeTokenCache.delete(token);
    }
    
    try {
      // Verify the token - this returns a VerifiedToken with the payload
      const verifiedToken = await this.jwtService.verifyToken(token);
      
      // Ensure token is for edge tier
      if (verifiedToken.tier !== 'edge') {
        logger.warn('Token tier mismatch: expected "edge", got:', verifiedToken.tier);
        throw new UnauthorizedError(
          'Invalid token tier',
          AuthErrorCode.UNAUTHORIZED
        );
      }
      
      // Verify user still exists
      const userId = verifiedToken.userId;
      try {
        await this.userRepository.getUserById(userId);
      } catch {
        logger.warn(`User not found for token: ${userId}`);
        throw new UnauthorizedError(
          'User not found',
          AuthErrorCode.UNAUTHORIZED
        );
      }
      
      // Create edge auth context from verified token
      const context: EdgeAuthContext = {
        userId,
        email: verifiedToken.email,
        name: verifiedToken.name,
        scopes: verifiedToken.scopes || [],
        tier: 'edge',
        tokenId: verifiedToken.tokenId,
        issuedAt: this.dateToTimestamp(verifiedToken.issuedAt),
        expiresAt: this.dateToTimestamp(verifiedToken.expiresAt)
      };
      
      // Check required scopes if specified
      if (options.requiredScopes && options.requiredScopes.length > 0) {
        this.checkRequiredScopes(context.scopes, options.requiredScopes);
      }
      
      // Cache valid token
      this.edgeTokenCache.set(token, {
        context,
        expires: Date.now() + this.cacheTtl
      });
      
      return context;
    } catch (error) {
      // Rethrow if already an UnauthorizedError or ForbiddenError
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      
      // Log unexpected errors
      logger.error('Error validating edge token');
      throw new UnauthorizedError(
        'Invalid token',
        AuthErrorCode.UNAUTHORIZED
      );
    }
  }
  
  /**
   * Generates a domain tier token from an edge authentication context
   * 
   * @param edgeContext The edge authentication context
   * @param options Optional domain token generation options
   * @returns A JWT token for domain tier access
   * @throws AuthError if token cannot be generated
   */
  async generateDomainToken(
    edgeContext: EdgeAuthContext,
    options: DomainTokenOptions = {}
  ): Promise<string> {
    try {
      // Map edge scopes to domain scopes
      const domainScopes = this.mapToDomainScopes(edgeContext.scopes);
      
      // Add additional scopes if specified
      if (options.additionalScopes) {
        domainScopes.push(...options.additionalScopes);
      }
      
      // Determine token expiration time
      const expiresIn = options.expiresInSeconds || this.getDomainTokenExpiration();
      
      // Create token payload with domain tier properties
      const token = await this.jwtService.generateToken(
        {
          userId: edgeContext.userId,
          email: edgeContext.email,
          name: edgeContext.name || '',
          scopes: domainScopes,
          tier: 'domain'
        },
        {
          // Convert number to string to match expected type (e.g., "1800s")
          expiresIn: `${expiresIn}s`,
          extraPayload: {
            sourceTokenId: edgeContext.tokenId
          }
        }
      );
      
      return token;
    } catch {
      logger.error('Error generating domain token');
      throw new UnauthorizedError(
        'Failed to generate domain token',
        AuthErrorCode.UNAUTHORIZED
      );
    }
  }
  
  /**
   * Validates a domain tier token and returns the auth context
   * 
   * @param token The domain tier JWT token
   * @param options Optional validation options
   * @returns The domain authentication context
   * @throws AuthError if token is invalid
   */
  async validateDomainToken(
    token: string,
    options: TokenValidationOptions = {}
  ): Promise<DomainAuthContext> {
    // Check cache first (if not ignoring expiration)
    if (!options.ignoreExpiration && this.domainTokenCache.has(token)) {
      const cached = this.domainTokenCache.get(token);
      if (cached && cached.expires > Date.now()) {
        // If requiredScopes are provided, check them against the cached context
        if (options.requiredScopes && options.requiredScopes.length > 0) {
          this.checkRequiredScopes(cached.context.domainScopes, options.requiredScopes);
        }
        return cached.context;
      }
      // Remove expired entry
      this.domainTokenCache.delete(token);
    }
    
    try {
      // Verify the token
      const verifiedToken = await this.jwtService.verifyToken(token);
      
      // Ensure token is for domain tier
      if (verifiedToken.tier !== 'domain') {
        logger.warn('Token tier mismatch: expected "domain", got:', verifiedToken.tier);
        throw new UnauthorizedError(
          'Invalid token tier',
          AuthErrorCode.UNAUTHORIZED
        );
      }
      
      // Verify user still exists
      const userId = verifiedToken.userId;
      try {
        await this.userRepository.getUserById(userId);
      } catch {
        logger.warn(`User not found for token: ${userId}`);
        throw new UnauthorizedError(
          'User not found',
          AuthErrorCode.UNAUTHORIZED
        );
      }
      
      // Get source token ID from extraPayload or use empty string as fallback
      const sourceTokenId = verifiedToken.extraPayload?.sourceTokenId as string || '';
      
      // Create domain auth context
      const context: DomainAuthContext = {
        userId,
        email: verifiedToken.email,
        name: verifiedToken.name,
        scopes: verifiedToken.scopes || [],
        tier: 'domain',
        tokenId: verifiedToken.tokenId,
        issuedAt: this.dateToTimestamp(verifiedToken.issuedAt),
        expiresAt: this.dateToTimestamp(verifiedToken.expiresAt),
        domainScopes: verifiedToken.scopes || [],
        sourceTokenId
      };
      
      // Check required scopes if specified
      if (options.requiredScopes && options.requiredScopes.length > 0) {
        this.checkRequiredScopes(context.domainScopes, options.requiredScopes);
      }
      
      // Cache valid token
      this.domainTokenCache.set(token, {
        context,
        expires: Date.now() + this.cacheTtl
      });
      
      return context;
    } catch (error) {
      // Rethrow if already an UnauthorizedError or ForbiddenError
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      
      // Log unexpected errors
      logger.error('Error validating domain token');
      throw new UnauthorizedError(
        'Invalid token',
        AuthErrorCode.UNAUTHORIZED
      );
    }
  }
  
  /**
   * Maps edge scopes to domain scopes based on predefined mapping
   * 
   * @param edgeScopes Array of edge scopes
   * @returns Array of domain scopes
   */
  private mapToDomainScopes(edgeScopes: string[]): string[] {
    const domainScopes = new Set<string>();
    
    // Always add base domain access scope
    domainScopes.add('domain:access');
    
    // Map each edge scope to its domain equivalents
    for (const scope of edgeScopes) {
      if (this.scopeMapping[scope]) {
        for (const mappedScope of this.scopeMapping[scope]) {
          domainScopes.add(mappedScope);
        }
      } else {
        // If no mapping exists, pass through the original scope
        domainScopes.add(scope);
      }
    }
    
    return Array.from(domainScopes);
  }
  
  /**
   * Checks if required scopes are present in given scopes
   * 
   * @param scopes Array of scopes to check
   * @param requiredScopes Array of required scopes
   * @throws ForbiddenError if any required scope is missing
   */
  private checkRequiredScopes(scopes: string[], requiredScopes: string[]): void {
    for (const requiredScope of requiredScopes) {
      if (!scopes.includes(requiredScope)) {
        logger.warn(`Missing required scope: ${requiredScope}`);
        throw new ForbiddenError(
          `Missing required scope: ${requiredScope}`,
          AuthErrorCode.INSUFFICIENT_PERMISSIONS
        );
      }
    }
  }
  
  /**
   * Gets domain token expiration time based on environment
   * 
   * @returns Expiration time in seconds
   */
  private getDomainTokenExpiration(): number {
    if (environmentService.getEnvironment() === Environment.PRODUCTION) {
      return this.defaultExpirationTimes.production.domain;
    }
    return this.defaultExpirationTimes.development.domain;
  }
  
  /**
   * Converts a Date object or number to a UNIX timestamp (seconds since epoch)
   * 
   * @param date The date or timestamp to convert
   * @returns The UNIX timestamp in seconds
   */
  private dateToTimestamp(date: Date | number): number {
    if (typeof date === 'number') {
      return date;
    }
    return Math.floor(date.getTime() / 1000);
  }
}