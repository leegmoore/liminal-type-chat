/**
 * Tests for EncryptionService
 */
import { EncryptionService } from '../encryption-service';
import crypto from 'crypto';

// Mock crypto module
jest.mock('crypto');

describe('EncryptionService', () => {
  // Save original environment variables
  const originalEnv = process.env;
  
  // Mock data for tests
  const mockEncryptionKey = Buffer.alloc(32); // 32-byte mock key
  const mockIv = Buffer.from('1234567890123456'); // 16 bytes for IV
  const mockAuthTag = Buffer.from('authtag1234567890'); // 16 bytes for auth tag
  const mockSensitiveData = 'secret-api-key-12345';
  const mockEncryptedData = 'encrypted-data';
  
  beforeEach(() => {
    // Reset mocks and environment before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    
    // Mock crypto.randomBytes
    (crypto.randomBytes as jest.Mock) = jest.fn().mockReturnValue(mockIv);
    
    // Mock cipher and decipher
    const mockCipher = {
      update: jest.fn().mockReturnValue(mockEncryptedData),
      final: jest.fn().mockReturnValue(''),
      getAuthTag: jest.fn().mockReturnValue(mockAuthTag),
    };
    
    const mockDecipher = {
      update: jest.fn().mockReturnValue(Buffer.from(mockSensitiveData)),
      final: jest.fn().mockReturnValue(Buffer.from('')),
      setAuthTag: jest.fn(),
    };
    
    (crypto.createCipheriv as jest.Mock) = jest.fn().mockReturnValue(mockCipher);
    (crypto.createDecipheriv as jest.Mock) = jest.fn().mockReturnValue(mockDecipher);
  });
  
  afterEach(() => {
    // Restore environment after each test
    process.env = originalEnv;
  });
  
  describe('initialization', () => {
    it('should throw if ENCRYPTION_KEY environment variable is missing', () => {
      // Arrange
      delete process.env.ENCRYPTION_KEY;
      
      // Act & Assert
      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY environment variable is required');
    });
    
    it('should throw if encryption key is not 32 bytes (256 bits)', () => {
      // Arrange - Set environment to a key that's definitely too short
      process.env.ENCRYPTION_KEY = 'dG9vc2hvcnQ='; // "tooshort" in base64
      
      // Mock Buffer.from to return a short buffer for this test
      jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        return Buffer.alloc(16); // Mock a 16-byte buffer, which is too short
      });
      
      // Act & Assert
      expect(() => new EncryptionService()).toThrow('Encryption key must be 32 bytes (256 bits)');
    });
    
    it('should successfully initialize with valid encryption key', () => {
      // Arrange - Set environment to a base64 key string
      process.env.ENCRYPTION_KEY = 'VGhpcyBpcyBhIHRlc3QgZW5jcnlwdGlvbiBrZXkgZm9yIHRlc3Rpbmc=';
      
      // Mock Buffer.from to return a buffer of correct length for this test
      jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        return Buffer.alloc(32); // Mock a 32-byte buffer
      });
      
      // Act & Assert
      expect(() => new EncryptionService()).not.toThrow();
    });
  });
  
  describe('encryptSensitiveData', () => {
    it('should encrypt data using AES-256-GCM', async () => {
      // Arrange - Create service with mock key
      const service = new EncryptionService(mockEncryptionKey);
      
      // Act
      const result = await service.encryptSensitiveData(mockSensitiveData);
      
      // Assert
      expect(crypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        mockEncryptionKey,
        mockIv
      );
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('should handle encryption errors', async () => {
      // Arrange - Create service with mock key
      const service = new EncryptionService(mockEncryptionKey);
      
      // Mock a failure
      (crypto.createCipheriv as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Encryption failed');
      });
      
      // Act & Assert
      await expect(service.encryptSensitiveData(mockSensitiveData)).rejects.toThrow();
    });
  });
  
  describe('decryptSensitiveData', () => {
    it('should decrypt data using AES-256-GCM', async () => {
      // Arrange - Create service with mock key
      const service = new EncryptionService(mockEncryptionKey);
      
      // Mock Buffer.from for the specific test case
      const bufferFromSpy = jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        return Buffer.concat([
          mockIv,
          mockAuthTag,
          Buffer.from(mockEncryptedData)
        ]);
      });
      
      // Act
      const result = await service.decryptSensitiveData('some-base64-encoded-data');
      
      // Assert
      expect(crypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        mockEncryptionKey,
        mockIv
      );
      expect(result).toBe(mockSensitiveData);
      
      // Clean up
      bufferFromSpy.mockRestore();
    });
    
    it('should throw when decryption fails', async () => {
      // Arrange - Create service with mock key
      const service = new EncryptionService(mockEncryptionKey);
      
      // Mock Buffer.from for the specific test case
      const bufferFromSpy = jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        return Buffer.concat([
          mockIv,
          mockAuthTag,
          Buffer.from(mockEncryptedData)
        ]);
      });
      
      // Mock decryption failure
      (crypto.createDecipheriv as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockImplementation(() => {
          throw new Error('Decryption failed');
        }),
        final: jest.fn(),
        setAuthTag: jest.fn(),
      });
      
      // Act & Assert
      await expect(service.decryptSensitiveData('some-base64-encoded-data')).rejects.toThrow();
      
      // Clean up
      bufferFromSpy.mockRestore();
    });
  });
  
  describe('generateEncryptionKey', () => {
    it('should generate a random 32-byte key encoded as base64', () => {
      // Arrange
      const mockRandomBytes = Buffer.from(Array(32).fill(1));
      (crypto.randomBytes as jest.Mock).mockReturnValueOnce(mockRandomBytes);
      
      // Mock Buffer.toString to return a predictable value
      const mockToString = jest.fn().mockReturnValue('test-base64-string');
      mockRandomBytes.toString = mockToString;
      
      // Act
      const result = EncryptionService.generateEncryptionKey();
      
      // Assert
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockToString).toHaveBeenCalledWith('base64');
      expect(result).toBe('test-base64-string');
    });
  });
});