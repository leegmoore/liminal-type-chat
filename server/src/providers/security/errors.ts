/**
 * Security module-specific error classes
 */
import { AppError } from '../../utils/errors';
import { AuthErrorCode, ExternalServiceErrorCode } from '../../utils/error-codes';

/**
 * Error for when encryption or decryption operations fail
 */
export class EncryptionError extends AppError {
  /**
   * Create a new EncryptionError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   */
  constructor(message?: string, details?: string) {
    super(
      ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR,
      message || 'Encryption operation failed',
      details
    );
  }
}

/**
 * Error for invalid API keys
 */
export class InvalidApiKeyError extends AppError {
  /**
   * Create a new InvalidApiKeyError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param provider - Provider for which the API key is invalid (optional)
   */
  constructor(message?: string, details?: string, provider?: string) {
    super(
      ExternalServiceErrorCode.INVALID_API_KEY,
      message || (provider ? `Invalid API key for provider: ${provider}` : 'Invalid API key'),
      details
    );
  }
}

/**
 * Error for authentication-related issues
 */
export class AuthenticationError extends AppError {
  /**
   * Create a new AuthenticationError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   */
  constructor(message?: string, details?: string) {
    super(
      AuthErrorCode.INVALID_CREDENTIALS,
      message || 'Authentication failed',
      details
    );
  }
}

/**
 * Error for token-related issues (JWT, refresh tokens)
 */
export class TokenError extends AppError {
  /**
   * Create a new TokenError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param isExpired - Whether the token is expired (optional)
   */
  constructor(message?: string, details?: string, isExpired?: boolean) {
    super(
      isExpired ? AuthErrorCode.EXPIRED_TOKEN : AuthErrorCode.INVALID_CREDENTIALS,
      message || (isExpired ? 'Token has expired' : 'Invalid token'),
      details
    );
  }
}