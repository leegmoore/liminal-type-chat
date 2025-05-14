import { ChatService, ChatCompletionRequest, ChatCompletionResponse } from '../ChatService';
import { LlmServiceFactory } from '../../../providers/llm/LlmServiceFactory';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ILlmService, LlmErrorCode, LlmServiceError } from '../../../providers/llm/ILlmService';
import { ContextThreadService } from '../ContextThreadService';

// Mock dependencies
jest.mock('../../../providers/llm/LlmServiceFactory');
jest.mock('../../../providers/llm/LlmApiKeyManager');
jest.mock('../ContextThreadService');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockLlmService: jest.Mocked<ILlmService>;
  let mockLlmApiKeyManager: jest.Mocked<LlmApiKeyManager>;
  let mockContextThreadService: jest.Mocked<ContextThreadService>;
  
  const userId = 'user123';
  const threadId = 'thread456';
  const provider = 'openai';
  const mockApiKey = 'sk-test-key';
  
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Setup mock services
    mockLlmService = {
      listModels: jest.fn(),
      sendPrompt: jest.fn(),
      streamPrompt: jest.fn(),
      validateApiKey: jest.fn()
    } as jest.Mocked<ILlmService>;
    
    mockLlmApiKeyManager = {
      getApiKey: jest.fn().mockResolvedValue(mockApiKey),
      hasApiKey: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<LlmApiKeyManager>;
    
    mockContextThreadService = {
      getThread: jest.fn(),
      addMessage: jest.fn(),
      updateMessage: jest.fn()
    } as unknown as jest.Mocked<ContextThreadService>;
    
    // Setup LlmServiceFactory mock
    jest.spyOn(LlmServiceFactory, 'createService').mockReturnValue(mockLlmService);
    
    // Create service
    chatService = new ChatService(mockLlmApiKeyManager, mockContextThreadService);
  });
  
  describe('completeChatPrompt', () => {
    const mockRequest: ChatCompletionRequest = {
      prompt: 'What is the capital of France?',
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      threadId,
    };
    
    const mockLlmResponse = {
      content: 'The capital of France is Paris.',
      modelId: 'gpt-3.5-turbo',
      provider: 'openai',
      usage: {
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18
      },
      metadata: {
        finishReason: 'stop'
      }
    };
    
    const mockThread = {
      id: threadId,
      title: 'Test Thread',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg1',
          threadId,
          role: 'user',
          content: 'Hello',
          createdAt: Date.now() - 500
        }
      ]
    };
    
    beforeEach(() => {
      // Mock implementation of sendPrompt
      mockLlmService.sendPrompt.mockResolvedValue(mockLlmResponse);
      
      // Mock implementation of getThread
      mockContextThreadService.getThread.mockResolvedValue(mockThread);
      
      // Mock implementation of addMessage
      mockContextThreadService.addMessage.mockImplementation(async (threadId, message) => {
        return {
          ...message,
          id: 'new-message-id',
          threadId,
          createdAt: Date.now()
        };
      });
    });
    
    it('should complete a chat prompt and save the messages', async () => {
      const response = await chatService.completeChatPrompt(userId, mockRequest);
      
      // Check LLM API key was retrieved
      expect(mockLlmApiKeyManager.getApiKey).toHaveBeenCalledWith(userId, provider);
      
      // Check LLM service was created
      expect(LlmServiceFactory.createService).toHaveBeenCalledWith(provider, mockApiKey);
      
      // Check thread was retrieved
      expect(mockContextThreadService.getThread).toHaveBeenCalledWith(threadId);
      
      // Check user message was added
      expect(mockContextThreadService.addMessage).toHaveBeenCalledWith(
        threadId,
        expect.objectContaining({
          role: 'user',
          content: mockRequest.prompt
        })
      );
      
      // Check LLM was called with thread history
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Hello' }),
          expect.objectContaining({ role: 'user', content: mockRequest.prompt })
        ]),
        expect.objectContaining({
          modelId: mockRequest.modelId
        })
      );
      
      // Check assistant message was added
      expect(mockContextThreadService.addMessage).toHaveBeenCalledWith(
        threadId,
        expect.objectContaining({
          role: 'assistant',
          content: mockLlmResponse.content
        })
      );
      
      // Check response structure
      expect(response).toEqual(expect.objectContaining({
        threadId,
        messageId: 'new-message-id',
        content: mockLlmResponse.content,
        model: mockLlmResponse.modelId,
        provider: mockLlmResponse.provider,
        finishReason: 'stop'
      }));
    });
    
    it('should throw error if user has no API key', async () => {
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      await expect(
        chatService.completeChatPrompt(userId, mockRequest)
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        chatService.completeChatPrompt(userId, mockRequest)
      ).rejects.toThrow('API key for OpenAI is required');
    });
    
    it('should throw error if thread is not found', async () => {
      mockContextThreadService.getThread.mockResolvedValue(null);
      
      await expect(
        chatService.completeChatPrompt(userId, mockRequest)
      ).rejects.toThrow('Thread not found');
    });
    
    it('should use default model if none provided', async () => {
      const request = { ...mockRequest };
      delete request.modelId;
      
      await chatService.completeChatPrompt(userId, request);
      
      expect(mockLlmService.sendPrompt).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          modelId: 'gpt-3.5-turbo' // Default model for OpenAI
        })
      );
    });
  });
  
  describe('streamChatCompletion', () => {
    const mockRequest: ChatCompletionRequest = {
      prompt: 'Tell me about Paris',
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      threadId,
    };
    
    const mockThread = {
      id: threadId,
      title: 'Test Thread',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg1',
          threadId,
          role: 'user',
          content: 'Hello',
          createdAt: Date.now() - 500
        }
      ]
    };
    
    beforeEach(() => {
      // Mock implementation of streamPrompt
      mockLlmService.streamPrompt.mockImplementation(async (messages, callback) => {
        // Simulate streaming chunks
        callback({
          content: 'Paris',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
          metadata: {}
        });
        
        callback({
          content: ' is the',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          usage: { promptTokens: 10, completionTokens: 2, totalTokens: 12 },
          metadata: {}
        });
        
        callback({
          content: ' capital of France.',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
          metadata: { finishReason: 'stop' }
        });
      });
      
      // Mock implementation of getThread
      mockContextThreadService.getThread.mockResolvedValue(mockThread);
      
      // Mock implementation of addMessage
      mockContextThreadService.addMessage.mockImplementation(async (threadId, message) => {
        return {
          ...message,
          id: 'new-message-id',
          threadId,
          createdAt: Date.now()
        };
      });
    });
    
    it('should stream chat completion', async () => {
      const mockCallback = jest.fn();
      
      await chatService.streamChatCompletion(userId, mockRequest, mockCallback);
      
      // Check LLM API key was retrieved
      expect(mockLlmApiKeyManager.getApiKey).toHaveBeenCalledWith(userId, provider);
      
      // Check LLM service was created
      expect(LlmServiceFactory.createService).toHaveBeenCalledWith(provider, mockApiKey);
      
      // Check thread was retrieved
      expect(mockContextThreadService.getThread).toHaveBeenCalledWith(threadId);
      
      // Check user message was added
      expect(mockContextThreadService.addMessage).toHaveBeenCalledWith(
        threadId,
        expect.objectContaining({
          role: 'user',
          content: mockRequest.prompt
        })
      );
      
      // Check LLM streaming was called
      expect(mockLlmService.streamPrompt).toHaveBeenCalled();
      
      // Check callback was called with chunks
      expect(mockCallback).toHaveBeenCalledTimes(3);
      
      // Check messages were updated as streaming progressed
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledTimes(3);
      
      // Check last update has full content
      const lastCall = mockContextThreadService.updateMessage.mock.calls[2];
      expect(lastCall[2]).toEqual(expect.objectContaining({
        content: 'Paris is the capital of France.',
        status: 'complete'
      }));
    });
    
    it('should handle streaming errors gracefully', async () => {
      const mockCallback = jest.fn();
      
      // Mock streamPrompt to throw error
      mockLlmService.streamPrompt.mockImplementation(async (messages, callback) => {
        // Send one chunk
        callback({
          content: 'Paris',
          modelId: 'gpt-3.5-turbo',
          provider: 'openai',
          usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
          metadata: {}
        });
        
        // Then throw an error
        throw new LlmServiceError('Stream error', LlmErrorCode.NETWORK_ERROR);
      });
      
      await expect(
        chatService.streamChatCompletion(userId, mockRequest, mockCallback)
      ).rejects.toThrow('Stream error');
      
      // Check message was updated with error status
      expect(mockContextThreadService.updateMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          status: 'error',
          metadata: expect.objectContaining({
            error: expect.objectContaining({
              code: LlmErrorCode.NETWORK_ERROR
            })
          })
        })
      );
    });
  });
  
  describe('getAvailableModels', () => {
    const mockModels = [
      {
        id: 'gpt-4',
        provider: 'openai',
        name: 'GPT-4',
        maxTokens: 8192,
        supportsStreaming: true
      },
      {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        name: 'GPT-3.5 Turbo',
        maxTokens: 4096,
        supportsStreaming: true
      }
    ];
    
    beforeEach(() => {
      mockLlmService.listModels.mockResolvedValue(mockModels);
    });
    
    it('should return available models for the provider', async () => {
      const models = await chatService.getAvailableModels(userId, provider);
      
      expect(models).toEqual(mockModels);
      expect(mockLlmApiKeyManager.getApiKey).toHaveBeenCalledWith(userId, provider);
      expect(LlmServiceFactory.createService).toHaveBeenCalledWith(provider, mockApiKey);
      expect(mockLlmService.listModels).toHaveBeenCalled();
    });
    
    it('should throw error if user has no API key', async () => {
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      await expect(
        chatService.getAvailableModels(userId, provider)
      ).rejects.toThrow('API key for OpenAI is required');
    });
  });
});