import { ContextThread } from '../../types/domain';

/**
 * Interface defining the contract for ContextThread repository implementations
 * This ensures proper typing across the domain and integration tiers
 */
export interface IContextThreadRepository {
  /**
   * Find all context threads with pagination
   * @param limit Maximum number of threads to return
   * @param offset Pagination offset
   * @returns Array of context threads
   */
  findAll(limit?: number, offset?: number): ContextThread[];
  
  /**
   * Create a new context thread
   * @param threadData The thread data to create
   * @returns The created thread
   */
  create(threadData: ContextThread): ContextThread;
  
  /**
   * Find a context thread by ID
   * @param id The ID of the thread to find
   * @returns The thread or null if not found
   */
  findById(id: string): ContextThread | null;
  
  /**
   * Update a context thread
   * @param thread The thread data to update (complete object)
   * @returns The updated thread or null if not found
   */
  update(thread: ContextThread): ContextThread | null;
  
  /**
   * Delete a context thread
   * @param id The ID of the thread to delete
   * @returns Success flag
   */
  delete(id: string): boolean;
}
