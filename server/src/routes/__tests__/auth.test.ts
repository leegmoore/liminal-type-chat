/**
 * Tests for authentication routes
 */
import request from 'supertest';
import express from 'express';
import { createAuthRoutes } from '../edge/auth';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IOAuthProvider, OAuthUserProfile } from '../../providers/auth/oauth/IOAuthProvider';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { User } from '../../models/domain/users/User';

// Mock dependencies
const mockJwtService: jest.Mocked<IJwtService> = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn()
};

const mockOAuthProvider: jest.Mocked<IOAuthProvider> = {
  providerType: 'github',
  getAuthorizationUrl: jest.fn(),
  exchangeCodeForToken: jest.fn()
};

const mockUserRepository: jest.Mocked<IUserRepository> = {
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserByOAuth: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  findOrCreateUserByOAuth: jest.fn(),
  storeApiKey: jest.fn(),
  getApiKey: jest.fn(),
  deleteApiKey: jest.fn()
};

describe('Auth Routes', () => {
  let app: express.Application;
  let oauthProviders: Map<string, IOAuthProvider>;
  
  // Sample test data
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    authProviders: {
      github: {
        id: 'github-user-123',
        token: 'github-token',
        scopes: ['user:email'],
        profileImageUrl: 'https://example.com/avatar.png'
      }
    },
    apiKeys: {}
  };
  
  const mockToken = 'jwt-token-123';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup app with auth routes
    app = express();
    app.use(express.json());
    
    // Setup OAuth providers map
    oauthProviders = new Map();
    oauthProviders.set('github', mockOAuthProvider);
    
    // Setup mock responses
    mockJwtService.generateToken.mockReturnValue(mockToken);
    mockUserRepository.findOrCreateUserByOAuth.mockResolvedValue(mockUser);
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    
    // Add routes to app
    app.use('/auth', createAuthRoutes(mockUserRepository, mockJwtService, oauthProviders));
    
    // Add error handler
    app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json(err.toJSON ? err.toJSON() : { error: err.message });
    });
  });
  
  describe('POST /auth/oauth/:provider/authorize', () => {
    it('should return authorization URL for supported provider', async () => {
      // Arrange
      const authUrl = 'https://github.com/login/oauth/authorize?client_id=123&redirect_uri=http://localhost:3000/callback';
      mockOAuthProvider.getAuthorizationUrl.mockResolvedValue(authUrl);
      
      // Act
      const response = await request(app)
        .post('/auth/oauth/github/authorize')
        .send({ redirectUri: 'http://localhost:3000/callback' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl', authUrl);
      expect(response.body).toHaveProperty('state');
      expect(mockOAuthProvider.getAuthorizationUrl).toHaveBeenCalledWith(
        'http://localhost:3000/callback',
        expect.any(String)
      );
    });
    
    it('should return 400 when redirectUri is missing', async () => {
      // Act
      const response = await request(app)
        .post('/auth/oauth/github/authorize')
        .send({});
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Missing required field');
      expect(mockOAuthProvider.getAuthorizationUrl).not.toHaveBeenCalled();
    });
    
    it('should return 400 for unsupported provider', async () => {
      // Act
      const response = await request(app)
        .post('/auth/oauth/unsupported/authorize')
        .send({ redirectUri: 'http://localhost:3000/callback' });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Unsupported provider: unsupported');
      expect(mockOAuthProvider.getAuthorizationUrl).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/oauth/:provider/token', () => {
    it('should exchange code for token and return user and JWT', async () => {
      // Arrange
      const oauthProfile: OAuthUserProfile = {
        id: 'github-user-123',
        name: 'Test User',
        email: 'test@example.com',
        accessToken: 'github-access-token',
        scopes: ['user:email'],
        profileImageUrl: 'https://example.com/avatar.png'
      };
      
      mockOAuthProvider.exchangeCodeForToken.mockResolvedValue(oauthProfile);
      
      // Act
      const response = await request(app)
        .post('/auth/oauth/github/token')
        .send({
          code: 'oauth-code',
          redirectUri: 'http://localhost:3000/callback',
          state: 'state-123'
        });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', mockToken);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', mockUser.id);
      expect(response.body.user).toHaveProperty('email', mockUser.email);
      
      expect(mockOAuthProvider.exchangeCodeForToken).toHaveBeenCalledWith(
        'oauth-code',
        'http://localhost:3000/callback'
      );
      
      expect(mockUserRepository.findOrCreateUserByOAuth).toHaveBeenCalledWith(
        'github',
        'github-user-123',
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User'
        })
      );
      
      expect(mockJwtService.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.displayName,
        scopes: ['read:profile', 'read:conversations', 'write:conversations'],
        tier: 'edge'
      });
    });
    
    it('should return 400 when code or redirectUri is missing', async () => {
      // Act
      const response = await request(app)
        .post('/auth/oauth/github/token')
        .send({
          state: 'state-123'
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Missing required fields');
      expect(mockOAuthProvider.exchangeCodeForToken).not.toHaveBeenCalled();
    });
    
    it('should return 400 for unsupported provider', async () => {
      // Act
      const response = await request(app)
        .post('/auth/oauth/unsupported/token')
        .send({
          code: 'oauth-code',
          redirectUri: 'http://localhost:3000/callback',
          state: 'state-123'
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Unsupported provider: unsupported');
      expect(mockOAuthProvider.exchangeCodeForToken).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/token/refresh', () => {
    it('should refresh token for valid user', async () => {
      // Arrange
      mockJwtService.decodeToken.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.displayName,
        scopes: ['read:profile'],
        tier: 'edge',
        tokenId: 'token-id',
        issuedAt: new Date(),
        expiresAt: new Date()
      });
      
      // Act
      const response = await request(app)
        .post('/auth/token/refresh')
        .send({ token: 'expired-token' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', mockToken);
      
      expect(mockJwtService.decodeToken).toHaveBeenCalledWith('expired-token');
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(mockJwtService.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.displayName,
        scopes: ['read:profile'],
        tier: 'edge'
      });
    });
    
    it('should return 400 when token is missing', async () => {
      // Act
      const response = await request(app)
        .post('/auth/token/refresh')
        .send({});
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Missing required field');
      expect(mockJwtService.decodeToken).not.toHaveBeenCalled();
    });
    
    it('should return 401 when token is invalid', async () => {
      // Arrange
      mockJwtService.decodeToken.mockReturnValue(null);
      
      // Act
      const response = await request(app)
        .post('/auth/token/refresh')
        .send({ token: 'invalid-token' });
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('message', 'Invalid token format');
      expect(mockUserRepository.getUserById).not.toHaveBeenCalled();
    });
    
    it('should return 401 when user does not exist', async () => {
      // Arrange
      mockJwtService.decodeToken.mockReturnValue({
        userId: 'non-existent-user',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge',
        tokenId: 'token-id',
        issuedAt: new Date(),
        expiresAt: new Date()
      });
      
      mockUserRepository.getUserById.mockResolvedValue(null);
      
      // Act
      const response = await request(app)
        .post('/auth/token/refresh')
        .send({ token: 'expired-token' });
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('message', 'User not found');
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });
  });
});