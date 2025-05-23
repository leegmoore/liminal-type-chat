console.log('conversation.ts: MODULE EXECUTION STARTED'); // Log at the very top

// eslint-disable-next-line max-len
import express, { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ErrorObject } from 'ajv';
import { ValidationError, AppError } from '../../utils/errors'; // Import AppError
// Use ResourceErrorCode for resource-specific errors like NOT_FOUND
import { ResourceErrorCode } from '../../utils/error-codes'; // Import ResourceErrorCode
// Import domain types
import { MessageRole, MessageStatus } from '../../types/domain'; 
// Import this way to avoid circular dependencies
import * as ctcFactory from '../../clients/domain/context-thread-client-factory';
// Import auth dependencies
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../providers/db/users/IUserRepository';
import { createAuthMiddleware } from '../../middleware/auth-middleware';
import {
  domainContextThreadToConversationResponse,
  domainContextThreadToConversationSummary,
  conversationRequestToCreateContextThreadParams,
  domainMessageToMessageResponse,
  CreateConversationRequest,
  AddMessageRequest
} from './transformers/conversation-transformers';

// Import JSON schemas for request/response validation
import CreateConversationRequestSchema from '../../schemas/edge/CreateConversationRequest.json';
import UpdateConversationRequestSchema from '../../schemas/edge/UpdateConversationRequest.json';
import AddMessageRequestSchema from '../../schemas/edge/AddMessageRequest.json';

// Set up JSON schema validator
const ajv = new Ajv({
  allErrors: true,
  strict: true, // Enable strict mode
  strictTypes: true, // Enforce strict type checking
  strictRequired: true // Enforce required fields strictly
});
addFormats(ajv);

// Compile schemas
const validateCreateConversationRequest = ajv.compile(CreateConversationRequestSchema);
const validateUpdateConversationRequest = ajv.compile(UpdateConversationRequestSchema);
const validateAddMessageRequest = ajv.compile(AddMessageRequestSchema);

// Debug validation in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Ajv options:', ajv.opts);
}

console.log(
  'conversation.ts: contextThreadClient at module level - Type:', typeof ctcFactory,
  '| Keys:', ctcFactory ? Object.keys(ctcFactory).join(', ') : 'null/undefined'
);

const getClientFn_forLogL42 = ctcFactory.getContextThreadClient;
const isClientMockFunction_forLogL42 =
  typeof getClientFn_forLogL42 === 'function' &&
  // eslint-disable-next-line no-prototype-builtins
  getClientFn_forLogL42.hasOwnProperty('_isMockFunction');

// Need to use unknown first per TypeScript error suggestion
const clientMockStatus_forLogL42 = isClientMockFunction_forLogL42
  ? (getClientFn_forLogL42 as unknown as { _isMockFunction: boolean })._isMockFunction
  : 'Not a Jest mock or not a function';

console.log(
  'conversation.ts: Imported getContextThreadClient at module level - Type:',
  typeof getClientFn_forLogL42,
  '| Is it a Jest mock?',
  clientMockStatus_forLogL42
);

/**
 * Creates route handlers for Edge API conversation operations
 * @param jwtService - JWT Service for authentication
 * @param userRepository - User Repository for authentication
 * @returns Express router with conversation routes
 */
export const createConversationRoutes = (
  jwtService: IJwtService,
  userRepository: IUserRepository
) => {
  console.log(
    'createConversationRoutes: contextThreadClient - Type:', typeof ctcFactory,
    '| Keys:', ctcFactory ? Object.keys(ctcFactory).join(', ') : 'null/undefined'
  );
  const router = express.Router();
  const clientInstance = ctcFactory.getContextThreadClient(); // Get the instance from the factory

  console.log(
    'createConversationRoutes: clientInstance - Type:', typeof clientInstance,
    '| Keys:', clientInstance ? Object.keys(clientInstance).join(', ') : 'null/undefined'
  );

  // Apply authentication middleware to all routes
  router.use(createAuthMiddleware(jwtService, userRepository, {
    required: true,
    requiredScopes: [],
    requiredTier: 'edge'
  }));

  // GET /api/v1/conversations - Get all conversations
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      
      console.log(
        'GET /api/v1/conversations route handler: typeof clientInstance.getThreads:',
        typeof clientInstance?.getThreads
      );
      const threads = await clientInstance.getThreads(limit, offset);
      
      // Log the threads array before mapping
      console.log(
        'GET /api/v1/conversations: Threads received from clientInstance.getThreads:',
        JSON.stringify(threads, null, 2)
      );

      let conversations;
      try {
        console.log('GET /api/v1/conversations: About to map threads to conversation summaries.');
        conversations = threads.map(domainContextThreadToConversationSummary);
        console.log('GET /api/v1/conversations: Successfully mapped threads.');
      } catch (mapError) {
        console.error('Error during threads.map in GET /api/v1/conversations:', mapError);
        const mapErrorProps = (mapError && typeof mapError === 'object') 
          ? Object.getOwnPropertyNames(mapError) 
          : undefined;
        console.error(
          'GET /api/v1/conversations: mapError details:', 
          JSON.stringify(mapError, mapErrorProps)
        );
        // Return a 500 error immediately instead of re-throwing
        return res.status(500).json({
          error: {
            message: 'Error processing conversation data',
            details: 'Failed to map thread data to conversation format'
          }
        });
      }
      
      return res.json({ conversations });
    } catch (error) {
      console.error('Error in GET /api/v1/conversations handler:', error);
      const errorPropsL115 = (error && typeof error === 'object') 
        ? Object.getOwnPropertyNames(error) 
        : undefined;
      console.error(
        'GET /api/v1/conversations: Error details:', 
        JSON.stringify(error, errorPropsL115)
      );
      return next(error);
    }
  });

  // POST /api/v1/conversations - Create a new conversation
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log request body in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          'POST /api/v1/conversations - Request body:',
          JSON.stringify(req.body, null, 2)
        );
      }

      // Validate request body
      const isValid = validateCreateConversationRequest(req.body);

      // Log validation result in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Validation result:', isValid);
        console.log('Validation errors:', validateCreateConversationRequest.errors);
      }

      if (!isValid) {
        // Format validation errors and create properly structured ValidationError
        const errorDetails = formatValidationErrors(validateCreateConversationRequest.errors);
        console.log('Formatted validation errors:', errorDetails);

        // Create a ValidationError instance
        const validationError = new ValidationError(
          'Invalid conversation data',
          errorDetails
        );

        // Log the validation error for debugging
        console.log('Created ValidationError:', JSON.stringify(validationError, null, 2));

        // Use the next function to pass to error handler
        return next(validationError);
      }

      // Transform request to domain model
      const threadParams =
        conversationRequestToCreateContextThreadParams(req.body as CreateConversationRequest);

      // Create thread in domain
      const thread = await clientInstance.createContextThread(threadParams);

      // Transform response and send
      const conversation = domainContextThreadToConversationResponse(thread);
      return res.status(201).json(conversation);
    } catch (error) {
      return next(error);
    }
  });

  // GET /api/v1/conversations/:conversationId - Get a conversation by ID
  router.get('/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      
      const thread = await clientInstance.getContextThread(conversationId);
      
      if (!thread) {
        // Throw standard error to be handled by the global error handler
        // Use the correct error code for resource not found
        throw new AppError(ResourceErrorCode.RESOURCE_NOT_FOUND);
      }
      
      const conversation = domainContextThreadToConversationResponse(thread);
      return res.json(conversation);
    } catch (error) {
      // Log the caught error in the :conversationId route
      console.error(
        `Error in GET /api/v1/conversations/:${req.params.conversationId} handler:`,
        error
      );
      const errorConstructorNameL163 = (error && typeof error === 'object' && error.constructor) 
        ? error.constructor.name 
        : 'Unknown';
      console.error(
        `GET /api/v1/conversations/:${req.params.conversationId}: Caught Error Type:`,
        errorConstructorNameL163
      );
      const errorPropsL164 = (error && typeof error === 'object') 
        ? Object.getOwnPropertyNames(error) 
        : undefined;
      console.error(
        `GET /api/v1/conversations/:${req.params.conversationId}: Error properties:`,
        JSON.stringify(error, errorPropsL164)
      );
      return next(error);
    }
  });

  // PUT /api/v1/conversations/:conversationId - Update conversation properties (title, metadata)
  router.put('/:conversationId', 
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { conversationId } = req.params;
        
        // Validate request body
        const isValid = validateUpdateConversationRequest(req.body);
        
        // Log validation result in development
        if (process.env.NODE_ENV !== 'production') {
          console.log('Validation result:', isValid);
          console.log('Validation errors:', validateUpdateConversationRequest.errors);
        }
        
        if (!isValid) {
          const errorDetails = formatValidationErrors(validateUpdateConversationRequest.errors);
          console.log('Formatted validation errors:', errorDetails);
          
          // Create a ValidationError instance
          const validationError = new ValidationError(
            'Invalid conversation update data',
            errorDetails
          );
          
          // Log the validation error for debugging
          console.log('Created ValidationError:', JSON.stringify(validationError, null, 2));
          
          // Pass to error handler
          return next(validationError);
        }
        
        // Update thread in domain
        // Type has been validated by schema
        const validatedBody = req.body as unknown as {
          title?: string | null;
          metadata?: Record<string, unknown>;
        };
        
        const thread = await clientInstance.updateContextThread(conversationId, {
          title: validatedBody.title as string | undefined, // Cast to correct type
          metadata: validatedBody.metadata
        });
        
        if (!thread) {
          return res.status(404).json({
            error: 'ContextThread not found',
            message: `ContextThread with ID ${conversationId} not found`
          });
        }
        
        // Transform response and send
        const conversation = domainContextThreadToConversationResponse(thread);
        return res.json(conversation);
      } catch (error) {
        return next(error);
      }
    }
  );

  // DELETE /api/v1/conversations/:conversationId - Delete a conversation
  router.delete('/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      
      await clientInstance.deleteContextThread(conversationId);
      
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  // POST /api/v1/conversations/:conversationId/messages - Add a message to a conversation
  // Add a message to a conversation
  router.post(
    '/:conversationId/messages', 
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { conversationId } = req.params;
      
        // Validate request body
        if (!validateAddMessageRequest(req.body)) {
          const errorDetails = formatValidationErrors(validateAddMessageRequest.errors);
          return next(new ValidationError(
            'Invalid message data',
            errorDetails
          ));
        }
      
        // Additional validation to ensure required fields exist
        // Check if the request has the required fields
        if (
          !req.body ||
        typeof req.body !== 'object' ||
        !('content' in req.body) ||
        !('role' in req.body)
        ) {
          return next(new ValidationError(
            'Invalid message format',
            'Request body must contain content and role fields'
          ));
        }
      
        // Use an explicit type assertion with 'unknown' to satisfy TypeScript
        const validatedBody = req.body as unknown as AddMessageRequest;
      
        // Ensure all required fields are present to satisfy Omit<Message, 'id' | 'threadId'>
        const domainMessage = {
          content: validatedBody.content,
          role: validatedBody.role as MessageRole,
          createdAt: Date.now(), // Add required field
          // Add required field with default
          status: (validatedBody.status || 'delivered') as MessageStatus,
          metadata: validatedBody.metadata
        };
      
        // Add message to thread in domain
        const updatedThread = await clientInstance.addMessageToContextThread(
          conversationId,
          domainMessage
        );
      
        if (!updatedThread) {
          return res.status(404).json({
            error: 'ContextThread not found',
            message: `ContextThread with ID ${conversationId} not found`
          });
        }
      
        // Get the newly added message (should be the last one)
        const newMessage = updatedThread.messages[updatedThread.messages.length - 1];

        if (!newMessage) {
          // This should ideally not happen if addMessageToContextThread worked correctly
          // and returned the updated thread with the new message.
          return res.status(500).json({ 
            error: 'Failed to retrieve added message',
            details: 'The message was added, but could not be retrieved from the updated thread.'
          });
        }
      
        // Transform response and send
        // Transform the new message to a message response
        const messageResponse = domainMessageToMessageResponse(
          newMessage
        );
        return res.status(201).json(messageResponse);
      } catch (error) {
        return next(error);
      }
    });

  // PUT /api/v1/conversations/:conversationId/messages/:messageId - Update message
  /*
  router.put(
    '/:conversationId/messages/:messageId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { conversationId, messageId } = req.params;
        // For simplifying type issues in commented code
  // Using unknown type for commented/inactive code
  const validatedBody = req.body as unknown;

        // Ensure there's something to update
        if (Object.keys(validatedBody).length === 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Request body must contain at least one field to update ' +
              '(content, metadata, or status).'
          });
        }

        const updateParams: Partial<Pick<Message, 'content' | 'metadata' | 'status'>> = {};
        if (validatedBody.content !== undefined) updateParams.content = validatedBody.content;
        if (validatedBody.metadata !== undefined) updateParams.metadata = validatedBody.metadata;
        if (validatedBody.status !== undefined) {
          updateParams.status = validatedBody.status as MessageStatus;
        }

        // const updatedThread = await clientInstance.updateMessageInContextThread(
        //   conversationId,
        //   messageId,
        //   updateParams
        // ); // updateMessageInContextThread does not exist on the client interface

        // if (!updatedThread) {
        //   return res.status(404).json({
        //     error: 'ContextThread or Message not found',
        //     message: `ContextThread with ID ${conversationId} or Message with ID ${messageId} ` +
        //       'not found, or update failed.'
        //   });
        // }

        const updatedMessage = updatedThread.messages.find((m: Message) => m.id === messageId);

        // if (!updatedMessage) {
        //   return res.status(404).json({
        //     error: 'Message not found after update',
        //     message: `Message with ID ${messageId} not found in thread ${conversationId} ` +
        //       'after update.'
        //   });
        // }

        // const messageResponse = domainMessageToMessageResponse(updatedMessage);
        // return res.json(messageResponse);
        return res.status(501).json({ error: 'Not Implemented' }); // Temporarily return 501
      } catch (error) {
        return next(error);
      }
    }
  );
  */

  return router;
};

/**
 * Helper function to format validation errors from Ajv into a string
 * @param errors Validation errors from Ajv
 * @returns Formatted error string
 */
function formatValidationErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return 'Validation failed';
  }

  return errors.map(err => {
    // Handle instancePath which might not exist in some versions of ajv
    const path = (err as unknown as { instancePath?: string }).instancePath || '';
    const property = path.length > 0 
      ? path.substring(1) 
      : ((err.params as unknown as { missingProperty?: string })?.missingProperty) || 'input';
    return `${property}: ${err.message || 'invalid'}`;
  }).join(', ');
}
