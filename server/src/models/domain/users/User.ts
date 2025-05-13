/**
 * User entity model
 * Represents a user in the system with OAuth provider connections and API keys
 */

/**
 * OAuth provider types supported by the system
 */
export type OAuthProvider = 'google' | 'github';

/**
 * LLM provider types for API keys
 */
export type LlmProvider = 'openai' | 'anthropic';

/**
 * Information about an OAuth provider connection
 */
export interface OAuthProviderInfo {
  /** Provider's user ID */
  providerId: string;
  /** User identity from provider (email or username) */
  identity: string;
  /** Optional refresh token from provider */
  refreshToken?: string;
  /** When the connection was last refreshed/updated */
  updatedAt: number;
}

/**
 * User's stored API key for LLM provider
 */
export interface ApiKeyInfo {
  /** Encrypted API key (never stored in plaintext) */
  key: string;
  /** User-provided label for this key */
  label?: string;
  /** When the key was created/added */
  createdAt: number;
  /** When the key was last used */
  lastUsed?: number;
}

/**
 * User interface for domain layer operations
 */
export interface User {
  /** Unique user ID (UUID v4) */
  id: string;
  /** Primary email address */
  email: string;
  /** User's display name */
  displayName: string;
  /** When the user account was created */
  createdAt: number;
  /** When the user account was last updated */
  updatedAt: number;
  /** Connected OAuth providers */
  authProviders: {
    google?: OAuthProviderInfo;
    github?: OAuthProviderInfo;
  };
  /** Stored LLM API keys (encrypted) */
  apiKeys: {
    openai?: ApiKeyInfo;
    anthropic?: ApiKeyInfo;
  };
  /** User preferences */
  preferences?: {
    /** Default LLM model */
    defaultModel?: string;
    /** UI theme preference */
    theme?: 'light' | 'dark' | 'system';
    /** Other preferences as needed */
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Parameters for creating a new user
 */
export interface CreateUserParams {
  /** Primary email address */
  email: string;
  /** User's display name */
  displayName: string;
  /** OAuth provider that initiated creation */
  provider: OAuthProvider;
  /** Provider's user ID */
  providerId: string;
  /** Provider-specific identity (email/username) */
  providerIdentity: string;
  /** Optional refresh token */
  refreshToken?: string;
  /** Optional initial preferences */
  preferences?: Record<string, string | number | boolean | undefined>;
}

/**
 * Parameters for updating a user
 */
export interface UpdateUserParams {
  /** Updated email (optional) */
  email?: string;
  /** Updated display name (optional) */
  displayName?: string;
  /** Updated preferences (optional) */
  preferences?: Record<string, string | number | boolean | undefined>;
}