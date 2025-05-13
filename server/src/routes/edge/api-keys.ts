/**
 * Edge API routes for API key management
 * Handles storing, retrieving, and deleting API keys
 */
import express, { Router, Response, NextFunction } from 'express';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/auth-middleware';
import { withAuthenticatedUser } from '../../middleware/auth-utils';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { ValidationError } from '../../utils/errors';
import { LlmProvider } from '../../models/domain/users/User';

/**
 * Create API key management routes
 * @param userRepository - User repository for API key operations
 * @param jwtService - JWT service for authentication
 * @returns Express router with API key routes
 */
export function createApiKeyRoutes(
  userRepository: IUserRepository,
  jwtService: IJwtService
): Router {
  const router = express.Router();
  
  // Add authentication middleware
  router.use(createAuthMiddleware(jwtService));
  
  /**
   * Store an API key
   * POST /api-keys/:provider
   */
  router.post('/:provider', withAuthenticatedUser(async (
    userId: string,
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { provider } = req.params;
      const { apiKey, label } = req.body;
      
      // Validate input
      if (!apiKey) {
        throw new ValidationError('Missing required field', 'apiKey is required')
          .addError('apiKey', 'API key is required');
      }
      
      // Validate provider
      if (!isValidProvider(provider)) {
        throw new ValidationError(`Unsupported provider: ${provider}`, `Provider ${provider} is not supported`)
          .addError('provider', `Provider ${provider} is not supported`);
      }
      
      // Store API key
      await userRepository.storeApiKey(
        userId,
        provider as LlmProvider,
        apiKey,
        label
      );
      
      // Return success
      res.status(201).json({
        provider,
        message: 'API key stored successfully',
        hasKey: true
      });
    } catch (error) {
      next(error);
    }
  }));
  
  /**
   * Check if user has an API key for a provider
   * GET /api-keys/:provider
   */
  router.get('/:provider', withAuthenticatedUser(async (
    userId: string,
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { provider } = req.params;
      
      // Validate provider
      if (!isValidProvider(provider)) {
        throw new ValidationError(`Unsupported provider: ${provider}`, `Provider ${provider} is not supported`)
          .addError('provider', `Provider ${provider} is not supported`);
      }
      
      // Get API key
      const apiKeyInfo = await userRepository.getApiKey(
        userId,
        provider as LlmProvider
      );
      
      // Return API key status
      res.json({
        provider,
        hasKey: !!apiKeyInfo,
        label: apiKeyInfo?.label,
        createdAt: apiKeyInfo?.createdAt
      });
    } catch (error) {
      next(error);
    }
  }));
  
  /**
   * Delete an API key
   * DELETE /api-keys/:provider
   */
  router.delete('/:provider', withAuthenticatedUser(async (
    userId: string,
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { provider } = req.params;
      
      // Validate provider
      if (!isValidProvider(provider)) {
        throw new ValidationError(`Unsupported provider: ${provider}`, `Provider ${provider} is not supported`)
          .addError('provider', `Provider ${provider} is not supported`);
      }
      
      // Delete API key
      const deleted = await userRepository.deleteApiKey(
        userId,
        provider as LlmProvider
      );
      
      // Return success/failure
      if (deleted) {
        res.status(200).json({
          provider,
          message: 'API key deleted successfully',
          hasKey: false
        });
      } else {
        res.status(404).json({
          provider,
          message: 'No API key found for this provider',
          hasKey: false
        });
      }
    } catch (error) {
      next(error);
    }
  }));
  
  return router;
}

/**
 * Validate if a provider is supported
 * @param provider - Provider name to validate
 * @returns true if provider is supported, false otherwise
 */
function isValidProvider(provider: string): boolean {
  const supportedProviders: LlmProvider[] = ['openai', 'anthropic'];
  return supportedProviders.includes(provider as LlmProvider);
}