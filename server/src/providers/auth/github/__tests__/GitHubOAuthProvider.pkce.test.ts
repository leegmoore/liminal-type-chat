/**
 * Tests for GitHub OAuth Provider PKCE Implementation
 */
import axios from 'axios';
import { GitHubOAuthProvider } from '../GitHubOAuthProvider';
import { PkceOptions } from '../../IOAuthProvider';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GitHubOAuthProvider PKCE Support', () => {
  let githubProvider: GitHubOAuthProvider;
  const clientId = 'test-client-id';
  const clientSecret = 'test-client-secret';
  const redirectUri = 'https://app.example.com/callback';
  const state = 'test-state-123';
  
  beforeEach(() => {
    // Create a fresh provider instance for each test
    githubProvider = new GitHubOAuthProvider(clientId, clientSecret);
    
    // Reset mocked axios
    jest.clearAllMocks();
  });
  
  describe('supportsPkce property', () => {
    it('should indicate PKCE support', () => {
      expect(githubProvider.supportsPkce).toBe(true);
    });
  });
  
  describe('getAuthorizationUrl with PKCE', () => {
    it('should include PKCE parameters when provided', () => {
      // PKCE options for the authorization request
      const pkceOptions: PkceOptions = {
        codeChallenge: 'test-code-challenge',
        codeChallengeMethod: 'S256'
      };
      
      // Generate authorization URL with PKCE
      const authUrl = githubProvider.getAuthorizationUrl(
        redirectUri, 
        state, 
        undefined, // Use default scopes
        pkceOptions
      );
      
      // Parse the URL to check for PKCE parameters
      const url = new URL(authUrl);
      
      // Check that PKCE parameters are included
      expect(url.searchParams.get('code_challenge')).toBe(pkceOptions.codeChallenge);
      expect(url.searchParams.get('code_challenge_method')).toBe(pkceOptions.codeChallengeMethod);
      
      // Also check that other required parameters are included
      expect(url.searchParams.get('client_id')).toBe(clientId);
      expect(url.searchParams.get('redirect_uri')).toBe(redirectUri);
      expect(url.searchParams.get('state')).toBe(state);
      expect(url.searchParams.get('response_type')).toBe('code');
    });
    
    it('should not include PKCE parameters when not provided', () => {
      // Generate authorization URL without PKCE
      const authUrl = githubProvider.getAuthorizationUrl(redirectUri, state);
      
      // Parse the URL to check for parameters
      const url = new URL(authUrl);
      
      // PKCE parameters should not be present
      expect(url.searchParams.has('code_challenge')).toBe(false);
      expect(url.searchParams.has('code_challenge_method')).toBe(false);
      
      // Other required parameters should still be included
      expect(url.searchParams.get('client_id')).toBe(clientId);
      expect(url.searchParams.get('redirect_uri')).toBe(redirectUri);
      expect(url.searchParams.get('state')).toBe(state);
    });
  });
  
  describe('exchangeCodeForToken with PKCE', () => {
    it('should include code_verifier when provided', async () => {
      // Setup mock response for token request
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-access-token',
          token_type: 'bearer'
        }
      });
      
      // Setup mock response for user request
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 12345,
          login: 'test-user',
          name: 'Test User'
        }
      });
      
      // Exchange code for token with PKCE code verifier
      const code = 'test-authorization-code';
      const codeVerifier = 'test-code-verifier';
      await githubProvider.exchangeCodeForToken(code, redirectUri, codeVerifier);
      
      // Check that code_verifier was included in the token request
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        }),
        expect.any(Object)
      );
    });
    
    it('should not include code_verifier when not provided', async () => {
      // Setup mock response for token request
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-access-token',
          token_type: 'bearer'
        }
      });
      
      // Setup mock response for user request
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 12345,
          login: 'test-user',
          name: 'Test User'
        }
      });
      
      // Exchange code for token without PKCE code verifier
      const code = 'test-authorization-code';
      await githubProvider.exchangeCodeForToken(code, redirectUri);
      
      // Check that code_verifier was NOT included in the token request
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        }),
        expect.any(Object)
      );
      
      const tokenRequestBody = mockedAxios.post.mock.calls[0][1];
      expect(tokenRequestBody.code_verifier).toBeUndefined();
    });
  });
});