/**
 * Tests for GitHubOAuthProvider
 */
import { GitHubOAuthProvider } from '../github/GitHubOAuthProvider';
import axios from 'axios';
import { ExternalServiceError } from '../../../utils/errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GitHubOAuthProvider', () => {
  // Test setup
  const clientId = 'test-client-id';
  const clientSecret = 'test-client-secret';
  const redirectUri = 'http://localhost:8765/api/v1/auth/github/callback';
  const state = 'random-state-token';
  
  // Sample test data
  const testCode = 'github-auth-code';
  const testAccessToken = 'github-access-token';
  const testRefreshToken = 'github-refresh-token';
  
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should create instance with client credentials', () => {
      // Act
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Assert
      expect(provider).toBeInstanceOf(GitHubOAuthProvider);
      expect(provider.providerType).toBe('github');
    });
    
    it('should throw error if client ID is missing', () => {
      // Act & Assert
      expect(() => new GitHubOAuthProvider('', clientSecret))
        .toThrow('GitHub OAuth client ID is required');
    });
    
    it('should throw error if client secret is missing', () => {
      // Act & Assert
      expect(() => new GitHubOAuthProvider(clientId, ''))
        .toThrow('GitHub OAuth client secret is required');
    });
  });
  
  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      const expectedScopes = ['user:email', 'read:user'];
      
      // Act
      const url = provider.getAuthorizationUrl(redirectUri, state, expectedScopes);
      
      // Assert
      // Parse the URL to check parameters correctly
      const parsedUrl = new URL(url);
      expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://github.com/login/oauth/authorize');
      expect(parsedUrl.searchParams.get('client_id')).toBe(clientId);
      expect(parsedUrl.searchParams.get('redirect_uri')).toBe(redirectUri);
      expect(parsedUrl.searchParams.get('state')).toBe(state);
      
      // Check that the required scopes are included
      const urlScopes = parsedUrl.searchParams.get('scope')?.split(' ') || [];
      expectedScopes.forEach(scope => {
        expect(urlScopes).toContain(scope);
      });
    });
    
    it('should use default scopes if none provided', () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Act
      const url = provider.getAuthorizationUrl(redirectUri, state);
      
      // Assert
      // Parse the URL to check parameters 
      const parsedUrl = new URL(url);
      const urlScopes = parsedUrl.searchParams.get('scope')?.split(' ') || [];
      
      // Should contain at least read:user scope
      expect(urlScopes).toContain('read:user');
    });
  });
  
  describe('exchangeCodeForToken', () => {
    it('should exchange code for tokens and user profile', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock token exchange response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: testAccessToken,
          refresh_token: testRefreshToken,
          expires_in: 3600
        }
      });
      
      // Mock user profile response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: '12345',
          login: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          avatar_url: 'https://github.com/avatar.png'
        }
      });
      
      // Act
      const profile = await provider.exchangeCodeForToken(testCode, redirectUri);
      
      // Assert
      // Check token exchange request
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          client_id: clientId,
          client_secret: clientSecret,
          code: testCode,
          redirect_uri: redirectUri
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json'
          })
        })
      );
      
      // Check user profile request
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testAccessToken}`
          })
        })
      );
      
      // Check returned profile
      expect(profile).toEqual(expect.objectContaining({
        providerId: '12345',
        email: 'test@example.com',
        displayName: 'Test User',
        identity: 'testuser',
        pictureUrl: 'https://github.com/avatar.png',
        accessToken: testAccessToken,
        refreshToken: testRefreshToken
      }));
    });
    
    it('should fallback to login as displayName if name is not provided', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock token exchange response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: testAccessToken
        }
      });
      
      // Mock user profile response with no name
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: '12345',
          login: 'testuser',
          email: 'test@example.com'
        }
      });
      
      // Act
      const profile = await provider.exchangeCodeForToken(testCode, redirectUri);
      
      // Assert
      expect(profile.displayName).toBe('testuser');
    });
    
    it('should request email if not in user profile', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock token exchange response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: testAccessToken
        }
      });
      
      // Mock user profile response with no email
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: '12345',
          login: 'testuser',
          name: 'Test User'
        }
      });
      
      // Mock email response
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            email: 'test@example.com',
            primary: true,
            verified: true
          }
        ]
      });
      
      // Act
      const profile = await provider.exchangeCodeForToken(testCode, redirectUri);
      
      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user/emails',
        expect.anything()
      );
      
      expect(profile.email).toBe('test@example.com');
    });
    
    it('should handle token exchange errors', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock token exchange error
      mockedAxios.post.mockRejectedValueOnce(new Error('Token exchange failed'));
      
      // Act & Assert
      await expect(provider.exchangeCodeForToken(testCode, redirectUri))
        .rejects.toThrow(ExternalServiceError);
    });
    
    it('should handle profile fetch errors', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock token exchange response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: testAccessToken
        }
      });
      
      // Mock profile fetch error
      mockedAxios.get.mockRejectedValueOnce(new Error('Profile fetch failed'));
      
      // Act & Assert
      await expect(provider.exchangeCodeForToken(testCode, redirectUri))
        .rejects.toThrow(ExternalServiceError);
    });
  });
  
  describe('refreshAccessToken', () => {
    it('should throw error as GitHub does not support refresh tokens', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Act & Assert
      await expect(provider.refreshAccessToken(testRefreshToken))
        .rejects.toThrow('GitHub OAuth does not support refreshing tokens');
    });
  });
  
  describe('validateAccessToken', () => {
    it('should return true for valid token', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock successful API call
      mockedAxios.get.mockResolvedValueOnce({
        data: { login: 'testuser' }
      });
      
      // Act
      const isValid = await provider.validateAccessToken(testAccessToken);
      
      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testAccessToken}`
          })
        })
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should return false for invalid token', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock failed API call
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401
        }
      });
      
      // Act
      const isValid = await provider.validateAccessToken('invalid-token');
      
      // Assert
      expect(isValid).toBe(false);
    });
    
    it('should throw for unexpected errors', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock unexpected error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      // Act & Assert
      await expect(provider.validateAccessToken(testAccessToken))
        .rejects.toThrow(ExternalServiceError);
    });
  });
  
  describe('revokeToken', () => {
    it('should revoke an access token via GitHub API', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock successful token revocation
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });
      
      // Act
      await provider.revokeToken(testAccessToken, 'access');
      
      // Assert
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('https://api.github.com/applications/'),
        expect.objectContaining({
          auth: {
            username: clientId,
            password: clientSecret
          },
          data: expect.objectContaining({
            access_token: testAccessToken
          })
        })
      );
    });
    
    it('should handle revocation errors', async () => {
      // Arrange
      const provider = new GitHubOAuthProvider(clientId, clientSecret);
      
      // Mock revocation error
      mockedAxios.delete.mockRejectedValueOnce(new Error('Revocation failed'));
      
      // Act & Assert
      await expect(provider.revokeToken(testAccessToken, 'access'))
        .rejects.toThrow(ExternalServiceError);
    });
  });
});