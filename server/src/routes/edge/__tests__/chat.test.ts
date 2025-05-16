/**
 * Tests for chat routes
 */
import request from 'supertest';
import express from 'express';
import { createChatSubRouter } from '../chat';
import { IJwtService } from '../../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../../providers/db/users/IUserRepository';
import { _ChatService } from '../../../services/core/ChatService';
import { _LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
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
    
    // Add routes to app
    app.use('/chat', createChatSubRouter(mockJwtService, mockUserRepository));
    
    // Add error handler
    // Error handler middleware
    app.use((err: Error & { statusCode?: number }, 
      _req: express.Request, 
      res: express.Response, 
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
  
  describe('GET /chat/models', () => {
    it('should return available models', async () => {
      // Arrange
      const models = [
        { id: 'model1', name: 'Model 1', provider: 'openai' },
        { id: 'model2', name: 'Model 2', provider: 'openai' }
      ];
      mockChatService.getAvailableModels.mockResolvedValue(models);
      
      // Act
      const response = await request(app)
        .get('/chat/models')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.models).toEqual(models);
      expect(mockChatService.getAvailableModels).toHaveBeenCalledWith('user-123');
    });
    
    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockJwtService.verifyToken.mockImplementation(() => {
        // Throw an UnauthorizedError to match the actual implementation
        const error = new Error('Invalid token') as Error & { code: string };
        error.status = 401;
        error.code = 4010;
        error.errorCode = 'auth.unauthorized';
        throw error;
      });
      
      // Act
      const response = await request(app)
        .get('/chat/models')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assert
      expect(response.status).toBe(401);
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
        .get('/chat/models')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'API key not found');
    });
  });
  
  describe('POST /chat/completions', () => {
    it('should return chat completion', async () => {
      // Arrange
      const completionRequest = {
        prompt: 'Hello, bot!',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      };
      
      const completionResponse = {
        id: 'resp-456',
        threadId: 'thread-123',
        content: 'Hello, human!',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
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
        provider: 'openai',
        modelId: 'gpt-3.5-turbo'
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
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
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
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
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