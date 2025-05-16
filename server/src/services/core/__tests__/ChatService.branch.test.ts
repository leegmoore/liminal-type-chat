/**
 * Tests for ChatService focusing on branch coverage
 */
import { ChatService } from '../ChatService';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../ContextThreadService';
import { _LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
// Imported but used implicitly in tests
import { 
  _LlmErrorCode, 
  _LlmModelInfo, 
  _LlmProvider, 
  _LlmServiceError 
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

describe('ChatService - Branch Coverage Tests', () => {
  let chatService: ChatService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create chat service
    chatService = new ChatService(mockLlmApiKeyManager, mockContextThreadService);
  });
  
  describe('getFormattedMessagesForLlm', () => {
    it('should filter out assistant messages with empty content', async () => {
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
            content: '', // Empty content should be filtered out
            status: 'complete' 
          },
          { 
            id: 'msg-3', 
            threadId: 'thread-123', 
            role: 'assistant', 
            content: 'Hi there', 
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
      // Assert that assistant message with empty content was filtered out
      expect(result.length).toBe(2);
      expect(result.findIndex(m => m.role === 'assistant' && m.content === '')).toBe(-1);
    });
  });
  
  describe('completeChatPrompt', () => {
    it('should handle threads with no existing messages', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: [] // Empty messages array
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
      expect(result).toBeDefined();
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        // Should only contain the new user message since there are no existing messages
        [{ role: 'user', content: 'Hello' }],
        expect.anything()
      );
    });
    
    it('should use provided model ID and options', async () => {
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
          modelId: 'gpt-4',
          provider: 'openai'
        }
      });
      
      mockLlmService.sendPrompt.mockResolvedValue({
        content: 'Hi there',
        modelId: 'gpt-4',
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
        modelId: 'gpt-4', // Custom model ID
        threadId: 'thread-123',
        options: {
          temperature: 0.7,
          maxTokens: 100,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
          stop: ['\n', 'Human:']
        }
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        expect.anything(),
        {
          modelId: 'gpt-4',
          temperature: 0.7,
          maxTokens: 100,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
          stop: ['\n', 'Human:']
        }
      );
    });
  });
  
  describe('streamChatCompletion', () => {
    it('should handle stream callback with empty content', async () => {
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
          content: 'Hello again',
          status: 'complete'
        })
        .mockResolvedValueOnce(assistantMessage); // Assistant message placeholder
      
      // Mock the streamPrompt implementation to send empty content
      mockLlmService.streamPrompt.mockImplementation(async (_messages, callback) => {
        // Send a chunk with empty content
        callback({
          content: '', // Empty content
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        
        // Then a chunk with content
        callback({
          content: 'Hello!',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: { finishReason: 'stop' }
        });
      });
      
      // Prepare to capture the chunks sent to the callback
      const callbackSpy = jest.fn();
      
      // Act
      await chatService.streamChatCompletion('user-123', {
        prompt: 'Hello again',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, callbackSpy);
      
      // Assert
      expect(callbackSpy).toHaveBeenCalledTimes(2);
      
      // First chunk with empty content
      expect(callbackSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
        content: '',
        done: false
      }));
      
      // Second chunk with content and finish reason
      expect(callbackSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
        content: 'Hello!',
        done: true
      }));
      
      // The first call to updateMessage should have empty content
      expect(mockContextThreadService.updateMessage).toHaveBeenNthCalledWith(1, 
        'thread-123', 
        assistantMessage.id, 
        expect.objectContaining({
          content: '', // Empty accumulated content
          status: 'streaming' // Still streaming
        })
      );
      
      // The second call should have the content
      expect(mockContextThreadService.updateMessage).toHaveBeenNthCalledWith(2, 
        'thread-123', 
        assistantMessage.id, 
        expect.objectContaining({
          content: 'Hello!', // Accumulated content
          status: 'complete' // Complete status
        })
      );
    });
    
    it('should update message metadata with additional properties', async () => {
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
          provider: 'openai',
          customField: 'should be preserved' // Custom field that should be preserved
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
        // Simulate a final chunk with usage stats
        callback({
          content: 'Why did the chicken cross the road?',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: { finishReason: 'stop' },
          usage: {
            promptTokens: 10,
            completionTokens: 8,
            totalTokens: 18
          }
        });
      });
      
      // Act
      await chatService.streamChatCompletion('user-123', {
        prompt: 'Tell me a joke',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn());
      
      // Assert
      // Check that metadata preserves existing fields and adds new ones
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        assistantMessage.id,
        expect.objectContaining({
          metadata: expect.objectContaining({
            customField: 'should be preserved', // Original field preserved
            modelId: 'gpt-3.5-turbo',
            provider: 'openai',
            usage: { // New usage field added
              promptTokens: 10,
              completionTokens: 8,
              totalTokens: 18
            },
            finishReason: 'stop' // New finish reason added
          })
        })
      );
    });
    
    it('should handle unknown error types in updateMessage', async () => {
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
      
      // Mock updateMessage to throw a non-Error object (like a string or null)
      const nonErrorObject = 'This is not an Error object';
      mockContextThreadService.updateMessage.mockImplementation(() => {
        throw nonErrorObject;
      });
      
      // Mock the streamPrompt implementation
      mockLlmService.streamPrompt.mockImplementation(async (_messages, callback) => {
        // Send a single chunk
        callback({
          content: 'Hello there!',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: { finishReason: 'stop' }
        });
      });
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      await chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn());
      
      // Assert - should log "Unknown error" since the error wasn't an Error instance
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating message: Unknown error');
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
    
    it('should handle non-Error objects during updateMessage', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: []
      });
      
      mockContextThreadService.addMessage
        .mockResolvedValueOnce({ // User message
          id: 'msg-1',
          threadId: 'thread-123',
          role: 'user',
          content: 'Hello',
          status: 'complete'
        })
        .mockResolvedValueOnce({ // Assistant message placeholder
          id: 'msg-2',
          threadId: 'thread-123',
          role: 'assistant',
          content: '',
          status: 'streaming',
          metadata: {
            modelId: 'gpt-3.5-turbo',
            provider: 'openai'
          }
        });
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock updateMessage to throw a non-Error object during the first call only
      // This is to test the error handling in the try/catch block in streamPrompt callback
      let callCount = 0;
      mockContextThreadService.updateMessage.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw 'This is not an Error object';
        }
        // Don't throw on subsequent calls
        return Promise.resolve();
      });

      // Mock streamPrompt behavior to trigger callback
      mockLlmService.streamPrompt.mockImplementation((_messages, callback) => {
        callback({
          content: 'Some content',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          metadata: {}
        });
        return Promise.resolve();
      });
      
      // Act - shouldn't throw since we're handling the error in the callback
      await chatService.streamChatCompletion('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        threadId: 'thread-123'
      }, jest.fn());
      
      // Assert - should log "Unknown error" since the error wasn't an Error instance
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating message: Unknown error');
      
      // Clean up
      consoleErrorSpy.mockRestore();
      
      // Verify updateMessage was called with correct params
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        'thread-123',
        'msg-2',
        expect.anything()
      );
    });
  });
});