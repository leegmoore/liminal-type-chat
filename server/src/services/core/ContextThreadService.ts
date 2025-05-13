import { v4 as uuidv4 } from 'uuid';
import { ContextThread, Message, MessageRole } from '../../types/domain';
// Import the interface rather than the concrete implementation
import { IContextThreadRepository } from '../../providers/db/IContextThreadRepository';
import { MessagesCorruptedError } from '../../providers/db/errors';
import { normalizeThreadMessages } from '../../utils/normalizeThreadMessages';

/**
 * Parameters for creating a new context thread.
 */
export interface CreateContextThreadParams {
  title?: string;
  initialMessage?: {
    role: MessageRole;
    content: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for adding a message to a context thread.
 */
export interface AddMessageParams {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  status?: Message['status'];
}

/**
 * Parameters for updating a context thread.
 */
export interface UpdateContextThreadParams {
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service for managing ContextThread entities.
 * Implements business logic like ID generation, timestamp management,
 * and message normalization.
 */
export class ContextThreadService {
  constructor(private repository: IContextThreadRepository) {}

  /**
   * Get a list of context threads with pagination.
   * @param limit Maximum number of context threads to return
   * @param offset Number of context threads to skip
   * @returns Array of context threads
   */
  getContextThreads(limit = 20, offset = 0): ContextThread[] {
    // Call the repository to get a list of context threads
    return this.repository.findAll(limit, offset);
  }

  /**
   * Create a new context thread.
   * @param params The parameters for creating a context thread
   * @returns The created context thread
   */
  createContextThread(params: CreateContextThreadParams): ContextThread {
    const now = Date.now();
    
    // Create the context thread with a new UUID
    const contextThread: ContextThread = {
      id: uuidv4(),
      title: params.title,
      createdAt: now,
      updatedAt: now,
      metadata: params.metadata,
      messages: [],
    };

    // If an initial message is provided, add it to the context thread
    if (params.initialMessage) {
      contextThread.messages.push({
        id: uuidv4(),
        threadId: contextThread.id,
        role: params.initialMessage.role,
        content: params.initialMessage.content,
        createdAt: now,
      });
    }

    // Persist the context thread to the database
    return this.repository.create(contextThread);
  }

  /**
   * Get a context thread by its ID.
   * @param id The ID of the context thread to get
   * @returns The context thread or null if not found
   * @throws MessagesCorruptedError if the messages JSON is corrupted
   */
  getContextThread(id: string): ContextThread | null {
    try {
      return this.repository.findById(id);
    } catch (error) {
      // Propagate MessagesCorruptedError for special handling at higher layers
      if (error instanceof MessagesCorruptedError) {
        throw error;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Update a context thread.
   * @param id The ID of the context thread to update
   * @param params The parameters for updating the context thread
   * @returns The updated context thread or null if not found
   */
  updateContextThread(id: string, params: UpdateContextThreadParams): ContextThread | null {
    // First, get the existing context thread
    const contextThread = this.getContextThread(id);
    if (!contextThread) {
      return null;
    }

    // Update the context thread properties
    const updatedContextThread: ContextThread = {
      ...contextThread,
      title: params.title !== undefined ? params.title : contextThread.title,
      metadata: params.metadata !== undefined ? params.metadata : contextThread.metadata,
      updatedAt: Date.now(),
    };

    // Persist the updated context thread
    return this.repository.update(updatedContextThread);
  }

  /**
   * Add a message to a context thread.
   * @param contextThreadId The ID of the context thread to add the message to
   * @param params The parameters for the message
   * @returns The updated context thread with the new message or null if context thread not found
   */
  addMessageToContextThread(
    contextThreadId: string, 
    params: AddMessageParams
  ): ContextThread | null {
    // First, get the existing context thread
    const contextThread = this.getContextThread(contextThreadId);
    if (!contextThread) {
      return null;
    }

    // Create the new message
    const newMessage: Message = {
      id: uuidv4(),
      threadId: contextThreadId,
      role: params.role,
      content: params.content,
      createdAt: Date.now(),
      metadata: params.metadata,
      status: params.status,
    };

    // Add the message to the context thread and normalize
    const updatedContextThread: ContextThread = {
      ...contextThread,
      messages: normalizeThreadMessages([...contextThread.messages, newMessage]),
      updatedAt: Date.now(),
    };

    // Persist the updated context thread
    return this.repository.update(updatedContextThread);
  }

  /**
   * Update a message in a context thread.
   * @param contextThreadId The ID of the context thread containing the message
   * @param messageId The ID of the message to update
   * @param updates The updates to apply to the message
   * @returns The updated context thread or null if not found
   */
  updateMessageInContextThread(
    contextThreadId: string,
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'status' | 'metadata'>>
  ): ContextThread | null {
    // First, get the existing context thread
    const contextThread = this.getContextThread(contextThreadId);
    if (!contextThread) {
      return null;
    }

    // Find the message to update
    const messageIndex = contextThread.messages.findIndex((msg: Message) => msg.id === messageId);
    if (messageIndex === -1) {
      return null; // Message not found
    }

    // Create a new messages array with the updated message
    const updatedMessages = [...contextThread.messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      ...updates,
    };

    // Update the context thread with the new messages array and normalize
    const updatedContextThread: ContextThread = {
      ...contextThread,
      messages: normalizeThreadMessages(updatedMessages),
      updatedAt: Date.now(),
    };

    // Persist the updated context thread
    return this.repository.update(updatedContextThread);
  }

  /**
   * Delete a context thread.
   * @param id The ID of the context thread to delete
   * @returns True if the context thread was deleted, false if not found
   */
  deleteContextThread(id: string): boolean {
    return this.repository.delete(id);
  }
}
