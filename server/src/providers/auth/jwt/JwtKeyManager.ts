/**
 * JWT Key Manager
 * 
 * Manages RSA key pairs for signing and verifying JWTs
 * - Environment-specific keys for isolation
 * - Key rotation support
 * - Secure storage of keys
 */
import crypto from 'crypto';
import { Environment, EnvironmentService } from '../../../services/core/EnvironmentService';
import { SecureStorage } from '../../security/secure-storage';
import { logger } from '../../../utils/logger';

/**
 * Represents an RSA key pair for JWT signing/verification
 */
interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Interface for signing key information
 */
export interface SigningKey {
  keyId: string;
  privateKey: string;
}

/**
 * Manages RSA key pairs for JWT token signing and verification
 * with support for different environments and key rotation
 */
export class JwtKeyManager {
  private keys: Map<string, KeyPair> = new Map();
  private readonly environment: Environment;
  
  /**
   * Create a new JWT Key Manager
   * @param environmentService Service for detecting the current environment
   * @param secureStorage Storage for persisting keys securely
   */
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly secureStorage: SecureStorage
  ) {
    this.environment = this.environmentService.getEnvironment();
  }
  
  /**
   * Initialize the key manager
   * Loads or generates keys as needed
   */
  async initialize(): Promise<void> {
    logger.info(`Initializing JWT key manager for ${this.environment} environment`);
    
    try {
      // Try to load current key
      const currentKeyName = this.getKeyStorageName('current');
      const currentKeyPair = await this.loadKeyPair(currentKeyName);
      
      if (currentKeyPair) {
        // Current key exists, use it
        this.keys.set(this.getKeyId('current'), currentKeyPair);
        logger.info(`Loaded current JWT key for ${this.environment} environment`);
      } else {
        // No current key, generate one
        const newKeyPair = this.generateKeyPair();
        await this.storeKeyPair(currentKeyName, newKeyPair);
        this.keys.set(this.getKeyId('current'), newKeyPair);
        logger.info(`Generated new JWT key for ${this.environment} environment`);
      }
      
      // Try to load previous key if it exists (for verification of older tokens)
      const previousKeyName = this.getKeyStorageName('previous');
      const previousKeyPair = await this.loadKeyPair(previousKeyName);
      
      if (previousKeyPair) {
        this.keys.set(this.getKeyId('previous'), previousKeyPair);
        logger.info(`Loaded previous JWT key for ${this.environment} environment`);
      }
    } catch (error) {
      logger.error('Failed to initialize JWT key manager', { error });
      throw error;
    }
  }
  
  /**
   * Get a key for signing tokens
   * @param keyId Optional specific key ID to use (defaults to current key)
   * @returns Key ID and private key for signing
   */
  async getSigningKey(keyId?: string): Promise<SigningKey> {
    // If no specific key ID, use the current key
    const useKeyId = keyId || this.getKeyId('current');
    
    // Check if we already have this key cached
    let keyPair = this.keys.get(useKeyId);
    
    // If not, try to load it
    if (!keyPair) {
      const keyName = keyId ? 
        this.getKeyStorageNameFromId(keyId) : 
        this.getKeyStorageName('current');
      
      keyPair = await this.loadKeyPair(keyName);
      
      // If still no key, throw error
      if (!keyPair) {
        throw new Error(`JWT signing key not found: ${useKeyId}`);
      }
      
      // Cache the key for future use
      this.keys.set(useKeyId, keyPair);
    }
    
    // Return the key ID and private key
    return {
      keyId: useKeyId,
      privateKey: keyPair.privateKey
    };
  }
  
  /**
   * Get a public key for verifying tokens
   * @param keyId The key ID to get
   * @returns Public key for verification or null if not found
   */
  async getVerificationKey(keyId: string): Promise<string | undefined> {
    // Check if we already have this key cached
    let keyPair = this.keys.get(keyId);
    
    // If not, try to load it
    if (!keyPair) {
      const keyName = this.getKeyStorageNameFromId(keyId);
      keyPair = await this.loadKeyPair(keyName);
      
      // If still no key, return undefined
      if (!keyPair) {
        return undefined;
      }
      
      // Cache the key for future use
      this.keys.set(keyId, keyPair);
    }
    
    // Return just the public key
    return keyPair.publicKey;
  }
  
  /**
   * Rotate the JWT keys
   * - Current key becomes previous key
   * - New key is generated and becomes current
   */
  async rotateKeys(): Promise<void> {
    logger.info(`Rotating JWT keys for ${this.environment} environment`);
    
    try {
      // Get the current key
      const currentKeyId = this.getKeyId('current');
      const currentKeyPair = this.keys.get(currentKeyId);
      
      if (!currentKeyPair) {
        throw new Error('Cannot rotate keys: No current key exists');
      }
      
      // Store current key as previous
      const previousKeyName = this.getKeyStorageName('previous');
      await this.storeKeyPair(previousKeyName, currentKeyPair);
      this.keys.set(this.getKeyId('previous'), currentKeyPair);
      
      // Generate new current key
      const newKeyPair = this.generateKeyPair();
      const currentKeyName = this.getKeyStorageName('current');
      await this.storeKeyPair(currentKeyName, newKeyPair);
      this.keys.set(currentKeyId, newKeyPair);
      
      logger.info(`Successfully rotated JWT keys for ${this.environment} environment`);
    } catch (error) {
      logger.error('Failed to rotate JWT keys', { error });
      throw error;
    }
  }
  
  /**
   * Load a key pair from secure storage
   * @param keyName The storage key name
   * @returns The key pair or null if not found
   * @private
   */
  private async loadKeyPair(keyName: string): Promise<KeyPair | undefined> {
    try {
      // Load from secure storage
      const storedKey = await this.secureStorage.get(keyName);
      
      if (!storedKey) {
        return undefined;
      }
      
      // Parse the key pair
      const keyPair = JSON.parse(storedKey) as KeyPair;
      return keyPair;
    } catch (error) {
      logger.error(`Failed to load JWT key pair: ${keyName}`, { error });
      return undefined;
    }
  }
  
  /**
   * Store a key pair in secure storage
   * @param keyName The storage key name
   * @param keyPair The key pair to store
   * @private
   */
  private async storeKeyPair(keyName: string, keyPair: KeyPair): Promise<void> {
    try {
      // Serialize the key pair
      const serialized = JSON.stringify(keyPair);
      
      // Store in secure storage
      await this.secureStorage.set(keyName, serialized);
    } catch (error) {
      logger.error(`Failed to store JWT key pair: ${keyName}`, { error });
      throw error;
    }
  }
  
  /**
   * Generate a new RSA key pair
   * @returns A new key pair
   * @private
   */
  private generateKeyPair(): KeyPair {
    // Generate 2048-bit RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    return { publicKey, privateKey };
  }
  
  /**
   * Get the storage key name for a JWT key
   * @param suffix The key suffix (e.g., 'current', 'previous')
   * @returns The storage key name
   * @private
   */
  private getKeyStorageName(suffix: string): string {
    return `jwt_keys_${this.environment.toLowerCase()}_${suffix}`;
  }
  
  /**
   * Get the key ID for a JWT key
   * @param suffix The key suffix (e.g., 'current', 'previous')
   * @returns The key ID to use in tokens
   * @private
   */
  private getKeyId(suffix: string): string {
    return `${this.environment.toLowerCase()}_${suffix}`;
  }
  
  /**
   * Get the storage key name from a key ID
   * @param keyId The key ID
   * @returns The storage key name
   * @private
   */
  private getKeyStorageNameFromId(keyId: string): string {
    // Extract the suffix from the key ID
    // If it's an environment_suffix format, use that
    if (keyId.includes('_')) {
      const parts = keyId.split('_');
      const env = parts[0];
      const suffix = parts.slice(1).join('_');
      return `jwt_keys_${env}_${suffix}`;
    }
    
    // Otherwise just use the key ID directly
    return `jwt_keys_${this.environment.toLowerCase()}_${keyId}`;
  }
}