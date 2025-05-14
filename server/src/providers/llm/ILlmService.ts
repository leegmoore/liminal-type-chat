/**
 * Supported LLM providers
 */
export type LlmProvider = 'openai' | 'anthropic';

/**
 * Information about an LLM model
 */
export interface LlmModelInfo {
  id: string;
  provider: string;
  name: string;
  maxTokens: number;
  supportsStreaming: boolean;
  contextWindow?: number;
  trainedUntil?: string;
  pricingPerInputToken?: number;
  pricingPerOutputToken?: number;
}

/**
 * Options for LLM requests
 */
export interface LlmRequestOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  timeout?: number;
}

/**
 * Response from an LLM
 */
export interface LlmResponse {
  content: string;
  modelId: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
    [key: string]: any;
  };
}

/**
 * Error codes for LLM service errors
 */
export enum LlmErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Custom error class for LLM service errors
 */
export class LlmServiceError extends Error {
  constructor(
    message: string,
    public code: LlmErrorCode,
    public details?: string
  ) {
    super(message);
    this.name = 'LlmServiceError';
  }
}

/**
 * Interface for LLM service providers
 */
export interface ILlmService {
  /**
   * Lists available models from the provider
   */
  listModels(): Promise<LlmModelInfo[]>;

  /**
   * Sends a prompt to the LLM and returns the response
   * @param messages Array of messages in the conversation
   * @param options Optional configuration for the request
   */
  sendPrompt(
    messages: Array<{ role: string; content: string }>,
    options?: LlmRequestOptions
  ): Promise<LlmResponse>;

  /**
   * Sends a prompt to the LLM and streams the response
   * @param messages Array of messages in the conversation
   * @param callback Function called with each chunk of the response
   * @param options Optional configuration for the request
   */
  streamPrompt(
    messages: Array<{ role: string; content: string }>,
    callback: (chunk: LlmResponse) => void,
    options?: LlmRequestOptions
  ): Promise<void>;

  /**
   * Validates an API key with the provider
   * @param apiKey The API key to validate
   */
  validateApiKey(apiKey: string): Promise<boolean>;
}