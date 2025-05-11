import { HealthService } from '../../../../src/services/core/health-service';
import { DatabaseProvider } from '../../../../src/providers/db/database-provider';

describe('HealthService with Database', () => {
  let healthService: HealthService;
  let mockDbProvider: jest.Mocked<DatabaseProvider>;
  
  beforeEach(() => {
    // Create a mock database provider
    mockDbProvider = {
      initialize: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      exec: jest.fn().mockResolvedValue(undefined),
      transaction: jest.fn().mockImplementation(fn => Promise.resolve(fn({
        query: () => [],
        exec: () => {}
      }))),
      close: jest.fn().mockResolvedValue(undefined),
      healthCheck: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<DatabaseProvider>;
    
    // Mock Date.now to return a consistent date for testing
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-05-11T12:00:00.000Z');
    
    // Create health service with the mock database provider
    healthService = new HealthService(mockDbProvider);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('getSystemStatus', () => {
    it('should return a status object with ok status', async () => {
      const result = await healthService.getSystemStatus();
      
      expect(result).toEqual({
        status: 'ok',
        timestamp: '2025-05-11T12:00:00.000Z'
      });
    });
  });
  
  describe('constructor', () => {
    it('should initialize with optional database provider', () => {
      // Test with provider
      const withDb = new HealthService(mockDbProvider);
      expect(withDb['dbProvider']).toBe(mockDbProvider);
      
      // Test without provider
      const withoutDb = new HealthService();
      expect(withoutDb['dbProvider']).toBeUndefined();
      
      // Test with undefined explicitly passed
      const withUndefinedDb = new HealthService(undefined);
      expect(withUndefinedDb['dbProvider']).toBeUndefined();
    });
  });
  
  describe('checkDbConnection', () => {
    it('should return a healthy status when database connection is good', async () => {
      mockDbProvider.healthCheck.mockResolvedValue(true);
      
      const result = await healthService.checkDbConnection();
      
      expect(result).toEqual({
        status: 'ok',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: true
        }
      });
      expect(mockDbProvider.healthCheck).toHaveBeenCalledTimes(1);
    });
    
    it('should return an unhealthy status when database connection fails', async () => {
      mockDbProvider.healthCheck.mockResolvedValue(false);
      
      const result = await healthService.checkDbConnection();
      
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: false
        }
      });
      expect(mockDbProvider.healthCheck).toHaveBeenCalledTimes(1);
    });
    
    it('should return an error status when database check throws an exception', async () => {
      mockDbProvider.healthCheck.mockRejectedValue(new Error('Connection error'));
      
      const result = await healthService.checkDbConnection();
      
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: false,
          error: 'Connection error'
        }
      });
      expect(mockDbProvider.healthCheck).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors without a message property', async () => {
      // Create an error object without a message property
      const errorWithoutMessage = { name: 'CustomError' };
      mockDbProvider.healthCheck.mockRejectedValue(errorWithoutMessage);
      
      const result = await healthService.checkDbConnection();
      
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: false,
          error: 'Unknown database error'
        }
      });
    });
    
    it('should return an error when no database provider is available', async () => {
      // Create a health service with no database provider
      const noDbHealthService = new HealthService();
      
      const result = await noDbHealthService.checkDbConnection();
      
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: false,
          error: 'No database provider configured'
        }
      });
    });
    
    it('should record health check in database when successful', async () => {
      mockDbProvider.healthCheck.mockResolvedValue(true);
      
      await healthService.checkDbConnection();
      
      expect(mockDbProvider.exec).toHaveBeenCalledWith(
        'INSERT INTO health_checks (check_type, status, timestamp) VALUES (?, ?, ?)',
        ['database', 'ok', '2025-05-11T12:00:00.000Z']
      );
    });
    
    it('should not record health check in database when connection fails', async () => {
      mockDbProvider.healthCheck.mockResolvedValue(false);
      
      await healthService.checkDbConnection();
      
      expect(mockDbProvider.exec).not.toHaveBeenCalled();
    });
    
    it('should handle errors when recording health check but still return success', async () => {
      // Mock successful health check but failed insert
      mockDbProvider.healthCheck.mockResolvedValue(true);
      mockDbProvider.exec.mockRejectedValue(new Error('Insert failed'));
      
      // Mock console.error to verify it's called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await healthService.checkDbConnection();
      
      // The health check should still return success
      expect(result).toEqual({
        status: 'ok',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: true
        }
      });
      
      // But we should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to record health check:', expect.any(Error));
      
      // Restore console.error mock
      consoleSpy.mockRestore();
    });
  });
});
