/**
 * Interface for the AuthBridgeService
 * 
 * This service provides secure authentication bridging between edge and domain tiers
 * by validating tokens, generating new ones with appropriate permissions,
 * and enforcing tier boundaries.
 */

/**
 * Edge authentication context
 * Contains information about an authenticated user at the edge tier
 */
export interface EdgeAuthContext {
  userId: string;
  email: string;
  name?: string;
  scopes: string[];
  tier: 'edge';
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Domain authentication context
 * Contains information about an authenticated user at the domain tier
 */
export interface DomainAuthContext {
  userId: string;
  email: string;
  name?: string;
  scopes: string[];
  tier: 'domain';
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
  domainScopes: string[];
  sourceTokenId: string; // Reference to the edge token that created this domain token
}

/**
 * Options for token validation
 */
export interface TokenValidationOptions {
  ignoreExpiration?: boolean;
  requiredScopes?: string[];
}

/**
 * Options for domain token generation
 */
export interface DomainTokenOptions {
  additionalScopes?: string[];
  expiresInSeconds?: number;
}

/**
 * Interface for the AuthBridgeService that manages authentication between edge and domain tiers
 */
export interface IAuthBridgeService {
  /**
   * Validates an edge tier token and returns the auth context
   * 
   * @param token The edge tier JWT token
   * @param options Optional validation options
   * @returns The edge authentication context
   * @throws AuthError if token is invalid
   */
  validateEdgeToken(token: string, options?: TokenValidationOptions): Promise<EdgeAuthContext>;
  
  /**
   * Generates a domain tier token from an edge authentication context
   * 
   * @param edgeContext The edge authentication context
   * @param options Optional domain token generation options
   * @returns A JWT token for domain tier access
   * @throws AuthError if token cannot be generated
   */
  generateDomainToken(edgeContext: EdgeAuthContext, options?: DomainTokenOptions): Promise<string>;
  
  /**
   * Validates a domain tier token and returns the auth context
   * 
   * @param token The domain tier JWT token
   * @param options Optional validation options
   * @returns The domain authentication context
   * @throws AuthError if token is invalid
   */
  validateDomainToken(token: string, options?: TokenValidationOptions): Promise<DomainAuthContext>;
}