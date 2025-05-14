/**
 * Simple test script for Claude 3.7 Sonnet integration
 * This script bypasses the TypeScript issues by using plain JS
 */
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

async function testClaude37() {
  console.log('Testing Claude 3.7 Sonnet integration');
  
  // For testing, we can use either the environment variable or prompt for a key
  let apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY environment variable is not set.');
    console.log('To run this test, you need to paste an Anthropic API key below or add it to your .env file.');
    console.log('You can get an API key from https://console.anthropic.com/');
    console.log('');
    console.log('Please uncomment and add your API key in the .env file:');
    console.log('ANTHROPIC_API_KEY=your_api_key_here');
    process.exit(1);
  }
  
  try {
    // Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    console.log('Anthropic client initialized');
    
    // Test with Claude 3.7 Sonnet
    const MODEL_ID = 'claude-3-7-sonnet-20250218';
    console.log(`Testing with model: ${MODEL_ID}`);
    
    // Send a simple test message
    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 1024,
      messages: [
        { role: 'user', content: 'Hello! Please confirm you are Claude 3.7 Sonnet and provide the current month and year.' }
      ]
    });
    
    // Extract and log the response
    if (response.content && response.content.length > 0) {
      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock && 'text' in textBlock) {
        console.log('\nResponse from Claude 3.7 Sonnet:');
        console.log('----------------------------');
        console.log(textBlock.text);
        console.log('----------------------------');
      }
    }
    
    // Log token usage
    console.log('\nToken usage:');
    console.log(`Input tokens: ${response.usage.input_tokens}`);
    console.log(`Output tokens: ${response.usage.output_tokens}`);
    console.log(`Total tokens: ${response.usage.input_tokens + response.usage.output_tokens}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing Claude 3.7 Sonnet:');
    console.error(error);
    
    if (error.status) {
      console.error(`HTTP Status: ${error.status}`);
    }
    
    if (error.error) {
      console.error('API Error details:', error.error);
    }
    
    process.exit(1);
  }
}

// Run the test
testClaude37();