/**
 * Tests for PKCE Storage
 */
import { InMemoryPkceStorage, PkceAuthData } from '../PkceStorage';

describe('InMemoryPkceStorage', () => {
  let storage: InMemoryPkceStorage;

  beforeEach(() => {
    // Create a fresh storage instance for each test
    storage = new InMemoryPkceStorage();
  });

  describe('createAuthSession', () => {
    it('should create a new PKCE auth session with default options', () => {
      const redirectUri = 'https://app.example.com/callback';
      
      // Create session with default options
      const authData = storage.createAuthSession(redirectUri);
      
      // Verify that the session was created with expected properties
      expect(authData).toBeDefined();
      expect(authData.redirectUri).toBe(redirectUri);
      expect(authData.codeChallengeMethod).toBe('S256');
      expect(authData.state).toBeDefined();
      expect(authData.codeVerifier).toBeDefined();
      expect(authData.codeChallenge).toBeDefined();
      expect(authData.createdAt).toBeGreaterThan(0);
    });

    it('should create a new PKCE auth session with custom options', () => {
      const redirectUri = 'https://app.example.com/callback';
      
      // Create session with custom options
      const authData = storage.createAuthSession(redirectUri, {
        challengeMethod: 'plain',
        codeVerifierLength: 64
      });
      
      // Verify that the session was created with expected properties
      expect(authData).toBeDefined();
      expect(authData.redirectUri).toBe(redirectUri);
      expect(authData.codeChallengeMethod).toBe('plain');
      expect(authData.state).toBeDefined();
      expect(authData.codeVerifier).toBeDefined();
      expect(authData.codeChallenge).toBeDefined();
      expect(authData.createdAt).toBeGreaterThan(0);
    });

    it('should store the created auth session in the storage', () => {
      const redirectUri = 'https://app.example.com/callback';
      
      // Create a session
      const authData = storage.createAuthSession(redirectUri);
      
      // Verify it was stored
      const retrievedData = storage.getAuthDataByState(authData.state);
      expect(retrievedData).toEqual(authData);
    });
  });

  describe('storeAuthData and getAuthDataByState', () => {
    it('should store and retrieve auth data by state', () => {
      // Create mock auth data
      const authData: PkceAuthData = {
        state: 'test-state-123',
        codeVerifier: 'test-verifier-456',
        codeChallenge: 'test-challenge-789',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: Date.now()
      };
      
      // Store the auth data
      storage.storeAuthData(authData);
      
      // Retrieve by state
      const retrievedData = storage.getAuthDataByState(authData.state);
      
      // Verify retrieved data matches
      expect(retrievedData).toEqual(authData);
    });

    it('should return null when getting by non-existent state', () => {
      // Try to retrieve with a state that doesn't exist
      const retrievedData = storage.getAuthDataByState('non-existent-state');
      
      // Should return null
      expect(retrievedData).toBeNull();
    });
  });

  describe('removeAuthDataByState', () => {
    it('should remove auth data by state', () => {
      // Create mock auth data
      const authData: PkceAuthData = {
        state: 'test-state-remove',
        codeVerifier: 'test-verifier-remove',
        codeChallenge: 'test-challenge-remove',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: Date.now()
      };
      
      // Store the auth data
      storage.storeAuthData(authData);
      
      // Verify it exists
      expect(storage.getAuthDataByState(authData.state)).toEqual(authData);
      
      // Remove it
      const removeResult = storage.removeAuthDataByState(authData.state);
      
      // Remove should return true (found and removed)
      expect(removeResult).toBe(true);
      
      // Now it should be gone
      expect(storage.getAuthDataByState(authData.state)).toBeNull();
    });

    it('should return false when removing non-existent state', () => {
      // Try to remove a state that doesn't exist
      const removeResult = storage.removeAuthDataByState('non-existent-state');
      
      // Should return false (not found)
      expect(removeResult).toBe(false);
    });
  });

  describe('expired sessions', () => {
    it('should not return expired auth sessions', () => {
      // Mock the date to a specific point in time
      const now = Date.now();
      const pastTime = now - (20 * 60 * 1000); // 20 minutes ago (beyond the 10 minute default)
      
      // Create auth data with expired timestamp
      const expiredAuthData: PkceAuthData = {
        state: 'expired-state',
        codeVerifier: 'expired-verifier',
        codeChallenge: 'expired-challenge',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: pastTime
      };
      
      // Store the expired data
      storage.storeAuthData(expiredAuthData);
      
      // Try to get the expired data - should return null
      const retrievedData = storage.getAuthDataByState('expired-state');
      expect(retrievedData).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      // Mock current time
      const now = Date.now();
      
      // Create an expired session (15 minutes old)
      const expiredAuthData: PkceAuthData = {
        state: 'expired-state-cleanup',
        codeVerifier: 'expired-verifier-cleanup',
        codeChallenge: 'expired-challenge-cleanup',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: now - (15 * 60 * 1000)
      };
      
      // Create a current session (5 minutes old)
      const currentAuthData: PkceAuthData = {
        state: 'current-state-cleanup',
        codeVerifier: 'current-verifier-cleanup',
        codeChallenge: 'current-challenge-cleanup',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: now - (5 * 60 * 1000)
      };
      
      // Store both sessions
      storage.storeAuthData(expiredAuthData);
      storage.storeAuthData(currentAuthData);
      
      // Run cleanup with default 10 minute expiration
      storage.cleanupExpiredSessions();
      
      // Check that expired session is gone
      const expiredResult = storage.getAuthDataByState('expired-state-cleanup');
      expect(expiredResult).toBeNull();
      
      // Check that current session is still there
      const currentResult = storage.getAuthDataByState('current-state-cleanup');
      expect(currentResult).toEqual(currentAuthData);
    });

    it('should respect the custom maxAgeMs parameter', () => {
      // Mock current time
      const now = Date.now();
      
      // Create a session that's 2 minutes old
      const recentAuthData: PkceAuthData = {
        state: 'recent-state-custom',
        codeVerifier: 'recent-verifier-custom',
        codeChallenge: 'recent-challenge-custom',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: now - (2 * 60 * 1000)
      };
      
      // Store the session
      storage.storeAuthData(recentAuthData);
      
      // Run cleanup with custom 1 minute expiration
      storage.cleanupExpiredSessions(1 * 60 * 1000);
      
      // The session should be removed since it's older than 1 minute
      const result = storage.getAuthDataByState('recent-state-custom');
      expect(result).toBeNull();
    });
  });
});