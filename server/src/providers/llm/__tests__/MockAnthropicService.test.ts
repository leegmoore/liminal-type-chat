import { MockAnthropicService } from '../anthropic/MockAnthropicService';
import { LlmErrorCode, LlmServiceError } from '../ILlmService';

// Mock console.log to prevent test output noise
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('MockAnthropicService', () => {
  let mockService: MockAnthropicService;
  const validApiKey = 'test-api-key';

  beforeEach(() => {
    mockService = new MockAnthropicService(validApiKey);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a new instance with valid API key', () => {
      expect(mockService).toBeInstanceOf(MockAnthropicService);
    });

    it('should throw error with empty API key', () => {
      expect(() => new MockAnthropicService('')).toThrow(LlmServiceError);
      expect(() => new MockAnthropicService('  ')).toThrow(LlmServiceError);
      
      try {
        new MockAnthropicService('');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_API_KEY);
      }
    });
  });

  describe('listModels', () => {
    it('should return a list of available models', async () => {
      const models = await mockService.listModels();
      
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBe(4);
      
      // Check for expected model IDs
      const modelIds = models.map(model => model.id);
      expect(modelIds).toContain('claude-3-7-sonnet-20250218');
      expect(modelIds).toContain('claude-3-opus-20240229');
      expect(modelIds).toContain('claude-3-sonnet-20240229');
      expect(modelIds).toContain('claude-3-haiku-20240307');
    });
  });

  describe('getModel', () => {
    it('should return model details for existing model', async () => {
      const model = await mockService.getModel('claude-3-7-sonnet-20250218');
      
      expect(model).not.toBeNull();
      expect(model?.id).toBe('claude-3-7-sonnet-20250218');
      expect(model?.name).toBe('Claude 3.7 Sonnet');
      expect(model?.provider).toBe('anthropic');
    });

    it('should return null for non-existent model', async () => {
      const model = await mockService.getModel('non-existent-model');
      expect(model).toBeNull();
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      const result = await mockService.validateApiKey('valid-key');
      expect(result).toBe(true);
    });

    it('should return false for empty API key', async () => {
      const result1 = await mockService.validateApiKey('');
      const result2 = await mockService.validateApiKey('   ');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('sendPrompt', () => {
    const mockMessages = [{ role: 'user', content: 'Tell me a joke' }];
    
    it('should return a mock response', async () => {
      const response = await mockService.sendPrompt(mockMessages);
      
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('modelId', 'claude-3-7-sonnet-20250218'); // Default model
      expect(response).toHaveProperty('provider', 'anthropic');
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('promptTokens');
      expect(response.usage).toHaveProperty('completionTokens');
      expect(response.usage).toHaveProperty('totalTokens');
      expect(response.metadata).toHaveProperty('finishReason', 'stop');
    });

    it('should use specified model ID', async () => {
      const response = await mockService.sendPrompt(mockMessages, { 
        modelId: 'claude-3-opus-20240229' 
      });
      
      expect(response.modelId).toBe('claude-3-opus-20240229');
    });

    it('should throw error for invalid model ID', async () => {
      await expect(
        mockService.sendPrompt(mockMessages, { modelId: 'invalid-model' })
      ).rejects.toThrow(LlmServiceError);
      
      try {
        await mockService.sendPrompt(mockMessages, { modelId: 'invalid-model' });
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_REQUEST);
      }
    });

    it('should generate different responses based on prompt content', async () => {
      // Test with hello prompt
      const helloResponse = await mockService.sendPrompt([
        { role: 'user', content: 'Hello there' }
      ]);
      
      expect(helloResponse.content).toContain('Hello!');
      
      // Test with count prompt
      const countResponse = await mockService.sendPrompt([
        { role: 'user', content: 'Please count to 5' }
      ]);
      
      expect(countResponse.content).toContain('1... 2... 3... 4... 5');
      
      // Test with list prompt
      const listResponse = await mockService.sendPrompt([
        { role: 'user', content: 'Give me a list of examples' }
      ]);
      
      expect(listResponse.content).toContain('Here\'s a sample list');
      
      // Test with other prompt
      const otherResponse = await mockService.sendPrompt([
        { role: 'user', content: 'What is the capital of France?' }
      ]);
      
      expect(otherResponse.content).toContain('You asked:');
    });

    it('should handle error correctly', async () => {
      // Create a new service that will throw an error when getModel is called
      const mockErrorService = new MockAnthropicService(validApiKey);
      jest.spyOn(mockErrorService, 'getModel').mockImplementation(() => {
        throw new Error('API key invalid');
      });
      
      await expect(
        mockErrorService.sendPrompt(mockMessages)
      ).rejects.toThrow(LlmServiceError);
      
      try {
        await mockErrorService.sendPrompt(mockMessages);
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_API_KEY);
      }
    });

    it('should handle rate limit errors', async () => {
      // Create a service that will throw rate limit error
      const mockRateLimitService = new MockAnthropicService(validApiKey);
      jest.spyOn(mockRateLimitService, 'getModel').mockImplementation(() => {
        throw new Error('rate limit exceeded');
      });
      
      try {
        await mockRateLimitService.sendPrompt(mockMessages);
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.RATE_LIMIT_EXCEEDED);
      }
    });

    it('should handle unknown errors', async () => {
      // Create a service that will throw unknown error
      const mockUnknownErrorService = new MockAnthropicService(validApiKey);
      jest.spyOn(mockUnknownErrorService, 'getModel').mockImplementation(() => {
        throw new Error('some other error');
      });
      
      try {
        await mockUnknownErrorService.sendPrompt(mockMessages);
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.SERVER_ERROR);
      }
    });

    it('should propagate LlmServiceError without changes', async () => {
      // Create a service that will throw LlmServiceError
      const mockServiceErrorService = new MockAnthropicService(validApiKey);
      jest.spyOn(mockServiceErrorService, 'getModel').mockImplementation(() => {
        throw new LlmServiceError(
          'Custom error', 
          LlmErrorCode.CONTENT_FILTERED, 
          'Custom details'
        );
      });
      
      try {
        await mockServiceErrorService.sendPrompt(mockMessages);
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.CONTENT_FILTERED);
      }
    });
  });

  describe('streamPrompt', () => {
    const mockMessages = [{ role: 'user', content: 'Tell me a joke' }];
    
    it('should stream responses in chunks', async () => {
      const mockCallback = jest.fn();
      
      await mockService.streamPrompt(mockMessages, mockCallback);
      
      // Verify callback was called multiple times
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls.length).toBeGreaterThan(1);
      
      // Check first chunk
      const firstChunk = mockCallback.mock.calls[0][0];
      expect(firstChunk).toHaveProperty('content');
      expect(firstChunk).toHaveProperty('modelId', 'claude-3-7-sonnet-20250218');
      expect(firstChunk).toHaveProperty('provider', 'anthropic');
      
      // Only last chunk should have finishReason
      const lastChunk = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastChunk.metadata.finishReason).toBe('stop');
      
      // First chunk should not have finishReason
      expect(firstChunk.metadata.finishReason).toBeUndefined();
    });

    it('should use specified model ID', async () => {
      const mockCallback = jest.fn();
      
      await mockService.streamPrompt(mockMessages, mockCallback, {
        modelId: 'claude-3-sonnet-20240229'
      });
      
      const firstChunk = mockCallback.mock.calls[0][0];
      expect(firstChunk.modelId).toBe('claude-3-sonnet-20240229');
    });

    it('should throw error for invalid model ID', async () => {
      const mockCallback = jest.fn();
      
      await expect(
        mockService.streamPrompt(mockMessages, mockCallback, { modelId: 'invalid-model' })
      ).rejects.toThrow(LlmServiceError);
      
      try {
        await mockService.streamPrompt(mockMessages, mockCallback, { modelId: 'invalid-model' });
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_REQUEST);
      }
    });

    it('should handle errors during streaming', async () => {
      const mockCallback = jest.fn();
      
      // Create a service that will throw an error
      const mockErrorService = new MockAnthropicService(validApiKey);
      jest.spyOn(mockErrorService, 'getModel').mockImplementation(() => {
        throw new Error('Some error during streaming');
      });
      
      await expect(
        mockErrorService.streamPrompt(mockMessages, mockCallback)
      ).rejects.toThrow(LlmServiceError);
    });
  });
});