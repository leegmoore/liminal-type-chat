import request from 'supertest';
import express from 'express';
import { createHealthRoutes } from '../../../src/routes/domain/health';
import { HealthService } from '../../../src/services/core/health-service';

describe('Health Routes', () => {
  let app: express.Application;
  let mockHealthService: jest.Mocked<HealthService>;
  
  beforeEach(() => {
    // Create a mock health service
    mockHealthService = {
      getSystemStatus: jest.fn()
    } as unknown as jest.Mocked<HealthService>;
    
    // Create an Express app for testing
    app = express();
    app.use(express.json());
    
    // Add the health routes to the app with correct path
    app.use('/api/v1/domain/health', createHealthRoutes(mockHealthService));
    
    // Add basic error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    });
  });
  
  describe('GET /api/v1/domain/health', () => {
    it('should return 200 and health status when service succeeds', async () => {
      // Set up the mock
      const mockStatus = {
        status: 'ok',
        timestamp: '2025-05-11T12:00:00.000Z'
      };
      mockHealthService.getSystemStatus.mockResolvedValue(mockStatus);
      
      // Make the request
      const response = await request(app).get('/api/v1/domain/health');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mockHealthService.getSystemStatus).toHaveBeenCalledTimes(1);
    });
    
    it('should return 500 when service throws an error', async () => {
      // Set up the mock to throw an error
      const errorMessage = 'Service error';
      mockHealthService.getSystemStatus.mockRejectedValue(new Error(errorMessage));
      
      // Make the request
      const response = await request(app).get('/api/v1/domain/health');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', errorMessage);
      expect(mockHealthService.getSystemStatus).toHaveBeenCalledTimes(1);
    });
  });
});
