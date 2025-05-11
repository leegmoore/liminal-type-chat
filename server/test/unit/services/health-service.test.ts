import { HealthService } from '../../../src/services/core/health-service';

describe('HealthService', () => {
  let healthService: HealthService;
  
  beforeEach(() => {
    healthService = new HealthService();
    // Mock Date.now to return a consistent date for testing
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-05-11T12:00:00.000Z');
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
    
    it('should return a timestamp in ISO format', async () => {
      const result = await healthService.getSystemStatus();
      
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      );
    });
  });
});
