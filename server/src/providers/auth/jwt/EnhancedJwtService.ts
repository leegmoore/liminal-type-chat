/**
 * Enhanced JWT Service Implementation
 * 
 * Provides secure JWT token generation and verification
 * with environment-specific asymmetric keys and other security enhancements:
 * - Uses RSA (RS256) for asymmetric signing by default
 * - Environment-specific key isolation
 * - Different token lifetimes for different environments
 * - Key rotation support
 * - Fall-back mechanism for verification with multiple keys
 */
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IJwtService, TokenOptions, TokenPayload, VerifiedToken } from './IJwtService';
import { AuthErrorCode } from '../../../utils/error-codes';
import { UnauthorizedError } from '../../../utils/errors';
import { Environment, EnvironmentService } from '../../../services/core/EnvironmentService';
import { JwtKeyManager } from './JwtKeyManager';
import { logger } from '../../../utils/logger';

/**
 * Enhanced JWT service using asymmetric keys
 */
export class EnhancedJwtService implements IJwtService {
  private initialized: boolean = false;
  
  /**
   * Create a new EnhancedJwtService
   * @param keyManager Manager for JWT keys
   * @param environmentService Service for environment detection
   */
  constructor(
    private readonly keyManager: JwtKeyManager,
    private readonly environmentService: EnvironmentService
  ) {}
  
  /**
   * Initialize the JWT service
   * Ensures key manager is initialized
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.keyManager.initialize();
      this.initialized = true;
    }
  }
  
  /**
   * Generate a JWT token with the provided payload
   * Uses asymmetric keys (RS256) by default
   * 
   * @param payload - Token payload data
   * @param options - Optional token configuration
   * @returns JWT token string
   */
  async generateToken(payload: TokenPayload, options?: TokenOptions): Promise<string> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Get token ID and signing key
    const tokenId = options?.jwtid || uuidv4();
    const keyId = options?.keyId;
    const signingKey = await this.keyManager.getSigningKey(keyId);
    
    // Use appropriate token lifetime based on environment
    const environment = this.environmentService.getEnvironment();
    const useExtendedLifetime = this.environmentService.useExtendedTokenLifetime();
    
    // Default expirations by environment
    const defaultExpiresIn = this.getDefaultTokenLifetime(environment, useExtendedLifetime);
    
    // Prepare token payload
    const tokenPayload = {
      sub: payload.userId,
      email: payload.email,
      name: payload.name,
      scopes: payload.scopes,
      tier: payload.tier,
      jti: tokenId,
      // Extra fields from options will be added to the payload if provided
      ...options?.extraPayload
    };
    
    // Signing options
    const signOptions: jwt.SignOptions = {
      algorithm: options?.algorithm || 'RS256', // RS256 = RSA + SHA256
      expiresIn: options?.expiresIn || defaultExpiresIn,
      keyid: signingKey.keyId, // Include key ID for verification
      jwtid: tokenId
    } as jwt.SignOptions;
    
    try {
      // Sign the token with private key
      const token = jwt.sign(tokenPayload, signingKey.privateKey, signOptions);
      
      logger.debug('Generated JWT token', {
        keyId: signingKey.keyId,
        tokenId,
        expiresIn: signOptions.expiresIn
      });
      
      return token;
    } catch (error) {
      logger.error('Failed to generate JWT token', { error });
      throw new Error(
        `Failed to generate token: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Verify a JWT token and extract its payload
   * Automatically selects the right public key based on token key ID
   * 
   * @param token - JWT token to verify
   * @param options - Optional verification options
   * @returns Verified token data
   * @throws UnauthorizedError if token is invalid, expired, or malformed
   */
  async verifyToken(token: string, options?: jwt.VerifyOptions): Promise<VerifiedToken> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // First, decode the token without verification to get the key ID
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new UnauthorizedError(
          'Invalid token format',
          'Token is missing key ID (kid)',
          AuthErrorCode.INVALID_TOKEN
        );
      }
      
      // Get the key ID from the token
      const keyId = decoded.header.kid as string;
      
      // Get the matching public key for verification
      const publicKey = await this.keyManager.getVerificationKey(keyId);
      
      if (!publicKey) {
        throw new UnauthorizedError(
          'Unknown signing key',
          `Token was signed with unknown key: ${keyId}`,
          AuthErrorCode.INVALID_TOKEN
        );
      }
      
      // Verify with the appropriate public key
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: options?.algorithms || ['RS256'],
        ...options
      };
      
      const decodedToken = jwt.verify(token, publicKey, verifyOptions) as jwt.JwtPayload;
      
      // Map to verified token interface
      return this.mapToVerifiedToken(decodedToken);
      
    } catch (error) {
      // Handle different JWT error types
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          'Authentication token has expired',
          'The provided JWT token has expired',
          AuthErrorCode.EXPIRED_TOKEN
        );
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(
          'Invalid authentication token',
          error.message,
          AuthErrorCode.INVALID_CREDENTIALS
        );
      } else if (error instanceof UnauthorizedError) {
        // Pass through our custom errors
        throw error;
      } else {
        // Generic error handling
        throw new UnauthorizedError(
          'Authentication failed',
          error instanceof Error ? error.message : String(error),
          AuthErrorCode.UNAUTHORIZED
        );
      }
    }
  }
  
  /**
   * Decode a JWT token without verification
   * @param token - JWT token to decode
   * @returns Decoded token data or null if token is invalid
   */
  async decodeToken(token: string): Promise<VerifiedToken | null> {
    try {
      const decodedToken = jwt.decode(token) as jwt.JwtPayload | null;
      
      if (!decodedToken) {
        return null;
      }
      
      return this.mapToVerifiedToken(decodedToken);
    } catch (error) {
      logger.warn('Failed to decode token', { error });
      return null;
    }
  }
  
  /**
   * Map JWT payload to VerifiedToken interface
   * @param decodedToken - Raw JWT payload
   * @returns Verified token data
   * @private
   */
  private mapToVerifiedToken(decodedToken: jwt.JwtPayload): VerifiedToken {
    return {
      userId: decodedToken.sub || '',
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      scopes: Array.isArray(decodedToken.scopes) ? decodedToken.scopes : [],
      tier: (decodedToken.tier as 'edge' | 'domain') || 'edge',
      tokenId: decodedToken.jti || '',
      issuedAt: decodedToken.iat ? Number(decodedToken.iat) : Math.floor(Date.now() / 1000),
      expiresAt: decodedToken.exp ? Number(decodedToken.exp) : Math.floor(Date.now() / 1000) + 3600,
      // Include any additional fields from the token
      extraPayload: this.getExtraPayload(decodedToken)
    };
  }
  
  /**
   * Extract extra payload fields (beyond standard ones)
   * @param decodedToken - Raw JWT payload
   * @returns Extra payload fields
   * @private
   */
  private getExtraPayload(decodedToken: jwt.JwtPayload): Record<string, unknown> {
    // Filter out standard JWT fields
    const standardFields = [
      'sub', 'email', 'name', 'scopes', 'tier', 'jti', 'iat', 'exp', 'nbf', 'iss', 'aud'
    ];
    
    // Create a new object with only non-standard fields
    const extraFields: Record<string, unknown> = {};
    
    Object.keys(decodedToken).forEach(key => {
      if (!standardFields.includes(key)) {
        extraFields[key] = decodedToken[key];
      }
    });
    
    return extraFields;
  }
  
  /**
   * Get the default token lifetime based on environment
   * @param environment - The current environment
   * @param useExtendedLifetime - Whether to use extended lifetimes
   * @returns Default expiration time
   * @private
   */
  private getDefaultTokenLifetime(
    environment: Environment,
    useExtendedLifetime: boolean
  ): string {
    // In production/staging, use short-lived tokens
    if (environment === Environment.PRODUCTION || 
        environment === Environment.STAGING) {
      return '15m'; // 15 minutes
    }
    
    // In development/local, use longer lifetimes if allowed
    if (useExtendedLifetime) {
      return '24h'; // 24 hours
    }
    
    // Default fallback
    return '1h'; // 1 hour
  }
}