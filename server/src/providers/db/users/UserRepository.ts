/**
 * UserRepository implements persistence operations for User entities
 */
import { v4 as uuidv4 } from 'uuid';
import { DatabaseProvider } from '../database-provider';
import { IUserRepository } from './IUserRepository';
import { 
  User, 
  CreateUserParams, 
  OAuthProvider, 
  LlmProvider, 
  ApiKeyInfo 
} from '../../../models/domain/users/User';
import { DatabaseError } from '../../../utils/errors';
import { EncryptionService } from '../../security/encryption-service';

/**
 * Repository for User entity persistence
 */
export class UserRepository implements IUserRepository {
  /**
   * Create a new UserRepository instance
   * @param dbProvider - Database provider for persistence
   * @param encryptionService - Service for encrypting/decrypting sensitive data
   */
  constructor(
    private dbProvider: DatabaseProvider,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Create a new user
   * @param params - User creation parameters
   * @returns Promise resolving with the created user
   * @throws DatabaseError if creation fails
   */
  async create(params: CreateUserParams): Promise<User> {
    try {
      const now = Date.now();
      const userId = params.id || uuidv4(); // Use params.id if available, else generate new
      
      // Set default preferences if not provided
      const preferences = params.preferences || {
        theme: 'system'
      };
      
      // Conditionally build authProviders
      let authProvidersData = {};
      if (params.provider && params.providerId && params.providerIdentity) {
        authProvidersData = {
          [params.provider]: {
            providerId: params.providerId,
            identity: params.providerIdentity,
            refreshToken: params.refreshToken,
            updatedAt: now
          }
        };
      } else if (params.id && (
        !params.provider || 
        !params.providerId || 
        !params.providerIdentity
      )) {
        // If an ID is provided but no complete provider info, 
        // assume it's a system/dev user with no initial OAuth provider
        authProvidersData = {}; 
      } else {
        // This case should ideally not be reached if CreateUserParams 
        // is used correctly elsewhere
        // (i.e., either full provider info OR an ID is given)
        // For safety, or if partial provider info is possible & undesirable:
        throw new DatabaseError(
          'Invalid parameters for user creation: ' +
          'provider information incomplete and no id provided.'
        );
      }

      // New user object
      const user: User = {
        id: userId, // Use determined userId
        email: params.email,
        displayName: params.displayName,
        createdAt: now,
        updatedAt: now,
        authProviders: authProvidersData,
        apiKeys: {},
        preferences
      };
      
      // Store in database
      await this.dbProvider.exec(
        `INSERT INTO users (
          id, email, display_name, created_at, updated_at, 
          auth_providers, api_keys, preferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, // Use determined userId
          params.email,
          params.displayName,
          now,
          now,
          JSON.stringify(user.authProviders),
          JSON.stringify(user.apiKeys),
          JSON.stringify(user.preferences)
        ]
      );
      
      return user;
    } catch (error) {
      if (error instanceof DatabaseError) { // Re-throw if it's already our specific error
        throw error;
      }
      throw new DatabaseError(
        'Failed to create user',
        error instanceof Error ? error.message : String(error),
        error as Error
      );
    }
  }

  /**
   * Find a user by ID
   * @param id - User ID to search for
   * @returns Promise resolving with the user if found, null if not found
   * @throws Error if data retrieval or parsing fails
   */
  async findById(id: string): Promise<User | null> {
    const rows = await this.dbProvider.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.rowToUser(rows[0]);
  }
  
  /**
   * Alias for findById, for compatibility
   * @param id - User ID to search for
   * @returns Promise resolving with the user if found, null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    return this.findById(id);
  }

  /**
   * Find a user by email address
   * @param email - Email address to search for
   * @returns Promise resolving with the user if found, null if not found
   * @throws Error if data retrieval or parsing fails
   */
  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.dbProvider.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.rowToUser(rows[0]);
  }

  /**
   * Find a user by their OAuth provider ID
   * @param provider - OAuth provider type
   * @param providerId - Provider-specific user ID
   * @returns Promise resolving with the user if found, null if not found
   * @throws Error if data retrieval or parsing fails
   */
  async findByProviderId(provider: OAuthProvider, providerId: string): Promise<User | null> {
    // Using a JSON path query to search within the auth_providers JSON object
    // This query finds users where auth_providers contains the provider with matching providerId
    const rows = await this.dbProvider.query(
      `SELECT * FROM users WHERE json_extract(auth_providers, '$."${provider}".providerId') = ?`,
      [providerId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.rowToUser(rows[0]);
  }
  
  /**
   * Find or create a user by OAuth provider
   * @param provider - OAuth provider type (e.g., 'github')
   * @param providerId - Provider's user ID
   * @param userData - User data from the provider
   * @returns Promise resolving with the found or created user
   */
  async findOrCreateUserByOAuth(
    provider: OAuthProvider,
    providerId: string,
    userData: {
      email: string;
      displayName: string;
      providerIdentity?: string;
      refreshToken?: string;
    }
  ): Promise<User> {
    // First try to find the user by provider ID
    const existingUser = await this.findByProviderId(provider, providerId);
    
    if (existingUser) {
      // Update user data with latest from provider
      const now = Date.now();
      
      // Update the provider information
      if (existingUser.authProviders[provider]) {
        existingUser.authProviders[provider] = {
          ...existingUser.authProviders[provider],
          providerId,
          identity: userData.providerIdentity || existingUser.authProviders[provider].identity,
          refreshToken: userData.refreshToken || existingUser.authProviders[provider].refreshToken,
          updatedAt: now
        };
      }
      
      // Update core user data if needed
      if (userData.email) {
        existingUser.email = userData.email;
      }
      
      if (userData.displayName) {
        existingUser.displayName = userData.displayName;
      }
      
      existingUser.updatedAt = now;
      
      // Save the updated user
      await this.update(existingUser);
      
      return existingUser;
    }
    
    // Create a new user
    return this.create({
      email: userData.email,
      displayName: userData.displayName,
      provider,
      providerId,
      providerIdentity: userData.providerIdentity || userData.email,
      refreshToken: userData.refreshToken
    });
  }

  /**
   * Update a user
   * @param user - User object with updated fields
   * @returns Promise resolving with the updated user, null if user not found
   * @throws DatabaseError if update fails
   */
  async update(user: User): Promise<User | null> {
    try {
      const result = await this.dbProvider.exec(
        `UPDATE users SET 
          email = ?, 
          display_name = ?, 
          updated_at = ?,
          auth_providers = ?,
          api_keys = ?,
          preferences = ?
        WHERE id = ?`,
        [
          user.email,
          user.displayName,
          user.updatedAt,
          JSON.stringify(user.authProviders),
          JSON.stringify(user.apiKeys),
          JSON.stringify(user.preferences),
          user.id
        ]
      );
      
      // Get typesafe result
      // Check if any rows were updated
      if (this.getChangesCount(result) === 0) {
        return null; // User not found
      }
      
      return user;
    } catch (error) {
      throw new DatabaseError(
        'Failed to update user',
        error instanceof Error ? error.message : String(error),
        error as Error
      );
    }
  }

  /**
   * Store an API key for a user
   * @param userId - ID of the user to store the key for
   * @param provider - LLM provider for this key
   * @param apiKey - The API key to encrypt and store
   * @param label - Optional user-friendly label for the key
   * @returns Promise resolving to true if successful, false if user not found
   * @throws Error if encryption or storage fails
   */
  async storeApiKey(
    userId: string, 
    provider: LlmProvider, 
    apiKey: string, 
    label?: string
  ): Promise<boolean> {
    // First retrieve the user to get the current API keys
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }
    
    try {
      // Encrypt the API key
      const encryptedKey = await this.encryptionService.encryptSensitiveData(apiKey);
      
      // Create key info object
      const keyInfo: ApiKeyInfo = {
        key: encryptedKey,
        label: label || `${provider} API Key`,
        createdAt: Date.now()
      };
      
      // Update the user's API keys
      user.apiKeys = {
        ...user.apiKeys,
        [provider]: keyInfo
      };
      
      // Update the user
      const result = await this.dbProvider.exec(
        'UPDATE users SET api_keys = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(user.apiKeys), Date.now(), userId]
      );
      
      // Check if the update was successful
      return this.getChangesCount(result) > 0;
    } catch (error) {
      throw new Error(
        `Failed to store API key: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a user's API key info for a provider
   * @param userId - ID of the user to get the key for
   * @param provider - LLM provider to get the key for
   * @returns Promise resolving with the API key info if found, null otherwise
   */
  async getApiKey(userId: string, provider: LlmProvider): Promise<ApiKeyInfo | null> {
    // First retrieve the user
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }
    
    // Check if the user has an API key for this provider
    const keyInfo = user.apiKeys[provider];
    if (!keyInfo) {
      return null;
    }
    
    return keyInfo;
  }
  
  /**
   * Get a user's decrypted API key string for a provider
   * @param userId - ID of the user to get the key for
   * @param provider - LLM provider to get the key for
   * @returns Promise resolving with the decrypted API key if found, null otherwise
   * @throws Error if decryption fails
   */
  async getDecryptedApiKey(userId: string, provider: LlmProvider): Promise<string | null> {
    // First retrieve the user
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }
    
    // Check if the user has an API key for this provider
    const keyInfo = user.apiKeys[provider];
    if (!keyInfo) {
      return null;
    }
    
    try {
      // Decrypt the API key
      return await this.encryptionService.decryptSensitiveData(keyInfo.key);
    } catch (error) {
      throw new Error(
        `Failed to decrypt API key: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update the "last used" timestamp for an API key
   * @param userId - ID of the user
   * @param provider - LLM provider for the key
   * @param timestamp - Timestamp to set (defaults to current time)
   * @returns Promise resolving to true if successful, false if key not found
   */
  async updateApiKeyLastUsed(
    userId: string, 
    provider: LlmProvider, 
    timestamp?: number
  ): Promise<boolean> {
    // First retrieve the user
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }
    
    // Check if the user has an API key for this provider
    const keyInfo = user.apiKeys[provider];
    if (!keyInfo) {
      return false;
    }
    
    // Update the last used timestamp
    keyInfo.lastUsed = timestamp || Date.now();
    
    // Update the user
    const result = await this.dbProvider.exec(
      'UPDATE users SET api_keys = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(user.apiKeys), Date.now(), userId]
    );
    
    // Check if the update was successful
    return this.getChangesCount(result) > 0;
  }

  /**
   * Delete an API key for a user
   * @param userId - ID of the user
   * @param provider - LLM provider for the key
   * @returns Promise resolving to true if successful, false if key not found
   */
  async deleteApiKey(userId: string, provider: LlmProvider): Promise<boolean> {
    // First retrieve the user
    const user = await this.findById(userId);
    if (!user || !user.apiKeys || !user.apiKeys[provider]) {
      return false;
    }
    
    // Remove the API key
    delete user.apiKeys[provider];
    
    // Update the user
    const result = await this.dbProvider.exec(
      'UPDATE users SET api_keys = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(user.apiKeys), Date.now(), userId]
    );
    
    // Check if the update was successful
    return this.getChangesCount(result) > 0;
  }

  /**
   * Get all API keys for a user
   * @param userId - ID of the user
   * @returns Map of provider to API key info
   */
  async getAllApiKeys(userId: string): Promise<Partial<Record<LlmProvider, ApiKeyInfo>>> {
    // First retrieve the user
    const user = await this.findById(userId);
    if (!user) {
      return {} as Partial<Record<LlmProvider, ApiKeyInfo>>;
    }
    
    return user.apiKeys;
  }

  /**
   * Delete a user
   * @param id - ID of the user to delete
   * @returns Promise resolving to true if successful, false if user not found
   * @throws DatabaseError if deletion fails
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.dbProvider.exec(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      // Check if any rows were deleted
      return this.getChangesCount(result) > 0;
    } catch (error) {
      throw new DatabaseError(
        'Failed to delete user',
        error instanceof Error ? error.message : String(error),
        error as Error
      );
    }
  }

  /**
   * Convert a database row to a User object
   * @param row - Database row
   * @returns User object
   * @throws Error if parsing fails
   */
  /**
   * Convert a database row to a User object with type safety
   * @param row - Database row with user data
   * @returns User object
   */
  private rowToUser(row: unknown): User {
    // Validate and type the row data for safety
    if (!row || typeof row !== 'object') {
      throw new Error('Invalid row data: not an object');
    }
    
    const typedRow = row as {
      id: string;
      email: string;
      display_name: string;
      created_at: number;
      updated_at: number;
      auth_providers: string;
      api_keys?: string;
      preferences?: string;
      [key: string]: unknown;
    };
    try {
      return {
        id: typedRow.id,
        email: typedRow.email,
        displayName: typedRow.display_name,
        createdAt: typedRow.created_at,
        updatedAt: typedRow.updated_at,
        authProviders: JSON.parse(typedRow.auth_providers),
        apiKeys: typedRow.api_keys ? JSON.parse(typedRow.api_keys) : {},
        preferences: typedRow.preferences ? JSON.parse(typedRow.preferences) : undefined
      };
    } catch (error) {
      throw new Error(
        `Failed to parse user data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper method to get change count from database result
   * @param result - Database operation result
   * @returns Number of rows affected
   */
  private getChangesCount(result: unknown): number {
    if (result && typeof result === 'object' && 'changes' in result && 
        typeof result.changes === 'number') {
      return result.changes;
    }
    return 0;
  }
}