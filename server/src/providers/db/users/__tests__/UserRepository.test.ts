/**
 * Tests for UserRepository
 */
import { UserRepository } from '../UserRepository';
import { LlmProvider } from '../../../../models/domain/users/User';
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
          [createUserParams.provider as string]: {
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

    it('should successfully create a new user with only an id (system user)', async () => {
      // Arrange
      const systemUserParams: CreateUserParams = {
        id: 'system-user-id',
        email: 'system@example.com',
        displayName: 'System User',
      };
      mockExec.mockResolvedValueOnce(undefined); // For create user

      // Act
      const result = await repository.create(systemUserParams);

      // Assert
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          systemUserParams.id, // id
          systemUserParams.email,
          systemUserParams.displayName,
          expect.any(Number), // createdAt
          expect.any(Number), // updatedAt
          JSON.stringify({}), // authProviders should be empty
          JSON.stringify({}), // apiKeys should be empty
          JSON.stringify({ theme: 'system' }), // default preferences
        ])
      );
      expect(result).toMatchObject({
        id: systemUserParams.id,
        email: systemUserParams.email,
        displayName: systemUserParams.displayName,
        authProviders: {},
      });
    });

    it('should throw DatabaseError if provider information is incomplete and no id is provided', async () => {
      // Arrange
      const incompleteParams: CreateUserParams = {
        email: 'incomplete@example.com',
        displayName: 'Incomplete User',
        provider: 'github' as OAuthProvider,
        // providerId and providerIdentity are missing
      };

      // Act & Assert
      await expect(repository.create(incompleteParams))
        .rejects.toThrow(DatabaseError);
      await expect(repository.create(incompleteParams))
        .rejects.toThrow(
          'Invalid parameters for user creation: provider information incomplete and no id provided.'
        );
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

  describe('getUserById', () => {
    it('should return user when found by ID (alias for findById)', async () => {
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
      const result = await repository.getUserById(testUserId);

      // Assert
      expect(result).toEqual(testUser);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
    });

    it('should return null when user not found by ID (alias for findById)', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.getUserById('non-existent-id');

      // Assert
      expect(result).toBeNull();
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

  describe('findOrCreateUserByOAuth', () => {
    const oauthUserData = {
      email: 'oauth@example.com',
      displayName: 'OAuth User',
      providerIdentity: 'oauth-identity',
      refreshToken: 'oauth-refresh-token',
    };

    it('should return existing user if found by providerId, and update their info', async () => {
      // Arrange
      const existingProviderId = testUser.authProviders.github!.providerId;
      const distinctOAuthData = {
        email: 'new-oauth-email@example.com',
        displayName: 'New OAuth Name',
        providerIdentity: 'new-oauth-identity',
        refreshToken: 'new-oauth-refresh-token',
      };

      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email, // Original email
        display_name: testUser.displayName, // Original display name
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders), // Original auth providers
        api_keys: JSON.stringify(testUser.apiKeys),
        preferences: JSON.stringify(testUser.preferences),
      }]);
      mockExec.mockResolvedValueOnce({ changes: 1 }); // For the update call

      // Act
      const result = await repository.findOrCreateUserByOAuth(
        'github',
        existingProviderId, // Use the ID of the existing user for lookup
        distinctOAuthData
      );

      // Assert
      const expectedUser = {
        ...testUser, // Start with a copy of the original testUser structure
        email: distinctOAuthData.email, // Expect email to be updated
        displayName: distinctOAuthData.displayName, // Expect displayName to be updated
        updatedAt: expect.any(Number), // Expect top-level updatedAt to be updated
        authProviders: {
          ...testUser.authProviders,
          github: {
            ...testUser.authProviders.github,
            providerId: existingProviderId, // This should remain the same
            identity: distinctOAuthData.providerIdentity, // Expect identity to be updated
            refreshToken: distinctOAuthData.refreshToken, // Expect refreshToken to be updated
            updatedAt: expect.any(Number), // Expect this specific provider's updatedAt to be updated
          },
        },
      };
      expect(result).toEqual(expectedUser);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([
          distinctOAuthData.email,
          distinctOAuthData.displayName,
          expect.any(Number), // for existingUser.updatedAt
          expect.stringContaining(distinctOAuthData.providerIdentity),
          testUser.id,
        ])
      );
      expect(mockExec).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'));
    });

    it('should create and return a new user if not found by providerId', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]); // No user found by providerId
      mockExec.mockResolvedValueOnce(undefined); // For create user

      // Act
      const result = await repository.findOrCreateUserByOAuth(
        'google' as OAuthProvider,
        'google-provider-id',
        oauthUserData
      );

      // Assert
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO users.*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?\)/s),
        expect.arrayContaining([
          expect.any(String), // id
          oauthUserData.email,
          oauthUserData.displayName,
          expect.any(Number), // createdAt
          expect.any(Number), // updatedAt
          expect.stringContaining('google'),
          expect.any(String), // apiKeys
          expect.any(String)  // preferences
        ])
      );
      expect(result).toMatchObject({
        email: oauthUserData.email,
        displayName: oauthUserData.displayName,
        authProviders: {
          google: {
            providerId: 'google-provider-id',
            identity: oauthUserData.providerIdentity,
            refreshToken: oauthUserData.refreshToken,
          },
        },
      });
    });

    it('should update existing user authProvider data if found and different', async () => {
      // Arrange
      const existingUserWithOldToken: User = {
        ...testUser,
        authProviders: {
          github: {
            providerId: testUser.authProviders.github!.providerId,
            identity: 'old-identity',
            refreshToken: 'old-refresh-token',
            updatedAt: now - 10000
          }
        }
      };
      mockQuery.mockResolvedValueOnce([{
        id: existingUserWithOldToken.id,
        email: existingUserWithOldToken.email,
        display_name: existingUserWithOldToken.displayName,
        created_at: existingUserWithOldToken.createdAt,
        updated_at: existingUserWithOldToken.updatedAt,
        auth_providers: JSON.stringify(existingUserWithOldToken.authProviders),
        api_keys: JSON.stringify(existingUserWithOldToken.apiKeys),
        preferences: JSON.stringify(existingUserWithOldToken.preferences)
      }]);
      mockExec.mockResolvedValueOnce({ changes: 1 }); // For update user

      const newOAuthData = {
        email: testUser.email, // Same email
        displayName: testUser.displayName, // Same display name
        providerIdentity: 'new-github-identity',
        refreshToken: 'new-github-refresh-token',
      };

      // Act
      const result = await repository.findOrCreateUserByOAuth(
        'github',
        testUser.authProviders.github!.providerId,
        newOAuthData
      );

      // Assert
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users SET[\s\S]*WHERE id = \?/),
        expect.arrayContaining([
          newOAuthData.email, // or testUser.email based on test setup
          newOAuthData.displayName, // or testUser.displayName
          expect.any(Number), // For the main updatedAt timestamp
          expect.any(String), // For auth_providers JSON string (content checked separately below),
          expect.any(String), // For api_keys JSON string (can be '{}')
          expect.any(String), // For preferences JSON string (can be '{"theme":"system"}')
          existingUserWithOldToken.id // or testUser.id based on consistency
        ])
      );
      expect(result).toBeDefined();

      // Verify the content of auth_providers JSON string from the mockExec call
      // Arguments of the first call, second element is the array of params
      const mockExecCallArgs = mockExec.mock.calls[0][1] as string[];
      const authProvidersJsonFromDbCall = mockExecCallArgs[3]; // auth_providers is the 4th param in the SQL query
      const parsedAuthProviders = JSON.parse(authProvidersJsonFromDbCall);

      expect(parsedAuthProviders).toEqual({
        github: {
          providerId: testUser.authProviders.github!.providerId,
          identity: newOAuthData.providerIdentity,
          refreshToken: newOAuthData.refreshToken,
          updatedAt: expect.any(Number),
        },
        // Ensure other providers are not affected if they existed in testUser
        ...(testUser.authProviders.google && { google: testUser.authProviders.google }),
      });

      // Also check the returned user object from the method
      if (result) {
        expect(result.authProviders.github?.identity).toBe(newOAuthData.providerIdentity);
        expect(result.authProviders.github?.refreshToken).toBe(newOAuthData.refreshToken);
        expect(result.authProviders.github?.updatedAt).toEqual(expect.any(Number));
        expect(result.updatedAt).toEqual(expect.any(Number)); // Also check top-level updatedAt
        // Ensure email and displayName are correctly returned 
        // (even if they were not changed by newOAuthData in this specific test case)
        expect(result.email).toBe(newOAuthData.email);
        expect(result.displayName).toBe(newOAuthData.displayName);
      }
    });

    it('should handle database errors during user creation in findOrCreateUserByOAuth', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]); // No user found
      const dbError = new Error('DB create error');
      mockExec.mockRejectedValueOnce(dbError); // Simulate error during INSERT

      // Act & Assert
      await expect(repository.findOrCreateUserByOAuth(
        'google' as OAuthProvider,
        'google-provider-id',
        oauthUserData
      )).rejects.toThrow(DatabaseError);
    });

    it('should handle database errors during user update in findOrCreateUserByOAuth', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify({ github: { ...testUser.authProviders.github, refreshToken: 'old' } }),
        api_keys: JSON.stringify(testUser.apiKeys),
        preferences: JSON.stringify(testUser.preferences)
      }]);
      const dbError = new Error('DB update error');
      mockExec.mockRejectedValueOnce(dbError); // Simulate error during UPDATE

      // Act & Assert
      await expect(repository.findOrCreateUserByOAuth(
        'github',
        testUser.authProviders.github!.providerId,
        { ...oauthUserData, email: testUser.email, displayName: testUser.displayName }
      )).rejects.toThrow(DatabaseError);
    });

  });

  describe('update', () => {
    it('should successfully update user', async () => {
      // Arrange
      const updatedUser: User = {
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
    it('should retrieve API key info for anthropic provider', async () => {
      // Arrange
      const encryptedKey = 'encrypted-anthropic-key';
      const provider = 'anthropic' as LlmProvider;
      const apiKeyLabel = 'My Anthropic Key';
      const apiKeyInfo = {
        key: encryptedKey,
        label: apiKeyLabel,
        createdAt: now,
        lastUsed: now
      };
      const userWithApiKey = {
        ...testUser,
        apiKeys: { anthropic: apiKeyInfo }
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

      // Assert
      expect(result).toEqual(apiKeyInfo);
    });

    it('should return null when user not found for getApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.getApiKey('non-existent-user', 'anthropic');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when API key for anthropic provider not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        id: testUser.id,
        email: testUser.email,
        display_name: testUser.displayName,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({ otherProvider: { key: 'somekey' } }), // No anthropic key
        preferences: JSON.stringify(testUser.preferences)
      }]);

      // Act
      const result = await repository.getApiKey(testUserId, 'anthropic');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);
      // Act
      const result = await repository.getApiKey('non-existent-user', 'anthropic');
      // Assert
      expect(result).toBeNull();
    });

    it('should return null if API key for provider does not exist', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No keys
        preferences: JSON.stringify(testUser.preferences)
      }]);
      // Act
      const result = await repository.getApiKey(testUserId, 'anthropic');
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getDecryptedApiKey', () => {
    it('should decrypt and return API key for anthropic', async () => {
      // Arrange
      const decryptedKey = 'sk-anthropic-real-key';
      const encryptedKey = 'encrypted-anthropic-real-key';
      const provider = 'anthropic' as LlmProvider;

      mockEncryptionService.decryptSensitiveData.mockResolvedValueOnce(decryptedKey);
      const userWithApiKey = {
        ...testUser,
        apiKeys: { 
          anthropic: { key: encryptedKey, label: 'Anthropic Key', createdAt: now }
        }
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKey,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);

      // Act
      const result = await repository.getDecryptedApiKey(testUserId, provider);

      // Assert
      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(encryptedKey);
      expect(result).toBe(decryptedKey);
    });

    it('should return null when user not found for getDecryptedApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);
      // Act
      const result = await repository.getDecryptedApiKey('non-existent-user', 'anthropic');
      // Assert
      expect(result).toBeNull();
    });

    it('should return null when API key for anthropic provider not found for getDecryptedApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No keys
        preferences: JSON.stringify(testUser.preferences)
      }]);
      // Act
      const result = await repository.getDecryptedApiKey(testUserId, 'anthropic');
      // Assert
      expect(result).toBeNull();
    });

    it('should handle decryption errors for getDecryptedApiKey', async () => {
      // Arrange
      const encryptedKey = 'encrypted-anthropic-key';
      const userWithApiKey = {
        ...testUser,
        apiKeys: { anthropic: { key: encryptedKey, label: 'My Key', createdAt: now } }
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKey,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);
      mockEncryptionService.decryptSensitiveData.mockRejectedValueOnce(new Error('Decryption failed'));

      // Act & Assert
      await expect(repository.getDecryptedApiKey(testUserId, 'anthropic')).rejects.toThrow('Decryption failed');
    });
  });

  describe('updateApiKeyLastUsed', () => {
    it('should update lastUsed timestamp for an API key', async () => {
      // Arrange
      const initialApiKeyInfo = {
        key: 'encrypted-key',
        label: 'Test Key',
        createdAt: now - 1000,
        lastUsed: now - 1000
      };
      const userWithApiKey = {
        ...testUser,
        apiKeys: { anthropic: initialApiKeyInfo }
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKey,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);
      mockExec.mockResolvedValueOnce({ changes: 1 });
      const newTimestamp = Date.now();

      // Act
      const result = await repository.updateApiKeyLastUsed(testUserId, 'anthropic', newTimestamp);

      // Assert
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        'UPDATE users SET api_keys = ?, updated_at = ? WHERE id = ?',
        expect.arrayContaining([
          expect.stringContaining(`"lastUsed":${newTimestamp}`),
          expect.any(Number),
          testUserId
        ])
      );
    });

    it('should use current time if timestamp is not provided for updateApiKeyLastUsed', async () => {
      // Arrange
      const initialApiKeyInfo = {
        key: 'encrypted-key',
        label: 'Test Key',
        createdAt: now - 1000,
        lastUsed: now - 1000
      };
      const userWithApiKey = {
        ...testUser,
        apiKeys: { anthropic: initialApiKeyInfo }
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKey,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);
      mockExec.mockResolvedValueOnce({ changes: 1 });
      const beforeCall = Date.now();

      // Act
      const result = await repository.updateApiKeyLastUsed(testUserId, 'anthropic');
      const afterCall = Date.now();

      // Assert
      expect(result).toBe(true);
      const capturedArgs = mockExec.mock.calls[0][1] as unknown[];
      const updatedApiKeys = JSON.parse(capturedArgs[0] as string);
      expect(updatedApiKeys.anthropic.lastUsed).toBeGreaterThanOrEqual(beforeCall);
      expect(updatedApiKeys.anthropic.lastUsed).toBeLessThanOrEqual(afterCall);
    });

    it('should return false if user not found for updateApiKeyLastUsed', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);
      // Act
      const result = await repository.updateApiKeyLastUsed('non-existent', 'anthropic');
      // Assert
      expect(result).toBe(false);
    });

    it('should return false if API key for provider not found for updateApiKeyLastUsed', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No keys
        preferences: JSON.stringify(testUser.preferences)
      }]);
      // Act
      const result = await repository.updateApiKeyLastUsed(testUserId, 'anthropic');
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('deleteApiKey', () => {
    it('should delete an API key for a user', async () => {
      // Arrange
      const anthropicKeyInfo = { key: 'encrypted-anthropic', label: 'Anthropic Key', createdAt: now };
      // A different key to ensure it's not deleted
      const otherKeyInfo = { key: 'encrypted-other', label: 'Other Key', createdAt: now };
      const userWithApiKeys = {
        ...testUser,
        apiKeys: { anthropic: anthropicKeyInfo, otherProvider: otherKeyInfo } 
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKeys,
        auth_providers: JSON.stringify(userWithApiKeys.authProviders),
        api_keys: JSON.stringify(userWithApiKeys.apiKeys),
        preferences: JSON.stringify(userWithApiKeys.preferences)
      }]);
      mockExec.mockResolvedValueOnce({ changes: 1 });

      // Act
      const result = await repository.deleteApiKey(testUserId, 'anthropic');

      // Assert
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        'UPDATE users SET api_keys = ?, updated_at = ? WHERE id = ?',
        expect.arrayContaining([
          JSON.stringify({ otherProvider: otherKeyInfo }), // anthropic key should be gone
          expect.any(Number),
          testUserId
        ])
      );
    });

    it('should return false if user not found for deleteApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);
      // Act
      const result = await repository.deleteApiKey('non-existent', 'anthropic');
      // Assert
      expect(result).toBe(false);
    });

    it('should return false if API key for provider not found for deleteApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({ otherProvider: {key: 'somekey'} }), // No anthropic key
        preferences: JSON.stringify(testUser.preferences)
      }]);
      // Act
      const result = await repository.deleteApiKey(testUserId, 'anthropic');
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAllApiKeys', () => {
    it('should return all API keys for a user', async () => {
      // Arrange
      const apiKeysData = {
        anthropic: { key: 'enc-anthropic', label: 'Anthropic Key', createdAt: now, lastUsed: now },
        otherProvider: { key: 'enc-other', label: 'Other Key', createdAt: now, lastUsed: now }
      };
      const userWithApiKeys = {
        ...testUser,
        apiKeys: apiKeysData
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKeys,
        auth_providers: JSON.stringify(userWithApiKeys.authProviders),
        api_keys: JSON.stringify(userWithApiKeys.apiKeys),
        preferences: JSON.stringify(userWithApiKeys.preferences)
      }]);

      // Act
      const result = await repository.getAllApiKeys(testUserId);

      // Assert
      expect(result).toEqual(apiKeysData);
    });

    it('should return empty object if user not found for getAllApiKeys', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);
      // Act
      const result = await repository.getAllApiKeys('non-existent');
      // Assert
      expect(result).toEqual({});
    });

    it('should return empty object if user has no API keys for getAllApiKeys', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No keys
        preferences: JSON.stringify(testUser.preferences)
      }]);
      // Act
      const result = await repository.getAllApiKeys(testUserId);
      // Assert
      expect(result).toEqual({});
    });
  });

  describe('getDecryptedApiKey', () => {
    it('should decrypt and return API key for anthropic', async () => {
      // Arrange
      const decryptedKey = 'sk-anthropic-real-key';
      const encryptedKey = 'encrypted-anthropic-real-key';
      const provider = 'anthropic' as LlmProvider;

      mockEncryptionService.decryptSensitiveData.mockResolvedValueOnce(decryptedKey);
      const userWithApiKey = {
        ...testUser,
        apiKeys: { 
          anthropic: { key: encryptedKey, label: 'Anthropic Key', createdAt: now }
        }
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKey,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);

      // Act
      const result = await repository.getDecryptedApiKey(testUserId, provider);

      // Assert
      expect(mockEncryptionService.decryptSensitiveData).toHaveBeenCalledWith(encryptedKey);
      expect(result).toBe(decryptedKey);
    });

    it('should return null when user not found for getDecryptedApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);
      // Act
      const result = await repository.getDecryptedApiKey('non-existent-user', 'anthropic');
      // Assert
      expect(result).toBeNull();
    });

    it('should return null when API key for anthropic provider not found for getDecryptedApiKey', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{
        ...testUser,
        auth_providers: JSON.stringify(testUser.authProviders),
        api_keys: JSON.stringify({}), // No keys
        preferences: JSON.stringify(testUser.preferences)
      }]);
      // Act
      const result = await repository.getDecryptedApiKey(testUserId, 'anthropic');
      // Assert
      expect(result).toBeNull();
    });

    it('should handle decryption errors for getDecryptedApiKey', async () => {
      // Arrange
      const encryptedKey = 'encrypted-anthropic-key';
      const userWithApiKey = {
        ...testUser,
        apiKeys: { anthropic: { key: encryptedKey, label: 'My Key', createdAt: now } }
      };
      mockQuery.mockResolvedValueOnce([{
        ...userWithApiKey,
        auth_providers: JSON.stringify(userWithApiKey.authProviders),
        api_keys: JSON.stringify(userWithApiKey.apiKeys),
        preferences: JSON.stringify(userWithApiKey.preferences)
      }]);
      mockEncryptionService.decryptSensitiveData.mockRejectedValueOnce(new Error('Decryption failed'));

      // Act & Assert
      await expect(repository.getDecryptedApiKey(testUserId, 'anthropic')).rejects.toThrow('Decryption failed');
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

  // Test private methods indirectly or by exposing them if necessary for testing
  // For rowToUser, we test it via other methods, but let's add specific cases for robustness
  describe('rowToUser internal conversion', () => {
    // Access private method for testing - this is generally not recommended
    // but can be useful for unit testing complex private logic.
    // Alternative: test through public methods that use it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let privateRepo: any;
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      privateRepo = repository as any;
    });

    it('should correctly parse a row with all fields', () => {
      const row = {
        id: 'user1',
        email: 'user1@example.com',
        display_name: 'User One',
        created_at: now,
        updated_at: now,
        auth_providers: JSON.stringify({ github: { providerId: 'gh1', identity: 'u1' } }),
        api_keys: JSON.stringify({ anthropic: { key: 'key1' } }),
        preferences: JSON.stringify({ theme: 'dark' })
      };
      const user = privateRepo.rowToUser(row);
      expect(user.id).toBe('user1');
      expect(user.apiKeys?.anthropic?.key).toBe('key1');
      expect(user.preferences?.theme).toBe('dark');
    });

    it('should handle missing optional api_keys field', () => {
      const row = {
        id: 'user2',
        email: 'user2@example.com',
        display_name: 'User Two',
        created_at: now,
        updated_at: now,
        auth_providers: JSON.stringify({}),
        // api_keys is missing
        preferences: JSON.stringify({ theme: 'light' })
      };
      const user = privateRepo.rowToUser(row);
      expect(user.id).toBe('user2');
      expect(user.apiKeys).toEqual({});
      expect(user.preferences?.theme).toBe('light');
    });

    it('should handle missing optional preferences field', () => {
      const row = {
        id: 'user3',
        email: 'user3@example.com',
        display_name: 'User Three',
        created_at: now,
        updated_at: now,
        auth_providers: JSON.stringify({}),
        api_keys: JSON.stringify({}),
        // preferences is missing
      };
      const user = privateRepo.rowToUser(row);
      expect(user.id).toBe('user3');
      expect(user.apiKeys).toEqual({});
      expect(user.preferences).toBeUndefined();
    });

    it('should throw error for malformed auth_providers JSON', () => {
      const row = { id: 'errUser', auth_providers: '{invalid' };
      expect(() => privateRepo.rowToUser(row)).toThrow('Failed to parse user data');
    });

    it('should throw error for malformed api_keys JSON', () => {
      const row = { id: 'errUser', auth_providers: '{}', api_keys: '{invalid' };
      expect(() => privateRepo.rowToUser(row)).toThrow('Failed to parse user data');
    });

    it('should throw error for malformed preferences JSON', () => {
      const row = { id: 'errUser', auth_providers: '{}', api_keys: '{}', preferences: '{invalid' };
      expect(() => privateRepo.rowToUser(row)).toThrow('Failed to parse user data');
    });

    it('should throw error if row is not an object', () => {
      expect(() => privateRepo.rowToUser(null)).toThrow('Invalid row data: not an object');
      expect(() => privateRepo.rowToUser(undefined)).toThrow('Invalid row data: not an object');
      expect(() => privateRepo.rowToUser('string')).toThrow('Invalid row data: not an object');
    });
  });

  describe('getChangesCount internal helper', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let privateRepo: any;
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      privateRepo = repository as any;
    });

    it('should return changes count if present and valid', () => {
      expect(privateRepo.getChangesCount({ changes: 5 })).toBe(5);
    });

    it('should return 0 if changes is not a number', () => {
      expect(privateRepo.getChangesCount({ changes: 'not-a-number' })).toBe(0);
    });

    it('should return 0 if changes property is missing', () => {
      expect(privateRepo.getChangesCount({})).toBe(0);
    });

    it('should return 0 if result is null or not an object', () => {
      expect(privateRepo.getChangesCount(null)).toBe(0);
      expect(privateRepo.getChangesCount(undefined)).toBe(0);
      expect(privateRepo.getChangesCount('string')).toBe(0);
      expect(privateRepo.getChangesCount(123)).toBe(0);
    });
  });
});