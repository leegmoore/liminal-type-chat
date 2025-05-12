import { ContextThreadService, CreateThreadParams, AddMessageParams, UpdateThreadParams } from '../ContextThreadService';
import { ContextThreadRepository } from '../../../providers/db/ContextThreadRepository';
import { MessagesCorruptedError } from '../../../providers/db/errors';
import { ContextThread, Message } from '../../../types/domain';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../../providers/db/ContextThreadRepository');
jest.mock('uuid');

describe('ContextThreadService', () => {
  let service: ContextThreadService;
  let mockRepository: jest.Mocked<ContextThreadRepository>;
  
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockTimestamp = 1620000000000;
  
  const sampleThread: ContextThread = {
    id: mockUuid,
    title: 'Sample Thread',
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    messages: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        threadId: mockUuid,
        role: 'user',
        content: 'Hello, world!',
        createdAt: mockTimestamp,
      },
    ],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Date.now() to return a fixed timestamp
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    
    // Mock uuid to return a fixed value
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);
    
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      close: jest.fn()
    } as unknown as jest.Mocked<ContextThreadRepository>;
    
    // Create service instance with mock repository
    service = new ContextThreadService(mockRepository);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('createThread', () => {
    it('should create a thread with no initial message', () => {
      // Arrange
      const params: CreateThreadParams = {
        title: 'New Thread',
      };
      mockRepository.create.mockReturnValue({
        id: mockUuid,
        title: params.title,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        messages: [],
      });
      
      // Act
      const result = service.createThread(params);
      
      // Assert
      expect(uuidv4).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith({
        id: mockUuid,
        title: params.title,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        messages: [],
      });
      expect(result).toEqual({
        id: mockUuid,
        title: params.title,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        messages: [],
      });
    });
    
    it('should create a thread with an initial message', () => {
      // Arrange
      const params: CreateThreadParams = {
        title: 'New Thread with Message',
        initialMessage: {
          role: 'user',
          content: 'Initial message',
        },
      };
      const expectedThread = {
        id: mockUuid,
        title: params.title,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        messages: [
          {
            id: mockUuid, // Same UUID for simplicity in the test
            threadId: mockUuid,
            role: params.initialMessage.role,
            content: params.initialMessage.content,
            createdAt: mockTimestamp,
          },
        ],
      };
      mockRepository.create.mockReturnValue(expectedThread);
      
      // Act
      const result = service.createThread(params);
      
      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(expectedThread);
      expect(result).toEqual(expectedThread);
    });
    
    it('should create a thread with metadata', () => {
      // Arrange
      const metadata = { key: 'value' };
      const params: CreateThreadParams = {
        title: 'Thread with Metadata',
        metadata,
      };
      const expectedThread = {
        id: mockUuid,
        title: params.title,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        metadata,
        messages: [],
      };
      mockRepository.create.mockReturnValue(expectedThread);
      
      // Act
      const result = service.createThread(params);
      
      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(expectedThread);
      expect(result).toEqual(expectedThread);
    });
  });
  
  describe('getThread', () => {
    it('should return a thread when found', () => {
      // Arrange
      mockRepository.findById.mockReturnValue(sampleThread);
      
      // Act
      const result = service.getThread(mockUuid);
      
      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUuid);
      expect(result).toEqual(sampleThread);
    });
    
    it('should return null when thread not found', () => {
      // Arrange
      mockRepository.findById.mockReturnValue(null);
      
      // Act
      const result = service.getThread('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should propagate MessagesCorruptedError', () => {
      // Arrange
      const error = new MessagesCorruptedError(mockUuid);
      mockRepository.findById.mockImplementation(() => {
        throw error;
      });
      
      // Act & Assert
      expect(() => service.getThread(mockUuid)).toThrow(MessagesCorruptedError);
    });
  });
  
  describe('updateThread', () => {
    it('should update a thread successfully', () => {
      // Arrange
      const updates: UpdateThreadParams = {
        title: 'Updated Title',
      };
      const originalThread = { ...sampleThread };
      const updatedThread = {
        ...sampleThread,
        title: updates.title,
        updatedAt: mockTimestamp,
      };
      
      mockRepository.findById.mockReturnValue(originalThread);
      mockRepository.update.mockReturnValue(updatedThread);
      
      // Act
      const result = service.updateThread(mockUuid, updates);
      
      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUuid);
      expect(mockRepository.update).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUuid,
        title: updates.title,
        updatedAt: mockTimestamp,
      }));
      expect(result).toEqual(updatedThread);
    });
    
    it('should return null if thread not found', () => {
      // Arrange
      mockRepository.findById.mockReturnValue(null);
      
      // Act
      const result = service.updateThread('non-existent-id', { title: 'New Title' });
      
      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
    
    it('should handle updating metadata', () => {
      // Arrange
      const updates: UpdateThreadParams = {
        metadata: { key: 'updated-value' },
      };
      const originalThread = { ...sampleThread };
      const updatedThread = {
        ...sampleThread,
        metadata: updates.metadata,
        updatedAt: mockTimestamp,
      };
      
      mockRepository.findById.mockReturnValue(originalThread);
      mockRepository.update.mockReturnValue(updatedThread);
      
      // Act
      const result = service.updateThread(mockUuid, updates);
      
      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(expect.objectContaining({
        metadata: updates.metadata,
      }));
      expect(result).toEqual(updatedThread);
    });
  });
  
  describe('addMessage', () => {
    it('should add a message to an existing thread', () => {
      // Arrange
      const messageParams: AddMessageParams = {
        role: 'assistant',
        content: 'New message content',
      };
      
      const originalThread = { ...sampleThread };
      const expectedMessage: Message = {
        id: mockUuid,
        threadId: mockUuid,
        role: messageParams.role,
        content: messageParams.content,
        createdAt: mockTimestamp,
      };
      
      const updatedThread = {
        ...sampleThread,
        messages: [...sampleThread.messages, expectedMessage],
        updatedAt: mockTimestamp,
      };
      
      mockRepository.findById.mockReturnValue(originalThread);
      mockRepository.update.mockReturnValue(updatedThread);
      
      // Act
      const result = service.addMessage(mockUuid, messageParams);
      
      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUuid);
      expect(mockRepository.update).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUuid,
        updatedAt: mockTimestamp,
        messages: expect.arrayContaining([
          expect.objectContaining({
            id: mockUuid,
            role: messageParams.role,
            content: messageParams.content,
          }),
        ]),
      }));
      expect(result).toEqual(updatedThread);
    });
    
    it('should return null if thread not found', () => {
      // Arrange
      mockRepository.findById.mockReturnValue(null);
      
      // Act
      const result = service.addMessage('non-existent-id', {
        role: 'user',
        content: 'Test message',
      });
      
      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
    
    it('should add a message with status and metadata', () => {
      // Arrange
      const messageParams: AddMessageParams = {
        role: 'assistant',
        content: 'Streaming message',
        status: 'streaming',
        metadata: { model: 'gpt-4' },
      };
      
      const originalThread = { ...sampleThread };
      
      mockRepository.findById.mockReturnValue(originalThread);
      mockRepository.update.mockImplementation(thread => thread);
      
      // Act
      const result = service.addMessage(mockUuid, messageParams);
      
      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            status: messageParams.status,
            metadata: messageParams.metadata,
          }),
        ]),
      }));
      expect(result.messages).toContainEqual(
        expect.objectContaining({
          status: messageParams.status,
          metadata: messageParams.metadata,
        })
      );
    });
  });
  
  describe('updateMessage', () => {
    it('should update a message in a thread', () => {
      // Arrange
      const messageId = sampleThread.messages[0].id;
      const updates = {
        content: 'Updated content',
        status: 'complete' as const,
      };
      
      const originalThread = { ...sampleThread };
      const updatedThread = {
        ...sampleThread,
        messages: [
          {
            ...sampleThread.messages[0],
            content: updates.content,
            status: updates.status,
          },
        ],
        updatedAt: mockTimestamp,
      };
      
      mockRepository.findById.mockReturnValue(originalThread);
      mockRepository.update.mockReturnValue(updatedThread);
      
      // Act
      const result = service.updateMessage(mockUuid, messageId, updates);
      
      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(mockUuid);
      expect(mockRepository.update).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUuid,
        updatedAt: mockTimestamp,
        messages: [
          expect.objectContaining({
            id: messageId,
            content: updates.content,
            status: updates.status,
          }),
        ],
      }));
      expect(result).toEqual(updatedThread);
    });
    
    it('should return null if thread not found', () => {
      // Arrange
      mockRepository.findById.mockReturnValue(null);
      
      // Act
      const result = service.updateMessage('non-existent-id', 'message-id', {
        content: 'Updated content',
      });
      
      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
    
    it('should return null if message not found in thread', () => {
      // Arrange
      const originalThread = { ...sampleThread };
      
      mockRepository.findById.mockReturnValue(originalThread);
      
      // Act
      const result = service.updateMessage(mockUuid, 'non-existent-message-id', {
        content: 'Updated content',
      });
      
      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteThread', () => {
    it('should delete a thread successfully', () => {
      // Arrange
      mockRepository.delete.mockReturnValue(true);
      
      // Act
      const result = service.deleteThread(mockUuid);
      
      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(mockUuid);
      expect(result).toBe(true);
    });
    
    it('should return false if thread not found', () => {
      // Arrange
      mockRepository.delete.mockReturnValue(false);
      
      // Act
      const result = service.deleteThread('non-existent-id');
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
