import express, { Router, Request, Response, NextFunction } from 'express';
import { ChatService, ChatCompletionRequest } from '../../services/core/ChatService';
import { LlmServiceFactory } from '../../providers/llm/LlmServiceFactory';
import { LlmProvider, LlmServiceError } from '../../providers/llm/ILlmService';
import { NotFoundError } from '../../utils/errors';
import { createAuthMiddleware } from '../../middleware/auth-middleware';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../providers/db/users/IUserRepository';

// Define the extended Request type with user property
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    scopes: string[];
    tier: string;
  };
}

// Define BadRequestError (keeping it local if only used here)
class BadRequestError extends Error {
  status: number = 400;
  code?: string;
  details?: string;

  constructor(message: string, details?: string, code?: string) {
    super(message);
    this.name = 'BadRequestError';
    this.details = details;
    this.code = code;
  }
}

export function createChatSubRouter(jwtService: IJwtService, userRepository: IUserRepository): Router {
  const router = express.Router();

  // Apply authentication middleware correctly
  router.use(createAuthMiddleware(jwtService, userRepository));

  /**
   * Endpoint to list available LLM models for a provider
   * GET /models/:provider  (Note: path is relative to where this router is mounted)
   */
  router.get('/models/:provider', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { provider } = req.params;

      // Validate provider
      if (!LlmServiceFactory.getSupportedProviders().includes(provider as LlmProvider)) {
        throw new BadRequestError(
          `Unsupported provider: ${provider}`,
          `Provider must be one of: ${LlmServiceFactory.getSupportedProviders().join(', ')}`
        );
      }

      // Get chat service from app.locals
      const chatService = req.app.locals.services.chatService as ChatService;
      if (!chatService) {
        return next(new Error('ChatService not available on app.locals.services'));
      }

      // Get current user ID (this assumes authentication middleware sets req.user)
      if (!req.user || !req.user.userId) {
        return next(new Error('Authentication required: User ID not found.'));
      }
      const userId = req.user.userId;

      // Get available models
      const models = await chatService.getAvailableModels(userId, provider as LlmProvider);

      res.json({ models });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Endpoint to complete a chat prompt
   * POST /completions (Note: path is relative)
   */
  router.post('/completions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { prompt, provider, modelId, threadId, options } = req.body;

      // Validate required fields
      if (!prompt) {
        throw new BadRequestError('Prompt is required');
      }

      if (!provider) {
        throw new BadRequestError('Provider is required');
      }

      if (!threadId) {
        throw new BadRequestError('Thread ID is required');
      }

      // Validate provider
      if (!LlmServiceFactory.getSupportedProviders().includes(provider)) {
        throw new BadRequestError(
          `Unsupported provider: ${provider}`,
          `Provider must be one of: ${LlmServiceFactory.getSupportedProviders().join(', ')}`
        );
      }

      // Get chat service from app.locals
      const chatService = req.app.locals.services.chatService as ChatService;
      if (!chatService) {
        return next(new Error('ChatService not available on app.locals.services'));
      }

      // Get current user ID (this assumes authentication middleware sets req.user)
      if (!req.user || !req.user.userId) {
        return next(new Error('Authentication required: User ID not found.'));
      }
      const userId = req.user.userId;

      // Create request
      const completionRequest: ChatCompletionRequest = {
        prompt,
        provider: provider as LlmProvider, // Cast here after validation
        modelId,
        threadId,
        options
      };

      // Complete the prompt
      const completion = await chatService.completeChatPrompt(userId, completionRequest);

      res.json(completion);
    } catch (error) {
      if (error instanceof LlmServiceError) {
        next(new BadRequestError(error.message, error.details, error.code));
      } else if (error instanceof Error && error.message.includes('Thread not found')) {
        next(new NotFoundError(error.message));
      } else {
        next(error);
      }
    }
  });

  /**
   * Endpoint to stream a chat completion
   * GET /completions/stream (Note: path is relative)
   */
  router.get('/completions/stream', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Parameters are now from req.query for a GET request
      const { prompt, provider, modelId, threadId, options } = req.query as {
        prompt?: string;
        provider?: string;
        modelId?: string;
        threadId?: string;
        options?: any; // Adjust type as needed for options
      };

      // Validate required fields
      if (!prompt) {
        throw new BadRequestError('Prompt is required');
      }

      if (!provider) {
        throw new BadRequestError('Provider is required');
      }

      if (!threadId) {
        throw new BadRequestError('Thread ID is required');
      }

      // Validate provider
      if (!LlmServiceFactory.getSupportedProviders().includes(provider as LlmProvider)) {
        throw new BadRequestError(
          `Unsupported provider: ${provider}`,
          `Provider must be one of: ${LlmServiceFactory.getSupportedProviders().join(', ')}`
        );
      }

      // Get chat service from app.locals
      const chatService = req.app.locals.services.chatService as ChatService;
      if (!chatService) {
        return next(new Error('ChatService not available on app.locals.services'));
      }

      // Get current user ID (this assumes authentication middleware sets req.user)
      if (!req.user || !req.user.userId) {
        return next(new Error('Authentication required: User ID not found.'));
      }
      const userId = req.user.userId;

      // Create request
      const completionRequest: ChatCompletionRequest = {
        prompt,
        provider: provider as LlmProvider, // Cast here after validation
        modelId,
        threadId,
        options // options will be undefined if not provided, handle in ChatService
      };

      // Set up SSE response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Helper function to send SSE events
      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        // Check if flush exists before calling it
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      // Handle client disconnect
      const onClose = () => {
        res.end();
      };
      req.on('close', onClose);

      try {
        // Stream the completion
        await chatService.streamChatCompletion(userId, completionRequest, (chunk) => {
          sendEvent(chunk);

          // End the stream when done
          if (chunk.done) {
            res.end();
          }
        });
      } catch (streamError: any) {
        console.error('Error during chat stream processing:', streamError);
        // Send an error event over SSE before closing
        sendEvent({ 
          type: 'error', 
          message: 'Stream processing error',
          details: streamError.message || 'Unknown error'
        });
        res.end(); // Ensure the stream is closed
        // DO NOT call next(streamError) here if SSE headers are sent,
        // as it will lead to an HTML error response and MIME type mismatch.
      }
    } catch (error) {
      // This outer catch handles errors before SSE setup (e.g., validation)
      // or if the inner catch re-throws (which it doesn't currently)
      next(error);
    }
  });

  return router;
}