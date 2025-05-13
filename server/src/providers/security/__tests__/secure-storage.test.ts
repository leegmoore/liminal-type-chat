/**
 * Tests for SecureStorage
 */
import { SecureStorage } from '../secure-storage';
import { EncryptionService } from '../encryption-service';
import { ExternalServiceError } from '../../../utils/errors';

// Mock the EncryptionService
jest.mock('../encryption-service');

describe('SecureStorage', () => {
  // Mock data
  const mockApiKey = 'sk-1234567890abcdef';
  const mockEncryptedApiKey = 'encrypted-data-base64';
  const _mockProvider = 'openai';
  const _mockUserId = 'user-123';
  
  // Mock encryption service
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock encryption service
    mockEncryptionService = {
      encryptSensitiveData: jest.fn().mockResolvedValue(mockEncryptedApiKey),
      decryptSensitiveData: jest.fn().mockResolvedValue(mockApiKey),
    } as unknown as jest.Mocked<EncryptionService>;
    
    // Mock the constructor
    (EncryptionService as jest.Mock).mockImplementation(() => mockEncryptionService);
  });
  
  describe('constructor', () => {
    it('should create an instance of SecureStorage', () => {
      // Act
      const secureStorage = new SecureStorage();
      
      // Assert
      expect(secureStorage).toBeInstanceOf(SecureStorage);
      expect(EncryptionService).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('encryptApiKey', () => {
    it('should encrypt the API key using the encryption service', async () => {
      // Arrange
      const secureStorage = new SecureStorage();
      
      // Act
      const result = await secureStorage.encryptApiKey(mockApiKey);
      
      // Assert
      expect(mockEncryptionService.encryptSensitiveData).toHaveBeenCalledWith(mockApiKey);
      expect(result).toBe(mockEncryptedApiKey);
    });
    
    it('should throw if encryption fails', async () => {
      // Arrange
      const secureStorage = new SecureStorage();
      const mockError = new Error('Encryption failed');
      mockEncryptionService.encryptSensitiveData.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(secureStorage.encryptApiKey(mockApiKey))
        .rejects.toThrow(ExternalServiceError);
    });
  });
  
  describe('decryptApiKey', () => {
    it('should decrypt the API key using the encryption service', async () => {
      // Arrange
      const secureStorage = new SecureStorage();
      
      // Act
      const result = await secureStorage.decryptApiKey(mockEncryptedApiKey);
      
      // Assert
      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(mockEncryptedApiKey);
      expect(result).toBe(mockApiKey);
    });
    
    it('should throw if decryption fails', async () => {
      // Arrange
      const secureStorage = new SecureStorage();
      const mockError = new Error('Decryption failed');
      mockEncryptionService.decryptSensitiveData.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(secureStorage.decryptApiKey(mockEncryptedApiKey))
        .rejects.toThrow(ExternalServiceError);
    });
  });
  
  describe('sanitizeLogData', () => {
    it('should redact API keys in objects', () => {
      // Arrange
      const secureStorage = new SecureStorage();
      const data = {
        apiKey: 'sk-12345abcdef',
        key: 'sk-67890abcdef',
        token: 'sk-token12345',
        secretKey: 'sk_live_abcdefg12345',
        other: 'not-an-api-key',
        nested: {
          apiKey: 'sk-nested12345',
          notSensitive: 'safe-value',
        },
      };
      
      // Act
      const sanitized = secureStorage.sanitizeLogData(data);
      
      // Assert
      expect(sanitized).toEqual({
        apiKey: '[REDACTED]',
        key: '[REDACTED]',
        token: '[REDACTED]',
        secretKey: '[REDACTED]',
        other: 'not-an-api-key',
        nested: {
          apiKey: '[REDACTED]',
          notSensitive: 'safe-value',
        },
      });
    });
    
    it('should redact API keys in strings', () => {
      // Arrange
      const secureStorage = new SecureStorage();
      const data = 'API key is sk-12345abcdef and secret key is sk_live_67890';
      
      // Act
      const sanitized = secureStorage.sanitizeLogData(data);
      
      // Assert
      expect(sanitized).toBe('API key is [REDACTED] and secret key is [REDACTED]');
    });
    
    it('should handle null and undefined values', () => {
      // Arrange
      const secureStorage = new SecureStorage();
      
      // Act & Assert
      expect(secureStorage.sanitizeLogData(null)).toBeNull();
      expect(secureStorage.sanitizeLogData(undefined)).toBeUndefined();
    });
  });
});