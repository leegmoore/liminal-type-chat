/**
 * Interface for JWT service
 * Handles JWT token generation, verification, and decoding
 */

/**
 * Token generation options
 */
export interface TokenOptions {
  /** Token expiration time (e.g., '15m', '1h', '7d') */
  expiresIn?: string;
}

/**
 * Token payload data
 */
export interface TokenPayload {
  /** User ID - will be stored as 'sub' in JWT */
  userId: string;
  /** User email address */
  email: string;
  /** User display name */
  name: string;
  /** Permission scopes */
  scopes: string[];
  /** Security tier ('edge' or 'domain') */
  tier: 'edge' | 'domain';
}

/**
 * Verified token data
 */
export interface VerifiedToken extends TokenPayload {
  /** Token unique identifier */
  tokenId: string;
  /** Token issued at timestamp */
  issuedAt: Date;
  /** Token expiration timestamp */
  expiresAt: Date;
}

/**
 * JWT Service Interface
 */
export interface IJwtService {
  /**
   * Generate a JWT token for a user
   * @param payload - Token payload data
   * @param options - Optional token configuration
   * @returns JWT token string
   */
  generateToken(payload: TokenPayload, options?: TokenOptions): string;
  
  /**
   * Verify a JWT token and extract its payload
   * @param token - JWT token to verify
   * @returns Verified token data
   * @throws UnauthorizedError if token is invalid, expired, or malformed
   */
  verifyToken(token: string): VerifiedToken;
  
  /**
   * Decode a JWT token without verification
   * @param token - JWT token to decode
   * @returns Decoded token data or null if token is invalid
   */
  decodeToken(token: string): VerifiedToken | null;
}