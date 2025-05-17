/* eslint-disable max-len */
/**
 * Transformer functions for converting between Edge API schemas and Domain models.
 * These act as an adapter layer to decouple the Edge API contracts from Domain models,
 * allowing them to evolve independently.
 */
import { 
  ContextThread, 
  CreateContextThreadParams, 
  Message, 
  MessageRole 
} from '../../../types/domain';

/**
 * Edge API interface for conversation response
 */
export interface ConversationResponse {
  conversationId: string;
  title: string | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  messages: MessageResponse[];
  metadata?: Record<string, unknown>;
}

/**
 * Edge API interface for conversation summary (used in list responses)
 */
export interface ConversationSummary {
  conversationId: string;
  title: string | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  metadata?: Record<string, unknown>;
}

/**
 * Edge API interface for message response
 */
export interface MessageResponse {
  messageId: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO 8601 timestamp
  status?: Message['status'];
  metadata?: Record<string, unknown>;
}

/**
 * Edge API interface for message request
 */
export interface AddMessageRequest {
  role: MessageRole;
  content: string;
  status?: Message['status'];
  metadata?: Record<string, unknown>;
}

/**
 * Edge API interface for conversation creation request
 */
export interface CreateConversationRequest {
  title?: string;
  initialMessage?: {
    role: MessageRole;
    content: string;
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Transforms a domain ContextThread to an Edge API ConversationResponse
 */
export function domainContextThreadToConversationResponse(
  thread: ContextThread
): ConversationResponse {
  return {
    conversationId: thread.id,
    title: thread.title || null,
    createdAt: new Date(thread.createdAt).toISOString(),
    updatedAt: new Date(thread.updatedAt).toISOString(),
    messages: thread.messages.map(domainMessageToMessageResponse),
    metadata: thread.metadata,
  };
}

/**
 * Transforms a domain ContextThread to an Edge API ConversationSummary
 * This is used for list responses where we don't need to include all messages
 */
export function domainContextThreadToConversationSummary(
  thread: ContextThread
): ConversationSummary {
  let createdAtISO: string;
  let updatedAtISO: string;
  const placeholderDate = new Date(0).toISOString(); // Jan 1, 1970

  if (thread.createdAt && (typeof thread.createdAt === 'number' || typeof thread.createdAt === 'string')) {
    try {
      createdAtISO = new Date(thread.createdAt).toISOString();
    } catch {
      console.error('Error converting createdAt to ISO string');
      createdAtISO = placeholderDate;
    }
  } else {
    console.error('Invalid createdAt value in thread');
    createdAtISO = placeholderDate;
  }

  if (thread.updatedAt && (typeof thread.updatedAt === 'number' || typeof thread.updatedAt === 'string')) {
    try {
      updatedAtISO = new Date(thread.updatedAt).toISOString();
    } catch {
      console.error('Error converting updatedAt to ISO string');
      updatedAtISO = placeholderDate;
    }
  } else {
    console.error('Invalid updatedAt value in thread');
    updatedAtISO = placeholderDate;
  }

  return {
    conversationId: thread.id,
    title: thread.title || null,
    createdAt: createdAtISO,
    updatedAt: updatedAtISO,
    metadata: thread.metadata,
  };
}

/**
 * Transforms a domain Message to an Edge API MessageResponse
 */
export function domainMessageToMessageResponse(message: Message): MessageResponse {
  const response: MessageResponse = {
    messageId: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt).toISOString(),
  };

  if (message.metadata) {
    response.metadata = message.metadata;
  }

  if (message.status) {
    response.status = message.status;
  }

  return response;
}

/**
 * Transforms an Edge API AddMessageRequest to a domain Message
 * Note: Only transforms the fields that are part of the request - ID and createdAt 
 * will be added by the service
 */
export function messageRequestToDomainMessage(
  request: AddMessageRequest, 
  threadId: string
): Partial<Message> {
  const domainMessage: Partial<Message> = {
    threadId,
    role: request.role,
    content: request.content,
  };

  if (request.metadata) {
    domainMessage.metadata = request.metadata;
  }

  if (request.status) {
    domainMessage.status = request.status;
  }

  return domainMessage;
}

/**
 * Transforms an Edge API CreateConversationRequest to domain CreateContextThreadParams
 */
export function conversationRequestToCreateContextThreadParams(
  request: CreateConversationRequest
): CreateContextThreadParams {
  const params: CreateContextThreadParams = {};

  if (request.title !== undefined) {
    params.title = request.title;
  }

  if (request.metadata) {
    params.metadata = request.metadata;
  }

  if (request.initialMessage) {
    params.initialMessage = {
      role: request.initialMessage.role,
      content: request.initialMessage.content,
    };
  }

  return params;
}
