/**
 * Mock Anthropic SDK implementation
 * Used for testing when the actual SDK has dependency issues
 */

// Mock Anthropic client class
class MockAnthropicClient {
  constructor(options) {
    this.apiKey = options.apiKey;
    console.log('Mock Anthropic client initialized');
  }
  
  // Mock messages API
  messages = {
    // Standard message creation
    create: async (params) => {
      console.log('Mock Anthropic message creation', params);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: 'msg_mock_' + Date.now(),
        type: 'message',
        role: 'assistant',
        model: params.model || 'claude-3-7-sonnet-20250218',
        content: [
          {
            type: 'text',
            text: 'This is a mock response from Claude 3.7 Sonnet.\n\nI am a mock implementation used for testing when the actual SDK has dependency issues. This allows you to test the integration code path without needing the full Anthropic SDK installed.\n\nIn a real implementation, this would be a response from the actual Claude model based on your prompt.',
          }
        ],
        usage: {
          input_tokens: 50,
          output_tokens: 75,
          total_tokens: 125
        }
      };
    },
    
    // Streaming implementation
    stream: async (params) => {
      console.log('Mock Anthropic streaming', params);
      
      // Create a mock async generator
      async function* generateChunks() {
        const texts = [
          'This is a mock ',
          'response from ',
          'Claude 3.7 Sonnet ',
          'being sent as a ',
          'stream.\n\n',
          'I am a mock implementation ',
          'used for testing ',
          'when the actual SDK ',
          'has dependency issues. ',
          'This allows you to test ',
          'without needing the full ',
          'Anthropic SDK installed.'
        ];
        
        // Content block start
        yield {
          type: 'message_start',
          message: {
            id: 'msg_mock_' + Date.now(),
            type: 'message',
            role: 'assistant',
            model: params.model || 'claude-3-7-sonnet-20250218',
            content: []
          }
        };
        
        // Content block start
        yield {
          type: 'content_block_start',
          content_block: {
            type: 'text',
            text: ''
          }
        };
        
        // Stream the text chunks with delays
        for (const chunk of texts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          yield {
            type: 'content_block_delta',
            delta: {
              type: 'text_delta',
              text: chunk
            }
          };
        }
        
        // Content block end
        yield {
          type: 'content_block_stop'
        };
        
        // Message end with usage information
        yield {
          type: 'message_stop',
          usage: {
            input_tokens: 50,
            output_tokens: 75,
            total_tokens: 125
          }
        };
      }
      
      return generateChunks();
    }
  };
}

// Export the mock Anthropic class
exports.Anthropic = MockAnthropicClient;