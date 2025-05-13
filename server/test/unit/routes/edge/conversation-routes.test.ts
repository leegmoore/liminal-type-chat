import request from 'supertest';
import express, { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ContextThread, Message } from '../../../../src/types/domain';
import { createConversationRoutes } from '../../../../src/routes/edge/conversation';
import { errorHandler } from '../../../../src/middleware/error-handler';

// Mock the domain client factory
jest.mock('../../../../src/clients/domain/context-thread-client-factory', () => ({
  getContextThreadClient: jest.fn().mockReturnValue({
    createContextThread: jest.fn(),
    getContextThread: jest.fn(), 
    getThreads: jest.fn(),
    updateContextThread: jest.fn(),
    deleteContextThread: jest.fn(),
    addMessageToContextThread: jest.fn(),
  }),
}));

// Mock the database-related modules to prevent actual DB initialization
jest.mock('../../../../src/providers/db/sqlite-provider');
jest.mock('../../../../src/providers/db/ContextThreadRepository');

describe('Edge API Conversation Routes', () => {
  let app: Express;
  let mockContextThreadClient: {
    createContextThread: jest.Mock;
    getContextThread: jest.Mock; 
    getThreads: jest.Mock;
    updateContextThread: jest.Mock;
    deleteContextThread: jest.Mock;
    addMessageToContextThread: jest.Mock;
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a test Express app instead of using the real app
    app = express();
    
    // Get the mock client
    const { getContextThreadClient } = jest.requireMock(
      '../../../../src/clients/domain/context-thread-client-factory'
    );
    mockContextThreadClient = getContextThreadClient();
    
    // Configure the test app with only what we need for the tests
    app.use(express.json());
    app.use('/api/v1/conversations', createConversationRoutes());
    app.use(errorHandler);
  });

  describe('GET /api/v1/conversations', () => {
    it('should return a list of conversations', async () => {
      // Prepare mock data
      const mockThreads: ContextThread[] = [
        {
          id: uuidv4(),
          title: 'Test Thread 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          metadata: {},
        },
        {
          id: uuidv4(),
          title: 'Test Thread 2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          metadata: {},
        },
      ];

      mockContextThreadClient.getThreads.mockResolvedValue(mockThreads);

      // Make the request
      const response = await request(app)
        .get('/api/v1/conversations')
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('conversations');
      expect(response.body.conversations).toHaveLength(2);
      expect(response.body.conversations[0]).toHaveProperty('conversationId');
      expect(response.body.conversations[0]).toHaveProperty('title');
      expect(response.body.conversations[0]).toHaveProperty('createdAt');
      expect(response.body.conversations[0]).toHaveProperty('updatedAt');
      
      // Verify the client was called correctly
      expect(mockContextThreadClient.getThreads).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination parameters', async () => {
      // Prepare mock data
      mockContextThreadClient.getThreads.mockResolvedValue([]);

      // Make the request with pagination parameters
      await request(app)
        .get('/api/v1/conversations?limit=10&offset=20')
        .expect(200);

      // Verify the client was called with correct parameters
      expect(mockContextThreadClient.getThreads).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('POST /api/v1/conversations', () => {
    it('should create a new conversation', async () => {
      // Prepare mock data
      const mockContextThreadId = uuidv4();
      const mockCreatedThread: ContextThread = {
        id: mockContextThreadId,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [], // Ensure messages is an array, even if empty
        metadata: {},
      };

      mockContextThreadClient.createContextThread.mockResolvedValue(mockCreatedThread);

      // Make the request
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          title: 'New Conversation',
          initialMessage: {
            role: 'user',
            content: 'Hello, world!'
          }
        })
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify response
      expect(response.body).toHaveProperty('conversationId', mockContextThreadId);
      expect(response.body).toHaveProperty('title', 'New Conversation');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('messages');
      
      // Verify the client was called correctly
      expect(mockContextThreadClient.createContextThread).toHaveBeenCalledTimes(1);
      const createThreadArgs = mockContextThreadClient.createContextThread.mock.calls[0][0];
      expect(createThreadArgs).toHaveProperty('title', 'New Conversation');
      expect(createThreadArgs).toHaveProperty('initialMessage');
      expect(createThreadArgs.initialMessage).toHaveProperty('role', 'user');
      expect(createThreadArgs.initialMessage).toHaveProperty('content', 'Hello, world!');
    });

    it('should handle validation errors', async () => {
      // Make the request with invalid data
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          title: 123, // Invalid type, should be string
          initialMessage: {
            role: 'invalid_role', // Invalid role
            content: 'Hello, world!'
          }
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Verify response has error details
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('errorCode', 'VALIDATION_FAILED');
      expect(response.body.error).toHaveProperty('details');
      
      // Verify the client was not called
      expect(mockContextThreadClient.createContextThread).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/conversations/:conversationId', () => {
    it('should return a conversation by ID', async () => {
      // Prepare mock data
      const mockContextThreadId = uuidv4();
      const mockThread: ContextThread = {
        id: mockContextThreadId,
        title: 'Test Thread',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: uuidv4(),
            threadId: mockContextThreadId,
            role: 'user',
            content: 'Hello',
            createdAt: Date.now(),
          }
        ],
        metadata: {},
      };

      mockContextThreadClient.getContextThread.mockResolvedValue(mockThread);

      // Make the request
      const response = await request(app)
        .get(`/api/v1/conversations/${mockContextThreadId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('conversationId', mockContextThreadId);
      expect(response.body).toHaveProperty('title', 'Test Thread');
      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages).toHaveLength(1);
      
      // Verify the client was called correctly
      expect(mockContextThreadClient.getContextThread).toHaveBeenCalledWith(mockContextThreadId);
    });

    it('should return 404 for non-existent conversation', async () => {
      // Mock returning null to simulate not found, matching route handler logic
      mockContextThreadClient.getContextThread.mockResolvedValue(null);

      // Make the request
      const response = await request(app)
        .get(`/api/v1/conversations/${uuidv4()}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // Verify response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('errorCode', 'RESOURCE_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/conversations/:conversationId', () => {
    it('should update a conversation', async () => {
      // Prepare mock data
      const mockContextThreadId = uuidv4();
      const mockUpdatedThread: ContextThread = {
        id: mockContextThreadId,
        title: 'Updated Title',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        metadata: { updated: true },
      };

      mockContextThreadClient.updateContextThread.mockResolvedValue(mockUpdatedThread);

      // Make the request
      const response = await request(app)
        .put(`/api/v1/conversations/${mockContextThreadId}`)
        .send({
          title: 'Updated Title',
          metadata: { updated: true }
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('conversationId', mockContextThreadId);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('metadata.updated', true);
      
      // Verify the client was called correctly
      expect(mockContextThreadClient.updateContextThread).toHaveBeenCalledWith(
        mockContextThreadId,
        expect.objectContaining({
          title: 'Updated Title',
          metadata: { updated: true }
        })
      );
    });
  });

  describe('DELETE /api/v1/conversations/:conversationId', () => {
    it('should delete a conversation', async () => {
      // Prepare mock data
      const mockContextThreadId = uuidv4();
      mockContextThreadClient.deleteContextThread.mockResolvedValue(undefined);

      // Make the request
      await request(app)
        .delete(`/api/v1/conversations/${mockContextThreadId}`)
        .expect(204);
      
      // Verify the client was called correctly
      expect(mockContextThreadClient.deleteContextThread).toHaveBeenCalledWith(mockContextThreadId);
    });
  });

  describe('POST /api/v1/conversations/:conversationId/messages', () => {
    it('should add a message to a conversation', async () => {
      // Prepare mock data
      const mockContextThreadId = uuidv4();
      const mockMessageId = uuidv4();
      const mockMessage: Message = {
        id: mockMessageId,
        threadId: mockContextThreadId,
        role: 'user',
        content: 'New message',
        createdAt: Date.now(),
      };
      
      // Create a mock context thread that includes the new message
      const mockUpdatedThread: ContextThread = {
        id: mockContextThreadId,
        title: 'Test Thread',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [mockMessage],
        metadata: {}
      };

      // Now mock to return the updated thread instead of just the message
      mockContextThreadClient.addMessageToContextThread.mockResolvedValue(mockUpdatedThread);

      // Make the request
      const response = await request(app)
        .post(`/api/v1/conversations/${mockContextThreadId}/messages`)
        .send({
          role: 'user',
          content: 'New message'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify response
      expect(response.body).toHaveProperty('messageId', mockMessageId);
      expect(response.body).toHaveProperty('role', 'user');
      expect(response.body).toHaveProperty('content', 'New message');
      expect(response.body).toHaveProperty('createdAt');
      
      // Verify the client was called correctly
      expect(mockContextThreadClient.addMessageToContextThread).toHaveBeenCalledWith(
        mockContextThreadId,
        expect.objectContaining({
          role: 'user',
          content: 'New message'
        })
      );
    });
  });
});
