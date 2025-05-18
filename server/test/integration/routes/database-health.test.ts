import request from 'supertest';
import express from 'express';
import { createHealthRoutes } from '../../../src/routes/domain/health';
import { HealthService } from '../../../src/services/core/health-service';
import { DatabaseProvider } from '../../../src/providers/db/database-provider';

describe('Database Health Endpoint', () => {
  let app: express.Application;
  let mockHealthService: jest.Mocked<HealthService>;
  
  beforeEach(() => {
    // Create a mock health service
    mockHealthService = {
      getSystemStatus: jest.fn(),
      checkDbConnection: jest.fn()
    } as unknown as jest.Mocked<HealthService>;
    
    // Create an Express app for testing
    app = express();
    app.use(express.json());
    
    // Add the health routes to the app
    app.use('/api/v1/domain/health', createHealthRoutes(mockHealthService));
    
    // Add basic error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    });
  });
  
  describe('GET /api/v1/domain/health/db', () => {
    it('should return 200 and database health status when service succeeds', async () => {
      // Set up the mock
      const mockStatus = {
        status: 'ok',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: true
        }
      };
      mockHealthService.checkDbConnection.mockResolvedValue(mockStatus);
      
      // Make the request
      const response = await request(app).get('/api/v1/domain/health/db');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mockHealthService.checkDbConnection).toHaveBeenCalledTimes(1);
    });
    
    it('should return 200 with error status when database is not connected', async () => {
      // Set up the mock to return a failed connection
      const mockStatus = {
        status: 'error',
        timestamp: '2025-05-11T12:00:00.000Z',
        database: {
          connected: false,
          error: 'Connection failed'
        }
      };
      mockHealthService.checkDbConnection.mockResolvedValue(mockStatus);
      
      // Make the request
      const response = await request(app).get('/api/v1/domain/health/db');
      
      // Assertions - should still be 200 as the API call succeeded, even though DB failed
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mockHealthService.checkDbConnection).toHaveBeenCalledTimes(1);
    });
    
    it('should return 500 when service throws an error', async () => {
      // Set up the mock to throw an error
      const errorMessage = 'Service error';
      mockHealthService.checkDbConnection.mockRejectedValue(new Error(errorMessage));
      
      // Make the request
      const response = await request(app).get('/api/v1/domain/health/db');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', errorMessage);
      expect(mockHealthService.checkDbConnection).toHaveBeenCalledTimes(1);
    });
  });
});
