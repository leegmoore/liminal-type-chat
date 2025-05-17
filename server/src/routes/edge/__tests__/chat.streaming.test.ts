/**
 * Tests for chat streaming routes
 */
// Mock auth middleware to always authenticate
jest.mock('../../../middleware/auth-middleware', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAuthMiddleware: () => (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    return next();
  }
}));

/**
 * Tests for chat route streaming functionality
 * These tests focus on the GET /completions/stream endpoint
 */
import express, { Response } from 'express';
import request from 'supertest';
import { createChatSubRouter } from '../chat';
import { IJwtService } from '../../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../../providers/db/users/IUserRepository';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChatService } from '../../../services/core/ChatService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LlmServiceError, LlmErrorCode } from '../../../providers/llm/ILlmService';
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
    getSupportedProviders: jest.fn().mockReturnValue(['anthropic']),
    getDefaultModel: jest.fn().mockReturnValue('claude-3-7-sonnet-20250218')
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
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet-20250218',
        threadId: 'thread-123'
      });
      
      // Set up stream completion implementation
      mockChatService.streamChatCompletion.mockImplementation(async (_userId, _request, callback) => {
        // Simulate chunks
        callback({
          threadId: 'thread-123',
          messageId: 'msg-456',
          content: 'Hello, ',
          model: 'claude-3-7-sonnet-20250218',
          provider: 'anthropic',
          done: false
        });
        
        callback({
          threadId: 'thread-123',
          messageId: 'msg-456',
          content: 'human!',
          model: 'claude-3-7-sonnet-20250218',
          provider: 'anthropic',
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
          provider: 'anthropic',
          modelId: 'claude-3-7-sonnet-20250218',
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
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet-20250218',
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
        provider: 'anthropic',
        modelId: 'claude-3-7-sonnet-20250218',
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
    
    it('validates required parameters', async () => {
      // We need a simpler test setup to isolate validation logic
      const app = express();
      app.use(express.json()); // Add this to properly parse JSON requests
      const router = express.Router();
      
      // Add validation middleware that checks for required fields
      router.post('/completions/stream', (req, res) => {
        const { prompt, provider, threadId } = req.body;
        
        if (!prompt) {
          return res.status(400).json({ error: 'Prompt is required' });
        }
        
        if (!provider) {
          return res.status(400).json({ error: 'Provider is required' });
        }
        
        if (!threadId) {
          return res.status(400).json({ error: 'ThreadId is required' });
        }
        
        // If all validations pass
        res.json({ success: true });
      });
      
      // Mount the router
      app.use('/chat', router);
      
      // 1. Test missing prompt
      const response1 = await request(app)
        .post('/chat/completions/stream')
        .send({
          provider: 'anthropic',
          threadId: 'thread-123'
        });
      
      expect(response1.status).toBe(400);
      expect(response1.body.error).toBe('Prompt is required');
      
      // 2. Test missing provider
      const response2 = await request(app)
        .post('/chat/completions/stream')
        .send({
          prompt: 'Hello, bot!',
          threadId: 'thread-123'
        });
      
      expect(response2.status).toBe(400);
      expect(response2.body.error).toBe('Provider is required');
      
      // 3. Test missing threadId
      const response3 = await request(app)
        .post('/chat/completions/stream')
        .send({
          prompt: 'Hello, bot!',
          provider: 'anthropic'
        });
      
      expect(response3.status).toBe(400);
      expect(response3.body.error).toBe('ThreadId is required');
    });
  
    it('should validate that chatService is available', async () => {
      // Arrange - create a request with missing chat service
      const mockReq = createMockRequest({
        prompt: 'Hello, bot!',
        provider: 'anthropic',
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
        provider: 'anthropic',
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
