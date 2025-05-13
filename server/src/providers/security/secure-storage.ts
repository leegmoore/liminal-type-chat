/**
 * SecureStorage provides safe handling of sensitive data such as API keys
 * with encryption and decryption capabilities
 */
import { EncryptionService } from './encryption-service';
import { ExternalServiceError } from '../../utils/errors';

/**
 * Service for securely storing and retrieving sensitive data
 * like API keys with proper encryption
 */
export class SecureStorage {
  /** Encryption service for encrypting/decrypting sensitive data */
  private encryptionService: EncryptionService;
  
  /** Regex patterns for identifying sensitive data like API keys */
  private readonly sensitivePatterns = [
    /sk[-_][a-zA-Z0-9]{10,}/g, // OpenAI, Stripe format: sk-xxx or sk_xxx
    /key[-_]?[a-zA-Z0-9]{10,}/gi, // Generic API key
    /api[-_]?key[-_]?[a-zA-Z0-9]{10,}/gi, // Generic API key
    /access[-_]?token[-_]?[a-zA-Z0-9]{10,}/gi, // OAuth tokens
    /secret[-_]?[a-zA-Z0-9]{10,}/gi, // Generic secrets
    /token[-_]?[a-zA-Z0-9]{10,}/gi, // Generic tokens
    /sk_live_[a-zA-Z0-9]+/gi, // Stripe live key format
  ];
  
  /** Properties that likely contain sensitive data */
  private readonly sensitiveProperties = [
    'apiKey',
    'api_key',
    'key',
    'secretKey',
    'secret_key',
    'secret',
    'token',
    'accessToken',
    'access_token',
    'password',
  ];
  
  /**
   * Create a new secure storage service
   */
  constructor() {
    this.encryptionService = new EncryptionService();
  }
  
  /**
   * Encrypt an API key for secure storage
   * @param apiKey - The plain text API key to encrypt
   * @returns Promise resolving to the encrypted API key
   * @throws ExternalServiceError if encryption fails
   */
  async encryptApiKey(apiKey: string): Promise<string> {
    try {
      return await this.encryptionService.encryptSensitiveData(apiKey);
    } catch (error) {
      throw new ExternalServiceError(
        'Failed to encrypt API key',
        error instanceof Error ? error.message : String(error),
        'SecureStorage'
      );
    }
  }
  
  /**
   * Decrypt an encrypted API key
   * @param encryptedApiKey - The encrypted API key
   * @returns Promise resolving to the decrypted API key
   * @throws ExternalServiceError if decryption fails
   */
  async decryptApiKey(encryptedApiKey: string): Promise<string> {
    try {
      return await this.encryptionService.decryptSensitiveData(encryptedApiKey);
    } catch (error) {
      throw new ExternalServiceError(
        'Failed to decrypt API key',
        error instanceof Error ? error.message : String(error),
        'SecureStorage'
      );
    }
  }
  
  /**
   * Sanitize data for logging by redacting sensitive information
   * @param data - The data to sanitize
   * @returns Sanitized data safe for logging
   */
  sanitizeLogData<T>(data: T): T {
    type ObjectType = Record<string, unknown>;
    if (data === null || data === undefined) {
      return data;
    }
    
    // Handle string data
    if (typeof data === 'string') {
      let sanitized = data as string;
      // Replace all sensitive patterns with [REDACTED]
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      return sanitized as unknown as T;
    }
    
    // Handle object data
    if (typeof data === 'object') {
      const result = Array.isArray(data) ? [...data] as unknown as ObjectType : { ...data as object } as ObjectType;
      
      for (const key in result) {
        if (Object.prototype.hasOwnProperty.call(result, key)) {
          // If the property is likely to contain sensitive data, redact it
          if (this.sensitiveProperties.includes(key)) {
            result[key] = '[REDACTED]';
          } 
          // Otherwise, recursively sanitize the value
          else if (result[key] !== null && typeof result[key] === 'object') {
            result[key] = this.sanitizeLogData(result[key]);
          } 
          // If the value is a string, check for sensitive patterns
          else if (typeof result[key] === 'string') {
            result[key] = this.sanitizeLogData(result[key]);
          }
        }
      }
      
      return result as unknown as T;
    }
    
    // For other types of data, return as is
    return data;
  }
}