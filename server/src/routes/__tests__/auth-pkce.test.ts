/**
 * Tests for authentication routes with PKCE support
 */
import express, { Express } from 'express';
import request from 'supertest';
import { createAuthRoutes } from '../edge/auth';
import { IOAuthProvider } from '../../providers/auth/IOAuthProvider';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { pkceStorage } from '../../providers/auth/pkce/PkceStorage';
import { User } from '../../models/domain/users/User';

// Mock dependencies
const mockUserRepository: jest.Mocked<IUserRepository> = {
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserByOAuth: jest.fn(),
  findOrCreateUserByOAuth: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<IUserRepository>;

const mockJwtService: jest.Mocked<IJwtService> = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn()
} as unknown as jest.Mocked<IJwtService>;

const mockGitHubProvider: jest.Mocked<IOAuthProvider> = {
  providerType: 'github',
  supportsPkce: true,
  getAuthorizationUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  validateAccessToken: jest.fn(),
  revokeToken: jest.fn()
} as unknown as jest.Mocked<IOAuthProvider>;

describe('Auth Routes with PKCE', () => {
  let app: Express;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Create OAuth providers map
    const oauthProviders = new Map<string, IOAuthProvider>();
    oauthProviders.set('github', mockGitHubProvider);
    
    // Add auth routes
    app.use('/auth', createAuthRoutes(
      mockUserRepository,
      mockJwtService,
      oauthProviders
    ));
    
    // Mock user data
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      authProviders: {
        github: {
          providerId: 'github-123',
          identity: 'test-user',
          refreshToken: 'github-refresh-token',
          createdAt: Date.now()
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Setup repository mock
    mockUserRepository.findOrCreateUserByOAuth.mockResolvedValue(mockUser);
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    
    // Setup JWT mock
    mockJwtService.generateToken.mockReturnValue('mock-jwt-token');
    mockJwtService.decodeToken.mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      scopes: ['read:profile'],
      tier: 'edge'
    });
    
    // Setup OAuth provider mock
    mockGitHubProvider.getAuthorizationUrl.mockReturnValue('https://github.com/login/oauth/authorize?mock-params');
    mockGitHubProvider.exchangeCodeForToken.mockResolvedValue({
      providerId: 'github-123',
      email: 'test@example.com',
      displayName: 'Test User',
      identity: 'test-user',
      accessToken: 'github-access-token',
      updatedAt: Date.now()
    });
  });
  
  describe('POST /auth/oauth/:provider/authorize', () => {
    it('should enable PKCE by default for supporting providers', async () => {
      // Send authorize request with PKCE enabled by default
      const res = await request(app)
        .post('/auth/oauth/github/authorize')
        .send({ redirectUri: 'https://app.example.com/callback' });
      
      // Response should be successful
      expect(res.status).toBe(200);
      expect(res.body.authUrl).toBeDefined();
      expect(res.body.state).toBeDefined();
      expect(res.body.pkceEnabled).toBe(true);
      
      // Verify auth data was stored with PKCE
      const authData = pkceStorage.getAuthDataByState(res.body.state);
      expect(authData).toBeDefined();
      expect(authData?.codeVerifier.length).toBeGreaterThan(43);
      expect(authData?.codeChallenge.length).toBeGreaterThan(0);
      expect(authData?.codeChallengeMethod).toBe('S256');
      
      // Provider was called with PKCE parameters
      expect(mockGitHubProvider.getAuthorizationUrl).toHaveBeenCalledWith(
        'https://app.example.com/callback',
        expect.any(String),
        undefined,
        expect.objectContaining({
          codeChallenge: expect.any(String),
          codeChallengeMethod: 'S256'
        })
      );
    });
    
    it('should disable PKCE when explicitly requested', async () => {
      // Send authorize request with PKCE disabled
      const res = await request(app)
        .post('/auth/oauth/github/authorize')
        .send({ 
          redirectUri: 'https://app.example.com/callback',
          usePkce: false
        });
      
      // Response should be successful
      expect(res.status).toBe(200);
      expect(res.body.authUrl).toBeDefined();
      expect(res.body.state).toBeDefined();
      expect(res.body.pkceEnabled).toBe(false);
      
      // Verify basic auth data was stored (without PKCE)
      const authData = pkceStorage.getAuthDataByState(res.body.state);
      expect(authData).toBeDefined();
      expect(authData?.codeVerifier).toBe('');
      expect(authData?.codeChallenge).toBe('');
      
      // Provider was called without PKCE parameters
      expect(mockGitHubProvider.getAuthorizationUrl).toHaveBeenCalledWith(
        'https://app.example.com/callback',
        expect.any(String)
      );
    });
    
    it('should return 400 if redirectUri is missing', async () => {
      // Add error handler middleware to express app for tests
      app.use((err: Error & { statusCode?: number }, _req: express.Request, 
        res: express.Response, _next: express.NextFunction) => {
        res.status('statusCode' in err ? err.statusCode as number : 400)
          .json({ error: err.message });
      });
      
      // Send authorize request without redirectUri
      const res = await request(app)
        .post('/auth/oauth/github/authorize')
        .send({ usePkce: true });
      
      // Response should be 400 Bad Request
      expect(res.status).toBe(400);
      
      // Provider should not be called
      expect(mockGitHubProvider.getAuthorizationUrl).not.toHaveBeenCalled();
    });
    
    it('should return 400 for unsupported providers', async () => {
      // Send authorize request for non-existent provider
      const res = await request(app)
        .post('/auth/oauth/nonexistent/authorize')
        .send({ 
          redirectUri: 'https://app.example.com/callback', 
          usePkce: true 
        });
      
      // Response should be 400 Bad Request
      expect(res.status).toBe(400);
      
      // Provider should not be called
      expect(mockGitHubProvider.getAuthorizationUrl).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/oauth/:provider/token', () => {
    it('should exchange code for token with PKCE verification', async () => {
      // Store mock PKCE auth data
      const mockAuthData = {
        state: 'test-state-123',
        codeVerifier: 'test-code-verifier',
        codeChallenge: 'test-code-challenge',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: Date.now()
      };
      pkceStorage.storeAuthData(mockAuthData);
      
      // Send token request with PKCE state
      const res = await request(app)
        .post('/auth/oauth/github/token')
        .send({
          code: 'test-auth-code',
          redirectUri: 'https://app.example.com/callback',
          state: 'test-state-123'
        });
      
      // Response should be successful
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('mock-jwt-token');
      expect(res.body.user).toBeDefined();
      
      // Provider was called with code verifier for PKCE
      expect(mockGitHubProvider.exchangeCodeForToken).toHaveBeenCalledWith(
        'test-auth-code',
        'https://app.example.com/callback',
        'test-code-verifier'
      );
      
      // Auth data should be cleaned up
      expect(pkceStorage.getAuthDataByState('test-state-123')).toBeNull();
    });
    
    it('should exchange code without PKCE if no code verifier stored', async () => {
      // Store mock auth data without PKCE
      const mockAuthData = {
        state: 'test-state-no-pkce',
        codeVerifier: '',
        codeChallenge: '',
        codeChallengeMethod: 'plain',
        redirectUri: 'https://app.example.com/callback',
        createdAt: Date.now()
      };
      pkceStorage.storeAuthData(mockAuthData);
      
      // Send token request
      const res = await request(app)
        .post('/auth/oauth/github/token')
        .send({
          code: 'test-auth-code',
          redirectUri: 'https://app.example.com/callback',
          state: 'test-state-no-pkce'
        });
      
      // Response should be successful
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('mock-jwt-token');
      
      // Provider was called without code verifier
      expect(mockGitHubProvider.exchangeCodeForToken).toHaveBeenCalledWith(
        'test-auth-code',
        'https://app.example.com/callback'
      );
    });
    
    it('should return 401 if state is invalid', async () => {
      // Send token request with invalid state
      const res = await request(app)
        .post('/auth/oauth/github/token')
        .send({
          code: 'test-auth-code',
          redirectUri: 'https://app.example.com/callback',
          state: 'invalid-state-does-not-exist'
        });
      
      // Response should be 401 Unauthorized
      expect(res.status).toBe(401);
      
      // Provider should not be called
      expect(mockGitHubProvider.exchangeCodeForToken).not.toHaveBeenCalled();
    });
    
    it('should return 401 if redirectUri doesn\'t match', async () => {
      // Store mock PKCE auth data
      const mockAuthData = {
        state: 'test-state-redirect-mismatch',
        codeVerifier: 'test-code-verifier',
        codeChallenge: 'test-code-challenge',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/original-callback',
        createdAt: Date.now()
      };
      pkceStorage.storeAuthData(mockAuthData);
      
      // Send token request with different redirectUri
      const res = await request(app)
        .post('/auth/oauth/github/token')
        .send({
          code: 'test-auth-code',
          redirectUri: 'https://app.example.com/different-callback',
          state: 'test-state-redirect-mismatch'
        });
      
      // Response should be 401 Unauthorized
      expect(res.status).toBe(401);
      
      // Provider should not be called
      expect(mockGitHubProvider.exchangeCodeForToken).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/maintenance/cleanup-sessions', () => {
    it('should clean up expired sessions', async () => {
      // Store mock auth data with expired timestamp
      const pastTime = Date.now() - (15 * 60 * 1000); // 15 minutes ago
      const mockExpiredAuthData = {
        state: 'test-expired-state',
        codeVerifier: 'test-code-verifier',
        codeChallenge: 'test-code-challenge',
        codeChallengeMethod: 'S256',
        redirectUri: 'https://app.example.com/callback',
        createdAt: pastTime
      };
      pkceStorage.storeAuthData(mockExpiredAuthData);
      
      // Execute cleanup
      const res = await request(app)
        .post('/auth/maintenance/cleanup-sessions')
        .send({});
      
      // Response should be successful
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify expired session was removed
      expect(pkceStorage.getAuthDataByState('test-expired-state')).toBeNull();
    });
  });
});