import { LlmApiKeyManager } from '../../providers/llm/LlmApiKeyManager';
import { 
  LlmErrorCode, 
  LlmModelInfo, 
  LlmProvider, 
  LlmRequestOptions, 
  LlmResponse, 
  LlmServiceError 
} from '../../providers/llm/ILlmService';
import { LlmServiceFactory } from '../../providers/llm/LlmServiceFactory';
import { ContextThreadService } from './ContextThreadService';

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  /** The prompt text to send to the LLM */
  prompt: string;
  /** The LLM provider to use (e.g., 'openai', 'anthropic') */
  provider: LlmProvider;
  /** Optional model ID, if not provided a default for the provider will be used */
  modelId?: string;
  /** ID of the thread to add the message to */
  threadId: string;
  /** Additional options for the LLM request */
  options?: Omit<LlmRequestOptions, 'modelId'>;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  /** The thread ID */
  threadId: string;
  /** ID of the assistant's message */
  messageId: string;
  /** Content of the assistant's response */
  content: string;
  /** The model used for completion */
  model: string;
  /** The provider that generated the completion */
  provider: string;
  /** Reason the completion finished (stop, length, etc.) */
  finishReason?: string;
  /** Token usage: prompt tokens */
  promptTokens?: number;
  /** Token usage: completion tokens */
  completionTokens?: number;
  /** Token usage: total tokens */
  totalTokens?: number;
  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Chat completion chunk for streaming
 */
export interface ChatCompletionChunk {
  /** The thread ID */
  threadId: string;
  /** ID of the assistant's message */
  messageId: string;
  /** Content chunk from the assistant */
  content: string;
  /** The model used for completion */
  model: string;
  /** The provider that generated the completion */
  provider: string;
  /** Reason the completion finished, if this is the final chunk */
  finishReason?: string;
  /** Whether this is the final chunk */
  done: boolean;
}

/**
 * Message status for tracking streaming state
 */
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

/**
 * Service for handling chat completions using LLMs
 */
export class ChatService {
  /**
   * Create a new chat service
   * @param llmApiKeyManager Manager for LLM API keys
   * @param contextThreadService Service for managing context threads
   */
  constructor(
    private llmApiKeyManager: LlmApiKeyManager,
    private contextThreadService: ContextThreadService
  ) {}

  /**
   * Format messages for sending to the LLM, ensuring correct sequencing
   * @param threadId The ID of the thread to get messages from
   * @param includeLatest Whether to include the latest message (defaults to true)
   * @returns Properly formatted messages for the LLM
   */
  private async getFormattedMessagesForLlm(
    threadId: string
  ): Promise<Array<{ role: string; content: string }>> {
    // Get the thread
    const thread = await this.contextThreadService.getThread(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Ensure we only include messages from this specific thread ID
    // This prevents message bleeding from other conversations
    const threadMessages = thread.messages.filter(msg => msg.threadId === threadId);

    // Filter messages and ensure proper alternating sequence
    const formattedMessages = threadMessages
      // Only include completed messages (not streaming or error)
      .filter(msg => msg.status === 'complete')
      // Ensure assistant messages have content
      .filter(msg => msg.role !== 'assistant' || (msg.role === 'assistant' && !!msg.content))
      // Map to the format expected by LLM services
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
                
    return formattedMessages;
  }

  /**
   * Get a friendly name for a provider
   * @param provider The provider identifier
   */
  private getProviderName(provider: LlmProvider): string {
    switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    default:
      return provider;
    }
  }

  /**
   * Get available models for a provider
   * @param userId User ID
   * @param provider LLM provider
   * @returns List of available models
   */
  async getAvailableModels(userId: string, provider: LlmProvider): Promise<LlmModelInfo[]> {
    // Check if user has an API key for this provider
    const hasApiKey = await this.llmApiKeyManager.hasApiKey(userId, provider);
    if (!hasApiKey) {
      throw new LlmServiceError(
        `API key for ${this.getProviderName(provider)} is required`,
        LlmErrorCode.INVALID_API_KEY,
        `Please add your ${this.getProviderName(provider)} API key in settings`
      );
    }

    // Get the API key
    const apiKey = await this.llmApiKeyManager.getApiKey(userId, provider);

    // Create LLM service
    const llmService = LlmServiceFactory.createService(provider, apiKey);

    // Get available models
    return await llmService.listModels();
  }

  /**
   * Complete a chat prompt and save the messages
   * @param userId User ID
   * @param request Chat completion request
   * @returns Completion response
   */
  async completeChatPrompt(
    userId: string, 
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const { prompt, provider, threadId, options = {} } = request;
    // Ensure we have a model ID - either from the request or a default for the provider
    const modelId = request.modelId || LlmServiceFactory.getDefaultModel(provider);

    // Check if user has an API key for this provider
    const hasApiKey = await this.llmApiKeyManager.hasApiKey(userId, provider);
    if (!hasApiKey) {
      throw new LlmServiceError(
        `API key for ${this.getProviderName(provider)} is required`,
        LlmErrorCode.INVALID_API_KEY,
        `Please add your ${this.getProviderName(provider)} API key in settings`
      );
    }

    // Get the API key
    const apiKey = await this.llmApiKeyManager.getApiKey(userId, provider);

    // Create LLM service
    const llmService = LlmServiceFactory.createService(provider, apiKey);

    // Get the thread
    const thread = await this.contextThreadService.getThread(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Get the existing messages from the thread
    const existingMessages = thread.messages
      .filter(msg => msg.status === 'complete')
      .filter(msg => msg.role !== 'assistant' || (msg.role === 'assistant' && !!msg.content))
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    // Add user message to thread
    await this.contextThreadService.addMessage(threadId, {
      role: 'user',
      content: prompt,
      status: 'complete'
    });

    // Prepare messages for LLM - include the existing messages and the new user message
    const messagesForLlm = [
      ...existingMessages,
      {
        role: 'user',
        content: prompt,
      }
    ];

    // LLM request options
    const llmOptions: LlmRequestOptions = {
      modelId,
      ...options
    };

    // Call LLM service with the messages
    const llmResponse = await llmService.sendPrompt(
      messagesForLlm,
      llmOptions
    );

    // Add assistant message with the response content
    const assistantMessage = await this.contextThreadService.addMessage(threadId, {
      role: 'assistant',
      content: llmResponse.content,
      status: 'complete',
      metadata: {
        modelId: llmResponse.modelId,
        provider: llmResponse.provider,
        usage: llmResponse.usage,
        finishReason: llmResponse.metadata?.finishReason
      }
    });

    // Return completion response
    return {
      threadId,
      messageId: assistantMessage?.id || '',
      content: llmResponse.content,
      model: llmResponse.modelId,
      provider: llmResponse.provider,
      finishReason: llmResponse.metadata?.finishReason,
      promptTokens: llmResponse.usage?.promptTokens,
      completionTokens: llmResponse.usage?.completionTokens,
      totalTokens: llmResponse.usage?.totalTokens,
      usage: llmResponse.usage
    };
  }

  /**
   * Stream a chat completion
   * @param userId User ID
   * @param request Chat completion request
   * @param callback Callback for receiving completion chunks
   */
  async streamChatCompletion(
    userId: string,
    request: ChatCompletionRequest,
    callback: (chunk: ChatCompletionChunk) => void
  ): Promise<void> {

    const { prompt, provider, threadId, options = {} } = request;
    const modelId = request.modelId || LlmServiceFactory.getDefaultModel(provider);

    // Check if user has an API key for this provider
    const hasApiKey = await this.llmApiKeyManager.hasApiKey(userId, provider);
    if (!hasApiKey) {
      throw new LlmServiceError(
        `API key for ${this.getProviderName(provider)} is required`,
        LlmErrorCode.INVALID_API_KEY,
        `Please add your ${this.getProviderName(provider)} API key in settings`
      );
    }

    // Get the API key
    const apiKey = await this.llmApiKeyManager.getApiKey(userId, provider);

    // Create LLM service
    const llmService = LlmServiceFactory.createService(provider, apiKey);

    // Get the thread
    const thread = await this.contextThreadService.getThread(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Add user message to thread
    await this.contextThreadService.addMessage(threadId, {
      role: 'user',
      content: prompt,
      status: 'complete'
    });

    // Add assistant message to thread
    const assistantMessage = await this.contextThreadService.addMessage(threadId, {
      role: 'assistant',
      content: '',
      status: 'streaming',
      metadata: {
        modelId,
        provider
      }
    });

    // LLM request options
    const llmOptions: LlmRequestOptions = {
      modelId,
      ...options
    };

    // Track the accumulated content
    let accumulatedContent = '';

    try {
      // Stream the completion
      await llmService.streamPrompt(
        await this.getFormattedMessagesForLlm(threadId),
        (chunk: LlmResponse) => {
          if (chunk.content) {
            accumulatedContent += chunk.content;
          }

          try {
            this.contextThreadService.updateMessage(
              threadId,
              assistantMessage?.id || '', // Use the placeholder's ID
              {
                content: accumulatedContent,
                status: chunk.metadata?.finishReason ? 'complete' : 'streaming',
                metadata: {
                  ...(assistantMessage?.metadata || {}),
                  modelId: modelId, // ensure modelId is captured
                  provider: provider, // ensure provider is captured
                  usage: chunk.usage,
                  finishReason: chunk.metadata?.finishReason
                }
              }
            );
          } catch (saveError: unknown) {
            if (saveError instanceof Error) {
              console.error(`Error updating message: ${saveError.message}`);
            } else {
              console.error('Error updating message: Unknown error');
            }
          }

          // Call the client callback with the chunk
          callback({
            threadId,
            messageId: assistantMessage?.id || '',
            content: chunk.content,
            model: chunk.modelId,
            provider: chunk.provider,
            finishReason: chunk.metadata?.finishReason,
            done: !!chunk.metadata?.finishReason
          });
        },
        llmOptions
      );
    } catch (error) {
      // Handle errors during streaming
      if (error instanceof LlmServiceError) {
        // Update message with error status
        await this.contextThreadService.updateMessage(
          threadId,
          assistantMessage?.id || '',
          {
            status: 'error',
            metadata: {
              ...(assistantMessage?.metadata || {}),
              error: {
                message: error.message,
                code: error.code,
                details: error.details
              }
            }
          }
        );
      } else {
        // Update message with generic error
        await this.contextThreadService.updateMessage(
          threadId,
          assistantMessage?.id || '',
          {
            status: 'error',
            metadata: {
              ...(assistantMessage?.metadata || {}),
              error: {
                message: error instanceof Error ? error.message : String(error),
                code: LlmErrorCode.UNKNOWN_ERROR
              }
            }
          }
        );
      }

      // Re-throw the error
      throw error;
    }
  }
}