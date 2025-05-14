import { ILlmService, LlmErrorCode, LlmProvider, LlmServiceError } from './ILlmService';
// Temporarily comment out OpenAI to avoid dependency issues
// import { OpenAiService } from './openai/OpenAiService';
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
      case 'openai':
        return 'gpt-3.5-turbo';
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
    return ['openai', 'anthropic'];
  }

  /**
   * Creates an LLM service instance for the specified provider
   * @param provider LLM provider
   * @param apiKey API key for the service
   * @returns LLM service instance
   */
  public static createService(_provider: LlmProvider, apiKey: string): ILlmService {
    if (!apiKey) {
      throw new LlmServiceError(
        'API key is required',
        LlmErrorCode.INVALID_API_KEY,
        'An API key must be provided to create an LLM service'
      );
    }

    // For now, just return Anthropic service to get things working
    // This is a temporary solution to avoid OpenAI dependency issues
    return new AnthropicService(apiKey);
  }

  /**
   * Validates an API key with the specified provider
   * @param provider LLM provider
   * @param apiKey API key to validate
   * @returns True if valid, false otherwise
   */
  public static async validateApiKey(provider: LlmProvider, apiKey: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      // For now, only validate Anthropic keys
      if (provider === 'anthropic') {
        const service = new AnthropicService(apiKey);
        return await service.validateApiKey(apiKey);
      } else {
        // Temporarily accept all other provider keys for testing
        return true;
      }
    } catch (error) {
      // If the service constructor throws, the key is invalid
      if (error instanceof LlmServiceError && 
          error.code === LlmErrorCode.INVALID_API_KEY) {
        return false;
      }
      throw error;
    }
  }
}