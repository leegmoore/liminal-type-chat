import express from 'express';
import { createChatSubRouter } from './chat';
import { ChatService } from '../../services/core/ChatService';
import { LlmApiKeyManager } from '../../providers/llm/LlmApiKeyManager';
import { ContextThreadService } from '../../services/core/ContextThreadService';
import { IJwtService } from '../../providers/auth/jwt/IJwtService';
import { IUserRepository } from '../../providers/db/users/IUserRepository';

/**
 * Creates and configures the chat routes
 * @param jwtService - JWT Service for authentication middleware in sub-router
 * @param userRepository - User Repository for authentication middleware in sub-router
 * @returns Configured Express router
 */
export function createChatRoutes(jwtService: IJwtService, userRepository: IUserRepository) {
  const router = express.Router();

  // Create and mount chat sub-router with JWT service and UserRepository
  const chatSubRouter = createChatSubRouter(jwtService, userRepository);
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