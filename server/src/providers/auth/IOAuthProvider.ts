/**
 * Interface for OAuth provider implementations
 * Defines the common interface that all OAuth providers must implement
 */
import { OAuthProvider as OAuthProviderType } from '../../models/domain/users/User';

/**
 * OAuth user profile data returned after successful authentication
 */
export interface OAuthUserProfile {
  /** Provider's unique ID for the user */
  providerId: string;
  /** User's email from the provider */
  email: string;
  /** User's display name from the provider */
  displayName: string;
  /** Provider-specific identity (username, email, etc.) */
  identity: string;
  /** Optional profile picture URL */
  pictureUrl?: string;
  /** Optional refresh token for long-term access */
  refreshToken?: string;
  /** Optional access token for immediate API calls */
  accessToken?: string;
  /** Optional expiration time for access token */
  expiresAt?: number;
  /** When the profile was retrieved/updated */
  updatedAt: number;
}

/**
 * OAuth provider interface defining common operations for all providers
 */
export interface IOAuthProvider {
  /** 
   * The provider type identifier (e.g., 'github', 'google') 
   */
  readonly providerType: OAuthProviderType;
  
  /** 
   * Generates the OAuth authorization URL for redirecting the user 
   * @param redirectUri - Where to redirect after authentication
   * @param state - CSRF protection state token
   * @param scopes - Optional array of permission scopes to request
   * @returns URL to redirect the user to for authentication
   */
  getAuthorizationUrl(
    redirectUri: string, 
    state: string, 
    scopes?: string[]
  ): string;
  
  /**
   * Exchanges an authorization code for tokens and user profile
   * @param code - The authorization code received from the provider
   * @param redirectUri - The same redirect URI used in getAuthorizationUrl
   * @returns Promise resolving to the user profile data
   */
  exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthUserProfile>;
  
  /**
   * Refreshes an expired access token using a refresh token
   * @param refreshToken - The refresh token to use
   * @returns Promise resolving to updated tokens and expiration
   */
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  }>;
  
  /**
   * Validates an access token and returns if it's valid
   * @param accessToken - The access token to validate
   * @returns Promise resolving to boolean indicating validity
   */
  validateAccessToken(accessToken: string): Promise<boolean>;
  
  /**
   * Revokes a token (access or refresh)
   * @param token - The token to revoke
   * @param tokenType - The type of token ('access' or 'refresh')
   * @returns Promise resolving when token is revoked
   */
  revokeToken(token: string, tokenType: 'access' | 'refresh'): Promise<void>;
}