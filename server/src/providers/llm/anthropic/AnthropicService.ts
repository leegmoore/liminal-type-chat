import {
  ILlmService,
  LlmErrorCode,
  LlmModelInfo,
  LlmRequestOptions,
  LlmResponse,
  LlmServiceError
} from '../ILlmService';

import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic model configuration
 */
interface AnthropicModelConfig {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
  supportsStreaming: boolean;
  pricingPerInputToken?: number;
  pricingPerOutputToken?: number;
}

/**
 * Known model configurations
 */
const ANTHROPIC_MODELS: Record<string, AnthropicModelConfig> = {
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    pricingPerInputToken: 0.00001,
    pricingPerOutputToken: 0.00007
  },
  'claude-3-sonnet-20240229': {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    pricingPerInputToken: 0.000003,
    pricingPerOutputToken: 0.000015
  },
  'claude-3-haiku-20240307': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    pricingPerInputToken: 0.000000025,
    pricingPerOutputToken: 0.000000125
  },
  'claude-3-7-sonnet-20250219': {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (Docs Sample)',
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    pricingPerInputToken: 0.000003,
    pricingPerOutputToken: 0.000015
  }
};

/**
 * Default model ID to use when none is specified
 */
// Unused model name - keeping this commented to avoid compiler errors
// const DEFAULT_MODEL_NAME = 'Claude 3.7 Sonnet';
const DEFAULT_MODEL_ID = 'claude-3-7-sonnet-20250219'; 
const DEFAULT_ANTHROPIC_MAX_TOKENS = 4096; 

/**
 * Implementation of the ILlmService interface for Anthropic
 */
export class AnthropicService implements ILlmService {
  private client: Anthropic;

  /**
   * Creates a new instance of the Anthropic service
   * @param apiKey Anthropic API key
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new LlmServiceError(
        'Anthropic API key is required',
        LlmErrorCode.INVALID_API_KEY,
        'An API key must be provided to use the Anthropic service'
      );
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Lists available models from Anthropic
   */
  async listModels(): Promise<LlmModelInfo[]> {
    // Anthropic SDK does not have a direct model listing API like OpenAI.
    // We return a list based on our known ANTHROPIC_MODELS configuration.
    const models: LlmModelInfo[] = Object.values(ANTHROPIC_MODELS).map(config => ({
      id: config.id,
      provider: 'anthropic',
      name: config.name,
      maxTokens: config.maxTokens,
      contextWindow: config.contextWindow,
      supportsStreaming: config.supportsStreaming,
      pricingPerInputToken: config.pricingPerInputToken,
      pricingPerOutputToken: config.pricingPerOutputToken,
      // 'trainedUntil' is not typically available/standardized for Anthropic models this way
    }));
    return Promise.resolve(models);
  }

  /**
   * Sends a prompt to Anthropic and returns the response
   */
  async sendPrompt(
    messages: Array<{ role: string; content: string }>,
    options?: LlmRequestOptions
  ): Promise<LlmResponse> {
    if (!messages || messages.length === 0) {
      throw new LlmServiceError(
        'Messages array is empty',
        LlmErrorCode.INVALID_REQUEST,
        'At least one message must be provided'
      );
    }

    const modelId = options?.modelId || DEFAULT_MODEL_ID;

    try {
      // Map messages to Anthropic format
      const { anthropicMessages, systemPrompt } = this.mapToAnthropicMessages(messages);

      const requestPayload: Anthropic.Messages.MessageCreateParams = {
        model: modelId,
        messages: anthropicMessages,
        max_tokens: options?.maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
      };
      if (systemPrompt) {
        requestPayload.system = systemPrompt;
      }

      if (options?.temperature !== undefined) {
        requestPayload.temperature = options.temperature;
      }
      if (options?.topP !== undefined) {
        requestPayload.top_p = options.topP;
      }
      if (options?.stop !== undefined && options.stop.length > 0) {
        requestPayload.stop_sequences = options.stop;
      }

      const response = await this.client.messages.create(requestPayload);

      // Extract the content text from the response
      const content = this.extractTextFromResponse(response);
      
      return {
        content,
        modelId,
        provider: 'anthropic',
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        },
        metadata: {
          finishReason: this.mapStopReason(response.stop_reason)
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sends a prompt to Anthropic and streams the response
   */
  async streamPrompt(
    messages: Array<{ role: string; content: string }>,
    callback: (chunk: LlmResponse) => void,
    options?: LlmRequestOptions
  ): Promise<void> {
    if (!messages || messages.length === 0) {
      throw new LlmServiceError(
        'Messages array is empty',
        LlmErrorCode.INVALID_REQUEST,
        'At least one message must be provided'
      );
    }

    const modelId = options?.modelId || DEFAULT_MODEL_ID;
    let accumulatedContent = '';
    let inputTokens = 0; 
    // Store the snapshot of the message object from message_start to access final usage
    let finalMessageSnapshot: Anthropic.Message | null = null; 
    let lastDeltaStopReason: Anthropic.Message['stop_reason'] | null = null; 

    try {
      const { anthropicMessages, systemPrompt } = this.mapToAnthropicMessages(messages);

      // Ensure streamRequestParams is correctly defined for MessageStreamParams (no 'stream: true')
      const streamRequestParams: Anthropic.Messages.MessageStreamParams = {
        model: modelId,
        messages: anthropicMessages,
        max_tokens: options?.maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
        // Do NOT include 'stream: true' here
      };

      if (systemPrompt) {
        streamRequestParams.system = systemPrompt;
      }

      if (options?.temperature !== undefined) {
        streamRequestParams.temperature = options.temperature;
      }
      if (options?.topP !== undefined) {
        streamRequestParams.top_p = options.topP;
      }
      if (options?.stop !== undefined && options.stop.length > 0) {
        streamRequestParams.stop_sequences = options.stop;
      }

      // Request is being sent to Anthropic

      const stream = await this.client.messages.stream(streamRequestParams); 

      for await (const event of stream) {
        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
          finalMessageSnapshot = event.message; // Store the message snapshot
        }

        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            accumulatedContent += event.delta.text;
            const responseChunk: LlmResponse = {
              content: event.delta.text,
              modelId,
              provider: 'anthropic',
              usage: {
                promptTokens: inputTokens,
                completionTokens: 1, 
                totalTokens: inputTokens + 1, 
              },
              metadata: {},
            };
            callback(responseChunk);
          }
        }

        if (event.type === 'message_delta') {
          // We will use the final count from the message_stop event via finalMessageSnapshot.
          if (event.delta && event.delta.stop_reason) { // event.delta is of type MessageDelta here
            lastDeltaStopReason = event.delta.stop_reason;
          }
        }

        if (event.type === 'message_stop') {
          let finalOutputTokens = 0;
          if (finalMessageSnapshot) {
            // Authoritative final count
            finalOutputTokens = finalMessageSnapshot.usage.output_tokens;
          } else {
            // If message_start was somehow missed, use a fallback approach for output tokens
            finalOutputTokens = Math.ceil(accumulatedContent.length / 4); // Rough estimate
          }

          // Send a final message with empty content but with metadata containing full content
          // This pattern allows client to receive the full content as part of the final message
          const finalResponse: LlmResponse = {
            content: '', // The actual content increment is empty for the final message
            modelId,
            provider: 'anthropic',
            usage: {
              promptTokens: inputTokens,
              completionTokens: finalOutputTokens, // Use correct final count
              totalTokens: inputTokens + finalOutputTokens,
            },
            metadata: {
              finishReason: this.mapStopReason(lastDeltaStopReason),
              fullContent: accumulatedContent, // The complete accumulated text
            },
          };
          callback(finalResponse);
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validates an Anthropic API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new Anthropic({
        apiKey: apiKey,
      });
      await testClient.messages.create({
        model: DEFAULT_MODEL_ID, 
        messages: [{ role: 'user', content: 'Test validation' }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Maps standard messages to Anthropic format. Filters for user/assistant roles.
   * Extracts the system message if present.
   */
  private mapToAnthropicMessages(
    messages: Array<{ role: string; content: string }>
  ): {
    anthropicMessages: Anthropic.Messages.MessageParam[];
    systemPrompt?: string;
  } {
    let systemPrompt: string | undefined = undefined;
    const anthropicMessages: Anthropic.Messages.MessageParam[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Anthropic API expects only one system message.
        // If multiple are provided, concatenate or take the last one.
        // For simplicity, let's take the content of the first system message found.
        if (!systemPrompt) {
          systemPrompt = message.content;
        }
        // Do not add system role to the messages array itself
      } else if (message.role === 'user') {
        anthropicMessages.push({ role: 'user', content: message.content });
      } else if (message.role === 'assistant') {
        anthropicMessages.push({ role: 'assistant', content: message.content });
      }
      // Other roles are ignored
    }

    return { anthropicMessages, systemPrompt };
  }

  /**
   * Extracts text content from Anthropic response
   */
  private extractTextFromResponse(response: Anthropic.Message): string {
    if (response.content && response.content.length > 0) {
      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock && 'text' in textBlock) {
        return textBlock.text;
      }
    }
    return '';
  }

  /**
   * Maps Anthropic stop reason to standardized enum
   */
  private mapStopReason(
    anthropicStopReason?: Anthropic.Message['stop_reason'] | null
  ): LlmResponse['metadata']['finishReason'] {
    if (!anthropicStopReason) return undefined;
    switch (anthropicStopReason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop';
    case 'max_tokens':
      return 'length';
    default:
      return undefined; 
    }
  }

  private handleError(error: unknown): LlmServiceError {
    if (error instanceof Anthropic.APIError) {
      let errorCode = LlmErrorCode.UNKNOWN_ERROR;
      const status = error.status;

      if (typeof status === 'number') {
        if (status === 401) errorCode = LlmErrorCode.INVALID_API_KEY;
        else if (status === 400) errorCode = LlmErrorCode.INVALID_REQUEST;
        else if (status === 403) errorCode = LlmErrorCode.INVALID_API_KEY; 
        else if (status === 404) errorCode = LlmErrorCode.MODEL_NOT_FOUND; 
        else if (status === 429) errorCode = LlmErrorCode.RATE_LIMIT_EXCEEDED;
        else if (status >= 500) errorCode = LlmErrorCode.SERVER_ERROR;
      }
      
      return new LlmServiceError(
        error.message || 'Anthropic API error',
        errorCode,
        error.name 
      );
    }
    
    let message = 'An unexpected error occurred with the Anthropic service';
    let name = 'UnknownError';

    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        message = error.message;
      }
      if ('name' in error && typeof error.name === 'string') {
        name = error.name;
      }
    }

    return new LlmServiceError(
      message,
      LlmErrorCode.UNKNOWN_ERROR,
      name
    );
  }
}