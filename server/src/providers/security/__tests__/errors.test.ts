/**
 * Tests for security module error classes
 */
import { 
  EncryptionError, 
  InvalidApiKeyError, 
  AuthenticationError, 
  TokenError 
} from '../errors';
import { AuthErrorCode, ExternalServiceErrorCode } from '../../../utils/error-codes';

describe('Security Error Classes', () => {
  describe('EncryptionError', () => {
    it('should create with default message', () => {
      // Act
      const error = new EncryptionError();
      
      // Assert
      expect(error.message).toBe('Encryption operation failed');
      expect(error.errorCode).toBe(ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(error.details).toBeUndefined();
    });
    
    it('should create with custom message and details', () => {
      // Act
      const error = new EncryptionError('Custom encryption error', 'Detailed explanation');
      
      // Assert
      expect(error.message).toBe('Custom encryption error');
      expect(error.errorCode).toBe(ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(error.details).toBe('Detailed explanation');
    });
    
    it('should generate proper JSON representation', () => {
      // Arrange
      const error = new EncryptionError('Encryption failed', 'Failed to decrypt data');
      
      // Act
      const json = error.toJSON();
      
      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('message', 'Encryption failed');
      expect(json.error).toHaveProperty('details', 'Failed to decrypt data');
      expect(json.error).toHaveProperty('errorCode', ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR);
    });
  });

  describe('InvalidApiKeyError', () => {
    it('should create with default message', () => {
      // Act
      const error = new InvalidApiKeyError();
      
      // Assert
      expect(error.message).toBe('Invalid API key');
      expect(error.errorCode).toBe(ExternalServiceErrorCode.INVALID_API_KEY);
      expect(error.details).toBeUndefined();
    });
    
    it('should create with custom message and details', () => {
      // Act
      const error = new InvalidApiKeyError('Invalid OpenAI API key', 'Key format is incorrect');
      
      // Assert
      expect(error.message).toBe('Invalid OpenAI API key');
      expect(error.errorCode).toBe(ExternalServiceErrorCode.INVALID_API_KEY);
      expect(error.details).toBe('Key format is incorrect');
    });
    
    it('should include provider in default message when provided', () => {
      // Act
      const error = new InvalidApiKeyError(undefined, undefined, 'openai');
      
      // Assert
      expect(error.message).toBe('Invalid API key for provider: openai');
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default message', () => {
      // Act
      const error = new AuthenticationError();
      
      // Assert
      expect(error.message).toBe('Authentication failed');
      expect(error.errorCode).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(error.details).toBeUndefined();
    });
    
    it('should create with custom message and details', () => {
      // Act
      const error = new AuthenticationError('Login failed', 'Incorrect password');
      
      // Assert
      expect(error.message).toBe('Login failed');
      expect(error.errorCode).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(error.details).toBe('Incorrect password');
    });
  });

  describe('TokenError', () => {
    it('should create with default message for invalid token', () => {
      // Act
      const error = new TokenError();
      
      // Assert
      expect(error.message).toBe('Invalid token');
      expect(error.errorCode).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(error.details).toBeUndefined();
    });
    
    it('should create with default message for expired token', () => {
      // Act
      const error = new TokenError(undefined, undefined, true);
      
      // Assert
      expect(error.message).toBe('Token has expired');
      expect(error.errorCode).toBe(AuthErrorCode.EXPIRED_TOKEN);
      expect(error.details).toBeUndefined();
    });
    
    it('should create with custom message and details', () => {
      // Act
      const error = new TokenError('Token validation failed', 'Signature mismatch');
      
      // Assert
      expect(error.message).toBe('Token validation failed');
      expect(error.errorCode).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(error.details).toBe('Signature mismatch');
    });
    
    it('should use expired token error code when isExpired is true', () => {
      // Act
      const error = new TokenError('Session expired', 'Please login again', true);
      
      // Assert
      expect(error.message).toBe('Session expired');
      expect(error.errorCode).toBe(AuthErrorCode.EXPIRED_TOKEN);
      expect(error.details).toBe('Please login again');
    });
  });
});