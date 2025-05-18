/**
 * Interface for JWT service
 * Handles JWT token generation, verification, and decoding
 */

/**
 * Token generation options
 */
export interface TokenOptions {
  /** Token expiration time (e.g., '15m', '1h', '7d') */
  expiresIn?: string | number;
  
  /** JWT algorithm to use (default: RS256) */
  algorithm?: 'RS256' | 'HS256';
  
  /** Specific key ID to use for signing */
  keyId?: string;
  
  /** Specific JWT ID to include */
  jwtid?: string;
  
  /** Additional payload fields to include */
  extraPayload?: Record<string, unknown>;
}

/**
 * Token verification options
 */
export interface VerifyOptions {
  /** Whether to ignore token expiration */
  ignoreExpiration?: boolean;
  
  /** Allowed algorithms for verification */
  algorithms?: string[];
  
  /** Expected key ID */
  keyId?: string;
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
  name?: string;
  /** Permission scopes */
  scopes: string[];
  /** Security tier ('edge' or 'domain') */
  tier: 'edge' | 'domain';
  /** Source token ID (for domain tokens) */
  sourceTokenId?: string;
}

/**
 * Verified token data
 */
export interface VerifiedToken extends TokenPayload {
  /** Token unique identifier */
  tokenId: string;
  /** Token issued at timestamp (Unix time in seconds) */
  issuedAt: number;
  /** Token expiration timestamp (Unix time in seconds) */
  expiresAt: number;
  /** Any additional fields from the token payload */
  extraPayload?: Record<string, unknown>;
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
  generateToken(payload: TokenPayload, options?: TokenOptions): Promise<string>;
  
  /**
   * Verify a JWT token and extract its payload
   * @param token - JWT token to verify
   * @param options - Optional verification options
   * @returns Verified token data
   * @throws UnauthorizedError if token is invalid, expired, or malformed
   */
  verifyToken(token: string, options?: VerifyOptions): Promise<VerifiedToken>;
  
  /**
   * Decode a JWT token without verification
   * @param token - JWT token to decode
   * @returns Decoded token data or null if token is invalid
   */
  decodeToken(token: string): Promise<VerifiedToken | null>;
}