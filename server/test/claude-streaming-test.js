/**
 * Test script for Claude 3.7 Sonnet streaming integration
 * 
 * To run this test:
 * 1. Create a .env file with ANTHROPIC_API_KEY
 * 2. Run: node test/claude-streaming-test.js
 */

const axios = require('axios');
const EventSource = require('eventsource');
const dotenv = require('dotenv');
dotenv.config();

// Get API key from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Testing the Anthropic service with streaming
async function testClaudeStreaming() {
  console.log('Testing Claude 3.7 Sonnet streaming integration...\n');
  
  try {
    // 1. Create a new conversation
    console.log('Creating a new conversation...');
    const createConversationResponse = await axios.post('http://localhost:8765/api/v1/conversations', {
      title: 'Claude 3.7 Streaming Test',
    });
    
    const threadId = createConversationResponse.data.id;
    console.log(`Conversation created with ID: ${threadId}`);
    
    // 2. Store the API key
    console.log('\nStoring API key...');
    await axios.post('http://localhost:8765/api/v1/api-keys/anthropic', {
      apiKey: ANTHROPIC_API_KEY,
      label: 'Test Key'
    });
    console.log('API key stored successfully');
    
    // 3. Test streaming with Claude 3.7 Sonnet
    console.log('\nSending a prompt with streaming to Claude 3.7 Sonnet...');
    
    // Create a full message to show what we're sending
    const prompt = 'Write a short poem about artificial intelligence and creativity, one line at a time.';
    console.log(`Prompt: "${prompt}"`);
    
    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(
      `http://localhost:8765/api/v1/chat/completions/stream?threadId=${threadId}&provider=anthropic&modelId=claude-3-7-sonnet-20250218&prompt=${encodeURIComponent(prompt)}`
    );
    
    // Process streamed response
    console.log('\n=== Streaming Response ===');
    let accumulatedResponse = '';
    
    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Display the content chunk
          process.stdout.write(data.content);
          accumulatedResponse += data.content;
          
          // Check if this is the final chunk
          if (data.done) {
            eventSource.close();
            
            // Show final stats
            console.log('\n\n=== Final Statistics ===');
            if (data.usage) {
              console.log(`Input tokens: ${data.usage.promptTokens}`);
              console.log(`Output tokens: ${data.usage.completionTokens}`);
              console.log(`Total tokens: ${data.usage.totalTokens}`);
            }
            
            console.log('\nStreaming test completed successfully! ✅');
            resolve(true);
          }
        } catch (error) {
          console.error('Error parsing event data:', error);
          eventSource.close();
          reject(error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        reject(error);
      };
    });
  } catch (error) {
    console.error('Error during Claude 3.7 Sonnet streaming test:');
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
testClaudeStreaming()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });