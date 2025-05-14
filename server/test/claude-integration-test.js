/**
 * Simple test script for Claude 3.7 Sonnet integration
 * 
 * To run this test:
 * 1. Create a .env file with ANTHROPIC_API_KEY
 * 2. Run: node test/claude-integration-test.js
 */

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Get API key from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Testing the Anthropic service directly
async function testClaudeIntegration() {
  console.log('Testing Claude 3.7 Sonnet integration...\n');
  
  try {
    // 1. Create a new conversation
    console.log('Creating a new conversation...');
    const createConversationResponse = await axios.post('http://localhost:8765/api/v1/conversations', {
      title: 'Claude 3.7 Test',
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const threadId = createConversationResponse.data.id;
    console.log(`Conversation created with ID: ${threadId}`);
    
    // 2. Store the API key
    console.log('\nStoring API key...');
    await axios.post('http://localhost:8765/api/v1/api-keys/anthropic', {
      apiKey: ANTHROPIC_API_KEY,
      label: 'Test Key'
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('API key stored successfully');
    
    // 3. Test a simple prompt with Claude 3.7 Sonnet
    console.log('\nSending a simple prompt to Claude 3.7 Sonnet...');
    const promptResponse = await axios.post('http://localhost:8765/api/v1/chat/completions', {
      prompt: 'Explain the advantages of Claude 3.7 Sonnet in 3 concise bullet points.',
      provider: 'anthropic',
      modelId: 'claude-3-7-sonnet-20250218',
      threadId: threadId
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // 4. Display the results
    console.log('\n=== Claude 3.7 Response ===');
    console.log(promptResponse.data.content);
    console.log('\n=== Metadata ===');
    console.log(`Model: ${promptResponse.data.model}`);
    console.log(`Provider: ${promptResponse.data.provider}`);
    
    if (promptResponse.data.usage) {
      console.log(`Input tokens: ${promptResponse.data.usage.promptTokens}`);
      console.log(`Output tokens: ${promptResponse.data.usage.completionTokens}`);
      console.log(`Total tokens: ${promptResponse.data.usage.totalTokens}`);
    }
    
    // 5. Test a more complex prompt
    console.log('\nTesting a more complex prompt with reasoning...');
    const complexPromptResponse = await axios.post('http://localhost:8765/api/v1/chat/completions', {
      prompt: 'Compare and contrast Claude 3.7 Sonnet with Claude 3 Sonnet. What improvements have been made?',
      provider: 'anthropic',
      modelId: 'claude-3-7-sonnet-20250218',
      threadId: threadId,
      options: {
        temperature: 0.7
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('\n=== Claude 3.7 Complex Response ===');
    console.log(complexPromptResponse.data.content);
    
    if (complexPromptResponse.data.usage) {
      console.log(`Input tokens: ${complexPromptResponse.data.usage.promptTokens}`);
      console.log(`Output tokens: ${complexPromptResponse.data.usage.completionTokens}`);
      console.log(`Total tokens: ${complexPromptResponse.data.usage.totalTokens}`);
    }
    
    // Cleanup (optional)
    // Delete the API key if testing in a non-production environment
    /*
    console.log('\nCleaning up...');
    await axios.delete('http://localhost:8765/api/v1/api-keys/anthropic');
    console.log('API key deleted');
    */
    
    console.log('\nTest completed successfully! ✅');
    return true;
  } catch (error) {
    console.error('Error during Claude 3.7 Sonnet integration test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Run the test
testClaudeIntegration()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });