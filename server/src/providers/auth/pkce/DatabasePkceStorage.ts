/**
 * Database-backed PKCE Storage Service
 * 
 * Provides persistent storage for PKCE state and code verifiers
 * This implementation uses SQL database for storage, making it suitable for
 * multi-server environments where in-memory storage would not be shared.
 */
import { IPkceStorage, PkceAuthData } from './PkceStorage';
import { generateCodeVerifier, generateCodeChallenge, CodeChallengeMethod } from './PkceUtils';
import { SQLiteProvider } from '../../db/sqlite-provider';
import { DatabaseProvider } from '../../db/database-provider';
import { Environment } from '../../../services/core/EnvironmentService';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';
import path from 'path';

/**
 * Configuration options for PKCE storage
 */
export interface PkceStorageOptions {
  /** Milliseconds until session expires (default: 10 minutes) */
  ttlMs?: number;
  /** Database provider to use (optional) */
  db?: DatabaseProvider;
  /** SQLite database path (default: pkce.db in data directory) */
  dbPath?: string;
}

/**
 * Persistent PKCE storage using a database backend
 * Environment-aware for proper isolation between environments
 */
export class DatabasePkceStorage implements IPkceStorage {
  /** Time-to-live for PKCE sessions (10 minutes by default) */
  private readonly DEFAULT_TTL_MS: number = 10 * 60 * 1000;
  
  /** The database provider instance */
  private db: DatabaseProvider;
  
  /** Is the database initialized yet */
  private initialized: boolean = false;
  
  /** The environment this storage instance is for */
  private environment: Environment;
  
  /** Custom time-to-live if provided */
  private ttlMs: number;
  
  /**
   * Database table name - environment-specific
   * This ensures isolation between environments for security
   */
  private get tableName(): string {
    return `pkce_sessions_${this.environment.toLowerCase()}`;
  }
  
  /**
   * Create a new database-backed PKCE storage
   * @param environment The environment to use for table name
   * @param options Configuration options
   */
  constructor(
    environment: Environment,
    options: PkceStorageOptions = {}
  ) {
    this.environment = environment;
    this.ttlMs = options.ttlMs || this.DEFAULT_TTL_MS;
    
    // Use provided database or create SQLite provider
    if (options.db) {
      this.db = options.db;
    } else {
      const dbPath = options.dbPath || 
        path.join(process.cwd(), 'data', 'pkce.db');
      this.db = new SQLiteProvider(dbPath);
    }
  }
  
  /**
   * Initialize the database storage
   * Creates the required table if it doesn't exist
   */
  async initializeStorage(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize the database if needed
      await this.db.initialize();
      
      // Create PKCE sessions table if it doesn't exist
      // Use environment-specific table name for isolation
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          code_verifier TEXT NOT NULL,
          code_challenge TEXT NOT NULL,
          code_challenge_method TEXT NOT NULL,
          redirect_uri TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `, []);
      
      this.initialized = true;
      logger.info(`PKCE storage initialized for environment: ${this.environment}`);
    } catch (error) {
      logger.error('Failed to initialize PKCE storage', { error });
      throw error;
    }
  }
  
  /**
   * Create a new PKCE authorization session
   * @param redirectUri The redirect URI for the authorization request
   * @param options Optional configuration (challenge method, code verifier length)
   * @returns The created PKCE authorization data
   */
  async createAuthSession(
    redirectUri: string,
    options: {
      challengeMethod?: CodeChallengeMethod;
      codeVerifierLength?: number;
    } = {}
  ): Promise<PkceAuthData> {
    // Ensure storage is initialized
    if (!this.initialized) {
      await this.initializeStorage();
    }
    
    const {
      challengeMethod = 'S256',
      codeVerifierLength = 64
    } = options;
    
    // Generate state and code verifier
    const state = crypto.randomUUID(); // Use UUID for state
    const codeVerifier = generateCodeVerifier(codeVerifierLength);
    const codeChallenge = generateCodeChallenge(codeVerifier, challengeMethod);
    
    // Create auth data
    const now = Date.now();
    const expiresAt = now + this.ttlMs;
    
    const authData: PkceAuthData = {
      state,
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: challengeMethod,
      redirectUri,
      createdAt: now
    };
    
    try {
      // Store in the database
      await this.db.exec(`
        INSERT INTO ${this.tableName} (
          id, code_verifier, code_challenge, code_challenge_method, 
          redirect_uri, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        authData.state,
        authData.codeVerifier,
        authData.codeChallenge,
        authData.codeChallengeMethod,
        authData.redirectUri,
        authData.createdAt,
        expiresAt
      ]);
      
      return authData;
    } catch (error) {
      logger.error('Failed to create PKCE auth session', { error });
      throw error;
    }
  }
  
  /**
   * Store PKCE authorization data with state as key
   * @param authData The PKCE auth data to store
   */
  async storeAuthData(authData: PkceAuthData): Promise<void> {
    // Ensure storage is initialized
    if (!this.initialized) {
      await this.initializeStorage();
    }
    
    // Calculate expiration time
    const expiresAt = authData.createdAt + this.ttlMs;
    
    try {
      // Store in the database
      await this.db.exec(`
        INSERT OR REPLACE INTO ${this.tableName} (
          id, code_verifier, code_challenge, code_challenge_method, 
          redirect_uri, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        authData.state,
        authData.codeVerifier,
        authData.codeChallenge,
        authData.codeChallengeMethod,
        authData.redirectUri,
        authData.createdAt,
        expiresAt
      ]);
    } catch (error) {
      logger.error('Failed to store PKCE auth data', { error });
      throw error;
    }
  }
  
  /**
   * Get PKCE auth data by state
   * @param state The state parameter to look up
   * @returns The stored auth data or null if not found or expired
   */
  async getAuthDataByState(state: string): Promise<PkceAuthData | null> {
    // Ensure storage is initialized
    if (!this.initialized) {
      await this.initializeStorage();
    }
    
    try {
      // Query the database, including expiration check
      const rows = await this.db.query<{
        id: string;
        code_verifier: string;
        code_challenge: string;
        code_challenge_method: string;
        redirect_uri: string;
        created_at: number;
        expires_at: number;
      }>(`
        SELECT * FROM ${this.tableName} WHERE id = ? AND expires_at > ?
      `, [state, Date.now()]);
      
      // Return null if not found or expired
      if (!rows || rows.length === 0) {
        return null;
      }
      
      // Map database row to PkceAuthData
      const row = rows[0];
      return {
        state: row.id,
        codeVerifier: row.code_verifier,
        codeChallenge: row.code_challenge,
        codeChallengeMethod: row.code_challenge_method as CodeChallengeMethod,
        redirectUri: row.redirect_uri,
        createdAt: row.created_at
      };
    } catch (error) {
      logger.error('Failed to get PKCE auth data', { error, state });
      return null;
    }
  }
  
  /**
   * Remove PKCE auth data by state (after it's used or expired)
   * @param state The state parameter to remove
   * @returns True if data was found and removed, false otherwise
   */
  async removeAuthDataByState(state: string): Promise<boolean> {
    // Ensure storage is initialized
    if (!this.initialized) {
      await this.initializeStorage();
    }
    
    try {
      // Delete from the database
      const rowsAffected = await this.db.exec(`
        DELETE FROM ${this.tableName} WHERE id = ?
      `, [state]);
      
      // Return true if rows were affected
      return rowsAffected > 0;
    } catch (error) {
      logger.error('Failed to remove PKCE auth data', { error, state });
      return false;
    }
  }
  
  /**
   * Clean up expired auth sessions
   * @param maxAgeMs Maximum age in milliseconds (default: this.ttlMs)
   */
  async cleanupExpiredSessions(maxAgeMs?: number): Promise<void> {
    // Ensure storage is initialized
    if (!this.initialized) {
      await this.initializeStorage();
    }
    
    try {
      // Calculate expiration timestamp
      const now = Date.now();
      const cutoffTime = now - (maxAgeMs || this.ttlMs);
      
      // Delete expired sessions (by expires_at)
      await this.db.exec(`
        DELETE FROM ${this.tableName} WHERE expires_at < ?
      `, [cutoffTime]);
      
      // Log cleanup results
      logger.debug('Cleaned up expired PKCE sessions', { 
        environment: this.environment, 
        cutoffTime 
      });
    } catch (error) {
      logger.error('Failed to clean up expired PKCE sessions', { error });
    }
  }
}