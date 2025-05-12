import { ContextThreadService } from '../../../services/core/ContextThreadService';
import { ContextThreadClient } from '../context-thread-client';
import { DirectContextThreadClient } from '../direct-context-thread-client';
import { HttpContextThreadClient } from '../http-context-thread-client';
import { getContextThreadClient } from '../context-thread-client-factory';
import { CreateContextThreadParams, Message, MessageRole } from '../../../types/domain';
import axios from 'axios';

// Mock the ContextThreadService
jest.mock('../../../services/core/ContextThreadService');

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContextThreadClient Interface Implementation Tests', () => {
  let mockService: jest.Mocked<ContextThreadService>;
  let mockDate: number;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup a fixed timestamp for testing
    mockDate = 1620000000000; // May 3, 2021
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate);
    
    // Setup mock service
    // We're intentionally mocking with null for the repository in tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockService = new ContextThreadService(null as any) as jest.Mocked<ContextThreadService>;
    
    // Mock axios create
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });
  
  describe('DirectContextThreadClient', () => {
    let client: ContextThreadClient;
    
    beforeEach(() => {
      client = new DirectContextThreadClient(mockService);
    });
    
    test('createContextThread should call service with correct params', async () => {
      // Arrange
      const params: CreateContextThreadParams = {
        title: 'Test Thread',
        metadata: { key: 'value' }
      };
      
      const mockThread = {
        id: '123',
        title: 'Test Thread',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [],
        metadata: { key: 'value' }
      };
      
      mockService.createContextThread.mockReturnValue(mockThread);
      
      // Act
      const result = await client.createContextThread(params);
      
      // Assert
      expect(mockService.createContextThread).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockThread);
    });
    
    test('getContextThread should call service with correct id', async () => {
      // Arrange
      const threadId = '123';
      
      const mockThread = {
        id: threadId,
        title: 'Test Thread',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [],
        metadata: {}
      };
      
      mockService.getContextThread.mockReturnValue(mockThread);
      
      // Act
      const result = await client.getContextThread(threadId);
      
      // Assert
      expect(mockService.getContextThread).toHaveBeenCalledWith(threadId);
      expect(result).toEqual(mockThread);
    });
    
    test('updateContextThread should call service with correct params', async () => {
      // Arrange
      const threadId = '123';
      const params = {
        title: 'Updated Title',
        metadata: { updated: true }
      };
      
      const mockThread = {
        id: threadId,
        title: 'Updated Title',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [],
        metadata: { updated: true }
      };
      
      mockService.updateContextThread.mockReturnValue(mockThread);
      
      // Act
      const result = await client.updateContextThread(threadId, params);
      
      // Assert
      expect(mockService.updateContextThread).toHaveBeenCalledWith(threadId, params);
      expect(result).toEqual(mockThread);
    });
    
    test('deleteContextThread should call service with correct id', async () => {
      // Arrange
      const threadId = '123';
      
      mockService.deleteContextThread.mockReturnValue(true);
      
      // Act
      const result = await client.deleteContextThread(threadId);
      
      // Assert
      expect(mockService.deleteContextThread).toHaveBeenCalledWith(threadId);
      expect(result).toBe(true);
    });
    
    test('addMessageToContextThread should call service with correct params', async () => {
      // Arrange
      const threadId = '123';
      const message: Omit<Message, 'id' | 'threadId'> = {
        role: 'user' as MessageRole,
        content: 'Hello world',
        createdAt: mockDate
      };
      
      const mockThread = {
        id: threadId,
        title: 'Test Thread',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [
          {
            id: '456',
            threadId,
            ...message
          }
        ],
        metadata: {}
      };
      
      mockService.addMessageToContextThread.mockReturnValue(mockThread);
      
      // Act
      const result = await client.addMessageToContextThread(threadId, message);
      
      // Assert
      expect(mockService.addMessageToContextThread).toHaveBeenCalledWith(threadId, message);
      expect(result).toEqual(mockThread);
    });
  });
  
  describe('HttpContextThreadClient', () => {
    let client: ContextThreadClient;
    const baseURL = 'http://localhost:8080';
    
    beforeEach(() => {
      client = new HttpContextThreadClient(baseURL);
    });
    
    test('createContextThread should make HTTP request with correct params', async () => {
      // Arrange
      const params: CreateContextThreadParams = {
        title: 'Test Thread',
        metadata: { key: 'value' }
      };
      
      const mockThread = {
        id: '123',
        title: 'Test Thread',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [],
        metadata: { key: 'value' }
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: mockThread });
      
      // Act
      const result = await client.createContextThread(params);
      
      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/domain/threads', params);
      expect(result).toEqual(mockThread);
    });
    
    test('getContextThread should make HTTP request with correct id', async () => {
      // Arrange
      const threadId = '123';
      
      const mockThread = {
        id: threadId,
        title: 'Test Thread',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [],
        metadata: {}
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: mockThread });
      
      // Act
      const result = await client.getContextThread(threadId);
      
      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/v1/domain/threads/${threadId}`);
      expect(result).toEqual(mockThread);
    });
    
    test('updateContextThread should make HTTP request with correct params', async () => {
      // Arrange
      const threadId = '123';
      const params = {
        title: 'Updated Title',
        metadata: { updated: true }
      };
      
      const mockThread = {
        id: threadId,
        title: 'Updated Title',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [],
        metadata: { updated: true }
      };
      
      mockedAxios.put.mockResolvedValueOnce({ data: mockThread });
      
      // Act
      const result = await client.updateContextThread(threadId, params);
      
      // Assert
      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/v1/domain/threads/${threadId}`, params);
      expect(result).toEqual(mockThread);
    });
    
    test('deleteContextThread should make HTTP request with correct id', async () => {
      // Arrange
      const threadId = '123';
      
      mockedAxios.delete.mockResolvedValueOnce({ status: 200 });
      
      // Act
      const result = await client.deleteContextThread(threadId);
      
      // Assert
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/v1/domain/threads/${threadId}`);
      expect(result).toBe(true);
    });
    
    test('addMessageToContextThread should make HTTP request with correct params', async () => {
      // Arrange
      const threadId = '123';
      const message: Omit<Message, 'id' | 'threadId'> = {
        role: 'user' as MessageRole,
        content: 'Hello world',
        createdAt: mockDate
      };
      
      const mockThread = {
        id: threadId,
        title: 'Test Thread',
        createdAt: mockDate,
        updatedAt: mockDate,
        messages: [
          {
            id: '456',
            threadId,
            ...message
          }
        ],
        metadata: {}
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: mockThread });
      
      // Act
      const result = await client.addMessageToContextThread(threadId, message);
      
      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(`/api/v1/domain/threads/${threadId}/messages`, message);
      expect(result).toEqual(mockThread);
    });
    
    test('getContextThread should return null when thread not found', async () => {
      // Arrange
      const threadId = '123';
      
      const error = new Error('Not found');
      // Need to add response property for axios error handling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).response = { status: 404 };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);
      
      // Act
      const result = await client.getContextThread(threadId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('Factory Function', () => {
    beforeEach(() => {
      // Reset environment variables that might affect tests
      process.env.DOMAIN_CLIENT_MODE = undefined;
    });
    
    test('should return DirectContextThreadClient when mode is direct', () => {
      // Arrange
      process.env.DOMAIN_CLIENT_MODE = 'direct';
      
      // Act
      const client = getContextThreadClient(mockService);
      
      // Assert
      expect(client).toBeInstanceOf(DirectContextThreadClient);
    });
    
    test('should return DirectContextThreadClient with provided service', () => {
      // Act
      const client = getContextThreadClient(mockService);
      
      // Assert
      expect(client).toBeInstanceOf(DirectContextThreadClient);
    });
  });
});
