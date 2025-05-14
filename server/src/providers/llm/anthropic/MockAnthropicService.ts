/**
 * Mock Anthropic service that doesn't depend on the actual SDK
 * Used for testing when SDK has dependency issues
 */

import {
  ILlmService,
  LlmErrorCode,
  LlmFinishReason,
  LlmMessage,
  LlmModelInfo,
  LlmRequestOptions,
  LlmResponse,
  LlmServiceError,
} from '../ILlmService';

// Define Claude 3.7 Sonnet model information
const CLAUDE_37_SONNET: LlmModelInfo = {
  id: 'claude-3-7-sonnet-20250218',
  name: 'Claude 3.7 Sonnet',
  provider: 'anthropic',
  maxTokens: 4096,
  contextWindow: 200000,
  inputPricePerMillionTokens: 3000, // $3.00 per million tokens
  outputPricePerMillionTokens: 15000, // $15.00 per million tokens
  supportsStreaming: true,
};

// All available Anthropic models
const ANTHROPIC_MODELS: LlmModelInfo[] = [
  CLAUDE_37_SONNET,
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 4096,
    contextWindow: 200000,
    inputPricePerMillionTokens: 15000, // $15.00 per million tokens
    outputPricePerMillionTokens: 75000, // $75.00 per million tokens
    supportsStreaming: true,
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 4096,
    contextWindow: 200000,
    inputPricePerMillionTokens: 3000, // $3.00 per million tokens
    outputPricePerMillionTokens: 15000, // $15.00 per million tokens
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    maxTokens: 4096,
    contextWindow: 200000,
    inputPricePerMillionTokens: 250, // $0.25 per million tokens
    outputPricePerMillionTokens: 1250, // $1.25 per million tokens
    supportsStreaming: true,
  },
];

// Default request options
const DEFAULT_OPTIONS = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 1024,
};

/**
 * Mock implementation of the Anthropic Claude service that doesn't depend on the actual SDK
 * Used for testing when the SDK has dependency issues
 */
export class MockAnthropicService implements ILlmService {
  private readonly apiKey: string;

  /**
   * Create a new AnthropicService instance
   * @param apiKey - Anthropic API key
   * @throws LlmServiceError if API key is invalid
   */
  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new LlmServiceError(
        'Anthropic API key is required', 
        LlmErrorCode.INVALID_API_KEY, 
        'Please provide a valid Anthropic API key'
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * List available models for Anthropic
   * @returns List of available models
   */
  async listModels(): Promise<LlmModelInfo[]> {
    return ANTHROPIC_MODELS;
  }

  /**
   * Get a specific model by ID
   * @param modelId - Model ID to retrieve
   * @returns Model information or null if not found
   */
  async getModel(modelId: string): Promise<LlmModelInfo | null> {
    return ANTHROPIC_MODELS.find(model => model.id === modelId) || null;
  }

  /**
   * Validate an API key with Anthropic
   * For mock implementation, any non-empty key is valid
   * @param apiKey - API key to validate
   * @returns True if the API key is valid
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    return !!apiKey && apiKey.trim() !== '';
  }

  /**
   * Send a prompt to Claude and get a completion
   * @param messages - Array of messages for the conversation
   * @param options - Optional parameters for the request
   * @returns LLM response with completion content
   * @throws LlmServiceError if the request fails
   */
  async sendPrompt(
    messages: LlmMessage[],
    options: LlmRequestOptions = {}
  ): Promise<LlmResponse> {
    try {
      console.log('MOCK: Using mock Anthropic service (no actual API call)');
      
      // Get model information
      const modelId = options.modelId || CLAUDE_37_SONNET.id;
      const model = await this.getModel(modelId);
      
      if (!model) {
        throw new LlmServiceError(
          `Model not found: ${modelId}`,
          LlmErrorCode.INVALID_REQUEST,
          `The specified model '${modelId}' is not supported by Anthropic`
        );
      }
      
      // Simulate response delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock response
      const promptText = messages.find(m => m.role === 'user')?.content || '';
      const responseText = this.generateMockResponse(promptText, modelId);
      
      // Calculate token usage
      const promptTokens = Math.ceil(promptText.length / 4);
      const responseTokens = Math.ceil(responseText.length / 4);
      
      return {
        content: responseText,
        modelId,
        provider: 'anthropic',
        usage: {
          promptTokens,
          completionTokens: responseTokens,
          totalTokens: promptTokens + responseTokens,
        },
        metadata: {
          finishReason: LlmFinishReason.STOP,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Stream a completion from Claude
   * @param messages - Array of messages for the conversation
   * @param callback - Callback function for receiving chunks
   * @param options - Optional parameters for the request
   * @throws LlmServiceError if the request fails
   */
  async streamPrompt(
    messages: LlmMessage[],
    callback: (chunk: LlmResponse) => void,
    options: LlmRequestOptions = {}
  ): Promise<void> {
    try {
      console.log('MOCK: Using mock Anthropic service streaming (no actual API call)');
      
      // Get model information
      const modelId = options.modelId || CLAUDE_37_SONNET.id;
      const model = await this.getModel(modelId);
      
      if (!model) {
        throw new LlmServiceError(
          `Model not found: ${modelId}`,
          LlmErrorCode.INVALID_REQUEST,
          `The specified model '${modelId}' is not supported by Anthropic`
        );
      }
      
      // Generate mock streaming response
      const promptText = messages.find(m => m.role === 'user')?.content || '';
      const responseText = this.generateMockResponse(promptText, modelId);
      
      // Split into chunks and stream with delays
      const chunks = this.splitIntoChunks(responseText, 10);
      let totalTokens = 0;
      const promptTokens = Math.ceil(promptText.length / 4);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isLastChunk = i === chunks.length - 1;
        const chunkTokens = Math.ceil(chunk.length / 4);
        totalTokens += chunkTokens;
        
        // Simulate streaming delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Send chunk to callback
        callback({
          content: chunk,
          modelId,
          provider: 'anthropic',
          usage: {
            promptTokens,
            completionTokens: totalTokens,
            totalTokens: promptTokens + totalTokens,
          },
          metadata: {
            finishReason: isLastChunk ? LlmFinishReason.STOP : undefined,
          },
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle errors from the Anthropic API
   * @param error - Error to handle
   * @throws LlmServiceError with appropriate error code
   */
  private handleError(error: unknown): never {
    if (error instanceof LlmServiceError) {
      throw error;
    }
    
    const err = error as Error;
    const message = err.message || 'Unknown error';
    
    if (message.includes('API key')) {
      throw new LlmServiceError(
        'Invalid Anthropic API key',
        LlmErrorCode.INVALID_API_KEY,
        message
      );
    } else if (message.includes('rate limit')) {
      throw new LlmServiceError(
        'Anthropic rate limit exceeded',
        LlmErrorCode.RATE_LIMIT,
        message
      );
    } else {
      throw new LlmServiceError(
        'Anthropic service error',
        LlmErrorCode.SERVER_ERROR,
        message
      );
    }
  }

  /**
   * Generate a mock response based on the prompt
   * @param prompt - User prompt
   * @param modelId - Model ID
   * @returns Generated mock response
   */
  private generateMockResponse(prompt: string, modelId: string): string {
    // Simple and predictable mock responses
    const modelName = ANTHROPIC_MODELS.find(m => m.id === modelId)?.name || modelId;
    
    // Default response
    let response = `This is a mock response from ${modelName}.\n\n`;
    response += "I'm a mock implementation used for testing when the actual SDK has dependency issues. ";
    response += "This allows you to test the integration without making actual API calls.\n\n";
    
    // Add some prompt-specific content if appropriate
    if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi ')) {
      response += "Hello! I'm simulating a response to your greeting. How can I help you today?";
    } else if (prompt.toLowerCase().includes('count')) {
      response += "1... 2... 3... 4... 5...\n\nI've counted as requested in your prompt.";
    } else if (prompt.toLowerCase().includes('list') || prompt.toLowerCase().includes('example')) {
      response += "Here's a sample list as requested:\n\n";
      response += "1. First item in a mock response\n";
      response += "2. Second item showing formatting\n";
      response += "3. Third item demonstrating list capabilities\n";
    } else {
      response += `You asked: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n`;
      response += "In a real implementation, I would provide a thoughtful response to this prompt.";
    }
    
    return response;
  }

  /**
   * Split text into smaller chunks for streaming
   * @param text - Text to split
   * @param numChunks - Number of chunks to split into
   * @returns Array of text chunks
   */
  private splitIntoChunks(text: string, numChunks: number): string[] {
    const chunkSize = Math.ceil(text.length / numChunks);
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, Math.min(i + chunkSize, text.length)));
    }
    
    return chunks;
  }
}