/**
 * Tests for ChatService provider-related functionality
 */
import { ChatService } from '../ChatService';
import { LlmApiKeyManager } from '../../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../ContextThreadService';
import { 
  LlmErrorCode, 
  LlmModelInfo, 
  LlmProvider, 
  LlmServiceError 
} from '../../../providers/llm/ILlmService';

// Mock LlmApiKeyManager
const mockLlmApiKeyManager: jest.Mocked<LlmApiKeyManager> = {
  hasApiKey: jest.fn(),
  getApiKey: jest.fn(),
  storeApiKey: jest.fn(),
  deleteApiKey: jest.fn()
} as unknown as jest.Mocked<LlmApiKeyManager>;

// Mock ContextThreadService
const mockContextThreadService: jest.Mocked<ContextThreadService> = {
  createThread: jest.fn(),
  getThread: jest.fn(),
  listThreads: jest.fn(),
  updateThread: jest.fn(),
  deleteThread: jest.fn(),
  addMessage: jest.fn(),
  updateMessage: jest.fn()
} as unknown as jest.Mocked<ContextThreadService>;

// Mock LLM Service
const mockLlmService = {
  listModels: jest.fn(),
  sendPrompt: jest.fn(),
  streamPrompt: jest.fn(),
  validateApiKey: jest.fn()
};

// Mock LlmServiceFactory
jest.mock('../../../providers/llm/LlmServiceFactory', () => ({
  LlmServiceFactory: {
    createService: jest.fn(() => mockLlmService),
    getDefaultModel: jest.fn((provider) => provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku')
  }
}));

describe('ChatService - Provider Functionality', () => {
  let chatService: ChatService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create chat service
    chatService = new ChatService(mockLlmApiKeyManager, mockContextThreadService);
  });
  
  describe('getProviderName', () => {
    it('should return OpenAI for openai provider', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      try {
        // Act - Call a method that uses getProviderName internally
        await chatService.getAvailableModels('user-123', 'openai');
      } catch (error) {
        // Assert
        // The error message should contain the properly formatted provider name
        expect((error as LlmServiceError).message).toContain('API key for OpenAI is required');
      }
    });
    
    it('should return Anthropic for anthropic provider', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      try {
        // Act - Call a method that uses getProviderName internally
        await chatService.getAvailableModels('user-123', 'anthropic');
      } catch (error) {
        // Assert
        // The error message should contain the properly formatted provider name
        expect((error as LlmServiceError).message).toContain('API key for Anthropic is required');
      }
    });
    
    it('should return the original provider name for unknown providers', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      const customProvider = 'custom-provider' as LlmProvider;
      
      try {
        // Act - Call a method that uses getProviderName internally
        await chatService.getAvailableModels('user-123', customProvider);
      } catch (error) {
        // Assert
        // The error message should contain the original provider name
        expect((error as LlmServiceError).message).toContain(`API key for ${customProvider} is required`);
      }
    });
  });
  
  describe('getAvailableModels', () => {
    it('should throw LlmServiceError with proper details when api key is missing', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(false);
      
      // Act & Assert
      await expect(chatService.getAvailableModels('user-123', 'openai')).rejects.toThrow(LlmServiceError);
      
      // Check the error has the proper code and details
      try {
        await chatService.getAvailableModels('user-123', 'openai');
      } catch (error) {
        const llmError = error as LlmServiceError;
        expect(llmError.code).toBe(LlmErrorCode.INVALID_API_KEY);
        expect(llmError.details).toBe('Please add your OpenAI API key in settings');
      }
    });
    
    it('should return models when api key exists', async () => {
      // Arrange
      mockLlmApiKeyManager.hasApiKey.mockResolvedValue(true);
      mockLlmApiKeyManager.getApiKey.mockResolvedValue('api-key-123');
      
      const mockModels: LlmModelInfo[] = [
        { id: 'gpt-3.5-turbo', name: 'GPT 3.5 Turbo', provider: 'openai' },
        { id: 'gpt-4', name: 'GPT 4', provider: 'openai' }
      ];
      
      mockLlmService.listModels.mockResolvedValue(mockModels);
      
      // Act
      const result = await chatService.getAvailableModels('user-123', 'openai');
      
      // Assert
      expect(result).toEqual(mockModels);
      expect(mockLlmApiKeyManager.hasApiKey).toHaveBeenCalledWith('user-123', 'openai');
      expect(mockLlmApiKeyManager.getApiKey).toHaveBeenCalledWith('user-123', 'openai');
    });
  });
});