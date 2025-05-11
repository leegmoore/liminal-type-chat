/**
 * Edge Health Routes
 * Routes for the edge tier that communicate with the domain tier
 * through the domain client adapter
 */
import { Router } from 'express';
import { HealthServiceClient } from '../../clients/domain/health-service-client';

/**
 * Create edge health routes with the provided health service client
 * @param healthServiceClient - The health service client to use
 * @returns Express router with edge health routes
 */
export const createEdgeHealthRoutes = (healthServiceClient: HealthServiceClient) => {
  const router = Router();
  
  /**
   * @route GET /api/v1/edge/health
   * @description Get the current system health status using the domain client
   * @returns {Object} Health status object
   */
  router.get('/api/v1/edge/health', async (_req, res, next) => {
    try {
      const status = await healthServiceClient.getSystemStatus();
      res.json(status);
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  });
  
  /**
   * @route GET /api/v1/edge/health/db
   * @description Get the database health status using the domain client
   * @returns {Object} Database health status object
   */
  router.get('/api/v1/edge/health/db', async (_req, res, next) => {
    try {
      const status = await healthServiceClient.checkDbConnection();
      res.json(status);
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  });
  
  return router;
};
