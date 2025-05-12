/**
 * Domain API routes for ContextThread functionality.
 * 
 * These routes expose the ContextThreadService operations as REST endpoints.
 * They are called by Edge API routes (via the Domain Client Adapter pattern)
 * and can support both single-process and multi-process deployment models.
 */
import { Router, Request, Response } from 'express';
import { 
  ContextThreadService, 
  CreateThreadParams, 
  AddMessageParams, 
  UpdateThreadParams 
} from '../../services/core/ContextThreadService';
import { MessagesCorruptedError } from '../../providers/db/errors';

/**
 * Creates and configures the context thread domain routes.
 * @param service The ContextThreadService instance to use
 * @returns The configured router
 */
export function createContextThreadRoutes(service: ContextThreadService): Router {
  const router = Router();

  /**
 * GET /api/v1/domain/threads/:id
 * Get a thread by ID
 */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const thread = service.getThread(threadId);
    
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: `Thread with ID ${threadId} not found`
        });
      }
    
      return res.status(200).json({
        success: true,
        data: thread
      });
    } catch (error) {
      if (error instanceof MessagesCorruptedError) {
        return res.status(500).json({
          success: false,
          message: 'The thread data is corrupted and cannot be processed',
          error: error.message
        });
      }
    
      console.error('Error getting thread:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while retrieving the thread'
      });
    }
  });

  /**
 * POST /api/v1/domain/threads
 * Create a new thread
 */
  router.post('/', (req: Request, res: Response) => {
    try {
      const params: CreateThreadParams = {
        title: req.body.title,
        initialMessage: req.body.initialMessage,
        metadata: req.body.metadata
      };
    
      const thread = service.createThread(params);
    
      return res.status(201).json({
        success: true,
        data: thread
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while creating the thread'
      });
    }
  });

  /**
 * PUT /api/v1/domain/threads/:id
 * Update a thread
 */
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const params: UpdateThreadParams = {
        title: req.body.title,
        metadata: req.body.metadata
      };
    
      const thread = service.updateThread(threadId, params);
    
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: `Thread with ID ${threadId} not found`
        });
      }
    
      return res.status(200).json({
        success: true,
        data: thread
      });
    } catch (error) {
      console.error('Error updating thread:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while updating the thread'
      });
    }
  });

  /**
 * DELETE /api/v1/domain/threads/:id
 * Delete a thread
 */
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const deleted = service.deleteThread(threadId);
    
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Thread with ID ${threadId} not found`
        });
      }
    
      return res.status(200).json({
        success: true,
        message: 'Thread deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while deleting the thread'
      });
    }
  });

  /**
 * POST /api/v1/domain/threads/:id/messages
 * Add a message to a thread
 */
  router.post('/:id/messages', (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const params: AddMessageParams = {
        role: req.body.role,
        content: req.body.content,
        metadata: req.body.metadata,
        status: req.body.status
      };
    
      const thread = service.addMessage(threadId, params);
    
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: `Thread with ID ${threadId} not found`
        });
      }
    
      return res.status(201).json({
        success: true,
        data: thread
      });
    } catch (error) {
      console.error('Error adding message:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while adding the message'
      });
    }
  });

  /**
 * PUT /api/v1/domain/threads/:id/messages/:messageId
 * Update a message in a thread
 */
  router.put('/:id/messages/:messageId', (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const messageId = req.params.messageId;
    
      const updates = {
        content: req.body.content,
        status: req.body.status,
        metadata: req.body.metadata
      };
    
      const thread = service.updateMessage(threadId, messageId, updates);
    
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: `Thread with ID ${threadId} or message with ID ${messageId} not found`
        });
      }
    
      return res.status(200).json({
        success: true,
        data: thread
      });
    } catch (error) {
      console.error('Error updating message:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while updating the message'
      });
    }
  });

  /**
 * GET /api/v1/domain/threads/:id/messages
 * Get all messages for a thread
 */
  router.get('/:id/messages', (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const thread = service.getThread(threadId);
    
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: `Thread with ID ${threadId} not found`
        });
      }
    
      return res.status(200).json({
        success: true,
        data: thread.messages
      });
    } catch (error) {
      if (error instanceof MessagesCorruptedError) {
        return res.status(500).json({
          success: false,
          message: 'The thread messages data is corrupted and cannot be processed',
          error: error.message
        });
      }
    
      console.error('Error getting messages:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while retrieving the messages'
      });
    }
  });

  return router;
}

// Export the routes creation function as the default
export default createContextThreadRoutes;
