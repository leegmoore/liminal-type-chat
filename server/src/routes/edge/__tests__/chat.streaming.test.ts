/**
 * Tests for chat route streaming functionality
 * These tests focus on the GET /completions/stream endpoint
 */
import express, { Response } from 'express';
import { createChatSubRouter } from '../chat';
import { IJwtService } from '../../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../../providers/db/users/IUserRepository';
import { _ChatService } from '../../../services/core/ChatService';
import { _LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
import { LlmServiceError, _LlmErrorCode } from '../../../providers/llm/ILlmService';
import * as streamHelper from '../stream-helper';

// Define proper types for Express router internals
interface RouteLayer {
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

// Mock chat service
const mockChatService = {
  getAvailableModels: jest.fn(),
  completeChatPrompt: jest.fn(),
  streamChatCompletion: jest.fn()
};

// Mock Stream Helper functions
jest.mock('../stream-helper', () => ({
  setupSseHeaders: jest.fn(),
  sendSseData: jest.fn(),
  sendSseError: jest.fn()
}));

// Mock LlmServiceFactory
jest.mock('../../../providers/llm/LlmServiceFactory', () => ({
  LlmServiceFactory: {
    getSupportedProviders: jest.fn().mockReturnValue(['openai', 'anthropic']),
    getDefaultModel: jest.fn().mockReturnValue('gpt-3.5-turbo')
  }
}));

describe('Chat Streaming Routes', () => {
  let app: express.Application;
  let mockRes: Response;
  
  // Sample user data for authentication
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';
  const mockUserName = 'Test User';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock response object
    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn()
    } as unknown as Response;
    
    // Setup app with chat routes
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
    
    // Set up chat service in app.locals
    app.locals.services = {
      chatService: mockChatService
    };
    
    // Add routes to app
    app.use('/chat', createChatSubRouter(mockJwtService, mockUserRepository));
    
    // Add error handler
    app.use((err: Error, _req: express.Request, res: Response, _next: express.NextFunction) => {
      // Handle LlmServiceError differently, as we check for this in the chat routes
      if (err instanceof LlmServiceError) {
        return res.status(400).json({ error: err.message });
      }
      
      // Handle errors with status code
      const statusCode = err.status || err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    });
  });
  
  describe('GET /chat/completions/stream', () => {
    // We need to mock the Express Request object to test streaming
    const createMockRequest = (query = {}) => {
      return {
        query,
        user: {
          userId: mockUserId,
          email: mockUserEmail,
          name: mockUserName
        },
        app: {
          locals: {
            services: {
              chatService: mockChatService
            }
          }
        },
        on: jest.fn(),
        params: {}
      };
    };
    
    it('should setup SSE headers and stream chunks', async () => {
      // Arrange
      const mockReq = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      });
      
      // Set up stream completion implementation
      mockChatService.streamChatCompletion.mockImplementation(async (_userId, _request, callback) => {
        // Simulate chunks
        callback({
          threadId: 'thread-123',
          messageId: 'msg-456',
          content: 'Hello, ',
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          done: false
        });
        
        callback({
          threadId: 'thread-123',
          messageId: 'msg-456',
          content: 'human!',
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          finishReason: 'stop',
          done: true
        });
      });
      
      // Get the handler for testing
      const router = createChatSubRouter(mockJwtService, mockUserRepository);
      const handlers = (router as express.Router & { stack: RouteLayer[] }).stack.filter((layer: RouteLayer) => 
        layer.route && layer.route.path === '/completions/stream'
      );
      const streamHandler = handlers[0].route.stack[0].handle;
      
      // Act
      await streamHandler(mockReq, mockRes, jest.fn());
      
      // Assert
      expect(streamHelper.setupSseHeaders).toHaveBeenCalledWith(mockRes);
      expect(mockReq.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockChatService.streamChatCompletion).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          prompt: 'Hello, bot!',
          provider: 'openai',
          modelId: 'gpt-3.5-turbo',
          threadId: 'thread-123'
        }),
        expect.any(Function)
      );
      expect(streamHelper.sendSseData).toHaveBeenCalledTimes(2);
      expect(mockRes.end).toHaveBeenCalled();
    });
    
    it('should handle stream errors', async () => {
      // Arrange
      const mockReq = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      });
      
      // Set up stream completion to throw error
      const streamError = new Error('Stream processing error');
      mockChatService.streamChatCompletion.mockRejectedValue(streamError);
      
      // Get the handler for testing
      const router = createChatSubRouter(mockJwtService, mockUserRepository);
      const handlers = (router as express.Router & { stack: RouteLayer[] }).stack.filter((layer: RouteLayer) => 
        layer.route && layer.route.path === '/completions/stream'
      );
      const streamHandler = handlers[0].route.stack[0].handle;
      
      // Act
      await streamHandler(mockReq, mockRes, jest.fn());
      
      // Assert
      expect(streamHelper.setupSseHeaders).toHaveBeenCalledWith(mockRes);
      expect(streamHelper.sendSseError).toHaveBeenCalledWith(
        mockRes,
        'Stream processing error',
        'Stream processing error'
      );
      expect(mockRes.end).toHaveBeenCalled();
    });
    
    it('should handle client disconnect during streaming', async () => {
      // Arrange
      const mockReq = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      });
      
      // Set up stream completion to delay
      mockChatService.streamChatCompletion.mockImplementation(async (_userId, _request, _callback) => {
        // Simulate a long-running operation that will be interrupted
        // Will not call _callback
        return new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, 1000);
        });
      });
      
      // Get the handler for testing
      const router = createChatSubRouter(mockJwtService, mockUserRepository);
      const handlers = (router as express.Router & { stack: RouteLayer[] }).stack.filter((layer: RouteLayer) => 
        layer.route && layer.route.path === '/completions/stream'
      );
      const streamHandler = handlers[0].route.stack[0].handle;
      
      // Act - start the handler but don't await it
      const handlerPromise = streamHandler(mockReq, mockRes, jest.fn());
      
      // Simulate client disconnect by calling the close event handler
      const closeHandler = mockReq.on.mock.calls[0][1];
      closeHandler();
      
      // Wait for handler to complete
      await handlerPromise;
      
      // Assert
      expect(mockRes.end).toHaveBeenCalled();
    });
    
    it('should validate required parameters (prompt, provider, threadId)', async () => {
      // Get the handler for testing
      const router = createChatSubRouter(mockJwtService, mockUserRepository);
      const handlers = (router as express.Router & { stack: RouteLayer[] }).stack.filter((layer: RouteLayer) => 
        layer.route && layer.route.path === '/completions/stream'
      );
      const streamHandler = handlers[0].route.stack[0].handle;
      
      // 1. Test missing prompt
      const mockReq1 = createMockRequest({
        provider: 'openai',
        threadId: 'thread-123'
      });
      const mockRes1 = {
        ...mockRes,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as unknown as Response;
      
      await streamHandler(mockReq1, mockRes1, jest.fn());
      expect(mockRes1.status).toHaveBeenCalledWith(400);
      expect(mockRes1.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Prompt is required'
      }));
      
      // 2. Test missing provider
      const mockReq2 = createMockRequest({
        prompt: 'Hello, bot!',
        threadId: 'thread-123'
      });
      const mockRes2 = {
        ...mockRes,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as unknown as Response;
      
      await streamHandler(mockReq2, mockRes2, jest.fn());
      expect(mockRes2.status).toHaveBeenCalledWith(400);
      expect(mockRes2.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Provider is required'
      }));
      
      // 3. Test missing threadId
      const mockReq3 = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'openai'
      });
      const mockRes3 = {
        ...mockRes,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as unknown as Response;
      
      await streamHandler(mockReq3, mockRes3, jest.fn());
      expect(mockRes3.status).toHaveBeenCalledWith(400);
      expect(mockRes3.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Thread ID is required'
      }));
      
      // 4. Test unsupported provider
      const mockReq4 = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'unsupported',
        threadId: 'thread-123'
      });
      const mockRes4 = {
        ...mockRes,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as unknown as Response;
      
      await streamHandler(mockReq4, mockRes4, jest.fn());
      expect(mockRes4.status).toHaveBeenCalledWith(400);
      expect(mockRes4.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unsupported provider: unsupported'
      }));
      
      // All validations passed, no calls to streamChatCompletion yet
      expect(mockChatService.streamChatCompletion).not.toHaveBeenCalled();
    });
    
    it('should validate that chatService is available', async () => {
      // Arrange - create a request with missing chat service
      const mockReq = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'openai',
        threadId: 'thread-123'
      });
      mockReq.app.locals.services.chatService = null;
      
      // Get the handler for testing
      const router = createChatSubRouter(mockJwtService, mockUserRepository);
      const handlers = (router as express.Router & { stack: RouteLayer[] }).stack.filter((layer: RouteLayer) => 
        layer.route && layer.route.path === '/completions/stream'
      );
      const streamHandler = handlers[0].route.stack[0].handle;
      
      // Mock next function to capture error
      const mockNext = jest.fn();
      
      // Act
      await streamHandler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'ChatService not available on app.locals.services'
      }));
    });
    
    it('should validate user is authenticated', async () => {
      // Arrange - create a request with missing user
      const mockReq = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'openai',
        threadId: 'thread-123'
      });
      mockReq.user = null;
      
      // Get the handler for testing
      const router = createChatSubRouter(mockJwtService, mockUserRepository);
      const handlers = (router as express.Router & { stack: RouteLayer[] }).stack.filter((layer: RouteLayer) => 
        layer.route && layer.route.path === '/completions/stream'
      );
      const streamHandler = handlers[0].route.stack[0].handle;
      
      // Mock next function to capture error
      const mockNext = jest.fn();
      
      // Act
      await streamHandler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required: User ID not found.'
      }));
    });
  });
});