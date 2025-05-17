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

// Create mock object for stream event iterator
const createMockStreamEvents = (options = {}) => {
  const {
    includeMessageDelta = true,
    stopReason = 'end_turn',
    skipMessageStart = false,
    emptyContent = false,
    throwError = false
  } = options;
  
  const events = [];
  
  if (!skipMessageStart) {
    events.push({
      type: 'message_start',
      message: {
        id: 'msg_abc123',
        model: 'claude-3-sonnet-20240229',
        role: 'assistant',
        content: [],
        usage: {
          input_tokens: 10,
          output_tokens: 0
        }
      }
    });
  }
  
  events.push({
    type: 'content_block_start',
    content_block: {
      type: 'text',
      index: 0
    }
  });
  
  events.push({
    type: 'content_block_delta',
    delta: {
      type: 'text_delta',
      text: 'Hello'
    },
    index: 0
  });
  
  if (includeMessageDelta) {
    events.push({
      type: 'message_delta',
      delta: {
        stop_reason: stopReason,
        stop_sequence: null
      },
      usage: {
        output_tokens: 1
      }
    });
  }
  
  events.push({
    type: 'message_stop',
    message: emptyContent ? {
      id: 'msg_abc123',
      model: 'claude-3-sonnet-20240229',
      role: 'assistant',
      content: [],
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    } : {
      id: 'msg_abc123',
      model: 'claude-3-sonnet-20240229',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello' }],
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    }
  });
  
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) {
        if (throwError && event.type === 'message_delta') {
          throw new MockAPIError('Stream error', 500);
        }
        yield event;
      }
    }
  };
};

// Mock message create function
const mockCreate = jest.fn().mockImplementation(async (params) => {
  // Check if we should simulate specific error statuses
  if (params.model === 'error-400') {
    throw new MockAPIError('Invalid request', 400);
  } else if (params.model === 'error-401') {
    throw new MockAPIError('Invalid API key', 401);
  } else if (params.model === 'error-403') {
    throw new MockAPIError('Forbidden', 403);
  } else if (params.model === 'error-404') {
    throw new MockAPIError('Model not found', 404);
  } else if (params.model === 'error-429') {
    throw new MockAPIError('Rate limit exceeded', 429);
  } else if (params.model === 'error-500') {
    throw new MockAPIError('Server error', 500);
  } else if (params.model === 'error-unknown') {
    throw new Error('Unknown error');
  } else if (params.model === 'empty-response') {
    return {
      id: 'msg_empty',
      model: params.model,
      role: 'assistant',
      content: [],
      stop_reason: 'max_tokens',
      usage: {
        input_tokens: 10,
        output_tokens: 0
      }
    };
  }
  
  // Normal successful response
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
    stop_reason: params.model === 'stop-max-tokens' ? 'max_tokens' : 
      params.model === 'stop-sequence' ? 'stop_sequence' : 
        'end_turn',
    usage: {
      input_tokens: 10,
      output_tokens: 20
    }
  };
});

// Mock message stream function with configurable events
const mockStream = jest.fn().mockImplementation(async (params) => {
  if (params.model === 'stream-error') {
    return createMockStreamEvents({ throwError: true });
  } else if (params.model === 'no-message-start') {
    return createMockStreamEvents({ skipMessageStart: true });
  } else if (params.model === 'no-message-delta') {
    return createMockStreamEvents({ includeMessageDelta: false });
  } else if (params.model === 'stop-max-tokens') {
    return createMockStreamEvents({ stopReason: 'max_tokens' });
  } else if (params.model === 'stop-sequence') {
    return createMockStreamEvents({ stopReason: 'stop_sequence' });
  } else if (params.model === 'empty-content') {
    return createMockStreamEvents({ emptyContent: true });
  }
  
  // Default stream events
  return createMockStreamEvents();
});

// Create a mock constructor function
function MockAnthropic(config) {
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

describe('AnthropicService Extended Tests', () => {
  let anthropicService: AnthropicService;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    anthropicService = new AnthropicService(mockApiKey);
    // Reset mock state
    mockCreate.mockClear();
    mockStream.mockClear();
  });
  
  describe('sendPrompt advanced options', () => {
    it('should set temperature when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      await anthropicService.sendPrompt(messages, { temperature: 0.7 });
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7
        })
      );
    });
    
    it('should set top_p when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      await anthropicService.sendPrompt(messages, { topP: 0.9 });
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          top_p: 0.9
        })
      );
    });
    
    it('should set stop sequences when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const stop = ['END', 'STOP'];
      await anthropicService.sendPrompt(messages, { stop });
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stop_sequences: stop
        })
      );
    });
    
    it('should not include empty arrays as stop sequences', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      await anthropicService.sendPrompt(messages, { stop: [] });
      
      const calls = mockCreate.mock.calls[0][0];
      expect(calls).not.toHaveProperty('stop_sequences');
    });
    
    it('should throw error for empty messages array', async () => {
      await expect(anthropicService.sendPrompt([])).rejects.toThrow(LlmServiceError);
      try {
        await anthropicService.sendPrompt([]);
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_REQUEST);
      }
    });
    
    it('should handle empty content response gracefully', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await anthropicService.sendPrompt(messages, { modelId: 'empty-response' });
      expect(response.content).toBe('');
    });
  });
  
  describe('streamPrompt advanced features', () => {
    it('should handle missing message_start event', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { modelId: 'no-message-start' });
      
      // Check that the final response contains a token estimate when message_start is missing
      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastCall.metadata).toHaveProperty('fullContent');
      expect(lastCall.usage.completionTokens).toBeGreaterThan(0);
    });
    
    it('should handle missing message_delta event', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { modelId: 'no-message-delta' });
      
      // Should still receive chunks and complete successfully
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls.length).toBeGreaterThan(1);
    });
    
    it('should set temperature when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { temperature: 0.7 });
      
      expect(mockStream).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7
        })
      );
    });
    
    it('should set top_p when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { topP: 0.9 });
      
      expect(mockStream).toHaveBeenCalledWith(
        expect.objectContaining({
          top_p: 0.9
        })
      );
    });
    
    it('should set stop sequences when provided', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      const stop = ['END', 'STOP'];
      
      await anthropicService.streamPrompt(messages, mockCallback, { stop });
      
      expect(mockStream).toHaveBeenCalledWith(
        expect.objectContaining({
          stop_sequences: stop
        })
      );
    });
    
    it('should throw error for empty messages array', async () => {
      const mockCallback = jest.fn();
      await expect(anthropicService.streamPrompt([], mockCallback)).rejects.toThrow(LlmServiceError);
      try {
        await anthropicService.streamPrompt([], mockCallback);
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_REQUEST);
      }
    });
    
    it('should handle stream errors properly', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await expect(
        anthropicService.streamPrompt(messages, mockCallback, { modelId: 'stream-error' })
      ).rejects.toThrow(LlmServiceError);
      
      try {
        await anthropicService.streamPrompt(messages, mockCallback, { modelId: 'stream-error' });
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.SERVER_ERROR);
      }
    });
    
    it('should add system prompt when system message is present', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback);
      
      expect(mockStream).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a helpful assistant'
        })
      );
    });
    
    it('should map "max_tokens" stop reason correctly', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { modelId: 'stop-max-tokens' });
      
      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastCall.metadata.finishReason).toBe('length');
    });
    
    it('should map "stop_sequence" stop reason correctly', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockCallback = jest.fn();
      
      await anthropicService.streamPrompt(messages, mockCallback, { modelId: 'stop-sequence' });
      
      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastCall.metadata.finishReason).toBe('stop');
    });
  });
  
  describe('mapToAnthropicMessages', () => {
    it('should handle multiple system messages', async () => {
      const messages = [
        { role: 'system', content: 'System message 1' },
        { role: 'system', content: 'System message 2' },
        { role: 'user', content: 'User message' }
      ];
      
      await anthropicService.sendPrompt(messages);
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'System message 1', // Should only use the first system message
          messages: [{ role: 'user', content: 'User message' }]
        })
      );
    });
    
    it('should filter out unknown roles', async () => {
      const messages = [
        { role: 'unknown', content: 'Unknown role message' },
        { role: 'user', content: 'User message' }
      ];
      
      await anthropicService.sendPrompt(messages);
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'User message' }]
        })
      );
      
      // Should not have system property
      expect(mockCreate.mock.calls[0][0]).not.toHaveProperty('system');
    });
    
    it('should handle assistant messages properly', async () => {
      const messages = [
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'Assistant response' }
      ];
      
      await anthropicService.sendPrompt(messages);
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'User message' },
            { role: 'assistant', content: 'Assistant response' }
          ]
        })
      );
    });
  });
  
  describe('error handling', () => {
    it('should map 400 status to INVALID_REQUEST', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-400' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_REQUEST);
      }
    });
    
    it('should map 401 status to INVALID_API_KEY', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-401' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_API_KEY);
      }
    });
    
    it('should map 403 status to INVALID_API_KEY', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-403' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_API_KEY);
      }
    });
    
    it('should map 404 status to MODEL_NOT_FOUND', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-404' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.MODEL_NOT_FOUND);
      }
    });
    
    it('should map 429 status to RATE_LIMIT_EXCEEDED', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-429' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.RATE_LIMIT_EXCEEDED);
      }
    });
    
    it('should map 500 status to SERVER_ERROR', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-500' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.SERVER_ERROR);
      }
    });
    
    it('should handle non-Anthropic errors', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      try {
        await anthropicService.sendPrompt(messages, { modelId: 'error-unknown' });
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.UNKNOWN_ERROR);
        expect((error as LlmServiceError).message).toBe('Unknown error');
      }
    });
  });
  
  describe('mapStopReason', () => {
    it('should map different stop reasons correctly', async () => {
      // Test end_turn stop reason
      const endTurnResponse = await anthropicService.sendPrompt(
        [{ role: 'user', content: 'Hello' }]
      );
      expect(endTurnResponse.metadata.finishReason).toBe('stop');
      
      // Test max_tokens stop reason
      const maxTokensResponse = await anthropicService.sendPrompt(
        [{ role: 'user', content: 'Hello' }],
        { modelId: 'stop-max-tokens' }
      );
      expect(maxTokensResponse.metadata.finishReason).toBe('length');
      
      // Test stop_sequence stop reason
      const stopSequenceResponse = await anthropicService.sendPrompt(
        [{ role: 'user', content: 'Hello' }],
        { modelId: 'stop-sequence' }
      );
      expect(stopSequenceResponse.metadata.finishReason).toBe('stop');
    });
    
    it('should handle undefined stop reason', async () => {
      // Mock implementation just for this test
      mockCreate.mockResolvedValueOnce({
        id: 'msg_undefined_stop',
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        content: [{ type: 'text', text: 'Response' }],
        stop_reason: undefined,
        usage: { input_tokens: 10, output_tokens: 20 }
      });
      
      const response = await anthropicService.sendPrompt([{ role: 'user', content: 'Hello' }]);
      expect(response.metadata.finishReason).toBeUndefined();
    });
  });
  
  describe('extractTextFromResponse', () => {
    it('should handle empty content array', async () => {
      // Empty content array
      mockCreate.mockResolvedValueOnce({
        id: 'msg_empty_content',
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        content: [],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 0 }
      });
      
      const response = await anthropicService.sendPrompt([{ role: 'user', content: 'Hello' }]);
      expect(response.content).toBe('');
    });
    
    it('should handle non-text content blocks', async () => {
      // Non-text content block
      mockCreate.mockResolvedValueOnce({
        id: 'msg_non_text',
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        content: [{ type: 'image', image_url: 'https://example.com/image.jpg' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 }
      });
      
      const response = await anthropicService.sendPrompt([{ role: 'user', content: 'Generate an image' }]);
      expect(response.content).toBe('');
    });
  });
});