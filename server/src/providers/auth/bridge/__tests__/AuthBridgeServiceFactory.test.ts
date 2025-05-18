import { AuthBridgeServiceFactory } from '../AuthBridgeServiceFactory';
import { AuthBridgeService } from '../AuthBridgeService';
import { JwtServiceFactory } from '../../jwt/JwtServiceFactory';
import { UserRepository } from '../../../db/users/UserRepository';
import { SQLiteProvider } from '../../../db/sqlite-provider';
import { EncryptionService } from '../../../security/encryption-service';

// Mock dependencies
jest.mock('../../jwt/JwtServiceFactory');
jest.mock('../../../db/users/UserRepository');
jest.mock('../../../db/sqlite-provider');
jest.mock('../../../security/encryption-service');
jest.mock('../AuthBridgeService');
jest.mock('../../../../config', () => ({
  db: {
    path: '/test/db/path'
  }
}));

describe('AuthBridgeServiceFactory', () => {
  // Mock instances
  const mockJwtService = { verifyToken: jest.fn(), generateToken: jest.fn() };
  const mockDbProvider = { initialize: jest.fn() };
  const mockEncryptionService = {};
  const mockUserRepository = {};
  const mockAuthBridgeService = {};
  
  // Set up mocks
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset instance
    (AuthBridgeServiceFactory as Record<string, unknown>).instance = null;
    
    // Mock JWT factory
    (JwtServiceFactory.createJwtService as jest.Mock).mockResolvedValue(mockJwtService);
    
    // Mock SQLite provider
    (SQLiteProvider as jest.MockedClass<typeof SQLiteProvider>).mockImplementation(
      () => mockDbProvider as unknown as SQLiteProvider
    );
    mockDbProvider.initialize.mockResolvedValue(undefined);
    
    // Mock encryption service
    (EncryptionService as jest.MockedClass<typeof EncryptionService>).mockImplementation(
      () => mockEncryptionService as unknown as EncryptionService
    );
    
    // Mock user repository
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(
      () => mockUserRepository as unknown as UserRepository
    );
    
    // Mock auth bridge service
    (AuthBridgeService as jest.MockedClass<typeof AuthBridgeService>).mockImplementation(
      () => mockAuthBridgeService as unknown as AuthBridgeService
    );
  });
  
  it('should create a new AuthBridgeService instance', async () => {
    const instance = await AuthBridgeServiceFactory.createAuthBridgeService();
    
    expect(instance).toBe(mockAuthBridgeService);
    expect(JwtServiceFactory.createJwtService).toHaveBeenCalledWith(true);
    expect(SQLiteProvider).toHaveBeenCalledWith('/test/db/path');
    expect(mockDbProvider.initialize).toHaveBeenCalled();
    expect(EncryptionService).toHaveBeenCalled();
    expect(UserRepository).toHaveBeenCalledWith(mockDbProvider, mockEncryptionService);
    expect(AuthBridgeService).toHaveBeenCalledWith(mockJwtService, mockUserRepository);
  });
  
  it('should return existing instance if available', async () => {
    // First call creates new instance
    const instance1 = await AuthBridgeServiceFactory.createAuthBridgeService();
    
    // Reset mocks to verify they're not called again
    jest.clearAllMocks();
    
    // Second call should return cached instance
    const instance2 = await AuthBridgeServiceFactory.createAuthBridgeService();
    
    expect(instance2).toBe(instance1);
    expect(JwtServiceFactory.createJwtService).not.toHaveBeenCalled();
    expect(SQLiteProvider).not.toHaveBeenCalled();
    expect(mockDbProvider.initialize).not.toHaveBeenCalled();
    expect(EncryptionService).not.toHaveBeenCalled();
    expect(UserRepository).not.toHaveBeenCalled();
    expect(AuthBridgeService).not.toHaveBeenCalled();
  });
  
  it('should create new instance when forceNew is true', async () => {
    // First call creates new instance
    await AuthBridgeServiceFactory.createAuthBridgeService();
    
    // Reset mocks to verify they are called again
    jest.clearAllMocks();
    
    // Force new instance
    await AuthBridgeServiceFactory.createAuthBridgeService(true);
    
    expect(JwtServiceFactory.createJwtService).toHaveBeenCalledWith(true);
    expect(SQLiteProvider).toHaveBeenCalledWith('/test/db/path');
    expect(mockDbProvider.initialize).toHaveBeenCalled();
    expect(EncryptionService).toHaveBeenCalled();
    expect(UserRepository).toHaveBeenCalledWith(mockDbProvider, mockEncryptionService);
    expect(AuthBridgeService).toHaveBeenCalledWith(mockJwtService, mockUserRepository);
  });
  
  it('should handle errors during creation', async () => {
    // Mock error during JWT service creation
    const testError = new Error('JWT service creation failed');
    (JwtServiceFactory.createJwtService as jest.Mock).mockRejectedValue(testError);
    
    await expect(AuthBridgeServiceFactory.createAuthBridgeService())
      .rejects.toThrow(testError);
  });
});