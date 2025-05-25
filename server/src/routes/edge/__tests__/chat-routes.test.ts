/**
 * Tests for chat routes module
 */
import express from 'express';
import request from 'supertest';
import { createChatRoutes, createChatService } from '../chat-routes';
// Phase 1: Auth removed
// import { IJwtService } from '../../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../../providers/db/users/IUserRepository';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../../../services/core/ContextThreadService';

// Mock dependencies
// Phase 1: Auth removed - no JWT service needed

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

// Mock LlmApiKeyManager
const mockLlmApiKeyManager: jest.Mocked<LlmApiKeyManager> = {
  hasApiKey: jest.fn(),
  getApiKey: jest.fn(),
  storeApiKey: jest.fn(),
  deleteApiKey: jest.fn()
} as unknown as jest.Mocked<LlmApiKeyManager>;

// Mock ContextThreadService
const mockContextThreadService: jest.Mocked<ContextThreadService> = {
  createThread: jest.fn(),
  getThread: jest.fn(),
  listThreads: jest.fn(),
  updateThread: jest.fn(),
  deleteThread: jest.fn(),
  addMessage: jest.fn(),
  updateMessage: jest.fn()
} as unknown as jest.Mocked<ContextThreadService>;

// Mock createChatSubRouter function
jest.mock('../chat', () => ({
  createChatSubRouter: jest.fn().mockImplementation(() => {
    const router = express.Router();
    router.get('/test', (_req, res) => {
      res.json({ test: 'success' });
    });
    return router;
  })
}));

describe('Chat Routes', () => {
  let app: express.Application;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup app with chat routes
    app = express();
    app.use(express.json());
    
    // Add routes to app
    // Phase 1: Auth removed - passing undefined for jwtService
    app.use(createChatRoutes(undefined, mockUserRepository));
  });
  
  describe('createChatRoutes', () => {
    it('should mount chat sub-router correctly at /api/v1/chat', async () => {
      // Act
      const response = await request(app).get('/api/v1/chat/test');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ test: 'success' });
    });
  });
  
  describe('createChatService', () => {
    it('should create a new ChatService with the provided dependencies', () => {
      // Act
      const chatService = createChatService(mockLlmApiKeyManager, mockContextThreadService);
      
      // Assert - Check that the service has been created with the expected properties
      expect(chatService).toBeDefined();
      // We can't easily test private properties, but we can test that it's an instance of the class
      expect(chatService.constructor.name).toBe('ChatService');
    });
    
    it('should make ChatService with working methods', async () => {
      // Arrange
      const chatService = createChatService(mockLlmApiKeyManager, mockContextThreadService);
      
      // Set up mocks
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      // Act & Assert - We expect this to throw since hasApiKey returns false
      await expect(chatService.getAvailableModels('user-123', 'openai'))
        .rejects.toThrow('API key for OpenAI is required');
    });
  });
});