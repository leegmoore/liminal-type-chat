/**
 * Context Thread Client Interface
 * Defines the contract for client implementations to access context thread service functionality
 * across different communication modes (direct or HTTP)
 */
import { 
  ContextThread, 
  CreateContextThreadParams, 
  Message, 
  UpdateContextThreadParams 
} from '../../types/domain';

/**
 * Interface for clients that access context thread service functionality
 */
export interface ContextThreadClient {
  /**
   * Get a list of context threads
   * @param limit Maximum number of context threads to return
   * @param offset Number of context threads to skip
   * @returns Promise resolving to context threads array
   */
  getThreads(limit?: number, offset?: number): Promise<ContextThread[]>;
  
  /**
   * Get a context thread by ID
   * @param id ContextThread ID
   * @returns Promise resolving to context thread or null if not found
   */
  getContextThread(id: string): Promise<ContextThread | null>;
  
  /**
   * Create a new context thread
   * @param params ContextThread creation parameters
   * @returns Promise resolving to created context thread
   */
  createContextThread(params: CreateContextThreadParams): Promise<ContextThread>;
  
  /**
   * Update a context thread
   * @param id ContextThread ID
   * @param params ContextThread update parameters
   * @returns Promise resolving to updated context thread or null if not found
   */
  updateContextThread(
    id: string, 
    params: Partial<UpdateContextThreadParams>
  ): Promise<ContextThread | null>;
  
  /**
   * Delete a context thread
   * @param id ContextThread ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  deleteContextThread(id: string): Promise<boolean>;
  
  /**
   * Add a message to an existing context thread by thread ID
   * @param threadId ContextThread ID
   * @param message Message to add
   * @returns The updated context thread with the new message, or null if thread not found
   */
  addMessageToContextThread(
    threadId: string, 
    message: Omit<Message, 'id' | 'threadId'>
  ): Promise<ContextThread | null>;
}
