/**
 * Tests for OAuthProviderFactory
 */
import { OAuthProviderFactory } from '../OAuthProviderFactory';
import { GitHubOAuthProvider } from '../github/GitHubOAuthProvider';

describe('OAuthProviderFactory', () => {
  // Sample OAuth configuration
  const githubConfig = {
    clientId: 'github-client-id',
    clientSecret: 'github-client-secret'
  };
  
  // Clear provider cache before each test
  beforeEach(() => {
    OAuthProviderFactory.clearProviders();
  });
  
  describe('getProvider', () => {
    it('should create a GitHub provider instance', () => {
      // Act
      const provider = OAuthProviderFactory.getProvider('github', githubConfig);
      
      // Assert
      expect(provider).toBeInstanceOf(GitHubOAuthProvider);
      expect(provider.providerType).toBe('github');
    });
    
    it('should throw for unsupported provider types', () => {
      // Act & Assert
      // @ts-expect-error - Testing invalid provider type
      expect(() => OAuthProviderFactory.getProvider('unsupported', {}))
        .toThrow('Unsupported OAuth provider: unsupported');
    });
    
    it('should reuse existing provider instances', () => {
      // Act
      const provider1 = OAuthProviderFactory.getProvider('github', githubConfig);
      const provider2 = OAuthProviderFactory.getProvider('github', githubConfig);
      
      // Assert
      expect(provider1).toBe(provider2); // Same instance reference
    });
  });
  
  describe('clearProviders', () => {
    it('should clear cached provider instances', () => {
      // Arrange
      const provider1 = OAuthProviderFactory.getProvider('github', githubConfig);
      
      // Act
      OAuthProviderFactory.clearProviders();
      const provider2 = OAuthProviderFactory.getProvider('github', githubConfig);
      
      // Assert
      expect(provider1).not.toBe(provider2); // Different instance references
    });
  });
});