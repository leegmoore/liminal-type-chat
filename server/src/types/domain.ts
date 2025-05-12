/**
 * Defines the canonical domain models for the application.
 * These types are used internally by the domain service and repository layers.
 */

/**
 * Represents the possible roles of a message sender.
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Represents the possible statuses of a message.
 * Particularly useful for tracking message state during streaming or async operations.
 */
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error' | 'interrupted';

/**
 * Represents a single message within a ContextThread.
 * Corresponds to the Message.json schema.
 */
export interface Message {
  id: string; // UUID v4
  threadId: string; // UUID v4
  role: MessageRole;
  content: string;
  createdAt: number; // Unix epoch ms
  metadata?: Record<string, unknown>;
  status?: MessageStatus;
}

/**
 * Represents a conversation thread containing messages.
 * Corresponds to the ContextThread.json schema.
 */
export interface ContextThread {
  id: string; // UUID v4
  title?: string;
  createdAt: number; // Unix epoch ms
  updatedAt: number; // Unix epoch ms
  metadata?: Record<string, unknown>;
  messages: Message[];
}

/**
 * Parameters for creating a context thread.
 * Used for communication between Edge API and Domain services.
 */
export interface CreateContextThreadParams {
  title?: string;
  metadata?: Record<string, unknown>;
  initialMessage?: Omit<Message, 'id' | 'threadId' | 'createdAt'>;
}

/**
 * Parameters for updating a context thread.
 * Used for communication between Edge API and Domain services.
 */
export interface UpdateContextThreadParams {
  title?: string;
  metadata?: Record<string, unknown>;
}
