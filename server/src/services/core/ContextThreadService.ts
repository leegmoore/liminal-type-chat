import { v4 as uuidv4 } from 'uuid';
import { ContextThread, Message, MessageRole } from '../../types/domain';
import { ContextThreadRepository } from '../../providers/db/ContextThreadRepository';
import { MessagesCorruptedError } from '../../providers/db/errors';
import { normalizeThreadMessages } from '../../utils/normalizeThreadMessages';

/**
 * Parameters for creating a new thread.
 */
export interface CreateThreadParams {
  title?: string;
  initialMessage?: {
    role: MessageRole;
    content: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for adding a message to a thread.
 */
export interface AddMessageParams {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  status?: Message['status'];
}

/**
 * Parameters for updating a thread.
 */
export interface UpdateThreadParams {
  title?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service for managing ContextThread entities.
 * Implements business logic like ID generation, timestamp management,
 * and message normalization.
 */
export class ContextThreadService {
  constructor(private repository: ContextThreadRepository) {}

  /**
   * Create a new context thread.
   * @param params The parameters for creating a thread
   * @returns The created thread
   */
  createThread(params: CreateThreadParams): ContextThread {
    const now = Date.now();
    
    // Create the thread with a new UUID
    const thread: ContextThread = {
      id: uuidv4(),
      title: params.title,
      createdAt: now,
      updatedAt: now,
      metadata: params.metadata,
      messages: [],
    };

    // If an initial message is provided, add it to the thread
    if (params.initialMessage) {
      thread.messages.push({
        id: uuidv4(),
        threadId: thread.id,
        role: params.initialMessage.role,
        content: params.initialMessage.content,
        createdAt: now,
      });
    }

    // Persist the thread to the database
    return this.repository.create(thread);
  }

  /**
   * Get a thread by its ID.
   * @param id The ID of the thread to get
   * @returns The thread or null if not found
   * @throws MessagesCorruptedError if the messages JSON is corrupted
   */
  getThread(id: string): ContextThread | null {
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
   * Update a thread.
   * @param id The ID of the thread to update
   * @param params The parameters for updating the thread
   * @returns The updated thread or null if not found
   */
  updateThread(id: string, params: UpdateThreadParams): ContextThread | null {
    // First, get the existing thread
    const thread = this.getThread(id);
    if (!thread) {
      return null;
    }

    // Update the thread properties
    const updatedThread: ContextThread = {
      ...thread,
      title: params.title !== undefined ? params.title : thread.title,
      metadata: params.metadata !== undefined ? params.metadata : thread.metadata,
      updatedAt: Date.now(),
    };

    // Persist the updated thread
    return this.repository.update(updatedThread);
  }

  /**
   * Add a message to a thread.
   * @param threadId The ID of the thread to add the message to
   * @param params The parameters for the message
   * @returns The updated thread with the new message or null if thread not found
   */
  addMessage(threadId: string, params: AddMessageParams): ContextThread | null {
    // First, get the existing thread
    const thread = this.getThread(threadId);
    if (!thread) {
      return null;
    }

    // Create the new message
    const newMessage: Message = {
      id: uuidv4(),
      threadId,
      role: params.role,
      content: params.content,
      createdAt: Date.now(),
      metadata: params.metadata,
      status: params.status,
    };

    // Add the message to the thread and normalize
    const updatedThread: ContextThread = {
      ...thread,
      messages: normalizeThreadMessages([...thread.messages, newMessage]),
      updatedAt: Date.now(),
    };

    // Persist the updated thread
    return this.repository.update(updatedThread);
  }

  /**
   * Update a message in a thread.
   * @param threadId The ID of the thread containing the message
   * @param messageId The ID of the message to update
   * @param updates The updates to apply to the message
   * @returns The updated thread or null if not found
   */
  updateMessage(
    threadId: string,
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'status' | 'metadata'>>
  ): ContextThread | null {
    // First, get the existing thread
    const thread = this.getThread(threadId);
    if (!thread) {
      return null;
    }

    // Find the message to update
    const messageIndex = thread.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return null; // Message not found
    }

    // Create a new messages array with the updated message
    const updatedMessages = [...thread.messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      ...updates,
    };

    // Update the thread with the new messages array and normalize
    const updatedThread: ContextThread = {
      ...thread,
      messages: normalizeThreadMessages(updatedMessages),
      updatedAt: Date.now(),
    };

    // Persist the updated thread
    return this.repository.update(updatedThread);
  }

  /**
   * Delete a thread.
   * @param id The ID of the thread to delete
   * @returns True if the thread was deleted, false if not found
   */
  deleteThread(id: string): boolean {
    return this.repository.delete(id);
  }
}
