import { LlmServiceFactory } from '../LlmServiceFactory';
import { OpenAiService } from '../openai/OpenAiService';
import { AnthropicService } from '../anthropic/AnthropicService';
import { LlmErrorCode, LlmServiceError } from '../ILlmService';
// LlmProvider is used indirectly through type checking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LlmProvider } from '../ILlmService';

// Mock the service implementations
jest.mock('../openai/OpenAiService');
jest.mock('../anthropic/AnthropicService');

describe('LlmServiceFactory', () => {
  const mockOpenAiKey = 'sk-test-openai-key';
  const mockAnthropicKey = 'sk-ant-test-anthropic-key';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (OpenAiService as jest.Mock).mockImplementation((apiKey) => {
      return {
        apiKey
      };
    });
    
    (AnthropicService as jest.Mock).mockImplementation((apiKey) => {
      return {
        apiKey
      };
    });
  });
  
  describe('createService', () => {
    it('should create an OpenAI service when provider is openai', () => {
      const service = LlmServiceFactory.createService('openai', mockOpenAiKey);
      
      expect(service).toBeDefined();
      expect(OpenAiService).toHaveBeenCalledWith(mockOpenAiKey);
    });
    
    it('should create an Anthropic service when provider is anthropic', () => {
      const service = LlmServiceFactory.createService('anthropic', mockAnthropicKey);
      
      expect(service).toBeDefined();
      expect(AnthropicService).toHaveBeenCalledWith(mockAnthropicKey);
    });
    
    it('should throw an error for an unsupported provider', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid provider
        LlmServiceFactory.createService('unsupported-provider', 'test-key');
      }).toThrow(LlmServiceError);
      
      expect(() => {
        // @ts-expect-error - Testing invalid provider
        LlmServiceFactory.createService('unsupported-provider', 'test-key');
      }).toThrow('Unsupported LLM provider: unsupported-provider');
    });
    
    it('should throw an error when API key is not provided', () => {
      // First check that it throws LlmServiceError
      expect(() => {
        LlmServiceFactory.createService('openai', '');
      }).toThrow(LlmServiceError);
      
      // Then check that it has the correct error code
      try {
        LlmServiceFactory.createService('openai', '');
      } catch (error) {
        expect(error).toBeInstanceOf(LlmServiceError);
        expect((error as LlmServiceError).code).toBe(LlmErrorCode.INVALID_API_KEY);
      }
    });
  });
  
  describe('getDefaultModels', () => {
    it('should return the default model for OpenAI', () => {
      const defaultModel = LlmServiceFactory.getDefaultModel('openai');
      expect(defaultModel).toBe('gpt-3.5-turbo');
    });
    
    it('should return the default model for Anthropic', () => {
      const defaultModel = LlmServiceFactory.getDefaultModel('anthropic');
      expect(defaultModel).toBe('claude-3-7-sonnet-20250218');
    });
    
    it('should throw an error for an unsupported provider', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid provider
        LlmServiceFactory.getDefaultModel('unsupported-provider');
      }).toThrow('Unsupported LLM provider: unsupported-provider');
    });
  });
  
  describe('getSupportedProviders', () => {
    it('should return all supported providers', () => {
      const providers = LlmServiceFactory.getSupportedProviders();
      
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers.length).toBe(2);
    });
  });
  
  describe('validateApiKey', () => {
    it('should validate an API key with the appropriate service', async () => {
      // Mock the validateApiKey methods
      const openAiValidateApiKey = jest.fn().mockResolvedValue(true);
      const anthropicValidateApiKey = jest.fn().mockResolvedValue(true);
      
      (OpenAiService as jest.Mock).mockImplementation(() => ({
        validateApiKey: openAiValidateApiKey
      }));
      
      (AnthropicService as jest.Mock).mockImplementation(() => ({
        validateApiKey: anthropicValidateApiKey
      }));
      
      // Test OpenAI validation
      const openAiResult = await LlmServiceFactory.validateApiKey('openai', mockOpenAiKey);
      expect(openAiResult).toBe(true);
      expect(openAiValidateApiKey).toHaveBeenCalledWith(mockOpenAiKey);
      
      // Test Anthropic validation
      const anthropicResult = await LlmServiceFactory.validateApiKey('anthropic', mockAnthropicKey);
      expect(anthropicResult).toBe(true);
      expect(anthropicValidateApiKey).toHaveBeenCalledWith(mockAnthropicKey);
    });
    
    it('should return false when validation fails', async () => {
      // Mock the validateApiKey method to return false
      (OpenAiService as jest.Mock).mockImplementation(() => ({
        validateApiKey: jest.fn().mockResolvedValue(false)
      }));
      
      const result = await LlmServiceFactory.validateApiKey('openai', 'invalid-key');
      expect(result).toBe(false);
    });
    
    it('should throw an error for an unsupported provider', async () => {
      // Using any here to bypass TypeScript's type checking
      // since we're intentionally testing with an invalid provider
      await expect(
        // @ts-expect-error - Testing with invalid provider type
        LlmServiceFactory.validateApiKey('unsupported-provider', 'test-key')
      ).rejects.toThrow('Unsupported LLM provider: unsupported-provider');
    });
  });
});