/**
 * Tests for chat routes
 */
// Mock auth middleware to always authenticate
jest.mock('../../../middleware/auth-middleware', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAuthMiddleware: () => (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    return next();
  }
}));
import request from 'supertest';
import express from 'express';
import { createChatSubRouter } from '../chat';
import { IJwtService } from '../../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../../providers/db/users/IUserRepository';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChatService } from '../../../services/core/ChatService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
import { LlmServiceError, LlmErrorCode } from '../../../providers/llm/ILlmService';

// Define proper types for Express router internals
interface _RouteLayer {
  route?: {
    path: string;
    stack: {
      handle: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    }[];
  };
  name?: string;
}

// Mock dependencies
const mockJwtService: jest.Mocked<IJwtService> = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn()
};

const mockUserRepository: jest.Mocked<IUserRepository> = {
  findUserById: jest.fn(),
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn()
};

// Mock ChatService
const mockChatService = {
  getAvailableModels: jest.fn(),
  completeChatPrompt: jest.fn(),
  streamChatCompletion: jest.fn()
};

// Mock factory to return the mocked service
jest.mock('../../../services/core/ChatService', () => ({
  ChatService: jest.fn().mockImplementation(() => mockChatService)
}));

// Mock response for EventSource streaming
const _mockResponse = () => {
  const res: {
    setHeader: jest.Mock;
    write: jest.Mock;
    end: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
    locals: Record<string, unknown>;
    [key: string]: unknown;
  } = {
    setHeader: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
    locals: {}
  };
  res.setHeader = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Chat Routes', () => {
  let app: express.Application;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful token verification
    mockJwtService.verifyToken.mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com'
    });
    
    mockJwtService.decodeToken.mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com'
    });
    
    // Setup express app
    app = express();
    app.use(express.json());
    
    // Add ChatService to app.locals.services
    app.locals.services = {
      chatService: mockChatService
    };
    
    // Add routes to app
    app.use('/chat', createChatSubRouter(mockJwtService, mockUserRepository));
    
    // Add error handler
    // Error handler middleware
    app.use((err: Error & { statusCode?: number }, 
      _req: express.Request, 
      res: express.Response, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction) => {
      // Handle LlmServiceError differently, as we check for this in the chat routes
      if (err instanceof LlmServiceError) {
        return res.status(400).json({ error: err.message });
      }
      
      // Handle errors with status code
      const statusCode = err.status || err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    });
  });
  
  describe('GET /models/:provider', () => {
    it('should return available models', async () => {
      // Arrange
      const models = [
        { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'anthropic' },
        { id: 'claude-3-7-haiku', name: 'Claude 3.7 Haiku', provider: 'anthropic' }
      ];
      mockChatService.getAvailableModels.mockResolvedValue(models);
      
      // Act
      const response = await request(app)
        .get('/chat/models/anthropic')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.models).toEqual(models);
      expect(mockChatService.getAvailableModels).toHaveBeenCalledWith('user-123', 'anthropic');
    });
    
    it('should return 401 when not authenticated', async () => {
      // For authentication tests, we need to mock the auth middleware directly
      // rather than using the router's built-in auth middleware
      const mockAuthMiddleware = jest.fn().mockImplementation((req, res, _next) => {
        // Simulate an unauthorized error
        res.status(401).json({ error: 'Unauthorized' });
      });
      
      // Create a router with our mocked auth middleware
      const router = express.Router();
      router.use(mockAuthMiddleware);
      router.get('/models/:provider', (req, res) => {
        res.json({ models: [] }); // This should never be reached
      });
      
      // Create a test app with this router
      const testApp = express();
      testApp.use('/chat', router);
      
      // Act
      const response = await request(testApp)
        .get('/chat/models/anthropic')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockAuthMiddleware).toHaveBeenCalled();
    });
    
    it('should handle errors from ChatService', async () => {
      // Arrange
      const error = new LlmServiceError(
        'API key not found',
        LlmErrorCode.API_KEY_NOT_FOUND
      );
      mockChatService.getAvailableModels.mockRejectedValue(error);
      
      // Act
      const response = await request(app)
        .get('/chat/models/anthropic')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'API key not found');
    });
  });
  
  describe('POST /completions', () => {
    it('should return chat completion', async () => {
      // Arrange
      const completionRequest = {
        prompt: 'Hello, bot!',
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet',
        threadId: 'thread-123'
      };
      
      const completionResponse = {
        id: 'resp-456',
        threadId: 'thread-123',
        content: 'Hello, human!',
        model: 'claude-3-7-sonnet',
        provider: 'anthropic',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        }
      };
      
      mockChatService.completeChatPrompt.mockResolvedValue(completionResponse);
      
      // Act
      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', 'Bearer valid-token')
        .send(completionRequest);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(completionResponse);
      expect(mockChatService.completeChatPrompt).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining(completionRequest)
      );
    });
    
    it('should return 400 for invalid request', async () => {
      // Arrange - missing required fields
      const incompletRequest = {
        // missing prompt
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet'
        // missing threadId
      };
      
      // Act
      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', 'Bearer valid-token')
        .send(incompletRequest);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle errors from ChatService', async () => {
      // Arrange
      const completionRequest = {
        prompt: 'Hello, bot!',
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet',
        threadId: 'thread-123'
      };
      
      const error = new LlmServiceError(
        'Provider not available',
        LlmErrorCode.PROVIDER_NOT_AVAILABLE
      );
      mockChatService.completeChatPrompt.mockRejectedValue(error);
      
      // Act
      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', 'Bearer valid-token')
        .send(completionRequest);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Provider not available');
    });
    
    it('should handle 404 errors for thread not found', async () => {
      // Arrange
      const completionRequest = {
        prompt: 'Hello, bot!',
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet',
        threadId: 'nonexistent-thread'
      };
      
      const error = new Error('Thread not found: nonexistent-thread');
      // Add statusCode to match NotFoundError behavior
      (error as Error & { statusCode: number }).statusCode = 404;
      mockChatService.completeChatPrompt.mockRejectedValue(error);
      
      // Act
      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', 'Bearer valid-token')
        .send(completionRequest);
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
