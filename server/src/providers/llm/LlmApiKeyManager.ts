import { SecureStorage } from '../security/secure-storage';
import { UserRepository } from '../db/users/UserRepository';
import { LlmProvider, LlmErrorCode, LlmServiceError } from './ILlmService';
import { LlmServiceFactory } from './LlmServiceFactory';

/**
 * API key information return from the manager
 */
export interface ApiKeyInfo {
  provider: LlmProvider;
  label?: string;
  createdAt?: number;
  hasKey: boolean;
}

/**
 * Manages secure storage and retrieval of LLM API keys
 */
export class LlmApiKeyManager {
  /**
   * Create a new LLM API key manager
   * @param secureStorage Secure storage for encryption/decryption
   * @param userRepository User repository for persistence
   */
  constructor(
    private secureStorage: SecureStorage,
    private userRepository: UserRepository
  ) {}

  /**
   * Store an API key for a provider
   * @param userId User ID
   * @param provider LLM provider
   * @param apiKey The API key to store
   * @param label Optional label for the key
   * @returns True if successful
   * @throws LlmServiceError if validation or storage fails
   */
  async storeApiKey(
    userId: string,
    provider: LlmProvider,
    apiKey: string,
    label?: string
  ): Promise<boolean> {
    // Validate API key with the provider
    const isValid = await LlmServiceFactory.validateApiKey(provider, apiKey);
    if (!isValid) {
      throw new LlmServiceError(
        `Invalid API key for provider: ${provider}`,
        LlmErrorCode.INVALID_API_KEY,
        'The provided API key was rejected by the service provider'
      );
    }

    // Encrypt the API key
    const encryptedKey = await this.secureStorage.encryptApiKey(apiKey);

    // Store in the database
    const success = await this.userRepository.storeApiKey(
      userId,
      provider,
      encryptedKey,
      label
    );

    if (!success) {
      throw new LlmServiceError(
        'Failed to store API key',
        LlmErrorCode.SERVER_ERROR,
        'Database operation failed when storing API key'
      );
    }

    return true;
  }

  /**
   * Retrieve an API key
   * @param userId User ID
   * @param provider LLM provider
   * @returns Decrypted API key
   * @throws LlmServiceError if key doesn't exist or decryption fails
   */
  async getApiKey(userId: string, provider: LlmProvider): Promise<string> {
    const apiKeyInfo = await this.userRepository.getDecryptedApiKey(userId, provider);
    
    if (!apiKeyInfo) {
      throw new LlmServiceError(
        `No API key found for provider: ${provider}`,
        LlmErrorCode.INVALID_API_KEY,
        'User has not stored an API key for this provider'
      );
    }

    return apiKeyInfo;
  }

  /**
   * Delete an API key
   * @param userId User ID
   * @param provider LLM provider
   * @returns True if successful
   * @throws LlmServiceError if deletion fails
   */
  async deleteApiKey(userId: string, provider: LlmProvider): Promise<boolean> {
    const success = await this.userRepository.deleteApiKey(userId, provider);
    
    if (!success) {
      throw new LlmServiceError(
        `Failed to delete API key for provider: ${provider}`,
        LlmErrorCode.SERVER_ERROR,
        'Database operation failed when deleting API key'
      );
    }

    return true;
  }

  /**
   * Check if a user has an API key for a provider
   * @param userId User ID
   * @param provider LLM provider
   * @returns True if user has an API key
   */
  async hasApiKey(userId: string, provider: LlmProvider): Promise<boolean> {
    const apiKeyInfo = await this.userRepository.getApiKey(userId, provider);
    return !!apiKeyInfo;
  }

  /**
   * Get API key info without the key itself
   * @param userId User ID
   * @param provider LLM provider
   * @returns API key information
   */
  async getApiKeyInfo(userId: string, provider: LlmProvider): Promise<ApiKeyInfo> {
    const apiKeyInfo = await this.userRepository.getApiKey(userId, provider);
    
    if (!apiKeyInfo) {
      return {
        provider,
        hasKey: false
      };
    }

    return {
      provider,
      label: apiKeyInfo.label,
      createdAt: apiKeyInfo.createdAt,
      hasKey: true
    };
  }

  /**
   * List all API keys for a user
   * @param userId User ID
   * @returns Array of API key information
   */
  async listApiKeys(userId: string): Promise<ApiKeyInfo[]> {
    const allKeys = await this.userRepository.getAllApiKeys(userId);
    const providers = Object.keys(allKeys) as LlmProvider[];
    
    return providers.map(provider => {
      const keyInfo = allKeys[provider];
      if (!keyInfo) {
        return {
          provider,
          label: '',
          createdAt: Date.now(),
          hasKey: false
        };
      }
      return {
        provider,
        label: keyInfo.label,
        createdAt: keyInfo.createdAt,
        hasKey: true
      };
    });
  }
}