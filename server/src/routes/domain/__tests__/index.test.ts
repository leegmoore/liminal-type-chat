/**
 * Test for domain API routes index
 */
import request from 'supertest';
import express from 'express';
import { createDomainApiRoutes } from '../index';
import { ContextThreadService } from '../../../services/core/ContextThreadService';
import { HealthService } from '../../../services/core/health-service';
// Phase 1: Auth removed
// import { IAuthBridgeService } from '../../../providers/auth/bridge/IAuthBridgeService';
import { environmentService } from '../../../services/core/EnvironmentService';

describe('Domain API Routes', () => {
  let app: express.Application;
  // Phase 1: Auth removed - mockAuthBridgeService no longer needed
  let mockContextThreadService: jest.Mocked<ContextThreadService>;
  let mockHealthService: jest.Mocked<HealthService>;
  
  beforeEach(() => {
    // Mock environment service
    jest.spyOn(environmentService, 'isLocalEnvironment').mockReturnValue(false);
    
    mockContextThreadService = {
      getContextThread: jest.fn(),
      createContextThread: jest.fn(),
      updateContextThread: jest.fn(),
      getContextThreads: jest.fn().mockReturnValue([]), // Changed to match actual method name
      listContextThreads: jest.fn().mockReturnValue([]), // Keep for compatibility
      deleteContextThread: jest.fn()
    } as unknown as jest.Mocked<ContextThreadService>;
    
    mockHealthService = {
      getSystemStatus: jest.fn(),
      checkDbConnection: jest.fn()
    } as unknown as jest.Mocked<HealthService>;
    
    // Set up successful responses
    mockHealthService.getSystemStatus.mockResolvedValue({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
    
    // Phase 1: Auth removed - mock auth validation no longer needed
    
    // Create Express app
    app = express();
    
    // Add domain routes
    // Phase 1: Auth removed - authBridgeService parameter removed
    const domainApiRoutes = createDomainApiRoutes(
      mockContextThreadService,
      mockHealthService
    );
    
    app.use('/api/v1/domain', domainApiRoutes);
    
    // Error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    });
  });
  
  describe('Route Configuration', () => {
    it('should mount health routes without authentication', async () => {
      // Act
      const response = await request(app).get('/api/v1/domain/health');
      
      // Assert
      expect(response.status).toBe(200);
      expect(mockHealthService.getSystemStatus).toHaveBeenCalled();
      // Phase 1: Auth removed - no auth validation to check
    });
    
    it('should mount thread routes without authentication', async () => {
      // Act - send request without auth
      const response = await request(app)
        .get('/api/v1/domain/threads');
      
      // Assert - works without auth
      expect(response.status).toBe(200);
      expect(mockContextThreadService.getContextThreads).toHaveBeenCalled();
    });
    
    it('should work without authorization header', async () => {
      // Act - send request without authorization header
      const response = await request(app).get('/api/v1/domain/threads');
      
      // Assert - works without auth
      expect(response.status).toBe(200);
      expect(mockContextThreadService.getContextThreads).toHaveBeenCalled();
    });
  });
});