/**
 * Edge API authentication routes
 * Handles user authentication and authorization
 */
import express, { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IOAuthProvider } from '../../providers/auth/IOAuthProvider';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { ValidationError, UnauthorizedError } from '../../utils/errors';
import { OAuthProvider } from '../../models/domain/users/User';
// Authentication errors handled by UnauthorizedError class

/**
 * Create authentication routes
 * @param userRepository - User repository for user operations
 * @param jwtService - JWT service for token generation
 * @param oauthProviders - Map of OAuth providers
 * @returns Express router with auth routes
 */
export function createAuthRoutes(
  userRepository: IUserRepository,
  jwtService: IJwtService,
  oauthProviders: Map<string, IOAuthProvider>
): Router {
  const router = express.Router();
  
  /**
   * Generate OAuth authorization URL
   * POST /auth/oauth/:provider/authorize
   */
  router.post('/oauth/:provider/authorize', async (
    req: Request, 
    res: Response, 
    next: NextFunction
  ) => {
    try {
      const { provider } = req.params;
      const { redirectUri } = req.body;
      
      // Validate input
      if (!redirectUri) {
        throw new ValidationError('Missing required field', 'redirectUri is required')
          .addError('redirectUri', 'Redirect URI is required');
      }
      
      // Get OAuth provider
      const oauthProvider = oauthProviders.get(provider);
      if (!oauthProvider) {
        throw new ValidationError(
          `Unsupported provider: ${provider}`, 
          `Provider ${provider} is not supported`
        )
          .addError('provider', `Provider ${provider} is not supported`);
      }
      
      // Generate state parameter for CSRF protection
      const oauthState = uuidv4();
      
      // Generate authorization URL
      const authUrl = await oauthProvider.getAuthorizationUrl(redirectUri, oauthState);
      
      // Return authorization URL and state
      res.json({
        authUrl,
        state: oauthState
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Exchange OAuth code for token
   * POST /auth/oauth/:provider/token
   */
  router.post('/oauth/:provider/token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider } = req.params;
      const { code, redirectUri } = req.body;
      
      // Validate input
      if (!code || !redirectUri) {
        throw new ValidationError('Missing required fields', 'code and redirectUri are required')
          .addError('code', 'Authorization code is required')
          .addError('redirectUri', 'Redirect URI is required');
      }
      
      // Get OAuth provider
      const oauthProvider = oauthProviders.get(provider);
      if (!oauthProvider) {
        throw new ValidationError(
          `Unsupported provider: ${provider}`, 
          `Provider ${provider} is not supported`
        )
          .addError('provider', `Provider ${provider} is not supported`);
      }
      
      // Exchange code for token and user profile
      const profile = await oauthProvider.exchangeCodeForToken(code, redirectUri);
      
      // Find or create user
      const user = await userRepository.findOrCreateUserByOAuth(
        provider as OAuthProvider,
        profile.providerId,
        {
          email: profile.email,
          displayName: profile.displayName,
          providerIdentity: profile.identity,
          refreshToken: profile.refreshToken
        }
      );
      
      // Generate JWT token
      const token = jwtService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.displayName,
        scopes: ['read:profile', 'read:conversations', 'write:conversations'],
        tier: 'edge'
      });
      
      // Return user and token
      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          // Safely access provider info
          profileImageUrl: provider === 'github' ? user.authProviders.github?.identity : null
        },
        token
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Refresh JWT token
   * POST /auth/token/refresh
   */
  router.post('/token/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      // Validate input
      if (!token) {
        throw new ValidationError('Missing required field', 'token is required')
          .addError('token', 'Token is required');
      }
      
      // Decode token (without verification) to get user ID
      const decodedToken = jwtService.decodeToken(token);
      if (!decodedToken) {
        throw new UnauthorizedError(
          'Invalid token format', 
          'The provided token could not be decoded'
        );
      }
      
      // Get user from repository
      const user = await userRepository.getUserById(decodedToken.userId);
      if (!user) {
        throw new UnauthorizedError(
          'User not found', 
          'User associated with this token no longer exists'
        );
      }
      
      // Generate new token
      const newToken = jwtService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.displayName,
        scopes: decodedToken.scopes,
        tier: decodedToken.tier
      });
      
      // Return new token
      res.json({
        token: newToken
      });
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}