/**
 * Extended tests for OpenAiService focusing on coverage gaps
 */
import { OpenAiService } from '../OpenAiService';
import { LlmErrorCode, LlmServiceError } from '../../ILlmService';

// Mock OpenAI external client
jest.mock('openai', () => {
  return function OpenAI() {
    return {
      models: {
        list: jest.fn()
      },
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
  };
});

describe('OpenAiService - Extended Tests', () => {
  let service: OpenAiService;
  const apiKey = 'sk-test-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new OpenAiService(apiKey);
  });
  
  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      // Act & Assert
      expect(() => new OpenAiService('')).toThrow(
        new LlmServiceError(
          'OpenAI API key is required',
          LlmErrorCode.INVALID_API_KEY,
          'An API key must be provided to use the OpenAI service'
        )
      );
    });
  });
  
  describe('asModelConfig', () => {
    it('should convert raw model data to model config with defaults', () => {
      // Arrange
      const modelId = 'test-model';
      const modelData = { id: modelId };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.asModelConfig(modelData, modelId);
      
      // Assert
      expect(result).toEqual({
        id: modelId,
        name: modelId,
        maxTokens: 4096,
        contextWindow: 4096,
        supportsStreaming: true,
        trainedUntil: undefined,
        pricingPerInputToken: undefined,
        pricingPerOutputToken: undefined
      });
    });
    
    it('should preserve existing values when converting', () => {
      // Arrange
      const modelId = 'custom-model';
      const modelData = {
        id: modelId,
        name: 'Custom Model',
        maxTokens: 8192,
        contextWindow: 16384,
        supportsStreaming: false,
        trainedUntil: '2023-06-01',
        pricingPerInputToken: 0.0001,
        pricingPerOutputToken: 0.0002
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.asModelConfig(modelData, modelId);
      
      // Assert
      expect(result).toEqual({
        id: modelId,
        name: 'Custom Model',
        maxTokens: 8192,
        contextWindow: 16384,
        supportsStreaming: false,
        trainedUntil: '2023-06-01',
        pricingPerInputToken: 0.0001,
        pricingPerOutputToken: 0.0002
      });
    });
  });
  
  describe('mapFinishReason', () => {
    it('should map "stop" finish reason correctly', () => {
      // Act
      // @ts-expect-error: testing private method
      const result = service.mapFinishReason('stop');
      
      // Assert
      expect(result).toBe('stop');
    });
    
    it('should map "length" finish reason correctly', () => {
      // Act
      // @ts-expect-error: testing private method
      const result = service.mapFinishReason('length');
      
      // Assert
      expect(result).toBe('length');
    });
    
    it('should map "content_filter" finish reason correctly', () => {
      // Act
      // @ts-expect-error: testing private method
      const result = service.mapFinishReason('content_filter');
      
      // Assert
      expect(result).toBe('content_filter');
    });
    
    it('should map unknown finish reasons to "error"', () => {
      // Act
      // @ts-expect-error: testing private method
      const result = service.mapFinishReason('unknown_reason');
      
      // Assert
      expect(result).toBe('error');
    });
    
    it('should return undefined for null or undefined finish reason', () => {
      // Act
      // @ts-expect-error: testing private method
      const result1 = service.mapFinishReason(null);
      // @ts-expect-error: testing private method
      const result2 = service.mapFinishReason(undefined);
      
      // Assert
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });
  
  describe('handleError', () => {
    it('should handle API key errors', () => {
      // Arrange
      const error = new Error('Invalid API key provided');
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.INVALID_API_KEY);
      expect(result.message).toContain('Invalid API key provided');
    });
    
    it('should handle rate limit errors', () => {
      // Arrange
      const error = {
        message: 'Too many requests',
        status: 429
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.message).toContain('Too many requests');
    });
    
    it('should handle model not found errors', () => {
      // Arrange
      const error = {
        message: 'The model does not exist',
        status: 404
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.MODEL_NOT_FOUND);
      expect(result.message).toContain('The model does not exist');
    });
    
    it('should handle invalid request errors', () => {
      // Arrange
      const error = {
        message: 'Bad request',
        status: 400
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.INVALID_REQUEST);
      expect(result.message).toContain('Bad request');
    });
    
    it('should handle server errors', () => {
      // Arrange
      const error = {
        message: 'Internal server error',
        status: 500
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.SERVER_ERROR);
      expect(result.message).toContain('Internal server error');
    });
    
    it('should handle timeout errors', () => {
      // Arrange
      const error = {
        message: 'Request timeout'
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.TIMEOUT);
      expect(result.message).toContain('Request timeout');
    });
    
    it('should handle network errors', () => {
      // Arrange
      // The actual implementation checks for "network" not "Network error occurred"
      const error = {
        message: 'network error occurred'
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.NETWORK_ERROR);
      expect(result.message).toContain('network error occurred');
    });
    
    it('should handle unknown errors with default error code', () => {
      // Arrange
      const error = {
        message: 'Unknown error'
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.code).toBe(LlmErrorCode.UNKNOWN_ERROR);
      expect(result.message).toContain('Unknown error');
    });
    
    it('should handle errors with response data structure', () => {
      // Arrange
      const error = {
        response: {
          data: {
            error: {
              message: 'Error message from response'
            }
          }
        }
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.details).toBe('Error message from response');
    });
    
    it('should handle errors with error property structure', () => {
      // Arrange
      const error = {
        error: {
          message: 'Error message from error property'
        }
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.details).toBe('Error message from error property');
    });
    
    it('should handle errors with toString method', () => {
      // Arrange
      const error = {
        toString: () => 'Error as string'
      };
      
      // Act
      // @ts-expect-error: testing private method
      const result = service.handleError(error);
      
      // Assert
      expect(result).toBeInstanceOf(LlmServiceError);
      expect(result.details).toBe('Error as string');
    });
  });
  
  describe('sendPrompt', () => {
    it('should throw error when messages array is empty', async () => {
      // Act & Assert
      await expect(service.sendPrompt([])).rejects.toThrow(
        new LlmServiceError(
          'Messages array is empty',
          LlmErrorCode.INVALID_REQUEST,
          'At least one message must be provided'
        )
      );
    });
  });
  
  describe('streamPrompt', () => {
    it('should throw error when messages array is empty', async () => {
      // Act & Assert
      await expect(service.streamPrompt([], jest.fn())).rejects.toThrow(
        new LlmServiceError(
          'Messages array is empty',
          LlmErrorCode.INVALID_REQUEST,
          'At least one message must be provided'
        )
      );
    });
  });
});