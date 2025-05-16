/**
 * Factory for creating OAuth provider instances
 */
import { OAuthProvider } from '../../models/domain/users/User';
import { IOAuthProvider } from './IOAuthProvider';
import { GitHubOAuthProvider } from './github/GitHubOAuthProvider';

/**
 * Factory class for creating OAuth provider instances
 */
export class OAuthProviderFactory {
  // Provider instances cache
  // Type alias for provider record type to avoid line length issues
  private static providers: Record<OAuthProvider, IOAuthProvider> = {} as 
    Record<OAuthProvider, IOAuthProvider>;
  
  /**
   * Create or retrieve an OAuth provider instance
   * @param providerType - The type of OAuth provider
   * @param config - Provider-specific configuration
   * @returns The OAuth provider instance
   */
  static getProvider(
    providerType: OAuthProvider,
    config: {
      clientId: string;
      clientSecret: string;
      [key: string]: string | number | boolean | undefined;
    }
  ): IOAuthProvider {
    // Return cached instance if available
    if (this.providers[providerType]) {
      return this.providers[providerType];
    }
    
    // Create new provider instance
    let provider: IOAuthProvider;
    
    switch (providerType) {
    case 'github':
      provider = new GitHubOAuthProvider(config.clientId, config.clientSecret);
      break;
        
      // Add more providers here as they are implemented
      // case 'google':
      //   provider = new GoogleOAuthProvider(config.clientId, config.clientSecret);
      //   break;
        
    default:
      throw new Error(`Unsupported OAuth provider: ${providerType}`);
    }
    
    // Cache the provider instance
    this.providers[providerType] = provider;
    
    return provider;
  }
  
  /**
   * Clear cached provider instances (mostly useful for testing)
   */
  static clearProviders(): void {
    this.providers = {} as Record<OAuthProvider, IOAuthProvider>;
  }
}