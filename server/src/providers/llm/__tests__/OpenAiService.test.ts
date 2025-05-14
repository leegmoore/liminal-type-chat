import { OpenAiService } from '../openai/OpenAiService';
import { LlmErrorCode, LlmServiceError } from '../ILlmService';

// Mock the OpenAI API
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          list: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'gpt-4',
                object: 'model',
                created: 1687882410,
                owned_by: 'openai'
              },
              {
                id: 'gpt-3.5-turbo',
                object: 'model',
                created: 1677610602,
                owned_by: 'openai'
              }
            ]
          }),
        },
        chat: {
          completions: {
            create: jest.fn().mockImplementation(async (params) => {
              if (params.model === 'error-model') {
                throw new Error('Model not found');
              }
              
              if (params.stream) {
                // Mock streaming response
                const stream = {
                  controller: {
                    close: jest.fn(),
                    abort: jest.fn(),
                  },
                  [Symbol.asyncIterator]: function* () {
                    yield {
                      choices: [{
                        delta: { content: 'Hello' },
                        index: 0,
                      }],
                    };
                    yield {
                      choices: [{
                        delta: { content: ' world' },
                        index: 0,
                      }],
                    };
                    yield {
                      choices: [{
                        delta: { content: '!' },
                        index: 0,
                        finish_reason: 'stop',
                      }],
                    };
                  },
                };
                return stream;
              }
              
              // Mock non-streaming response
              return {
                choices: [
                  {
                    message: {
                      content: 'This is a test response',
                      role: 'assistant',
                    },
                    finish_reason: 'stop',
                    index: 0,
                  },
                ],
                model: params.model,
                object: 'chat.completion',
                usage: {
                  prompt_tokens: 10,
                  completion_tokens: 20,
                  total_tokens: 30,
                },
              };
            }),
          },
        },
      };
    }),
  };
});

describe('OpenAiService', () => {
  let openAiService: OpenAiService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    openAiService = new OpenAiService(mockApiKey);
  });

  describe('constructor', () => {
    it('should throw an error if API key is not provided', () => {
      expect(() => new OpenAiService('')).toThrow(LlmServiceError);
      expect(() => new OpenAiService('')).toThrow(LlmErrorCode.INVALID_API_KEY);
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const models = await openAiService.listModels();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);
      
      // Check the model has the correct structure
      const model = models[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('provider', 'openai');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('maxTokens');
      expect(model).toHaveProperty('supportsStreaming');
    });
  });

  describe('sendPrompt', () => {
    it('should send a prompt and return a response', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const response = await openAiService.sendPrompt(messages, { modelId: 'gpt-4' });
      
      expect(response).toHaveProperty('content', 'This is a test response');
      expect(response).toHaveProperty('modelId', 'gpt-4');
      expect(response).toHaveProperty('provider', 'openai');
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('promptTokens', 10);
      expect(response.usage).toHaveProperty('completionTokens', 20);
      expect(response.usage).toHaveProperty('totalTokens', 30);
    });

    it('should use a default model if none specified', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const response = await openAiService.sendPrompt(messages);
      
      // Check it used the default model
      expect(response.modelId).toBe('gpt-3.5-turbo');
    });

    it('should handle API errors', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      await expect(
        openAiService.sendPrompt(messages, { modelId: 'error-model' })
      ).rejects.toThrow(LlmServiceError);
    });
  });

  describe('streamPrompt', () => {
    it('should stream responses', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const mockCallback = jest.fn();
      
      await openAiService.streamPrompt(messages, mockCallback, { modelId: 'gpt-4' });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls.length).toBeGreaterThan(1);
      
      // First chunk should have content
      const firstResponse = mockCallback.mock.calls[0][0];
      expect(firstResponse).toHaveProperty('content');
      expect(firstResponse.content.length).toBeGreaterThan(0);
      
      // Last chunk should have finishReason
      const lastResponse = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastResponse.metadata.finishReason).toBe('stop');
    });

    it('should use default model if none specified', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const mockCallback = jest.fn();
      
      await openAiService.streamPrompt(messages, mockCallback);
      
      // Check at least one chunk has the default model ID
      const hasDefaultModel = mockCallback.mock.calls.some(
        call => call[0].modelId === 'gpt-3.5-turbo'
      );
      expect(hasDefaultModel).toBe(true);
    });
  });

  describe('validateApiKey', () => {
    it('should validate API key by testing models list', async () => {
      const result = await openAiService.validateApiKey('test-api-key');
      expect(result).toBe(true);
    });

    it('should return false if models list fails', async () => {
      // Mock the models.list method to throw an error
      const originalOpenAI = require('openai').OpenAI;
      jest.spyOn(originalOpenAI.prototype.models, 'list')
        .mockRejectedValueOnce(new Error('Invalid API key'));
      
      const result = await openAiService.validateApiKey('invalid-key');
      expect(result).toBe(false);
    });
  });
});