/**
 * Edge API authentication routes
 * Handles user authentication and authorization
 */
import express, { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IOAuthProvider, PkceOptions } from '../../providers/auth/IOAuthProvider';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { ValidationError, UnauthorizedError } from '../../utils/errors';
import { OAuthProvider } from '../../models/domain/users/User';
// PKCE utilities imported via PkceAuthData
import { 
  pkceStorage, 
  PkceAuthData 
} from '../../providers/auth/pkce/PkceStorage';

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
      const { redirectUri, usePkce = true } = req.body;
      
      // Validate input
      if (!redirectUri) {
        const error = new ValidationError('Missing required field', 'redirectUri is required');
        error.addError('redirectUri', 'Redirect URI is required');
        throw error;
      }
      
      // Get OAuth provider
      const oauthProvider = oauthProviders.get(provider);
      if (!oauthProvider) {
        const error = new ValidationError(
          `Unsupported provider: ${provider}`, 
          `Provider ${provider} is not supported`
        );
        error.addError('provider', `Provider ${provider} is not supported`);
        throw error;
      }
      
      // Generate state parameter for CSRF protection
      const oauthState = uuidv4();
      
      // Setup PKCE if the provider supports it and it's not explicitly disabled
      let authUrl: string;
      let pkceData: PkceAuthData | undefined;
      
      if (usePkce && oauthProvider.supportsPkce) {
        // Generate PKCE code verifier and challenge
        pkceData = pkceStorage.createAuthSession(redirectUri, {
          challengeMethod: 'S256'
        });
        
        // Create PKCE options for authorization request
        const pkceOptions: PkceOptions = {
          codeChallenge: pkceData.codeChallenge,
          codeChallengeMethod: pkceData.codeChallengeMethod
        };
        
        // Generate authorization URL with PKCE
        authUrl = oauthProvider.getAuthorizationUrl(
          redirectUri, 
          pkceData.state, 
          undefined, // Use default scopes
          pkceOptions
        );
      } else {
        // Generate authorization URL without PKCE
        authUrl = oauthProvider.getAuthorizationUrl(redirectUri, oauthState);
        
        // Store basic auth data for state validation
        pkceData = {
          state: oauthState,
          codeVerifier: '', // No code verifier for non-PKCE flow
          codeChallenge: '',
          codeChallengeMethod: 'plain',
          redirectUri,
          createdAt: Date.now()
        };
        pkceStorage.storeAuthData(pkceData);
      }
      
      // Return authorization URL and state
      res.json({
        authUrl,
        state: pkceData.state,
        pkceEnabled: usePkce && oauthProvider.supportsPkce
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
      const { code, redirectUri, state } = req.body;
      
      // Validate input
      if (!code || !redirectUri || !state) {
        const error = new ValidationError(
          'Missing required fields', 
          'code, redirectUri and state are required'
        );
        error.addError('code', 'Authorization code is required');
        error.addError('redirectUri', 'Redirect URI is required');
        error.addError('state', 'State parameter is required');
        throw error;
      }
      
      // Get OAuth provider
      const oauthProvider = oauthProviders.get(provider);
      if (!oauthProvider) {
        const error = new ValidationError(
          `Unsupported provider: ${provider}`, 
          `Provider ${provider} is not supported`
        );
        error.addError('provider', `Provider ${provider} is not supported`);
        throw error;
      }
      
      // Verify state and get stored PKCE data
      const authData = pkceStorage.getAuthDataByState(state);
      if (!authData) {
        throw new UnauthorizedError(
          'Invalid OAuth state', 
          'The OAuth state parameter is invalid or expired'
        );
      }
      
      // Verify the redirect URI matches what was used for authorization
      if (authData.redirectUri !== redirectUri) {
        throw new UnauthorizedError(
          'Redirect URI mismatch', 
          'The redirect URI does not match the one used for authorization'
        );
      }
      
      // Exchange code for token with or without PKCE
      const profile = oauthProvider.supportsPkce && authData.codeVerifier
        ? await oauthProvider.exchangeCodeForToken(
          code, 
          redirectUri, 
          authData.codeVerifier
        )
        : await oauthProvider.exchangeCodeForToken(code, redirectUri);
      
      // Clean up PKCE data after use
      pkceStorage.removeAuthDataByState(state);
      
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

  /**
   * Cleanup expired PKCE sessions (maintenance endpoint)
   * POST /auth/maintenance/cleanup-sessions
   */
  router.post('/maintenance/cleanup-sessions', (_req: Request, res: Response) => {
    // Clean up expired PKCE sessions (default 10 minutes)
    pkceStorage.cleanupExpiredSessions();
    
    res.json({ 
      success: true, 
      message: 'Expired authentication sessions cleaned up' 
    });
  });
  
  return router;
}