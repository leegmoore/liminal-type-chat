import { ContextThreadService } from '../../services/core/ContextThreadService';
import { 
  ContextThread, 
  CreateContextThreadParams, 
  Message, 
  UpdateContextThreadParams 
} from '../../types/domain';
import { ContextThreadClient } from './context-thread-client';

/**
 * Direct client for the Context Thread domain service
 * Uses in-process calls to the domain service
 */
export class DirectContextThreadClient implements ContextThreadClient {
  constructor(private service: ContextThreadService) {}

  /**
   * Get a list of context threads
   * @param limit Maximum number of context threads to return
   * @param offset Number of context threads to skip
   * @returns Promise resolving to context threads array
   */
  async getThreads(limit = 20, offset = 0): Promise<ContextThread[]> {
    return this.service.getContextThreads(limit, offset);
  }

  /**
   * Get a context thread by ID
   * @param id ContextThread ID
   * @returns Promise resolving to context thread or null if not found
   */
  async getContextThread(id: string): Promise<ContextThread | null> {
    return this.service.getContextThread(id);
  }

  /**
   * Create a new context thread
   * @param params Context thread creation parameters
   * @returns Promise resolving to created context thread
   */
  async createContextThread(params: CreateContextThreadParams): Promise<ContextThread> {
    return this.service.createContextThread(params);
  }

  /**
   * Update a context thread
   * @param id ContextThread ID
   * @param params ContextThread update parameters
   * @returns Promise resolving to updated context thread or null if not found
   */
  async updateContextThread(
    id: string, 
    params: Partial<UpdateContextThreadParams>
  ): Promise<ContextThread | null> {
    return this.service.updateContextThread(id, params);
  }

  /**
   * Delete a context thread
   * @param id ContextThread ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteContextThread(id: string): Promise<boolean> {
    return this.service.deleteContextThread(id);
  }

  /**
   * Add a message to an existing context thread by thread ID
   * @param threadId ContextThread ID
   * @param message Message to add
   * @returns The updated context thread with the new message, or null if thread not found
   */
  async addMessageToContextThread(
    threadId: string, 
    message: Omit<Message, 'id' | 'threadId'>
  ): Promise<ContextThread | null> {
    return this.service.addMessageToContextThread(threadId, message);
  }
}
