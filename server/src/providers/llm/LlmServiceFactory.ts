import { ILlmService, LlmErrorCode, LlmProvider, LlmServiceError } from './ILlmService';
import { AnthropicService } from './anthropic/AnthropicService';

/**
 * Factory for creating LLM service instances
 */
export class LlmServiceFactory {
  /**
   * Returns the default model ID for a provider
   * @param provider LLM provider
   * @returns Default model ID
   */
  public static getDefaultModel(provider: LlmProvider): string {
    switch (provider) {
    case 'anthropic':
      return 'claude-3-7-sonnet-20250218';
    default:
      throw new LlmServiceError(
        `Unsupported LLM provider: ${provider}`,
        LlmErrorCode.INVALID_REQUEST
      );
    }
  }

  /**
   * Returns a list of supported LLM providers
   * @returns Array of provider identifiers
   */
  public static getSupportedProviders(): LlmProvider[] {
    return ['anthropic'];
  }
  
  /**
   * Validates if the provider is supported
   * @param provider The provider to check
   * @throws LlmServiceError if the provider is not supported
   */
  private static validateProvider(provider: string): asserts provider is LlmProvider {
    if (!this.getSupportedProviders().includes(provider as LlmProvider)) {
      throw new LlmServiceError(
        `Unsupported LLM provider: ${provider}`,
        LlmErrorCode.INVALID_REQUEST
      );
    }
  }

  /**
   * Creates an LLM service instance for the specified provider
   * @param provider LLM provider
   * @param apiKey API key for the service
   * @returns LLM service instance
   * @throws LlmServiceError for invalid API keys or unsupported providers
   */
  public static createService(provider: LlmProvider, apiKey: string): ILlmService {
    if (!apiKey) {
      throw new LlmServiceError(
        'API key is required',
        LlmErrorCode.INVALID_API_KEY,
        'An API key must be provided to create an LLM service'
      );
    }
    
    this.validateProvider(provider);

    switch (provider) {
    case 'anthropic':
      return new AnthropicService(apiKey);
    default:
      // This should never be reached due to validateProvider above
      throw new LlmServiceError(
        `Unsupported LLM provider: ${provider}`,
        LlmErrorCode.INVALID_REQUEST
      );
    }
  }

  /**
   * Validates an API key with the specified provider
   * @param provider LLM provider
   * @param apiKey API key to validate
   * @returns True if valid, false otherwise
   * @throws LlmServiceError for unsupported providers or other validation errors
   */
  public static async validateApiKey(provider: LlmProvider, apiKey: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      // Validate the provider is supported
      this.validateProvider(provider);
      
      // Create and validate with the appropriate service
      switch (provider) {
      case 'anthropic': {
        const anthropicService = new AnthropicService(apiKey);
        return await anthropicService.validateApiKey(apiKey);
      }
      default:
        // This should never be reached due to validateProvider above
        throw new LlmServiceError(
          `Unsupported LLM provider: ${provider}`,
          LlmErrorCode.INVALID_REQUEST
        );
      }
    } catch (error) {
      // If the error is about an invalid API key, return false
      if (error instanceof LlmServiceError && 
          error.code === LlmErrorCode.INVALID_API_KEY) {
        return false;
      }
      // Rethrow all other errors (including unsupported provider)
      throw error;
    }
  }
}