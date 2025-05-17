/**
 * Tests for PKCE Utilities
 */
import { 
  generateCodeVerifier,
  generateCodeChallenge,
  verifyCodeChallenge
} from '../PkceUtils';

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a code verifier of the specified length', () => {
      // Generate a 64-byte verifier (should be 86 chars in base64url encoding - without padding)
      const verifier = generateCodeVerifier(64);
      
      // Check that we got a string of expected length - multiply bytes by 4/3, remove padding
      const expectedLength = Math.ceil(64 * 4 / 3);
      expect(verifier.length).toBeGreaterThanOrEqual(expectedLength - 2);
      expect(verifier.length).toBeLessThanOrEqual(expectedLength);
    });

    it('should generate different code verifiers on each call', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      
      // Two generated values should be different
      expect(verifier1).not.toEqual(verifier2);
    });

    it('should generate base64url-encoded strings', () => {
      const verifier = generateCodeVerifier();
      
      // Should only contain base64url safe characters
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // Should not contain padding (=)
      expect(verifier).not.toContain('=');
    });

    it('should throw an error if the requested length is invalid', () => {
      // Should throw for length < 43
      expect(() => generateCodeVerifier(42)).toThrow();
      
      // Should throw for length > 128
      expect(() => generateCodeVerifier(129)).toThrow();
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from a verifier using S256 method', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const challenge = generateCodeChallenge(verifier, 'S256');
      
      // Should be a string
      expect(typeof challenge).toBe('string');
      
      // Should only contain base64url safe characters
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // Should not contain padding (=)
      expect(challenge).not.toContain('=');
    });

    it('should return the verifier as challenge when using plain method', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const challenge = generateCodeChallenge(verifier, 'plain');
      
      // Should return the same string
      expect(challenge).toEqual(verifier);
    });

    it('should use S256 method by default', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const challenge = generateCodeChallenge(verifier);
      const explicitS256Challenge = generateCodeChallenge(verifier, 'S256');
      
      // Default should be same as explicitly specifying S256
      expect(challenge).toEqual(explicitS256Challenge);
    });

    it('should throw if verifier is invalid', () => {
      // Should throw if verifier is too short
      expect(() => generateCodeChallenge('short')).toThrow();
      
      // Should throw if verifier is undefined
      expect(() => generateCodeChallenge(undefined as unknown as string)).toThrow();
      
      // Should throw if verifier is empty
      expect(() => generateCodeChallenge('')).toThrow();
    });
  });

  describe('verifyCodeChallenge', () => {
    it('should verify a valid S256 code challenge', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const challenge = generateCodeChallenge(verifier, 'S256');
      
      // Should verify correctly
      expect(verifyCodeChallenge(verifier, challenge, 'S256')).toBe(true);
    });

    it('should verify a valid plain code challenge', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      // Plain method just uses the verifier as the challenge
      expect(verifyCodeChallenge(verifier, verifier, 'plain')).toBe(true);
    });

    it('should return false for invalid challenges', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const challenge = generateCodeChallenge(verifier, 'S256');
      
      // Modify one character in the challenge
      const invalidChallenge = challenge.substring(0, 5) + 
        (challenge.charAt(5) === 'A' ? 'B' : 'A') + 
        challenge.substring(6);
      
      // Should fail verification
      expect(verifyCodeChallenge(verifier, invalidChallenge, 'S256')).toBe(false);
    });

    it('should use S256 method by default', () => {
      const verifier = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const challenge = generateCodeChallenge(verifier, 'S256');
      
      // Should verify when method is not specified
      expect(verifyCodeChallenge(verifier, challenge)).toBe(true);
    });
  });

  describe('end-to-end flow', () => {
    it('should work through a complete PKCE flow', () => {
      // Step 1: Client generates a code verifier
      const codeVerifier = generateCodeVerifier();
      
      // Step 2: Client derives a code challenge
      const codeChallenge = generateCodeChallenge(codeVerifier, 'S256');
      
      // Step 3: Client sends code challenge with authorization request
      // (Skipped - part of the authorization URL)
      
      // Step 4: Client receives the authorization code
      // (Skipped - this happens in the authorization server)
      
      // Step 5: Client sends the code and verifier
      // Step 6: Server verifies the challenge
      const isValid = verifyCodeChallenge(codeVerifier, codeChallenge, 'S256');
      
      // Verification should succeed
      expect(isValid).toBe(true);
    });
  });
});