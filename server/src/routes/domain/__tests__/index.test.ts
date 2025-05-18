/**
 * Test for domain API routes index
 */
import request from 'supertest';
import express from 'express';
import { createDomainApiRoutes } from '../index';
import { ContextThreadService } from '../../../services/core/ContextThreadService';
import { HealthService } from '../../../services/core/health-service';
import { IAuthBridgeService } from '../../../providers/auth/bridge/IAuthBridgeService';
import { environmentService } from '../../../services/core/EnvironmentService';

describe('Domain API Routes', () => {
  let app: express.Application;
  let mockAuthBridgeService: jest.Mocked<IAuthBridgeService>;
  let mockContextThreadService: jest.Mocked<ContextThreadService>;
  let mockHealthService: jest.Mocked<HealthService>;
  
  beforeEach(() => {
    // Mock environment service to ensure auth is required
    jest.spyOn(environmentService, 'isLocalEnvironment').mockReturnValue(false);
    jest.spyOn(environmentService, 'isAuthRequired').mockReturnValue(true);
    
    // Create mock services
    mockAuthBridgeService = {
      validateEdgeToken: jest.fn(),
      validateDomainToken: jest.fn(),
      generateDomainToken: jest.fn()
    } as unknown as jest.Mocked<IAuthBridgeService>;
    
    mockContextThreadService = {
      getContextThread: jest.fn(),
      createContextThread: jest.fn(),
      updateContextThread: jest.fn(),
      listContextThreads: jest.fn(),
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
    
    mockAuthBridgeService.validateDomainToken.mockResolvedValue({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      scopes: ['domain:access'],
      tier: 'domain',
      tokenId: 'token-123',
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      domainScopes: ['domain:access'],
      sourceTokenId: 'source-token-123'
    });
    
    // Create Express app
    app = express();
    
    // Add domain routes
    const domainApiRoutes = createDomainApiRoutes(
      mockAuthBridgeService,
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
      expect(mockAuthBridgeService.validateDomainToken).not.toHaveBeenCalled();
    });
    
    it('should mount thread routes with authentication', async () => {
      // Arrange - simulate missing auth token
      mockAuthBridgeService.validateDomainToken.mockRejectedValueOnce(new Error('Unauthorized'));
      
      // Act - send request with invalid bearer token
      const response = await request(app)
        .get('/api/v1/domain/threads')
        .set('Authorization', 'Bearer invalid_token');
      
      // Assert - should be unauthorized without a valid token
      expect(response.status).toBe(500); // Goes through our test error handler
      expect(mockAuthBridgeService.validateDomainToken).toHaveBeenCalled();
      expect(mockContextThreadService.listContextThreads).not.toHaveBeenCalled();
    });
    
    it('should return 500 when no authorization header is provided for protected routes', async () => {
      // Act - send request with no authorization header
      const response = await request(app).get('/api/v1/domain/threads');
      
      // Assert - should be unauthorized
      expect(response.status).toBe(500); // Goes through our test error handler
      expect(mockContextThreadService.listContextThreads).not.toHaveBeenCalled();
    });
  });
});