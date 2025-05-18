/**
 * PKCE Storage Service
 * 
 * Provides temporary storage for PKCE state and code verifiers
 * This implementation uses in-memory storage, but in a multi-server setup,
 * this should be replaced with a distributed storage (Redis, database, etc.)
 */
import { generateCodeVerifier, generateCodeChallenge, CodeChallengeMethod } from './PkceUtils';

/**
 * PKCE Authorization Request Data
 */
export interface PkceAuthData {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
  redirectUri: string;
  createdAt: number;
}

/**
 * PKCE Storage interface for persisting authorization session data
 */
export interface IPkceStorage {
  /**
   * Create a new PKCE authorization session
   * @param redirectUri The redirect URI for the authorization request
   * @param options Optional configuration (challenge method, code verifier length)
   * @returns The created PKCE authorization data (or Promise for async implementations)
   */
  createAuthSession(
    redirectUri: string,
    options?: {
      challengeMethod?: CodeChallengeMethod;
      codeVerifierLength?: number;
    }
  ): PkceAuthData | Promise<PkceAuthData>;
  
  /**
   * Store PKCE authorization data with state as key
   * @param authData The PKCE auth data to store
   */
  storeAuthData(authData: PkceAuthData): void | Promise<void>;
  
  /**
   * Get PKCE auth data by state
   * @param state The state parameter to look up
   * @returns The stored auth data or null if not found
   */
  getAuthDataByState(state: string): PkceAuthData | null | Promise<PkceAuthData | null>;
  
  /**
   * Remove PKCE auth data by state (after it's used or expired)
   * @param state The state parameter to remove
   * @returns True if data was found and removed, false otherwise
   */
  removeAuthDataByState(state: string): boolean | Promise<boolean>;
  
  /**
   * Clean up expired auth sessions
   * @param maxAgeMs Maximum age in milliseconds (default: 10 minutes)
   */
  cleanupExpiredSessions(maxAgeMs?: number): void | Promise<void>;
}

/**
 * In-memory implementation of PKCE storage
 */
export class InMemoryPkceStorage implements IPkceStorage {
  // In-memory storage for PKCE auth sessions
  private authSessions: Map<string, PkceAuthData> = new Map();
  
  // Default session expiration (10 minutes)
  private readonly DEFAULT_EXPIRATION_MS = 10 * 60 * 1000;
  
  /**
   * Create a new PKCE authorization session
   * @param redirectUri The redirect URI for the authorization request
   * @param options Optional configuration (challenge method, code verifier length)
   * @returns The created PKCE authorization data
   */
  createAuthSession(
    redirectUri: string,
    options: {
      challengeMethod?: CodeChallengeMethod;
      codeVerifierLength?: number;
    } = {}
  ): PkceAuthData {
    const {
      challengeMethod = 'S256',
      codeVerifierLength = 64
    } = options;
    
    // Generate state and code verifier
    const state = crypto.randomUUID(); // Use UUID for state
    const codeVerifier = generateCodeVerifier(codeVerifierLength);
    const codeChallenge = generateCodeChallenge(codeVerifier, challengeMethod);
    
    // Create auth data
    const authData: PkceAuthData = {
      state,
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: challengeMethod,
      redirectUri,
      createdAt: Date.now()
    };
    
    // Store the auth data
    this.storeAuthData(authData);
    
    return authData;
  }
  
  /**
   * Store PKCE authorization data with state as key
   * @param authData The PKCE auth data to store
   */
  storeAuthData(authData: PkceAuthData): void {
    this.authSessions.set(authData.state, authData);
  }
  
  /**
   * Get PKCE auth data by state
   * @param state The state parameter to look up
   * @returns The stored auth data or null if not found
   */
  getAuthDataByState(state: string): PkceAuthData | null {
    const authData = this.authSessions.get(state);
    
    if (!authData) {
      return null;
    }
    
    // Check if the session has expired
    const now = Date.now();
    if (now - authData.createdAt > this.DEFAULT_EXPIRATION_MS) {
      // Remove expired session
      this.removeAuthDataByState(state);
      return null;
    }
    
    return authData;
  }
  
  /**
   * Remove PKCE auth data by state (after it's used or expired)
   * @param state The state parameter to remove
   * @returns True if data was found and removed, false otherwise
   */
  removeAuthDataByState(state: string): boolean {
    return this.authSessions.delete(state);
  }
  
  /**
   * Clean up expired auth sessions
   * @param maxAgeMs Maximum age in milliseconds (default: 10 minutes)
   */
  cleanupExpiredSessions(maxAgeMs: number = this.DEFAULT_EXPIRATION_MS): void {
    const now = Date.now();
    
    // Find and remove expired sessions
    for (const [state, authData] of this.authSessions.entries()) {
      if (now - authData.createdAt > maxAgeMs) {
        this.authSessions.delete(state);
      }
    }
  }
}

/**
 * Create and export a singleton instance for the application
 */
import crypto from 'crypto';
export const pkceStorage = new InMemoryPkceStorage();