/**
 * Interface for user data repository operations
 */
import { User, CreateUserParams, OAuthProvider, LlmProvider } from '../../../models/domain/users/User';

/**
 * User repository interface for persistence operations
 */
export interface IUserRepository {
  /**
   * Create a new user
   * @param params - User creation parameters
   * @returns Promise resolving with the created user
   */
  create(params: CreateUserParams): Promise<User>;
  
  /**
   * Find a user by ID
   * @param id - User ID to search for
   * @returns Promise resolving with the user if found, null if not found
   */
  findById(id: string): Promise<User | null>;
  
  /**
   * Find a user by email address
   * @param email - Email address to search for
   * @returns Promise resolving with the user if found, null if not found
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Find a user by their OAuth provider ID
   * @param provider - OAuth provider type
   * @param providerId - Provider-specific user ID
   * @returns Promise resolving with the user if found, null if not found
   */
  findByProviderId(provider: OAuthProvider, providerId: string): Promise<User | null>;
  
  /**
   * Update a user
   * @param user - User object with updated fields
   * @returns Promise resolving with the updated user, null if user not found
   */
  update(user: User): Promise<User | null>;
  
  /**
   * Store an API key for a user
   * @param userId - ID of the user to store the key for
   * @param provider - LLM provider for this key
   * @param apiKey - The API key to encrypt and store
   * @param label - Optional user-friendly label for the key
   * @returns Promise resolving to true if successful, false if user not found
   */
  storeApiKey(userId: string, provider: LlmProvider, apiKey: string, label?: string): Promise<boolean>;
  
  /**
   * Get a user's API key for a provider
   * @param userId - ID of the user to get the key for
   * @param provider - LLM provider to get the key for
   * @returns Promise resolving with the decrypted API key if found, null otherwise
   */
  getApiKey(userId: string, provider: LlmProvider): Promise<string | null>;
  
  /**
   * Update the "last used" timestamp for an API key
   * @param userId - ID of the user
   * @param provider - LLM provider for the key
   * @param timestamp - Timestamp to set (defaults to current time)
   * @returns Promise resolving to true if successful, false if key not found
   */
  updateApiKeyLastUsed(userId: string, provider: LlmProvider, timestamp?: number): Promise<boolean>;
  
  /**
   * Delete a user
   * @param id - ID of the user to delete
   * @returns Promise resolving to true if successful, false if user not found
   */
  delete(id: string): Promise<boolean>;
}