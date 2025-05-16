/**
 * Tests focused on increasing branch coverage in ChatService
 */
import { ChatService } from '../ChatService';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../ContextThreadService';
import { 
  _LlmModelInfo,
  LlmRequestOptions,
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

describe('ChatService - Branch Coverage', () => {
  let chatService: ChatService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create chat service
    chatService = new ChatService(mockLlmApiKeyManager, mockContextThreadService);
  });
  
  describe('completeChatPrompt', () => {
    it('should handle messages with different filter conditions', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('sk-test-api-key');
      
      // Thread with all types of messages (each representing a branch case)
      mockContextThreadService.getThread.mockResolvedValue({
        id: 'thread-123',
        title: 'Test Thread',
        messages: [
          // Normal user message
          {
            id: 'msg-1',
            threadId: 'thread-123',
            role: 'user',
            content: 'Hello',
            status: 'complete'
          },
          // Streaming message (not complete yet, should be filtered out)
          {
            id: 'msg-2',
            threadId: 'thread-123',
            role: 'assistant',
            content: 'partial response',
            status: 'streaming'
          },
          // Error message (should be filtered out)
          {
            id: 'msg-3',
            threadId: 'thread-123',
            role: 'assistant',
            content: 'error occurred',
            status: 'error'
          },
          // Assistant message with empty content (should be filtered out)
          {
            id: 'msg-4',
            threadId: 'thread-123',
            role: 'assistant',
            content: '',
            status: 'complete'
          },
          // Messages from a different thread (should be filtered out)
          {
            id: 'msg-5',
            threadId: 'different-thread',
            role: 'user',
            content: 'message from wrong thread',
            status: 'complete'
          },
          // Normal assistant message (should be included)
          {
            id: 'msg-6',
            threadId: 'thread-123',
            role: 'assistant',
            content: 'working response',
            status: 'complete'
          }
        ]
      });
      
      mockContextThreadService.addMessage
        .mockResolvedValueOnce({ // User message
          id: 'msg-new-1',
          threadId: 'thread-123',
          role: 'user',
          content: 'New prompt',
          status: 'complete'
        })
        .mockResolvedValueOnce({ // Assistant response
          id: 'msg-new-2',
          threadId: 'thread-123',
          role: 'assistant',
          content: 'New assistant response',
          status: 'complete',
          metadata: {
            modelId: 'gpt-3.5-turbo',
            provider: 'openai'
          }
        });
      
      mockLlmService.sendPrompt.mockResolvedValue({
        content: 'New assistant response',
        modelId: 'gpt-3.5-turbo',
        provider: 'openai',
        metadata: {
          finishReason: 'stop'
        }
      });
      
      // Act
      const result = await chatService.completeChatPrompt('user-123', {
        prompt: 'New prompt',
        provider: 'openai',
        threadId: 'thread-123'
      });
      
      // Assert - check that sendPrompt was called
      expect(mockLlmService.sendPrompt).toHaveBeenCalled();
      
      // Check that sendPrompt was called with the right format
      const sentMessages = mockLlmService.sendPrompt.mock.calls[0][0];
      
      // Verify the messages include the necessary content
      expect(sentMessages).toContainEqual({ role: 'user', content: 'Hello' });
      expect(sentMessages).toContainEqual({ role: 'assistant', content: 'working response' });
      expect(sentMessages).toContainEqual({ role: 'user', content: 'New prompt' });
      
      // Check final response
      expect(result).toMatchObject({
        threadId: 'thread-123',
        messageId: 'msg-new-2',
        content: 'New assistant response',
        model: 'gpt-3.5-turbo',
        provider: 'openai'
      });
    });
    
    it('should use default model when not provided', async () => {
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
        .mockResolvedValueOnce({ // Assistant response
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
        metadata: {
          finishReason: 'stop'
        }
      });
      
      // Act
      const result = await chatService.completeChatPrompt('user-123', {
        prompt: 'Hello',
        provider: 'openai', // No modelId provided
        threadId: 'thread-123'
      });
      
      // Assert - should use default model from LlmServiceFactory
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          modelId: 'gpt-3.5-turbo' // Default model for OpenAI
        })
      );
      
      expect(result.model).toBe('gpt-3.5-turbo');
    });
    
    it('should use custom model and options when provided', async () => {
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
        .mockResolvedValueOnce({ // Assistant response
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
        metadata: {
          finishReason: 'stop'
        }
      });
      
      // Custom options
      const customOptions: Partial<LlmRequestOptions> = {
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        presencePenalty: 0.1,
        frequencyPenalty: 0.2,
        stop: ['STOP', 'END']
      };
      
      // Act
      const result = await chatService.completeChatPrompt('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        modelId: 'gpt-4', // Custom model
        threadId: 'thread-123',
        options: customOptions
      });
      
      // Assert - should use custom model and options
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          modelId: 'gpt-4',
          ...customOptions
        })
      );
      
      expect(result.model).toBe('gpt-4');
    });
    
    it('should handle metadata and usage stats from LLM response', async () => {
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
        .mockResolvedValueOnce({ // Assistant response with metadata
          id: 'msg-2',
          threadId: 'thread-123',
          role: 'assistant',
          content: 'Hi there',
          status: 'complete',
          metadata: {
            modelId: 'gpt-3.5-turbo',
            provider: 'openai',
            usage: {
              promptTokens: 10,
              completionTokens: 15,
              totalTokens: 25
            },
            finishReason: 'stop'
          }
        });
      
      // Include all metadata and usage information
      mockLlmService.sendPrompt.mockResolvedValue({
        content: 'Hi there',
        modelId: 'gpt-3.5-turbo',
        provider: 'openai',
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        },
        metadata: {
          finishReason: 'stop',
          custom: 'value'
        }
      });
      
      // Act
      const result = await chatService.completeChatPrompt('user-123', {
        prompt: 'Hello',
        provider: 'openai',
        threadId: 'thread-123'
      });
      
      // Assert - check token usage and metadata
      expect(result).toMatchObject({
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        },
        finishReason: 'stop'
      });
      
      // Check metadata was properly stored
      expect(mockContextThreadService.addMessage).toHaveBeenCalledWith(
        'thread-123',
        expect.objectContaining({
          role: 'assistant',
          content: 'Hi there',
          status: 'complete',
          metadata: expect.objectContaining({
            modelId: 'gpt-3.5-turbo',
            provider: 'openai',
            usage: {
              promptTokens: 10,
              completionTokens: 15,
              totalTokens: 25
            },
            finishReason: 'stop'
          })
        })
      );
    });
  });
});