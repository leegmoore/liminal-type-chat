/**
 * JWT Service Implementation
 * Handles JWT token generation, verification, and decoding
 */
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IJwtService, TokenOptions, TokenPayload, VerifiedToken } from './IJwtService';
import { AuthErrorCode } from '../../../utils/error-codes';
import { UnauthorizedError } from '../../../utils/errors';

/**
 * Implementation of IJwtService using jsonwebtoken library
 */
export class JwtService implements IJwtService {
  private readonly secretKey: string;
  private readonly defaultExpiresIn: string = '30m';
  
  /**
   * Create a new JwtService
   * @throws Error if JWT_SECRET environment variable is not set
   */
  constructor() {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.secretKey = secretKey;
  }
  
  /**
   * Generate a JWT token with the provided payload
   * @param payload - Token payload data
   * @param options - Optional token configuration
   * @returns JWT token string
   */
  generateToken(payload: TokenPayload, options?: TokenOptions): string {
    const tokenId = uuidv4();
    const tokenPayload = {
      sub: payload.userId,
      email: payload.email,
      name: payload.name,
      scopes: payload.scopes,
      tier: payload.tier,
      jti: tokenId
    };
    
    // Use type assertion to satisfy the SignOptions interface
    // Cast expiresIn to a type that jwt.sign will accept
    let expiresIn = options?.expiresIn || process.env.JWT_EXPIRES_IN || this.defaultExpiresIn;
    
    // Normalize expiresIn to ensure it's properly formatted for jwt.sign
    // This handles both string (e.g., '30m') and number (e.g., 1800) formats
    if (typeof expiresIn === 'number') {
      expiresIn = `${expiresIn}s`; // Convert to seconds string format
    }
    
    // Pass options directly to jwt.sign
    return jwt.sign(tokenPayload, this.secretKey, { expiresIn } as jwt.SignOptions);
  }
  
  /**
   * Verify a JWT token and extract its payload
   * @param token - JWT token to verify
   * @returns Verified token data
   * @throws UnauthorizedError if token is invalid, expired, or malformed
   */
  verifyToken(token: string): VerifiedToken {
    try {
      const decodedToken = jwt.verify(token, this.secretKey) as jwt.JwtPayload;
      
      return this.mapToVerifiedToken(decodedToken);
    } catch (error) {
      // Use type guard to check error type
      const tokenError = error as Error;
      if (tokenError.name === 'TokenExpiredError') {
        throw new UnauthorizedError(
          'Authentication token has expired',
          'The provided JWT token has expired',
          AuthErrorCode.EXPIRED_TOKEN
        );
      } else if (tokenError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError(
          'Invalid authentication token',
          tokenError.message,
          AuthErrorCode.INVALID_CREDENTIALS
        );
      } else {
        throw new UnauthorizedError(
          'Authentication failed',
          tokenError.message,
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
  decodeToken(token: string): VerifiedToken | null {
    const decodedToken = jwt.decode(token) as jwt.JwtPayload | null;
    
    if (!decodedToken) {
      return null;
    }
    
    return this.mapToVerifiedToken(decodedToken);
  }
  
  /**
   * Map JWT payload to VerifiedToken interface
   * @param decodedToken - Raw JWT payload
   * @returns Verified token data
   */
  private mapToVerifiedToken(decodedToken: jwt.JwtPayload): VerifiedToken {
    return {
      userId: decodedToken.sub || '',
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      scopes: Array.isArray(decodedToken.scopes) ? decodedToken.scopes : [],
      tier: (decodedToken.tier as 'edge' | 'domain') || 'edge',
      tokenId: decodedToken.jti || '',
      issuedAt: decodedToken.iat ? new Date(decodedToken.iat * 1000) : new Date(),
      expiresAt: decodedToken.exp ? new Date(decodedToken.exp * 1000) : new Date()
    };
  }
}