/**
 * Tests for ChatService error handling
 */
import { ChatService } from '../ChatService';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../ContextThreadService';
import { 
  LlmErrorCode, 
  LlmServiceError 
} from '../../../providers/llm/ILlmService';

// Mock LlmApiKeyManager
const mockLlmApiKeyManager: jest.Mocked<LlmApiKeyManager> = {
  hasApiKey: jest.fn(),
  getApiKey: jest.fn(),
  storeApiKey: jest.fn(),
  deleteApiKey: jest.fn()
} as unknown as jest.Mocked<LlmApiKeyManager>;

// Mock ContextThreadService
const mockContextThreadService: jest.Mocked<ContextThreadService> = {
  createThread: jest.fn(),
  getThread: jest.fn(),
  listThreads: jest.fn(),
  updateThread: jest.fn(),
  deleteThread: jest.fn(),
  addMessage: jest.fn(),
  updateMessage: jest.fn()
} as unknown as jest.Mocked<ContextThreadService>;

// Mock LLM Service
const mockLlmService = {
  listModels: jest.fn(),
  sendPrompt: jest.fn(),
  streamPrompt: jest.fn(),
  validateApiKey: jest.fn()
};

// Mock LlmServiceFactory
jest.mock('../../../providers/llm/LlmServiceFactory', () => ({
  LlmServiceFactory: {
    createService: jest.fn(() => mockLlmService),
    getDefaultModel: jest.fn((provider) => provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku')
  }
}));

describe('ChatService - Error Handling', () => {
  let chatService: ChatService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Common test setup
    mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
    mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
    
    mockContextThreadService.getThread.mockResolvedValue({
      id: 'thread-123',
      title: 'Test Thread',
      messages: []
    });
    
    // Create chat service
    chatService = new ChatService(mockLlmApiKeyManager, mockContextThreadService);
  });
  
  describe('streamChatCompletion error handling', () => {
    it('should update the message with error status for LlmServiceError', async () => {
      // Arrange
      const assistantMessage = {
        id: 'msg-2',
        threadId: 'thread-123',
        role: 'assistant',
        content: '',
        status: 'streaming',
        metadata: {
          modelId: 'gpt-3.5-turbo',
          provider: 'openai'
        }
      };
      
      mockContextThreadService.addMessage
        .mockResolvedValueOnce({ // User message
          id: 'msg-1',
          threadId: 'thread-123',
          role: 'user',
          content: 'Hello',
          status: 'complete'
        })
        .mockResolvedValueOnce(assistantMessage);
      
      // Create a specific LlmServiceError
      const llmError = new LlmServiceError(
        'Rate limit exceeded',
        LlmErrorCode.RATE_LIMIT_EXCEEDED,
        'Please try again later'
      );
      
      // Mock streamPrompt to reject with the LlmServiceError
      mockLlmService.streamPrompt.mockRejectedValue(llmError);
      
      // Act & Assert
      await expect(chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn())).rejects.toEqual(llmError);
      
      // Verify error was properly saved to the message metadata
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        'msg-2',
        expect.objectContaining({
          status: 'error',
          metadata: expect.objectContaining({
            error: expect.objectContaining({
              message: 'Rate limit exceeded',
              code: LlmErrorCode.RATE_LIMIT_EXCEEDED,
              details: 'Please try again later'
            })
          })
        })
      );
    });
    
    it('should update the message with generic error status for non-LlmServiceError', async () => {
      // Arrange
      const assistantMessage = {
        id: 'msg-2',
        threadId: 'thread-123',
        role: 'assistant',
        content: '',
        status: 'streaming',
        metadata: {
          modelId: 'gpt-3.5-turbo',
          provider: 'openai'
        }
      };
      
      mockContextThreadService.addMessage
        .mockResolvedValueOnce({ // User message
          id: 'msg-1',
          threadId: 'thread-123',
          role: 'user',
          content: 'Hello',
          status: 'complete'
        })
        .mockResolvedValueOnce(assistantMessage);
      
      // Standard Error object
      const standardError = new Error('Network error occurred');
      
      // Mock streamPrompt to reject with a standard Error
      mockLlmService.streamPrompt.mockRejectedValue(standardError);
      
      // Act & Assert
      await expect(chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn())).rejects.toEqual(standardError);
      
      // Verify generic error was properly saved to the message metadata
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        'msg-2',
        expect.objectContaining({
          status: 'error',
          metadata: expect.objectContaining({
            error: expect.objectContaining({
              message: 'Network error occurred',
              code: LlmErrorCode.UNKNOWN_ERROR
            })
          })
        })
      );
    });
    
    it('should handle non-Error objects in the streamPrompt catch block', async () => {
      // Arrange
      const assistantMessage = {
        id: 'msg-2',
        threadId: 'thread-123',
        role: 'assistant',
        content: '',
        status: 'streaming',
        metadata: {
          modelId: 'gpt-3.5-turbo',
          provider: 'openai'
        }
      };
      
      mockContextThreadService.addMessage
        .mockResolvedValueOnce({ // User message
          id: 'msg-1',
          threadId: 'thread-123',
          role: 'user',
          content: 'Hello',
          status: 'complete'
        })
        .mockResolvedValueOnce(assistantMessage);
      
      // Non-Error object (string, number, object, etc.)
      const nonErrorObject = { errorCode: 1001, text: 'Something went wrong' };
      
      // Mock streamPrompt to reject with a non-Error object
      mockLlmService.streamPrompt.mockRejectedValue(nonErrorObject);
      
      // Act & Assert
      await expect(chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn())).rejects.toEqual(nonErrorObject);
      
      // Verify error was properly saved to the message metadata with string conversion
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        'msg-2',
        expect.objectContaining({
          status: 'error',
          metadata: expect.objectContaining({
            error: expect.objectContaining({
              message: String(nonErrorObject),
              code: LlmErrorCode.UNKNOWN_ERROR
            })
          })
        })
      );
    });
    
    it('should handle errors when streamChatCompletion has no assistant message', async () => {
      // Arrange - return null for the assistant message
      mockContextThreadService.addMessage
        .mockResolvedValueOnce({ // User message
          id: 'msg-1',
          threadId: 'thread-123',
          role: 'user',
          content: 'Hello',
          status: 'complete'
        })
        .mockResolvedValueOnce(null); // Assistant message is null
      
      const streamError = new Error('Stream error');
      mockLlmService.streamPrompt.mockRejectedValue(streamError);
      
      // Act & Assert
      await expect(chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn())).rejects.toEqual(streamError);
      
      // Verify the empty ID is used
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        '', // Empty string because assistantMessage is null
        expect.objectContaining({
          status: 'error'
        })
      );
    });
  });
});