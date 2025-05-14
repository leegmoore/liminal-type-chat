// Stub OpenAI implementation for testing
import {
  ILlmService,
  LlmErrorCode,
  LlmModelInfo,
  LlmRequestOptions,
  LlmResponse,
  LlmServiceError
} from '../ILlmService';

// Mock OpenAI class to avoid requiring the actual package
class OpenAI {
  constructor(_config: any) {}
  
  models = {
    list: async () => ({
      data: [
        { id: 'gpt-3.5-turbo' },
        { id: 'gpt-4' },
        { id: 'gpt-4-turbo' }
      ]
    })
  };
  
  chat = {
    completions: {
      create: async (options: any) => {
        if (options.stream) {
          // Return a mock async generator for streaming
          const mockStream = async function* () {
            yield {
              choices: [{ delta: { content: 'This ' }, finish_reason: null }]
            };
            yield {
              choices: [{ delta: { content: 'is ' }, finish_reason: null }]
            };
            yield {
              choices: [{ delta: { content: 'a ' }, finish_reason: null }]
            };
            yield {
              choices: [{ delta: { content: 'test.' }, finish_reason: 'stop' }]
            };
          };
          return mockStream();
        } else {
          // Return a standard completion response
          return {
            choices: [
              {
                message: { content: 'This is a test response from the OpenAI service stub.' },
                finish_reason: 'stop'
              }
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 15,
              total_tokens: 25
            }
          };
        }
      }
    }
  };
}

/**
 * OpenAI model configuration
 */
interface OpenAiModelConfig {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
  trainedUntil?: string;
  supportsStreaming: boolean;
  pricingPerInputToken?: number;
  pricingPerOutputToken?: number;
}

/**
 * Known model configurations
 */
const OPENAI_MODELS: Record<string, OpenAiModelConfig> = {
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    maxTokens: 8192,
    contextWindow: 8192,
    trainedUntil: '2023-04-01',
    supportsStreaming: true,
    pricingPerInputToken: 0.00003,
    pricingPerOutputToken: 0.00006
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    maxTokens: 4096,
    contextWindow: 128000,
    trainedUntil: '2023-12-01',
    supportsStreaming: true,
    pricingPerInputToken: 0.00001,
    pricingPerOutputToken: 0.00003
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    maxTokens: 4096,
    contextWindow: 16385,
    trainedUntil: '2023-04-01',
    supportsStreaming: true,
    pricingPerInputToken: 0.0000015,
    pricingPerOutputToken: 0.000002
  }
};

/**
 * Default model ID to use when none is specified
 */
const DEFAULT_MODEL_ID = 'gpt-3.5-turbo';

/**
 * Implementation of the ILlmService interface for OpenAI
 */
export class OpenAiService implements ILlmService {
  private client: OpenAI;
  private modelCache: Map<string, OpenAiModelConfig> = new Map(Object.entries(OPENAI_MODELS));
  
  // Type assertion for unknown model data
  private asModelConfig(data: any, modelId: string): OpenAiModelConfig {
    return {
      id: modelId,
      name: data.name || modelId,
      maxTokens: data.maxTokens || 4096,
      contextWindow: data.contextWindow || 4096,
      supportsStreaming: data.supportsStreaming ?? true,
      trainedUntil: data.trainedUntil,
      pricingPerInputToken: data.pricingPerInputToken,
      pricingPerOutputToken: data.pricingPerOutputToken
    };
  }

  /**
   * Creates a new instance of the OpenAI service
   * @param apiKey OpenAI API key
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new LlmServiceError(
        'OpenAI API key is required',
        LlmErrorCode.INVALID_API_KEY,
        'An API key must be provided to use the OpenAI service'
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Lists available models from OpenAI
   */
  async listModels(): Promise<LlmModelInfo[]> {
    try {
      const response = await this.client.models.list();
      
      // Filter out non-chat models and add known model info
      const chatModels = response.data
        .filter((model: any) => {
          const modelId = model.id.toLowerCase();
          return modelId.includes('gpt') && (modelId.includes('turbo') || modelId === 'gpt-4');
        })
        .map((model: any) => {
          const modelId = model.id;
          const knownModel = this.modelCache.get(modelId) || 
            this.asModelConfig({
              id: modelId,
              name: modelId,
              maxTokens: 4096, // Default assumption
              contextWindow: 4096,
              supportsStreaming: true
            }, modelId);

          return {
            id: modelId,
            provider: 'openai',
            name: knownModel.name,
            maxTokens: knownModel.maxTokens,
            contextWindow: knownModel.contextWindow,
            supportsStreaming: knownModel.supportsStreaming,
            trainedUntil: knownModel.trainedUntil,
            pricingPerInputToken: knownModel.pricingPerInputToken,
            pricingPerOutputToken: knownModel.pricingPerOutputToken
          };
        });

      return chatModels;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sends a prompt to OpenAI and returns the response
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
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: messages as any,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop
      }) as any; // Type assertion for the mock implementation

      const content = response.choices[0]?.message?.content || '';
      
      return {
        content,
        modelId,
        provider: 'openai',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        metadata: {
          finishReason: this.mapFinishReason(response.choices[0]?.finish_reason)
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sends a prompt to OpenAI and streams the response
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
    let totalCompletionTokens = 0;

    try {
      const stream = await this.client.chat.completions.create({
        model: modelId,
        messages: messages as any,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true
      }) as AsyncGenerator<any>; // Type assertion for the mock implementation

      // Process each chunk from the stream
      for await (const chunk of stream) {
        // In our mock implementation, chunk will have a structure matching our mock
        const content = chunk.choices[0]?.delta?.content || '';
        const finishReason = chunk.choices[0]?.finish_reason;
        
        // Add content to accumulated total
        accumulatedContent += content;
        
        // Estimate token count (rough approximation)
        totalCompletionTokens += content.split(/\s+/).length;
        
        // Create standardized response
        const response: LlmResponse = {
          content,
          modelId,
          provider: 'openai',
          usage: {
            promptTokens: 0, // Not available in streaming
            completionTokens: 1, // Approximate
            totalTokens: 1
          },
          metadata: {
            finishReason: this.mapFinishReason(finishReason)
          }
        };
        
        callback(response);
      }
      
      // Send final response with usage statistics
      callback({
        content: '',
        modelId,
        provider: 'openai',
        usage: {
          promptTokens: messages.join('').length / 4, // Very rough token estimation
          completionTokens: totalCompletionTokens,
          totalTokens: (messages.join('').length / 4) + totalCompletionTokens
        },
        metadata: {
          finishReason: 'stop',
          fullContent: accumulatedContent
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validates an OpenAI API key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new OpenAI({
        apiKey: apiKey
      });
      
      // Try to list models as a simple API key validation
      await testClient.models.list();
      return true;
    } catch (error) {
      // Don't throw, just return false for invalid key
      return false;
    }
  }

  /**
   * Maps OpenAI finish reason to standardized enum
   */
  private mapFinishReason(
    finishReason?: string
  ): 'stop' | 'length' | 'content_filter' | 'error' | undefined {
    if (!finishReason) return undefined;
    
    switch (finishReason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'error';
    }
  }

  /**
   * Handles and transforms OpenAI API errors
   */
  private handleError(error: any): LlmServiceError {
    const errorMessage = error?.message || 'Unknown error occurred';
    const statusCode = error?.status || error?.statusCode;
    
    // Parse OpenAI error details if available
    const details = error?.response?.data?.error?.message || 
                   error?.error?.message ||
                   error?.toString();
    
    let errorCode = LlmErrorCode.UNKNOWN_ERROR;
    
    // Determine error code based on OpenAI error or status code
    if (errorMessage.includes('API key')) {
      errorCode = LlmErrorCode.INVALID_API_KEY;
    } else if (statusCode === 429 || errorMessage.includes('rate limit')) {
      errorCode = LlmErrorCode.RATE_LIMIT_EXCEEDED;
    } else if (statusCode === 404 || errorMessage.includes('model not found')) {
      errorCode = LlmErrorCode.MODEL_NOT_FOUND;
    } else if (statusCode === 400) {
      errorCode = LlmErrorCode.INVALID_REQUEST;
    } else if (statusCode >= 500) {
      errorCode = LlmErrorCode.SERVER_ERROR;
    } else if (errorMessage.includes('timeout')) {
      errorCode = LlmErrorCode.TIMEOUT;
    } else if (errorMessage.includes('network')) {
      errorCode = LlmErrorCode.NETWORK_ERROR;
    }
    
    return new LlmServiceError(
      `OpenAI API error: ${errorMessage}`,
      errorCode,
      details
    );
  }
}