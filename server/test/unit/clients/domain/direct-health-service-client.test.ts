/**
 * Unit tests for the Direct Health Service Client
 */
import { DirectHealthServiceClient } from '../../../../src/clients/domain/direct-health-service-client';
import { HealthService, HealthStatus, DatabaseHealthStatus } from '../../../../src/services/core/health-service';

describe('DirectHealthServiceClient', () => {
  let healthServiceMock: jest.Mocked<HealthService>;
  let directClient: DirectHealthServiceClient;
  
  // Sample health status responses
  const mockHealthStatus: HealthStatus = {
    status: 'ok',
    timestamp: '2025-05-11T12:00:00.000Z'
  };
  
  const mockDbHealthStatus: DatabaseHealthStatus = {
    status: 'ok',
    timestamp: '2025-05-11T12:00:00.000Z',
    database: {
      connected: true
    }
  };
  
  beforeEach(() => {
    // Create a mock for the health service
    healthServiceMock = {
      getSystemStatus: jest.fn().mockResolvedValue(mockHealthStatus),
      checkDbConnection: jest.fn().mockResolvedValue(mockDbHealthStatus)
    } as unknown as jest.Mocked<HealthService>;
    
    // Create the direct client with the mock health service
    directClient = new DirectHealthServiceClient(healthServiceMock);
  });
  
  describe('getSystemStatus', () => {
    it('should call the domain health service getSystemStatus method', async () => {
      const result = await directClient.getSystemStatus();
      
      expect(healthServiceMock.getSystemStatus).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHealthStatus);
    });
    
    it('should propagate errors from the domain health service', async () => {
      const testError = new Error('Test error');
      healthServiceMock.getSystemStatus.mockRejectedValueOnce(testError);
      
      await expect(directClient.getSystemStatus()).rejects.toThrow(testError);
      expect(healthServiceMock.getSystemStatus).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('checkDbConnection', () => {
    it('should call the domain health service checkDbConnection method', async () => {
      const result = await directClient.checkDbConnection();
      
      expect(healthServiceMock.checkDbConnection).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDbHealthStatus);
    });
    
    it('should propagate errors from the domain health service', async () => {
      const testError = new Error('Test error');
      healthServiceMock.checkDbConnection.mockRejectedValueOnce(testError);
      
      await expect(directClient.checkDbConnection()).rejects.toThrow(testError);
      expect(healthServiceMock.checkDbConnection).toHaveBeenCalledTimes(1);
    });
  });
});
