import { AnthropicService } from '../anthropic/AnthropicService';
import { LlmErrorCode, LlmServiceError } from '../ILlmService';

// Mock the Anthropic SDK client
jest.mock('@anthropic-ai/sdk', () => {
  return {
    Anthropic: jest.fn().mockImplementation(() => {
      return {
        models: {
          list: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'claude-3-opus-20240229',
                name: 'Claude 3 Opus',
                description: 'Anthropic\'s most powerful model',
                context_window: 200000,
                max_tokens: 4096
              },
              {
                id: 'claude-3-sonnet-20240229',
                name: 'Claude 3 Sonnet',
                description: 'Excellent balance of intelligence and speed',
                context_window: 200000,
                max_tokens: 4096
              },
              {
                id: 'claude-3-haiku-20240307',
                name: 'Claude 3 Haiku',
                description: 'Fast and compact model',
                context_window: 200000,
                max_tokens: 4096
              }
            ]
          }),
        },
        messages: {
          create: jest.fn().mockImplementation(async (params) => {
            if (params.model === 'error-model') {
              throw new Error('Model not found');
            }
            
            if (params.stream) {
              // Mock streaming response
              const eventStream = {
                [Symbol.asyncIterator]: function* () {
                  yield {
                    type: 'message_start',
                    message: {
                      id: 'msg_abc123',
                      model: params.model,
                      role: 'assistant',
                      content: [],
                      usage: {
                        input_tokens: 10,
                        output_tokens: 0
                      }
                    }
                  };
                  yield {
                    type: 'content_block_start',
                    content_block: {
                      type: 'text',
                      index: 0
                    }
                  };
                  yield {
                    type: 'content_block_delta',
                    delta: {
                      type: 'text_delta',
                      text: 'Hello'
                    },
                    index: 0
                  };
                  yield {
                    type: 'content_block_delta',
                    delta: {
                      type: 'text_delta',
                      text: ' world'
                    },
                    index: 0
                  };
                  yield {
                    type: 'content_block_delta',
                    delta: {
                      type: 'text_delta',
                      text: '!'
                    },
                    index: 0
                  };
                  yield {
                    type: 'content_block_stop',
                    index: 0
                  };
                  yield {
                    type: 'message_delta',
                    delta: {
                      stop_reason: 'end_turn',
                      stop_sequence: null
                    },
                    usage: {
                      output_tokens: 3
                    }
                  };
                  yield {
                    type: 'message_stop'
                  };
                }
              };
              return eventStream;
            }
            
            // Mock non-streaming response
            return {
              id: 'msg_abc123',
              model: params.model,
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: 'This is a test response from Claude'
                }
              ],
              stop_reason: 'end_turn',
              stop_sequence: null,
              usage: {
                input_tokens: 10,
                output_tokens: 20
              }
            };
          }),
        }
      };
    })
  };
});

describe('AnthropicService', () => {
  let anthropicService: AnthropicService;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    anthropicService = new AnthropicService(mockApiKey);
  });
  
  describe('constructor', () => {
    it('should throw an error if API key is not provided', () => {
      expect(() => new AnthropicService('')).toThrow(LlmServiceError);
      expect(() => new AnthropicService('')).toThrow(LlmErrorCode.INVALID_API_KEY);
    });
  });
  
  describe('listModels', () => {
    it('should list available models', async () => {
      const models = await anthropicService.listModels();
      
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBe(3);
      
      // Check the model has the correct structure
      const model = models[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('provider', 'anthropic');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('maxTokens');
      expect(model).toHaveProperty('supportsStreaming', true);
      expect(model).toHaveProperty('contextWindow');
    });
  });
  
  describe('sendPrompt', () => {
    it('should send a prompt and return a response', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const response = await anthropicService.sendPrompt(messages, { modelId: 'claude-3-opus-20240229' });
      
      expect(response).toHaveProperty('content', 'This is a test response from Claude');
      expect(response).toHaveProperty('modelId', 'claude-3-opus-20240229');
      expect(response).toHaveProperty('provider', 'anthropic');
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('promptTokens', 10);
      expect(response.usage).toHaveProperty('completionTokens', 20);
      expect(response.usage).toHaveProperty('totalTokens', 30);
    });
    
    it('should use a default model if none specified', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const response = await anthropicService.sendPrompt(messages);
      
      // Check it used the default model (claude-3-sonnet by default)
      expect(response.modelId).toBe('claude-3-sonnet-20240229');
    });
    
    it('should handle API errors', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      await expect(
        anthropicService.sendPrompt(messages, { modelId: 'error-model' })
      ).rejects.toThrow(LlmServiceError);
    });
  });
  
  describe('streamPrompt', () => {
    it('should stream responses', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { modelId: 'claude-3-opus-20240229' });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls.length).toBeGreaterThan(1);
      
      // Accumulated content from all chunks should equal "Hello world!"
      const accumulatedContent = mockCallback.mock.calls
        .map(call => call[0].content)
        .join('');
      expect(accumulatedContent).toContain('Hello world!');
      
      // Last chunk should have finishReason
      const lastResponse = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastResponse.metadata.finishReason).toBe('stop');
    });
    
    it('should use default model if none specified', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback);
      
      // Check at least one chunk has the default model ID
      const hasDefaultModel = mockCallback.mock.calls.some(
        call => call[0].modelId === 'claude-3-sonnet-20240229'
      );
      expect(hasDefaultModel).toBe(true);
    });
  });
  
  describe('validateApiKey', () => {
    it('should validate API key by testing models list', async () => {
      const result = await anthropicService.validateApiKey('test-api-key');
      expect(result).toBe(true);
    });
    
    it('should return false if models list fails', async () => {
      // Mock the models.list method to throw an error
      const Anthropic = require('@anthropic-ai/sdk').Anthropic;
      jest.spyOn(Anthropic.prototype.models, 'list')
        .mockRejectedValueOnce(new Error('Invalid API key'));
      
      const result = await anthropicService.validateApiKey('invalid-key');
      expect(result).toBe(false);
    });
  });
});