/**
 * Tests for API key management routes
 */
import request from 'supertest';
import express from 'express';
import { createApiKeyRoutes } from '../edge/api-keys';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { ApiKeyInfo } from '../../models/domain/users/User';

// Mock dependencies
const mockJwtService: jest.Mocked<IJwtService> = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn()
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

describe('API Key Routes', () => {
  let app: express.Application;
  
  // Sample user data for authentication
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';
  const mockUserName = 'Test User';
  
  // Sample API key data
  const mockApiKey = 'sk-1234567890abcdef';
  const mockApiKeyInfo: ApiKeyInfo = {
    encryptedKey: 'encrypted-key',
    label: 'Development Key',
    createdAt: Date.now()
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup app with API key routes
    app = express();
    app.use(express.json());
    
    // Mock JWT verification for authenticated requests
    mockJwtService.verifyToken.mockReturnValue({
      userId: mockUserId,
      email: mockUserEmail,
      name: mockUserName,
      scopes: ['read:profile', 'write:profile'],
      tier: 'edge',
      tokenId: 'token-id',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 900000) // 15 minutes in the future
    });
    
    // Add routes to app
    app.use('/api-keys', createApiKeyRoutes(mockUserRepository, mockJwtService));
    
    // Add error handler
    app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json(err.toJSON ? err.toJSON() : { error: err.message });
    });
  });
  
  describe('POST /api-keys/:provider', () => {
    it('should store API key for supported provider', async () => {
      // Arrange
      mockUserRepository.storeApiKey.mockResolvedValue(true);
      
      // Act
      const response = await request(app)
        .post('/api-keys/openai')
        .set('Authorization', 'Bearer valid-token')
        .send({
          apiKey: mockApiKey,
          label: 'Development Key'
        });
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'API key stored successfully');
      expect(response.body).toHaveProperty('provider', 'openai');
      expect(response.body).toHaveProperty('hasKey', true);
      
      expect(mockUserRepository.storeApiKey).toHaveBeenCalledWith(
        mockUserId,
        'openai',
        mockApiKey,
        'Development Key'
      );
    });
    
    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockJwtService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      const response = await request(app)
        .post('/api-keys/openai')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          apiKey: mockApiKey,
          label: 'Development Key'
        });
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockUserRepository.storeApiKey).not.toHaveBeenCalled();
    });
    
    it('should return 400 when apiKey is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api-keys/openai')
        .set('Authorization', 'Bearer valid-token')
        .send({
          label: 'Development Key'
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Missing required field');
      expect(mockUserRepository.storeApiKey).not.toHaveBeenCalled();
    });
    
    it('should return 400 for unsupported provider', async () => {
      // Act
      const response = await request(app)
        .post('/api-keys/unsupported')
        .set('Authorization', 'Bearer valid-token')
        .send({
          apiKey: mockApiKey,
          label: 'Development Key'
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Unsupported provider: unsupported');
      expect(mockUserRepository.storeApiKey).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api-keys/:provider', () => {
    it('should return API key status when key exists', async () => {
      // Arrange
      mockUserRepository.getApiKey.mockResolvedValue(mockApiKeyInfo);
      
      // Act
      const response = await request(app)
        .get('/api-keys/openai')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('provider', 'openai');
      expect(response.body).toHaveProperty('hasKey', true);
      expect(response.body).toHaveProperty('label', mockApiKeyInfo.label);
      expect(response.body).toHaveProperty('createdAt', mockApiKeyInfo.createdAt);
      
      expect(mockUserRepository.getApiKey).toHaveBeenCalledWith(
        mockUserId,
        'openai'
      );
    });
    
    it('should return API key status when key does not exist', async () => {
      // Arrange
      mockUserRepository.getApiKey.mockResolvedValue(null);
      
      // Act
      const response = await request(app)
        .get('/api-keys/openai')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('provider', 'openai');
      expect(response.body).toHaveProperty('hasKey', false);
      expect(response.body).not.toHaveProperty('label');
      expect(response.body).not.toHaveProperty('createdAt');
    });
    
    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockJwtService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      const response = await request(app)
        .get('/api-keys/openai')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockUserRepository.getApiKey).not.toHaveBeenCalled();
    });
    
    it('should return 400 for unsupported provider', async () => {
      // Act
      const response = await request(app)
        .get('/api-keys/unsupported')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Unsupported provider: unsupported');
      expect(mockUserRepository.getApiKey).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api-keys/:provider', () => {
    it('should delete API key when it exists', async () => {
      // Arrange
      mockUserRepository.deleteApiKey.mockResolvedValue(true);
      
      // Act
      const response = await request(app)
        .delete('/api-keys/openai')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'API key deleted successfully');
      expect(response.body).toHaveProperty('provider', 'openai');
      expect(response.body).toHaveProperty('hasKey', false);
      
      expect(mockUserRepository.deleteApiKey).toHaveBeenCalledWith(
        mockUserId,
        'openai'
      );
    });
    
    it('should return 404 when API key does not exist', async () => {
      // Arrange
      mockUserRepository.deleteApiKey.mockResolvedValue(false);
      
      // Act
      const response = await request(app)
        .delete('/api-keys/openai')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'No API key found for this provider');
    });
    
    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockJwtService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      const response = await request(app)
        .delete('/api-keys/openai')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockUserRepository.deleteApiKey).not.toHaveBeenCalled();
    });
    
    it('should return 400 for unsupported provider', async () => {
      // Act
      const response = await request(app)
        .delete('/api-keys/unsupported')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('message', 'Unsupported provider: unsupported');
      expect(mockUserRepository.deleteApiKey).not.toHaveBeenCalled();
    });
  });
});