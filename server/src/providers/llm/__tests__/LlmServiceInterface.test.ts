import { 
  ILlmService, 
  LlmModelInfo, 
  LlmErrorCode, 
  LlmRequestOptions, 
  LlmResponse, 
  LlmServiceError 
} from '../ILlmService';

// Mock implementation for testing the interface
class MockLlmService implements ILlmService {
  async listModels(): Promise<LlmModelInfo[]> {
    return [
      {
        id: 'test-model-1',
        provider: 'test-provider',
        name: 'Test Model 1',
        maxTokens: 4096,
        supportsStreaming: true
      },
      {
        id: 'test-model-2',
        provider: 'test-provider',
        name: 'Test Model 2',
        maxTokens: 8192,
        supportsStreaming: false
      }
    ];
  }

  async sendPrompt(
    messages: Array<{ role: string; content: string }>, 
    options?: LlmRequestOptions
  ): Promise<LlmResponse> {
    // For testing that the interface methods are callable with proper types
    if (messages.length === 0) {
      throw new LlmServiceError(
        'No messages provided',
        LlmErrorCode.INVALID_REQUEST, 
        'The messages array cannot be empty'
      );
    }

    return {
      content: 'This is a test response',
      modelId: options?.modelId || 'default-model',
      provider: 'test-provider',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      },
      metadata: {
        finishReason: 'stop'
      }
    };
  }

  async streamPrompt(
    messages: Array<{ role: string; content: string }>, 
    callback: (chunk: LlmResponse) => void, 
    options?: LlmRequestOptions
  ): Promise<void> {
    // For testing that the streaming interface is callable with proper types
    if (messages.length === 0) {
      throw new LlmServiceError(
        'No messages provided',
        LlmErrorCode.INVALID_REQUEST, 
        'The messages array cannot be empty'
      );
    }

    if (!options?.modelId) {
      throw new LlmServiceError(
        'Model ID required for streaming',
        LlmErrorCode.INVALID_REQUEST, 
        'A model ID must be specified for streaming requests'
      );
    }

    // Simulate streaming with a single chunk
    callback({
      content: 'This is a streaming test response',
      modelId: options.modelId,
      provider: 'test-provider',
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15
      },
      metadata: {
        finishReason: undefined  // Not finished yet
      }
    });
    
    // Simulate final chunk
    callback({
      content: '',
      modelId: options.modelId,
      provider: 'test-provider',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      metadata: {
        finishReason: 'stop'
      }
    });
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    return apiKey === 'valid-test-key';
  }
}

describe('LLM Service Interface', () => {
  let llmService: ILlmService;

  beforeEach(() => {
    llmService = new MockLlmService();
  });

  describe('Contract tests for ILlmService implementation', () => {
    it('should list available models', async () => {
      const models = await llmService.listModels();
      
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);
      
      // Verify model info structure
      const model = models[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('maxTokens');
      expect(model).toHaveProperty('supportsStreaming');
    });

    it('should send a prompt and receive a response', async () => {
      const messages = [
        { role: 'user', content: 'Hello, world!' }
      ];
      
      const response = await llmService.sendPrompt(messages, { modelId: 'test-model' });
      
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('modelId');
      expect(response).toHaveProperty('provider');
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('promptTokens');
      expect(response.usage).toHaveProperty('completionTokens');
      expect(response.usage).toHaveProperty('totalTokens');
      expect(response).toHaveProperty('metadata');
    });

    it('should reject empty message arrays', async () => {
      await expect(llmService.sendPrompt([])).rejects.toThrow(LlmServiceError);
    });

    it('should support streaming responses', async () => {
      const messages = [
        { role: 'user', content: 'Stream test' }
      ];
      
      const mockCallback = jest.fn();
      
      await llmService.streamPrompt(messages, mockCallback, { modelId: 'test-model' });
      
      expect(mockCallback).toHaveBeenCalled();
      // The mock implementation calls the callback twice
      expect(mockCallback.mock.calls.length).toBe(2);
      
      // First call should have content
      const firstResponse = mockCallback.mock.calls[0][0];
      expect(firstResponse).toHaveProperty('content');
      expect(firstResponse.content.length).toBeGreaterThan(0);
      
      // Last call should have finishReason
      const lastResponse = mockCallback.mock.calls[1][0];
      expect(lastResponse.metadata.finishReason).toBe('stop');
    });

    it('should validate API keys', async () => {
      const validResult = await llmService.validateApiKey('valid-test-key');
      expect(validResult).toBe(true);
      
      const invalidResult = await llmService.validateApiKey('invalid-key');
      expect(invalidResult).toBe(false);
    });
  });

  describe('LlmServiceError', () => {
    it('should create proper error instances', () => {
      const error = new LlmServiceError(
        'Test error message',
        LlmErrorCode.RATE_LIMIT_EXCEEDED,
        'Detailed error description'
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(LlmErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.details).toBe('Detailed error description');
    });
  });
});