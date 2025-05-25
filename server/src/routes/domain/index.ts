/**
 * Domain API routes index
 * 
 * Exports route creation functions for domain API endpoints.
 * These routes handle core business logic operations and
 * are protected by domain tier authentication.
 */
import { Router } from 'express';
import { createContextThreadRoutes } from './context-thread';
import { createHealthCheckRoutes } from './health';
import { ContextThreadService } from '../../services/core/ContextThreadService';
import { HealthService } from '../../services/core/health-service';

/**
 * Creates and configures all domain API routes
 * 
 * @param contextThreadService - Context thread service for thread operations
 * @param healthService - Health service for system diagnostics
 * @returns The configured domain API router
 */
export function createDomainApiRoutes(
  contextThreadService: ContextThreadService,
  healthService: HealthService
): Router {
  const router = Router();
  
  // Phase 1: Auth removed - mount thread routes directly without authentication
  const threadRoutes = createContextThreadRoutes(contextThreadService);
  router.use('/threads', threadRoutes);
  
  // Create and mount health check routes (no auth required for health checks)
  const healthRoutes = createHealthCheckRoutes(healthService);
  router.use('/health', healthRoutes);
  
  return router;
}

export default createDomainApiRoutes;