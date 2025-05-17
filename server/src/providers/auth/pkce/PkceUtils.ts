/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * 
 * Implements the functionality needed for the OAuth Authorization Code flow with PKCE
 * as specified in RFC 7636: https://tools.ietf.org/html/rfc7636
 */
import crypto from 'crypto';

/**
 * Default length for the code verifier in bytes (between 43-128 bytes as per RFC 7636)
 */
const DEFAULT_VERIFIER_LENGTH = 64;

/**
 * PKCE Code Challenge Method
 * - 'plain': Use code verifier as is (not recommended)
 * - 'S256': Use SHA-256 hash of the code verifier (recommended)
 */
export type CodeChallengeMethod = 'plain' | 'S256';

/**
 * Generate a cryptographically random code verifier for PKCE
 * 
 * @param length Length of the verifier in bytes (defaults to 64, must be between 43-128)
 * @returns A URL-safe Base64 encoded string to be used as the code verifier
 */
export function generateCodeVerifier(length: number = DEFAULT_VERIFIER_LENGTH): string {
  // RFC 7636 requires the code verifier to be between 43-128 characters
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 bytes');
  }
  
  // Generate cryptographically random bytes
  const buffer = crypto.randomBytes(length);
  
  // Convert to Base64URL format (Base64 without padding, using URL-safe chars)
  return buffer.toString('base64')
    .replace(/\+/g, '-')    // Replace + with -
    .replace(/\//g, '_')    // Replace / with _
    .replace(/=/g, '');     // Remove padding
}

/**
 * Generate a code challenge from a code verifier using the specified method
 * 
 * @param codeVerifier The code verifier to derive the challenge from
 * @param method The challenge method to use ('plain' or 'S256')
 * @returns The code challenge string
 */
export function generateCodeChallenge(
  codeVerifier: string, 
  method: CodeChallengeMethod = 'S256'
): string {
  // Validate code verifier (minimal validation)
  if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
    throw new Error('Invalid code verifier: must be between 43 and 128 characters');
  }
  
  // For 'plain' method, code challenge is the verifier itself
  if (method === 'plain') {
    return codeVerifier;
  }
  
  // For 'S256' method, hash the verifier with SHA-256
  const hash = crypto.createHash('sha256')
    .update(codeVerifier)
    .digest();
  
  // Convert to Base64URL format
  return hash.toString('base64')
    .replace(/\+/g, '-')    // Replace + with -
    .replace(/\//g, '_')    // Replace / with _
    .replace(/=/g, '');     // Remove padding
}

/**
 * Verify that a code challenge matches a code verifier using the specified method
 * 
 * @param codeVerifier The original code verifier
 * @param codeChallenge The code challenge to verify
 * @param method The challenge method used ('plain' or 'S256')
 * @returns True if the code challenge matches the verifier, false otherwise
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: CodeChallengeMethod = 'S256'
): boolean {
  // Generate a challenge from the verifier using the same method
  const generatedChallenge = generateCodeChallenge(codeVerifier, method);
  
  // Compare the challenges (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(generatedChallenge),
    Buffer.from(codeChallenge)
  );
}