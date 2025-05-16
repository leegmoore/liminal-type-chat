/**
 * Tests for UserRepository
 */
import { UserRepository } from '../UserRepository';
import { IUserRepository } from '../IUserRepository';
import { User, CreateUserParams, OAuthProvider } from '../../../../models/domain/users/User';
import { DatabaseProvider, Transaction } from '../../database-provider';
import { EncryptionService } from '../../../security/encryption-service';
import { DatabaseError } from '../../../../utils/errors';

// Mock the required dependencies
jest.mock('../../database-provider');
jest.mock('../../../security/encryption-service');

describe('UserRepository', () => {
  // Test setup variables
  let repository: IUserRepository;
  let mockDbProvider: jest.Mocked<DatabaseProvider>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockQuery: jest.Mock;
  let mockExec: jest.Mock;
  let mockTx: jest.Mock;

  // Sample test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const now = Date.now();

  const testUser: User = {
    id: testUserId,
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: now,
    updatedAt: now,
    authProviders: {
      github: {
        providerId: 'github-123',
        identity: 'testuser',
        updatedAt: now
      }
    },
    apiKeys: {},
    preferences: {
      theme: 'system'
    }
  };

  const createUserParams: CreateUserParams = {
    email: 'new@example.com',
    displayName: 'New User',
    provider: 'github' as OAuthProvider,
    providerId: 'github-456',
    providerIdentity: 'newuser'
  };

  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock query and exec methods
    mockQuery = jest.fn();
    mockExec = jest.fn();
    
    // Mock transaction
    mockTx = jest.fn().mockImplementation((fn: (tx: Transaction) => Promise<unknown>) => {
      const mockTransaction = {
        query: mockQuery,
        exec: mockExec
      };
      return Promise.resolve(fn(mockTransaction));
    });
    
    // Setup mock database provider
    mockDbProvider = {
      initialize: jest.fn().mockResolvedValue(undefined),
      query: mockQuery,
      exec: mockExec,
      transaction: mockTx,
      close: jest.fn().mockResolvedValue(undefined),
      healthCheck: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<DatabaseProvider>;
    
    // Setup mock encryption service
    mockEncryptionService = {
      encryptSensitiveData: jest.fn().mockImplementation(async (data: string) => 
        `encrypted-${data}`),
      decryptSensitiveData: jest.fn().mockImplementation(async (data: string) =>
        data.replace('encrypted-', ''))
    } as unknown as jest.Mocked<EncryptionService>;
    
    // Create repository instance with mocks
    repository = new UserRepository(mockDbProvider, mockEncryptionService);
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      // Arrange
      mockExec.mockResolvedValueOnce(undefined); // For create user

      // Act
      const result = await repository.create(createUserParams);

      // Assert
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          expect.any(String), // id
          createUserParams.email,
          createUserParams.displayName,
          expect.any(Number), // createdAt
          expect.any(Number), // updatedAt
          expect.any(String), // authProviders JSON
        ])
      );
      
      expect(result).toMatchObject({
        email: createUserParams.email,
        displayName: createUserParams.displayName,
        authProviders: {
          [createUserParams.provider]: {
            providerId: createUserParams.providerId,
            identity: createUserParams.providerIdentity
          }
        }
      });
      
      expect(result.id).toBeDefined();
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const dbError = new Error('DB error');
      mockExec.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.create(createUserParams))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('findById', () => {
    it('should return user when found by ID', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify(testUser.apiKeys),
        preferences: JSON.stringify(testUser.preferences)
      }]);

      // Act
      const result = await repository.findById(testUserId);

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = ?'),
        [testUserId]
      );
      
      expect(result).toEqual(testUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle malformed JSON data', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: '{invalid json', // Invalid JSON
        api_keys: '{}',
        preferences: '{}'
      }]);

      // Act & Assert
      await expect(repository.findById(testUserId))
        .rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify(testUser.apiKeys),
        preferences: JSON.stringify(testUser.preferences)
      }]);

      // Act
      const result = await repository.findByEmail(testUser.email);

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = ?'),
        [testUser.email]
      );
      
      expect(result).toEqual(testUser);
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByProviderId', () => {
    it('should return user when found by provider ID', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify(testUser.apiKeys),
        preferences: JSON.stringify(testUser.preferences)
      }]);

      // Act
      const result = await repository.findByProviderId('github', 'github-123');

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
        expect.any(Array)
      );
      
      expect(result).toEqual(testUser);
    });

    it('should return null when user not found by provider ID', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.findByProviderId('github', 'nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should successfully update user', async () => {
      // Arrange
      const updatedUser = {
        ...testUser,
        displayName: 'Updated Name',
        updatedAt: now + 1000,
        preferences: {
          ...testUser.preferences,
          theme: 'dark'
        }
      };
      
      mockExec.mockResolvedValueOnce({ changes: 1 });

      // Act
      const result = await repository.update(updatedUser);

      // Assert
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([
          updatedUser.email,
          updatedUser.displayName,
          updatedUser.updatedAt,
          expect.any(String), // JSON strings
          expect.any(String),
          expect.any(String),
          updatedUser.id // WHERE clause
        ])
      );
      
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user to update is not found', async () => {
      // Arrange
      mockExec.mockResolvedValueOnce({ changes: 0 });

      // Act
      const result = await repository.update(testUser);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const dbError = new Error('DB error');
      mockExec.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.update(testUser))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('storeApiKey', () => {
    it('should encrypt and store API key', async () => {
      // Arrange
      const apiKey = 'sk-12345api-key';
      const provider = 'openai';
      
      // Mock the user retrieved from the database with proper structure
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // Empty API keys
        preferences: JSON.stringify(testUser.preferences)
      }]);
      
      mockExec.mockResolvedValueOnce({ changes: 1 });

      // Act
      const result = await repository.storeApiKey(testUserId, provider, apiKey, 'My API Key');

      // Assert
      expect(mockEncryptionService.encryptSensitiveData).toHaveBeenCalledWith(apiKey);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([
          expect.any(String), // api_keys JSON
          expect.any(Number), // updated_at timestamp
          testUserId // WHERE clause
        ])
      );
      
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.storeApiKey(
        'non-existent', 'openai', 'sk-12345', 'Label'
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should handle encryption errors', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        api_keys: '{}'
      }]);
      mockEncryptionService.encryptSensitiveData.mockRejectedValueOnce(
        new Error('Encryption failed')
      );

      // Act & Assert
      await expect(repository.storeApiKey(
        testUserId, 'openai', 'sk-12345', 'Label'
      )).rejects.toThrow();
    });
  });

  describe('getApiKey', () => {
    it('should retrieve API key info', async () => {
      // Arrange
      const encryptedKey = 'encrypted-sk-12345api-key';
      const provider = 'openai';
      const apiKeyLabel = 'My API Key';
      
      // Mock user with encrypted API key
      const userWithApiKey = {
        ...testUser,
        apiKeys: {
          openai: {
            key: encryptedKey,
            label: apiKeyLabel,
            createdAt: now
          }
        }
      };
      
      mockQuery.mockResolvedValueOnce([{
        id: userWithApiKey.id,
        email: userWithApiKey.email,
        display_name: userWithApiKey.displayName,
        created_at: userWithApiKey.createdAt,
        updated_at: userWithApiKey.updatedAt,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);

      // Act
      const result = await repository.getApiKey(testUserId, provider);

      // Assert - should return the API key info object, not the decrypted value
      expect(result).toEqual({
        key: encryptedKey,
        label: apiKeyLabel,
        createdAt: now
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.getApiKey('non-existent', 'openai');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when API key for provider not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No API keys
        preferences: JSON.stringify(testUser.preferences)
      }]);

      // Act
      const result = await repository.getApiKey(testUserId, 'openai');

      // Assert
      expect(result).toBeNull();
    });

  });

  describe('getDecryptedApiKey', () => {
    it('should retrieve and decrypt API key', async () => {
      // Arrange
      const encryptedKey = 'encrypted-sk-12345api-key';
      const provider = 'openai';
      
      // Mock user with encrypted API key
      const userWithApiKey = {
        ...testUser,
        apiKeys: {
          openai: {
            key: encryptedKey,
            label: 'My API Key',
            createdAt: now
          }
        }
      };
      
      mockQuery.mockResolvedValueOnce([{
        id: userWithApiKey.id,
        email: userWithApiKey.email,
        display_name: userWithApiKey.displayName,
        created_at: userWithApiKey.createdAt,
        updated_at: userWithApiKey.updatedAt,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);

      // Act
      const result = await repository.getDecryptedApiKey(testUserId, provider);

      // Assert
      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(encryptedKey);
      expect(result).toBe('sk-12345api-key'); // Decrypted value
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.getDecryptedApiKey('non-existent', 'openai');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when API key for provider not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No API keys
        preferences: JSON.stringify(testUser.preferences)
      }]);

      // Act
      const result = await repository.getDecryptedApiKey(testUserId, 'openai');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle decryption errors', async () => {
      // Arrange
      const encryptedKey = 'encrypted-sk-12345api-key';
      
      // Mock user with encrypted API key
      const userWithApiKey = {
        ...testUser,
        apiKeys: {
          openai: {
            key: encryptedKey,
            label: 'My API Key',
            createdAt: now
          }
        }
      };
      
      mockQuery.mockResolvedValueOnce([{
        id: userWithApiKey.id,
        email: userWithApiKey.email,
        display_name: userWithApiKey.displayName,
        created_at: userWithApiKey.createdAt,
        updated_at: userWithApiKey.updatedAt,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);
      
      mockEncryptionService.decryptSensitiveData.mockRejectedValueOnce(
        new Error('Decryption failed')
      );

      // Act & Assert
      await expect(repository.getDecryptedApiKey(testUserId, 'openai'))
        .rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should successfully delete a user', async () => {
      // Arrange
      mockExec.mockResolvedValueOnce({ changes: 1 });

      // Act
      const result = await repository.delete(testUserId);

      // Assert
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = ?'),
        [testUserId]
      );
      
      expect(result).toBe(true);
    });

    it('should return false when user to delete is not found', async () => {
      // Arrange
      mockExec.mockResolvedValueOnce({ changes: 0 });

      // Act
      const result = await repository.delete('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const dbError = new Error('DB error');
      mockExec.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.delete(testUserId))
        .rejects.toThrow(DatabaseError);
    });
  });
});