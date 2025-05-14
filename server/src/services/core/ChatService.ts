import { LlmApiKeyManager } from '../../providers/llm/LlmApiKeyManager';
import { LlmErrorCode, LlmModelInfo, LlmProvider, LlmRequestOptions, LlmResponse, LlmServiceError } from '../../providers/llm/ILlmService';
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
  async completeChatPrompt(userId: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
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

    // Prepare the messages for the LLM
    const messagesForLlm = thread.messages
      .filter(msg => {
        // Only include assistant messages if they have actual content.
        // User messages (and system messages, if applicable) are always included.
        if (msg.role === 'assistant') {
          return !!msg.content; // Ensures content is not null, undefined, or empty string
        }
        return true;
      })
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    // Add the new user message
    messagesForLlm.push({
      role: 'user',
      content: prompt,
    });

    // LLM request options
    const llmOptions: LlmRequestOptions = {
      modelId,
      ...options
    };

    // 2. Add a placeholder for the assistant's response
    const assistantMessage = await this.contextThreadService.addMessage(threadId, {
      role: 'assistant',
      content: '', // Placeholder
      timestamp: Date.now(),
      status: 'complete', // Will be updated by LLM response
      metadata: { provider, modelId },
    });

    // 3. Call LLM service
    const llmResponse = await llmService.createChatCompletion({
      ...request,
      messages: await this.getFormattedMessagesForLlm(threadId),
    });

    // 4. Update placeholder with actual response
    // Log what is being attempted to save
    console.log(`ChatService (non-streaming): Attempting to save assistant message for thread ${threadId}. Message ID: ${assistantMessage?.id}, Content: "${llmResponse.content}"`);
    try {
      await this.contextThreadService.updateMessage(
        threadId,
        assistantMessage?.id || '',
        {
          content: llmResponse.content,
          status: 'complete',
          metadata: {
            modelId: llmResponse.modelId,
            provider: llmResponse.provider,
            usage: llmResponse.usage,
            finishReason: llmResponse.metadata?.finishReason // Ensure metadata and finishReason exist
          }
        }
      );
      console.log(`ChatService (non-streaming): Successfully saved assistant message for thread ${threadId}. Message ID: ${assistantMessage?.id}`);
    } catch (saveError: any) { // Typed saveError
      console.error(`ChatService (non-streaming): Error saving assistant message for thread ${threadId}. Message ID: ${assistantMessage?.id}:`, saveError);
    }

    // Return completion response
    return {
      threadId,
      messageId: assistantMessage?.id || '',
      content: llmResponse.content,
      model: llmResponse.modelId,
      provider: llmResponse.provider,
      finishReason: llmResponse.metadata?.finishReason,
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
    console.log('ChatService.streamChatCompletion: Entered method with request:', JSON.stringify(request, null, 2));

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

    // Prepare the messages for the LLM
    const messagesForLlm = thread.messages
      .filter(msg => {
        // Only include assistant messages if they have actual content.
        // User messages (and system messages, if applicable) are always included.
        if (msg.role === 'assistant') {
          return !!msg.content; // Ensures content is not null, undefined, or empty string
        }
        return true;
      })
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    // Add the new user message
    messagesForLlm.push({
      role: 'user',
      content: prompt,
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
      await llmService.streamChatCompletion(
        { ...request, messages: await this.getFormattedMessagesForLlm(threadId) },
        (chunk) => {
          if (chunk.content) {
            accumulatedContent += chunk.content;
          }

          const messageToLogId = assistantMessage?.id || 'unknown_id';
          // Log attempt to update message with current chunk data
          console.log(`ChatService (streaming): Attempting to update assistant message ID ${messageToLogId} for thread ${threadId}. Accumulated Content: "${accumulatedContent}". Finish Reason: ${chunk.metadata?.finishReason}`);
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
            // Log success of this specific update
            console.log(`ChatService (streaming): Successfully called update for assistant message ID ${messageToLogId} for thread ${threadId}. Status: ${chunk.metadata?.finishReason ? 'complete' : 'streaming'}`);
          } catch (saveError: any) { // Typed saveError
            console.error(`ChatService (streaming): Error calling update for assistant message ID ${messageToLogId} for thread ${threadId}:`, saveError);
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