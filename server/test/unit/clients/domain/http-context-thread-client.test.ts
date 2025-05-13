/**
 * Unit tests for the HTTP Context Thread Client
 */
import axios from 'axios';
import { HttpContextThreadClient } from '../../../../src/clients/domain/http-context-thread-client';
import { ContextThread, CreateContextThreadParams, Message } from '../../../../src/types/domain';
import { AppError } from '../../../../src/utils/errors';

// Create mock functions
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockInterceptorsUse = jest.fn();

// Capture error handler for testing
let capturedErrorHandler: Function;

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      interceptors: {
        response: {
          use: (successFn: Function, errorFn: Function) => {
            mockInterceptorsUse(successFn, errorFn);
            capturedErrorHandler = errorFn;
            return successFn;
          }
        }
      }
    })),
    isAxiosError: jest.fn()
  };
});

// Mock Axios isAxiosError to return true for test objects
const mockIsAxiosError = axios.isAxiosError as jest.Mock;

describe('HttpContextThreadClient', () => {
  let httpClient: HttpContextThreadClient;
  
  // Sample thread data
  const mockThreadId = '123e4567-e89b-12d3-a456-426614174000';
  const mockThread: ContextThread = {
    id: mockThreadId,
    title: 'Test Thread',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    metadata: {}
  };
  
  // Sample message data
  const mockMessageContent: Omit<Message, 'id' | 'threadId'> = {
    role: 'user',
    content: 'Test message',
    createdAt: Date.now()
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
    mockInterceptorsUse.mockReset();
    mockIsAxiosError.mockReset();
    
    // Create a new HTTP client with a test base URL
    httpClient = new HttpContextThreadClient('http://test-api.example.com');
  });
  
  describe('constructor', () => {
    it('should create an axios instance with the correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://test-api.example.com',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });
  });
  
  describe('getThreads', () => {
    it('should call the API to get threads with default parameters', async () => {
      mockGet.mockResolvedValueOnce({
        data: { threads: [mockThread] }
      });
      
      const result = await httpClient.getThreads();
      
      expect(mockGet).toHaveBeenCalledWith('/api/v1/domain/threads', {
        params: { limit: 20, offset: 0 }
      });
      expect(result).toEqual([mockThread]);
    });
    
    it('should call the API with custom limit and offset', async () => {
      mockGet.mockResolvedValueOnce({
        data: { threads: [mockThread] }
      });
      
      const result = await httpClient.getThreads(10, 5);
      
      expect(mockGet).toHaveBeenCalledWith('/api/v1/domain/threads', {
        params: { limit: 10, offset: 5 }
      });
      expect(result).toEqual([mockThread]);
    });
    
    it('should handle API errors properly', async () => {
      const apiError = new Error('API error');
      mockGet.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.getThreads()).rejects.toThrow(apiError);
    });
  });
  
  describe('getContextThread', () => {
    it('should call the API to get a specific thread', async () => {
      mockGet.mockResolvedValueOnce({
        data: mockThread
      });
      
      const result = await httpClient.getContextThread(mockThreadId);
      
      expect(mockGet).toHaveBeenCalledWith(`/api/v1/domain/threads/${mockThreadId}`);
      expect(result).toEqual(mockThread);
    });
    
    it('should return null when thread is not found', async () => {
      const notFoundError = new Error('Not Found');
      // Set up the error to be identified as an Axios error with 404 status
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(notFoundError, 'response', {
        value: { status: 404 }
      });
      
      mockGet.mockRejectedValueOnce(notFoundError);
      
      const result = await httpClient.getContextThread('non-existent-id');
      
      expect(result).toBeNull();
    });
    
    it('should rethrow errors other than 404', async () => {
      const serverError = new Error('Server Error');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(serverError, 'response', {
        value: { status: 500 }
      });
      
      mockGet.mockRejectedValueOnce(serverError);
      
      await expect(httpClient.getContextThread(mockThreadId)).rejects.toThrow(serverError);
    });
  });
  
  describe('createContextThread', () => {
    it('should call the API to create a new thread', async () => {
      mockPost.mockResolvedValueOnce({
        data: mockThread
      });
      
      const createParams: CreateContextThreadParams = {
        title: 'Test Thread'
      };
      
      const result = await httpClient.createContextThread(createParams);
      
      expect(mockPost).toHaveBeenCalledWith('/api/v1/domain/threads', createParams);
      expect(result).toEqual(mockThread);
    });
    
    it('should handle API errors properly', async () => {
      const apiError = new Error('API error');
      mockPost.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.createContextThread({ title: 'Test' })).rejects.toThrow(apiError);
    });
  });
  
  describe('updateContextThread', () => {
    it('should call the API to update a thread', async () => {
      mockPut.mockResolvedValueOnce({
        data: { ...mockThread, title: 'Updated Title' }
      });
      
      const updateParams = {
        title: 'Updated Title'
      };
      
      const result = await httpClient.updateContextThread(mockThreadId, updateParams);
      
      expect(mockPut).toHaveBeenCalledWith(`/api/v1/domain/threads/${mockThreadId}`, updateParams);
      expect(result).toEqual({ ...mockThread, title: 'Updated Title' });
    });
    
    it('should return null when thread is not found', async () => {
      const notFoundError = new Error('Not Found');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(notFoundError, 'response', {
        value: { status: 404 }
      });
      
      mockPut.mockRejectedValueOnce(notFoundError);
      
      const result = await httpClient.updateContextThread('non-existent-id', { title: 'New Title' });
      
      expect(result).toBeNull();
    });
    
    it('should rethrow errors other than 404', async () => {
      const serverError = new Error('Server Error');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(serverError, 'response', {
        value: { status: 500 }
      });
      
      mockPut.mockRejectedValueOnce(serverError);
      
      await expect(httpClient.updateContextThread(mockThreadId, { title: 'New Title' })).rejects.toThrow(serverError);
    });
  });
  
  describe('deleteContextThread', () => {
    it('should call the API to delete a thread', async () => {
      mockDelete.mockResolvedValueOnce({});
      
      const result = await httpClient.deleteContextThread(mockThreadId);
      
      expect(mockDelete).toHaveBeenCalledWith(`/api/v1/domain/threads/${mockThreadId}`);
      expect(result).toBe(true);
    });
    
    it('should return false when thread is not found', async () => {
      const notFoundError = new Error('Not Found');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(notFoundError, 'response', {
        value: { status: 404 }
      });
      
      mockDelete.mockRejectedValueOnce(notFoundError);
      
      const result = await httpClient.deleteContextThread('non-existent-id');
      
      expect(result).toBe(false);
    });
    
    it('should rethrow errors other than 404', async () => {
      const serverError = new Error('Server Error');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(serverError, 'response', {
        value: { status: 500 }
      });
      
      mockDelete.mockRejectedValueOnce(serverError);
      
      await expect(httpClient.deleteContextThread(mockThreadId)).rejects.toThrow(serverError);
    });
  });
  
  describe('addMessageToContextThread', () => {
    it('should call the API to add a message to a thread', async () => {
      const updatedThread = {
        ...mockThread,
        messages: [{ id: 'msg-123', threadId: mockThreadId, ...mockMessageContent }]
      };
      
      mockPost.mockResolvedValueOnce({
        data: updatedThread
      });
      
      const result = await httpClient.addMessageToContextThread(mockThreadId, mockMessageContent);
      
      expect(mockPost).toHaveBeenCalledWith(
        `/api/v1/domain/threads/${mockThreadId}/messages`, 
        mockMessageContent
      );
      expect(result).toEqual(updatedThread);
    });
    
    it('should return null when thread is not found', async () => {
      const notFoundError = new Error('Not Found');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(notFoundError, 'response', {
        value: { status: 404 }
      });
      
      mockPost.mockRejectedValueOnce(notFoundError);
      
      const result = await httpClient.addMessageToContextThread('non-existent-id', mockMessageContent);
      
      expect(result).toBeNull();
    });
    
    it('should rethrow errors other than 404', async () => {
      const serverError = new Error('Server Error');
      mockIsAxiosError.mockReturnValueOnce(true);
      Object.defineProperty(serverError, 'response', {
        value: { status: 500 }
      });
      
      mockPost.mockRejectedValueOnce(serverError);
      
      await expect(httpClient.addMessageToContextThread(mockThreadId, mockMessageContent)).rejects.toThrow(serverError);
    });
  });
});