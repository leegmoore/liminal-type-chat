/**
 * Tests for Database-backed PKCE Storage
 */
import { DatabasePkceStorage } from '../DatabasePkceStorage';
import { SQLiteProvider } from '../../../db/sqlite-provider';
import { DatabaseProvider } from '../../../db/database-provider';
import { Environment } from '../../../../services/core/EnvironmentService';

// Mock the database provider
jest.mock('../../../db/sqlite-provider');

describe('DatabasePkceStorage', () => {
  let storage: DatabasePkceStorage;
  let mockDb: jest.Mocked<DatabaseProvider>;
  // Using in-memory database for testing
  
  beforeEach(() => {
    // Create a mock database
    mockDb = {
      initialize: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      exec: jest.fn().mockResolvedValue(1),
      transaction: jest.fn().mockImplementation((fn) => Promise.resolve(fn({
        query: jest.fn().mockReturnValue([]),
        exec: jest.fn().mockReturnValue(1)
      }))),
      close: jest.fn().mockResolvedValue(undefined),
      healthCheck: jest.fn().mockResolvedValue(true)
    };
    
    // Reset the mock implementation
    (SQLiteProvider as jest.Mock).mockImplementation(() => mockDb);
    
    // Create a fresh storage instance for each test
    storage = new DatabasePkceStorage(Environment.DEVELOPMENT);
  });

  describe('initializeStorage', () => {
    it('should create the pkce_sessions table if it doesn\'t exist', async () => {
      await storage.initializeStorage();
      
      // Check that exec was called with the correct SQL
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS pkce_sessions/i),
        []
      );
    });
  });

  describe('createAuthSession', () => {
    it('should create a new PKCE auth session with default options', async () => {
      const redirectUri = 'https://app.example.com/callback';
      
      // Create session with default options
      const authData = await storage.createAuthSession(redirectUri);
      
      // Verify that the session was created with expected properties
      expect(authData).toBeDefined();
      expect(authData.redirectUri).toBe(redirectUri);
      expect(authData.codeChallengeMethod).toBe('S256');
      expect(authData.state).toBeDefined();
      expect(authData.codeVerifier).toBeDefined();
      expect(authData.codeChallenge).toBeDefined();
      expect(authData.createdAt).toBeGreaterThan(0);
      
      // Verify that session was stored in the database
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO pkce_sessions/i),
        expect.arrayContaining([
          authData.state,
          authData.codeVerifier,
          authData.codeChallenge,
          authData.codeChallengeMethod,
          authData.redirectUri,
          authData.createdAt,
          expect.any(Number) // expiresAt
        ])
      );
    });

    it('should create a new PKCE auth session with custom options', async () => {
      const redirectUri = 'https://app.example.com/callback';
      
      // Create session with custom options
      const authData = await storage.createAuthSession(redirectUri, {
        challengeMethod: 'plain',
        codeVerifierLength: 64 // minimum allowed is 43
      });
      
      // Verify that the session was created with expected properties
      expect(authData).toBeDefined();
      expect(authData.redirectUri).toBe(redirectUri);
      expect(authData.codeChallengeMethod).toBe('plain');
      expect(authData.state).toBeDefined();
      expect(authData.codeVerifier).toBeDefined();
      expect(authData.codeVerifier.length).toBeGreaterThanOrEqual(32);
      expect(authData.codeChallenge).toBeDefined();
      expect(authData.createdAt).toBeGreaterThan(0);
      
      // Verify that session was stored in the database
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO pkce_sessions/i),
        expect.arrayContaining([
          authData.state,
          authData.codeVerifier,
          authData.codeChallenge,
          'plain', // codeChallengeMethod
          authData.redirectUri,
          authData.createdAt,
          expect.any(Number) // expiresAt
        ])
      );
    });
  });

  describe('getAuthDataByState', () => {
    it('should retrieve auth data by state', async () => {
      const now = Date.now();
      const future = now + (10 * 60 * 1000); // 10 minutes in the future
      
      // Mock the database to return a specific result
      const mockAuthData = {
        id: 'test-state-123',
        code_verifier: 'test-verifier-456',
        code_challenge: 'test-challenge-789',
        code_challenge_method: 'S256',
        redirect_uri: 'https://app.example.com/callback',
        created_at: now,
        expires_at: future
      };
      
      mockDb.query.mockResolvedValueOnce([mockAuthData]);
      
      // Retrieve by state
      const retrievedData = await storage.getAuthDataByState('test-state-123');
      
      // Verify query was called correctly
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM pkce_sessions_.+ WHERE id = \? AND expires_at > \?/i),
        ['test-state-123', expect.any(Number)]
      );
      
      // Verify data was mapped correctly
      expect(retrievedData).toEqual({
        state: 'test-state-123',
        codeVerifier: 'test-verifier-456',
        codeChallenge: 'test-challenge-789',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: now
      });
    });

    it('should return null when getting by non-existent state', async () => {
      // Mock the database to return an empty result
      mockDb.query.mockResolvedValueOnce([]);
      
      // Try to retrieve with a state that doesn't exist
      const retrievedData = await storage.getAuthDataByState('non-existent-state');
      
      // Should return null
      expect(retrievedData).toBeNull();
    });

    it('should return null for expired sessions', async () => {
      // Mock the database to return an empty result (simulating expired session filtered by query)
      mockDb.query.mockResolvedValueOnce([]);
      
      // Try to retrieve an expired session
      const retrievedData = await storage.getAuthDataByState('expired-state');
      
      // Should return null
      expect(retrievedData).toBeNull();
      
      // Verify query includes expiration check
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM pkce_sessions_.+ WHERE id = \? AND expires_at > \?/i),
        ['expired-state', expect.any(Number)]
      );
    });
  });

  describe('removeAuthDataByState', () => {
    it('should remove auth data by state', async () => {
      // Mock successful deletion (1 row affected)
      mockDb.exec.mockResolvedValueOnce(1);
      
      // Remove by state
      const removeResult = await storage.removeAuthDataByState('test-state-remove');
      
      // Verify exec was called correctly
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/DELETE FROM pkce_sessions_.+ WHERE id = \?/i),
        ['test-state-remove']
      );
      
      // Remove should return true (found and removed)
      expect(removeResult).toBe(true);
    });

    it('should return false when removing non-existent state', async () => {
      // We need to clear all existing mock resolves to avoid carrying over other test data
      mockDb.exec.mockReset();
      
      // Mock unsuccessful deletion (0 rows affected)
      mockDb.exec.mockResolvedValue(0);
      
      // Try to remove a state that doesn't exist
      const removeResult = await storage.removeAuthDataByState('non-existent-state');
      
      // Should return false (not found)
      expect(removeResult).toBe(false);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', async () => {
      // Mock successful deletion (2 rows affected)
      mockDb.exec.mockResolvedValueOnce(2);
      
      // Run cleanup
      await storage.cleanupExpiredSessions();
      
      // Verify exec was called with the correct SQL
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/DELETE FROM pkce_sessions_.+ WHERE expires_at < \?/i),
        [expect.any(Number)]
      );
    });

    it('should use custom maxAgeMs parameter', async () => {
      // Reset mocks
      mockDb.exec.mockReset();
      
      // Set a fixed time for testing to make the test deterministic
      const fixedTimestamp = 1747534753630; // Use a fixed timestamp to avoid clock drift
      jest.spyOn(Date, 'now').mockImplementation(() => fixedTimestamp);
      
      // Mock successful deletion
      mockDb.exec.mockResolvedValueOnce(undefined); // For CREATE TABLE
      mockDb.exec.mockResolvedValueOnce(1); // For DELETE
      
      // Run cleanup with custom 1 minute expiration
      const customMaxAgeMs = 1 * 60 * 1000;
      await storage.cleanupExpiredSessions(customMaxAgeMs);
      
      // Calculate expected expiration timestamp used in the query
      const expectedExpirationTimestamp = fixedTimestamp - customMaxAgeMs;
      
      // Since exec is called twice (CREATE TABLE and DELETE), 
      // we need to test the second call
      expect(mockDb.exec.mock.calls[1][0]).toMatch(/DELETE FROM pkce_sessions_.+ WHERE expires_at < \?/i);
      expect(mockDb.exec.mock.calls[1][1]).toEqual([expectedExpirationTimestamp]);
      
      // Restore Date.now
      jest.restoreAllMocks();
    });
  });

  describe('integration with environment service', () => {
    it('should use separate table for each environment', async () => {
      // Create storage instances for different environments
      const productionStorage = new DatabasePkceStorage(Environment.PRODUCTION);
      const stagingStorage = new DatabasePkceStorage(Environment.STAGING);
      const developmentStorage = new DatabasePkceStorage(Environment.DEVELOPMENT);
      const localStorage = new DatabasePkceStorage(Environment.LOCAL);
      
      // Initialize each storage
      await productionStorage.initializeStorage();
      await stagingStorage.initializeStorage();
      await developmentStorage.initializeStorage();
      await localStorage.initializeStorage();
      
      // Verify each environment uses its own table
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS pkce_sessions_production/i),
        []
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS pkce_sessions_staging/i),
        []
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS pkce_sessions_development/i),
        []
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS pkce_sessions_local/i),
        []
      );
    });
  });
});