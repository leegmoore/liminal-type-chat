/**
 * Integration tests for conversation API validation flow
 * Tests the complete end-to-end validation pipeline for the conversation API
 */
import request from 'supertest';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
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

describe('Conversation API Validation Flow - Integration Tests', () => {
  let app: express.Express;
  let mockContextThreadClient: {
    createContextThread: jest.Mock;
    getContextThread: jest.Mock; 
    getThreads: jest.Mock;
    updateContextThread: jest.Mock;
    deleteContextThread: jest.Mock;
    addMessageToContextThread: jest.Mock;
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a test Express app
    app = express();
    
    // Get the mock client
    const { getContextThreadClient } = jest.requireMock(
      '../../../../src/clients/domain/context-thread-client-factory'
    );
    mockContextThreadClient = getContextThreadClient();
    
    // Configure the test app
    app.use(express.json());
    app.use('/api/v1/conversations', createConversationRoutes());
    app.use(errorHandler);
  });
  
  describe('E2E Validation Flow', () => {
    it('should validate conversation creation request and properly handle valid data', async () => {
      // Set up mock response
      const mockThreadId = uuidv4();
      mockContextThreadClient.createContextThread.mockResolvedValue({
        id: mockThreadId,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [{
          id: uuidv4(),
          threadId: mockThreadId,
          role: 'user',
          content: 'Hello, world!',
          createdAt: Date.now()
        }],
        metadata: {}
      });
      
      // Make a valid request
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
      
      // Verify the response
      expect(response.body).toHaveProperty('conversationId');
      expect(response.body).toHaveProperty('title', 'New Conversation');
      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages).toHaveLength(1);
      
      // Verify the expected client call
      expect(mockContextThreadClient.createContextThread).toHaveBeenCalledTimes(1);
      expect(mockContextThreadClient.createContextThread).toHaveBeenCalledWith({
        title: 'New Conversation',
        initialMessage: {
          role: 'user',
          content: 'Hello, world!'
        }
      });
    });
    
    it('should validate conversation creation request and reject invalid data', async () => {
      // Make an invalid request - title is wrong type and initialMessage has invalid role
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          title: 123, // Invalid type - should be string
          initialMessage: {
            role: 'invalid_role', // Invalid enum value
            content: 'Hello, world!'
          }
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verify the error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('errorCode');
      expect(response.body.error).toHaveProperty('message');
      
      // Verify the client was NOT called with invalid data
      expect(mockContextThreadClient.createContextThread).not.toHaveBeenCalled();
    });
    
    it('should validate message additions and properly handle valid data', async () => {
      // Set up mock response
      const mockThreadId = uuidv4();
      const mockMessageId = uuidv4();
      
      mockContextThreadClient.addMessageToContextThread.mockResolvedValue({
        id: mockThreadId,
        title: 'Existing Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [{
          id: mockMessageId,
          threadId: mockThreadId,
          role: 'user',
          content: 'New message',
          createdAt: Date.now()
        }],
        metadata: {}
      });
      
      // Make a valid message request
      const response = await request(app)
        .post(`/api/v1/conversations/${mockThreadId}/messages`)
        .send({
          role: 'user',
          content: 'New message'
        })
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Verify the response
      expect(response.body).toHaveProperty('messageId', mockMessageId);
      expect(response.body).toHaveProperty('role', 'user');
      expect(response.body).toHaveProperty('content', 'New message');
      
      // Verify the expected client call
      expect(mockContextThreadClient.addMessageToContextThread).toHaveBeenCalledTimes(1);
      expect(mockContextThreadClient.addMessageToContextThread).toHaveBeenCalledWith(
        mockThreadId,
        expect.objectContaining({
          role: 'user',
          content: 'New message'
        })
      );
    });
    
    it('should validate message additions and reject invalid data', async () => {
      const mockThreadId = uuidv4();
      
      // Make an invalid message request - missing content
      const response = await request(app)
        .post(`/api/v1/conversations/${mockThreadId}/messages`)
        .send({
          role: 'user'
          // Missing required content field
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verify the error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('errorCode');
      expect(response.body.error).toHaveProperty('message');
      
      // Verify the client was NOT called with invalid data
      expect(mockContextThreadClient.addMessageToContextThread).not.toHaveBeenCalled();
    });
    
    it('should validate conversation updates and properly handle valid data', async () => {
      // Set up mock response
      const mockThreadId = uuidv4();
      mockContextThreadClient.updateContextThread.mockResolvedValue({
        id: mockThreadId,
        title: 'Updated Title',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        metadata: {
          important: true
        }
      });
      
      // Make a valid update request
      const response = await request(app)
        .put(`/api/v1/conversations/${mockThreadId}`)
        .send({
          title: 'Updated Title',
          metadata: {
            important: true
          }
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verify the response
      expect(response.body).toHaveProperty('conversationId', mockThreadId);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('metadata.important', true);
      
      // Verify the expected client call
      expect(mockContextThreadClient.updateContextThread).toHaveBeenCalledTimes(1);
      expect(mockContextThreadClient.updateContextThread).toHaveBeenCalledWith(
        mockThreadId,
        expect.objectContaining({
          title: 'Updated Title',
          metadata: {
            important: true
          }
        })
      );
    });
    
    it('should properly handle nested validation errors in metadata', async () => {
      const mockThreadId = uuidv4();
      
      // Create a request with invalid nested metadata structure
      const response = await request(app)
        .put(`/api/v1/conversations/${mockThreadId}`)
        .send({
          title: 'Valid Title',
          metadata: "not an object" // Should be an object, not a string
        })
        .expect('Content-Type', /json/);
      
      // Verify the error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('details');
      
      // Verify the client was NOT called with invalid data
      expect(mockContextThreadClient.updateContextThread).not.toHaveBeenCalled();
    });
    
    it('should properly handle simultaneous multiple validation errors', async () => {
      // Create a request with multiple validation issues
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          title: 123, // Invalid type
          initialMessage: {
            role: 'invalid_role', // Invalid enum
            content: 123 // Invalid type
          },
          metadata: "not an object" // Invalid type
        })
        .expect('Content-Type', /json/);
      
      // Verify the error response contains multiple issues
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('details');
      
      // The error details string should mention multiple fields
      const errorDetails = response.body.error.details;
      expect(typeof errorDetails).toBe('string');
      expect(errorDetails.length).toBeGreaterThan(0);
      
      // Verify the client was NOT called with invalid data
      expect(mockContextThreadClient.createContextThread).not.toHaveBeenCalled();
    });
  });
});