/**
 * EncryptionService provides secure encryption and decryption capabilities 
 * for sensitive data such as API keys
 */
import crypto from 'crypto';
import { ExternalServiceError } from '../../utils/errors';

/**
 * Service for encrypting and decrypting sensitive data like API keys
 * using AES-256-GCM authenticated encryption
 */
export class EncryptionService {
  /** The encryption key loaded from environment variables */
  private encryptionKey!: Buffer;

  /**
   * Create a new encryption service instance
   * @param keyOverride - Optional encryption key override for testing
   * @throws Error if ENCRYPTION_KEY environment variable is not properly configured
   */
  constructor(keyOverride?: Buffer) {
    if (keyOverride) {
      // For testing only
      this.encryptionKey = keyOverride;
    } else {
      this.initializeEncryptionKey();
    }
  }

  /**
   * Initialize the encryption key from environment variables
   * @throws Error if ENCRYPTION_KEY is missing or invalid
   */
  private initializeEncryptionKey(): void {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // In development, create a predictable key for easy development
    if (process.env.NODE_ENV === 'development') {
      // Create a 32-byte key from the provided string (padded or truncated as needed)
      const devKey = Buffer.alloc(32);
      const sourceBuffer = Buffer.from(keyString, 'utf8');
      
      // Copy up to 32 bytes from the provided key or pad with zeros
      sourceBuffer.copy(devKey, 0, 0, Math.min(sourceBuffer.length, 32));
      
      this.encryptionKey = devKey;
      return;
    }

    try {
      // Convert key from base64
      this.encryptionKey = Buffer.from(keyString, 'base64');
    } catch (error) {
      throw new Error('ENCRYPTION_KEY must be a valid base64 string');
    }

    // Validate key length for AES-256
    if (this.encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
  }
  
  // For testing purposes - allows for mocking in tests
  protected getEncryptionKey(): Buffer {
    return this.encryptionKey;
  }

  /**
   * Encrypt sensitive data using AES-256-GCM authenticated encryption
   * @param data - The sensitive data to encrypt
   * @returns Promise resolving to the encrypted data as a base64 string
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher with authenticated encryption
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag for integrity verification
      const authTag = cipher.getAuthTag();

      // Return IV + Auth Tag + Encrypted Data, all properly separated
      return Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]).toString('base64');
    } catch (error) {
      throw new ExternalServiceError(
        'Failed to encrypt sensitive data',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Decrypt sensitive data encrypted with AES-256-GCM
   * @param encryptedData - The encrypted data as a base64 string
   * @returns Promise resolving to the decrypted data
   * @throws ExternalServiceError if decryption fails
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      // Convert from base64 to buffer
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract IV (first 16 bytes)
      const iv = buffer.subarray(0, 16);

      // Extract auth tag (next 16 bytes)
      const authTag = buffer.subarray(16, 32);

      // Extract encrypted data (remaining bytes)
      const encrypted = buffer.subarray(32);

      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      // Log error without sensitive details
      console.error('Decryption failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ExternalServiceError(
        'Failed to decrypt sensitive data',
        error instanceof Error ? error.message : String(error),
        'EncryptionService'
      );
    }
  }

  /**
   * Generate a secure random encryption key suitable for AES-256
   * This is a utility method for generating keys during setup
   * 
   * @returns A new encryption key encoded as base64
   */
  static generateEncryptionKey(): string {
    // Generate 32 random bytes (256 bits) for AES-256
    const key = crypto.randomBytes(32);
    
    // Return as base64 encoded string for storage in environment variables
    return key.toString('base64');
  }
}