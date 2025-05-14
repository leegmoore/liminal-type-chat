import { LlmApiKeyManager } from '../LlmApiKeyManager';
import { LlmErrorCode, LlmProvider, LlmServiceError } from '../ILlmService';
import { SecureStorage } from '../../security/secure-storage';
import { UserRepository } from '../../db/users/UserRepository';
import { LlmServiceFactory } from '../LlmServiceFactory';

// Mock the dependencies
jest.mock('../../security/secure-storage');
jest.mock('../../db/users/UserRepository');
jest.mock('../LlmServiceFactory');

describe('LlmApiKeyManager', () => {
  let llmApiKeyManager: LlmApiKeyManager;
  let mockSecureStorage: jest.Mocked<SecureStorage>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  
  const userId = 'user123';
  const mockApiKey = 'sk-test-api-key';
  const mockEncryptedApiKey = 'encrypted-api-key';
  const provider: LlmProvider = 'openai';
  
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Setup mocks
    mockSecureStorage = new SecureStorage() as jest.Mocked<SecureStorage>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    
    // Mock methods
    mockSecureStorage.encryptApiKey.mockResolvedValue(mockEncryptedApiKey);
    mockSecureStorage.decryptApiKey.mockResolvedValue(mockApiKey);
    mockUserRepository.storeApiKey.mockResolvedValue(true);
    mockUserRepository.getApiKey.mockResolvedValue({
      encryptedKey: mockEncryptedApiKey,
      label: 'Default',
      createdAt: Date.now()
    });
    
    // Mock LlmServiceFactory
    jest.spyOn(LlmServiceFactory, 'validateApiKey').mockResolvedValue(true);
    
    // Create manager
    llmApiKeyManager = new LlmApiKeyManager(mockSecureStorage, mockUserRepository);
  });
  
  describe('storeApiKey', () => {
    it('should validate, encrypt, and store API key', async () => {
      const result = await llmApiKeyManager.storeApiKey(userId, provider, mockApiKey, 'My Key');
      
      expect(result).toBe(true);
      expect(LlmServiceFactory.validateApiKey).toHaveBeenCalledWith(provider, mockApiKey);
      expect(mockSecureStorage.encryptApiKey).toHaveBeenCalledWith(mockApiKey);
      expect(mockUserRepository.storeApiKey).toHaveBeenCalledWith(
        userId, 
        provider, 
        mockEncryptedApiKey, 
        'My Key'
      );
    });
    
    it('should throw error if API key validation fails', async () => {
      jest.spyOn(LlmServiceFactory, 'validateApiKey').mockResolvedValue(false);
      
      await expect(
        llmApiKeyManager.storeApiKey(userId, provider, 'invalid-key')
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        llmApiKeyManager.storeApiKey(userId, provider, 'invalid-key')
      ).rejects.toThrow('Invalid API key for provider: openai');
    });
    
    it('should throw error if storage fails', async () => {
      mockUserRepository.storeApiKey.mockResolvedValue(false);
      
      await expect(
        llmApiKeyManager.storeApiKey(userId, provider, mockApiKey)
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        llmApiKeyManager.storeApiKey(userId, provider, mockApiKey)
      ).rejects.toThrow('Failed to store API key');
    });
  });
  
  describe('getApiKey', () => {
    it('should retrieve and decrypt API key', async () => {
      const apiKey = await llmApiKeyManager.getApiKey(userId, provider);
      
      expect(apiKey).toBe(mockApiKey);
      expect(mockUserRepository.getApiKey).toHaveBeenCalledWith(userId, provider);
      expect(mockSecureStorage.decryptApiKey).toHaveBeenCalledWith(mockEncryptedApiKey);
    });
    
    it('should throw error if no API key exists', async () => {
      mockUserRepository.getApiKey.mockResolvedValue(null);
      
      await expect(
        llmApiKeyManager.getApiKey(userId, provider)
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        llmApiKeyManager.getApiKey(userId, provider)
      ).rejects.toThrow('No API key found');
    });
  });
  
  describe('deleteApiKey', () => {
    it('should delete API key', async () => {
      mockUserRepository.deleteApiKey.mockResolvedValue(true);
      
      const result = await llmApiKeyManager.deleteApiKey(userId, provider);
      
      expect(result).toBe(true);
      expect(mockUserRepository.deleteApiKey).toHaveBeenCalledWith(userId, provider);
    });
    
    it('should throw error if deletion fails', async () => {
      mockUserRepository.deleteApiKey.mockResolvedValue(false);
      
      await expect(
        llmApiKeyManager.deleteApiKey(userId, provider)
      ).rejects.toThrow(LlmServiceError);
      
      await expect(
        llmApiKeyManager.deleteApiKey(userId, provider)
      ).rejects.toThrow('Failed to delete API key');
    });
  });
  
  describe('hasApiKey', () => {
    it('should return true when API key exists', async () => {
      const result = await llmApiKeyManager.hasApiKey(userId, provider);
      
      expect(result).toBe(true);
      expect(mockUserRepository.getApiKey).toHaveBeenCalledWith(userId, provider);
    });
    
    it('should return false when no API key exists', async () => {
      mockUserRepository.getApiKey.mockResolvedValue(null);
      
      const result = await llmApiKeyManager.hasApiKey(userId, provider);
      
      expect(result).toBe(false);
      expect(mockUserRepository.getApiKey).toHaveBeenCalledWith(userId, provider);
    });
  });
  
  describe('getApiKeyInfo', () => {
    it('should return API key metadata without the key itself', async () => {
      const info = await llmApiKeyManager.getApiKeyInfo(userId, provider);
      
      expect(info).toEqual({
        provider,
        label: 'Default',
        createdAt: expect.any(Number),
        hasKey: true
      });
      expect(info).not.toHaveProperty('encryptedKey');
      expect(mockUserRepository.getApiKey).toHaveBeenCalledWith(userId, provider);
    });
    
    it('should return info with hasKey=false when no key exists', async () => {
      mockUserRepository.getApiKey.mockResolvedValue(null);
      
      const info = await llmApiKeyManager.getApiKeyInfo(userId, provider);
      
      expect(info).toEqual({
        provider,
        hasKey: false
      });
    });
  });
  
  describe('listApiKeys', () => {
    it('should return list of API keys for the user', async () => {
      const mockKeys = {
        openai: {
          encryptedKey: 'encrypted-openai-key',
          label: 'OpenAI Key',
          createdAt: Date.now() - 1000
        },
        anthropic: {
          encryptedKey: 'encrypted-anthropic-key',
          label: 'Anthropic Key',
          createdAt: Date.now()
        }
      };
      
      mockUserRepository.getAllApiKeys.mockResolvedValue(mockKeys);
      
      const keyList = await llmApiKeyManager.listApiKeys(userId);
      
      expect(keyList).toEqual([
        {
          provider: 'openai',
          label: 'OpenAI Key',
          createdAt: expect.any(Number),
          hasKey: true
        },
        {
          provider: 'anthropic',
          label: 'Anthropic Key',
          createdAt: expect.any(Number),
          hasKey: true
        }
      ]);
      expect(mockUserRepository.getAllApiKeys).toHaveBeenCalledWith(userId);
    });
    
    it('should return empty array when no keys exist', async () => {
      mockUserRepository.getAllApiKeys.mockResolvedValue({});
      
      const keyList = await llmApiKeyManager.listApiKeys(userId);
      
      expect(keyList).toEqual([]);
    });
  });
});