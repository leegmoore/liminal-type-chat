/**
 * GitHub OAuth Provider Implementation
 */
import axios from 'axios';
import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';
import { OAuthProvider } from '../../../models/domain/users/User';
import { ExternalServiceError } from '../../../utils/errors';

// GitHub OAuth endpoints
const GITHUB_OAUTH_URLS = {
  authorize: 'https://github.com/login/oauth/authorize',
  token: 'https://github.com/login/oauth/access_token',
  user: 'https://api.github.com/user',
  emails: 'https://api.github.com/user/emails',
  revokeToken: 'https://api.github.com/applications/:client_id/token'
};

// Default scopes for GitHub OAuth
const DEFAULT_SCOPES = ['read:user', 'user:email'];

/**
 * GitHub OAuth provider implementation
 */
export class GitHubOAuthProvider implements IOAuthProvider {
  /**
   * The provider type
   */
  public readonly providerType: OAuthProvider = 'github';

  /**
   * Create a GitHub OAuth provider
   * @param clientId - GitHub OAuth App client ID
   * @param clientSecret - GitHub OAuth App client secret
   */
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {
    if (!this.clientId) {
      throw new Error('GitHub OAuth client ID is required');
    }
    if (!this.clientSecret) {
      throw new Error('GitHub OAuth client secret is required');
    }
  }

  /**
   * Generate the GitHub authorization URL
   * @param redirectUri - Where to redirect after authentication
   * @param state - CSRF protection state token
   * @param scopes - Optional array of permission scopes to request
   * @returns URL to redirect the user to for authentication
   */
  getAuthorizationUrl(
    redirectUri: string,
    state: string,
    scopes: string[] = DEFAULT_SCOPES
  ): string {
    const scopeString = scopes.join(' ');
    
    // Construct the authorization URL with parameters
    const authUrl = new URL(GITHUB_OAUTH_URLS.authorize);
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', scopeString);
    authUrl.searchParams.append('response_type', 'code');
    
    return authUrl.toString();
  }

  /**
   * Exchange an authorization code for tokens and user profile
   * @param code - The authorization code received from GitHub
   * @param redirectUri - The same redirect URI used in getAuthorizationUrl
   * @returns Promise resolving to the user profile data
   * @throws ExternalServiceError if the exchange fails
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthUserProfile> {
    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await axios.post(
        GITHUB_OAUTH_URLS.token, 
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: redirectUri
        },
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );
      
      const { 
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn = 0
      } = tokenResponse.data;
      
      if (!accessToken) {
        throw new Error('No access token returned from GitHub');
      }
      
      // Calculate token expiration (GitHub tokens don't expire by default)
      const expiresAt = expiresIn 
        ? Date.now() + (expiresIn * 1000) 
        : undefined;
      
      // Step 2: Get user profile information
      const userResponse = await axios.get(GITHUB_OAUTH_URLS.user, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      
      const { 
        id, 
        login, 
        name, 
        email, 
        avatar_url: pictureUrl 
      } = userResponse.data;
      
      // Convert ID to string for consistent handling (GitHub uses numeric IDs)
      const providerId = id.toString();
      
      // Use login as display name if name not provided
      const displayName = name || login;
      
      // Use login as the identity
      const identity = login;
      
      // Step 3: Get primary email if not provided (requires user:email scope)
      if (!email) {
        try {
          const emailsResponse = await axios.get(GITHUB_OAUTH_URLS.emails, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json'
            }
          });
          
          // Find primary email
          interface GitHubEmail {
            email: string;
            primary: boolean;
            verified: boolean;
            visibility: string | null;
          }
          
          const primaryEmail = emailsResponse.data.find(
            (e: GitHubEmail) => e.primary && e.verified
          );
          
          if (primaryEmail) {
            email = primaryEmail.email;
          }
        } catch (emailError) {
          // If we can't get the email, we'll work with what we have
          console.warn('Failed to fetch GitHub user emails', emailError);
        }
      }
      
      // Build user profile
      const profile: OAuthUserProfile = {
        providerId,
        email: email || '', // Email might still be empty if not available
        displayName,
        identity,
        pictureUrl,
        accessToken,
        refreshToken,
        expiresAt,
        updatedAt: Date.now()
      };
      
      return profile;
    } catch (error) {
      throw new ExternalServiceError(
        'Failed to exchange GitHub authorization code for token',
        error instanceof Error ? error.message : String(error),
        'GitHub OAuth'
      );
    }
  }

  /**
   * Refreshes an expired access token using a refresh token
   * @param refreshToken - The refresh token to use
   * @returns Promise resolving to updated tokens and expiration
   * @throws Error as GitHub doesn't support refreshing tokens
   */
  async refreshAccessToken(_refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  }> {
    // GitHub OAuth doesn't support refreshing tokens - they don't expire
    throw new Error('GitHub OAuth does not support refreshing tokens');
  }

  /**
   * Validates an access token and returns if it's valid
   * @param accessToken - The access token to validate
   * @returns Promise resolving to boolean indicating validity
   * @throws ExternalServiceError for unexpected errors
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      // Try to make a request to GitHub API to check token validity
      await axios.get(GITHUB_OAUTH_URLS.user, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      
      // If the request succeeds, the token is valid
      return true;
    } catch (error) {
      // If the error is due to an invalid token, return false
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      
      // For other errors, throw an ExternalServiceError
      throw new ExternalServiceError(
        'Failed to validate GitHub access token',
        error instanceof Error ? error.message : String(error),
        'GitHub OAuth'
      );
    }
  }

  /**
   * Revokes a token (access or refresh)
   * @param token - The token to revoke
   * @param tokenType - The type of token ('access' or 'refresh')
   * @returns Promise resolving when token is revoked
   * @throws ExternalServiceError if revocation fails
   */
  async revokeToken(token: string, tokenType: 'access' | 'refresh'): Promise<void> {
    try {
      // GitHub only has access tokens (no refresh tokens)
      if (tokenType === 'refresh') {
        throw new Error('GitHub OAuth does not use refresh tokens');
      }
      
      // GitHub requires Basic auth with client credentials to revoke a token
      const revokeUrl = GITHUB_OAUTH_URLS.revokeToken
        .replace(':client_id', this.clientId);
      
      // Delete the token
      await axios.delete(revokeUrl, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        data: {
          access_token: token
        }
      });
    } catch (error) {
      throw new ExternalServiceError(
        'Failed to revoke GitHub token',
        error instanceof Error ? error.message : String(error),
        'GitHub OAuth'
      );
    }
  }
}