/**
 * UserRepository implements persistence operations for User entities
 */
import { v4 as uuidv4 } from 'uuid';
import { DatabaseProvider } from '../database-provider';
import { IUserRepository } from './IUserRepository';
import { User, CreateUserParams, OAuthProvider, LlmProvider, ApiKeyInfo } from '../../../models/domain/users/User';
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
      const id = uuidv4();
      
      // Set default preferences if not provided
      const preferences = params.preferences || {
        theme: 'system'
      };
      
      // New user object
      const user: User = {
        id,
        email: params.email,
        displayName: params.displayName,
        createdAt: now,
        updatedAt: now,
        authProviders: {
          [params.provider]: {
            providerId: params.providerId,
            identity: params.providerIdentity,
            refreshToken: params.refreshToken,
            updatedAt: now
          }
        },
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
          id,
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
  async storeApiKey(userId: string, provider: LlmProvider, apiKey: string, label?: string): Promise<boolean> {
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
      throw new Error(`Failed to store API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a user's API key for a provider
   * @param userId - ID of the user to get the key for
   * @param provider - LLM provider to get the key for
   * @returns Promise resolving with the decrypted API key if found, null otherwise
   * @throws Error if decryption fails
   */
  async getApiKey(userId: string, provider: LlmProvider): Promise<string | null> {
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
      throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update the "last used" timestamp for an API key
   * @param userId - ID of the user
   * @param provider - LLM provider for the key
   * @param timestamp - Timestamp to set (defaults to current time)
   * @returns Promise resolving to true if successful, false if key not found
   */
  async updateApiKeyLastUsed(userId: string, provider: LlmProvider, timestamp?: number): Promise<boolean> {
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
  private rowToUser(row: any): User {
    try {
      return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authProviders: JSON.parse(row.auth_providers),
        apiKeys: JSON.parse(row.api_keys),
        preferences: row.preferences ? JSON.parse(row.preferences) : undefined
      };
    } catch (error) {
      throw new Error(`Failed to parse user data: ${error instanceof Error ? error.message : String(error)}`);
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