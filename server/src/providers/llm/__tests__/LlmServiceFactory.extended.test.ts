import { LlmServiceFactory } from '../LlmServiceFactory';
import { AnthropicService } from '../anthropic/AnthropicService';
import { LlmErrorCode, LlmServiceError } from '../ILlmService';

// Mock the service implementation
jest.mock('../anthropic/AnthropicService');

describe('LlmServiceFactory Extended Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementation
    (AnthropicService as jest.Mock).mockImplementation((apiKey) => {
      if (!apiKey) {
        throw new LlmServiceError(
          'Anthropic API key is required',
          LlmErrorCode.INVALID_API_KEY,
          'An API key must be provided to use the Anthropic service'
        );
      }
      return {
        apiKey,
        validateApiKey: jest.fn().mockResolvedValue(true)
      };
    });
  });
  
  describe('validateApiKey', () => {
    it('should return false for empty API key without calling the service', async () => {
      const validateSpy = jest.spyOn(AnthropicService.prototype, 'validateApiKey');
      
      const result = await LlmServiceFactory.validateApiKey('anthropic', '');
      
      expect(result).toBe(false);
      expect(validateSpy).not.toHaveBeenCalled();
    });
    
    it('should handle errors from service constructor for invalid API keys', async () => {
      // Mock the AnthropicService constructor to throw an INVALID_API_KEY error
      (AnthropicService as jest.Mock).mockImplementation(() => {
        throw new LlmServiceError(
          'Invalid API key format',
          LlmErrorCode.INVALID_API_KEY,
          'The provided API key has an invalid format'
        );
      });
      
      const result = await LlmServiceFactory.validateApiKey('anthropic', 'malformed-key');
      
      expect(result).toBe(false);
    });
    
    it('should rethrow errors from service constructor that are not related to invalid API keys', async () => {
      // Mock the AnthropicService constructor to throw a different type of error
      (AnthropicService as jest.Mock).mockImplementation(() => {
        throw new LlmServiceError(
          'Rate limit exceeded',
          LlmErrorCode.RATE_LIMIT_EXCEEDED,
          'Too many requests'
        );
      });
      
      await expect(
        LlmServiceFactory.validateApiKey('anthropic', 'rate-limited-key')
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        LlmServiceFactory.validateApiKey('anthropic', 'rate-limited-key')
      ).rejects.toHaveProperty('code', LlmErrorCode.RATE_LIMIT_EXCEEDED);
    });
    
    it('should rethrow general errors from service validation', async () => {
      // Mock the service to throw a generic error during validation
      (AnthropicService as jest.Mock).mockImplementation(() => ({
        validateApiKey: jest.fn().mockRejectedValue(new Error('Network error'))
      }));
      
      await expect(
        LlmServiceFactory.validateApiKey('anthropic', 'network-error-key')
      ).rejects.toThrow('Network error');
    });
  });
  
  describe('validateProvider', () => {
    // We need to test the private validateProvider method.
    // Since it's private, we'll test it indirectly through the public methods.
    
    it('should validate supported providers', () => {
      // This just tests that no error is thrown for valid providers
      expect(() => {
        LlmServiceFactory.getDefaultModel('anthropic');
      }).not.toThrow();
    });
    
    it('should throw for an unsupported provider in validateApiKey', async () => {
      // Using any to bypass type checking
      await expect(
        // @ts-expect-error - Testing with invalid provider
        LlmServiceFactory.validateApiKey('not-a-provider', 'some-key')
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        // @ts-expect-error - Testing with invalid provider
        LlmServiceFactory.validateApiKey('not-a-provider', 'some-key')
      ).rejects.toHaveProperty('code', LlmErrorCode.INVALID_REQUEST);
    });
  });
  
  describe('Default switch cases', () => {
    // This is tricky to test since TypeScript prevents us from hitting these cases,
    // and we've put validateProvider checks before them.
    // We can try to indirectly test by mocking the validateProvider method.
    
    it('should throw an error if createService hits its default case', () => {
      // Mock the validateProvider method to not throw an error
      const validateSpy = jest.spyOn(LlmServiceFactory as unknown, 'validateProvider')
        .mockImplementationOnce(() => { /* no-op */ });
      
      // Now we should be able to hit the default case
      expect(() => {
        // @ts-expect-error - Testing invalid provider
        LlmServiceFactory.createService('provider-that-passes-validation', 'key');
      }).toThrow(LlmServiceError);
      
      // Clean up the spy
      validateSpy.mockRestore();
    });
    
    it('should throw an error if validateApiKey hits its default case', async () => {
      // Mock the validateProvider method to not throw an error
      const validateSpy = jest.spyOn(LlmServiceFactory as unknown, 'validateProvider')
        .mockImplementationOnce(() => { /* no-op */ });
      
      // Now we should be able to hit the default case
      await expect(
        // @ts-expect-error - Testing invalid provider
        LlmServiceFactory.validateApiKey('provider-that-passes-validation', 'key')
      ).rejects.toThrow(LlmServiceError);
      
      // Clean up the spy
      validateSpy.mockRestore();
    });
  });
});