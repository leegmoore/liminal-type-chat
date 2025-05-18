/**
 * Tests for PKCE Storage with async operations
 * This ensures that the async interface works with both implementations
 */
import { IPkceStorage, PkceAuthData } from '../PkceStorage';
import { InMemoryPkceStorage } from '../PkceStorage';
import { DatabasePkceStorage } from '../DatabasePkceStorage';
import { Environment } from '../../../../services/core/EnvironmentService';
import { DatabaseProvider } from '../../../db/database-provider';

// Create a simple mock database for testing
function createMockDb(): jest.Mocked<DatabaseProvider> {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    exec: jest.fn().mockResolvedValue(1),
    transaction: jest.fn().mockImplementation((fn) => Promise.resolve(fn({
      query: jest.fn().mockReturnValue([]),
      exec: jest.fn().mockReturnValue(1)
    }))),
    close: jest.fn().mockResolvedValue(undefined),
    healthCheck: jest.fn().mockResolvedValue(true)
  } as jest.Mocked<DatabaseProvider>;
}

// Test cases for both implementations
const testCases = [
  {
    name: 'InMemoryPkceStorage',
    createStorage: () => new InMemoryPkceStorage()
  },
  {
    name: 'DatabasePkceStorage',
    createStorage: () => {
      const mockDb = createMockDb();
      const storage = new DatabasePkceStorage(Environment.DEVELOPMENT, { db: mockDb });
      // Mock successful database operations
      mockDb.query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT')) {
          // For getAuthDataByState, return a mock result
          if (params[0] === 'test-state-123') {
            return Promise.resolve([{
              id: 'test-state-123',
              code_verifier: 'test-verifier-456',
              code_challenge: 'test-challenge-789',
              code_challenge_method: 'S256',
              redirect_uri: 'https://app.example.com/callback',
              created_at: Date.now(),
              expires_at: Date.now() + 600000 // 10 minutes
            }]);
          }
        }
        return Promise.resolve([]);
      });
      
      return storage;
    }
  }
];

// Run the same test suite for both implementations
testCases.forEach(({ name, createStorage }) => {
  describe(`${name} with async interface`, () => {
    let storage: IPkceStorage;

    beforeEach(async () => {
      storage = createStorage();
      
      // Initialize database storage if needed
      if (storage instanceof DatabasePkceStorage) {
        await storage.initializeStorage();
      }
    });

    describe('createAuthSession', () => {
      it('should create a new PKCE auth session with default options', async () => {
        const redirectUri = 'https://app.example.com/callback';
        
        // Create session
        const authData = await Promise.resolve(storage.createAuthSession(redirectUri));
        
        // Verify that the session was created with expected properties
        expect(authData).toBeDefined();
        expect(authData.redirectUri).toBe(redirectUri);
        expect(authData.codeChallengeMethod).toBe('S256');
        expect(authData.state).toBeDefined();
        expect(authData.codeVerifier).toBeDefined();
        expect(authData.codeChallenge).toBeDefined();
        expect(authData.createdAt).toBeGreaterThan(0);
      });
    });

    describe('getAuthDataByState and storeAuthData', () => {
      it('should store and retrieve auth data', async () => {
        // Create test data
        const mockAuthData: PkceAuthData = {
          state: 'test-state-123',
          codeVerifier: 'test-verifier-456',
          codeChallenge: 'test-challenge-789',
          codeChallengeMethod: 'S256',
          redirectUri: 'https://app.example.com/callback',
          createdAt: Date.now()
        };
        
        // Store the auth data
        await Promise.resolve(storage.storeAuthData(mockAuthData));
        
        // Retrieve the data
        const retrievedData = await Promise.resolve(storage.getAuthDataByState('test-state-123'));
        
        // Check result based on implementation
        if (name === 'InMemoryPkceStorage') {
          // InMemoryPkceStorage returns the exact object
          expect(retrievedData).toEqual(mockAuthData);
        } else {
          // DatabasePkceStorage returns a value from the mocked database query
          expect(retrievedData).toBeTruthy();
          if (retrievedData) {
            expect(retrievedData.state).toBe('test-state-123');
            expect(retrievedData.codeVerifier).toBe('test-verifier-456');
          }
        }
      });
    });

    describe('removeAuthDataByState', () => {
      it('should return boolean indicating removal success', async () => {
        // Mocked removal should succeed for valid state
        const removed = await Promise.resolve(storage.removeAuthDataByState('test-state-123'));
        expect(typeof removed).toBe('boolean');
      });
    });

    describe('cleanupExpiredSessions', () => {
      it('should not throw when cleaning up expired sessions', async () => {
        // Just verify it doesn't throw
        await expect(
          Promise.resolve(storage.cleanupExpiredSessions())
        ).resolves.not.toThrow();
      });
    });
  });
});