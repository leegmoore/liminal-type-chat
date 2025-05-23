/**
 * Additional coverage tests for conversation.ts
 * These tests focus on specific branches to improve test coverage
 */
import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { createConversationRoutes } from '../conversation';
import * as _ctcFactory from '../../../clients/domain/context-thread-client-factory';
import { IJwtService } from '../../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../../providers/db/users/IUserRepository';

// Mock the context thread client
const mockContextThreadClient = {
  getThreads: jest.fn(),
  getContextThread: jest.fn(),
  createContextThread: jest.fn(),
  updateContextThread: jest.fn(),
  deleteContextThread: jest.fn(),
  addMessageToContextThread: jest.fn()
};

// Mock the client factory
jest.mock('../../../clients/domain/context-thread-client-factory', () => ({
  getContextThreadClient: jest.fn(() => mockContextThreadClient)
}));

// Mock authentication middleware to bypass auth in tests
jest.mock('../../../middleware/auth-middleware', () => ({
  createAuthMiddleware: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => {
    req.user = {
      userId: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      scopes: ['read:conversations', 'write:conversations'],
      tier: 'edge',
      tokenId: 'test-token-id'
    };
    next();
  })
}));

describe('Conversation Routes - Coverage Tests', () => {
  let app: express.Application;
  let mockJwtService: jest.Mocked<IJwtService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock JWT service
    mockJwtService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
      decodeToken: jest.fn(),
      refreshToken: jest.fn()
    } as unknown as jest.Mocked<IJwtService>;
    
    // Create mock user repository
    mockUserRepository = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserByProvider: jest.fn(),
      updateApiKey: jest.fn(),
      getApiKey: jest.fn(),
      deleteApiKey: jest.fn()
    } as unknown as jest.Mocked<IUserRepository>;
    
    // Setup app with conversation routes
    app = express();
    app.use(express.json());
    
    // Add routes to app with required parameters
    app.use('/api/v1/conversations', createConversationRoutes(mockJwtService, mockUserRepository));
    
    // Add error handler
    app.use((err: Error & { statusCode?: number; toJSON?: () => Record<string, unknown> }, 
      _req: Request, res: Response, _next: NextFunction) => {
      const statusCode = err.statusCode || 500;
      const errorResponse = err.toJSON ? err.toJSON() : { error: err.message || 'Unknown error' };
      res.status(statusCode).json(errorResponse);
    });

    // Mock NODE_ENV for testing debug logs
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    // Reset NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  // Test Ajv validation error handling through the API response
  describe('Validation error handling', () => {
    it('should handle validation errors', async () => {
      // This test exercises validation error handling
      const invalidBody = {
        // Just use an empty object to trigger validation errors
        // Specifically missing required fields
      };
      
      const response = await request(app)
        .post('/api/v1/conversations')
        .send(invalidBody);
      
      // Validation errors result in status 500
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      // We don't need to check for specific error message format
      // Just verify we're getting an error response
    });
  });

  describe('POST /api/v1/conversations/:conversationId/messages', () => {
    it('should handle messages for non-existent conversation', async () => {
      // Set up mock to simulate non-existent conversation ID
      mockContextThreadClient.addMessageToContextThread.mockResolvedValue(null);
      
      const validBody = {
        role: 'user', // Valid role
        content: 'Test message'
      };
      
      const response = await request(app)
        .post('/api/v1/conversations/non-existent-thread/messages')
        .send(validBody);
      
      // The API returns 404 for non-existent conversation
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate request properly when missing required fields', async () => {
      // Test request body validation when fields are missing
      const invalidBody = {
        // Missing both role and content
        metadata: { test: true }
      };
      
      const response = await request(app)
        .post('/api/v1/conversations/thread-123/messages')
        .send(invalidBody);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate message with custom status value', async () => {
      // Arrange - Test with custom status value to improve branch coverage
      const updatedThread = {
        id: 'thread-123',
        title: 'Test Thread',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'msg-new',
            threadId: 'thread-123',
            role: 'user',
            content: 'New message with custom status',
            createdAt: Date.now(),
            status: 'custom_status'
          }
        ]
      };
      
      mockContextThreadClient.addMessageToContextThread.mockResolvedValue(updatedThread);
      
      const requestBody = {
        role: 'user',
        content: 'New message with custom status',
        status: 'custom_status' // Custom status to exercise branch
      };
      
      // Act
      const response = await request(app)
        .post('/api/v1/conversations/thread-123/messages')
        .send(requestBody);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('messageId', 'msg-new');
      expect(response.body).toHaveProperty('status', 'custom_status');
      expect(mockContextThreadClient.addMessageToContextThread).toHaveBeenCalledWith(
        'thread-123',
        expect.objectContaining({
          status: 'custom_status'
        })
      );
    });

    it('should include custom metadata in the new message', async () => {
      // Arrange - Test with custom metadata to improve branch coverage
      const updatedThread = {
        id: 'thread-123',
        title: 'Test Thread',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'msg-meta',
            threadId: 'thread-123',
            role: 'user',
            content: 'Message with metadata',
            createdAt: Date.now(),
            status: 'delivered',
            metadata: { custom: 'value', tags: ['test'] }
          }
        ]
      };
      
      mockContextThreadClient.addMessageToContextThread.mockResolvedValue(updatedThread);
      
      const requestBody = {
        role: 'user',
        content: 'Message with metadata',
        metadata: { custom: 'value', tags: ['test'] }
      };
      
      // Act
      const response = await request(app)
        .post('/api/v1/conversations/thread-123/messages')
        .send(requestBody);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('messageId', 'msg-meta');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toEqual({ custom: 'value', tags: ['test'] });
      expect(mockContextThreadClient.addMessageToContextThread).toHaveBeenCalledWith(
        'thread-123',
        expect.objectContaining({
          metadata: { custom: 'value', tags: ['test'] }
        })
      );
    });
  });

  describe('PUT /api/v1/conversations/:conversationId', () => {
    it('should handle metadata updates', async () => {
      // Arrange - Test updating just metadata to improve branch coverage
      const updatedThread = {
        id: 'thread-123',
        title: 'Test Thread',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        metadata: { custom: 'value', version: 2 }
      };
      
      mockContextThreadClient.updateContextThread.mockResolvedValue(updatedThread);
      
      const requestBody = {
        metadata: { custom: 'value', version: 2 }
      };
      
      // Act
      const response = await request(app)
        .put('/api/v1/conversations/thread-123')
        .send(requestBody);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversationId', 'thread-123');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toEqual({ custom: 'value', version: 2 });
      expect(mockContextThreadClient.updateContextThread).toHaveBeenCalledWith(
        'thread-123',
        expect.objectContaining({
          metadata: { custom: 'value', version: 2 }
        })
      );
    });

    it('should handle setting title to null', async () => {
      // Arrange - Test setting title to null to improve branch coverage
      const updatedThread = {
        id: 'thread-123',
        title: null, // Null title
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      
      mockContextThreadClient.updateContextThread.mockResolvedValue(updatedThread);
      
      const requestBody = {
        title: null
      };
      
      // Act
      const response = await request(app)
        .put('/api/v1/conversations/thread-123')
        .send(requestBody);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversationId', 'thread-123');
      expect(response.body).toHaveProperty('title', null);
      expect(mockContextThreadClient.updateContextThread).toHaveBeenCalledWith(
        'thread-123',
        expect.objectContaining({
          title: null
        })
      );
    });
  });

  describe('GET /api/v1/conversations', () => {
    it('should use default parameters when no query params are provided', async () => {
      // Arrange
      mockContextThreadClient.getThreads.mockResolvedValue([]);
      
      // Act - Call without any query parameters
      const response = await request(app)
        .get('/api/v1/conversations');
      
      // Assert
      expect(response.status).toBe(200);
      // Verify default values are used
      expect(mockContextThreadClient.getThreads).toHaveBeenCalledWith(20, 0);
    });
  });
});