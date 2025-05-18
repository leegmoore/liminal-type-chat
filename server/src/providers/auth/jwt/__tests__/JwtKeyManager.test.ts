/**
 * Tests for JWT Key Manager
 */
import { JwtKeyManager } from '../JwtKeyManager';
import { Environment, EnvironmentService } from '../../../../services/core/EnvironmentService';
import { SecureStorage } from '../../../security/secure-storage';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../../../../services/core/EnvironmentService');
jest.mock('../../../security/secure-storage');
jest.mock('crypto');

describe('JwtKeyManager', () => {
  let keyManager: JwtKeyManager;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up environment service mock
    mockEnvironmentService = {
      getEnvironment: jest.fn().mockReturnValue(Environment.DEVELOPMENT)
    } as unknown as jest.Mocked<EnvironmentService>;
    
    // Set up secure storage mock
    mockSecureStorage = {
      get: jest.fn(),
      set: jest.fn(),
      encryptApiKey: jest.fn(),
      decryptApiKey: jest.fn(),
      sanitizeLogData: jest.fn(data => data)
    } as unknown as jest.Mocked<SecureStorage>;
    
    // Mock crypto functions
    (crypto.generateKeyPairSync as jest.Mock).mockReturnValue({
      publicKey: 'mock-public-key',
      privateKey: 'mock-private-key'
    });
    
    // Create key manager instance
    keyManager = new JwtKeyManager(mockEnvironmentService, mockSecureStorage);
  });

  describe('initialize', () => {
    it('should load existing keys if they exist', async () => {
      // Mock that keys exist in storage
      const storedKeyPair = JSON.stringify({
        publicKey: 'existing-public-key',
        privateKey: 'existing-private-key'
      });
      mockSecureStorage.get.mockResolvedValue(storedKeyPair);
      
      // Initialize the key manager
      await keyManager.initialize();
      
      // Should have tried to load keys
      expect(mockSecureStorage.get).toHaveBeenCalledWith(
        expect.stringMatching(/^jwt_keys_development_/i)
      );
      
      // Should not have generated new keys
      expect(crypto.generateKeyPairSync).not.toHaveBeenCalled();
    });

    it('should generate new keys if none exist', async () => {
      // Mock that no keys exist in storage
      mockSecureStorage.get.mockResolvedValue(null);
      
      // Initialize the key manager
      await keyManager.initialize();
      
      // Should have tried to load keys
      expect(mockSecureStorage.get).toHaveBeenCalledWith(
        expect.stringMatching(/^jwt_keys_development_/i)
      );
      
      // Should have generated new keys
      expect(crypto.generateKeyPairSync).toHaveBeenCalledWith(
        'rsa',
        expect.objectContaining({
          modulusLength: 2048,
          publicKeyEncoding: expect.any(Object),
          privateKeyEncoding: expect.any(Object)
        })
      );
      
      // Should have stored the new keys
      expect(mockSecureStorage.set).toHaveBeenCalledWith(
        expect.stringMatching(/^jwt_keys_development_/i),
        expect.any(String)
      );
    });
  });

  describe('getSigningKey', () => {
    beforeEach(async () => {
      // Setup: initialize with a mock key
      mockSecureStorage.get.mockResolvedValue(JSON.stringify({
        publicKey: 'test-public-key',
        privateKey: 'test-private-key'
      }));
      await keyManager.initialize();
    });

    it('should return the current private key with keyId', async () => {
      // Act
      const result = await keyManager.getSigningKey();
      
      // Assert
      expect(result).toEqual({
        keyId: expect.stringMatching(/^development_/),
        privateKey: 'test-private-key'
      });
    });

    it('should use a specific keyId if provided', async () => {
      // Act
      const result = await keyManager.getSigningKey('custom-key-id');
      
      // Assert
      expect(result).toEqual({
        keyId: 'custom-key-id',
        privateKey: 'test-private-key'
      });
    });
  });

  describe('getVerificationKey', () => {
    beforeEach(async () => {
      // Setup: initialize with mock keys
      mockSecureStorage.get.mockImplementation((key) => {
        if (key.includes('current')) {
          return Promise.resolve(JSON.stringify({
            publicKey: 'current-public-key',
            privateKey: 'current-private-key'
          }));
        } else if (key.includes('previous')) {
          return Promise.resolve(JSON.stringify({
            publicKey: 'previous-public-key',
            privateKey: 'previous-private-key'
          }));
        }
        return Promise.resolve(null);
      });
      await keyManager.initialize();
    });

    it('should return the public key for a valid keyId', async () => {
      // Act
      const result = await keyManager.getVerificationKey('development_current');
      
      // Assert
      expect(result).toBe('current-public-key');
    });

    it('should return undefined for an unknown keyId', async () => {
      // Act
      const result = await keyManager.getVerificationKey('unknown-key-id');
      
      // Assert
      expect(result).toBeUndefined();
    });

    it('should load key from storage if not cached', async () => {
      // Setup: clear mocks after initialization
      mockSecureStorage.get.mockClear();
      mockSecureStorage.get.mockResolvedValueOnce(JSON.stringify({
        publicKey: 'stored-public-key',
        privateKey: 'stored-private-key'
      }));
      
      // Act
      const result = await keyManager.getVerificationKey('development_stored');
      
      // Assert
      expect(result).toBe('stored-public-key');
      expect(mockSecureStorage.get).toHaveBeenCalledWith('jwt_keys_development_stored');
    });
  });

  describe('rotateKeys', () => {
    it('should generate a new key and preserve the previous one', async () => {
      // Setup: initialize with an existing key
      mockSecureStorage.get.mockImplementation((key) => {
        if (key.includes('current')) {
          return Promise.resolve(JSON.stringify({
            publicKey: 'old-public-key',
            privateKey: 'old-private-key'
          }));
        }
        return Promise.resolve(null);
      });
      await keyManager.initialize();
      
      // Clear mocks after initialization
      mockSecureStorage.get.mockClear();
      mockSecureStorage.set.mockClear();
      
      // Mock new key generation
      (crypto.generateKeyPairSync as jest.Mock).mockReturnValue({
        publicKey: 'new-public-key',
        privateKey: 'new-private-key'
      });
      
      // Act: rotate keys
      await keyManager.rotateKeys();
      
      // Assert: Should have stored the old key as previous
      expect(mockSecureStorage.set).toHaveBeenCalledWith(
        expect.stringMatching(/jwt_keys_development_previous/),
        expect.stringContaining('old-public-key')
      );
      
      // Should have generated and stored a new current key
      expect(crypto.generateKeyPairSync).toHaveBeenCalled();
      expect(mockSecureStorage.set).toHaveBeenCalledWith(
        expect.stringMatching(/jwt_keys_development_current/),
        expect.stringContaining('new-public-key')
      );
    });
  });

  describe('environment-specific keys', () => {
    it('should use different key names for different environments', async () => {
      // Setup: Test with different environments
      const environments = [
        Environment.PRODUCTION,
        Environment.STAGING,
        Environment.DEVELOPMENT,
        Environment.LOCAL
      ];
      
      for (const env of environments) {
        // Clear mocks
        jest.clearAllMocks();
        
        // Mock environment
        mockEnvironmentService.getEnvironment.mockReturnValue(env);
        
        // Create key manager for this environment
        const envKeyManager = new JwtKeyManager(mockEnvironmentService, mockSecureStorage);
        await envKeyManager.initialize();
        
        // Should have tried to load environment-specific keys
        expect(mockSecureStorage.get).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`^jwt_keys_${env.toLowerCase()}_current`, 'i'))
        );
      }
    });
  });
});