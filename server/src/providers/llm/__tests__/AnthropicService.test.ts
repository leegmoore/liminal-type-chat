import { AnthropicService } from '../anthropic/AnthropicService';
import { LlmErrorCode, LlmServiceError } from '../ILlmService';

// Define a mock Anthropic API error class
class MockAPIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// Mock message create function
interface AnthropicMessageParams {
  model: string;
  messages: Array<{role: string; content: string}>;
  max_tokens?: number;
  [key: string]: unknown;
}

const mockCreate = jest.fn().mockImplementation(async (params: AnthropicMessageParams) => {
  if (params.model === 'error-model') {
    throw new MockAPIError('Model not found', 404);
  }
  
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
});

// Mock message stream function
const mockStream = jest.fn().mockImplementation(async (params: AnthropicMessageParams) => {
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
});

// Create a mock constructor function
interface AnthropicConfig {
  apiKey: string;
  [key: string]: unknown;
}

function MockAnthropic(config: AnthropicConfig) {
  this.apiKey = config.apiKey;
  this.messages = {
    create: mockCreate,
    stream: mockStream
  };
}

// Add the custom error class
MockAnthropic.APIError = MockAPIError;

// Mock the SDK
jest.mock('@anthropic-ai/sdk', () => {
  return MockAnthropic;
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
      
      // Test that the error contains the right error code
      try {
        new AnthropicService('');
      } catch (error) {
        expect(error).toBeInstanceOf(LlmServiceError);
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_API_KEY);
      }
    });
  });
  
  describe('listModels', () => {
    it('should list available models', async () => {
      const models = await anthropicService.listModels();
      
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBe(4); // There are 4 models in the ANTHROPIC_MODELS object
      
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
      
      // Check it used the default model (claude-3.7-sonnet by default)
      expect(response.modelId).toBe('claude-3-7-sonnet-20250219');
    });
    
    it('should handle API errors', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      // Reset mock state
      mockCreate.mockClear();
      
      // Test basic error throwing
      await expect(
        anthropicService.sendPrompt(messages, { modelId: 'error-model' })
      ).rejects.toThrow(LlmServiceError);
      
      // Test error code mapping
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-model' });
      } catch (error) {
        expect(error).toBeInstanceOf(LlmServiceError);
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.MODEL_NOT_FOUND);
      }
      
      // Verify call was made with correct parameters
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        model: 'error-model'
      }));
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
        call => call[0].modelId === 'claude-3-7-sonnet-20250219'
      );
      expect(hasDefaultModel).toBe(true);
    });
  });
  
  describe('validateApiKey', () => {
    it('should validate API key by testing a message create call', async () => {
      // Reset mock state and make it succeed
      mockCreate.mockClear();
      mockCreate.mockResolvedValueOnce({
        id: 'msg_test',
        model: 'claude-3-7-sonnet-20250219',
        role: 'assistant',
        content: [{ type: 'text', text: 'Test' }]
      });
      
      const result = await anthropicService.validateApiKey('test-api-key');
      
      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
    });
    
    it('should return false if validation fails', async () => {
      // Reset mock state and make it fail
      mockCreate.mockClear();
      mockCreate.mockRejectedValueOnce(new MockAPIError('Invalid API key', 401));
      
      const result = await anthropicService.validateApiKey('invalid-key');
      
      expect(result).toBe(false);
      expect(mockCreate).toHaveBeenCalled();
    });
  });
});