/**
 * Integration tests for Edge Health Routes
 */
import express from 'express';
import request from 'supertest';
import { createEdgeHealthRoutes } from '../../../../src/routes/edge/health';
import { HealthServiceClient } from '../../../../src/clients/domain/health-service-client';
import { errorHandler } from '../../../../src/middleware/error-handler';
import { HealthStatus, DatabaseHealthStatus } from '../../../../src/services/core/health-service';
import { AppError } from '../../../../src/utils/errors';

describe('Edge Health Routes', () => {
  let app: express.Application;
  let mockHealthServiceClient: jest.Mocked<HealthServiceClient>;
  
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
    // Create a mock for the health service client
    mockHealthServiceClient = {
      getSystemStatus: jest.fn().mockResolvedValue(mockHealthStatus),
      checkDbConnection: jest.fn().mockResolvedValue(mockDbHealthStatus)
    } as jest.Mocked<HealthServiceClient>;
    
    // Create an Express application for testing
    app = express();
    
    // Mount the edge health routes with the mock client
    app.use(createEdgeHealthRoutes(mockHealthServiceClient));
    
    // Mount error handler
    app.use(errorHandler);
  });
  
  describe('GET /api/v1/edge/health', () => {
    it('should return system health status from the client', async () => {
      const response = await request(app)
        .get('/api/v1/edge/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toEqual(mockHealthStatus);
      expect(mockHealthServiceClient.getSystemStatus).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors from the client', async () => {
      // Mock a client error with proper structure
      const error = new AppError('INTERNAL_SERVER_ERROR', 'Test error');
      // Ensure the error has a stack trace by throwing and catching it
      try {
        throw error;
      } catch (e) {
        // Use the caught error with stack trace
        mockHealthServiceClient.getSystemStatus.mockRejectedValueOnce(e);
      }
      
      const response = await request(app)
        .get('/api/v1/edge/health')
        .expect('Content-Type', /json/)
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Test error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('errorCode');
      expect(mockHealthServiceClient.getSystemStatus).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('GET /api/v1/edge/health/db', () => {
    it('should return database health status from the client', async () => {
      const response = await request(app)
        .get('/api/v1/edge/health/db')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toEqual(mockDbHealthStatus);
      expect(mockHealthServiceClient.checkDbConnection).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors from the client', async () => {
      // Mock a client error with proper structure
      const error = new AppError('DATABASE_ERROR', 'Database error');
      // Ensure the error has a stack trace by throwing and catching it
      try {
        throw error;
      } catch (e) {
        // Use the caught error with stack trace
        mockHealthServiceClient.checkDbConnection.mockRejectedValueOnce(e);
      }
      
      const response = await request(app)
        .get('/api/v1/edge/health/db')
        .expect('Content-Type', /json/)
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Database error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('errorCode');
      expect(mockHealthServiceClient.checkDbConnection).toHaveBeenCalledTimes(1);
    });
  });
});
