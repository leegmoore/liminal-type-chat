/**
 * Domain Health API Routes
 * Exposes canonical health endpoints for the application
 */
import { Router } from 'express';
import { HealthService } from '../../services/core/health-service';

/**
 * Create health routes with the provided health service
 * @param healthService - The health service to use
 * @returns Express router with health routes
 */
export const createHealthCheckRoutes = (healthService: HealthService) => {
  const router = Router();
  
  /**
   * @route GET /
   * @description Get the current system health status
   * @returns {Object} Health status object
   */
  router.get('/', async (_req, res, next) => {
    try {
      const status = await healthService.getSystemStatus();
      res.json(status);
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  });
  
  /**
   * @route GET /db
   * @description Get the current database health status
   * @returns {Object} Database health status object
   */
  router.get('/db', async (_req, res, next) => {
    try {
      const status = await healthService.checkDbConnection();
      res.json(status);
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  });
  
  return router;
};

export { createHealthCheckRoutes as createHealthRoutes };