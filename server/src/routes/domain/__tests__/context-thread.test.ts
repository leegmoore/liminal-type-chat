import request from 'supertest';
import express from 'express';
import { createContextThreadRoutes } from '../context-thread';
import { ContextThreadService } from '../../../services/core/ContextThreadService';
import { ContextThread, MessageRole, MessageStatus } from '../../../types/domain';

// Mock the ContextThreadService
jest.mock('../../../services/core/ContextThreadService');
jest.mock('../../../providers/db/ContextThreadRepository');

describe('ContextThread Domain API Routes', () => {
  let app: express.Application;
  let mockService: jest.Mocked<ContextThreadService>;
  
  const sampleThread: ContextThread = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Sample Thread',
    createdAt: 1620000000000,
    updatedAt: 1620000000000,
    messages: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        threadId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as MessageRole,
        content: 'Hello, world!',
        createdAt: 1620000000000,
      },
    ],
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Express app with JSON middleware and the context-thread routes
    app = express();
    app.use(express.json());
    
    // Setup mock service methods
    mockService = ContextThreadService.prototype as jest.Mocked<ContextThreadService>;
    
    // Use the factory function to create routes with the mocked service
    app.use('/api/v1/domain/threads', createContextThreadRoutes(mockService));
    
    // Mock service methods are already set up above
  });

  describe('GET /api/v1/domain/threads/:id', () => {
    it('should return a thread when found', async () => {
      // Arrange
      mockService.getContextThread.mockReturnValue(sampleThread);
      
      // Act
      const response = await request(app)
        .get(`/api/v1/domain/threads/${sampleThread.id}`)
        .expect(200);
      
      // Assert
      expect(mockService.getContextThread).toHaveBeenCalledWith(sampleThread.id);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', sampleThread.id);
    });
    
    it('should return 404 when thread not found', async () => {
      // Arrange
      mockService.getContextThread.mockReturnValue(null);
      
      // Act & Assert
      await request(app)
        .get('/api/v1/domain/threads/non-existent-id')
        .expect(404);
      
      expect(mockService.getContextThread).toHaveBeenCalledWith('non-existent-id');
    });
    
    it('should return 500 when thread retrieval throws an error', async () => {
      // Arrange
      mockService.getContextThread.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      const response = await request(app)
        .get(`/api/v1/domain/threads/${sampleThread.id}`)
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/v1/domain/threads', () => {
    it('should create a new thread', async () => {
      // Arrange
      const newThread = {
        title: 'New Thread',
      };
      mockService.createContextThread.mockReturnValue({
        id: 'new-thread-id',
        title: 'New Thread',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      });
      
      // Act
      const response = await request(app)
        .post('/api/v1/domain/threads')
        .send(newThread)
        .expect(201);
      
      // Assert
      expect(mockService.createContextThread).toHaveBeenCalledWith(newThread);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', 'new-thread-id');
    });
    
    it('should create a thread with an initial message', async () => {
      // Arrange
      const newThread = {
        title: 'Thread with Message',
        initialMessage: {
          content: 'Hello world',
          role: 'user',
        },
      };
      mockService.createContextThread.mockReturnValue({
        id: 'thread-with-message-id',
        title: 'Thread with Message',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'message-id',
            threadId: 'thread-with-message-id',
            content: 'Hello world',
            role: 'user' as MessageRole,
            createdAt: Date.now(),
          },
        ],
      } as ContextThread);
      
      // Act
      const response = await request(app)
        .post('/api/v1/domain/threads')
        .send(newThread)
        .expect(201);
      
      // Assert
      expect(mockService.createContextThread).toHaveBeenCalledWith(newThread);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.messages).toHaveLength(1);
    });
    
    it('should return 500 when thread creation fails', async () => {
      // Arrange
      const newThread = {
        title: 'New Thread',
      };
      mockService.createContextThread.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      const response = await request(app)
        .post('/api/v1/domain/threads')
        .send(newThread)
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/v1/domain/threads/:id', () => {
    it('should update a thread when found', async () => {
      // Arrange
      const updatedThread = { ...sampleThread, title: 'Updated Title' };
      mockService.updateContextThread.mockReturnValue(updatedThread);
      
      // Act
      const response = await request(app)
        .put(`/api/v1/domain/threads/${sampleThread.id}`)
        .send({ title: 'Updated Title' })
        .expect(200);
      
      // Assert
      expect(mockService.updateContextThread).toHaveBeenCalledWith(
        sampleThread.id,
        { title: 'Updated Title' }
      );
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
    });
    
    it('should return 404 when thread not found', async () => {
      // Arrange
      mockService.updateContextThread.mockReturnValue(null);
      
      // Act & Assert
      await request(app)
        .put('/api/v1/domain/threads/non-existent-id')
        .send({ title: 'Updated Title' })
        .expect(404);
      
      expect(mockService.updateContextThread).toHaveBeenCalledWith(
        'non-existent-id',
        { title: 'Updated Title' }
      );
    });
    
    it('should return 500 when thread update throws an error', async () => {
      // Arrange
      mockService.updateContextThread.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      const response = await request(app)
        .put(`/api/v1/domain/threads/${sampleThread.id}`)
        .send({ title: 'Updated Title' })
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('DELETE /api/v1/domain/threads/:id', () => {
    it('should delete a thread when found', async () => {
      // Arrange
      mockService.deleteContextThread.mockReturnValue(true);
      
      // Act & Assert
      const response = await request(app)
        .delete(`/api/v1/domain/threads/${sampleThread.id}`)
        .expect(200);
      
      expect(mockService.deleteContextThread).toHaveBeenCalledWith(sampleThread.id);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
    
    it('should return 404 when thread not found', async () => {
      // Arrange
      mockService.deleteContextThread.mockReturnValue(false);
      
      // Act & Assert
      await request(app)
        .delete('/api/v1/domain/threads/non-existent-id')
        .expect(404);
      
      expect(mockService.deleteContextThread).toHaveBeenCalledWith('non-existent-id');
    });
    
    it('should return 500 when thread deletion throws an error', async () => {
      // Arrange
      mockService.deleteContextThread.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      const response = await request(app)
        .delete(`/api/v1/domain/threads/${sampleThread.id}`)
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(mockService.deleteContextThread).toHaveBeenCalledWith(sampleThread.id);
    });
  });
  
  describe('POST /api/v1/domain/threads/:id/messages', () => {
    it('should add a message to a thread', async () => {
      // Arrange
      const newMessage = {
        content: 'New message',
        role: 'user',
      };
      const updatedThread = {
        ...sampleThread,
        messages: [
          ...sampleThread.messages,
          {
            id: 'new-message-id',
            threadId: sampleThread.id,
            content: 'New message',
            role: 'user' as MessageRole,
            createdAt: Date.now(),
          },
        ],
      } as ContextThread;
      mockService.addMessageToContextThread.mockReturnValue(updatedThread);
      
      // Act
      const response = await request(app)
        .post(`/api/v1/domain/threads/${sampleThread.id}/messages`)
        .send(newMessage)
        .expect(201);
      
      // Assert
      expect(mockService.addMessageToContextThread).toHaveBeenCalledWith(
        sampleThread.id,
        newMessage
      );
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.messages).toHaveLength(2); // Original message + new one
    });
    
    it('should return 404 when thread not found', async () => {
      // Arrange
      mockService.addMessageToContextThread.mockReturnValue(null);
      
      // Act & Assert
      await request(app)
        .post('/api/v1/domain/threads/non-existent-id/messages')
        .send({ content: 'New message', role: 'user' as MessageRole })
        .expect(404); // Expecting 404 for not found resources
      
      expect(mockService.addMessageToContextThread).toHaveBeenCalledWith(
        'non-existent-id',
        { content: 'New message', role: 'user' }
      );
    });
    
    it('should return 500 when message addition throws an error', async () => {
      // Arrange
      mockService.addMessageToContextThread.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      const response = await request(app)
        .post(`/api/v1/domain/threads/${sampleThread.id}/messages`)
        .send({ content: 'New message', role: 'user' as MessageRole })
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/v1/domain/threads/:id/messages', () => {
    it('should return all messages for a thread', async () => {
      // Arrange
      mockService.getContextThread.mockReturnValue(sampleThread);
      
      // Act
      const response = await request(app)
        .get(`/api/v1/domain/threads/${sampleThread.id}/messages`)
        .expect(200);
      
      // Assert
      expect(mockService.getContextThread).toHaveBeenCalledWith(sampleThread.id);
      expect(response.body).toEqual({
        success: true,
        data: sampleThread.messages,
      });
    });
    
    it('should return 404 when thread not found', async () => {
      // Arrange
      mockService.getContextThread.mockReturnValue(null);
      
      // Act
      const response = await request(app)
        .get('/api/v1/domain/threads/non-existent-id/messages')
        .expect(404);
      
      // Assert
      expect(mockService.getContextThread).toHaveBeenCalledWith('non-existent-id');
      expect(response.body).toEqual({
        success: false,
        message: expect.stringContaining('not found'),
      });
    });
  });
  
  describe('PUT /api/v1/domain/threads/:id/messages/:messageId', () => {
    it('should update a message in a thread', async () => {
      // Arrange
      const updateParams = {
        content: 'Updated message content',
        status: 'complete' as const,
      };
      const updatedThread = {
        ...sampleThread,
        messages: [
          {
            ...sampleThread.messages[0],
            content: 'Updated message content',
            status: 'complete' as MessageStatus,
          },
        ],
      };
      mockService.updateMessageInContextThread.mockReturnValue(updatedThread);
      
      // Act
      const response = await request(app)
        .put(`/api/v1/domain/threads/${sampleThread.id}/messages/${sampleThread.messages[0].id}`)
        .send(updateParams)
        .expect(200);
      
      // Assert
      expect(mockService.updateMessageInContextThread).toHaveBeenCalledWith(
        sampleThread.id,
        sampleThread.messages[0].id,
        expect.objectContaining(updateParams)
      );
      expect(response.body).toEqual({
        success: true,
        data: updatedThread,
      });
    });
    
    it('should return 404 when thread or message not found', async () => {
      // Arrange
      mockService.updateMessageInContextThread.mockReturnValue(null);
      
      // Act
      const response = await request(app)
        .put('/api/v1/domain/threads/valid-thread-id/messages/non-existent-message-id')
        .send({ content: 'Updated content' })
        .expect(404);
      
      // Assert
      expect(mockService.updateMessageInContextThread).toHaveBeenCalledWith(
        'valid-thread-id',
        'non-existent-message-id',
        expect.any(Object)
      );
      expect(response.body).toEqual({
        success: false,
        message: expect.stringContaining('not found'),
      });
    });
  });
});
