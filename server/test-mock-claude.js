/**
 * Simple test script using the mock Anthropic SDK implementation
 * Run with: node test-mock-claude.js
 */

// Use the mock Anthropic SDK
const { Anthropic } = require('./lib/mockAnthropicSDK');

async function testMockClaude() {
  try {
    console.log('Creating mock Anthropic client...');
    const client = new Anthropic({
      apiKey: 'mock-api-key'
    });
    
    console.log('\nTesting standard completion...');
    const message = await client.messages.create({
      model: 'claude-3-7-sonnet-20250218',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: 'Hello! Can you confirm you are Claude 3.7 Sonnet?' }
      ]
    });
    
    console.log('Response from mock Claude 3.7 Sonnet:');
    console.log('----------------------------');
    console.log(message.content[0].text);
    console.log('----------------------------');
    console.log('Message ID:', message.id);
    console.log('Model:', message.model);
    console.log('Usage:', message.usage);
    
    console.log('\nTesting streaming...');
    console.log('Streaming response:');
    console.log('----------------------------');
    
    const stream = await client.messages.stream({
      model: 'claude-3-7-sonnet-20250218',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: 'Please count from 1 to 5 very slowly, with a pause between each number.' }
      ]
    });
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        process.stdout.write(chunk.delta.text);
      }
    }
    
    console.log('\n----------------------------');
    console.log('Mock Claude 3.7 Sonnet test completed successfully!');
  } catch (error) {
    console.error('Error in mock Claude test:', error);
  }
}

testMockClaude();