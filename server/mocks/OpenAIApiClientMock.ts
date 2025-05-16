// Mock implementation for OpenAI API client used in tests
export class OpenAIApiClientMock {
  chat = {
    completions: {
      create: jest.fn().mockImplementation(async (options: any) => {
        if (options.model === 'error-model') {
          throw new Error('OpenAI API Error');
        }
        
        return {
          id: 'test-completion-id',
          model: options.model,
          choices: [
            {
              message: {
                content: 'This is a test response from the OpenAI service stub.',
                role: 'assistant'
              },
              index: 0,
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25
          }
        };
      })
    }
  };
  
  models = {
    list: jest.fn().mockImplementation(async () => {
      return {
        data: [
          { id: 'gpt-4', created: Date.now() },
          { id: 'gpt-3.5-turbo', created: Date.now() },
          { id: 'gpt-4-turbo', created: Date.now() }
        ]
      };
    })
  };
}

// Export a mock class
export default OpenAIApiClientMock;