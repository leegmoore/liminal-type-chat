import express from 'express';
import { createChatSubRouter } from './chat';
import { ChatService } from '../../services/core/ChatService';
import { LlmApiKeyManager } from '../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../../services/core/ContextThreadService';

/**
 * Creates and configures the chat routes
 * @returns Configured Express router
 */
export function createChatRoutes() {
  const router = express.Router();

  // Create and mount chat sub-router
  const chatSubRouter = createChatSubRouter();
  router.use('/api/v1/chat', chatSubRouter);
  
  return router;
}

/**
 * Creates a chat service with required dependencies
 * @param llmApiKeyManager API key manager for LLM providers
 * @param contextThreadService Context thread service for message storage
 * @returns Configured chat service
 */
export function createChatService(
  llmApiKeyManager: LlmApiKeyManager,
  contextThreadService: ContextThreadService
): ChatService {
  return new ChatService(llmApiKeyManager, contextThreadService);
}