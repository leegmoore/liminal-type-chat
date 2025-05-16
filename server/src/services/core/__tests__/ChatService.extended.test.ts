/**
 * Extended tests for the ChatService focusing on coverage gaps
 */
import { ChatService } from '../ChatService';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../ContextThreadService';
import { LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
import { 
  LlmErrorCode, 
  LlmModelInfo, 
  LlmProvider, 
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

describe('ChatService - Extended Tests', () => {
  let chatService: ChatService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create chat service
    chatService = new ChatService(mockLlmApiKeyManager, mockContextThreadService);
  });
  
  describe('getProviderName', () => {
    it('should return friendly name for OpenAI', () => {
      // Use @ts-expect-error to access the private method for testing
      // @ts-expect-error: testing private method
      const result = chatService.getProviderName('openai');
      
      expect(result).toBe('OpenAI');
    });
    
    it('should return friendly name for Anthropic', () => {
      // @ts-expect-error: testing private method
      const result = chatService.getProviderName('anthropic');
      
      expect(result).toBe('Anthropic');
    });
    
    it('should return provider identifier for unknown providers', () => {
      // @ts-expect-error: testing private method
      const result = chatService.getProviderName('unknown' as LlmProvider);
      
      expect(result).toBe('unknown');
    });
  });
  
  describe('getFormattedMessagesForLlm', () => {
    it('should throw error when thread is not found', async () => {
      // Arrange
      mockContextThreadService.getThread.mockResolvedValue(null);
      
      // Act & Assert
      // @ts-expect-error: testing private method
      await expect(chatService.getFormattedMessagesForLlm('nonexistent-thread'))
        .rejects.toThrow('Thread not found: nonexistent-thread');
    });
    
    it('should filter messages and format them correctly', async () => {
      // Arrange
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: [
          { 
            id: 'msg-1', 
            threadId: 'thread-123', 
            role: 'user', 
            content: 'Hello', 
            status: 'complete' 
          },
          { 
            id: 'msg-2', 
            threadId: 'thread-123', 
            role: 'assistant', 
            content: 'Hi there', 
            status: 'complete' 
          },
          // This message should be excluded (status not complete)
          { 
            id: 'msg-3', 
            threadId: 'thread-123', 
            role: 'user', 
            content: 'How are you?', 
            status: 'streaming' 
          },
          // This message should be excluded (empty assistant message)
          { 
            id: 'msg-4', 
            threadId: 'thread-123', 
            role: 'assistant', 
            content: '', 
            status: 'complete' 
          },
          // This message should be excluded (different thread ID)
          { 
            id: 'msg-5', 
            threadId: 'thread-456', 
            role: 'user', 
            content: 'Other thread message', 
            status: 'complete' 
          }
        ]
      });
      
      // Act
      // @ts-expect-error: testing private method
      const result = await chatService.getFormattedMessagesForLlm('thread-123');
      
      // Assert
      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' }
      ]);
    });
  });
  
  describe('getAvailableModels', () => {
    it('should throw error when user has no API key', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      // Act & Assert
      await expect(chatService.getAvailableModels('user-123', 'openai'))
        .rejects.toThrow('API key for OpenAI is required');
    });
    
    it('should return models when user has API key', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      const mockModels: LlmModelInfo[] = [
        { 
          id: 'gpt-3.5-turbo', 
          name: 'GPT-3.5 Turbo', 
          provider: 'openai',
          maxTokens: 4096,
          contextWindow: 16385,
          supportsStreaming: true
        }
      ];
      
      mockLlmService.listModels.mockResolvedValue(mockModels);
      
      // Act
      const result = await chatService.getAvailableModels('user-123', 'openai');
      
      // Assert
      expect(result).toEqual(mockModels);
      expect(mockLlmApiKeyManager.hasApiKey).toHaveBeenCalledWith('user-123', 'openai');
      expect(mockLlmApiKeyManager.getApiKey).toHaveBeenCalledWith('user-123', 'openai');
      expect(LlmServiceFactory.createService).toHaveBeenCalledWith('openai', 'sk-test-api-key');
      expect(mockLlmService.listModels).toHaveBeenCalled();
    });
  });
  
  describe('completeChatPrompt', () => {
    it('should use default model ID when not provided', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: []
      });
      
      mockContextThreadService.addMessage.mockResolvedValueOnce({
        id: 'msg-1',
        threadId: 'thread-123',
        role: 'user',
        content: 'Hello',
        status: 'complete'
      }).mockResolvedValueOnce({
        id: 'msg-2',
        threadId: 'thread-123',
        role: 'assistant',
        content: 'Hi there',
        status: 'complete',
        metadata: {
          modelId: 'gpt-3.5-turbo',
          provider: 'openai'
        }
      });
      
      mockLlmService.sendPrompt.mockResolvedValue({
        content: 'Hi there',
        modelId: 'gpt-3.5-turbo',
        provider: 'openai',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        },
        metadata: {
          finishReason: 'stop'
        }
      });
      
      // Act
      const result = await chatService.completeChatPrompt('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        threadId: 'thread-123'
      });
      
      // Assert
      expect(result).toEqual({
        threadId: 'thread-123',
        messageId: 'msg-2',
        content: 'Hi there',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        finishReason: 'stop',
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        }
      });
      
      // Verify the model ID was set to the default for the provider
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ modelId: 'gpt-3.5-turbo' })
      );
    });
    
    it('should throw error when thread is not found', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      mockContextThreadService.getThread.mockResolvedValue(null);
      
      // Act & Assert
      await expect(chatService.completeChatPrompt('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'nonexistent-thread'
      })).rejects.toThrow('Thread not found: nonexistent-thread');
    });
  });
  
  describe('streamChatCompletion', () => {
    it('should handle callback with streaming chunks', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: [
          { 
            id: 'msg-1', 
            threadId: 'thread-123', 
            role: 'user', 
            content: 'Hello', 
            status: 'complete' 
          }
        ]
      });
      
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
          content: 'Tell me a joke',
          status: 'complete'
        })
        .mockResolvedValueOnce(assistantMessage); // Assistant message placeholder
      
      // Mock the streamPrompt implementation
      mockLlmService.streamPrompt.mockImplementation(async (_messages, callback) => {
        // Simulate chunks
        callback({
          content: 'Why ',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        callback({
          content: 'did ',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        callback({
          content: 'the ',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        callback({
          content: 'chicken ',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        callback({
          content: 'cross ',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        callback({
          content: 'the road?',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: { finishReason: 'stop' },
          usage: {
            promptTokens: 10,
            completionTokens: 6,
            totalTokens: 16
          }
        });
      });
      
      // Prepare to capture the chunks sent to the callback
      const callbackSpy = jest.fn();
      
      // Act
      await chatService.streamChatCompletion('user-123', {
        prompt: 'Tell me a joke',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, callbackSpy);
      
      // Assert
      // Verify the callback was called with each chunk
      expect(callbackSpy).toHaveBeenCalledTimes(6);
      
      // Check first chunk
      expect(callbackSpy).toHaveBeenNthCalledWith(1, {
        threadId: 'thread-123',
        messageId: 'msg-2',
        content: 'Why ',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        done: false
      });
      
      // Check final chunk
      expect(callbackSpy).toHaveBeenLastCalledWith({
        threadId: 'thread-123',
        messageId: 'msg-2',
        content: 'the road?',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        finishReason: 'stop',
        done: true
      });
      
      // Verify updateMessage was called to update the message content
      expect(mockContextThreadService.updateMessage).toHaveBeenCalled();
    });
    
    it('should handle LLM service errors during streaming', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: []
      });
      
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
        .mockResolvedValueOnce(assistantMessage); // Assistant message placeholder
      
      // Mock streamPrompt to throw an error
      const serviceError = new LlmServiceError(
        'Rate limit exceeded',
        LlmErrorCode.RATE_LIMIT_EXCEEDED,
        'Please try again later'
      );
      mockLlmService.streamPrompt.mockRejectedValue(serviceError);
      
      // Act & Assert
      await expect(chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn())).rejects.toThrow(serviceError);
      
      // Verify the message was updated with error status
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        'msg-2',
        {
          status: 'error',
          metadata: expect.objectContaining({
            error: {
              message: 'Rate limit exceeded',
              code: LlmErrorCode.RATE_LIMIT_EXCEEDED,
              details: 'Please try again later'
            }
          })
        }
      );
    });
    
    it('should handle generic errors during streaming', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: []
      });
      
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
        .mockResolvedValueOnce(assistantMessage); // Assistant message placeholder
      
      // Mock streamPrompt to throw a generic error
      const genericError = new Error('Network error');
      mockLlmService.streamPrompt.mockRejectedValue(genericError);
      
      // Act & Assert
      await expect(chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn())).rejects.toThrow(genericError);
      
      // Verify the message was updated with error status
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        'msg-2',
        {
          status: 'error',
          metadata: expect.objectContaining({
            error: {
              message: 'Network error',
              code: LlmErrorCode.UNKNOWN_ERROR
            }
          })
        }
      );
    });
    
    it('should handle error in updateMessage during streaming', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: []
      });
      
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
        .mockResolvedValueOnce(assistantMessage); // Assistant message placeholder
      
      // Mock updateMessage to throw an error on first call, succeed on others
      let updateCalls = 0;
      mockContextThreadService.updateMessage.mockImplementation(() => {
        if (updateCalls === 0) {
          updateCalls++;
          throw new Error('Database error');
        }
        return Promise.resolve();
      });
      
      // Mock the streamPrompt implementation
      mockLlmService.streamPrompt.mockImplementation(async (_messages, callback) => {
        // Simulate two chunks
        callback({
          content: 'Hello ',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        callback({
          content: 'world!',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: { finishReason: 'stop' }
        });
      });
      
      // Create a spy for console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      await chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn());
      
      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error updating message: Database error');
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});